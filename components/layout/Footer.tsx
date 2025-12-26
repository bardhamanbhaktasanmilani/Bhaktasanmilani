"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

/* -------------------------------------------
 CONSTANTS
--------------------------------------------*/
const PHONE = "+91 84369 22630";
const TEL_HREF = "tel:+918436922630";
const EMAIL = "bardhamanbhaktasanmilani@gmail.com";
const MAILTO_HREF = `mailto:${EMAIL}`;

/* -------------------------------------------
 ANIMATION VARIANTS (REUSED)
--------------------------------------------*/
const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

/* -------------------------------------------
 COMPONENT
--------------------------------------------*/
export default function Footer() {
  const prefersReducedMotion = useReducedMotion();

  /* -------------------------------------------
   SCROLL HANDLER (OPTIMIZED)
  --------------------------------------------*/
  const scrollToSection = useCallback((href: string) => {
    if (typeof window === "undefined") return;

    const element = document.querySelector(href);
    if (!element) return;

    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }, []);

  /* -------------------------------------------
   MEMOIZED DATA
  --------------------------------------------*/
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

  return (
    <footer className="relative pt-16 pb-10 overflow-hidden text-white bg-gray-950">
      {/* ---------------------------------
          AMBIENT BLOBS (GPU SAFE)
      ---------------------------------- */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute rounded-full -top-20 -left-20 w-72 h-72 bg-orange-600/20 blur-3xl"
            animate={{ x: [0, 40, -20, 0], y: [0, -20, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-amber-400/10 blur-[90px]"
            animate={{ x: [0, -30, 30, 0], y: [0, 20, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ---------------------------------
            GRID
        ---------------------------------- */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="grid gap-10 mb-10 sm:grid-cols-2 lg:grid-cols-5"
        >
          {/* Brand */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-2xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text">
              Bhakta Sammilan ॐ
            </h3>
            <p className="mb-6 text-gray-400 leading-relaxed">
              United by faith, driven by compassion. Join us in making a meaningful
              difference through devotion and service.
            </p>

            <div className="flex gap-3">
              {socialLinks.map(({ Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("#") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  whileHover={
                    prefersReducedMotion ? undefined : { scale: 1.15, rotate: 5 }
                  }
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-600"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="mb-4 text-lg font-bold">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="relative group hover:text-orange-400"
                  >
                    {item.label}
                    <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-orange-400 transition-all group-hover:w-full" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Causes */}
          <motion.div variants={itemVariants}>
            <h4 className="mb-4 text-lg font-bold">Our Causes</h4>
            <ul className="space-y-3 text-gray-400">
              <li>Education for All</li>
              <li>Healthcare Support</li>
              <li>Shelter & Housing</li>
              <li>Community Development</li>
              <li>Spiritual Upliftment</li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants}>
            <h4 className="mb-4 text-lg font-bold">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              {policyLinks.map((item) => (
                <li key={item.label}>
                  <motion.div whileHover={prefersReducedMotion ? undefined : { x: 6 }}>
                    <Link
                      href={item.href}
                      className="relative group inline-block hover:text-orange-400"
                    >
                      {item.label}
                      <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-orange-400 transition-all group-hover:w-full" />
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h4 className="mb-4 text-lg font-bold">Contact Info</h4>
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
          </motion.div>
        </motion.div>

        {/* ---------------------------------
            BOTTOM BAR
        ---------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-800"
        >
          <p className="text-gray-500">
            © 2024 Bhakta Sammilan. All rights reserved.
          </p>
          <p className="text-gray-400">Sankha Subhra Das</p>
        </motion.div>
      </div>
    </footer>
  );
}
