"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  intent?: "danger" | "primary";
  isLoading?: boolean;
};

export default function ConfirmModal({
  open,
  title = "Confirm",
  description = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  intent = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Save previously focused element to restore later
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Prevent body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the modal container for accessibility
    setTimeout(() => modalRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        // simple focus trap
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // restore focus
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const confirmButtonClasses =
    intent === "danger"
      ? "inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      : "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60";

  const cancelButtonClasses =
    "inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

  // spinner
  const Spinner = (
    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );

  const modalContent = (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          // clicking backdrop should close
          if (!isLoading) onClose();
        }}
      />

      {/* modal panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-lg focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id="confirm-modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h3>
            <p id="confirm-modal-desc" className="mt-2 text-sm text-slate-600">
              {description}
            </p>
          </div>

          <button
            onClick={() => {
              if (!isLoading) onClose();
            }}
            aria-label="Close"
            className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={cancelButtonClasses}
            onClick={() => !isLoading && onClose()}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={confirmButtonClasses}
            onClick={async () => {
              if (isLoading) return;
              try {
                const maybePromise = onConfirm();
                if (maybePromise && typeof (maybePromise as Promise<void>).then === "function") {
                  // if caller manages loading state externally, this is a no-op here
                  await maybePromise;
                }
              } catch (err) {
                // swallow - caller handles error state
              }
            }}
            disabled={isLoading}
          >
            {isLoading && Spinner}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
