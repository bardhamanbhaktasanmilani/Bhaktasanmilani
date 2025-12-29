// app/api/donations/create-order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rateLimit";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    /* ----------------------------------
       ABUSE PREVENTION — IP RATE LIMIT
    -----------------------------------*/
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rateKey = `donation:create:${ip}`;
    const { allowed } = rateLimit(rateKey, 5, 60_000); // 5 req / min / IP

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many donation attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      amount: number;
      donorName: string;
      donorEmail: string;
      donorPhone: string;
    };

    const { amount, donorName, donorEmail, donorPhone } = body;

    if (
      typeof amount !== "number" ||
      amount < 10 ||
      amount > 1_000_000
    ) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!donorName || !donorEmail || !donorPhone) {
      return NextResponse.json(
        { error: "Missing donor details" },
        { status: 400 }
      );
    }

  
    const recentFailures = await prisma.donation.count({
      where: {
        donorEmail,
        status: "FAILED",
        createdAt: {
          gt: new Date(Date.now() - 10 * 60 * 1000), // last 10 min
        },
      },
    });

    if (recentFailures >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again later." },
        { status: 429 }
      );
    }

    /* ----------------------------------
       CANONICAL AMOUNT HANDLING
    -----------------------------------*/
    const amountRupees = Math.round(amount);
    const amountPaise = amountRupees * 100;

  
    const receipt = `dn_${crypto.randomBytes(12).toString("hex")}`;
    // Example length: 3 + 24 = 27 chars ✅

    /* ----------------------------------
       CREATE RAZORPAY ORDER
    -----------------------------------*/
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        donorName,
        donorEmail,
        donorPhone,
        source: "bhakta-sanmilan",
      },
    });

    /* ----------------------------------
       IDEMPOTENT DB WRITE
    -----------------------------------*/
    await prisma.donation.upsert({
      where: { orderId: order.id },
      update: {},
      create: {
        orderId: order.id,
        amount: amountRupees,
        currency: "INR",
        donorName,
        donorEmail,
        donorPhone,
        status: "PENDING",
      },
    });

  
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Create-order error:", error?.message ?? error);

    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}
