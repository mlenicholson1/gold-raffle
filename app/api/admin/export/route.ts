import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIONS } from "@/lib/visitor";
import { isValidAdminPassword } from "@/lib/adminAuth";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const visitors = await prisma.visitor.findMany({
    include: { tokens: true },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "Name",
    "Surname",
    "Email",
    "Personal Code",
    "Registered At",
    ...STATIONS,
    "Total Tokens",
  ];

  const rows = visitors.map((v) => {
    const collected = new Set(v.tokens.map((t) => t.station));
    return [
      v.name,
      v.surname,
      v.email,
      v.personalCode,
      v.createdAt.toISOString(),
      ...STATIONS.map((s) => (collected.has(s) ? "Yes" : "No")),
      String(v.tokens.length),
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="hold-gold-visitors-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
