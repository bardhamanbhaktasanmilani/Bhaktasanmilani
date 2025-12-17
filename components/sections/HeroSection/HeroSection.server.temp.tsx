import Image from "next/image";

export default function HeroSectionServer() {
  return (
    <section
      id="home"
      className="relative w-full h-screen overflow-hidden"
      aria-label="Hero section"
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
