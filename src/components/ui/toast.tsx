"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  message: string;
  variant?: "success" | "error";
  duration?: number;
};

export default function Toast({
  open,
  onOpenChange,
  message,
  variant = "success",
  duration = 4000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(open && Boolean(message));

  useEffect(() => {
    setIsVisible(open && Boolean(message));
  }, [open, message]);

  useEffect(() => {
    if (!isVisible) return;

    const timeout = setTimeout(() => {
      setIsVisible(false);
      onOpenChange?.(false);
    }, duration);

    return () => {
      clearTimeout(timeout);
    };
  }, [isVisible, duration, onOpenChange]);

  if (!isVisible || !message) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm translate-y-0 flex-col gap-2 text-white transition-all duration-300">
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-white/10 bg-black/80 p-4 shadow-lg backdrop-blur ${
          variant === "success"
            ? "border-emerald-400/40 text-emerald-100"
            : "border-red-400/40 text-red-100"
        }`}
      >
        <div className="flex-1 text-sm font-medium leading-tight">
          {message}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            onOpenChange?.(false);
          }}
          className="text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}

