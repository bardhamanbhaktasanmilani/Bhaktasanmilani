"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    image: "/hero/Hero4.AVIF",
    title: "Unite in Faith, Serve with Love",
    subtitle: "Join us in making a difference through devotion and service",
    more: "Our mission is rooted in compassion, faith, and collective service. Every contribution helps us uplift communities, preserve spiritual values, and create lasting impact through meaningful action.",
  },
  {
    image: "/hero/bg-photo (2).AVIF",
    title: "Empowering Communities",
    subtitle: "Your contribution brings hope and happiness to those in need",
    more: "Through donations and community-driven initiatives, we support education, healthcare, and social welfare programs that bring dignity and opportunity to underserved lives.",
  },
  {
    image: "/hero/bg-photo (3).AVIF",
    title: "Together We Grow",
    subtitle: "Building a stronger community through faith and compassion",
    more: "Unity and service go hand in hand. By standing together, we strengthen our collective spirit and ensure that no one is left behind on the path of progress.",
  },
  {
    image: "/hero/bg-photo (4).AVIF",
    title: "When the heart bows, blessings rise",
    subtitle: "ॐ शान्तिः शान्तिः शान्तिः — May peace dwell within.",
    more: "True peace begins within. Our initiatives encourage mindfulness, harmony, and spiritual balance while supporting those seeking guidance, relief, and hope.",
  },
];

export default function HeroSectionClient() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLearnMore, setShowLearnMore] = useState(false);

  /* Auto slide */
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((i) => (i + 1) % slides.length);
      setShowLearnMore(false); // reset on slide change
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Background carousel */}
      {slides.map((s, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-30 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="max-w-3xl text-white">
            <h1
              key={slide.title}
              className="mb-4 text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in"
            >
              {slide.title}
            </h1>

            <p
              key={slide.subtitle}
              className="text-lg sm:text-xl md:text-2xl animate-fade-in"
            >
              {slide.subtitle}
            </p>

            {/* Learn more animated text */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showLearnMore
                  ? "max-h-40 opacity-100 translate-y-0 mt-4"
                  : "max-h-0 opacity-0 -translate-y-2"
              }`}
            >
              <p className="text-base sm:text-lg text-white/90">
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

      {/* Navigation arrows */}
      <button
        aria-label="Previous slide"
        onClick={() =>
          setCurrentSlide((i) => (i - 1 + slides.length) % slides.length)
        }
        className="pointer-events-auto absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur"
      >
        <ChevronLeft />
      </button>

      <button
        aria-label="Next slide"
        onClick={() =>
          setCurrentSlide((i) => (i + 1) % slides.length)
        }
        className="pointer-events-auto absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur"
      >
        <ChevronRight />
      </button>

      {/* Dots */}
      <div className="pointer-events-auto absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-3 rounded-full transition-all ${
              i === currentSlide ? "w-8 bg-white" : "w-3 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
