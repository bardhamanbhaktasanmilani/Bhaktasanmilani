import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/events/:id → update poster
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Invalid event id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { posterUrl } = body as { posterUrl?: string };

    if (!posterUrl) {
      return NextResponse.json(
        { error: "posterUrl is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.update({
      where: isNaN(Number(id))
        ? { id }
        : { id: Number(id) },
      data: { posterUrl },
    });

    return NextResponse.json({ ok: true, event });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    console.error("[PATCH_EVENT]", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/:id → delete event
export async function DELETE(req: Request) {
  try {
    // ✅ Extract ID directly from URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "Missing event id" },
        { status: 400 }
      );
    }

    // Try numeric first, fallback to string
    const whereClause = isNaN(Number(id))
      ? { id }
      : { id: Number(id) };

    await prisma.event.delete({
      where: whereClause as any,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    console.error("[DELETE_EVENT]", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
