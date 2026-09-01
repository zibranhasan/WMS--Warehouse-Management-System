"use client";

import { Shelf } from "../shelf.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ShelfDeleteDialogProps {
  shelf: Shelf | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function ShelfDeleteDialog({
  shelf,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ShelfDeleteDialogProps) {
  if (!shelf) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Storage Shelf">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 dark:border-red-900/50 dark:bg-red-950/40">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-red-900 dark:text-red-200">
            <p className="font-semibold">
              Are you sure you want to delete shelf &quot;{shelf.name}&quot; ({shelf.code})?
            </p>
            <p className="text-[11px] text-red-700 dark:text-red-300">
              This action soft-deletes the shelf record. If active storage bins exist under this shelf, deletion will be blocked by the server.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
