import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // 5 minutes

export async function GET() {
  const result = await prisma.donation.aggregate({
    where: { status: "SUCCESS" },
    _sum: { amount: true },
    _count: { id: true },
  });

  const devotees = result._count.id ?? 0;
  const funds = result._sum.amount ?? 0;

  return NextResponse.json(
    {
      devotees,
      funds,
      live: true, // 👈 used by frontend badge
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
