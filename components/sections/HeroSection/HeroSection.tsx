"use client";

import dynamic from "next/dynamic";
import HeroSectionServer from "./HeroSection.server.temp";

const HeroSectionClient = dynamic(
  () => import("./HeroSection.client"),
  { ssr: false }
);

export default function HeroSection() {
  return (
    <div className="relative">
      <HeroSectionServer />
      <HeroSectionClient />
    </div>
  );
}
