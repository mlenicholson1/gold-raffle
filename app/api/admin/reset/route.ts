import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const [tokens, raffleDraws, visitors] = await prisma.$transaction([
    prisma.token.deleteMany(),
    prisma.raffleDraw.deleteMany(),
    prisma.visitor.deleteMany(),
  ]);

  return NextResponse.json({
    deleted: {
      tokens: tokens.count,
      raffleDraws: raffleDraws.count,
      visitors: visitors.count,
    },
  });
}
