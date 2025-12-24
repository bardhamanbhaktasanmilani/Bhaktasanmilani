"use client";

import React, { useEffect, useRef, useState } from "react";
import anime from "animejs";

type RoyalDecreeProps = {
  title: string;
  description: string;
  date: string;
  time: string;
  children?: React.ReactNode; // poster is usually passed here
};

/**
 * RoyalDecree
 *
 * - Preserves original behavior: intersection-triggered open animation,
 *   poster-frame detection & cloning, parchment elastic open, content rendering.
 * - Adds a custom animated vertical "stick" scrollbar (brown / wooden look)
 *   that sits over the right edge of the parchment and animates during open,
 *   and follows scroll position smoothly with a subtle shine.
 *
 * Notes:
 * - All original features & layout are preserved.
 * - Uses anime.js for smooth thumb transitions and open animation sequencing.
 */
export default function RoyalDecree({
  title,
  description,
  date,
  time,
  children,
}: RoyalDecreeProps) {
  const decreeWrapperRef = useRef<HTMLDivElement | null>(null);
  const parchmentRef = useRef<HTMLDivElement | null>(null);
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  const topHandleRef = useRef<HTMLDivElement | null>(null);
  const bottomHandleRef = useRef<HTMLDivElement | null>(null);

  // New refs for custom scrollbar
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const hasOpened = useRef(false);

  // store thumb geometry to update quickly
  const thumbState = useRef({
    thumbHeightPx: 0,
    trackHeightPx: 0,
  });

  useEffect(() => {
    // initial styles (match previous behaviour)
    if (decreeWrapperRef.current) decreeWrapperRef.current.style.opacity = "0";
    if (parchmentRef.current) parchmentRef.current.style.height = "40px";
    if (scrollContentRef.current) {
      scrollContentRef.current.style.opacity = "0";
      scrollContentRef.current.style.transform = "translateY(-50px)";
      // hide native scrollbar visually (we keep overflow-y to enable scroll)
      scrollContentRef.current.style.scrollbarWidth = "none";
      // for webkit, we will hide via css below
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasOpened.current) return;
          hasOpened.current = true;
          openAnimation();
        });
      },
      { threshold: 0.3 }
    );

    if (decreeWrapperRef.current) observer.observe(decreeWrapperRef.current);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- OPEN ANIMATION (preserve original timeline, add sticky scrollbar entrance)
  const openAnimation = () => {
    if (
      !decreeWrapperRef.current ||
      !parchmentRef.current ||
      !scrollContentRef.current ||
      !topHandleRef.current ||
      !bottomHandleRef.current
    )
      return;

    setIsOpen(true);

    // Measure content to get natural height (ensure we read scrollHeight)
    const contentHeight = scrollContentRef.current.scrollHeight;
    const targetHeight = Math.min(contentHeight + 64, 520); // keep a sane max so the elastic open stays nice

    // Prepare scrollbar geometry after we set height
    anime.set(parchmentRef.current, { height: "40px", opacity: 1 });
    anime.set(scrollContentRef.current, { opacity: 0, translateY: -50 });

    anime
      .timeline({ easing: "easeOutCubic" })
      .add({
        targets: decreeWrapperRef.current,
        opacity: [0, 1],
        duration: 350,
      })
      .add(
        {
          targets: [topHandleRef.current, bottomHandleRef.current],
          rotateX: [-5, 5],
          duration: 450,
          easing: "easeInOutSine",
        },
        200
      )
      .add(
        {
          targets: parchmentRef.current,
          height: ["40px", `${targetHeight}px`],
          duration: 1100,
          easing: "easeOutElastic(1,0.6)",
          update: () => {
            // keep thumb geometry recalculated during resize so it feels elastic
            computeAndSetThumb(true);
          },
        },
        380
      )
      .add(
        {
          targets: topHandleRef.current,
          rotateX: [5, 0],
          translateY: [0, -8],
          duration: 550,
        },
        820
      )
      .add(
        {
          targets: bottomHandleRef.current,
          rotateX: [5, 0],
          translateY: [0, 8],
          duration: 550,
        },
        820
      )
      .add(
        {
          targets: scrollContentRef.current,
          opacity: [0, 1],
          translateY: [-50, 0],
          duration: 750,
          easing: "easeOutQuart",
        },
        1100
      )
      // animate scrollbar track & thumb subtly into place
      .add(
        {
          targets: scrollTrackRef.current,
          translateX: [24, 0],
          opacity: [0, 1],
          duration: 650,
          easing: "easeOutCubic",
        },
        900
      )
      .add(
        {
          targets: thumbRef.current,
          scale: [0.9, 1.03, 1],
          duration: 700,
          easing: "easeInOutSine",
          complete: () => {
            if (parchmentRef.current) parchmentRef.current.style.height = "auto";
            // final compute for thumb now that height is auto
            computeAndSetThumb(false, true);
            // start listening to scroll
            attachScrollHandlers();
            attachResizeObserver();
          },
        },
        1600
      );
  };

  // compute thumb size & position, optionally animate
  const computeAndSetThumb = (animate = true, snapToTop = false) => {
    const scrollEl = scrollContentRef.current;
    const trackEl = scrollTrackRef.current;
    const thumbEl = thumbRef.current;
    const parchmentEl = parchmentRef.current;
    if (!scrollEl || !trackEl || !thumbEl || !parchmentEl) return;

    // track height is the visible height of the scroll area (padding accounted by CSS)
    const trackRect = trackEl.getBoundingClientRect();
    const trackHeight = Math.max(trackRect.height, 48);

    // visible ratio
    const clientH = scrollEl.clientHeight;
    const scrollH = scrollEl.scrollHeight || clientH;
    const visibleRatio = Math.min(1, clientH / scrollH);

    // thumb height
    const minThumb = 36;
    const rawThumb = Math.max(minThumb, Math.floor(visibleRatio * trackHeight));
    thumbState.current = { thumbHeightPx: rawThumb, trackHeightPx: trackHeight };

    // compute top offset from scrollTop
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
        duration: 280,
        easing: "easeOutQuad",
      });
    } else {
      thumbEl.style.height = `${rawThumb}px`;
      thumbEl.style.transform = `translateY(${topPx}px)`;
    }
  };

  // scroll -> move thumb
  const onScroll = () => {
    const scrollEl = scrollContentRef.current;
    const thumbEl = thumbRef.current;
    if (!scrollEl || !thumbEl) return;

    const clientH = scrollEl.clientHeight;
    const scrollH = scrollEl.scrollHeight || clientH;
    const scrollTop = scrollEl.scrollTop;
    const maxScrollTop = Math.max(1, scrollH - clientH);

    const { thumbHeightPx, trackHeightPx } = thumbState.current;
    const maxThumbOffset = Math.max(0, trackHeightPx - thumbHeightPx);
    const progress = scrollTop / maxScrollTop;
    const topPx = Math.round(progress * maxThumbOffset);

    anime({
      targets: thumbEl,
      translateY: topPx,
      duration: 220,
      easing: "easeOutSine",
    });
  };

  // Attach scroll handlers and compute initial thumb
  const attachScrollHandlers = () => {
    const scrollEl = scrollContentRef.current;
    if (!scrollEl) return;
    // already attached?
    if ((scrollEl as any).__royaldecree_attached) return;
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    (scrollEl as any).__royaldecree_attached = true;
    // initial compute
    computeAndSetThumb(false, true);
  };

  // Resize observer to recompute thumb when content changes
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const attachResizeObserver = () => {
    const scrollEl = scrollContentRef.current;
    if (!scrollEl) return;
    if (resizeObserverRef.current) return;

    resizeObserverRef.current = new ResizeObserver(() => {
      computeAndSetThumb(true);
    });
    resizeObserverRef.current.observe(scrollEl);
  };

  // cleanup
  useEffect(() => {
    return () => {
      const scrollEl = scrollContentRef.current;
      if (scrollEl && (scrollEl as any).__royaldecree_attached) {
        scrollEl.removeEventListener("scroll", onScroll);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Render poster inside a fixed frame.
   * If children contains an <img> element (or element with a src prop), clone it and force sizing styles.
   * Otherwise render children inside the frame and center it.
   *
   * PRESERVED exactly from original with minor class tweaks for polished presentation.
   */
  const renderPosterFrame = () => {
    if (!children) return null;

    // Normalize children to array so we can search for an image-like element
    const childArray = React.Children.toArray(children);

    // Find first child that looks like an image (type === 'img' or has props.src)
    let imageChildIndex = -1;
    for (let i = 0; i < childArray.length; i++) {
      const c = childArray[i] as React.ReactElement | string;
      if (React.isValidElement(c)) {
        // check common signs of an image element
        const typeName =
          typeof c.type === "string" ? (c.type as string).toLowerCase() : "";
        if (typeName === "img" || (c.props && c.props.src)) {
          imageChildIndex = i;
          break;
        }
      }
    }

    // Frame sizes: fixed but responsive. Adjust as desired.
    // Desktop: 320x420, Mobile: 240x340
    const frameClass =
      "mx-auto mt-4 w-[240px] h-[340px] sm:w-[320px] sm:h-[420px] rounded-lg overflow-hidden border-2 border-amber-200 shadow-inner flex items-center justify-center bg-amber-50";

    if (imageChildIndex >= 0) {
      const imgElement = childArray[imageChildIndex] as React.ReactElement;
      // Merge/append className and force style for perfect fit & centering.
      const existingClass = imgElement.props?.className || "";
      const mergedClass = `${existingClass} block w-full h-full object-cover`;
      const mergedStyle = {
        ...(imgElement.props?.style || {}),
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        display: "block",
      };

      const cloned = React.cloneElement(imgElement, {
        className: mergedClass,
        style: mergedStyle,
        loading: imgElement.props?.loading || "lazy",
        alt: imgElement.props?.alt || `${title} poster`,
      });

      return <div className={frameClass} aria-hidden={false}>{cloned}</div>;
    }

    // No image-like child found — render all children inside the frame, centered.
    return (
      <div className={frameClass}>
        <div className="p-2 w-full h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={decreeWrapperRef}
      className="relative w-full max-w-md mx-auto my-8 opacity-0"
    >
      {/* small inline styles for custom scrollbar + shine animation */}
      <style>{`
        /* hide native webkit scrollbar inside our content area */
        .royal-scroll-content::-webkit-scrollbar { width: 0; height: 0; }
        /* make sure the track area is positioned correctly */
        .royal-scroll-track {
          /* will be absolutely positioned inside parchment */
        }
        /* fancy wooden grain thumb + subtle glow */
        .royal-thumb {
          border-radius: 999px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.04);
          background: linear-gradient(180deg, #7a4a24 0%, #5a3317 45%, #421f11 100%);
          border: 1px solid rgba(0,0,0,0.18);
          position: absolute;
          right: 6px;
          width: 10px;
          transform-origin: top left;
          will-change: transform, height;
          overflow: hidden;
        }
        /* thin track (transparent but provides spacing) */
        .royal-track {
          position: absolute;
          right: 6px;
          top: 12px;
          bottom: 12px;
          width: 16px;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          pointer-events: none;
        }
        /* tiny grain lines inside thumb */
        .royal-thumb::before {
          content: "";
          position: absolute;
          left: 2px;
          right: 2px;
          top: 0;
          bottom: 0;
          background-image: linear-gradient(90deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 4px);
          opacity: 0.12;
        }
        /* animated shine that sweeps slowly down the stick when idle */
        @keyframes royalShine {
          0% { transform: translateY(-120%) rotate(10deg); opacity: 0; }
          50% { transform: translateY(30%) rotate(10deg); opacity: 0.12; }
          100% { transform: translateY(120%) rotate(10deg); opacity: 0; }
        }
        .royal-shine {
          position: absolute;
          left: -14px;
          width: 36px;
          height: 40%;
          top: -10%;
          transform: rotate(10deg);
          background: linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.22), rgba(255,255,255,0.0));
          filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          animation: royalShine 3800ms ease-in-out infinite;
        }
      `}</style>

      {/* TOP HANDLE */}
      <div
        ref={topHandleRef}
        className="absolute left-0 right-0 h-6 mx-6 -top-3 z-20"
      >
        <div className="w-full h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-lg">
          <div className="w-full h-2 mt-2 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 opacity-80" />
        </div>
      </div>

      {/* PARCHMENT */}
      <div
        ref={parchmentRef}
        className="relative w-full mx-auto bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 overflow-hidden shadow-2xl border-x-4 border-amber-700"
        style={{
          height: "40px",
          boxShadow:
            "inset 0 0 60px rgba(217,119,6,0.18), 0 25px 50px rgba(0,0,0,0.35)",
          borderRadius: 14,
        }}
      >
        {/* Decorative top border */}
        <div className="h-3 w-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-b border-amber-300 shadow-inner" />

        {/* Scroll content area */}
        <div
          ref={scrollContentRef}
          className="royal-scroll-content px-6 pb-6 pt-4 opacity-0 transform -translate-y-10 max-h-[430px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-amber-100 relative"
          // role for accessibility
          role="region"
          aria-label={`Program details for ${title}`}
        >
          {/* Fancy heading + dividers */}
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

          {/* Description: ensured to appear above the poster */}
          <p className="text-[13px] leading-relaxed text-amber-900/90 whitespace-pre-line mb-2">
            {description}
          </p>

          {/* Poster Frame (children rendered here) */}
          {renderPosterFrame()}

          {/* Ornamental footer */}
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

        {/* Decorative bottom strip */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-t border-amber-300 shadow-inner" />

        {/* CUSTOM vertical scroll "stick" (track + thumb + shine) */}
        <div
          ref={scrollTrackRef}
          className="royal-track"
          aria-hidden="true"
          style={{
            opacity: 0,
            transition: "opacity 320ms ease",
            pointerEvents: "none",
          }}
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
              className="royal-thumb"
              style={{
                height: 48,
                transform: "translateY(0px)",
                pointerEvents: "auto",
              }}
            >
              <div className="royal-shine" />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM HANDLE */}
      <div
        ref={bottomHandleRef}
        className="absolute left-0 right-0 h-6 mx-6 -bottom-3 z-20"
      >
        <div className="w-full h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-lg">
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 opacity-80" />
        </div>
      </div>
    </div>
  );
}
