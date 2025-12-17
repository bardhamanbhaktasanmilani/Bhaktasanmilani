// components/sections/MeetOurteamSection.tsx
"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
} from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Modal } from "@/components/ui/Modals/page";

/* -------------------------------------------
 TEAM MEMBERS DATA
--------------------------------------------*/
type TeamMember = {
  id: number;
  name: string;
  role: string;
  bio: string;
  image: string;
};

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Goutam Som",
    role: "Secretary since 2008",
    bio: "Goutam has been the backbone of the organization since 2008, overseeing administration, documentation, and coordination to ensure smooth operations and long-term continuity of the temple’s mission.",
    image: "/MeetTheTeam/secretary.AVIF",
  },
  {
    id: 2,
    name: "Debabrata Sinha Roy",
    role: "Head of Temple Construction Committee",
    bio: "Debabrata leads the temple construction committee with strategic planning and technical oversight, ensuring that every phase of construction upholds structural integrity, tradition, and the collective vision of the community.",
    image: "/MeetTheTeam/head_Construction_Committee.AVIF",
  },
  {
    id: 3,
    name: "Surajit Dutta",
    role: "Joint Head of Temple Construction Committee",
    bio: "Surajit supports and coordinates key construction initiatives, working closely with engineers, artisans, and volunteers to ensure timely execution while preserving architectural and cultural values.",
    image: "/MeetTheTeam/Joint_head_of_temple_Construction_Committee.AVIF",
  },
  {
    id: 4,
    name: "Uttam Saha",
    role: "Assistant Secretary since 2009",
    bio: "Uttam has been assisting in administrative and organizational responsibilities since 2009, contributing to record management, member coordination, and day-to-day operational support with dedication and reliability.",
    image: "/MeetTheTeam/AssistantSecretary.AVIF",
  },
];

/* -------------------------------------------
 TESTIMONIALS DATA
--------------------------------------------*/
const testimonials = [
  {
    name: "Banibrata Das",
    role: "Doner",
    comment: "A heartfelt organization with deep community impact.",
    image: "/MeetTheTeam/testimonials/BaniBrataDas.AVIF",
  },
  {
    name: "Chandidas Kumar",
    role: "Donor",
    comment: "Their dedication encouraged me to become a regular donor.",
    image: "/MeetTheTeam/testimonials/ChandidasKumar.AVIF",
  },
  {
    name: "Jagriti Som",
    role: "Community Member",
    comment: "Their support helped our village greatly.",
    image: "/MeetTheTeam/testimonials/JagritiSom.AVIF",
  },
  {
    name: "Kalidas Ghosh",
    role: "Volunteer",
    comment: "A beautiful experience every time I join seva.",
    image: "/MeetTheTeam/testimonials/Kalidas Ghosh.AVIF",
  },
  {
    name: "Kanika Sarkar",
    role: "Supporter",
    comment: "Very sincere and dedicated organization.",
    image: "/MeetTheTeam/testimonials/KanikaSarkar.AVIF",
  },
];

/* -------------------------------------------
 RESPONSIVE WIDTH HOOK (accepts nullable ref)
--------------------------------------------*/
function useWidth(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [w, setW] = useState(0);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const update = () => {
      if (!el) return;
      setW(el.offsetWidth);
    };

    // initial measure (guarded)
    update();

    const obs = new ResizeObserver(() => update());
    obs.observe(el);

    return () => {
      obs.disconnect();
    };
    // intentionally only depends on enabled and ref.current reference identity
  }, [enabled, ref]);

  return w;
}

/* -------------------------------------------
 ZIG-ZAG CIRCLE (optimized, memoized)
--------------------------------------------*/
type CircleProps = {
  x: number;
  y: number;
  size: number;
  img: string;
  name: string;
  animate: boolean;
  onClick: () => void;
};

const Circle = React.memo(function Circle({
  x,
  y,
  size,
  img,
  name,
  animate,
  onClick,
}: CircleProps) {
  const border = Math.round(size * 0.12);
  const inner = Math.round(size - border * 2);

  return (
    <motion.div
      className="absolute cursor-pointer text-center"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={animate ? { opacity: 1, scale: 1 } : {}}
      onClick={onClick}
    >
      <motion.div whileHover={{ scale: 1.06 }}>
        <div
          className="rounded-full bg-white shadow-xl flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <div
            className="rounded-full overflow-hidden"
            style={{
              width: inner,
              height: inner,
              border: `${border}px solid #fbbf24`,
            }}
          >
            {/* Next/Image requires numeric width/height, we pass computed inner */}
            <Image
              src={img}
              alt={name}
              width={inner}
              height={inner}
              className="object-cover"
              unoptimized={false}
            />
          </div>
        </div>
      </motion.div>
      <p className="mt-1 text-xs font-semibold text-gray-900 w-[90px] truncate mx-auto" title={name}>
        {name}
      </p>
    </motion.div>
  );
});

