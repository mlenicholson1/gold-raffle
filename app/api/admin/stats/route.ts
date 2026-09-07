import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIONS } from "@/lib/visitor";
import { isValidAdminPassword } from "@/lib/adminAuth";
import { getDrawSlot } from "@/lib/vegasFixSchedule";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const visitors = await prisma.visitor.findMany({ include: { tokens: true } });

  const slotGroups = new Map<
    string,
    { label: string; date: string; visitors: typeof visitors }
  >();

  for (const visitor of visitors) {
    const slot = getDrawSlot(visitor.createdAt);
    const existing = slotGroups.get(slot.key);
    if (existing) {
      existing.visitors.push(visitor);
    } else {
      slotGroups.set(slot.key, { label: slot.label, date: slot.date.toISOString(), visitors: [visitor] });
    }
  }

  const slots = Array.from(slotGroups.entries())
    .map(([key, group]) => {
      const totalVisitors = group.visitors.length;
      const perStation = Object.fromEntries(
        STATIONS.map((station) => [
          station,
          group.visitors.filter((v) => v.tokens.some((t) => t.station === station)).length,
        ])
      );
      const fullyCollected = group.visitors.filter((v) => v.tokens.length >= STATIONS.length).length;

      return {
        key,
        label: group.label,
        date: group.date,
        totalVisitors,
        perStation,
        fullyCollected,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ slots });
}
