"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

type ImgItem = {
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
};

/* ================= DEVICE HELPERS ================= */
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ================= COMPONENT ================= */
export default function Carousel3D({
  images = [],
  autoplay = true,
  autoplayDelay = 3500,
}: {
  images?: ImgItem[];
  autoplay?: boolean;
  autoplayDelay?: number;
}) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const autoplayRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [ready, setReady] = useState(false);

  const ios = isIOS();
  const reduceMotion = prefersReducedMotion();

  /* ================= INITIAL READY ================= */
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(id);
  }, []);

  /* ================= KEYBOARD ================= */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ================= AUTOPLAY ================= */
  useEffect(() => {
    if (!autoplay || count <= 1 || reduceMotion) return;

    clearAutoplay();
    autoplayRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, autoplayDelay);

    return clearAutoplay;
  }, [autoplay, autoplayDelay, count, reduceMotion]);

  /* ================= VISIBILITY (iOS MEMORY SAFETY) ================= */
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) clearAutoplay();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function clearAutoplay() {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }

  function prev() {
    setIndex((i) => (i - 1 + count) % count);
  }
  function next() {
    setIndex((i) => (i + 1) % count);
  }
  function goTo(i: number) {
    setIndex(((i % count) + count) % count);
  }

  /* ================= CARD STYLE ================= */
  const cardStyleFor = useMemo(() => {
    return (pos: number) => {
      const half = Math.floor(count / 2);
      let d = pos - index;
      if (d > half) d -= count;
      if (d < -half) d += count;

      const abs = Math.abs(d);

      /* iOS: flatten depth a bit to reduce repaint cost */
      const xGap = ios ? 190 : 220;
      const x = d * xGap;
      const z = ios ? -Math.min(120 + abs * 120, 640) : -Math.min(140 + abs * 160, 900);
      const rotY = ios ? d * -7 : d * -10;

      const scale = d === 0 ? 1.18 : Math.max(0.72, 1 - 0.12 * abs);
      const opacity = d === 0 ? 1 : Math.max(0.28, 1 - 0.26 * abs);
      const zIndex = 2000 - abs;

      return {
        transform: `translate3d(${x}px, ${Math.min(24 * abs, 70)}px, ${z}px) rotateY(${rotY}deg) scale(${scale})`,
        opacity,
        zIndex,
        pointerEvents: d === 0 ? "auto" : "none",
      } as React.CSSProperties;
    };
  }, [count, index, ios]);

  return (
    <>
      {/* ================= STYLES ================= */}
      <style jsx>{`
        .carousel-wrap {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          perspective: ${ios ? "1200px" : "1800px"};
          user-select: none;
          overflow: visible;
          touch-action: pan-y;
        }

        .stage {
          width: 100%;
          height: 380px;
          position: relative;
          transform-style: preserve-3d;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stage[data-ready="true"] {
          transition: transform 600ms cubic-bezier(.2,.8,.2,1);
        }

        .card {
          position: absolute;
          width: 560px;
          height: 340px;
          border-radius: 12px;
          overflow: hidden;
          background: #0b0b0b;
          display: flex;
          align-items: flex-end;
          cursor: pointer;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform, opacity;
          box-shadow: 0 22px 70px rgba(0,0,0,0.6);
        }

        .card[data-ready="true"] {
          transition: transform 680ms cubic-bezier(.2,.8,.2,1), opacity 360ms ease;
        }

        .image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          pointer-events: none;
        }

        .overlay {
          position: relative;
          width: 100%;
          padding: 24px;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.85) 100%);
          color: #fff;
        }

        .title {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 14px;
          opacity: .92;
          max-width: 75%;
        }

        .arrow {
          width: 60px;
          height: 60px;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,.06);
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .arrow.left { left: -20px; }
        .arrow.right { right: -20px; }

        .chev {
          width: 18px;
          height: 18px;
          border-right: 2.5px solid #fff;
          border-bottom: 2.5px solid #fff;
        }

        .arrow.left .chev { transform: rotate(135deg); }
        .arrow.right .chev { transform: rotate(-45deg); }

        .dots {
          position: absolute;
          bottom: -34px;
          display: flex;
          gap: 10px;
          left: 50%;
          transform: translateX(-50%);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.25);
        }

        .dot.active {
          background: #fff;
          transform: scale(1.25);
        }

        @media (max-width: 640px) {
          .carousel-wrap {
            height: 320px;
            padding: 0 16px;
          }
          .card {
            width: 360px;
            height: 240px;
          }
          .arrow {
            display: none;
          }
          .title {
            font-size: 16px;
          }
          .subtitle {
            font-size: 12px;
            max-width: 100%;
          }
        }
      `}</style>

      {/* ================= MARKUP ================= */}
      <div
        className="carousel-wrap"
        ref={containerRef}
        onMouseEnter={!ios ? clearAutoplay : undefined}
        onMouseLeave={
          !ios && autoplay
            ? () => {
                clearAutoplay();
                autoplayRef.current = window.setInterval(
                  () => setIndex((i) => (i + 1) % count),
                  autoplayDelay
                );
              }
            : undefined
        }
      >
        {!ios && (
          <div className="arrow left" onClick={prev}>
            <span className="chev" />
          </div>
        )}

        <div className="stage" data-ready={ready ? "true" : "false"}>
          {images.map((it, i) => {
            const style = cardStyleFor(i);
            return (
              <div
                key={i}
                className="card"
                style={style}
                data-ready={ready ? "true" : "false"}
                onClick={() => goTo(i)}
              >
                <div
                  className="image"
                  style={{ backgroundImage: `url(${it.src})` }}
                />
                <div className="overlay">
                  <div className="title">{it.title || it.alt}</div>
                  <div className="subtitle">{it.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>

        {!ios && (
          <div className="arrow right" onClick={next}>
            <span className="chev" />
          </div>
        )}

        <div className="dots">
          {images.map((_, i) => (
            <div
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
