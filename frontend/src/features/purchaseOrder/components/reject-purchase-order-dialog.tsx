"use client";

import { useState } from "react";
import { useRejectPurchaseOrder } from "../purchase-order.hooks";
import { PurchaseOrder } from "../purchase-order.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2, XCircle } from "lucide-react";

interface RejectPurchaseOrderDialogProps {
  purchaseOrder: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (po: PurchaseOrder) => void;
}

export function RejectPurchaseOrderDialog({
  purchaseOrder,
  isOpen,
  onClose,
  onSuccess,
}: RejectPurchaseOrderDialogProps) {
  const rejectMutation = useRejectPurchaseOrder();
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setReason("");
    setErrorMessage(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!purchaseOrder) return;
    setErrorMessage(null);
    try {
      const result = await rejectMutation.mutateAsync({
        id: purchaseOrder.id,
        payload: {
          rejectionReason: reason.trim() || undefined,
        },
      });
      onSuccess?.(result.data);
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred while rejecting the order.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reject Purchase Order"
      description={purchaseOrder?.poNumber}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reject Purchase Order
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {purchaseOrder?.poNumber}
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

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to reject this purchase order? This action cannot
          be undone.
        </p>

        {/* Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Rejection Reason{" "}
            <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Provide a reason for rejecting this order..."
            disabled={rejectMutation.isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={rejectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Reject Order
          </Button>
        </div>
      </div>
    </Modal>
  );
}
