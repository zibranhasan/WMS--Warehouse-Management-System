"use client";

import { useState } from "react";
import { Category } from "../category.types";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertTriangle, Loader2 } from "lucide-react";

interface CategoryDeleteDialogProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isPending: boolean;
}

export function CategoryDeleteDialog({
  category,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: CategoryDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const handleDelete = async () => {
    setErrorMessage(null);
    try {
      await onConfirm(category.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to delete category.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 space-y-4">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirm soft deletion of this record
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Are you sure you want to delete category{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              &quot;{category.name}&quot;
            </span>
            ?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This action will remove the category from active management views.
            The backend marks this category as soft-deleted.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Delete Category
          </Button>
        </div>
      </div>
    </div>
  );
}
