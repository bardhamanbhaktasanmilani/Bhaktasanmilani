"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AboutSection = dynamic(() => import("../sections/AboutSection"), {
  ssr: false,
});
const HowWeWorkSection = dynamic(() => import("../sections/HowWeWorkSection"), {
  ssr: false,
});
const DonateSection = dynamic(() => import("../sections/DonateSection"), {
  ssr: false,
});
const MeetOurteam = dynamic(() => import("../sections/MeetOurteamSection"), {
  ssr: false,
});
const ContactSection = dynamic(() => import("../sections/ContactSection"), {
  ssr: false,
});

export default function ClientSections() {
  const [mounted, setMounted] = useState(false);

useEffect(() => {
  if (typeof window === "undefined") return;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  let idleId: number | IdleCallbackHandle;

  if ("requestIdleCallback" in window) {
    idleId = window.requestIdleCallback(() => setMounted(true));
  } else {
    idleId = window.setTimeout(() => setMounted(true), 1);
  }

  return () => {
    if ("cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleId as IdleCallbackHandle);
    } else {
      window.clearTimeout(idleId as number);
    }
  };
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
