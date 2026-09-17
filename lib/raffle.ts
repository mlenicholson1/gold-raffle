import { prisma } from "@/lib/prisma";
import { getDrawSlot } from "@/lib/vegasFixSchedule";

export type DrawResult =
  | {
      ok: true;
      draw: { id: string; drawLabel: string; drawnAt: Date };
      winner: { id: string; name: string; surname: string; email: string; tokenCount: number };
    }
  | { ok: false; reason: "no_eligible_visitors" };

// Weighted random draw (weight = token count) restricted to visitors whose first
// chip fell in the given draw slot. Shared by the instant admin "Run Raffle"
// button and the lounge display's countdown-triggered reveal.
export async function drawWinnerForSlot(slotKey: string, drawLabel: string): Promise<DrawResult> {
  const visitors = await prisma.visitor.findMany({ include: { tokens: true } });
  const eligible = visitors.filter((v) => getDrawSlot(v.createdAt).key === slotKey);

  const weighted = eligible
    .map((v) => ({ visitor: v, weight: v.tokens.length }))
    .filter((w) => w.weight > 0);

  if (weighted.length === 0) {
    return { ok: false, reason: "no_eligible_visitors" };
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

  return {
    ok: true,
    draw: { id: draw.id, drawLabel: draw.drawLabel, drawnAt: draw.drawnAt },
    winner: {
      id: winner.id,
      name: winner.name,
      surname: winner.surname,
      email: winner.email,
      tokenCount: winner.tokens.length,
    },
  };
}
