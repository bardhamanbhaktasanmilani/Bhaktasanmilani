// app/api/admin/change-password/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin, clearAdminCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    /* ✅ Use existing auth helper (ADMIN_JWT_SECRET safe) */
    const adminPayload = await getCurrentAdmin();

    if (!adminPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // === Rate limit per admin ID ===
    // 3 attempts per 10 minutes (10 * 60 * 1000 ms)
    const rl = rateLimit(
      `admin-change-password:${adminPayload.adminId}`,
      3,
      10 * 60 * 1000
    );

    if (!rl.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rl.resetAt - Date.now()) / 1000)
      );

      const res = NextResponse.json(
        { error: "Too many password change attempts. Please try again later." },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(retryAfterSeconds));
      return res;
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminPayload.adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, admin.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { password: hashed },
    });

    /* ✅ Force logout after password change */
    const res = NextResponse.json({ success: true });
    clearAdminCookie(res);

    return res;
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
