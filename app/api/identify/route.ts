import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildProgress, normalizeEmail } from "@/lib/visitor";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const visitorId = typeof body?.visitorId === "string" ? body.visitorId : undefined;
  const code = typeof body?.code === "string" ? body.code.trim() : undefined;
  const identifier =
    typeof body?.identifier === "string" ? body.identifier.trim() : undefined;

  let visitor = null;

  if (visitorId) {
    visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
      include: { tokens: true },
    });
    // Stored code must still match - guards against a stale/tampered localStorage value.
    if (visitor && code && visitor.personalCode !== code) {
      visitor = null;
    }
  } else if (identifier) {
    if (/^\d{4}$/.test(identifier)) {
      visitor = await prisma.visitor.findUnique({
        where: { personalCode: identifier },
        include: { tokens: true },
      });
    } else {
      visitor = await prisma.visitor.findUnique({
        where: { email: normalizeEmail(identifier) },
        include: { tokens: true },
      });
    }
  } else {
    return NextResponse.json(
      { error: "Provide a visitor id or an identifier." },
      { status: 400 }
    );
  }

  if (!visitor) {
    return NextResponse.json(
      { error: "We couldn't find that visitor. Double-check your email or code." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    visitor: {
      id: visitor.id,
      name: visitor.name,
      surname: visitor.surname,
      personalCode: visitor.personalCode,
      createdAt: visitor.createdAt,
    },
    progress: buildProgress(visitor.tokens.map((t) => t.station)),
  });
}
