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

  const [isOpen, setIsOpen] = useState(false);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (decreeWrapperRef.current) decreeWrapperRef.current.style.opacity = "0";
    if (parchmentRef.current) parchmentRef.current.style.height = "40px";
    if (scrollContentRef.current) {
      scrollContentRef.current.style.opacity = "0";
      scrollContentRef.current.style.transform = "translateY(-50px)";
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
      .add(
        {
          targets: parchmentRef.current,
          scale: [1, 1.02, 1],
          duration: 450,
          easing: "easeInOutSine",
          complete: () => {
            if (parchmentRef.current) parchmentRef.current.style.height = "auto";
          },
        },
        1600
      );
  };

  return (
    <div ref={decreeWrapperRef} className="relative w-full max-w-md mx-auto my-8 opacity-0">
      {/* TOP HANDLE */}
      <div ref={topHandleRef} className="absolute left-0 right-0 h-6 mx-6 -top-3 z-20">
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
        }}
      >
        {/* Decorative top border */}
        <div className="h-3 w-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-b border-amber-300 shadow-inner" />

        <div
          ref={scrollContentRef}
          className="px-6 pb-6 pt-4 opacity-0 transform -translate-y-10 max-h-[430px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-amber-100"
        >
          {/* Fancy heading + dividers */}
          <div className="flex items-center justify-center mb-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            <span className="mx-2 text-xs tracking-[0.35em] uppercase text-amber-700">ॐ कार्यक्रम</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>

          <h3 className="text-xl font-semibold text-center text-amber-900 mb-1">{title}</h3>

          <p className="text-center text-[13px] text-amber-800 mb-4">{date} • {time} hrs</p>

          <p className="text-[13px] leading-relaxed text-amber-900/90 whitespace-pre-line">{description}</p>

          {/* Render any children (poster block usually) */}
          {children}

          {/* Ornamental footer */}
          <div className="mt-5">
            <div className="flex items-center justify-center mb-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
              <span className="mx-2 text-[11px] text-amber-800">All devotees invited — with love &amp; seva 🙏</span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            </div>
          </div>
        </div>

        {/* Decorative bottom strip */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-t border-amber-300 shadow-inner" />
      </div>

      {/* BOTTOM HANDLE */}
      <div ref={bottomHandleRef} className="absolute left-0 right-0 h-6 mx-6 -bottom-3 z-20">
        <div className="w-full h-6 rounded-full bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-lg">
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 opacity-80" />
        </div>
      </div>
    </div>
  );
}
