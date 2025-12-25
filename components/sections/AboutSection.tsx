// components/sections/AboutSection.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  Suspense,
  useCallback,
  MutableRefObject,
} from "react";
import { Users, Heart } from "lucide-react";
import dynamic from "next/dynamic";

const TempleViewer = dynamic(
  () => import("@/components/ui/TempleViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        Loading 3D…
      </div>
    ),
  }
);
import PhotoGallery from "../sub-sections/About/Photo-gallery";

/* ------------------------ Helpers / Formatting ------------------------ */

const usePrefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const parseAmount = (raw: any): number => {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^\d.-]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : Math.round(n);
  }
  try {
    const n = Number(raw);
    return isNaN(n) ? 0 : Math.round(n);
  } catch {
    return 0;
  }
};

const formatCompactINR = (value: number) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: value >= 1000 ? 1 : 0,
    }).format(value);
  } catch {
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  }
};

const formatINRPlain = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

/* ------------------------ Animated Number Component ------------------------ */

function AnimatedNumber({
  value,
  isCurrency = false,
  compact = false,
  duration = 1000,
  onFinish,
}: {
  value: number | null;
  isCurrency?: boolean;
  compact?: boolean;
  duration?: number;
  onFinish?: () => void;
}) {
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef<number>(0);
  const [display, setDisplay] = useState<string>(() => {
    if (value == null) return "…";
    if (isCurrency && compact) return formatCompactINR(value);
    if (isCurrency) return `₹${formatINRPlain(value)}`;
    return formatINRPlain(value);
  });

  useEffect(() => {
    if (value == null) {
      setDisplay("…");
      fromRef.current = 0;
      return;
    }
    const to = Math.round(value);
    const from = fromRef.current || 0;
    const start = (ts: number) => {
      startRef.current = ts;
      const step = (now: number) => {
        if (startRef.current == null) {
          return;
        }
        const t = Math.min(1, (now - startRef.current) / duration);
        const curr = Math.round(from + (to - from) * t);
        if (isCurrency && compact) {
          setDisplay(formatCompactINR(curr));
        } else if (isCurrency) {
          setDisplay(`₹${formatINRPlain(curr)}`);
        } else {
          setDisplay(formatINRPlain(curr));
        }
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          fromRef.current = to;
          if (onFinish) onFinish();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    };
    // cancel ongoing
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // start
    requestAnimationFrame(start);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, isCurrency, compact, duration, onFinish]);

  return <>{display}</>;
}

/* ------------------------ Constants for client caching ------------------------ */

const STATS_CACHE_KEY = "bhakta_stats_v1";
const STATS_TTL_MS = 60 * 1000; // 60s TTL — adjust as desired

/* ------------------------ Component ------------------------ */

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const [load3D, setLoad3D] = useState<null | boolean>(null);
  const [userRequested3D, setUserRequested3D] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);

  const statRefs = useRef<Array<HTMLDivElement | null>>([]);
 const prefersReducedMotion = usePrefersReducedMotionSafe();


  /* ---------- Live stats state ---------- */
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [devoteesCount, setDevoteesCount] = useState<number | null>(null);
  const [fundsRaised, setFundsRaised] = useState<number | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  const [scriptCacheUsed, setScriptCacheUsed] = useState(false);

  /* ---------- 3D viewer mount policy ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    setLoad3D(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      if (userRequested3D) {
        if (e.matches) setLoad3D(true);
        return;
      }
      setLoad3D(e.matches);
    };
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      // legacy
      // @ts-ignore
      mq.addListener(handler);
      // @ts-ignore
      return () => mq.removeListener(handler);
    }
  }, [userRequested3D]);

  /* ---------- IntersectionObserver for reveal animation ---------- */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let opened = false;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            statRefs.current.forEach((statEl, idx) => {
              if (!statEl) return;
              statEl.style.transition = `opacity 520ms cubic-bezier(.25,.85,.32,1) ${idx * 120}ms, transform 520ms cubic-bezier(.25,.85,.32,1) ${idx * 120}ms`;
              statEl.style.opacity = "1";
              statEl.style.transform = "translateY(0) scale(1)";
            });
            if (!opened && !prefersReducedMotion) {
              opened = true;
              setTimeout(() => setIsOpen(true), 420);
            }
          }
        });
      },
      { threshold: 0.28, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [prefersReducedMotion]);

  /* ---------- Preload placeholder image ---------- */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/images/temple-placeholder.svg";
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch {}
    };
  }, []);

  /* ---------- webglcontextlost handlers ---------- */
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container) return;
    const onContextLost = (e: Event) => {
      try {
        // @ts-ignore
        if (e && typeof e.preventDefault === "function") e.preventDefault();
      } catch {}
      setTimeout(() => setViewerKey((k) => k + 1), 60);
    };
    const onContextRestored = () => {
      setTimeout(() => setViewerKey((k) => k + 1), 60);
    };
    container.addEventListener("webglcontextlost", onContextLost as EventListener, { passive: false, capture: true });
    container.addEventListener("webglcontextrestored", onContextRestored as EventListener, { capture: true });
    return () => {
      container.removeEventListener("webglcontextlost", onContextLost as EventListener as any);
      container.removeEventListener("webglcontextrestored", onContextRestored as EventListener as any);
    };
  }, [viewerContainerRef.current]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => setViewerKey((k) => k + 1), 80);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /* ---------- public actions ---------- */
  const toggleDecree = () => setIsOpen((v) => !v);
  const request3D = useCallback(() => {
    setUserRequested3D(true);
    setLoad3D(true);
  }, []);
