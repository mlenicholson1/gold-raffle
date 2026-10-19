import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

// Deletes exactly one visitor (and their chips / any raffle win), chosen
// explicitly by staff in the admin dashboard - never a bulk/filtered sweep.
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const visitorId = typeof body?.visitorId === "string" ? body.visitorId : undefined;
  if (!visitorId) {
    return NextResponse.json({ error: "A visitorId is required." }, { status: 400 });
  }

  const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
  if (!visitor) {
    return NextResponse.json({ error: "Visitor not found." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.token.deleteMany({ where: { visitorId } }),
    prisma.raffleDraw.deleteMany({ where: { winningVisitorId: visitorId } }),
    prisma.visitor.delete({ where: { id: visitorId } }),
  ]);

  return NextResponse.json({ ok: true });
}
