// app/api/razorpay/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1️⃣ Read raw body (MANDATORY)
    const rawBody = await request.text();

    const signature = request.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    // 2️⃣ Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("❌ Invalid Razorpay webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // 3️⃣ Parse event
    const event = JSON.parse(rawBody);
    const eventType = event.event as string;

    // -------------------------------
    // PAYMENT CAPTURED (SUCCESS)
    // -------------------------------
    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;

      const orderId = payment.order_id as string;
      const paymentId = payment.id as string;

      // 🔐 Idempotency check (VERY IMPORTANT)
      const existing = await prisma.donation.findUnique({
        where: { paymentId },
      });

      if (!existing) {
        await prisma.donation.create({
          data: {
            orderId,
            paymentId,
            amount: payment.amount / 100, // paise → INR
            currency: payment.currency,
            status: "SUCCESS",
            donorEmail: payment.email ?? null,
            donorPhone: payment.contact ?? null,
            paymentMethod: payment.method ?? null,
          },
        });
      }
    }

    // -------------------------------
    // PAYMENT FAILED
    // -------------------------------
    if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;

      const orderId = payment.order_id as string;
      const paymentId = payment.id as string;

      // Idempotent update or create
      await prisma.donation.upsert({
        where: { paymentId },
        update: {
          status: "FAILED",
        },
        create: {
          orderId,
          paymentId,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: "FAILED",
          donorEmail: payment.email ?? null,
          donorPhone: payment.contact ?? null,
          paymentMethod: payment.method ?? null,
        },
      });
    }

    // 4️⃣ Always acknowledge Razorpay
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🚨 Razorpay webhook error:", error);

    // Razorpay will retry on non-200
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
