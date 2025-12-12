// components/sections/PhotoGallery.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import OptimizedImage from "@/components/ui/OptimizedImage";

/**
 * Notes:
 * - Carousel3D is dynamically imported and only mounted on the client (ssr: false).
 * - For smaller screens we render a lightweight touch-friendly carousel that uses OptimizedImage
 *   to avoid heavy WebGL on mobiles.
 * - IntersectionObserver is used to add "reveal" classes — animations are CSS-based (transform + opacity).
 * - respects prefers-reduced-motion: if user prefers reduced motion, we disable autoplay and animations.
 */

const Carousel3D = dynamic(() => import("@/components/ui/Carousel3D"), { ssr: false });

type ImgItem = { src: string; alt?: string; title?: string; subtitle?: string; width?: number; height?: number };

const religionImages: ImgItem[] = [
  { src: "/About/religious/religious1.jpg", alt: "Devotees in prayer", title: "Morning Prayers", subtitle: "Devotees gather for the dawn ceremony", width: 1600, height: 900 },
  { src: "/About/religious/religious2.jpg", alt: "Temple procession", title: "Temple Procession", subtitle: "A colourful procession of faith and unity", width: 1600, height: 900 },
  { src: "/About/religious/religious3.jpg", alt: "Ritual offerings", title: "Ritual Offerings", subtitle: "Offerings presented with reverence", width: 1600, height: 900 },
  { src: "/About/religious/religious4.jpg", alt: "Evening aarti", title: "Evening Aarti", subtitle: "The sacred aarti at dusk", width: 1600, height: 900 },
  { src: "/About/religious/religious5.jpg", alt: "Community chanting", title: "Community Chanting", subtitle: "Collective bhajans & kirtans", width: 1600, height: 900 },
];

// const charityImages: ImgItem[] = [
//   { src: "/About/Yoga/yoga1.jpg", alt: "Feeding the needy", title: "Community Kitchen", subtitle: "Meals prepared and shared daily", width: 1600, height: 900 },
//   { src: "/About/Yoga/yoga2.jpg", alt: "Clothes distribution", title: "Clothes Drive", subtitle: "Warm clothes distributed across cities", width: 1600, height: 900 },
//   { src: "/About/Yoga/yoga3.jpg", alt: "Medical camp", title: "Medical Camp", subtitle: "Free checkups & basic treatment", width: 1600, height: 900 },
//   { src: "/About/Yoga/yoga4.jpg", alt: "Education support", title: "Education Support", subtitle: "Stationery and tuition for children", width: 1600, height: 900 },
//   { src: "/About/Yoga/yoga5.jpg", alt: "Tree plantation", title: "Green Drive", subtitle: "Tree plantation & environmental care", width: 1600, height: 900 },
// ];

// const covidImages: ImgItem[] = [
//   { src: "/About/charity/charity1.jpg", alt: "Vaccine awareness", title: "Vaccination Drive", subtitle: "Vaccines administered safely", width: 1600, height: 900 },
//   { src: "/About/charity/charity2.jpg", alt: "Relief supplies", title: "Relief Supplies", subtitle: "Medicine & oxygen supply distribution", width: 1600, height: 900 },
//   { src: "/About/charity/charity3.jpg", alt: "Testing camp", title: "Testing Camps", subtitle: "Rapid testing & safety education", width: 1600, height: 900 },
//   { src: "/About/charity/charity4.jpg", alt: "Volunteer support", title: "Volunteer Network", subtitle: "Volunteers coordinating aid and logistics", width: 1600, height: 900 },
//   { src: "/About/charity/charity5.jpg", alt: "Isolation care", title: "Isolation Support", subtitle: "Safe care & quarantine assistance", width: 1600, height: 900 },
// ];

const usePrefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PhotoGallery() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // small-screen lightweight carousel state
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<ImgItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // only mount 3D carousel on >=768px
  const [mount3D, setMount3D] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width:768px)");
    if (mq.matches) setMount3D(true);
    const onChange = (e: MediaQueryListEvent) => e.matches && setMount3D(true);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // IntersectionObserver to add 'reveal' class
  useEffect(() => {
    if (!rootRef.current) return;
    const el = rootRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Simple mobile carousel autoplay (respects reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setMobileIndex((s) => (s + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  // Handlers for lightbox
  const openLightbox = (images: ImgItem[], index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
    // lock scroll
    document.body.style.overflow = "hidden";
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  // keyboard nav for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % lightboxImages.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLightboxOpen, lightboxImages]);

  // small helper render for subsections
  function Subsection({
    id,
    title,
    desc,
    images,
    autoplayDelay,
  }: {
    id: string;
    title: string;
    desc: string;
    images: ImgItem[];
    autoplayDelay?: number;
  }) {
    const revealClass = isVisible ? "gallery-reveal" : "gallery-hidden";

    return (
      <section aria-labelledby={id} className={`group ${revealClass}`}>
        <div className="mb-4 sm:flex sm:items-baseline sm:justify-between">
          <div>
            <h4
              id={id}
              className="text-2xl md:text-3xl font-extrabold text-amber-900 tracking-tight font-serif"
              aria-hidden={!isVisible}
            >
              {title}
            </h4>
            <p className="mt-2 text-gray-700 max-w-2xl">{desc}</p>
          </div>

          {/* "View all" button that opens lightbox */}
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={() => openLightbox(images, 0)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md shadow-sm bg-amber-600 text-white hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={`View all images for ${title}`}
            >
              View gallery
            </button>
          </div>
        </div>

        <div className="mt-6">
          {/* Desktop: 3D carousel if mounted; Mobile: lightweight optimized carousel */}
          {mount3D ? (
            <div
              className="w-full rounded-xl shadow-lg overflow-hidden carousel-wrap"
              aria-hidden={!isVisible}
              style={{ transition: "transform 420ms ease, opacity 420ms ease" }}
            >
              {/* Pass images to 3D carousel. Ensure your Carousel3D knows how to render the supplied image objects.
                  Carousel3D should ideally use <img width/height> or the OptimizedImage internally to prevent CLS. */}
              <Carousel3D images={images} autoplay={!prefersReducedMotion} autoplayDelay={autoplayDelay ?? 4200} />
            </div>
          ) : (
            /* Mobile fallback: simple horizontally scrollable slider with OptimizedImage items */
            <div
              className="w-full rounded-xl overflow-x-auto hide-scrollbar carousel-wrap"
              role="region"
              aria-roledescription="carousel"
              aria-label={`${title} carousel`}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex gap-4 py-2 px-1">
                {images.map((img, idx) => (
                  <button
                    key={img.src + idx}
                    onClick={() => openLightbox(images, idx)}
                    className="flex-shrink-0 w-[80vw] sm:w-[45vw] md:w-[33vw] rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500"
                    aria-label={`${img.title ?? "Image"} - ${img.alt ?? ""}`}
                  >
                    <OptimizedImage
                      src={img.src}
                      alt={img.alt ?? img.title ?? "gallery image"}
                      width={img.width ?? 1600}
                      height={img.height ?? 900}
                      aspectRatio="16/9"
                      loading={idx === mobileIndex ? "eager" : "lazy"}
                    />
                    <div className="p-2 text-left bg-white">
                      <div className="text-sm font-semibold text-amber-900">{img.title}</div>
                      <div className="text-xs text-gray-600">{img.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="gallery-heading" className="py-12" ref={rootRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main heading */}
        <div className="mb-10 text-center">
          <h3
            id="gallery-heading"
            className={`text-3xl md:text-4xl font-extrabold text-amber-900 tracking-tight font-serif ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}
            style={{ transition: "opacity 600ms ease, transform 600ms ease" }}
          >
            Gallery
          </h3>

          <div className="mx-auto mt-4" style={{ width: "100%", maxWidth: 560 }}>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #facc15 100%)",
                width: isVisible ? "96%" : "0%",
                margin: "0 auto",
                boxShadow: "0 8px 30px rgba(217,119,6,0.12)",
                transition: "width 700ms cubic-bezier(.2,.9,.3,1)",
              }}
            />
          </div>

          <p className={`mt-4 text-lg text-gray-700 max-w-2xl mx-auto ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`} style={{ transition: "opacity 600ms ease, transform 600ms ease" }}>
            A visual journey through our core initiatives — devotion, compassion, and relief.
          </p>
        </div>

        <div className="space-y-16">
          <Subsection id="religion" title="Religion" desc="Spiritual events, rituals, and community gatherings celebrating devotion and tradition." images={religionImages} autoplayDelay={4200} />
          {/* <Subsection id="charity" title="Yoga Classes" desc="Programs and drives that bring food, shelter, medicine and education to those in need." images={charityImages} autoplayDelay={3800} />
          <Subsection id="covid" title="Covid Relief & Charity" desc="Emergency response, healthcare support, and community assistance during the pandemic." images={covidImages} autoplayDelay={3600} /> */}
        </div>
      </div>

      {/* Lightbox modal (simple, accessible) */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          style={{ background: "rgba(2,6,23,0.7)" }}
        >
          <div
            className="max-w-[90vw] max-h-[90vh] w-full bg-transparent outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={closeLightbox}
                aria-label="Close gallery"
                className="absolute z-10 right-2 top-2 inline-flex items-center justify-center p-2 rounded-full bg-white/90 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                ✕
              </button>

              <div className="w-full h-full flex items-center justify-center">
                <OptimizedImage
                  src={lightboxImages[lightboxIndex].src}
                  alt={lightboxImages[lightboxIndex].alt ?? lightboxImages[lightboxIndex].title}
                  width={lightboxImages[lightboxIndex].width ?? 1600}
                  height={lightboxImages[lightboxIndex].height ?? 900}
                  loading="eager"
                  priority
                />
              </div>

              {/* Prev / Next */}
              <button
                onClick={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}
                aria-label="Previous image"
                className="absolute left-0 top-1/2 -translate-y-1/2 ml-2 p-2 rounded-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                ‹
              </button>
              <button
                onClick={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}
                aria-label="Next image"
                className="absolute right-0 top-1/2 -translate-y-1/2 mr-2 p-2 rounded-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* small helper classes used by this component */
        .gallery-hidden {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 600ms ease, transform 600ms ease;
        }
        .gallery-reveal {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 600ms ease, transform 600ms ease;
        }
        /* hide scrollbar for carousels (optional) */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
