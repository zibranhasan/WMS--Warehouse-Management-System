"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface SupplierDeleteDialogProps {
  supplierId: string | null;
  supplierName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
  isPending: boolean;
}

export function SupplierDeleteDialog({
  supplierId,
  supplierName,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: SupplierDeleteDialogProps) {
  if (!open || !supplierId) return null;

  return (
    <ConfirmDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Delete Supplier"
      subtitle="Confirm soft deletion of this record"
      description={
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Are you sure you want to delete supplier{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              &quot;{supplierName || supplierId}&quot;
            </span>
            ?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This action will remove the supplier from active management views.
            The backend marks this supplier as soft-deleted.
          </p>
        </div>
      }
      confirmLabel="Delete Supplier"
      onConfirm={() => onConfirm(supplierId)}
      isPending={isPending}
      variant="destructive"
    />
  );
}
