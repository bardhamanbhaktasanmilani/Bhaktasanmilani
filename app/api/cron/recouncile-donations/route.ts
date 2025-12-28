// app/api/cron/reconcile-donations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export const runtime = "nodejs";

const MAX_PENDING_MINUTES = 15;

export async function POST() {
  try {
    const cutoff = new Date(
      Date.now() - MAX_PENDING_MINUTES * 60 * 1000
    );

    const pendingDonations = await prisma.donation.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoff },
      },
      take: 50, // safety limit
    });

    for (const donation of pendingDonations) {
      try {
        const payments = await razorpay.orders.fetchPayments(
          donation.orderId
        );

        if (!payments.items.length) continue;

        const capturedPayment = payments.items.find(
          (p: any) => p.status === "captured"
        );

        if (capturedPayment) {
          await prisma.donation.update({
            where: { id: donation.id },
            data: {
              status: "SUCCESS",
              paymentId: capturedPayment.id,
            },
          });
        } else {
          const failed = payments.items.find(
            (p: any) => p.status === "failed"
          );

          if (failed) {
            await prisma.donation.update({
              where: { id: donation.id },
              data: {
                status: "FAILED",
                paymentId: failed.id,
              },
            });
          }
        }
      } catch (err) {
        console.warn(
          "Reconciliation failed for order:",
          donation.orderId
        );
      }
    }

    return NextResponse.json({
      success: true,
      checked: pendingDonations.length,
    });
  } catch (error) {
    console.error("Reconciliation cron error:", error);
    return NextResponse.json(
      { error: "Reconciliation failed" },
      { status: 500 }
    );
  }
}
