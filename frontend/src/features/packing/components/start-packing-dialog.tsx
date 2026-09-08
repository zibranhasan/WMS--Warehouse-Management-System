"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useStartPacking } from "../packing.hooks";
import type { PackingTask } from "../packing.types";
import { Play } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface StartPackingDialogProps {
  packingTask: PackingTask | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function StartPackingDialog({
  packingTask,
  isOpen,
  onOpenChange,
}: StartPackingDialogProps) {
  const startMutation = useStartPacking();

  const handleConfirm = async () => {
    if (!packingTask?.id) return;
    await startMutation.mutateAsync(packingTask.id);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Start Packing"
      subtitle={packingTask?.packingNumber}
      description={
        <div className="space-y-2">
          <p>Are you sure you want to start this packing task?</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
            <dl className="space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Packing Number</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {packingTask?.packingNumber ?? "\u2014"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Sales Order</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {packingTask?.salesOrder?.orderNumber ?? "\u2014"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Warehouse</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {packingTask?.warehouse?.name ?? "\u2014"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Assigned Packer</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {packingTask?.packedBy?.name ?? "Unassigned"}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This will change the status to In Progress.
          </p>
        </div>
      }
      confirmLabel="Start Packing"
      cancelLabel="Cancel"
      variant="primary"
      icon={Play}
      isPending={startMutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
