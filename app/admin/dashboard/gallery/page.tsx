"use client";

import { useEffect, useState } from "react";
import EditGalleryModal from "../../../../components/ui/Modals/EditGalleryModal";

export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  category: "RELIGIOUS" | "YOG" | "CHARITY";
  imageUrl: string;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* CREATE FORM STATE */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<GalleryItem["category"]>("RELIGIOUS");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /* EDIT MODAL */
  const [editingItem, setEditingItem] =
    useState<GalleryItem | null>(null);

  /* -------------------------------------------------- */
  /* LOAD ITEMS */
  /* -------------------------------------------------- */
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

  /* -------------------------------------------------- */
  /* CREATE */
  /* -------------------------------------------------- */
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

    /* Reset */
    setTitle("");
    setDescription("");
    setCategory("RELIGIOUS");
    setImageFile(null);
    setImagePreview(null);
    setLoading(false);

    load();
  };

  /* -------------------------------------------------- */
  /* DELETE */
  /* -------------------------------------------------- */
  const remove = async (id: string) => {
    if (!confirm("Delete this image permanently?")) return;

    await fetch("/api/admin/gallery", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    load();
  };

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">
          Gallery Management
        </h1>
        <p className="text-slate-500 mt-1">
          Upload, edit, and organize gallery images
        </p>
      </div>

      {/* CREATE FORM */}
      <section className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-700">
          Upload New Image
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-slate-100 px-4 py-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value as GalleryItem["category"]
              )
            }
            className="w-full rounded-xl bg-slate-100 px-4 py-2.5
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
            resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            className="block w-full text-sm text-slate-500
              file:mr-4 file:rounded-xl file:border-0
              file:bg-orange-50 file:px-4 file:py-2
              file:text-orange-700 hover:file:bg-orange-100"
          />

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-44 h-28 object-cover rounded-2xl bg-slate-100"
            />
          )}
        </div>

        <button
          disabled={loading}
          onClick={submit}
          className="inline-flex items-center px-6 py-2.5
            rounded-xl bg-orange-600 text-white font-medium
            hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Image"}
        </button>
      </section>

      {/* GALLERY GRID */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-slate-700">
          Uploaded Images
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                  className="w-full h-40 object-cover"
                />

                {/* ACTIONS */}
                <div className="absolute inset-0 bg-black/40 opacity-0
                  group-hover:opacity-100 flex items-center justify-center gap-3 transition">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-4 py-1.5 rounded-lg bg-white text-sm font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => remove(item.id)}
                    className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="font-semibold text-sm text-slate-800">
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
          open={true}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            load();
          }}
        />
      )}
    </div>
  );
}