function usePrefersReducedMotionSafe() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
  }, []);

  return reduced;
}

  /* ---------- Fetch + Client Cache + Live detection ---------- */
  useEffect(() => {
    let mounted = true;
    const fetchAndCompute = async () => {
      setLoadingStats(true);
      setStatsError(null);
      setIsLiveData(false);
      setScriptCacheUsed(false);

      // try client cache first
      try {
        const raw = localStorage.getItem(STATS_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && Date.now() - parsed.ts < STATS_TTL_MS) {
            if (!mounted) return;
            setScriptCacheUsed(true);
            const cached = parsed.data;
            // cached may be of shape { devotees, funds } or list of donations
            if (cached && (typeof cached.devotees === "number" || typeof cached.funds === "number")) {
              setDevoteesCount(typeof cached.devotees === "number" ? cached.devotees : null);
              setFundsRaised(typeof cached.funds === "number" ? cached.funds : null);
              setLoadingStats(false);
              return;
            }
            const list = Array.isArray(cached) ? cached : Array.isArray(cached?.donations) ? cached.donations : [];
            if (list.length) {
              // compute donors & total
              const donors = new Set<string>();
              let total = 0;
              for (const item of list) {
                const possibleAmount =
                  item.amount ||
                  item.value ||
                  item.donationAmount ||
                  item.donation ||
                  item.amt ||
                  item.total ||
                  item.amount_paid ||
                  item.paid_amount ||
                  0;
                total += parseAmount(possibleAmount);
                const donorKey =
                  (item.email && String(item.email).trim().toLowerCase()) ||
                  (item.donor_email && String(item.donor_email).trim().toLowerCase()) ||
                  (item.name && String(item.name).trim()) ||
                  (item.donorId && String(item.donorId)) ||
                  (item.id && String(item.id)) ||
                  JSON.stringify({ maybeName: item.name, maybeEmail: item.email }).slice(0, 200);
                if (donorKey) donors.add(donorKey);
              }
              if (!mounted) return;
              setDevoteesCount(donors.size);
              setFundsRaised(total);
              setLoadingStats(false);
              return;
            }
          } else {
            // stale or not present, continue to network fetch
          }
        }
      } catch (e) {
        // ignore cache errors
      }

      // Preferred endpoints order
      const endpoints = ["/api/stats", "/api/admin/donations", "/api/donations", "/api/donations/list"];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { credentials: "include" });
          if (!res.ok) {
            // try next
            continue;
          }
          const data = await res.json();

          // if /api/stats-like response with explicit fields
          if (data && (typeof data.devotees === "number" || typeof data.funds === "number")) {
            if (!mounted) return;
            setDevoteesCount(typeof data.devotees === "number" ? data.devotees : null);
            setFundsRaised(typeof data.funds === "number" ? data.funds : null);
            setIsLiveData(ep === "/api/stats"); // true if directly from aggregator
            setLoadingStats(false);
            // cache the raw data
            try {
              localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
            } catch {}
            return;
          }

          // otherwise expect array or { donations: [...] }
          const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.donations) ? data.donations : [];

          if (!list.length) {
            // try next endpoint
            continue;
          }

          const donors = new Set<string>();
          let total = 0;
          for (const item of list) {
            const possibleAmount =
              item.amount ||
              item.value ||
              item.donationAmount ||
              item.donation ||
              item.amt ||
              item.total ||
              item.amount_paid ||
              item.paid_amount ||
              0;
            total += parseAmount(possibleAmount);
            const donorKey =
              (item.email && String(item.email).trim().toLowerCase()) ||
              (item.donor_email && String(item.donor_email).trim().toLowerCase()) ||
              (item.name && String(item.name).trim()) ||
              (item.donorId && String(item.donorId)) ||
              (item.id && String(item.id)) ||
              JSON.stringify({ maybeName: item.name, maybeEmail: item.email }).slice(0, 200);
            if (donorKey) donors.add(donorKey);
          }

          if (!mounted) return;
          setDevoteesCount(donors.size);
          setFundsRaised(total);
          setIsLiveData(false); // computed from lists, not aggregator
          setLoadingStats(false);
          // cache
          try {
            localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: list }));
          } catch {}
          return;
        } catch (err) {
          // continue to next endpoint
          continue;
        }
      }

      // all failed
      if (mounted) {
        setLoadingStats(false);
        setStatsError("Unable to load donation stats — showing approximate values.");
        setDevoteesCount(null);
        setFundsRaised(null);
      }
    };

    fetchAndCompute();
    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------ Build stats list and hide zeros ------------------------ */
  const computedDevotees = devoteesCount;
  const computedFunds = fundsRaised;

  const statsToRenderRaw = [
    {
      icon: Users,
      value: computedDevotees,
      label: "Devotees Connected",
      isCurrency: false,
      compact: false,
    },
    {
      icon: Heart,
      value: computedFunds,
      label: "Funds Raised",
      isCurrency: true,
      compact: true,
    },
  ];

  // hide numeric zeros automatically, but keep placeholders ("…" or null) visible while loading
  const statsToRender = statsToRenderRaw.filter((s) => {
    // if numeric 0 -> hide
    if (typeof s.value === "number" && s.value === 0) return false;
    return true;
  });

  /* ------------------------ Render ------------------------ */
  return (
    <section id="about" ref={sectionRef} className="py-16 sm:py-20 bg-gradient-to-br from-orange-50 to-amber-50">
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

        {/* MAIN: viewer full width then decree */}
        <main className="mb-12" aria-labelledby="about-heading">
          <div className="flex flex-col gap-6">
            {/* FULL-WIDTH 3D Viewer */}
            <div className="w-full flex items-center justify-center" style={{ minWidth: 0 }}>
              <div
                ref={viewerContainerRef}
                className="w-full rounded-2xl overflow-hidden shadow-lg bg-white"
                style={{
                  height: "clamp(360px, 64vh, 820px)",
                  margin: "0 auto",
                  display: "flex",
                }}
              >
                {load3D === null && (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                    Loading…
                  </div>
                )}

                {load3D === false && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <img
                      src="/images/temple-placeholder.svg"
                      alt="Temple"
                      width={1600}
                      height={900}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      onClick={request3D}
                      className="mt-3 px-4 py-2 text-sm font-medium rounded-lg shadow-sm bg-amber-600 text-white hover:brightness-110"
                    >
                      Load 3D Viewer
                    </button>
                  </div>
                )}
{load3D === true && (
  <div key={`temple-viewer-${viewerKey}`} style={{ width: "100%", height: "100%" }}>
    <TempleViewer />
  </div>
)}

              </div>
            </div>

            <br />
            {/* ROYAL DECREE — BELOW THE VIEWER */}
            <div className="w-full flex justify-center">
              <div className="relative w-full max-w-3xl">
                {/* Top handle */}
                <div aria-hidden className="absolute left-0 right-0 h-6 -top-6 z-20 pointer-events-none">
                  <div className="mx-auto w-36 h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-sm" />
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
                    transition: "max-height 420ms ease",
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
                    <style>{`
                      #decree-content::-webkit-scrollbar { width: 8px; }
                      #decree-content::-webkit-scrollbar-track { background: #fbe8c2; border-radius: 4px; }
                      #decree-content::-webkit-scrollbar-thumb { background: #b45309; border-radius: 4px; }
                      #decree-content::-webkit-scrollbar-thumb:hover { background: #92400e; }
                    `}</style>

                    <div className="space-y-4 font-serif text-amber-900">
                      <h3 className="text-2xl text-center sm:text-3xl font-bold">Compassion & Purpose ॐ</h3>

                      <p className="leading-relaxed text-[15px] sm:text-base">
                        Bardhaman Bhakta Sanmilani is committed to uplifting society through cultural, moral, social,
                        and spiritual development built upon compassion, service, and collective responsibility.
                      </p>

                      <p className="leading-relaxed text-[15px] sm:text-base">
                        Our efforts support the elderly, empower the underprivileged, promote education, expand medical
                        care, encourage yoga, and uplift women through self-reliance programs cultivating harmony and
                        human values.
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
                        To strengthen these initiatives, we are developing essential infrastructure — including a
                        community hall and the <b>largest Krishna Temple in Purba Bardhaman</b>. With collective support,
                        we aim to build a society rooted in dignity, harmony, and shared values.
                      </p>
                    </div>
                  </div>

                  {/* Collapsed hint */}
                  {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-widest uppercase pointer-events-none bg-transparent text-amber-900">
                      Tap to open royal decree
                    </div>
                  )}
                </div>

                {/* Bottom handle (subtle) */}
                <div aria-hidden className="absolute left-0 right-0 h-6 -bottom-6 z-10 pointer-events-none">
                  <div className="mx-auto w-36 h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          <br />

          {/* Stats Section header with live badge */}
          <div className="flex items-center justify-center mb-3">
            <div className="inline-flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-700">Community Stats</h3>
              {isLiveData && !loadingStats && (
                <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium text-emerald-800 bg-emerald-100 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  Live
                </span>
              )}
              {scriptCacheUsed && !isLiveData && (
                <span className="px-2 py-0.5 text-xs text-gray-700 bg-gray-100 rounded-full">cached</span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 my-8">
            {statsToRender.length === 0 && !loadingStats ? (
              <div className="col-span-2 text-center text-sm text-gray-500">No community stats to display.</div>
            ) : null}

            {statsToRender.map((stat, index) => {
              const Icon = stat.icon as React.ComponentType<any>;
              return (
                <div
                  key={index}
                  ref={(el) => {
                    statRefs.current[index] = el;
                  }}
                  className="p-4 text-center bg-white rounded-xl shadow transform transition"
                  style={{ opacity: 0, transform: "translateY(18px) scale(0.98)" }}
                >
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 shadow-inner">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>

                  <h4 className="text-2xl font-bold">
                    {loadingStats && stat.value == null ? (
                      "…"
                    ) : typeof stat.value === "number" ? (
                      // If currency + compact, animate numeric then show compact formatting
                      stat.isCurrency ? (
                        <AnimatedNumber value={stat.value ?? 0} isCurrency compact duration={1200} />
                      ) : (
                        <AnimatedNumber value={stat.value ?? 0} duration={1000} />
                      )
                    ) : (
                      "…"
                    )}
                  </h4>

                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* display error note if fetch failed */}
          {statsError && (
            <div className="text-sm text-center text-rose-600 mb-4">
              {statsError} (inspect <code>/api/stats</code> or <code>/api/admin/donations</code>)
            </div>
          )}
        </main>

        <PhotoGallery />
      </div>
    </section>
  );
};

export default AboutSection;
