import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

// Read-only history of every raffle draw run so far (including redraws), most
// recent first - so staff can see exactly who won each one, and when.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const draws = await prisma.raffleDraw.findMany({
    include: { winner: true },
    orderBy: { drawnAt: "desc" },
  });

  return NextResponse.json({
    draws: draws.map((d) => ({
      id: d.id,
      drawLabel: d.drawLabel,
      drawnAt: d.drawnAt,
      winner: {
        name: d.winner.name,
        surname: d.winner.surname,
        email: d.winner.email,
        personalCode: d.winner.personalCode,
      },
    })),
  });
}
