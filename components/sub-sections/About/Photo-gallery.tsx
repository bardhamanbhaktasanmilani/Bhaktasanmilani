"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Carousel3D = dynamic(() => import("@/components/ui/Carousel3D"), { ssr: false });

type ImgItem = {
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
};

const religionImages: ImgItem[] = [
  { src: "/About/religious/religious1.AVIF", alt: "Devotees in prayer", title: "Morning Prayers", subtitle: "Devotees gather for the dawn ceremony", width: 1600, height: 900 },
  { src: "/About/religious/religious2.AVIF", alt: "Temple procession", title: "Temple Procession", subtitle: "A colourful procession of faith and unity", width: 1600, height: 900 },
  { src: "/About/religious/religious3.AVIF", alt: "Ritual offerings", title: "Ritual Offerings", subtitle: "Offerings presented with reverence", width: 1600, height: 900 },
  { src: "/About/religious/religious4.AVIF", alt: "Evening aarti", title: "Evening Aarti", subtitle: "The sacred aarti at dusk", width: 1600, height: 900 },
  { src: "/About/religious/religious5.AVIF", alt: "Community chanting", title: "Community Chanting", subtitle: "Collective bhajans & kirtans", width: 1600, height: 900 },
];

const charityImages: ImgItem[] = [
  { src: "/About/Yoga/yoga1.AVIF", alt: "Feeding the needy", title: "Community Kitchen", subtitle: "Meals prepared and shared daily", width: 1600, height: 900 },
  { src: "/About/Yoga/yoga2.AVIF", alt: "Clothes distribution", title: "Clothes Drive", subtitle: "Warm clothes distributed across cities", width: 1600, height: 900 },
  { src: "/About/Yoga/yoga3.AVIF", alt: "Medical camp", title: "Medical Camp", subtitle: "Free checkups & basic treatment", width: 1600, height: 900 },
  { src: "/About/Yoga/yoga4.AVIF", alt: "Education support", title: "Education Support", subtitle: "Stationery and tuition for children", width: 1600, height: 900 },
  { src: "/About/Yoga/yoga5.AVIF", alt: "Tree plantation", title: "Green Drive", subtitle: "Tree plantation & environmental care", width: 1600, height: 900 },
];

const covidImages: ImgItem[] = [
  { src: "/About/charity/charity1.AVIF", alt: "Vaccine awareness", title: "Vaccination Drive", subtitle: "Vaccines administered safely", width: 1600, height: 900 },
  { src: "/About/charity/charity2.AVIF", alt: "Relief supplies", title: "Relief Supplies", subtitle: "Medicine & oxygen supply distribution", width: 1600, height: 900 },
  { src: "/About/charity/charity3.AVIF", alt: "Testing camp", title: "Testing Camps", subtitle: "Rapid testing & safety education", width: 1600, height: 900 },
  { src: "/About/charity/charity4.AVIF", alt: "Volunteer support", title: "Volunteer Network", subtitle: "Volunteers coordinating aid and logistics", width: 1600, height: 900 },
  { src: "/About/charity/charity5.AVIF", alt: "Isolation care", title: "Isolation Support", subtitle: "Safe care & quarantine assistance", width: 1600, height: 900 },
];

const usePrefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PhotoGallery() {
  const rootRef = useRef<HTMLElement | null>(null);
  const religionRef = useRef<HTMLElement | null>(null);
  const charityRef = useRef<HTMLElement | null>(null);
  const covidRef = useRef<HTMLElement | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [mobileIndex, setMobileIndex] = useState(0);
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<ImgItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [mount3D, setMount3D] = useState(false);

  // mount 3D only for wider screens
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width:768px)");
    if (mq.matches) setMount3D(true);
    const onChange = (e: MediaQueryListEvent) => e.matches && setMount3D(true);
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange);
    };
  }, []);

  // Observe when section enters viewport — used to gate autoplay & animations
  useEffect(() => {
    if (!rootRef.current || typeof IntersectionObserver === "undefined") return;
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
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  // Mobile scroller autoplay — START only after gallery is visible (fixes early first-image flashes)
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!isVisible) return; // <-- only start when visible
    const timer = setInterval(() => setMobileIndex((s) => (s + 1) % 5), 4500);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, isVisible]);

  const openLightbox = (images: ImgItem[], index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

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

  /* ---------------------------
     SUBMENU DECLARATION
     --------------------------- */
  const submenus = [
    { id: "religion", label: "Religion" },
    { id: "yoga", label: "Yoga Classes" },
    { id: "covid", label: "Covid Relief & Charity" },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("gallery:submenus", { detail: submenus }));
  }, []);

  /* ---------------------------
     Navigation events (scrolling)
     --------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const scrollToId = (id?: string) => {
      if (!id) {
        const heading = document.getElementById("gallery-heading");
        if (heading) heading.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const map: Record<string, HTMLElement | null> = {
        religion: religionRef.current,
        charity: charityRef.current,
        covid: covidRef.current,
      };
      const target = map[id];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("gallery-scroll-highlight");
        setTimeout(() => target.classList.remove("gallery-scroll-highlight"), 1400);
      } else {
        const heading = document.getElementById("gallery-heading");
        if (heading) heading.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      scrollToId(d.section);
    };

    window.addEventListener("gallery:navigate", handler as EventListener);
    window.addEventListener("nav:gotoGallery", () => scrollToId(undefined));
    window.addEventListener("nav:gotoGallerySection", handler as EventListener);

    const onHash = () => {
      const hash = location.hash.replace("#", "");
      if (!hash.startsWith("gallery")) return;
      const parts = hash.split("/");
      const section = parts[1];
      scrollToId(section);
    };
    window.addEventListener("hashchange", onHash);
    setTimeout(onHash, 40);

    return () => {
      window.removeEventListener("gallery:navigate", handler as EventListener);
      window.removeEventListener("nav:gotoGallerySection", handler as EventListener);
      window.removeEventListener("nav:gotoGallery", () => {});
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  /* ---------------------------
     Subsection helper
     --------------------------- */
  function Subsection({ id, title, desc, images, autoplayDelay }: { id: string; title: string; desc: string; images: ImgItem[]; autoplayDelay?: number }) {
    const revealClass = isVisible ? "gallery-reveal" : "gallery-hidden";

    const refMap: Record<string, React.RefObject<HTMLElement> | null> = {
      religion: religionRef,
      charity: charityRef,
      covid: covidRef,
    };

    return (
      <section id={`gallery-${id}`} ref={refMap[id]} aria-labelledby={`gallery-${id}-label`} className={`group ${revealClass} relative py-2`}>
        <div className="mb-4 sm:flex sm:items-baseline sm:justify-between">
          <div>
            <h4 id={`gallery-${id}-label`} className="text-2xl md:text-3xl font-extrabold text-amber-900 tracking-tight font-serif" aria-hidden={!isVisible}>
              {title}
            </h4>
            <p className="mt-2 text-gray-700 max-w-2xl">{desc}</p>
          </div>

          <div className="mt-4 sm:mt-0 sm:ml-4">
            <button type="button" onClick={() => openLightbox(images, 0)} className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md shadow-sm bg-amber-600 text-white hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label={`View all images for ${title}`}>
              View gallery
            </button>
          </div>
        </div>

        <div className="mt-6">
          {mount3D ? (
            // Important: gate autoplay on `isVisible` to prevent early first-image jumps
            <div className="w-full rounded-xl shadow-lg overflow-visible carousel-wrap" aria-hidden={!isVisible} style={{ transition: "transform 420ms ease, opacity 420ms ease" }}>
              <Carousel3D images={images} autoplay={!prefersReducedMotion && isVisible} autoplayDelay={autoplayDelay ?? 4200} />
            </div>
          ) : (
            <div className="w-full rounded-xl overflow-x-auto hide-scrollbar carousel-wrap" role="region" aria-roledescription="carousel" aria-label={`${title} carousel`} style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="flex gap-4 py-2 px-1">
                {images.map((img, idx) => (
                  <button key={img.src + idx} onClick={() => openLightbox(images, idx)} className="flex-shrink-0 w-[80vw] sm:w-[45vw] md:w-[33vw] rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label={`${img.title ?? "Image"} - ${img.alt ?? ""}`}>
                    <img
                      src={img.src}
                      alt={img.alt ?? img.title ?? "gallery image"}
                      width={img.width ?? 1600}
                      height={img.height ?? 900}
                      loading={idx === mobileIndex ? "eager" : "lazy"}
                      style={{ aspectRatio: "16 / 9", width: "100%", height: "auto" }}
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
        <div className="mb-10 text-center">
          <h3 id="gallery-heading" className={`text-3xl md:text-4xl font-extrabold text-amber-900 tracking-tight font-serif ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`} style={{ transition: "opacity 600ms ease, transform 600ms ease" }}>
            Gallery
          </h3>

          <div className="mx-auto mt-4" style={{ width: "100%", maxWidth: 560 }}>
            <div style={{ height: 6, borderRadius: 999, background: "linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #facc15 100%)", width: isVisible ? "96%" : "0%", margin: "0 auto", boxShadow: "0 8px 30px rgba(217,119,6,0.12)", transition: "width 700ms cubic-bezier(.2,.9,.3,1)" }} />
          </div>

          <p className={`mt-4 text-lg text-gray-700 max-w-2xl mx-auto ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`} style={{ transition: "opacity 600ms ease, transform 600ms ease" }}>
            A visual journey through our core initiatives — devotion, compassion, and relief.
          </p>
        </div>

        <div className="space-y-16">
          <Subsection id="religion" title="Religion" desc="Spiritual events, rituals, and community gatherings celebrating devotion and tradition." images={religionImages} autoplayDelay={4200} />
          <Subsection id="charity" title="Yoga Classes" desc="Programs and drives that bring food, shelter, medicine and education to those in need." images={charityImages} autoplayDelay={3800} />
          <Subsection id="covid" title="Covid Relief & Charity" desc="Emergency response, healthcare support, and community assistance during the pandemic." images={covidImages} autoplayDelay={3600} />
        </div>
      </div>

      {/* Lightbox modal */}
      {isLightboxOpen && (
        <div role="dialog" aria-modal="true" aria-label="Image gallery" className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeLightbox} style={{ background: "rgba(2,6,23,0.7)" }}>
          <div className="max-w-[90vw] max-h-[90vh] w-full bg-transparent outline-none" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button onClick={closeLightbox} aria-label="Close gallery" className="absolute z-10 right-2 top-2 inline-flex items-center justify-center p-2 rounded-full bg-white/90 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">✕</button>

              <div className="w-full h-full flex items-center justify-center">
                <img src={lightboxImages[lightboxIndex].src} alt={lightboxImages[lightboxIndex].alt || lightboxImages[lightboxIndex].title || "Gallery image"} width={lightboxImages[lightboxIndex].width ?? 1600} height={lightboxImages[lightboxIndex].height ?? 900} loading="eager" />
              </div>

              <button onClick={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)} aria-label="Previous image" className="absolute left-0 top-1/2 -translate-y-1/2 ml-2 p-2 rounded-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500">‹</button>
              <button onClick={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)} aria-label="Next image" className="absolute right-0 top-1/2 -translate-y-1/2 mr-2 p-2 rounded-full bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500">›</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* highlight when navigated to a subsection */
        .gallery-scroll-highlight {
          box-shadow: 0 10px 40px rgba(245, 158, 11, 0.12), 0 0 0 6px rgba(245, 158, 11, 0.06) !important;
          transform: translateY(-4px);
          transition: box-shadow 420ms ease, transform 420ms ease;
        }
      `}</style>
    </section>
  );
}
