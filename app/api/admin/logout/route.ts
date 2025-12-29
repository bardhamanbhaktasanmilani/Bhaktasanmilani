import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";

export async function POST() {
  // Base JSON response
  const res = NextResponse.json(
    { ok: true, message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear the admin auth cookie
  clearAdminCookie(res);

  // Make sure logout response isn't cached by browser/proxies
  res.headers.set("Cache-Control", "no-store");

  return res;
}
