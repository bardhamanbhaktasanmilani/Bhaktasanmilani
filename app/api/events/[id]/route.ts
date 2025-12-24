// app/api/events/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/events/:id → update poster
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const eventId = Number(id);
    if (!id || Number.isNaN(eventId)) {
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
      where: { id: eventId }, // ✅ always number
      data: { posterUrl },
    });

    return NextResponse.json({ ok: true, event });
  } catch (error: any) {
    if (error?.code === "P2025") {
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
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    const eventId = Number(id);
    if (!id || Number.isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event id" },
        { status: 400 }
      );
    }

    await prisma.event.delete({
      where: { id: eventId }, // ✅ always number
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
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
