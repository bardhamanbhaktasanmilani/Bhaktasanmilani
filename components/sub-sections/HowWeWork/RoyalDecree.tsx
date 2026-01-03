"use client";

import React, { useEffect, useRef, useState } from "react";
import anime from "animejs";

type RoyalDecreeProps = {
  title: string;
  description: string;
  date: string;
  time: string;
  children?: React.ReactNode;
};

/**
 * RoyalDecree
 * - Decorative parchment card with open animation
 * - Scrollable content with custom thumb
 * - Accepts children; images inside children are detected and rendered into a framed poster area
 *
 * Important: the container allows overflow-visible so poster images are not clipped.
 */
export default function RoyalDecree({
  title,
  description,
  date,
  time,
  children,
}: RoyalDecreeProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const parchmentRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const topHandleRef = useRef<HTMLDivElement | null>(null);
  const bottomHandleRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const hasOpened = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const thumbState = useRef({
    thumbHeightPx: 0,
    trackHeightPx: 0,
  });

  // ---- Intersection: open once when visible ----
  useEffect(() => {
    if (wrapperRef.current) wrapperRef.current.style.opacity = "0";
    if (parchmentRef.current) parchmentRef.current.style.height = "40px";
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = "translateY(-40px)";
      // hide native scrollbar visual (where supported)
      (contentRef.current.style as any).scrollbarWidth = "none";
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasOpened.current) return;
          hasOpened.current = true;
          openSequence();
        });
      },
      { threshold: 0.3 }
    );

    if (wrapperRef.current) obs.observe(wrapperRef.current);

    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Animation sequence (open) ----
  const openSequence = () => {
    if (
      !wrapperRef.current ||
      !parchmentRef.current ||
      !contentRef.current ||
      !topHandleRef.current ||
      !bottomHandleRef.current
    )
      return;

    setIsOpen(true);

    // measure content and decide target height (capped)
    const contentHeight = contentRef.current.scrollHeight;
    const targetHeight = Math.min(contentHeight + 64, 560);

    // initial set
    anime.set(parchmentRef.current, { height: "40px", opacity: 1 });
    anime.set(contentRef.current, { opacity: 0, translateY: -40 });

    anime
      .timeline({ easing: "easeOutCubic" })
      .add({
        targets: wrapperRef.current,
        opacity: [0, 1],
        duration: 350,
      })
      .add(
        {
          targets: [topHandleRef.current, bottomHandleRef.current],
          rotateX: [-6, 6],
          duration: 420,
          easing: "easeInOutSine",
        },
        180
      )
      .add(
        {
          targets: parchmentRef.current,
          height: ["40px", `${targetHeight}px`],
          duration: 1000,
          easing: "easeOutElastic(1, .6)",
          update: () => computeThumb(true),
        },
        360
      )
      .add(
        {
          targets: topHandleRef.current,
          rotateX: [6, 0],
          translateY: [0, -8],
          duration: 520,
        },
        820
      )
      .add(
        {
          targets: bottomHandleRef.current,
          rotateX: [6, 0],
          translateY: [0, 8],
          duration: 520,
        },
        820
      )
      .add(
        {
          targets: contentRef.current,
          opacity: [0, 1],
          translateY: [-40, 0],
          duration: 700,
          easing: "easeOutQuad",
        },
        1000
      )
      .add(
        {
          targets: trackRef.current,
          translateX: [18, 0],
          opacity: [0, 1],
          duration: 600,
          easing: "easeOutCubic",
        },
        900
      )
      .add(
        {
          targets: thumbRef.current,
          scale: [0.95, 1.02, 1],
          duration: 600,
          easing: "easeInOutSine",
          complete: () => {
            // after open, allow parchment height to auto-size and attach handlers
            if (parchmentRef.current) parchmentRef.current.style.height = "auto";
            computeThumb(false, true);
            attachScrollHandlers();
            attachResizeObserver();
          },
        },
        1500
      );
  };

  // ---- compute thumb size & position ----
  const computeThumb = (animate = true, snapToTop = false) => {
    const scrollEl = contentRef.current;
    const trackEl = trackRef.current;
    const thumbEl = thumbRef.current;
    const parchmentEl = parchmentRef.current;
    if (!scrollEl || !trackEl || !thumbEl || !parchmentEl) return;

    // compute track height (available vertical space)
    const trackRect = trackEl.getBoundingClientRect();
    const trackHeight = Math.max(48, trackRect.height);

    const clientH = scrollEl.clientHeight;
    const scrollH = Math.max(clientH, scrollEl.scrollHeight);
    const visibleRatio = Math.min(1, clientH / scrollH);

    const minThumb = 36;
    const rawThumb = Math.max(minThumb, Math.floor(visibleRatio * trackHeight));
    thumbState.current = { thumbHeightPx: rawThumb, trackHeightPx: trackHeight };

    const maxScrollTop = Math.max(1, scrollH - clientH);
    const scrollTop = snapToTop ? 0 : scrollEl.scrollTop;
    const scrollProgress = snapToTop ? 0 : scrollTop / maxScrollTop;
    const maxThumbOffset = Math.max(0, trackHeight - rawThumb);
    const topPx = Math.round(scrollProgress * maxThumbOffset);

    if (animate) {
      anime({
        targets: thumbEl,
        height: `${rawThumb}px`,
        translateY: topPx,
        duration: 260,
        easing: "easeOutQuad",
      });
    } else {
      thumbEl.style.height = `${rawThumb}px`;
      thumbEl.style.transform = `translateY(${topPx}px)`;
    }
  };

  // ---- on scroll sync thumb ----
  const onScroll = () => {
    const scrollEl = contentRef.current;
    const thumbEl = thumbRef.current;
    if (!scrollEl || !thumbEl) return;

    const clientH = scrollEl.clientHeight;
    const scrollH = Math.max(clientH, scrollEl.scrollHeight);
    const scrollTop = scrollEl.scrollTop;
    const maxScrollTop = Math.max(1, scrollH - clientH);

    const { thumbHeightPx, trackHeightPx } = thumbState.current;
    const maxThumbOffset = Math.max(0, trackHeightPx - thumbHeightPx);
    const progress = scrollTop / maxScrollTop;
    const topPx = Math.round(progress * maxThumbOffset);

    anime({
      targets: thumbEl,
      translateY: topPx,
      duration: 200,
      easing: "easeOutSine",
    });
  };

  // ---- attach scroll handlers once ----
  const attachScrollHandlers = () => {
    const el = contentRef.current;
    if (!el) return;
    if ((el as any).__rd_attached) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    (el as any).__rd_attached = true;
    computeThumb(false, true);
  };

  // ---- resize observer to recompute thumb ----
  const roRef = useRef<ResizeObserver | null>(null);
  const attachResizeObserver = () => {
    const el = contentRef.current;
    if (!el) return;
    if (roRef.current) return;
    roRef.current = new ResizeObserver(() => {
      computeThumb(true);
    });
    roRef.current.observe(el);
  };

  // cleanup listeners & observers on unmount
  useEffect(() => {
    return () => {
      const el = contentRef.current;
      if (el && (el as any).__rd_attached) {
        el.removeEventListener("scroll", onScroll);
      }
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- poster/frame rendering from children ----
  const renderPosterFrame = () => {
    if (!children) return null;

    const childArray = React.Children.toArray(children);
    let imageIndex = -1;

    // find first element that looks like an <img> or has src prop
    for (let i = 0; i < childArray.length; i++) {
      const c = childArray[i] as any;

      if (React.isValidElement(c)) {
        const typeName =
          typeof c.type === "string" ? c.type.toLowerCase() : "";

        const props = c.props as Record<string, unknown>;

        const hasSrc =
          typeof props.src === "string" ||
          (typeof props.children === "string" &&
            props.children.startsWith("data:"));

        if (typeName === "img" || hasSrc) {
          imageIndex = i;
          break;
        }
      }
    } // <-- properly close the for loop here

    const frameBase =
      "mx-auto mt-5 w-[240px] h-[340px] sm:w-[320px] sm:h-[420px] rounded-lg overflow-hidden border-2 border-amber-200 shadow-inner flex items-center justify-center bg-amber-50";

    if (imageIndex >= 0) {
      const imgEl = childArray[imageIndex] as React.ReactElement<
        React.ImgHTMLAttributes<HTMLImageElement>
      >;
      const existingClass = (imgEl.props as any).className || "";
      const mergedClass = `${existingClass} block w-full h-full object-cover`;
      const mergedStyle = {
        ...((imgEl.props as any).style || {}),
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        display: "block",
      };

      const cloned = React.cloneElement(imgEl, {
        className: mergedClass,
        style: mergedStyle,
        loading: (imgEl.props as any).loading || "lazy",
        alt: (imgEl.props as any).alt || `${title} poster`,
      });

      // ensure the frame sits above background layers (z-index), and allow visible overflow
      return (
        <div className={frameBase} aria-hidden={false} style={{ zIndex: 22 }}>
          {cloned}
        </div>
      );
    }

    // if no image child, render children inside a framed slot
    return (
      <div className={frameBase} style={{ zIndex: 22 }}>
        <div className="p-3 w-full h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  };

  // ---- final render ----
  return (
    <div
      ref={wrapperRef}
      className="relative w-full max-w-md mx-auto my-8 opacity-0"
    >
      {/* Inline styles for the custom thumb look (kept close to original design) */}
      <style>{`
        .royal-scroll-content::-webkit-scrollbar { width: 0; height: 0; }
        .rd-track { position: absolute; right: 8px; top: 12px; bottom: 12px; width: 18px; border-radius: 12px; pointer-events: none; display:flex; align-items:flex-start; justify-content:center; }
        .rd-thumb { position: absolute; right: 8px; width: 10px; border-radius:999px; transform-origin: top left; will-change: transform, height; pointer-events: auto; }
        .rd-thumb::before { content: ''; position:absolute; inset:0; background-image: linear-gradient(90deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 4px); opacity:0.11; }
        .rd-shine { position:absolute; left:-14px; width:36px; height:40%; top:-10%; transform:rotate(10deg); background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0)); filter: blur(6px); opacity:0; animation: rdShine 3800ms ease-in-out infinite; }
        @keyframes rdShine { 0% { transform: translateY(-120%) rotate(10deg); opacity: 0 } 50% { transform: translateY(30%) rotate(10deg); opacity: 0.12 } 100% { transform: translateY(120%) rotate(10deg); opacity: 0 } }
      `}</style>

      {/* TOP HANDLE */}
      <div
        ref={topHandleRef}
        className="absolute left-0 right-0 h-6 mx-6 -top-3 z-30 pointer-events-none"
        aria-hidden
      >
        <div className="w-full h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-lg">
          <div className="w-full h-2 mt-2 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 opacity-80" />
        </div>
      </div>

      {/* Parchment container: allow overflow-visible so poster frames are not clipped */}
      <div
        ref={parchmentRef}
        className="relative w-full mx-auto bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 overflow-visible shadow-2xl border-x-4 border-amber-700 rounded-xl"
        style={{
          height: "40px",
          boxShadow:
            "inset 0 0 60px rgba(217,119,6,0.18), 0 25px 50px rgba(0,0,0,0.35)",
        }}
      >
        {/* decorative top strip */}
        <div className="h-3 w-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-b border-amber-300 shadow-inner" />

        {/* content area (scrollable) */}
        <div
          ref={contentRef}
          className="royal-scroll-content px-6 pb-6 pt-4 opacity-0 transform -translate-y-10 max-h-[480px] overflow-y-auto relative"
          role="region"
          aria-label={`Program details for ${title}`}
        >
          <div className="flex items-center justify-center mb-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <span className="mx-2 text-xs tracking-[0.35em] uppercase text-amber-700">
              ॐ कार्यक्रम
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>

          <h3 className="text-xl font-semibold text-center text-amber-900 mb-1">
            {title}
          </h3>
          <p className="text-center text-[13px] text-amber-800 mb-2">
            {date} • {time} hrs
          </p>

          <p className="text-[13px] leading-relaxed text-amber-900/90 whitespace-pre-line mb-2">
            {description}
          </p>

          {/* Poster/frame area (ensures image not clipped) */}
          <div style={{ zIndex: 22 }} className="flex justify-center">
            {renderPosterFrame()}
          </div>

          {/* footer ornamental */}
          <div className="mt-5">
            <div className="flex items-center justify-center mb-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
              <span className="mx-2 text-[11px] text-amber-800">
                All devotees invited — with love &amp; seva 🙏
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            </div>
          </div>
        </div>

        {/* bottom decorative strip */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-t border-amber-300 shadow-inner" />

        {/* scroll track + thumb */}
        <div
          ref={trackRef}
          className="rd-track"
          style={{ opacity: 0, transition: "opacity 320ms ease", pointerEvents: "none" }}
          aria-hidden
        >
          <div
            style={{
              width: 10,
              borderRadius: 12,
              height: "100%",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <div
              ref={thumbRef}
              className="rd-thumb"
              style={{
                height: 48,
                transform: "translateY(0px)",
                pointerEvents: "auto",
                background:
                  "linear-gradient(180deg, #7a4a24 0%, #5a3317 45%, #421f11 100%)",
                border: "1px solid rgba(0,0,0,0.18)",
              }}
            >
              <div className="rd-shine" />
            </div>
          </div>
        </div>
      </div>

      {/* bottom handle */}
      <div
        ref={bottomHandleRef}
        className="absolute left-0 right-0 h-6 mx-6 -bottom-3 z-30 pointer-events-none"
        aria-hidden
      >
        <div className="w-full h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-lg">
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 opacity-80" />
        </div>
      </div>
    </div>
  );
}
