import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getCurrentAdmin } from "@/lib/auth";
import { GalleryCategory } from "@prisma/client";

export const runtime = "nodejs";

/* -------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------- */
function parseGalleryCategory(value: FormDataEntryValue | null) {
  if (
    typeof value === "string" &&
    Object.values(GalleryCategory).includes(value as GalleryCategory)
  ) {
    return value as GalleryCategory;
  }
  return null;
}

/* -------------------------------------------------- */
/* CREATE GALLERY ITEM (FormData + Image Upload) */
/* -------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const title = formData.get("title");
    const description = formData.get("description");
    const category = parseGalleryCategory(formData.get("category"));
    const image = formData.get("image");

    if (
      typeof title !== "string" ||
      !category ||
      !(image instanceof File)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    /* Convert file → base64 for Cloudinary */
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${image.type};base64,${buffer.toString("base64")}`;

    const upload = await cloudinary.uploader.upload(base64, {
      folder: `gallery/${category.toLowerCase()}`,
      resource_type: "image",
    });

    const item = await prisma.galleryItem.create({
      data: {
        title,
        description: typeof description === "string" ? description : null,
        category,
        imageUrl: upload.secure_url,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("POST /api/admin/gallery error:", error);
    return NextResponse.json(
      { error: "Failed to create gallery item" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------- */
/* READ (ADMIN) */
/* -------------------------------------------------- */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.galleryItem.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/admin/gallery error:", error);
    return NextResponse.json(
      { error: "Failed to load gallery" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------- */
/* UPDATE (EDIT + OPTIONAL IMAGE REPLACE) */
/* -------------------------------------------------- */
export async function PUT(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const id = formData.get("id");
    const title = formData.get("title");
    const description = formData.get("description");
    const category = parseGalleryCategory(formData.get("category"));
    const image = formData.get("image");

    if (
      typeof id !== "string" ||
      typeof title !== "string" ||
      !category
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    let imageUrl: string | undefined;

    /* Optional image replacement */
    if (image instanceof File) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${image.type};base64,${buffer.toString("base64")}`;

      const upload = await cloudinary.uploader.upload(base64, {
        folder: `gallery/${category.toLowerCase()}`,
        resource_type: "image",
      });

      imageUrl = upload.secure_url;
    }

    const updated = await prisma.galleryItem.update({
      where: { id },
      data: {
        title,
        description: typeof description === "string" ? description : null,
        category,
        ...(imageUrl && { imageUrl }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/gallery error:", error);
    return NextResponse.json(
      { error: "Failed to update gallery item" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------- */
/* DELETE */
/* -------------------------------------------------- */
export async function DELETE(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const id = body?.id;

    if (typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    await prisma.galleryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/gallery error:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery item" },
      { status: 500 }
    );
  }
}
