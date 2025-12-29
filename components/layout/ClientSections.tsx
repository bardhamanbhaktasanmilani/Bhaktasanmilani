"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AboutSection = dynamic(() => import("../sections/AboutSection"), { ssr: false });
const HowWeWorkSection = dynamic(() => import("../sections/HowWeWorkSection"), { ssr: false });
const DonateSection = dynamic(() => import("../sections/DonateSection"), { ssr: false });
const MeetOurteam = dynamic(() => import("../sections/MeetOurteamSection"), { ssr: false });
const ContactSection = dynamic(() => import("../sections/ContactSection"), { ssr: false });


export default function ClientSections() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestIdleCallback(() => setMounted(true));
    return () => cancelIdleCallback(id);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <AboutSection />
      <HowWeWorkSection />
      <DonateSection />
      <MeetOurteam />
      <ContactSection />
    
    </>
  );
}
