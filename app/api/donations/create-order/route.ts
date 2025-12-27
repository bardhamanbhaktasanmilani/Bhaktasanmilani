// app/api/donations/create-order/route.ts
import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      amount: number;
      donorName: string;
      donorEmail: string;
      donorPhone: string;
    };

    const { amount, donorName, donorEmail, donorPhone } = body;

    if (!amount || amount < 10 || amount > 1_000_000) {
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

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `donation_${Date.now()}`,
      notes: {
        donorName,
        donorEmail,
        donorPhone,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create-order failed:", error);
    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}
