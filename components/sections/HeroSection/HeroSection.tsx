"use client";

import dynamic from "next/dynamic";
import HeroSectionServer from "./HeroSection.server.temp";
export const metadata = {
  title: "Official Temple Donations & Community Service",
  description:
    "Bhakta Sanmilani Temple enables secure online donations, transparent fund usage, and spiritual community service in India.",
};


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
