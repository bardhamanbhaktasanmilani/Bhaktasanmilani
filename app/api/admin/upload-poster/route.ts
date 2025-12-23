// app/api/admin/upload-poster/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// ✅ MUST run on Node.js (fs, Buffer)
export const runtime = "nodejs";

// ✅ MUST increase body size limit for base64 images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, dataUrl } = body || {};

    if (!name || !dataUrl) {
      return NextResponse.json(
        { error: "Missing name or dataUrl" },
        { status: 400 }
      );
    }

    const matches = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
    if (!matches) {
      return NextResponse.json(
        { error: "Invalid dataUrl" },
        { status: 400 }
      );
    }

    const mime = matches[1];
    const base64 = matches[2];
    const ext = mime.split("/")[1].replace("+", "");
   const safeName = path.basename(name, path.extname(name)).replace(/\s+/g, "-");

    const fileName = `${Date.now()}-${safeName}.${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(base64, "base64");
    await fs.writeFile(filePath, buffer);

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
