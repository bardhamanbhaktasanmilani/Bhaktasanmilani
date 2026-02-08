"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ================= HELPERS ================= */
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  className,
}: ModalProps) {
  const ios = isIOS();
  const scrollYRef = useRef(0);

  /* =========================================================
     ESC KEY + **iOS-SAFE SCROLL LOCK**
     ========================================================= */
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);

    /* -------- iOS scroll lock (CRITICAL) -------- */
    if (ios) {
      scrollYRef.current = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKey);

      if (ios) {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";

        window.scrollTo(0, scrollYRef.current);
      } else {
        document.body.style.overflow = "";
      }
    };
  }, [open, onClose, ios]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-hidden={!open}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "bg-black/60 backdrop-blur-sm"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* ================= MODAL CARD ================= */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "w-full max-w-lg rounded-2xl bg-white shadow-2xl",
              "max-h-[90dvh] overflow-y-auto overscroll-contain",
              "focus:outline-none",
              className
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
