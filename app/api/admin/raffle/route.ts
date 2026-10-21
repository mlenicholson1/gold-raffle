import { NextResponse } from "next/server";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { drawWinnerForSlot, type DrawPool } from "@/lib/raffle";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const slotKey = typeof body?.slotKey === "string" ? body.slotKey : undefined;
  if (!slotKey) {
    return NextResponse.json({ error: "A draw slot is required." }, { status: 400 });
  }

  const drawLabel =
    typeof body?.drawLabel === "string" && body.drawLabel.trim()
      ? body.drawLabel.trim()
      : "Las Vegas Gold Call Draw";

  const pool: DrawPool = body?.pool === "window" ? "window" : "cumulative";

  const result = await drawWinnerForSlot(slotKey, drawLabel, pool);

  if (!result.ok) {
    return NextResponse.json(
      { error: "No eligible visitors in this draw slot." },
      { status: 400 }
    );
  }

  return NextResponse.json({ draw: result.draw, winner: result.winner });
}
