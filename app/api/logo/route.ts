import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: serves the staff-uploaded logo image, if one has been set.
// 404s when none has been uploaded, so callers can fall back to a built-in logo.
export async function GET() {
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  const dataUrl = settings?.logoDataUrl;
  if (!dataUrl) {
    return new NextResponse(null, { status: 404 });
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "no-store",
    },
  });
}
