import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIONS } from "@/lib/visitor";
import { isValidAdminPassword } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const visitors = await prisma.visitor.findMany({ include: { tokens: true } });

  const totalVisitors = visitors.length;
  const perStation = Object.fromEntries(
    STATIONS.map((station) => [
      station,
      visitors.filter((v) => v.tokens.some((t) => t.station === station)).length,
    ])
  );
  const fullyCollected = visitors.filter((v) => v.tokens.length >= STATIONS.length).length;

  return NextResponse.json({ totalVisitors, perStation, fullyCollected });
}