/* -------------------------------------------
 MAIN SECTION
--------------------------------------------*/
export default function MeetOurteamSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const zigRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [visible, setVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember>(teamMembers[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // accept nullable ref now
  const width = useWidth(zigRef, visible);

  // geometry memo
  const { points, polyString, circleSize } = useMemo(() => {
    const containerWidth = width || 420;
    const size = Math.max(60, containerWidth * 0.18);
    const topY = size * 0.9;
    const bottomY = size * 2.25;
    const offset = containerWidth * 0.1;

    const pts = [
      { x: Math.round(containerWidth * 0.25 - offset), y: Math.round(topY) },
      { x: Math.round(containerWidth * 0.5 - offset), y: Math.round(topY) },
      { x: Math.round(containerWidth * 0.75 - offset), y: Math.round(topY) },
      { x: Math.round(containerWidth / 3 - offset), y: Math.round(bottomY) },
      { x: Math.round((containerWidth * 2) / 3 - offset), y: Math.round(bottomY) },
    ];

    return {
      points: pts,
      polyString: pts.map((p) => `${p.x},${p.y}`).join(" "),
      circleSize: size,
    };
  }, [width]);

  return (
    <section
      ref={sectionRef}
      id="team"
      className="py-16 bg-gradient-to-br from-orange-50 to-amber-50"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Meet Our{" "}
            <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
              Organizers
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-3">
            Dedicated leaders serving the community with devotion and responsibility.
          </p>
        </div>

        {/* TEAM GRID */}
        <div className={`grid md:grid-cols-[1fr_1.4fr] gap-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex justify-center md:justify-start">
            <div className="bg-white p-3 rounded-3xl shadow-2xl">
              <Image
                src={selectedMember.image}
                alt={selectedMember.name}
                width={300}
                height={420}
                priority
                className="object-cover rounded-2xl"
              />
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-bold">{selectedMember.name}</h3>
            <p className="text-orange-600 text-sm uppercase mt-1">{selectedMember.role}</p>
            <p className="mt-4 text-gray-700">{selectedMember.bio}</p>

            <div className="grid grid-cols-4 gap-4 mt-8">
              {teamMembers.map((m) => (
                <button
                  key={m.id}
                  aria-label={`View ${m.name}`}
                  onClick={() => setSelectedMember(m)}
                  className="focus:outline-none"
                >
                  <Image
                    src={m.image}
                    alt={m.name}
                    width={120}
                    height={120}
                    className="h-28 w-full object-cover rounded-xl"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center">Testimonials</h3>
          <div className="w-24 h-1 mx-auto mt-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
          <p className="mt-4 text-center text-gray-600 max-w-xl mx-auto">Real voices from people whose lives have been touched by our work.</p>

          <div
            ref={zigRef}
            className="relative mx-auto mt-12"
            style={{ minHeight: circleSize * 3.2 }}
          >
            <svg className="absolute inset-0 w-full h-full -z-10" aria-hidden>
              <polyline points={polyString} fill="none" stroke="url(#zig)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="zig" x1="0" x2="1">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>

            {points.map((p, i) => (
              <Circle
                key={i}
                x={p.x}
                y={p.y}
                size={circleSize}
                img={testimonials[i]?.image ?? testimonials[i % testimonials.length].image}
                name={testimonials[i]?.name ?? `Person ${i + 1}`}
                animate={!prefersReducedMotion && visible}
                onClick={() => setOpenIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Modal open={openIndex !== null} onClose={() => setOpenIndex(null)}>
        {openIndex !== null && (
          <div className="p-5">
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-8 ring-amber-400 flex-shrink-0">
                <Image
                  src={testimonials[openIndex].image}
                  alt={testimonials[openIndex].name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">{testimonials[openIndex].name}</h3>
                <p className="text-orange-600 text-xs uppercase">{testimonials[openIndex].role}</p>
                <p className="mt-3 text-gray-700">{testimonials[openIndex].comment}</p>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setOpenIndex(null)} className="px-4 py-2 rounded-md bg-amber-500 text-white">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
