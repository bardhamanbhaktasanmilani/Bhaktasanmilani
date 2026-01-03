export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  category: "RELIGIOUS" | "YOG" | "CHARITY";
  imageUrl: string;
};
