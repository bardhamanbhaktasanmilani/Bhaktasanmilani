// components/ui/OptimizedImage.tsx
"use client";

import React from "react";

type Props = {
  /** Source path of the original image (e.g. "/About/religious/religious1.jpg").
      Build pipeline should generate -320.webp, -480.webp, -768.webp, -1024.webp, -1600.webp (and avif if possible).
      If you use Next.js Image optimization, swap this component out for next/image. */
  src: string;
  alt: string;
  width?: number; // intrinsic width of the original image in px
  height?: number; // intrinsic height of the original image in px
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean; // recommended for LCP
  sizes?: string;
  aspectRatio?: string; // optional "16/9" or "4/3" etc — used only for CSS reserve
};

export default function OptimizedImage({
  src,
  alt,
  width = 1600,
  height = 900,
  className,
  loading = "lazy",
  priority = false,
  sizes,
  aspectRatio,
}: Props) {
  // derive base (strip extension) e.g. "/About/religious/religious1"
  const base = src.replace(/\.(jpe?g|png|webp|avif)$/i, "");
  const sizesArray = [320, 480, 768, 1024, 1280, 1600];

  const makeSrcSet = (ext: string) => sizesArray.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");

  const finalSizes = sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  // CSS fallback aspect ratio
  const cssAspect = aspectRatio || `${width} / ${height}`;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        aspectRatio: cssAspect,
        overflow: "hidden",
        display: "block",
        backgroundColor: "#f7efe6",
      }}
    >
      <picture>
        {/* try AVIF first (if you generate) */}
        <source type="image/avif" srcSet={makeSrcSet("avif")} sizes={finalSizes} />
        {/* then WebP */}
        <source type="image/webp" srcSet={makeSrcSet("webp")} sizes={finalSizes} />
        {/* fallback to jpeg */}
        <img
          src={`${base}-1024.jpg`}
          srcSet={makeSrcSet("jpg")}
          sizes={finalSizes}
          width={width}
          height={height}
          alt={alt}
          loading={priority ? "eager" : loading}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </picture>
    </div>
  );
}
