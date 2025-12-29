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
     
      <Image
        src="/hero/Hero4.AVIF"
        alt="Donation and service background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        
      />

    
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
    </section>
  );
}
