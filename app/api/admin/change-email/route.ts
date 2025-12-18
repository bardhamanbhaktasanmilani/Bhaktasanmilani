import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, clearAdminCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    /* 🔐 Authenticate admin */
    const adminPayload = await getCurrentAdmin();

    if (!adminPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 🚦 Rate limit per admin ID */
    // 3 attempts per 10 minutes
    const rl = rateLimit(
      `admin-change-email:${adminPayload.adminId}`,
      3,
      10 * 60 * 1000
    );

    if (!rl.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rl.resetAt - Date.now()) / 1000)
      );

      const res = NextResponse.json(
        { error: "Too many email change attempts. Please try again later." },
        { status: 429 }
      );

      res.headers.set("Retry-After", String(retryAfterSeconds));
      return res;
    }

    const { password, newEmail } = await req.json();

    if (!password || !newEmail) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    /* ✉️ Basic email validation */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminPayload.adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    /* 🔑 Re-authenticate with password */
    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 400 }
      );
    }

    /* 📝 Update email */
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        email: newEmail.toLowerCase(),
      },
    });

    /* 🔒 Force logout after email change */
    const res = NextResponse.json({ success: true });
    clearAdminCookie(res);

    return res;
  } catch (err) {
    console.error("Change email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
