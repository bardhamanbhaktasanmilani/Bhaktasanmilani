"use client";

import { useEffect, useState } from "react";
import EditGalleryModal from "../../../../components/ui/Modals/EditGalleryModal";
import ConfirmModal from "../../../../components/ui/Modals/ConfirmModal";

/* ---------------------------------- */
/* TYPES */
/* ---------------------------------- */
export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  category: "RELIGIOUS" | "YOG" | "CHARITY";
  imageUrl: string;
};

export default function AdminGalleryPage() {
  /* ---------------------------------- */
  /* STATE */
  /* ---------------------------------- */
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<GalleryItem["category"]>("RELIGIOUS");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Edit modal
  const [editingItem, setEditingItem] =
    useState<GalleryItem | null>(null);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] =
    useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ---------------------------------- */
  /* LOAD GALLERY ITEMS */
  /* ---------------------------------- */
  const load = async () => {
    const res = await fetch("/api/admin/gallery", {
      credentials: "include",
    });
    if (!res.ok) return;
    setItems(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------------------------------- */
  /* CREATE IMAGE */
  /* ---------------------------------- */
  const submit = async () => {
    if (!title || !imageFile) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("image", imageFile);

    await fetch("/api/admin/gallery", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setCategory("RELIGIOUS");
    setImageFile(null);
    setImagePreview(null);
    setLoading(false);

    load();
  };

  /* ---------------------------------- */
  /* DELETE IMAGE (CONFIRMED) */
  /* ---------------------------------- */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    await fetch("/api/admin/gallery", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });

    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  /* ---------------------------------- */
  /* RENDER */
  /* ---------------------------------- */
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
          Gallery Management
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-500">
          Upload, edit, and organize gallery images
        </p>
      </div>

      {/* CREATE FORM */}
      <section className="bg-white rounded-3xl shadow-sm p-4 sm:p-6 space-y-5">
        <h2 className="text-base sm:text-lg font-semibold text-slate-700">
          Upload New Image
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-slate-100 px-4 py-2.5
              text-sm sm:text-base
              focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as GalleryItem["category"])
            }
            className="w-full rounded-xl bg-slate-100 px-4 py-2.5
              text-sm sm:text-base
              focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="RELIGIOUS">Religious</option>
            <option value="YOG">Yoga</option>
            <option value="CHARITY">Charity</option>
          </select>
        </div>

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-slate-100 px-4 py-2.5
            resize-none text-sm sm:text-base
            focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* FILE INPUT */}
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }}
            className="block w-full text-xs sm:text-sm text-slate-500
              file:mr-4 file:rounded-xl file:border-0
              file:bg-orange-50 file:px-4 file:py-2
              file:text-orange-700 hover:file:bg-orange-100"
          />

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-w-xs h-32 sm:h-36
                object-cover rounded-2xl bg-slate-100"
            />
          )}
        </div>

        <button
          disabled={loading}
          onClick={submit}
          className="inline-flex items-center justify-center
            w-full sm:w-auto px-6 py-2.5
            rounded-xl bg-orange-600 text-white font-medium
            hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      </section>

      {/* GALLERY GRID */}
      <section>
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-slate-700">
          Uploaded Images
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl shadow-sm
                hover:shadow-md transition overflow-hidden"
            >
              <div className="relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-36 sm:h-40 object-cover"
                />

                {/* ACTIONS */}
                <div className="absolute inset-0 bg-black/40 opacity-0
                  group-hover:opacity-100
                  flex items-center justify-center gap-3 transition">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-4 py-1.5 rounded-lg bg-white
                      text-xs sm:text-sm font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="px-4 py-1.5 rounded-lg bg-red-600
                      text-white text-xs sm:text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {item.title}
                </div>
                <div className="text-xs text-slate-500">
                  {item.category}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EDIT MODAL */}
      {editingItem && (
        <EditGalleryModal
          open
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            load();
          }}
        />
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <ConfirmModal
          open
          title="Delete Image"
          description="This image will be permanently removed from the gallery. This action cannot be undone."
          confirmText="Delete"
          loading={deleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
