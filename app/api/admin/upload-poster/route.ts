// app/api/admin/upload-poster/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// ✅ MUST run on Node.js (fs, Buffer)
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Parse JSON body (App Router handles this natively)
    const body = await req.json();
    const { name, dataUrl } = body || {};

    if (!name || !dataUrl) {
      return NextResponse.json(
        { error: "Missing name or dataUrl" },
        { status: 400 }
      );
    }

    // Validate base64 image data URL
    const matches = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
    if (!matches) {
      return NextResponse.json(
        { error: "Invalid dataUrl" },
        { status: 400 }
      );
    }

    const mime = matches[1];
    const base64 = matches[2];

    // Derive safe file extension
    const ext = mime.split("/")[1].replace("+", "");

    // Sanitize filename (no path traversal, no spaces)
    const safeName = path
      .basename(name, path.extname(name))
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "");

    const fileName = `${Date.now()}-${safeName}.${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(base64, "base64");
    await fs.writeFile(filePath, buffer);

    // Public URL
    const url = `/uploads/${fileName}`;

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("upload-poster error:", err);

    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
