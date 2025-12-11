// components/sections/AboutSection.tsx
"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Users, Heart, Globe, Award } from "lucide-react";
const TempleViewer = React.lazy(() => import("@/components/ui/TempleViewer"));
import PhotoGallery from "../sub-sections/About/Photo-gallery";

/* ---------- data ---------- */
const stats = [
  { icon: Users, value: "10,000+", label: "Devotees Connected" },
  { icon: Heart, value: "₹50L+", label: "Funds Raised" },
  { icon: Globe, value: "25+", label: "Cities Reached" },
  { icon: Award, value: "100+", label: "Projects Completed" },
];

const usePrefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [load3D, setLoad3D] = useState(false);
  const statRefs = useRef<Array<HTMLDivElement | null>>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Auto-enable 3D ONLY on >=768px -- prevents WebGL init on phones
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    if (mq.matches) setLoad3D(true);
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setLoad3D(true);
    };
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // Intersection observer: reveal section, auto-open decree (unless reduced motion)
  useEffect(() => {
    if (!sectionRef.current) return;
    let opened = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setVisible(true);
          // reveal stats
          statRefs.current.forEach((el, idx) => {
            if (el) {
              el.style.transition = `opacity 520ms cubic-bezier(.2,.9,.3,1) ${idx * 120}ms, transform 520ms cubic-bezier(.2,.9,.3,1) ${idx * 120}ms`;
              el.style.opacity = "1";
              el.style.transform = "translateY(0) scale(1)";
            }
          });

          if (!opened && !prefersReducedMotion) {
            opened = true;
            setTimeout(() => setIsOpen(true), 420);
          }
        });
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, [prefersReducedMotion]);

  // preload placeholder for slightly better LCP (optional; best in head)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/images/temple-placeholder.jpg";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const toggleDecree = () => setIsOpen((v) => !v);
  const requestLoad3D = () => setLoad3D(true);

  return (
    <section id="about" ref={sectionRef} className="py-16 sm:py-20 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
            About{" "}
            <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
              Bhakta Sammilan
            </span>
          </h2>
          <div className="mx-auto w-20 h-1 mb-6 rounded-full bg-gradient-to-r from-orange-600 to-amber-600" />
        </header>

        <main className="mb-12" role="main" aria-labelledby="about-heading">
          <div className="flex flex-col md:flex-row md:items-start md:gap-10">
            {/* LEFT: Temple viewer container
                We reserve layout space with CSS (clamp + aspect-ratio), and use a placeholder image with explicit dimensions to avoid CLS.
             */}
            <div className="w-full md:flex-1 flex items-center justify-center" style={{ minWidth: 0 }}>
              <div
                className="w-full rounded-2xl overflow-hidden shadow-lg bg-white"
                style={{
                  // reserve space for the viewer (clamp prevents huge reflows)
                  height: "clamp(360px, 64vh, 820px)",
                  maxWidth: 1200,
                  margin: "0 auto",
                  display: "flex",
                }}
                aria-hidden={!visible}
              >
                {/* Placeholder image (include width/height attrs in markup or via CSS) */}
                {!load3D && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <img
                      src="/images/temple-placeholder.jpg"
                      alt="Temple"
                      width={1600}
                      height={900}
                      loading="eager"
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                    <div className="mt-3">
                      <button
                        onClick={requestLoad3D}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm bg-amber-600 text-white hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        Load 3D Viewer
                      </button>
                    </div>
                  </div>
                )}

                {/* Lazy-loaded 3D viewer - Suspense fallback is lightweight */}
                {load3D && (
                  <div className="w-full h-full">
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Loading 3D…</div>}>
                      <TempleViewer />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Decree / parchment */}
            <div className="mt-6 md:mt-0 md:w-[460px] flex-shrink-0 flex justify-center">
              <div className="relative w-full max-w-xl">
                {/* Top decorative handle (visual only) */}
                <div aria-hidden className="absolute left-0 right-0 z-20 h-6 mx-8 -top-3 pointer-events-none">
                  <div className="w-full h-6 rounded-full shadow-sm bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900/90">
                    <div className="w-full h-2 mt-2 rounded-full bg-amber-700/80" />
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={toggleDecree}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleDecree();
                    }
                  }}
                  className="relative w-full mx-auto bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 rounded-xl shadow-xl overflow-hidden transition-shadow"
                  style={{
                    borderLeft: "3px solid #d97706",
                    borderRight: "3px solid #d97706",
                    // Reserve a collapsed height value to avoid layout shift:
                    minHeight: 56,
                    maxHeight: isOpen ? 520 : 56,
                  }}
                >
                  {/* Content container uses transform + opacity to animate (no height anim) */}
                  <div
                    id="decree-content"
                    ref={contentRef}
                    className="relative z-10 p-6 max-h-[520px] overflow-y-auto"
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? "translateY(0)" : "translateY(-6px)",
                      transition: "opacity 420ms ease, transform 420ms ease",
                    }}
                  >
                    <div className="space-y-4 font-serif text-amber-800">
                      <h3 id="about-heading" className="mb-2 text-2xl font-bold text-center text-amber-900 sm:text-3xl">
                        Compassion ॐ
                      </h3>
                      <p className="text-base leading-relaxed text-amber-900/95 sm:text-lg">
                        Bhakta Sammilan is a sacred gathering ... (content kept)
                      </p>
                      <p className="text-base leading-relaxed text-amber-900/95 sm:text-lg">
                        Our mission is to create a harmonious society ...
                      </p>
                    </div>
                  </div>

                  {!isOpen && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      <div className="px-3 py-1 text-xs font-semibold tracking-widest uppercase rounded-full bg-amber-900/10 text-amber-900">
                        Tap to open royal decree
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom decorative handle */}
                <div aria-hidden className="absolute left-0 right-0 z-20 h-6 mx-8 -bottom-3 pointer-events-none">
                  <div className="w-full h-6 rounded-full shadow-sm bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900/90">
                    <div className="w-full h-2 rounded-full bg-amber-700/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - initial state hidden -> revealed via IntersectionObserver */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 my-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  ref={(el) => (statRefs.current[index] = el)}
                  className="p-4 text-center bg-white rounded-xl shadow transform transition will-change-transform"
                  style={{ opacity: 0, transform: "translateY(18px) scale(0.98)" }}
                >
                  <div className="inline-flex items-center justify-center mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 shadow-inner">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="mb-1 text-2xl font-bold text-gray-900">{stat.value}</h4>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </main>

        {/* Gallery */}
        <div>
          <PhotoGallery />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
