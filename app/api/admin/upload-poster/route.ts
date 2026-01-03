import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/* ========================
   Helpers
   ======================== */

function sanitizeFileName(name: string) {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase()
    .slice(0, 180);
}

async function ensureUploadsDir() {
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/* ========================
   POST /api/admin/upload-poster
   ======================== */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    /* =====================================
       CASE 1: multipart/form-data (FILES)
       ===================================== */
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        );
      }

      const originalName =
        typeof formData.get("name") === "string"
          ? String(formData.get("name"))
          : file.name;

      const safeName = sanitizeFileName(originalName);
      const ext = path.extname(safeName) || ".jpg";
      const finalName = `${Date.now()}-${safeName}${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const uploadsDir = await ensureUploadsDir();
      const filePath = path.join(uploadsDir, finalName);

      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        url: `/uploads/${finalName}`,
      });
    }

    /* =====================================
       CASE 2: JSON dataUrl fallback
       ===================================== */
    if (contentType.includes("application/json")) {
      const text = await req.text();

      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        );
      }

      const { name, dataUrl } = body || {};

      if (!name || !dataUrl) {
        return NextResponse.json(
          { error: "Missing name or dataUrl" },
          { status: 400 }
        );
      }

      const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid dataUrl format" },
          { status: 400 }
        );
      }

      const mime = match[1];
      const base64 = match[2];
      const ext = mime.split("/")[1].replace("+", "");

      const safeName = sanitizeFileName(name);
      const finalName = `${Date.now()}-${safeName}.${ext}`;

      const buffer = Buffer.from(base64, "base64");

      const uploadsDir = await ensureUploadsDir();
      const filePath = path.join(uploadsDir, finalName);

      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        url: `/uploads/${finalName}`,
      });
    }

    /* =====================================
       Unsupported content-type
       ===================================== */
    return NextResponse.json(
      { error: `Unsupported Content-Type: ${contentType}` },
      { status: 415 }
    );
  } catch (err: any) {
    console.error("upload-poster error:", err);

    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
