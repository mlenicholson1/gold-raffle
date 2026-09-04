import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const drawLabel =
    typeof body?.drawLabel === "string" && body.drawLabel.trim()
      ? body.drawLabel.trim()
      : "Vegas Gold Call Draw";

  const visitors = await prisma.visitor.findMany({ include: { tokens: true } });
  const weighted = visitors
    .map((v) => ({ visitor: v, weight: v.tokens.length }))
    .filter((w) => w.weight > 0);

  if (weighted.length === 0) {
    return NextResponse.json({ error: "No eligible visitors to draw from." }, { status: 400 });
  }

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * totalWeight;
  let winner = weighted[weighted.length - 1].visitor;
  for (const w of weighted) {
    if (r < w.weight) {
      winner = w.visitor;
      break;
    }
    r -= w.weight;
  }

  const draw = await prisma.raffleDraw.create({
    data: {
      winningVisitorId: winner.id,
      drawLabel,
    },
  });

  return NextResponse.json({
    draw: {
      id: draw.id,
      drawLabel: draw.drawLabel,
      drawnAt: draw.drawnAt,
    },
    winner: {
      id: winner.id,
      name: winner.name,
      surname: winner.surname,
      email: winner.email,
      tokenCount: winner.tokens.length,
    },
  });
}
