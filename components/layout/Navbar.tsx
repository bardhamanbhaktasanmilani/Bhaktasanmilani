"use client";

import React, {
  useState,
  useEffect,
  useRef,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // For animating the drawer AFTER it mounts
  const [drawerAnimatedIn, setDrawerAnimatedIn] = useState(false);

  // refs for accessibility
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "How We Work", href: "#how-we-work" },
    { name: "Donate", href: "#donate" },
    { name: "MeetTeam", href: "#team" },
    { name: "Contact Us", href: "#contact" },
  ];

  const scrollToSection = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setIsOpen(false);
    }
  };

  // Close with Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent | KeyboardEventInit) => {
      // @ts-ignore
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown as any);
    return () => window.removeEventListener("keydown", onKeyDown as any);
  }, [isOpen]);

  // Focus first nav link when menu opens
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 180);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isOpen]);

  // Handle drawer slide-in animation AFTER mount
  useEffect(() => {
    if (!isOpen) {
      setDrawerAnimatedIn(false);
      return;
    }
    setDrawerAnimatedIn(false);
    const t = setTimeout(() => {
      setDrawerAnimatedIn(true);
    }, 30); // tiny delay so browser sees the start state
    return () => clearTimeout(t);
  }, [isOpen]);

  const linkBaseClasses =
    "relative font-medium transition-colors duration-300 group";
  const linkColorClasses = scrolled ? "text-gray-900" : "text-white";
  const linkHoverClasses = "hover:text-orange-600";

  const mobileMenuButtonClasses =
    scrolled || isOpen
      ? "text-gray-900 hover:text-orange-600"
      : "text-white hover:text-orange-600";

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-gray-200"
            : "bg-transparent"
        }`}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between h-16 px-3 mx-auto max-w-6xl sm:h-20 sm:px-4 lg:px-6 xl:px-8 2xl:max-w-7xl">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-lg font-bold text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text sm:text-xl md:text-2xl xl:text-3xl">
              Bhakta Sammilan ॐ
            </h1>
          </div>

          {/* Desktop Nav (only on xl and above) */}
          <div className="items-center hidden space-x-5 xl:flex 2xl:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`${linkBaseClasses} ${linkColorClasses} ${linkHoverClasses} text-sm 2xl:text-base`}
              >
                {link.name}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-orange-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}

            {/* Admin login button (desktop) */}
            <a
              href="/admin/login"
              className="rounded-full border border-orange-500/80 px-4 py-1.5 text-xs font-semibold text-orange-600 bg-white/80 backdrop-blur hover:bg-orange-50 hover:border-orange-600 transition-all duration-300 2xl:px-5 2xl:py-2 2xl:text-sm"
            >
              Admin Login
            </a>

            <a
              href="#donate"
              onClick={(e) => scrollToSection(e, "#donate")}
              className="rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg 2xl:px-6 2xl:py-2.5 2xl:text-sm"
            >
              Donate Now
            </a>
          </div>

          {/* Mobile / Tablet Menu Button (up to lg & xl) */}
          <div className="flex items-center xl:hidden">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className={`transition-colors ${mobileMenuButtonClasses} focus:outline-none focus:ring-2 focus:ring-orange-300/60 rounded-md p-1.5`}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              <span
                className={`inline-block transform transition-transform duration-400 ${
                  isOpen ? "rotate-90" : "rotate-0"
                }`}
              >
                {isOpen ? <X size={26} /> : <Menu size={26} />}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE / TABLET RIGHT-SIDE DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            style={{
              opacity: drawerAnimatedIn ? 1 : 0,
              transition: "opacity 500ms ease-out",
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer with 3D slide-in */}
          <div
            className="absolute inset-y-0 right-0 flex max-w-full"
            style={{ perspective: "1400px" }}
          >
            <div
              className="w-[82vw] max-w-xs sm:w-72 bg-white/95 border-l border-gray-200 shadow-xl flex flex-col origin-right"
              style={{
                transform: drawerAnimatedIn
                  ? "translateX(0) rotateY(0deg) scale(1)"
                  : "translateX(100%) rotateY(-18deg) scale(0.96)",
                transition:
                  "transform 650ms cubic-bezier(0.21, 0.9, 0.24, 1), box-shadow 650ms",
                boxShadow: drawerAnimatedIn
                  ? "0 24px 60px rgba(15,23,42,0.35)"
                  : "0 10px 30px rgba(15,23,42,0.15)",
                backdropFilter: "blur(6px)",
              }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sm:py-4">
                <span className="text-base font-semibold text-gray-900 sm:text-lg">
                  Menu
                </span>
           
              </div>

              <nav className="px-4 pt-3 pb-6 sm:pb-7">
                <ul className="space-y-2 sm:space-y-3">
                  {navLinks.map((link, idx) => (
                    <li
                      key={link.name}
                      style={{
                        opacity: drawerAnimatedIn ? 1 : 0,
                        transform: drawerAnimatedIn
                          ? "translateY(0)"
                          : "translateY(8px)",
                        transition:
                          "opacity 420ms ease-out, transform 420ms ease-out",
                        transitionDelay: `${140 + idx * 70}ms`,
                      }}
                    >
                      <a
                        ref={idx === 0 ? firstLinkRef : undefined}
                        href={link.href}
                        onClick={(e) => scrollToSection(e, link.href)}
                        className="block py-2 px-2 rounded-md text-sm font-medium text-gray-800 transition-colors hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300/60"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-2 sm:space-y-3">
                  <a
                    href="/admin/login"
                    className="block w-full px-6 py-2.5 text-center text-sm font-semibold text-orange-600 border border-orange-500/80 rounded-full bg-white hover:bg-orange-50 hover:border-orange-600 transition-all"
                  >
                    Admin Login
                  </a>

                  <a
                    href="#donate"
                    onClick={(e) => scrollToSection(e, "#donate")}
                    className="block w-full px-6 py-2.5 text-center text-sm font-semibold text-white transition-all rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg"
                  >
                    Donate Now
                  </a>
                </div>
              </nav>

              <div className="mt-auto h-4 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
