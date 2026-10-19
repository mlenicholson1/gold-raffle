import { prisma } from "@/lib/prisma";
import { DRAW_SLOTS, getDrawSlot } from "@/lib/vegasFixSchedule";

// Excluded from the draw itself ("void where prohibited or restricted by
// law" per the Terms) - these visitors still register and collect chips
// like anyone else, they're just never selected as a winner.
const EXCLUDED_DRAW_STATES = new Set(["Florida", "New York"]);

export type DrawResult =
  | {
      ok: true;
      draw: { id: string; drawLabel: string; drawnAt: Date };
      winner: { id: string; name: string; surname: string; email: string; tokenCount: number };
    }
  | { ok: false; reason: "no_eligible_visitors" };

// Weighted random draw (weight = token count) restricted to visitors who
// entered at or before this draw slot (i.e. everyone still "in the running"
// by this point in the schedule, not just whoever entered immediately before
// this specific slot) and who haven't already won a prior draw - one Prize
// per person. Shared by the instant admin "Run Raffle" button and the lounge
// display's countdown-triggered reveal.
export async function drawWinnerForSlot(slotKey: string, drawLabel: string): Promise<DrawResult> {
  const targetSlot = DRAW_SLOTS.find((s) => s.date.toISOString() === slotKey);
  if (!targetSlot) {
    return { ok: false, reason: "no_eligible_visitors" };
  }

  const visitors = await prisma.visitor.findMany({ include: { tokens: true, raffleWins: true } });
  const eligible = visitors.filter(
    (v) =>
      getDrawSlot(v.createdAt).date.getTime() <= targetSlot.date.getTime() &&
      !EXCLUDED_DRAW_STATES.has(v.state) &&
      v.raffleWins.length === 0
  );

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
