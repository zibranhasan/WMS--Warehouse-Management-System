"use client";

import { useState } from "react";
import { useCreatePackage } from "../packing.hooks";
import { PackingTask } from "../packing.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2, PackagePlus } from "lucide-react";

interface CreatePackageDialogProps {
  packingTask: PackingTask | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePackageDialog({
  packingTask,
  isOpen,
  onOpenChange,
}: CreatePackageDialogProps) {
  const createMutation = useCreatePackage();
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setWeight("");
    setNotes("");
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!packingTask) return;

    setErrorMessage(null);

    const payload: { weight?: number; notes?: string } = {};
    if (weight.trim()) {
      const parsed = parseFloat(weight.trim());
      if (isNaN(parsed) || parsed < 0) {
        setErrorMessage("Weight must be a valid non-negative number.");
        return;
      }
      payload.weight = parsed;
    }
    if (notes.trim()) {
      payload.notes = notes.trim();
    }

    try {
      await createMutation.mutateAsync({
        id: packingTask.id,
        payload,
      });
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred while creating the package.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Package"
      description={packingTask?.packingNumber}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create Package
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
          Create a new package for this packing task. You can add items to it
          after creation.
        </p>

        {/* Weight */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Weight (optional)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 12.5"
            min="0"
            step="0.01"
            disabled={createMutation.isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes for this package..."
            disabled={createMutation.isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={createMutation.isPending || !packingTask}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Create Package
          </Button>
        </div>
      </div>
    </Modal>
  );
}
