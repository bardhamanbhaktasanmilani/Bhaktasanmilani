"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import RoyalDecree from "./RoyalDecree";

type Event = {
  id: number | string;
  title: string;
  description: string;
  date: string;
  posterUrl?: string | null;
};

export default function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load events", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <section className="relative py-24 bg-gradient-to-br from-[#fff7ed] via-[#fffaf3] to-[#fff3e0]">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-800 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Upcoming Events
          </div>

          <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Devotional{" "}
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Gatherings
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Satsangs, seva drives and sacred assemblies — inscribed here as royal
            decrees for our devotees.
          </p>
        </div>

        {/* States */}
        {loading ? (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-amber-200 px-5 py-2 text-xs text-slate-700 shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-ping" />
              Loading events…
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-amber-100 bg-white/70 backdrop-blur px-8 py-12 text-center shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No events scheduled
            </h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Please return soon for upcoming devotional programs and sacred
              gatherings. 🙏
            </p>
          </div>
        ) : (
          <div className="grid gap-16 md:grid-cols-2">
            {events.map((event) => {
              const d = new Date(event.date);

              return (
                <RoyalDecree
                  key={event.id}
                  title={event.title}
                  description={event.description}
                  date={format(d, "dd MMM yyyy")}
                  time={format(d, "HH:mm")}
                >
                  {/* Poster */}
                  {event.posterUrl && (
                    <div className="relative mt-8 flex justify-center overflow-visible">
                      <div className="relative w-full max-w-md overflow-visible">
                        {/* Glow */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-200/40 to-orange-200/40 blur-xl" />

                        {/* Image */}
                        <img
                          src={event.posterUrl}
                          alt={`${event.title} poster`}
                          className="relative z-10 w-full rounded-2xl shadow-xl border border-amber-300 object-cover"
                        />

                        {/* Seal */}
                        <div className="absolute -bottom-4 left-1/2 z-20 -translate-x-1/2 h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg border border-amber-700" />
                      </div>
                    </div>
                  )}
                </RoyalDecree>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
