// components/sections/AboutSection.tsx
"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Users, Heart, Globe, Award } from "lucide-react";
const TempleViewer = React.lazy(() => import("@/components/ui/TempleViewer"));
import PhotoGallery from "../sub-sections/About/Photo-gallery";

/* ---------- stats data ---------- */
const stats = [
  { icon: Users, value: "10,000+", label: "Devotees Connected" },
  { icon: Heart, value: "₹50L+", label: "Funds Raised" },
  { icon: Globe, value: "25+", label: "Cities Reached" },
  { icon: Award, value: "100+", label: "Projects Completed" },
];

/* ---------- user prefers reduced motion ---------- */
const usePrefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  /** ❗ Hydration Fix:
   * load3D === null → SSR placeholder safe
   * load3D === false → mobile/placeholder
   * load3D === true → 3D viewer enabled
   */
  const [load3D, setLoad3D] = useState<null | boolean>(null);

  const statRefs = useRef<Array<HTMLDivElement | null>>([]);

  const prefersReducedMotion = usePrefersReducedMotion();

  /* ---------- enable 3D only after hydration ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 768px)");

    // Client-only decision → Fix hydration mismatch
    setLoad3D(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setLoad3D(e.matches);
    };

    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  /* ---------- reveal animation observer ---------- */
  useEffect(() => {
    if (!sectionRef.current) return;

    let opened = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          setVisible(true);

          statRefs.current.forEach((el, idx) => {
            if (!el) return;
            el.style.transition = `opacity 520ms cubic-bezier(.25,.85,.32,1) ${
              idx * 120
            }ms, transform 520ms cubic-bezier(.25,.85,.32,1) ${
              idx * 120
            }ms`;
            el.style.opacity = "1";
            el.style.transform = "translateY(0) scale(1)";
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

  /* ---------- preload image ---------- */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/images/temple-placeholder.jpg";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const toggleDecree = () => setIsOpen((v) => !v);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-16 sm:py-20 bg-gradient-to-br from-orange-50 to-amber-50"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
            About{" "}
            <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
              BhaktaSammilani
            </span>
          </h2>
          <div className="mx-auto w-20 h-1 mb-6 rounded-full bg-gradient-to-r from-orange-600 to-amber-600" />
        </header>

        {/* MAIN LAYOUT */}
        <main className="mb-12" aria-labelledby="about-heading">
          <div className="flex flex-col md:flex-row md:gap-10">
            
            {/* LEFT — 3D Viewer */}
            <div className="w-full md:flex-1 flex items-center justify-center" style={{ minWidth: 0 }}>
              <div
                className="w-full rounded-2xl overflow-hidden shadow-lg bg-white"
                style={{
                  height: "clamp(360px, 64vh, 820px)",
                  maxWidth: 1200,
                  margin: "0 auto",
                  display: "flex",
                }}
              >
                {/* ---------- Hydration-Safe Conditional Rendering ---------- */}

                {load3D === null && (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                    Loading…
                  </div>
                )}

                {load3D === false && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <img
                      src="/images/temple-placeholder.jpg"
                      alt="Temple"
                      width={1600}
                      height={900}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      onClick={() => setLoad3D(true)}
                      className="mt-3 px-4 py-2 text-sm font-medium rounded-lg shadow-sm bg-amber-600 text-white hover:brightness-110"
                    >
                      Load 3D Viewer
                    </button>
                  </div>
                )}

                {load3D === true && (
                  <Suspense
                    fallback={<div className="w-full h-full flex items-center justify-center text-sm text-gray-500">Loading 3D…</div>}
                  >
                    <TempleViewer />
                  </Suspense>
                )}
              </div>
            </div>

            {/* RIGHT — Royal Decree */}
            <div className="mt-6 md:mt-0 md:w-[460px] flex-shrink-0 flex justify-center">
              <div className="relative w-full max-w-xl">

                {/* Top handle */}
                <div aria-hidden className="absolute left-0 right-0 h-6 mx-8 -top-3 z-20 pointer-events-none">
                  <div className="w-full h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-sm">
                    <div className="w-full h-2 mt-2 rounded-full bg-amber-700/80" />
                  </div>
                </div>

                {/* Decree Container */}
                <div
                  className="relative w-full bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 rounded-xl shadow-xl overflow-hidden"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={toggleDecree}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleDecree()}
                  style={{
                    borderLeft: "3px solid #d97706",
                    borderRight: "3px solid #d97706",
                    minHeight: 56,
                    maxHeight: isOpen ? 520 : 56,
                  }}
                >
                  {/* Decree Content */}
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
                    {/* Custom Scrollbar */}
                    <style>{`
                      #decree-content::-webkit-scrollbar { width: 8px; }
                      #decree-content::-webkit-scrollbar-track { background: #fbe8c2; border-radius: 4px; }
                      #decree-content::-webkit-scrollbar-thumb { background: #b45309; border-radius: 4px; }
                      #decree-content::-webkit-scrollbar-thumb:hover { background: #92400e; }
                    `}</style>

                    {/* Content */}
                    <div className="space-y-4 font-serif text-amber-900">

                      <h3 className="text-2xl text-center sm:text-3xl font-bold">Compassion & Purpose ॐ</h3>

                      <p className="leading-relaxed text-[15px] sm:text-base">
                        Bardhaman Bhakta Sanmilani is committed to uplifting society through
                        cultural, moral, social, and spiritual development — built upon compassion,
                        service, and collective responsibility.
                      </p>

                      <p className="leading-relaxed text-[15px] sm:text-base">
                        Our efforts support the elderly, empower the underprivileged, promote
                        education, expand medical care, encourage yoga, and uplift women through
                        self-reliance programs — cultivating harmony and human values.
                      </p>

                      <h4 className="font-bold text-lg pt-2">Our Core Objectives:</h4>

                      <ul className="list-disc pl-5 space-y-2 text-[15px] sm:text-base">
                        <li>Support and care for elderly members of society.</li>
                        <li>Provide free medical treatment for needy families.</li>
                        <li>Organize year-round yoga and wellness programs.</li>
                        <li>Distribute clothing to underprivileged individuals.</li>
                        <li>Offer free education for children, adults, and the elderly.</li>
                        <li>Empower women with self-help and skill-development programs.</li>
                        <li>Promote cultural, social, and spiritual awareness.</li>
                        <li>Host religious festivals and community gatherings.</li>
                      </ul>

                      <p className="leading-relaxed text-[15px] sm:text-base pt-2">
                        To strengthen these initiatives, we are developing essential infrastructure —
                        including a community hall and the **largest Krishna Temple in Purba
                        Bardhaman**. With collective support, we aim to build a society rooted in
                        dignity, harmony, and shared values.
                      </p>
                    </div>
                  </div>

                  {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-widest uppercase pointer-events-none bg-transparent text-amber-900">
                      Tap to open royal decree
                    </div>
                  )}
                </div>

                {/* Bottom handle */}
                <div aria-hidden className="absolute left-0 right-0 h-6 mx-8 -bottom-3 z-20 pointer-events-none">
                  <div className="w-full h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-sm">
                    <div className="w-full h-2 rounded-full bg-amber-700/80" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 my-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  ref={(el) => (statRefs.current[index] = el)}
                  className="p-4 text-center bg-white rounded-xl shadow transform transition"
                  style={{ opacity: 0, transform: "translateY(18px) scale(0.98)" }}
                >
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 shadow-inner">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="text-2xl font-bold">{stat.value}</h4>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </main>

        <PhotoGallery />
      </div>
    </section>
  );
};

export default AboutSection;
