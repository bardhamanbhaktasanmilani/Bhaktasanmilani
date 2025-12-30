"use client";

import React, { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";


type Leaf = { name: string; href: string };
type SubGroup = { name: string; key: string; children: Leaf[] };
type Parent = { name: string; children: Array<SubGroup | Leaf> };
type NavItem = Leaf | Parent;


const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");


function isParent(item: NavItem): item is Parent {
  return (item as Parent).children !== undefined && Array.isArray((item as Parent).children);
}
function isSubGroup(sub: SubGroup | Leaf): sub is SubGroup {
  return (sub as SubGroup).children !== undefined && Array.isArray((sub as SubGroup).children);
}


const waitForExactElement = (selector: string, timeout = 5000): Promise<Element | null> =>
  new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      try {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
      } catch (e) {
      
        return resolve(null);
      }
      if (Date.now() - start > timeout) return resolve(null);
      requestAnimationFrame(check);
    };
    check();
  });


const smoothScrollToHash = (hash: string, offset = 80) => {
  try {
    const el = document.querySelector(hash) as HTMLElement | null;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  } catch (e) {
 
  }
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [openSideMenu, setOpenSideMenu] = useState<string | null>(null);

  const [mobileOpen, setMobileOpen] = useState<Record<string, boolean>>({});

  const navRef = useRef<HTMLDivElement | null>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  const router = useRouter();
  const pathname = usePathname() || "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

 
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setOpenSideMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setOpenDropdown(null);
        setOpenSideMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const scrollToSection = async (e: ReactMouseEvent<HTMLAnchorElement> | React.MouseEvent, href: string) => {
    if (!href) return;

  
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) {
      
    }

    const hash = href.slice(hashIndex); 
    if (!hash) return;

   
    e.preventDefault();

   
    const normalize = (p: string) => (p === "" ? "/" : p.replace(/\/index$/, "/"));
    const currentPathNormalized = normalize(pathname);

    const alreadyOnRoot = currentPathNormalized === "/";

    const closeMenus = () => {
      setIsOpen(false);
      setOpenDropdown(null);
      setOpenSideMenu(null);
    };

    if (alreadyOnRoot) {
      
      const el = document.querySelector(hash);
      if (el) {
        smoothScrollToHash(hash);
        closeMenus();
        return;
      }
      // poll briefly using rAF helper
      const found = await waitForExactElement(hash, 3000);
      if (found) smoothScrollToHash(hash);
      closeMenus();
      return;
    }

    
    try {
      await router.push("/"); 
    } catch (err) {
      // fallback to full navigation if client navigation fails
      window.location.href = "/";
      return;
    }

    // After navigation, wait for the exact subsection (longer timeout because page may hydrate)
    const found = await waitForExactElement(hash, 5000);
    if (found) {
      smoothScrollToHash(hash);
    } else {
      
      setTimeout(() => {
        smoothScrollToHash(hash);
      }, 200);
    }

    closeMenus();
  };

  const nav: NavItem[] = [
    { name: "Home", href: "/#home" },

    {
      name: "About",
      children: [
        {
          name: "Gallery",
          key: "gallery",
          children: [
            { name: "Religion", href: "/#gallery-religion" },
            { name: "Yoga Classes", href: "/#gallery-yoga" },
            { name: "Covid Reliefs", href: "/#gallery-covid" },
          ],
        },
      ],
    },

    {
      name: "How We Work",
      children: [{ name: "Events", href: "/#events" }],
    },

    { name: "Donate", href: "/#donate" },

    {
      name: "Meet Our Organizers",
      children: [{ name: "Testimonials", href: "/#testimonials" }],
    },

    { name: "Contact Us", href: "/#contact" },
  ];

  const linkColor = scrolled ? "text-gray-900" : "text-white";

  /* animation variants */
  const dropdownVariant = {
    hidden: { opacity: 0, y: -6, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -6, scale: 0.98 },
  };

  const drawerVariant = {
    hidden: { x: "100%" },
    visible: { x: 0 },
  };

  return (
    <>
     <nav
  ref={navRef}
  className={cn(
    "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
    scrolled
      ? "bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm"
      : "bg-black/40 backdrop-blur-sm border-b border-transparent"
  )}
  aria-label="Primary Navigation"
>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <a
                href="#home"
                onClick={(e) => scrollToSection(e as any, "#home")}
                className="inline-flex items-center gap-2"
                aria-label="Bhakta Sammilan - Home"
              >
                <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-400">
                  ॐ BhaktaSanmilani 
                </span>
              </a>
            </div>

            {/* Desktop nav */}
            <div className="hidden xl:flex items-center gap-6">
              {nav.map((item) =>
                isParent(item) ? (
                  <div key={item.name} className="relative">
                    <button
                      aria-haspopup="true"
                      aria-expanded={openDropdown === item.name}
                      onClick={() => setOpenDropdown((prev) => (prev === item.name ? null : item.name))}
                      className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium", linkColor)}
                    >
                      <span>{item.name}</span>
                      <motion.span animate={{ rotate: openDropdown === item.name ? 180 : 0 }} transition={{ duration: 0.25 }} aria-hidden>
                        <ChevronDown className="w-4 h-4" />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {openDropdown === item.name && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={dropdownVariant}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full left-0 mt-3 w-64 rounded-xl bg-white shadow-2xl border border-gray-100 p-2 z-50"
                          role="menu"
                          aria-label={`${item.name} submenu`}
                        >
                          {item.children.map((sub) =>
                            isSubGroup(sub) ? (
                              <div key={sub.key} className="space-y-2">
                                <div className="text-xs font-semibold text-gray-700 mb-1 px-2">{sub.name}</div>
                                <div className="space-y-1">
                                  {sub.children.map((c) => (
                                    <a
                                      key={c.name}
                                      href={c.href}
                                      onClick={(e) => scrollToSection(e as any, c.href)}
                                      className="block px-3 py-2 text-sm rounded-md hover:bg-orange-50"
                                      role="menuitem"
                                    >
                                      {c.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <a
                                key={sub.name}
                                href={sub.href}
                                onClick={(e) => scrollToSection(e as any, sub.href)}
                                className="block px-3 py-2 text-sm rounded-md hover:bg-orange-50"
                                role="menuitem"
                              >
                                {sub.name}
                              </a>
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => scrollToSection(e as any, item.href)}
                    className={cn("text-sm font-medium px-2 py-1.5 rounded-md transition", linkColor)}
                  >
                    {item.name}
                  </a>
                )
              )}

              <a href="/admin/login" className="rounded-full border border-orange-500 px-4 py-1.5 text-sm text-orange-600 hover:bg-orange-50 transition">
                Admin Login
              </a>

              <a
                href="#donate"
                onClick={(e) => scrollToSection(e as any, "#donate")}
                className="rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2 text-sm text-white transform transition hover:scale-[1.03] shadow-sm"
              >
                Donate Now
              </a>
            </div>

            {/* Mobile toggle */}
            <div className="xl:hidden">
              <button
                aria-label={isOpen ? "Close menu" : "Open menu"}
                onClick={() =>
                  setIsOpen((prev) => {
                    const next = !prev;
                    // focus after opening
                    if (next) {
                      setTimeout(() => {
                        if (mobileCloseBtnRef.current) mobileCloseBtnRef.current.focus();
                      }, 120);
                    }
                    return next;
                  })
                }
                className={cn(
                  "p-2 rounded-md",
                 
                  scrolled ? "bg-white/20 text-gray-800" : "bg-white/10 text-white"
                )}
              >
             
                {isOpen ? <X size={22} className={cn(scrolled ? "text-gray-800" : "text-white")} /> : <Menu size={22} className={cn(scrolled ? "text-gray-800" : "text-white")} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

     
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              aria-hidden
            />

            <motion.aside
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariant}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-full w-[78vw] max-w-xs bg-white shadow-2xl p-4 overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-lg">Menu</div>
                <button ref={mobileCloseBtnRef} onClick={() => setIsOpen(false)} aria-label="Close menu" className="p-2 rounded-md hover:bg-gray-50">
                  <X size={20} />
                </button>
              </div>

              <nav aria-label="Mobile Primary Navigation" className="space-y-3">
                {nav.map((item) => (
                  <div key={isParent(item) ? item.name : item.name}>
                    {isParent(item) ? (
                      <>
                        <button
                          onClick={() => setMobileOpen((p) => ({ ...p, [item.name]: !p[item.name] }))}
                          className="flex w-full items-center justify-between py-2 px-2 rounded-md text-left font-medium hover:bg-gray-50"
                          aria-expanded={!!mobileOpen[item.name]}
                        >
                          <span>{item.name}</span>
                          <motion.span animate={{ rotate: mobileOpen[item.name] ? 180 : 0 }} transition={{ duration: 0.18 }}>
                            <ChevronDown className="w-4 h-4" />
                          </motion.span>
                        </button>

                        {mobileOpen[item.name] &&
                          item.children.map((sub) =>
                            isSubGroup(sub) ? (
                              <div key={sub.key} className="pl-4 mt-2">
                                <div className="text-xs font-semibold text-gray-700 mb-1">{sub.name}</div>
                                <div className="space-y-1">
                                  {sub.children.map((c) => (
                                    <a key={c.name} href={c.href} onClick={(e) => scrollToSection(e as any, c.href)} className="block py-1 px-2 rounded-md text-sm hover:bg-gray-50">
                                      {c.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <a key={sub.name} href={sub.href} onClick={(e) => scrollToSection(e as any, sub.href)} className="block py-2 px-2 rounded-md hover:bg-gray-50">
                                {sub.name}
                              </a>
                            )
                          )}
                      </>
                    ) : (
                      <a href={item.href} onClick={(e) => scrollToSection(e as any, item.href)} className="block py-2 px-2 rounded-md hover:bg-gray-50 font-medium">
                        {item.name}
                      </a>
                    )}
                  </div>
                ))}
              </nav>

              {/* Added admin & donate buttons to mobile drawer to match desktop */}
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="/admin/login"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-orange-500 px-4 py-1.5 text-sm text-orange-600 hover:bg-orange-50 transition text-center"
                >
                  Admin Login
                </a>

                <a
                  href="#donate"
                  onClick={(e) => scrollToSection(e as any, "#donate")}
                  className="rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2 text-sm text-white transform transition hover:scale-[1.03] shadow-sm text-center"
                >
                  Donate Now
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
