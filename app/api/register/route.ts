import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { buildProgress, generateCode, isValidEmail, normalizeEmail } from "@/lib/visitor";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const surname = typeof body?.surname === "string" ? body.surname.trim() : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!surname) {
    return NextResponse.json({ error: "Please enter your surname." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const existing = await prisma.visitor.findUnique({
    where: { email },
    include: { tokens: true },
  });

  if (existing) {
    return NextResponse.json({
      visitor: {
        id: existing.id,
        name: existing.name,
        surname: existing.surname,
        personalCode: existing.personalCode,
        createdAt: existing.createdAt,
      },
      progress: buildProgress(existing.tokens.map((t) => t.station)),
      alreadyRegistered: true,
    });
  }

  // 4-digit codes have only 10,000 possible values, so check for a free one
  // before inserting rather than relying on the unique constraint to retry.
  let personalCode = generateCode();
  for (let attempt = 0; attempt < 10; attempt++) {
    const clash = await prisma.visitor.findUnique({ where: { personalCode } });
    if (!clash) break;
    personalCode = generateCode();
  }

  try {
    const visitor = await prisma.$transaction(async (tx) => {
      const created = await tx.visitor.create({
        data: { name, surname, email, personalCode },
      });
      await tx.token.create({
        data: { visitorId: created.id, station: "register" },
      });
      return created;
    });

    return NextResponse.json(
      {
        visitor: {
          id: visitor.id,
          name: visitor.name,
          surname: visitor.surname,
          personalCode: visitor.personalCode,
          createdAt: visitor.createdAt,
        },
        progress: buildProgress(["register"]),
        alreadyRegistered: false,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Race: someone else registered the same email between our check and insert.
      const raceExisting = await prisma.visitor.findUnique({
        where: { email },
        include: { tokens: true },
      });
      if (raceExisting) {
        return NextResponse.json({
          visitor: {
            id: raceExisting.id,
            name: raceExisting.name,
            surname: raceExisting.surname,
            personalCode: raceExisting.personalCode,
            createdAt: raceExisting.createdAt,
          },
          progress: buildProgress(raceExisting.tokens.map((t) => t.station)),
          alreadyRegistered: true,
        });
      }
    }
    throw err;
  }
}
