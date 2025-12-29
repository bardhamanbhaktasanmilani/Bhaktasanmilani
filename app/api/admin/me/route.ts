import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return only non-sensitive public info
    return NextResponse.json({ email: admin.email ?? null }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
