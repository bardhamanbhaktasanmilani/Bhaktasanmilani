// app/api/donations/verify/route.ts
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
    const body = (await request.json()) as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      donorName?: string;
      donorEmail?: string;
      donorPhone?: string;
      amount?: number;
    };

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn("🚨 Invalid verify payload", { ip, body });
      return NextResponse.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.findUnique({
      where: { orderId: razorpay_order_id },
    });

    if (!donation) {
      console.warn("🚨 Verify called for unknown order", {
        ip,
        orderId: razorpay_order_id,
      });

      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // 🔒 If webhook already finalized payment, do not override it
    if (donation.status === "SUCCESS" || donation.status === "REFUNDED") {
      console.info("ℹ️ Verify ignored — already finalized", {
        orderId: donation.orderId,
        status: donation.status,
      });

      const receiptNo = `SRTK${String(donation.id).padStart(6, "0")}`;

      return NextResponse.json({
        success: true,
        payment: {
          paymentId: donation.paymentId,
          orderId: donation.orderId,
          amount: donation.amount,
          receiptNo,
          createdAt: donation.createdAt,
        },
        donor: {
          name: donation.donorName,
          email: donation.donorEmail,
          phone: donation.donorPhone,
        },
      });
    }

    // 🔐 Verify Razorpay signature
    const shasum = crypto.createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET as string
    );

    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      console.error("🚨 Razorpay signature mismatch", {
        ip,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });

      // ❌ Only mark FAILED if still pending
      if (donation.status === "PENDING") {
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: "FAILED",
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
          },
        });
      }

      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 400 }
      );
    }

    // 🔒 Idempotency: payment already processed
    if (donation.paymentId === razorpay_payment_id) {
      console.info("ℹ️ Duplicate verify ignored", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });

      const receiptNo = `SRTK${String(donation.id).padStart(6, "0")}`;

      return NextResponse.json({
        success: true,
        payment: {
          paymentId: donation.paymentId,
          orderId: donation.orderId,
          amount: donation.amount,
          receiptNo,
          createdAt: donation.createdAt,
        },
        donor: {
          name: donation.donorName,
          email: donation.donorEmail,
          phone: donation.donorPhone,
        },
      });
    }

    // ✅ Optimistic success (webhook remains final authority)
    const updatedDonation = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: "SUCCESS",
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });

    console.info("✅ Payment verified (optimistic)", {
      orderId: updatedDonation.orderId,
      paymentId: updatedDonation.paymentId,
    });

    const receiptNo = `SRTK${String(updatedDonation.id).padStart(6, "0")}`;

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: updatedDonation.paymentId,
        orderId: updatedDonation.orderId,
        amount: updatedDonation.amount,
        receiptNo,
        createdAt: updatedDonation.createdAt,
      },
      donor: {
        name: updatedDonation.donorName,
        email: updatedDonation.donorEmail,
        phone: updatedDonation.donorPhone,
      },
    });
  } catch (error) {
    console.error("🚨 Verify route error", { ip, error });
    return NextResponse.json(
      { error: "Unable to verify payment" },
      { status: 500 }
    );
  }
}
