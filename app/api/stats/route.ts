import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ⛔ prevent build-time execution
export const dynamic = "force-dynamic";

// ⛔ do NOT use ISR for Prisma APIs
export const revalidate = 0;

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
      live: true,
    },
    {
      headers: {
        // ✅ CDN-level caching (Vercel / Netlify / Cloudflare)
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
