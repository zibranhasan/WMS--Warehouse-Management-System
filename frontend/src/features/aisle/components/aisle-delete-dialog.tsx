"use client";

import { Aisle } from "../aisle.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface AisleDeleteDialogProps {
  aisle: Aisle | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function AisleDeleteDialog({
  aisle,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: AisleDeleteDialogProps) {
  if (!aisle) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Storage Aisle"
      subtitle={`Aisle: ${aisle.name} (${aisle.code})`}
      description={
        <div className="space-y-2">
          <p>
            Are you sure you want to soft-delete aisle{" "}
            <strong className="text-slate-900 dark:text-white">
              &quot;{aisle.name}&quot;
            </strong>{" "}
            (<code className="font-mono text-xs">{aisle.code}</code>)?
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Note: Aisles containing active shelves cannot be deleted until all child shelves are removed or relocated.
          </p>
        </div>
      }
      confirmLabel="Delete Aisle"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      isPending={isPending}
      variant="destructive"
    />
  );
}
