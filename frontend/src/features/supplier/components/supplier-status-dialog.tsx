"use client";

import { useUpdateSupplierStatus } from "../supplier.hooks";
import { SupplierStatus } from "../supplier.types";
import { Modal } from "@/components/shared/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ToggleLeft } from "lucide-react";

interface SupplierStatusDialogProps {
  supplierId: string | null;
  supplierName?: string;
  currentStatus: SupplierStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierStatusDialog({
  supplierId,
  supplierName,
  currentStatus,
  open,
  onOpenChange,
}: SupplierStatusDialogProps) {
  const updateStatusMutation = useUpdateSupplierStatus();

  const targetStatus: SupplierStatus | null =
    currentStatus === "ACTIVE" ? "INACTIVE" : currentStatus === "INACTIVE" ? "ACTIVE" : null;

  const isActivating = targetStatus === "ACTIVE";
  const title = isActivating ? "Activate Supplier" : "Deactivate Supplier";
  const description = isActivating
    ? "This will set the supplier as active and available for use."
    : "This will deactivate the supplier and prevent it from being used in new transactions.";

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!supplierId || !targetStatus) return;

    await updateStatusMutation.mutateAsync({
      id: supplierId,
      status: targetStatus,
    });
    handleClose();
  };

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={handleClose} maxWidthClass="max-w-md">
      <div className="space-y-4">
        {/* Header */}
        <div
          className={`flex items-center gap-3 ${
            isActivating
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isActivating
                ? "bg-emerald-100 dark:bg-emerald-950/60"
                : "bg-amber-100 dark:bg-amber-950/60"
            }`}
          >
            <ToggleLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            {supplierName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {supplierName}
              </p>
            )}
          </div>
        </div>

        {/* Status Transition */}
        {currentStatus && targetStatus && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Current
              </p>
              <StatusBadge
                label={currentStatus === "ACTIVE" ? "Active" : "Inactive"}
                variant={currentStatus === "ACTIVE" ? "success" : "neutral"}
              />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <div className="text-center">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Will become
              </p>
              <StatusBadge
                label={targetStatus === "ACTIVE" ? "Active" : "Inactive"}
                variant={targetStatus === "ACTIVE" ? "success" : "neutral"}
              />
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateStatusMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isActivating ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={updateStatusMutation.isPending || !supplierId || !targetStatus}
            className={
              isActivating
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : undefined
            }
          >
            {updateStatusMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {isActivating ? "Activate" : "Deactivate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
