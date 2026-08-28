"use client";

import * as React from "react";
import { Modal } from "./modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/api-error";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  isPending?: boolean;
  variant?: "destructive" | "primary";
  icon?: React.ComponentType<{ className?: string }>;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title = "Confirm Action",
  subtitle,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isPending = false,
  variant = "destructive",
  icon: Icon = AlertTriangle,
}: ConfirmDialogProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await onConfirm();
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred during confirmation.");
      }
    }
  };

  const isDestructive = variant === "destructive";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidthClass="max-w-md">
      <div className="space-y-4">
        {/* Header Icon + Title */}
        <div
          className={`flex items-center gap-3 ${
            isDestructive
              ? "text-red-600 dark:text-red-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isDestructive
                ? "bg-red-100 dark:bg-red-950/60"
                : "bg-blue-100 dark:bg-blue-950/60"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Error message banner if action failed */}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Description body */}
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {description}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
            className={
              !isDestructive
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : undefined
            }
          >
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
