
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type AlertDialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(
  null
);

function useAlertDialogContext() {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error(
      "AlertDialog components must be used within <AlertDialog>."
    );
  }
  return ctx;
}

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  const setOpen = (value: boolean) => onOpenChange(value);

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

type AlertDialogContentProps = {
  children: React.ReactNode;
};

export function AlertDialogContent({ children }: AlertDialogContentProps) {
  const { open, setOpen } = useAlertDialogContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
  
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
    
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200 p-5">
        {children}
      </div>
    </div>,
    document.body
  );
}

type AlertDialogHeaderProps = {
  children: React.ReactNode;
};

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return <div className="mb-3">{children}</div>;
}

type AlertDialogTitleProps = {
  children: React.ReactNode;
};

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return (
    <h2 className="text-sm font-semibold text-slate-900 leading-tight">
      {children}
    </h2>
  );
}

type AlertDialogDescriptionProps = {
  children: React.ReactNode;
};

export function AlertDialogDescription({
  children,
}: AlertDialogDescriptionProps) {
  return (
    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{children}</p>
  );
}

type AlertDialogFooterProps = {
  children: React.ReactNode;
};

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return (
    <div className="mt-4 flex justify-end gap-2 items-center">{children}</div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function AlertDialogCancel({ children, ...props }: ButtonProps) {
  const { setOpen } = useAlertDialogContext();

  return (
    <button
      type="button"
      onClick={(e) => {
        props.onClick?.(e);
        setOpen(false);
      }}
      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ children, ...props }: ButtonProps) {
  const { setOpen } = useAlertDialogContext();

  return (
    <button
      type="button"
      onClick={(e) => {
        props.onClick?.(e);
       
        setOpen(false);
      }}
      className="inline-flex items-center justify-center rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}
