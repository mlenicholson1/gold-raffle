import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

// Clears the lounge screen back to its idle state (e.g. after a draw has
// been shown for a while, or to cancel a countdown that was started by mistake).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await prisma.displayState.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", mode: "idle" },
    update: {
      mode: "idle",
      slotKey: null,
      slotLabel: null,
      drawLabel: null,
      countdownEndsAt: null,
      winningVisitorId: null,
      winnerName: null,
      winnerSurname: null,
      emptyReason: null,
    },
  });

  return NextResponse.json({ ok: true });
}
