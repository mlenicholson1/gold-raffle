import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { buildProgress, STATIONS } from "@/lib/visitor";

const CLAIMABLE_STATIONS = STATIONS.filter((s) => s !== "register");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const visitorId = typeof body?.visitorId === "string" ? body.visitorId : undefined;
  const station = typeof body?.station === "string" ? body.station : undefined;

  if (!visitorId || !station || !CLAIMABLE_STATIONS.includes(station as never)) {
    return NextResponse.json({ error: "Invalid claim request." }, { status: 400 });
  }

  const visitor = await prisma.visitor.findUnique({
    where: { id: visitorId },
    include: { tokens: true },
  });

  if (!visitor) {
    return NextResponse.json({ error: "Visitor not found." }, { status: 404 });
  }

  if (visitor.tokens.some((t) => t.station === station)) {
    return NextResponse.json({
      alreadyCollected: true,
      progress: buildProgress(visitor.tokens.map((t) => t.station)),
    });
  }

  try {
    await prisma.token.create({
      data: { visitorId, station: station as (typeof STATIONS)[number] },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Race: token already granted by a concurrent request.
      const refreshed = await prisma.visitor.findUnique({
        where: { id: visitorId },
        include: { tokens: true },
      });
      return NextResponse.json({
        alreadyCollected: true,
        progress: buildProgress(refreshed!.tokens.map((t) => t.station)),
      });
    }
    throw err;
  }

  const updated = await prisma.visitor.findUnique({
    where: { id: visitorId },
    include: { tokens: true },
  });

  return NextResponse.json({
    alreadyCollected: false,
    progress: buildProgress(updated!.tokens.map((t) => t.station)),
  });
}
