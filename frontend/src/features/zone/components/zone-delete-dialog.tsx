"use client";

import { Zone } from "../zone.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface ZoneDeleteDialogProps {
  zone: Zone | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function ZoneDeleteDialog({
  zone,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ZoneDeleteDialogProps) {
  if (!zone) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Storage Zone"
      subtitle={`Zone: ${zone.name} (${zone.code})`}
      description={
        <div className="space-y-2">
          <p>
            Are you sure you want to soft-delete zone{" "}
            <strong className="text-slate-900 dark:text-white">
              &quot;{zone.name}&quot;
            </strong>{" "}
            (<code className="font-mono text-xs">{zone.code}</code>)?
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Note: Zones containing active aisles cannot be deleted until all child aisles are removed or relocated.
          </p>
        </div>
      }
      confirmLabel="Delete Zone"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      isPending={isPending}
      variant="destructive"
    />
  );
}
