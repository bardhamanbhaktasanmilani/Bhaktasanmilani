"use client";

import React, { useCallback, useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";


const PHONE = "+91 84369 22630";
const TEL_HREF = "tel:+918436922630";
const EMAIL = "bardhamanbhaktasanmilani@gmail.com";
const MAILTO_HREF = `mailto:${EMAIL}`;


function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(Boolean(mq.matches));
    const handler = () => setReduced(Boolean(mq.matches));
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}


const smoothScrollToElement = (el: Element | null, offset = 80) => {
  if (!el || typeof window === "undefined") return;
  const elementPosition = el.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  window.scrollTo({ top: offsetPosition, behavior: "smooth" });
};


export default function Footer() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const router = useRouter();
  const pathname = usePathname();


  const scrollToSection = useCallback((href: string) => {
    if (typeof window === "undefined") return;

    const id = href.startsWith("#") ? href.slice(1) : href;
    let element: Element | null = null;

    try {
      element = document.getElementById(id) || document.querySelector(href);
    } catch (e) {
      element = null;
    }

    if (!element) return;
    smoothScrollToElement(element);
  }, []);

  const handleNavigateToSection = useCallback(
    async (href: string) => {
   
      if (!href.startsWith("#")) {
        await router.push(href);
        return;
      }

   
      if (pathname === "/" || pathname === "" || pathname === null) {
        scrollToSection(href);
        return;
      }

      
      const id = href.slice(1);
      await router.push(`/#${id}`);

      let attempts = 0;
      const maxAttempts = 6;
      const tryScroll = () => {
        attempts += 1;
        const el =
          document.getElementById(id) ||
          (href ? document.querySelector(href) : null);

        if (el) {
          smoothScrollToElement(el);
          return;
        }

        if (attempts < maxAttempts) setTimeout(tryScroll, 160);
      };

      setTimeout(tryScroll, 60);
    },
    [pathname, router, scrollToSection]
  );


  const socialLinks = useMemo(
    () => [
      { Icon: Facebook, label: "Facebook", href: "#" },
      { Icon: Twitter, label: "Twitter", href: "#" },
      { Icon: Instagram, label: "Instagram", href: "#" },
      { Icon: Youtube, label: "YouTube", href: "#" },
    ],
    []
  );

  const quickLinks = useMemo(
    () => [
      { label: "Home", href: "#home" },
      { label: "About Us", href: "#about" },
      { label: "Donate", href: "#donate" },
      { label: "How We Work", href: "#how-we-work" },
      { label: "Meet The Team", href: "#team" },
      { label: "Contact Us", href: "#contact" },
    ],
    []
  );

  const policyLinks = useMemo(
    () => [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Return Policy", href: "/return-policy" },
      { label: "FAQ", href: "/faq" },
    ],
    []
  );

 
  const transitionClass = prefersReducedMotion
    ? ""
    : "transition-transform transition-opacity duration-400 ease-[cubic-bezier(.22,.1,.12,.98)]";

  return (
    <footer className="bg-gray-950 text-white pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-10 mb-10 sm:grid-cols-2 lg:grid-cols-5 ${transitionClass}`}
          
          style={{ opacity: 1 }}
        >
         
          <div className={`${transitionClass}`}>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              ॐ BhaktaSanmilani 
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              United by faith, driven by compassion. Join us in making a meaningful
              difference through devotion and service.
            </p>

            <div className="flex gap-3">
              {socialLinks.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("#") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

         
          <div className={`${transitionClass}`}>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavigateToSection(item.href)}
                    className="hover:text-orange-400 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

         
          <div className={`${transitionClass}`}>
            <h4 className="font-bold mb-4">Our Causes</h4>
            <ul className="space-y-3 text-gray-400">
              <li>Education for All</li>
              <li>Healthcare Support</li>
              <li>Shelter & Housing</li>
              <li>Community Development</li>
              <li>Spiritual Upliftment</li>
            </ul>
          </div>

      
          <div className={`${transitionClass}`}>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              {policyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-orange-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        
          <div className={`${transitionClass}`}>
            <h4 className="font-bold mb-4">Contact Info</h4>
            <ul className="space-y-3 text-gray-400">
              <li>R.B Chatterjee Road, Tikorhat</li>
              <li>Bardhaman, West Bengal – 713102</li>
              <li className="mt-4">
                <a href={TEL_HREF} className="hover:text-orange-400">
                  {PHONE}
                </a>
              </li>
              <li>
                <a href={MAILTO_HREF} className="hover:text-orange-400 break-all">
                  {EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

       
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500">
          <p>© 2025 BhaktaSanmilani. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
