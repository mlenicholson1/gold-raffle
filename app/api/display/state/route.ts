import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { drawWinnerForSlot } from "@/lib/raffle";

// How long the winner's name (or the "no eligible entries" message) stays on
// screen before the display falls back to the idle Vegas Gold Call facts screen.
const AUTO_IDLE_MS = 30 * 1000;

const IDLE_RESET_DATA = {
  mode: "idle",
  slotKey: null,
  slotLabel: null,
  drawLabel: null,
  ordinal: null,
  countdownEndsAt: null,
  winningVisitorId: null,
  winnerName: null,
  winnerSurname: null,
  emptyReason: null,
};

// Public, read-only: polled every second or two by the lounge display screen.
// No visitor data beyond the eventual winner's first name/surname is exposed.
export async function GET() {
  let state = await prisma.displayState.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", mode: "idle" },
    update: {},
  });

  if (state.mode === "countdown" && state.countdownEndsAt && state.countdownEndsAt <= new Date()) {
    // Claim the transition atomically so that if two requests race (e.g. two
    // display tabs open), only one of them actually runs the draw.
    const claim = await prisma.displayState.updateMany({
      where: { id: "singleton", mode: "countdown", countdownEndsAt: state.countdownEndsAt },
      data: { mode: "drawing" },
    });

    if (claim.count === 1) {
      // If the draw itself throws, still move the screen out of "drawing" so
      // it never gets stuck mid-transition in front of a live crowd.
      try {
        const result = state.slotKey
          ? await drawWinnerForSlot(state.slotKey, state.drawLabel ?? "Vegas Gold Call Draw")
          : { ok: false as const, reason: "no_eligible_visitors" as const };

        state = await prisma.displayState.update({
          where: { id: "singleton" },
          data: result.ok
            ? {
                mode: "reveal",
                winningVisitorId: result.winner.id,
                winnerName: result.winner.name,
                winnerSurname: result.winner.surname,
                emptyReason: null,
              }
            : {
                mode: "empty",
                emptyReason: "No one in this draw window has collected a chip yet",
              },
        });
      } catch {
        state = await prisma.displayState.update({
          where: { id: "singleton" },
          data: { mode: "empty", emptyReason: "Something went wrong running the draw" },
        });
      }
    } else {
      // Another request is mid-draw; re-read shortly after instead of racing it.
      state = await prisma.displayState.findUniqueOrThrow({ where: { id: "singleton" } });
    }
  }

  if (
    (state.mode === "reveal" || state.mode === "empty") &&
    Date.now() - state.updatedAt.getTime() >= AUTO_IDLE_MS
  ) {
    // Same optimistic-concurrency guard as the countdown transition above, so
    // two overlapping polls don't both try to reset the row.
    await prisma.displayState.updateMany({
      where: { id: "singleton", mode: state.mode, updatedAt: state.updatedAt },
      data: IDLE_RESET_DATA,
    });
    state = await prisma.displayState.findUniqueOrThrow({ where: { id: "singleton" } });
  }

  const secondsRemaining =
    state.mode === "countdown" && state.countdownEndsAt
      ? Math.max(0, Math.ceil((state.countdownEndsAt.getTime() - Date.now()) / 1000))
      : null;

  return NextResponse.json({
    mode: state.mode,
    slotLabel: state.slotLabel,
    drawLabel: state.drawLabel,
    ordinal: state.ordinal,
    secondsRemaining,
    winner:
      state.mode === "reveal" ? { name: state.winnerName, surname: state.winnerSurname } : null,
    emptyReason: state.emptyReason,
    updatedAt: state.updatedAt,
  });
}
