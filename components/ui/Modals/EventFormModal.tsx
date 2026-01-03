"use client";

import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";

/* ================= TYPES ================= */

type EventPayload = {
  id?: number;
  title: string;
  description: string;
  dateISO: string;
  posterUrl?: string | null;
};

type Props = {
  event: EventPayload;
  onSave: (payload: EventPayload) => Promise<void>;
  onClose: () => void;
};

/* ================= COMPONENT ================= */

/**
 * EventFormModal
 *
 * - Borderless inputs (with subtle focus underline)
 * - Separate Remove Image action (immediate)
 * - Upload / replace poster
 * - Create / Edit flows preserved
 * - Blob URL cleanup
 * - Accessible labels, keyboard-friendly
 */
export default function EventFormModal({ event, onSave, onClose }: Props) {
  const isEdit = Boolean(event.id);

  const parsedDate = (() => {
    try {
      return parseISO(event.dateISO);
    } catch {
      return new Date();
    }
  })();

  // Form state
  const [title, setTitle] = useState(event.title ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [date, setDate] = useState(format(parsedDate, "yyyy-MM-dd"));
  const [time, setTime] = useState(format(parsedDate, "HH:mm"));

  // Poster
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(
    event.posterUrl ?? null
  );

  // UX state
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  /* =============== cleanup blob preview =============== */
  useEffect(() => {
    return () => {
      if (posterPreview && posterPreview.startsWith("blob:")) {
        URL.revokeObjectURL(posterPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =============== upload helper =============== */
  const uploadPoster = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", file.name);

      const res = await fetch("/api/admin/upload-poster", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Poster upload failed");
      }

      const body = await res.json();
      return body.url as string;
    } finally {
      setUploading(false);
    }
  };

  /* =============== remove image (separate action) =============== */
  const handleRemoveImage = async () => {
    setError(null);
    setHint(null);

    // If it's a local selection, clear preview only
    if (posterPreview && posterPreview.startsWith("blob:")) {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
      setPosterFile(null);
      setPosterPreview(null);
      setHint("Local selection cleared.");
      return;
    }

    // If editing existing event with remote poster, request immediate removal
    if (!isEdit || !event.id) {
      setPosterFile(null);
      setPosterPreview(null);
      setHint("Image cleared.");
      return;
    }

    try {
      setRemoving(true);
      setHint("Removing image…");

      await onSave({
        id: event.id,
        title: event.title,
        description: event.description,
        dateISO: event.dateISO,
        posterUrl: null,
      });

      // clear preview locally and close so parent will be the single source of truth
      if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
      setPosterFile(null);
      setPosterPreview(null);

      setHint("Image removed");
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to remove image");
    } finally {
      setRemoving(false);
    }
  };

  /* =============== submit (create / update) =============== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setHint(null);

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    try {
      setSaving(true);
      setHint("Preparing…");

      const [h, m] = time.split(":").map((v) => Number(v ?? 0));
      const combined = new Date(date);
      combined.setHours(h, m, 0, 0);

      let posterUrl: string | null = event.posterUrl ?? null;

      if (posterFile) {
        setHint("Uploading poster…");
        posterUrl = await uploadPoster(posterFile);
        setHint("Upload complete.");
      }

      setHint("Saving event…");

      await onSave({
        id: event.id,
        title: title.trim(),
        description: description.trim(),
        dateISO: combined.toISOString(),
        posterUrl,
      });

      setHint("Saved.");
      // close modal — parent will update list
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to save event");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  /* =============== file change handler =============== */
  const handleFileChange = (file?: File | null) => {
    setError(null);
    setHint(null);

    if (!file) {
      if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
      setPosterFile(null);
      setPosterPreview(null);
      return;
    }
    // revoke previous blob if any
    if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
    const url = URL.createObjectURL(file);
    setPosterFile(file);
    setPosterPreview(url);
    setHint("Preview ready — click Save to upload.");
  };

  /* ==========================
     Small UI building helpers
     ========================== */

  const InputLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] font-medium text-slate-500 mb-1">{children}</div>
  );

  const BorderlessInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className={
        "w-full bg-transparent outline-none px-0 py-2 text-sm text-slate-800 placeholder:text-slate-400 " +
        "focus:shadow-[0_4px_24px_rgba(255,127,80,0.08)] focus:backdrop-blur-sm " +
        "transition-colors"
      }
    />
  );

  const BorderlessTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      className={
        "w-full bg-transparent outline-none px-0 py-2 text-sm text-slate-800 placeholder:text-slate-400 min-h-[76px] resize-none " +
        "focus:shadow-[0_4px_24px_rgba(255,127,80,0.08)] transition-colors"
      }
    />
  );

  /* ================= RENDER ================= */

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="event-modal-title"
    >
      {/* Dim + soft vignette */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-white to-orange-50">
          <div className="flex items-start gap-3">
            {/* decorative icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 ring-1 ring-orange-50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2v20M2 12h20" stroke="#EA7800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 id="event-modal-title" className="text-lg font-semibold text-slate-800">
                {isEdit ? "Edit Event" : "Create Event"}
              </h3>
              <p className="text-xs text-slate-500">{format(parsedDate, "EEEE, dd MMM yyyy")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
                onClose();
              }}
              aria-label="Close"
              className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-slate-600 hover:bg-slate-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Error / hint */}
          {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          {!error && hint && <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{hint}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <InputLabel>Title</InputLabel>
              <div className="rounded-md bg-white/0 px-0 py-0">
                <BorderlessInput
                  placeholder="Give the event a short, descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  aria-label="Event title"
                />
                <div className="h-[1px] bg-slate-100 mt-1" />
                <div className="sr-only">Borderless input—focus shows subtle shadow.</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <InputLabel>Description</InputLabel>
              <div className="rounded-md bg-white/0 px-0 py-0">
                <BorderlessTextarea
                  placeholder="Write a short description for donors (what, why, who)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  aria-label="Event description"
                />
                <div className="h-[1px] bg-slate-100 mt-1" />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputLabel>Date</InputLabel>
                <div className="rounded-md bg-white/0 px-0 py-0">
                  <BorderlessInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required aria-label="Event date" />
                </div>
              </div>

              <div>
                <InputLabel>Time</InputLabel>
                <div className="rounded-md bg-white/0 px-0 py-0">
                  <BorderlessInput type="time" value={time} onChange={(e) => setTime(e.target.value)} required aria-label="Event time" />
                </div>
              </div>
            </div>

            {/* Poster */}
            <div>
              <InputLabel>Poster (optional)</InputLabel>
              <div className="flex items-start gap-4">
                <label
                  htmlFor="poster-input"
                  className={
                    "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 cursor-pointer select-none " +
                    "bg-slate-50 hover:bg-slate-100 transition"
                  }
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {uploading ? "Uploading…" : "Choose image"}
                  <input
                    id="poster-input"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      handleFileChange(f);
                    }}
                  />
                </label>

                {/* Preview and remove */}
                {posterPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={posterPreview} alt="Poster preview" className="h-20 w-32 rounded-md object-cover shadow-md" />
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={removing}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {removing ? "Removing…" : "Remove image"}
                      </button>
                      <div className="text-xs text-slate-400">Recommended: 1200×675</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">No poster selected</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">Preview saved posters for donors after publishing.</div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (posterPreview && posterPreview.startsWith("blob:")) URL.revokeObjectURL(posterPreview);
                    onClose();
                  }}
                  className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-md bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {saving ? "Saving…" : isEdit ? "Update Event" : "Create Event"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
