import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

// Read-only lookup: case-insensitive substring match against name, surname,
// or email - catches things like "Test", "Testy McTest", "miranda@...",
// "Finn Smith", etc. Does not delete anything.
const MATCH_TERMS = ["test", "miranda", "finn"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const visitors = await prisma.visitor.findMany({ include: { tokens: true } });
  const matches = visitors.filter((v) => {
    const haystack = `${v.name} ${v.surname} ${v.email}`.toLowerCase();
    return MATCH_TERMS.some((term) => haystack.includes(term));
  });

  return NextResponse.json({
    matches: matches.map((v) => ({
      id: v.id,
      name: v.name,
      surname: v.surname,
      email: v.email,
      personalCode: v.personalCode,
      tokenCount: v.tokens.length,
      createdAt: v.createdAt,
    })),
  });
}
