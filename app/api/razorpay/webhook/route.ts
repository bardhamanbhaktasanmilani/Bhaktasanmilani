// app/api/razorpay/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    /* ----------------------------------
       READ RAW BODY (MANDATORY)
    -----------------------------------*/
    const rawBody = await request.text();

    const signature = request.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.error("🚨 Webhook missing signature", { ip });
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    /* ----------------------------------
       VERIFY SIGNATURE
    -----------------------------------*/
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("🚨 Invalid webhook signature", {
        ip,
        receivedSignature: signature,
      });

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    /* ----------------------------------
       PARSE EVENT
    -----------------------------------*/
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      console.error("🚨 Webhook JSON parse failed", { ip });
      return NextResponse.json({ received: true });
    }

    const eventType = event?.event;
    const payment = event?.payload?.payment?.entity;
    const refund = event?.payload?.refund?.entity;

    /* ----------------------------------
       PAYMENT EVENTS
    -----------------------------------*/
    if (eventType === "payment.captured" || eventType === "payment.failed") {
      if (!payment?.order_id || !payment?.id) {
        console.warn("⚠️ Webhook payment payload incomplete", {
          eventType,
        });
        return NextResponse.json({ received: true });
      }

      const orderId = payment.order_id as string;
      const paymentId = payment.id as string;

      const donation = await prisma.donation.findUnique({
        where: { orderId },
      });

      if (!donation) {
        console.warn("⚠️ Webhook for unknown order", {
          orderId,
          paymentId,
        });
        return NextResponse.json({ received: true });
      }

      // 🔒 Replay / duplicate detection
      if (donation.paymentId === paymentId) {
        console.info("ℹ️ Duplicate webhook ignored", {
          orderId,
          paymentId,
        });
        return NextResponse.json({ received: true });
      }

      // 🔒 Final state protection
      if (donation.status === "SUCCESS" || donation.status === "REFUNDED") {
        console.info("ℹ️ Webhook ignored — terminal state", {
          orderId,
          status: donation.status,
        });
        return NextResponse.json({ received: true });
      }

      if (eventType === "payment.captured") {
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: "SUCCESS",
            paymentId,
          },
        });

        console.info("✅ Payment captured via webhook", {
          orderId,
          paymentId,
        });
      }

      if (eventType === "payment.failed") {
        if (donation.status === "PENDING") {
          await prisma.donation.update({
            where: { id: donation.id },
            data: {
              status: "FAILED",
              paymentId,
            },
          });

          console.warn("⚠️ Payment failed via webhook", {
            orderId,
            paymentId,
          });
        }
      }
    }

    /* ----------------------------------
       REFUND EVENTS
    -----------------------------------*/
    if (eventType === "refund.processed") {
      if (!refund?.payment_id) {
        console.warn("⚠️ Refund payload missing payment_id");
        return NextResponse.json({ received: true });
      }

      const paymentId = refund.payment_id as string;

      const donation = await prisma.donation.findUnique({
        where: { paymentId },
      });

      if (!donation) {
        console.warn("⚠️ Refund for unknown payment", { paymentId });
        return NextResponse.json({ received: true });
      }

      if (donation.status === "SUCCESS") {
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: "REFUNDED",
          },
        });

        console.info("💸 Refund processed", {
          orderId: donation.orderId,
          paymentId,
        });
      } else {
        console.info("ℹ️ Refund ignored — invalid state", {
          paymentId,
          status: donation.status,
        });
      }
    }

    /* ----------------------------------
       ACKNOWLEDGE RAZORPAY
    -----------------------------------*/
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🚨 Razorpay webhook error", { ip, error });

    // Razorpay retries on non-200 — so return 500 only on real crash
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
