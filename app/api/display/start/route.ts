import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

// Kicks off (or restarts, for a redraw) the lounge screen's countdown for a
// given draw slot. The actual winner is picked lazily by /api/display/state
// once the countdown reaches zero, so this endpoint just records intent.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const slotKey = typeof body?.slotKey === "string" ? body.slotKey : undefined;
  const slotLabel = typeof body?.slotLabel === "string" ? body.slotLabel : undefined;
  if (!slotKey || !slotLabel) {
    return NextResponse.json({ error: "A draw slot is required." }, { status: 400 });
  }

  const drawLabel =
    typeof body?.drawLabel === "string" && body.drawLabel.trim()
      ? body.drawLabel.trim()
      : "Vegas Gold Call Draw";

  const durationSeconds =
    typeof body?.durationSeconds === "number" && body.durationSeconds > 0
      ? Math.min(body.durationSeconds, 3600)
      : 300;

  const countdownEndsAt = new Date(Date.now() + durationSeconds * 1000);

  await prisma.displayState.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      mode: "countdown",
      slotKey,
      slotLabel,
      drawLabel,
      countdownEndsAt,
      winningVisitorId: null,
      winnerName: null,
      winnerSurname: null,
      emptyReason: null,
    },
    update: {
      mode: "countdown",
      slotKey,
      slotLabel,
      drawLabel,
      countdownEndsAt,
      winningVisitorId: null,
      winnerName: null,
      winnerSurname: null,
      emptyReason: null,
    },
  });

  return NextResponse.json({ ok: true, countdownEndsAt });
}
