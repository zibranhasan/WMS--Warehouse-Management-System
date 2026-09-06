"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidthClass?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  contentClassName,
  maxWidthClass = "max-w-lg",
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop click handler */}
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Centered Panel */}
      <div
        className={cn(
          "relative z-10 w-full rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 space-y-4 animate-in zoom-in-95 duration-200",
          maxWidthClass,
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}
