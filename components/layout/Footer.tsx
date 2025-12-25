"use client";

import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";
import Link from "next/link";

export default function Footer() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  // Contact values
  const PHONE = "+91 84369 22630";
  const TEL_HREF = "tel:+918436922630";
  const EMAIL = "bardhamanbhaktasanmilani@gmail.com";
  const MAILTO_HREF = `mailto:${EMAIL}`;

  const socialLinks = [
    { Icon: Facebook, label: "Facebook", href: "#" },
    { Icon: Twitter, label: "Twitter", href: "#" },
    { Icon: Instagram, label: "Instagram", href: "#" },
    { Icon: Youtube, label: "YouTube", href: "#" },
  ];

  const policyLinks = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Return Policy", href: "/return-policy" },
    {label :"FAQ",href:"/faq"},
  ];

  return (
    <footer className="relative pt-16 pb-10 overflow-hidden text-white bg-gray-950">
      {/* Ambient Blobs */}
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

      <div className="relative z-20 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, y: 40 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, staggerChildren: 0.15 },
            },
          }}
          className="grid gap-10 mb-10 sm:grid-cols-2 lg:grid-cols-5"
        >
          {/* Brand */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
            <h3 className="mb-4 text-2xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text">
              Bhakta Sammilan ॐ
            </h3>
            <p className="mb-6 leading-relaxed text-gray-400">
              United by faith, driven by compassion. Join us in making a meaningful difference
              through devotion and service.
            </p>

            <div className="flex gap-3">
              {socialLinks.map(({ Icon, label, href }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("#") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-600"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
            <h4 className="mb-4 text-lg font-bold">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              {[
                { label: "Home", href: "#home" },
                { label: "About Us", href: "#about" },
                { label: "Donate", href: "#donate" },
                { label: "How We Work", href: "#how-we-work" },
                { label: "Meet The Team", href: "#team" },
                { label: "Contact Us", href: "#contact" },
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="relative group hover:text-orange-400"
                  >
                    {item.label}
                    <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-orange-400 transition-all group-hover:w-full" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Causes */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
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
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
            <h4 className="mb-4 text-lg font-bold">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              {policyLinks.map((item, i) => (
                <li key={i}>
                  <motion.div whileHover={{ x: 6 }}>
                    <Link
                      href={item.href}
                      className="relative inline-block hover:text-orange-400 group"
                    >
                      {item.label}
                      <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-orange-400 transition-all group-hover:w-full" />
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}>
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

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-between gap-4 pt-8 border-t border-gray-800 md:flex-row"
        >
          <p className="text-gray-500">© 2024 Bhakta Sammilan. All rights reserved.</p>
          <p className="text-gray-400">Sankha Subhra Das</p>
        </motion.div>
      </div>
    </footer>
  );
}
