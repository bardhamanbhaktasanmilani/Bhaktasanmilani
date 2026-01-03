import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================
   PATCH → Edit event (FULL)
   ========================= */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 🔑 REQUIRED in Next.js App Router
    const { id } = await context.params;

    const eventId = Number(id);
    if (!id || Number.isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      dateTime,
      posterUrl,
    } = body as {
      title?: string;
      description?: string;
      dateTime?: string;
      posterUrl?: string | null;
    };

    // Build update object dynamically
    const updateData: Record<string, any> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (dateTime !== undefined) {
      const parsedDate = new Date(dateTime);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid dateTime" },
          { status: 400 }
        );
      }
      updateData.date = parsedDate;
    }

    if (posterUrl !== undefined) {
      updateData.posterUrl = posterUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
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

/* =========================
   DELETE → Delete event
   ========================= */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const eventId = Number(id);
    if (!id || Number.isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event id" },
        { status: 400 }
      );
    }

    await prisma.event.delete({
      where: { id: eventId },
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
