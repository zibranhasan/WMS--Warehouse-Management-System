"use client";

import { useState } from "react";
import { useCancelPackingTask } from "../packing.hooks";
import { PackingTask } from "../packing.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2, Ban } from "lucide-react";

interface CancelPackingDialogProps {
  packingTask: PackingTask | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelPackingDialog({
  packingTask,
  isOpen,
  onOpenChange,
}: CancelPackingDialogProps) {
  const cancelMutation = useCancelPackingTask();
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const handleClose = () => {
    setReason("");
    setErrorMessage(null);
    setReasonError(null);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!packingTask) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setReasonError("Cancellation reason cannot be empty.");
      return;
    }

    setErrorMessage(null);
    setReasonError(null);

    try {
      await cancelMutation.mutateAsync({
        id: packingTask.id,
        payload: {
          cancellationReason: trimmedReason,
        },
      });
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred while cancelling the packing task.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancel Packing"
      description={packingTask?.packingNumber}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
            <Ban className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cancel Packing
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {packingTask?.packingNumber}
            </p>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Task Info */}
        {packingTask && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Packing Number
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {packingTask.packingNumber}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Sales Order
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {packingTask.salesOrder?.orderNumber ?? "\u2014"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Warehouse
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {packingTask.warehouse?.name ?? "\u2014"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Assigned Packer
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {packingTask.packedBy?.name ?? "Unassigned"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This action will cancel the packing task.
        </p>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Cancellation Reason{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError(null);
            }}
            rows={3}
            placeholder="Provide a reason for cancelling this packing task..."
            disabled={cancelMutation.isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {reasonError && (
            <p className="text-xs text-red-500 dark:text-red-400">
              {reasonError}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={cancelMutation.isPending}
          >
            Keep Task
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancelMutation.isPending || !packingTask}
          >
            {cancelMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Cancel Packing
          </Button>
        </div>
      </div>
    </Modal>
  );
}
