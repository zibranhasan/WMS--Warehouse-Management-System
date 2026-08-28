"use client";

import { Brand } from "../brand.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface BrandDeleteDialogProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isPending: boolean;
}

export function BrandDeleteDialog({
  brand,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: BrandDeleteDialogProps) {
  if (!isOpen || !brand) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Brand"
      subtitle="Confirm soft deletion of this record"
      description={
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Are you sure you want to delete brand{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              &quot;{brand.name}&quot;
            </span>
            ?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This action will remove the brand from active management views.
            The backend marks this brand as soft-deleted.
          </p>
        </div>
      }
      confirmLabel="Delete Brand"
      onConfirm={() => onConfirm(brand.id)}
      isPending={isPending}
      variant="destructive"
    />
  );
}
