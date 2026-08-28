"use client";

import { Product } from "../product.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface ProductDeleteDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isPending: boolean;
}

export function ProductDeleteDialog({
  product,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ProductDeleteDialogProps) {
  if (!isOpen || !product) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      subtitle="Confirm soft deletion of this record"
      description={
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Are you sure you want to delete product{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              &quot;{product.name}&quot; ({product.sku})
            </span>
            ?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This action will remove the product from active management views.
            The backend marks this product as soft-deleted.
          </p>
        </div>
      }
      confirmLabel="Delete Product"
      onConfirm={() => onConfirm(product.id)}
      isPending={isPending}
      variant="destructive"
    />
  );
}
