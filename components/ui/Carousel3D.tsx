"use client";

import React, { useEffect, useRef, useState } from "react";

type ImgItem = { src: string; alt?: string; title?: string; subtitle?: string };

export default function Carousel3D({
  images = [
    {
      src: "/about/guardians.jpg",
      alt: "Guardians Of The Galaxy",
      title: "Guardians Of The Galaxy",
      subtitle: "A group of intergalactic criminals...",
    },
    {
      src: "/about/thor.jpg",
      alt: "Thor: Ragnarok",
      title: "Thor: Ragnarok",
      subtitle: "Imprisoned on the planet Sakaar...",
    },
    { src: "/about/batman.jpg", alt: "Batman", title: "Batman", subtitle: "Dark knight protects the city..." },
    { src: "/about/spiderman.jpg", alt: "Spiderman", title: "Spiderman", subtitle: "Friendly neighbourhood hero..." },
    { src: "/about/wonder.jpg", alt: "Wonder Woman", title: "Wonder Woman", subtitle: "Amazonian warrior princess..." },
  ] as ImgItem[],
  autoplay = true,
  autoplayDelay = 3500,
}: {
  images?: ImgItem[];
  autoplay?: boolean;
  autoplayDelay?: number;
}) {
  const count = (images || []).length;
  const [index, setIndex] = useState(0);
  const autoplayRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);


  const [ready, setReady] = useState(false);

  useEffect(() => {
   
    const id = window.setTimeout(() => setReady(true), 50);
    return () => window.clearTimeout(id);
  }, []);

 
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
   
  }, []);

 
  useEffect(() => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }

    if (!autoplay || count <= 1) return;

    autoplayRef.current = window.setInterval(() => {
      setIndex((s) => (s + 1) % count);
    }, autoplayDelay);

    return () => {
      if (autoplayRef.current) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [autoplay, autoplayDelay, count]);


  useEffect(() => {
    if (index >= count) setIndex(0);
  
  }, [count]);

  function prev() {
    setIndex((s) => (s - 1 + count) % count);
  }
  function next() {
    setIndex((s) => (s + 1) % count);
  }
  function goTo(i: number) {
    setIndex(((i % count) + count) % count);
  }

  function cardStyleFor(pos: number, total: number) {
    const half = Math.floor(total / 2);
    let d = pos - index;
    if (d > half) d -= total;
    if (d < -half) d += total;

    const abs = Math.abs(d);

 
    const xGap = 220;
    const x = d * xGap;
    const rotY = d * -10;
   
    const z = -Math.min(140 + abs * 160, 900);
    const scale = d === 0 ? 1.22 : Math.max(0.68, 1 - 0.14 * abs);
    const opacity = d === 0 ? 1 : Math.max(0.22, 1 - 0.28 * abs);
    const zIndex = 2000 - abs;
    const translateY = Math.min(28 * abs, 80);

    return {
      transform: `translateX(${x}px) translateZ(${z}px) translateY(${translateY}px) rotateY(${rotY}deg) scale(${scale})`,
      zIndex,
      opacity,
      
    } as React.CSSProperties;
  }

  return (
    <>
      <style jsx>{`
        .carousel-wrap {
          width: 100%;
          max-width: 1100px; /* increased */
          margin: 0 auto;
          height: 520px; /* increased */
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          perspective: 1800px;
          user-select: none;
          overflow: visible; /* ensure arrows are visible and not clipped */
        }

        /* We only enable stage/card transitions when data-ready="true" to avoid initial jump */
        .stage {
          width: 100%;
          height: 380px; /* increased */
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
          width: 560px; /* increased */
          height: 340px; /* increased */
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 22px 70px rgba(0,0,0,0.6);
          background: #0b0b0b;
          display: flex;
          align-items: flex-end;
          justify-content: stretch;
          cursor: pointer;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        /* apply transitions for card only when ready to avoid initial animation */
        .card[data-ready="true"] {
          transition: transform 700ms cubic-bezier(.2,.8,.2,1), opacity 380ms ease, filter 380ms ease;
        }

        .card .image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: saturate(0.98) contrast(1.02);
          transform-origin: center;
        }
        .card[data-ready="true"] .image {
          transition: transform 700ms cubic-bezier(.2,.8,.2,1);
        }

        .card .overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 26px;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.8) 100%);
          color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }

        .title {
          font-size: 24px; /* larger */
          font-weight: 800;
          margin-bottom: 6px;
          text-shadow: 0 3px 12px rgba(0,0,0,0.7);
        }
        .subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.92);
          line-height: 1.28;
          max-width: 72%;
        }

        .card.center {
          box-shadow: 0 40px 120px rgba(8,12,20,0.6);
        }
        .card.center .image {
          transform: scale(1.035);
          filter: saturate(1.08) contrast(1.08);
        }

        .card.center::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 12px;
          box-shadow: 0 6px 60px rgba(255,255,255,0.03) inset, 0 20px 80px rgba(0,0,0,0.45);
        }

        /* Arrows: ensure they are above everything and clickable */
        .arrow {
          width: 64px;
          height: 64px;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(6px);
          cursor: pointer;
          transition: transform 160ms ease, background 160ms ease;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          z-index: 99999; /* very high so cards don't intercept clicks */
          pointer-events: auto; /* ensure arrows receive clicks */
        }
        .arrow:hover {
          transform: translateY(-50%) scale(1.06);
          background: rgba(255,255,255,0.07);
        }

        /* push them slightly toward ends by moving outward (negative offsets)
           since container uses overflow: visible */
        .arrow.left {
          left: -22px;
        }
        .arrow.right {
          right: -22px;
        }

        .chev {
          width: 20px;
          height: 20px;
          border-right: 2.5px solid rgba(255,255,255,0.95);
          border-bottom: 2.5px solid rgba(255,255,255,0.95);
          transform: rotate(-45deg);
        }
        .arrow.right .chev {
          transform: rotate(-50deg);
        }
        .arrow.left .chev {
          transform: rotate(135deg);
        }
        .dots {
          position: absolute;
          bottom: -36px;
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          left: 50%;
          transform: translateX(-50%);
        }
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.22);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease, opacity 120ms;
        }
        .dot.active {
          transform: scale(1.28);
          background: rgba(255,255,255,0.95);
        }

        @media (max-width: 1200px) {
          .carousel-wrap {
            max-width: 980px;
            height: 460px;
          }
          .stage {
            height: 340px;
          }
          .card {
            width: 520px;
            height: 320px;
          }
          .arrow.left {
            left: -14px;
          }
          .arrow.right {
            right: -14px;
          }
        }

        @media (max-width: 900px) {
          .carousel-wrap {
            max-width: 820px;
            height: 420px;
          }
          .stage {
            height: 320px;
          }
          .card {
            width: 460px;
            height: 300px;
          }
          .arrow.left {
            left: -10px;
          }
          .arrow.right {
            right: -10px;
          }
        }

        @media (max-width: 640px) {
          .carousel-wrap {
            max-width: 100%;
            padding: 0 18px;
            height: 320px;
          }
          .stage {
            height: 260px;
          }
          .card {
            width: 360px;
            height: 240px;
          }
          .arrow {
            display: none;
          }
          .card .overlay {
            padding: 12px;
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

      <div
        className="carousel-wrap"
        ref={containerRef}
        onMouseEnter={() => {
          if (autoplayRef.current) window.clearInterval(autoplayRef.current);
        }}
        onMouseLeave={() => {
          if (!autoplay) return;
          if (autoplayRef.current) window.clearInterval(autoplayRef.current);
          autoplayRef.current = window.setInterval(() => {
            setIndex((s) => (s + 1) % count);
          }, autoplayDelay);
        }}
      >
        <div
          className="arrow left"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="previous"
          role="button"
          title="Previous"
        >
          <span className="chev" />
        </div>

        <div
          className="stage"
          aria-hidden={false}
          data-ready={ready ? "true" : "false"}
        >
          {images.map((it, i) => {
            const style = cardStyleFor(i, count);
            const isCenter = i === index;
            return (
              <div
                className={`card ${isCenter ? "center" : ""}`}
                key={i}
                style={style}
                onClick={() => goTo(i)}
                role="button"
                aria-label={it.alt || `slide-${i}`}
                data-ready={ready ? "true" : "false"}
              >
                <div
                  className="image"
                  style={{
                    backgroundImage: `url(${it.src})`,
                    
                    pointerEvents: "none",
                  }}
                  aria-hidden
                />
                <div className="overlay">
                  <div className="title">{it.title || it.alt || ""}</div>
                  <div className="subtitle">{it.subtitle || ""}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="arrow right"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="next"
          role="button"
          title="Next"
        >
          <span className="chev" />
        </div>

        <div className="dots" role="tablist" aria-label="carousel-dots">
          {images.map((_, i) => (
            <div
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
              role="button"
              aria-label={`go-to-${i}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
