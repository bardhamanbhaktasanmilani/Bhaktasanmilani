// components/ui/OptimizedImage.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
  sizes?: string;
  aspectRatio?: string;
  objectFit?: "cover" | "contain" | "fill" | "scale-down";
  noWrapper?: boolean;
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
  objectFit = "cover",
  noWrapper = false,
}: Props) {
  const originalSrc = src;
  const base = src.replace(/\.(jpe?g|png|webp|avif)$/i, "");
  const sizesArray = [320, 480, 768, 1024, 1280, 1600];
  const finalSizes = sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
  const cssAspect = aspectRatio || `${width} / ${height}`;

  const [hasVariants, setHasVariants] = useState<boolean | null>(null);
  const [useOptimized, setUseOptimized] = useState(false);
  const [optimizedFailed, setOptimizedFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const probeCandidates = [
        `${base}-320.avif`,
        `${base}-320.webp`,
        `${base}-320.jpg`,
      ];
      for (const url of probeCandidates) {
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (!mounted) return;
          if (res.ok) {
            setHasVariants(true);
            setUseOptimized(true);
            return;
          }
        } catch (err) {
          // ignore and try next
        }
      }
      if (mounted) setHasVariants(false);
    })();
    return () => { mounted = false; };
  }, [base]);

  const makeSrcSet = (ext: string) => sizesArray.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");

  const handleOptimizedError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!optimizedFailed) {
      setOptimizedFailed(true);
      setUseOptimized(false);
    }
    const img = e.currentTarget;
    img.removeAttribute("srcset");
  };

  // plain <img> for lightbox
  if (noWrapper) {
    if (useOptimized && hasVariants && !optimizedFailed) {
      return (
        <img
          src={`${base}-1024.jpg`}
          srcSet={makeSrcSet("jpg")}
          sizes={finalSizes}
          width={width}
          height={height}
          alt={alt}
          loading={priority ? "eager" : loading}
          className={className}
          onError={handleOptimizedError}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "75vh",
            objectFit: objectFit,
            display: "block",
            margin: "0 auto",
          }}
        />
      );
    }
    return (
      <img
        src={originalSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : loading}
        className={className}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "75vh",
          objectFit: objectFit,
          display: "block",
          margin: "0 auto",
        }}
      />
    );
  }

  // wrapped mode
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
        {useOptimized && hasVariants && !optimizedFailed && <source type="image/avif" srcSet={makeSrcSet("avif")} sizes={finalSizes} />}
        {useOptimized && hasVariants && !optimizedFailed && <source type="image/webp" srcSet={makeSrcSet("webp")} sizes={finalSizes} />}
        {useOptimized && hasVariants && !optimizedFailed ? (
          <img
            src={`${base}-1024.jpg`}
            srcSet={makeSrcSet("jpg")}
            sizes={finalSizes}
            width={width}
            height={height}
            alt={alt}
            loading={priority ? "eager" : loading}
            onError={handleOptimizedError}
            style={{ width: "100%", height: "100%", objectFit: objectFit, display: "block" }}
          />
        ) : (
          <img
            src={originalSrc}
            width={width}
            height={height}
            alt={alt}
            loading={priority ? "eager" : loading}
            style={{ width: "100%", height: "100%", objectFit: objectFit, display: "block" }}
          />
        )}
      </picture>
    </div>
  );
}
