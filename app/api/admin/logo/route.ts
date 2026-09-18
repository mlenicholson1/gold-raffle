import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidAdminPassword } from "@/lib/adminAuth";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  if (!isValidAdminPassword(formData.get("password"))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 2MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", logoDataUrl: dataUrl },
    update: { logoDataUrl: dataUrl },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidAdminPassword(body?.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", logoDataUrl: null },
    update: { logoDataUrl: null },
  });

  return NextResponse.json({ ok: true });
}
