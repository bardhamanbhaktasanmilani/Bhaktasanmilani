"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Target,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  Home,
  Stethoscope,
} from "lucide-react";
import EventsSection from "../sub-sections/HowWeWork/EventsSection";


export const metadata = {
  title: "How We Work – Transparency & Accountability",
  description:
    "Discover how Bhakta Sanmilani Temple plans, executes, and monitors community initiatives with full transparency and accountability.",
};


const steps = [
  {
    icon: Target,
    title: "Identify Needs",
    description:
      "We research and identify communities and causes that need our support the most.",
  },
  {
    icon: Users,
    title: "Community Engagement",
    description:
      "We connect with local communities to understand their specific requirements.",
  },
  {
    icon: TrendingUp,
    title: "Strategic Planning",
    description:
      "Our team develops comprehensive action plans with clear goals and timelines.",
  },
  {
    icon: Award,
    title: "Implementation",
    description:
      "We execute projects with dedication, transparency, and regular monitoring.",
  },
];

const causes = [
  {
    icon: BookOpen,
    title: "Education",
    description:
      "Providing quality education and resources to underprivileged children.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Stethoscope,
    title: "Healthcare",
    description:
      "Organizing medical camps and providing healthcare support to those in need.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Home,
    title: "Shelter",
    description: "Building homes and providing shelter for homeless families.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Heart,
    title: "Community Service",
    description:
      "Supporting various community development and welfare programs.",
    color: "from-red-500 to-pink-500",
  },
];


export default function HowWeWorkSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const [visible, setVisible] = useState<boolean[]>(
    Array(steps.length).fill(false)
  );


  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;

    let revealed = false;

    const revealAll = () => {
      setVisible(Array(steps.length).fill(true));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !revealed) {
          revealed = true;

          steps.forEach((_, i) => {
            setTimeout(() => {
              setVisible((prev) => {
                const updated = [...prev];
                updated[i] = true;
                return updated;
              });
            }, i * 300);
          });

          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -80px 0px",
      }
    );

    observer.observe(target);

   
    const fallback = setTimeout(() => {
      if (!revealed) {
        revealAll();
        observer.disconnect();
      }
    }, 1200);

    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="how-we-work"
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-orange-50 to-amber-50"
      aria-labelledby="howwework-heading"
    >
      <div className="max-w-7xl px-4 mx-auto sm:px-6 lg:px-8">
        {/* HEADING */}
        <div className="text-center mb-16">
          <h2
            id="howwework-heading"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            How We{" "}
            <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
              Work
            </span>
          </h2>

          <div className="h-1 w-24 mx-auto mb-6 bg-gradient-to-r from-orange-600 to-amber-600" />

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our systematic approach ensures every donation creates maximum
            impact.
          </p>
        </div>

        {/* TIMELINE */}
        <div className="relative max-w-5xl mx-auto mb-20">
          <div className="hidden lg:block absolute inset-y-6 left-1/2 w-px -translate-x-1/2 border-l-2 border-dashed border-orange-300/70" />

          <div className="space-y-14">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={index}
                  className={`relative grid items-center gap-6 lg:gap-16 lg:grid-cols-[1fr_auto_1fr] ${
                    isLeft ? "lg:-translate-y-1" : "lg:translate-y-3"
                  }`}
                >
                  {isLeft ? (
                    <>
                      <StepCard
                        step={step}
                        index={index}
                        show={visible[index]}
                      />
                      <CenterNode index={index} />
                      <div className="hidden lg:block" />
                    </>
                  ) : (
                    <>
                      <div className="hidden lg:block" />
                      <CenterNode index={index} />
                      <StepCard
                        step={step}
                        index={index}
                        show={visible[index]}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOCUS AREAS */}
        <div className="mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Our Focus Areas
          </h3>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {causes.map((cause, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                <div
                  className={`w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br ${cause.color} mb-4 shadow-lg`}
                >
                  <cause.icon className="w-8 h-8 text-white" />
                </div>

                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  {cause.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {cause.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TRANSPARENCY */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-8 md:p-12 rounded-3xl text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Transparency & Accountability
          </h3>

          <p className="max-w-3xl mx-auto text-xl mb-8 opacity-95">
            We maintain complete transparency in our operations. Regular reports
            and updates ensure you know exactly how your contributions are making
            a difference.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StatCard label="Fund Utilization" value="100%" />
            <StatCard label="Progress Reports" value="Monthly" />
            <StatCard label="Impact Assessment" value="Verified" />
          </div>
        </div>

        {/* EVENTS */}
        <div className="mt-20" id="events">
          <h3 className="sr-only">Events</h3>
          <EventsSection />
        </div>
      </div>
    </section>
  );
}



function CenterNode({ index }: { index: number }) {
  return (
    <div className="hidden lg:flex items-center justify-center relative">
      <div className="w-16 h-16 rounded-full bg-orange-500/20 blur-xl absolute" />
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg text-white font-semibold flex items-center justify-center relative z-10">
        {index + 1}
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
  show,
}: {
  step: any;
  index: number;
  show: boolean;
}) {
  const Icon = step.icon;
  const isLeft = index % 2 === 0;

  return (
    <div
      className={`relative max-w-md transition-all duration-700 ease-out ${
        show
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 md:opacity-0"
      }`}
    >
      {isLeft ? (
        <span className="hidden lg:block absolute top-1/2 -right-12 w-10 border-t border-dashed border-orange-300/80" />
      ) : (
        <span className="hidden lg:block absolute top-1/2 -left-12 w-10 border-t border-dashed border-orange-300/80" />
      )}

      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 shadow-[0_18px_45px_rgba(194,65,12,0.25)] border border-orange-100/70 overflow-hidden">
        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-600 via-amber-500 to-orange-400 shadow-xl">
            <Icon className="w-8 h-8 text-white" />
          </div>

          <div>
            <div className="lg:hidden inline-flex mb-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
              Step {index + 1}
            </div>

            <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
            <p className="text-gray-600 mt-1 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <h4 className="text-4xl font-bold mb-2">{value}</h4>
      <p className="text-lg opacity-90">{label}</p>
    </div>
  );
}
