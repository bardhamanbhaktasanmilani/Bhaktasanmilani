"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import EventFormModal from "@/components/ui/Modals/EventFormModal";
// Confirm modal imported from components/ui/modals
import ConfirmModal from "@/components/ui/Modals/ConfirmModal";

/* -----------------------
   Types
   ----------------------- */
type RawEvent = {
  id: number;
  title: string;
  description: string;
  date?: string | null;
  dateTime?: string | null;
  posterUrl?: string | null;
};

type Event = {
  id: number;
  title: string;
  description: string;
  dateISO: string;
  posterUrl?: string | null;
};

/* -----------------------
   Component
   ----------------------- */
export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit modal: when editing an event
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("18:00");

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const [uploadingByEvent, setUploadingByEvent] = useState<Record<number, boolean>>({});
  const [uploadingPosterLocal, setUploadingPosterLocal] = useState(false);

  const fetchAbortRef = useRef<AbortController | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* -----------------------
     Helpers
     ----------------------- */

  const normalize = (r: RawEvent): Event => {
    const rawIso = r.date ?? r.dateTime ?? null;
    const dateISO = rawIso || new Date().toISOString();
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      dateISO,
      posterUrl: r.posterUrl ?? null,
    };
  };

  const safeFormat = (iso: string, fmt: string) => {
    try {
      return format(parseISO(iso), fmt);
    } catch {
      return "—";
    }
  };

  const sortEvents = (list: Event[]) =>
    [...list].sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

  /* -----------------------
     Fetch events
     ----------------------- */
  const fetchEvents = async () => {
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/events", { signal: ac.signal });
      if (!res.ok) throw new Error("Failed to load events");
      const data: RawEvent[] = await res.json();
      const normalized = data.map(normalize);
      setEvents(sortEvents(normalized));
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err?.message ?? "Something went wrong while loading events");
    } finally {
      setLoading(false);
      fetchAbortRef.current = null;
    }
  };

  useEffect(() => {
    fetchEvents();
    return () => {
      fetchAbortRef.current?.abort();
      if (posterPreview && posterPreview.startsWith("blob:")) {
        URL.revokeObjectURL(posterPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -----------------------
     Calendar helpers
     ----------------------- */
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    const startWeekday = (start.getDay() + 6) % 7;
    for (let i = 0; i < startWeekday; i++) days.push(null);

    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(year, month, d));

    return days;
  }, [currentMonth]);

  const goToPrevMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  /* -----------------------
     Modal open / close helpers
     ----------------------- */
  const openModalForDate = (date: Date) => {
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    setTitle("");
    setDescription("");
    setTime("18:00");
    setPosterFile(null);
    if (posterPreview && posterPreview.startsWith("blob:")) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterPreview(null);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (evt: Event) => {
    setEditingEvent(evt);
    try {
      const dt = parseISO(evt.dateISO);
      setSelectedDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      setTitle(evt.title);
      setDescription(evt.description);
      setTime(format(dt, "HH:mm"));
      setPosterFile(null);
      if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
      setPosterPreview(evt.posterUrl ?? null);
      setIsModalOpen(true);
    } catch {
      setTitle(evt.title);
      setDescription(evt.description);
      setIsModalOpen(true);
      setPosterPreview(evt.posterUrl ?? null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setTitle("");
    setDescription("");
    setTime("18:00");
    if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
    setPosterPreview(null);
    setPosterFile(null);
    setEditingEvent(null);
  };

  /* -----------------------
     File helpers
     ----------------------- */
  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Failed to read file"));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const uploadPosterToServer = async (file: File) => {
    setUploadingPosterLocal(true);
    try {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("name", file.name);

        const res = await fetch("/api/admin/upload-poster", {
          method: "POST",
          body: form,
        });

        if (res.ok) {
          const body = await res.json();
          return body.url as string;
        }
      } catch {
        // fallback to dataUrl POST if multipart failed (older handlers)
      }

      const dataUrl = await fileToDataUrl(file);
      const res2 = await fetch("/api/admin/upload-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, dataUrl }),
      });
      if (!res2.ok) {
        const body = await res2.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      const body = await res2.json();
      return body.url as string;
    } finally {
      setUploadingPosterLocal(false);
    }
  };

  /* -----------------------
     Update helpers (local state updates)
     ----------------------- */

  // Accept either { event } or direct Event object returned from API
  const extractEventFromResponse = async (res: Response) => {
    try {
      const body = await res.json();
      // If API returned { ok: true, event } (PATCH/[id] route)
      if (body && body.event) return normalize(body.event as RawEvent);
      // If API returned raw event (POST route)
      if (body && typeof body.id === "number") return normalize(body as RawEvent);
    } catch {
      // swallow - caller may fallback
    }
    return null;
  };

  const applyUpdatedEventToState = (updated: Event) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === updated.id);
      if (exists) {
        return sortEvents(prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        return sortEvents([...prev, updated]);
      }
    });
  };

  const removeEventFromState = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const setEventPosterInState = (id: number, posterUrl: string | null) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, posterUrl } : e)));
  };

  /* -----------------------
     Create event handler
     ----------------------- */
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return setError("Please pick a date first");

    if (!title.trim() || !description.trim()) {
      return setError("Title and description are required");
    }

    try {
      setCreating(true);
      setError(null);

      const [hoursStr, minutesStr] = time.split(":");
      const eventDate = new Date(selectedDate);
      eventDate.setHours(Number(hoursStr), Number(minutesStr), 0, 0);

      let posterUrl: string | undefined;
      if (posterFile) {
        posterUrl = await uploadPosterToServer(posterFile);
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dateTime: eventDate.toISOString(), posterUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create event");
      }

      // prefer to use returned created event to update state (avoid refetch)
      const created = await extractEventFromResponse(res);
      if (created) {
        applyUpdatedEventToState(created);
      } else {
        // fallback: refetch list
        await fetchEvents();
      }

      closeModal();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong creating the event");
    } finally {
      setCreating(false);
    }
  };

  /* -----------------------
     Upload / replace poster for existing event
     ----------------------- */
  const handleUploadPosterForEvent = async (eventId: number, file: File) => {
    setUploadingByEvent((p) => ({ ...p, [eventId]: true }));
    try {
      const posterUrl = await uploadPosterToServer(file);

      // try PATCH and use response to update state
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posterUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to attach poster to event");
      }

      const updated = await extractEventFromResponse(res);
      if (updated) {
        applyUpdatedEventToState(updated);
      } else {
        // fallback: update posterUrl locally (optimistic) then refetch in background
        setEventPosterInState(eventId, posterUrl);
        // best-effort verification
        fetchEvents().catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong while uploading poster");
    } finally {
      setUploadingByEvent((p) => ({ ...p, [eventId]: false }));
    }
  };

  /* -----------------------
     Delete event (now uses ConfirmModal)
     ----------------------- */
  // open confirmation modal for delete
  const handleDeleteEvent = (eventId: number) => {
    setDeletingEventId(eventId);
    setDeleteModalOpen(true);
  };

  // called when user confirms deletion
  const handleConfirmDelete = async () => {
    if (deletingEventId == null) {
      setDeleteModalOpen(false);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${deletingEventId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete event");
      }

      // remove locally to avoid full refetch
      removeEventFromState(deletingEventId);
      setDeleteModalOpen(false);
      setDeletingEventId(null);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong deleting the event");
    } finally {
      setIsDeleting(false);
    }
  };

  /* -----------------------
     Modal save handler (create or edit)
     This now updates local state from API response (no mandatory refetch)
     ----------------------- */
 const handleModalSave = async (payload: {
  id?: number;
  title: string;
  description: string;
  dateISO: string;
  posterUrl?: string | null;
}) => {
  try {
    if (payload.id && payload.id > 0) {
      // PATCH update
      const res = await fetch(`/api/events/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          dateTime: payload.dateISO,
          posterUrl: payload.posterUrl, // ← DO NOT coerce to undefined
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update event");
      }

      // 🔥 FORCE STATE UPDATE (THIS FIXES IMAGE REMOVAL)
      setEvents((prev) =>
        prev.map((e) =>
          e.id === payload.id
            ? {
                ...e,
                title: payload.title,
                description: payload.description,
                dateISO: payload.dateISO,
                posterUrl: payload.posterUrl ?? null, // ← CRITICAL LINE
              }
            : e
        )
      );
    } else {
      // POST create
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          dateTime: payload.dateISO,
          posterUrl: payload.posterUrl ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create event");
      }

      const created = await res.json();
      setEvents((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          description: created.description,
          dateISO: created.date,
          posterUrl: created.posterUrl ?? null,
        },
      ]);
    }

    closeModal();
  } catch (err: any) {
    setError(err?.message ?? "Failed to save event");
    throw err;
  }
};


  /* -----------------------
     Helper to update poster removal from modal immediately
     (EventFormModal should call handleModalSave with posterUrl: null)
     ----------------------- */
  // Note: handleModalSave will receive posterUrl: null and update state accordingly.

  /* -----------------------
     Select local poster file (for "Create" flow preview)
     ----------------------- */
  const onSelectPosterFile = (file?: File | null) => {
    if (!file) {
      if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
      setPosterFile(null);
      setPosterPreview(null);
      return;
    }

    setPosterFile(file);
    const url = URL.createObjectURL(file);
    setPosterPreview(url);
  };

  /* -----------------------
     Render
     ----------------------- */
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Event Calendar</h1>
            <p className="text-sm text-slate-500">Click on a date to create an event. Only upcoming events will be visible to donors.</p>
          </div>
          <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-medium text-orange-700">Bhakta Sammilan ✨</div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 md:grid-cols-[420px_1fr] items-start">

          {/* Calendar card */}
         <div className="rounded-2xl bg-white p-4 shadow-sm self-start">

            <div className="mb-4 flex items-center justify-between">
              <button onClick={goToPrevMonth} aria-label="Previous month" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200">◀</button>
              <div className="text-center">
                <div className="text-sm font-medium text-slate-500">{format(currentMonth, "yyyy")}</div>
                <div className="text-lg font-semibold text-slate-800">{format(currentMonth, "MMMM")}</div>
              </div>
              <button onClick={goToNextMonth} aria-label="Next month" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200">▶</button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="h-10 rounded-lg" />;

                const now = new Date();
                const isToday = now.getFullYear() === day.getFullYear() && now.getMonth() === day.getMonth() && now.getDate() === day.getDate();

                return (
                  <button key={idx} type="button" onClick={() => openModalForDate(day)} className={`flex h-10 items-center justify-center rounded-lg border text-sm transition ${isToday ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-100 bg-slate-50 text-slate-700 hover:border-orange-300 hover:bg-orange-50"}`}>
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-slate-400">Tip: Choose date → fill title, description & time (24-hour) → save. Donors will see it as an upcoming event with poster if provided.</p>
          </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm max-h-[calc(100vh-220px)] overflow-y-auto">

            <h2 className="mb-3 text-lg font-semibold text-slate-800">Upcoming Events</h2>

            {loading ? (
              <p className="text-sm text-slate-500">Loading events…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming events created yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const eventDateISO = event.dateISO;
                  return (
                    <div key={event.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800">{event.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">{event.description}</p>

                          {event.posterUrl && <img src={event.posterUrl} alt={`${event.title} poster`} className="mt-3 max-h-36 w-auto rounded-md object-cover" />}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="rounded-lg bg-orange-50 px-2 py-1 text-right text-[11px] font-medium text-orange-700">
                            <div>{safeFormat(eventDateISO, "dd MMM")}</div>
                            <div>{safeFormat(eventDateISO, "HH:mm")} hrs</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="relative cursor-pointer rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200">
                              <input type="file" accept="image/*" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPosterForEvent(event.id, f); }} />
                              {uploadingByEvent[event.id] ? "Uploading…" : "Add / Replace Poster"}
                            </label>
                          </div>

                          <div className="flex gap-2 mt-2">
                            <button onClick={() => openEditModal(event)} className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Edit</button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                              disabled={isDeleting && deletingEventId === event.id}
                            >
                              {isDeleting && deletingEventId === event.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-400">Once the date and time of an event is over, it will no longer appear here or on the donor site.</p>
          </div>
        </div>
      </div>

      {/* Confirmation modal for deletion (imported from components/ui/modals) */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete event"
        description={
          (() => {
            const ev = events.find((e) => e.id === deletingEventId);
            return ev ? `Are you sure you want to permanently delete "${ev.title}"? This cannot be undone.` : "Are you sure you want to delete this event?";
          })()
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingEventId(null);
        }}
        intent="danger"
        isLoading={isDeleting}
      />

      {/* Use EventFormModal for both Create and Edit */}
      {isModalOpen && (
        <EventFormModal
          event={
            editingEvent
              ? {
                  id: editingEvent.id,
                  title: editingEvent.title,
                  description: editingEvent.description,
                  dateISO: editingEvent.dateISO,
                  posterUrl: editingEvent.posterUrl ?? null,
                }
              : {
                  id: 0,
                  title: title,
                  description: description,
                  dateISO: selectedDate
                    ? new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate(),
                        Number(time.split(":")[0] ?? 18),
                        Number(time.split(":")[1] ?? 0),
                        0,
                        0
                      ).toISOString()
                    : new Date().toISOString(),
                  posterUrl: posterPreview ?? null,
                }
          }
          onSave={handleModalSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
