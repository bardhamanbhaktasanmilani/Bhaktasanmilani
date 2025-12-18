"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/* -------------------------------------------
 TEAM MEMBERS DATA (UNCHANGED)
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
    bio:
      "Goutam has been the backbone of the organization since 2008, overseeing administration, documentation, and coordination to ensure smooth operations and long-term continuity of the temple’s mission.",
    image: "/MeetTheTeam/secretary.AVIF",
  },
  {
    id: 2,
    name: "Debabrata Sinha Roy",
    role: "Head of Temple Construction Committee",
    bio:
      "Debabrata leads the temple construction committee with strategic planning and technical oversight, ensuring that every phase of construction upholds structural integrity, tradition, and the collective vision of the community.",
    image: "/MeetTheTeam/head_Construction_Committee.AVIF",
  },
  {
    id: 3,
    name: "Surajit Dutta",
    role: "Joint Head of Temple Construction Committee",
    bio:
      "Surajit supports and coordinates key construction initiatives, working closely with engineers, artisans, and volunteers to ensure timely execution while preserving architectural and cultural values.",
    image: "/MeetTheTeam/Joint_head_of_temple_Construction_Committee.AVIF",
  },
  {
    id: 4,
    name: "Uttam Saha",
    role: "Assistant Secretary since 2009",
    bio:
      "Uttam has been assisting in administrative and organizational responsibilities since 2009, contributing to record management, member coordination, and day-to-day operational support with dedication and reliability.",
    image: "/MeetTheTeam/AssistantSecretary.AVIF",
  },
];

/* -------------------------------------------
 TESTIMONIALS DATA
--------------------------------------------*/
const testimonials = [
  {
    name: "Banibrata Das",
    role: "Donor",
    comment:
      "A heartfelt organization with deep community impact. Supporting this initiative has been a truly fulfilling experience.",
    image: "/MeetTheTeam/testimonials/BaniBrataDas.AVIF",
  },
  {
    name: "Chandidas Kumar",
    role: "Donor",
    comment:
      "Their transparency and dedication encouraged me to become a regular donor. Every contribution feels meaningful.",
    image: "/MeetTheTeam/testimonials/ChandidasKumar.AVIF",
  },
  {
    name: "Jagriti Som",
    role: "Community Member",
    comment:
      "The support we received transformed our village. Their work goes far beyond words.",
    image: "/MeetTheTeam/testimonials/JagritiSom.AVIF",
  },
  {
    name: "Kalidas Ghosh",
    role: "Volunteer",
    comment:
      "Every seva experience here brings peace and purpose. Truly a divine initiative.",
    image: "/MeetTheTeam/testimonials/Kalidas Ghosh.AVIF",
  },
  {
    name: "Kanika Sarkar",
    role: "Supporter",
    comment:
      "An organization driven by sincerity, devotion, and genuine care for people.",
    image: "/MeetTheTeam/testimonials/KanikaSarkar.AVIF",
  },
];

/* -------------------------------------------
 MAIN SECTION
--------------------------------------------*/
export default function MeetOurteamSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [visible, setVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember>(
    teamMembers[0]
  );

  /* Reveal on scroll */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="team"
      className="py-16 bg-gradient-to-br from-orange-50 to-amber-50"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* ---------------------------------
            HEADING
        ---------------------------------- */}
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

        {/* ---------------------------------
            TEAM SECTION (UNCHANGED)
        ---------------------------------- */}
        <div
          className={`grid md:grid-cols-[1fr_1.4fr] gap-10 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
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
            <p className="text-orange-600 text-sm uppercase mt-1">
              {selectedMember.role}
            </p>
            <p className="mt-4 text-gray-700">{selectedMember.bio}</p>

            <div className="grid grid-cols-4 gap-4 mt-8">
              {teamMembers.map((m) => (
                <button
                  key={m.id}
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

        {/* ---------------------------------
            TESTIMONIAL CARDS (NEW)
        ---------------------------------- */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center">Testimonials</h3>
          <div className="w-24 h-1 mx-auto mt-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
          <p className="mt-4 text-center text-gray-600 max-w-xl mx-auto">
            Real voices from people whose lives have been touched by our work.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: prefersReducedMotion ? 0 : i * 0.15,
                  duration: 0.6,
                  ease: "easeOut",
                }}
                whileHover={{ y: -8 }}
                className="relative bg-white rounded-3xl shadow-xl p-6 text-center"
              >
                {/* Wing effect */}
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 blur-xl opacity-60" />

                {/* Photo */}
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-amber-400 mb-4">
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>

                {/* Text */}
                <h4 className="font-bold text-lg">{t.name}</h4>
                <p className="text-xs uppercase text-orange-600">{t.role}</p>

                <p className="mt-4 text-gray-700 text-sm leading-relaxed">
                  “{t.comment}”
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
