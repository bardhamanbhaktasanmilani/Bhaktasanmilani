import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.galleryItem.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}
