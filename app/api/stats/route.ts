import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export const dynamic = "force-dynamic";


export const revalidate = 0;

export async function GET() {
  try {
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
        live: true,
      },
      {
        headers: {
          //  CDN-level caching
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Stats API error:", error);

    //  NEVER crash homepage stats
    return NextResponse.json(
      {
        devotees: 0,
        funds: 0,
        live: false,
        degraded: true,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
