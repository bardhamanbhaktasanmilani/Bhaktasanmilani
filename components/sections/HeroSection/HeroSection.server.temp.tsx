import Image from "next/image";

export default function HeroSectionServer() {
  return (
    <section
      id="home"
      aria-label="Hero section"
      className="
        relative
        w-full
        min-h-[100svh]
        h-[100svh]
        overflow-hidden
        isolate
      "
    >
      {/* LCP image only (static, SEO-safe) */}
      <Image
        src="/hero/Hero4.jpg"
        alt="Donation and service background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        
      />

      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
    </section>
  );
}
