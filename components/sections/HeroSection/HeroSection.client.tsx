"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const slides = [
  {
    image: "/hero/bg-photo (1).AVIF",
    title: "Share your Contribution to Construct the Krishna Temple",
    subtitle: "A sacred space built on faith, purity, and timeless tradition",
    more:
      "Rising in serene white, our temple stands as a symbol of devotion, service, and spiritual unity. Through prayer, community effort, and selfless contribution, we preserve sacred heritage and inspire generations to walk the path of faith and compassion.",
  },
  {
    image: "/hero/Hero4.AVIF",
    title: "Unite in Faith, Serve with Love",
    subtitle: "Join us in making a difference through devotion and service",
    more:
      "Our mission is rooted in compassion, faith, and collective service. Every contribution helps us uplift communities, preserve spiritual values, and create lasting impact through meaningful action.",
  },
  {
    image: "/hero/bg-photo (2).AVIF",
    title: "Empowering Communities",
    subtitle: "Your contribution brings hope and happiness to those in need",
    more:
      "Through donations and community-driven initiatives, we support education, healthcare, and social welfare programs that bring dignity and opportunity to underserved lives.",
  },
  {
    image: "/hero/bg-photo (3).AVIF",
    title: "Together We Grow",
    subtitle: "Building a stronger community through faith and compassion",
    more:
      "Unity and service go hand in hand. By standing together, we strengthen our collective spirit and ensure that no one is left behind on the path of progress.",
  },
  {
    image: "/hero/bg-photo (4).AVIF",
    title: "When the heart bows, blessings rise",
    subtitle: "ॐ शान्तिः शान्तिः शान्तिः — May peace dwell within.",
    more:
      "True peace begins within. Our initiatives encourage mindfulness, harmony, and spiritual balance while supporting those seeking guidance, relief, and hope.",
  },
];

export default function HeroSectionClient() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLearnMore, setShowLearnMore] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((i) => (i + 1) % slides.length);
      setShowLearnMore(false);
    }, 12000);

    return () => clearInterval(id);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Background images */}
      {slides.map((s, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== currentSlide}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority={index === 0}
          />
          {/* A subtle overlay so white text keeps good contrast on bright images */}
          <div className={`absolute inset-0 ${index === currentSlide ? "bg-black/20" : "bg-black/10"} pointer-events-none`} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-30 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:py-28 md:py-32">
          <div className="max-w-3xl">
            {/* TITLE (plain text — no glow) */}
            <h1
              key={slide.title}
              className={`mb-4 text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl ${
                currentSlide === 0 ? "text-black" : "text-white"
              }`}
            >
              {slide.title}
            </h1>

            {/* SUBTITLE (plain white text) */}
            <p
              key={slide.subtitle}
              className={`text-lg sm:text-xl md:text-2xl ${
                currentSlide === 0 ? "text-black/85" : "text-white/90"
              }`}
            >
              {slide.subtitle}
            </p>

            {/* Learn more (collapsible paragraph) */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showLearnMore
                  ? "max-h-40 opacity-100 translate-y-0 mt-4"
                  : "max-h-0 opacity-0 -translate-y-2"
              }`}
            >
              <p
                className={`text-base sm:text-lg ${
                  currentSlide === 0 ? "text-black/85" : "text-white/90"
                }`}
              >
                {slide.more}
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 pointer-events-auto">
              <Button
                size="lg"
                onClick={() =>
                  document.getElementById("donate")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                Donate Now
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowLearnMore((v) => !v)}
              >
                {showLearnMore ? "Learn Less" : "Learn More"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="pointer-events-auto absolute bottom-6 sm:bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-3 rounded-full transition-all ${
              i === currentSlide ? "w-8 bg-white" : "w-3 bg-white/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
