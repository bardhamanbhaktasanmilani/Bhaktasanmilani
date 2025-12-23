"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";

type RawEvent = {
  id: number;
  title: string;
  description: string;
  // backend may return either `date` or `dateTime` — accept both
  date?: string | null;
  dateTime?: string | null;
  posterUrl?: string | null;
};

type Event = {
  id: number;
  title: string;
  description: string;
  dateISO: string; // normalized ISO date string
  posterUrl?: string | null;
};

export default function AdminEventsPage(): JSX.Element {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("18:00");

  // poster for modal (local create)
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  // track uploads per event so UI doesn't show a global uploading state
  const [uploadingByEvent, setUploadingByEvent] = useState<Record<number, boolean>>({});
  const [uploadingPosterLocal, setUploadingPosterLocal] = useState(false);

  // keep a ref to the active fetch abort controller so we can cancel on unmount
  const fetchAbortRef = useRef<AbortController | null>(null);

  // normalize raw event object coming from API to Event
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

  // fetch upcoming events with abort handling
  const fetchEvents = async () => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/events", { signal: ac.signal });
      if (!res.ok) throw new Error("Failed to load events");
      const data: RawEvent[] = await res.json();
      const normalized = data.map(normalize).sort((a, b) => {
        return new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime();
      });
      setEvents(normalized);
    } catch (err: any) {
      if (err.name === "AbortError") return; // ignore aborts
      setError(err?.message ?? "Something went wrong while loading events");
    } finally {
      setLoading(false);
      fetchAbortRef.current = null;
    }
  };

  useEffect(() => {
    fetchEvents();
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      // revoke any object URL preview when unmounting
      if (posterPreview) URL.revokeObjectURL(posterPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Monday = 0 (make Monday first column)
    const startWeekday = (start.getDay() + 6) % 7;
    for (let i = 0; i < startWeekday; i++) days.push(null);

    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(year, month, d));

    return days;
  }, [currentMonth]);

  const openModalForDate = (date: Date) => {
    setSelectedDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    setTitle("");
    setDescription("");
    setTime("18:00");
    setPosterFile(null);
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
      setPosterPreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setTitle("");
    setDescription("");
    setTime("18:00");
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
      setPosterPreview(null);
    }
    setPosterFile(null);
  };

  // helper to convert File -> dataURL (kept for compatibility if backend expects it)
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

  // Upload poster — prefer FormData (typical), but fall back to dataUrl JSON if needed.
  const uploadPosterToServer = async (file: File) => {
    // show a local indicator (different from per-event uploading)
    setUploadingPosterLocal(true);
    try {
      // try FormData first
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

        // if FormData route fails (non-2xx), fall back to dataUrl JSON
      } catch (e) {
        // ignore and fall through to dataURL approach
      }

      // fallback: data URL
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

      closeModal();
      await fetchEvents();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong creating the event");
    } finally {
      setCreating(false);
    }
  };

  const handleUploadPosterForEvent = async (eventId: number, file: File) => {
    setUploadingByEvent((p) => ({ ...p, [eventId]: true }));
    try {
      const posterUrl = await uploadPosterToServer(file);

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posterUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to attach poster to event");
      }

      await fetchEvents();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong while uploading poster");
    } finally {
      setUploadingByEvent((p) => ({ ...p, [eventId]: false }));
    }
  };

  const onSelectPosterFile = (file?: File | null) => {
    if (!file) {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
      setPosterFile(null);
      setPosterPreview(null);
      return;
    }

    setPosterFile(file);
    const url = URL.createObjectURL(file);
    setPosterPreview(url);
  };

  const goToPrevMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleDeleteEvent = async (eventId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete event");
      }
      await fetchEvents();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong deleting the event");
    }
  };

  // small helper to render a date safely
  const safeFormat = (iso: string, fmt: string) => {
    try {
      return format(parseISO(iso), fmt);
    } catch (_e) {
      return "—";
    }
  };

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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Calendar card */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
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

          {/* Upcoming events list */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
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

                          <button onClick={() => handleDeleteEvent(event.id)} className="mt-2 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700">Delete Event</button>
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

      {/* Create Event Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Create Event</h2>
                <p className="text-xs text-slate-500">{format(selectedDate, "EEEE, dd MMM yyyy")}</p>
              </div>
              <button onClick={closeModal} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 hover:bg-slate-200">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300" placeholder="Evening satsang, kirtan, etc." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300" placeholder="Short details about the event for donors." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">Time (24-hour format)</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300" />
              </div>

              {/* Poster upload control */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Poster (optional)</label>

                <div className="flex items-center gap-3">
                  <label className="relative cursor-pointer rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600 hover:bg-slate-200">
                    <input type="file" accept="image/*" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0] ?? null; onSelectPosterFile(f ?? undefined); }} />
                    Choose image
                  </label>

                  {posterPreview && (
                    <div className="flex items-center gap-2">
                      <img src={posterPreview} alt="preview" className="h-16 w-24 rounded-md object-cover" />
                      <button type="button" onClick={() => onSelectPosterFile(undefined)} className="text-xs text-slate-500 underline">Remove</button>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-400">Poster will appear on donor site with the event. Recommended: 1200×675 (landscape).</p>
              </div>

              <button type="submit" disabled={creating || uploadingPosterLocal} className="mt-2 w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70">{creating ? "Saving…" : "Save Event"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
