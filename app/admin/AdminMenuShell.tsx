"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/dashboard/analytics", label: "Analytics" },
  { href: "/admin/dashboard/events", label: "Events" },
];

export default function AdminMenuShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const openMenu = () => setOpen(true);
  const closeMenu = () => setOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      {/* TOP BAR */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          {/* LEFT SIDE: HAMBURGER + BRAND  */}
          <div className="flex items-center gap-3">
            {/* 🔹 MENU BUTTON: EXTREME LEFT (about 20px from edge) */}
            {!open && (
              <button
                onClick={openMenu}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-2 shadow-sm hover:bg-slate-50 transition"
                aria-label="Open admin menu"
              >
                <Menu className="h-5 w-5 text-slate-800" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-orange-600">
                Bhakta Sammilan ॐ
              </span>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-orange-700">
                Admin
              </span>
            </div>
          </div>

          {/* (Right side of header empty for now, you can add user avatar later) */}
          <div />
          
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {/* BACKDROP – CLICK TO CLOSE WHEN SIDEBAR IS OPEN */}
      {open && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        />
      )}

      {/* SLIDE-IN SIDEBAR FROM LEFT */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl border-r border-slate-200
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* SIDEBAR HEADER WITH CROSS BUTTON */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">
            Navigation
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
            }}
            className="rounded-full border border-slate-200 p-1 hover:bg-slate-50"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* NAV LINKS */}
        <nav className="p-3 space-y-1">
          {navLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-orange-50 border border-orange-200 text-orange-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
          Bhakta Sammilan · Admin Panel
        </div>
      </aside>
    </div>
  );
}
