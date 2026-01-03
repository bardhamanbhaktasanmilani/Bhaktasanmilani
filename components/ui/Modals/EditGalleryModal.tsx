"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modals/Modal";
import type { GalleryItem } from "@/app/admin/dashboard/gallery/types";
import { X } from "lucide-react";

interface EditGalleryModalProps {
  open: boolean;
  item: GalleryItem;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditGalleryModal({
  open,
  item,
  onClose,
  onSaved,
}: EditGalleryModalProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [category, setCategory] = useState<GalleryItem["category"]>(
    item.category
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(item.imageUrl);

  const [saving, setSaving] = useState(false);

  // Prevent Modal's backdrop/ESC from closing unless we explicitly allow it.
  // Modal requires onClose prop (type), so we provide a controlled no-op handler.
  // Parent onClose (prop) will be called directly only from the internal buttons.
  const allowModalCloseRef = useRef(false);
  const modalOnClose = () => {
    // Called when Modal triggers a close (backdrop / ESC / internal)
    if (allowModalCloseRef.current) {
      allowModalCloseRef.current = false;
      onClose();
    } else {
      // ignore backdrop/ESC closes
    }
  };

  // Keep track of previous objectURL to revoke when replaced/unmounted
  const prevObjectUrlRef = useRef<string | null>(null);

  /* 🔁 Reset state when modal opens with a new item */
  useEffect(() => {
    if (!open) return;

    setTitle(item.title);
    setDescription(item.description ?? "");
    setCategory(item.category);
    setImageFile(null);

    // set preview to the server URL (or empty string)
    setImagePreview(item.imageUrl ?? "");
  }, [open, item]);

  /* cleanup object URLs on unmount or preview change */
  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(prevObjectUrlRef.current);
        } catch {
          /* ignore */
        }
        prevObjectUrlRef.current = null;
      }
    };
  }, []);

  /* 🖼 Image select + preview */
  const onImageChange = (file: File | null) => {
    if (!file) return;

    // revoke previous preview if it was an object URL
    if (prevObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(prevObjectUrlRef.current);
      } catch {
        /* ignore revoke errors */
      }
      prevObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    prevObjectUrlRef.current = objectUrl;

    setImageFile(file);
    setImagePreview(objectUrl);
  };

  /* internal helper to call parent onClose but only when we want to */
  const invokeParentClose = () => {
    // allow Modal to call onClose if it triggers again immediately (safety)
    allowModalCloseRef.current = true;
    onClose();
  };

  /* 💾 Save handler */
  const save = async () => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("id", item.id);
      formData.append("title", title);
      formData.append("description", description ?? "");
      formData.append("category", String(category));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/admin/gallery", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to update gallery item");
      }

      onSaved();

      // close only after successful save (explicit)
      invokeParentClose();
    } catch (err) {
      // keep behavior unchanged: alert on failure
      alert("Failed to update gallery item");
      console.error("EditGalleryModal save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={modalOnClose}>
      {/* Prevent clicks inside the dialog from bubbling to the backdrop */}
      <div className="relative" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">
              Edit Gallery Item
            </h3>

            {/* CLOSE BUTTON (only internal way to close) */}
            <button
              type="button"
              onClick={() => {
                // direct close via internal control
                invokeParentClose();
              }}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* IMAGE PREVIEW */}
          <div className="space-y-3">
            <img
              src={imagePreview}
              alt={title}
              className="w-full h-44 object-cover rounded-2xl bg-slate-100"
            />

            {/* IMAGE REPLACE */}
            <label className="block">
              <span className="sr-only">Replace image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:rounded-xl file:border-0
                  file:bg-orange-50 file:px-4 file:py-2
                  file:text-orange-700 hover:file:bg-orange-100"
              />
            </label>
          </div>

          {/* TITLE */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gallery title"
              className="w-full rounded-xl bg-slate-100 px-4 py-2.5
                text-slate-800 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-xl bg-slate-100 px-4 py-2.5
                text-slate-800 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as GalleryItem["category"])
              }
              className="w-full rounded-xl bg-slate-100 px-4 py-2.5
                text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="RELIGIOUS">Religious</option>
              <option value="YOG">Yoga</option>
              <option value="CHARITY">Charity</option>
            </select>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                // Cancel — close only via internal control
                invokeParentClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-orange-600 text-white
                hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
