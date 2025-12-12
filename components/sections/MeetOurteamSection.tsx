"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modals/page";

/* Faces */
const faces = [
  {
    name: "Arjun Sharma",
    role: "Volunteer",
    comment: "A heartfelt organization with deep community impact.",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Aishi Dutta",
    role: "Donor",
    comment: "Their dedication encouraged me to become a regular donor.",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Avijit Dey",
    role: "Community Member",
    comment: "Their support helped our village greatly.",
    image: "https://images.pexels.com/photos/1889787/pexels-photo-1889787.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Gopal Dey",
    role: "Volunteer",
    comment: "A beautiful experience every time I join seva.",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800"
  },
  {
    name: "Nikhil Mehta",
    role: "Supporter",
    comment: "Very sincere and dedicated organization.",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800"
  }
];

function useWidth(ref: React.RefObject<HTMLDivElement>) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const update = () => setW(ref.current!.offsetWidth);
    const obs = new ResizeObserver(update);
    obs.observe(ref.current);
    update();
    return () => obs.disconnect();
  }, []);
  return w;
}

function Circle({ x, y, size, index, img, name, animate, onClick }: any) {
  const border = size * 0.12;
  const inner = size - border * 2;

  return (
    <motion.div
      className="absolute text-center cursor-pointer select-none"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={animate ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12 }}
      onClick={onClick}
    >
      <motion.div whileHover={{ scale: 1.07 }}>
        <div
          className="rounded-full bg-white shadow-xl flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <div
            className="rounded-full overflow-hidden"
            style={{
              width: inner,
              height: inner,
              border: `${border}px solid #fbbf24`
            }}
          >
            <img src={img} className="w-full h-full object-cover" />
          </div>
        </div>
      </motion.div>

      <p className="mt-1 text-xs font-semibold text-gray-900 w-[90px] truncate mx-auto">
        {name}
      </p>
    </motion.div>
  );
}

export default function MeetOurTeamSection() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);

  const [animateIn, setAnimateIn] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setAnimateIn(true),
      { threshold: 0.15 }
    );

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  /* ---- FALLBACK (before width loads) ---- */
  const containerWidth = width || 400; // temporary safe width

  const circleSize = Math.max(60, containerWidth * 0.18);

  const topY = circleSize * 0.9;
  const bottomY = circleSize * 2.25;

const centerOffset = width * 0.1;  // SHIFT LEFT by 2%

const points = [
  /* Top row */
  { x: (containerWidth * 0.25) - centerOffset, y: topY },
  { x: (containerWidth * 0.50) - centerOffset, y: topY },
  { x: (containerWidth * 0.75) - centerOffset, y: topY },

  /* Bottom row */
  { x: (containerWidth * (1 / 3)) - centerOffset, y: bottomY },
  { x: (containerWidth * (2 / 3)) - centerOffset, y: bottomY }
];

  const polyString = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Bigger, centered heading */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Meet Our{" "}
            <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
              Organizers
            </span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto mt-3">
            Compassion, leadership, and service — meet the people behind our mission.
          </p>
        </div>

        <div
          ref={ref}
          className="relative mx-auto w-full"
          style={{ minHeight: circleSize * 3.2 }}
        >
          {/* Zigzag */}
          <svg className="absolute inset-0 w-full h-full -z-10">
            <polyline
              points={polyString}
              fill="none"
              stroke="url(#zig)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="zig" x1="0" x2="1">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Circles */}
          {points.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              size={circleSize}
              index={i}
              img={faces[i].image}
              name={faces[i].name}
              animate={animateIn}
              onClick={() => setOpenIndex(i)}
              
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal open={openIndex !== null} onClose={() => setOpenIndex(null)}>
        {openIndex !== null && (
          <div className="p-5">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-8 ring-amber-400">
                <img src={faces[openIndex].image} className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{faces[openIndex].name}</h3>
                <p className="text-orange-600 text-xs uppercase">{faces[openIndex].role}</p>
                <p className="mt-3 text-gray-700">{faces[openIndex].comment}</p>
              </div>
            </div>

            <button
              onClick={() => setOpenIndex(null)}
              className="mt-6 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 w-full"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </section>
  );
}
