"use client";

import { usePurchaseOrderReceipts } from "../purchase-order.hooks";
import { PurchaseOrder, GoodsReceipt } from "../purchase-order.types";
import { Modal } from "@/components/shared/modal";
import { Loader2, Package } from "lucide-react";

interface PurchaseOrderReceiptsDialogProps {
  purchaseOrder: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseOrderReceiptsDialog({
  purchaseOrder,
  isOpen,
  onClose,
}: PurchaseOrderReceiptsDialogProps) {
  const { data, isLoading, isError, error } = usePurchaseOrderReceipts(
    purchaseOrder?.id || ""
  );

  const receipts: GoodsReceipt[] = data?.data || [];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!purchaseOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt History"
      description={purchaseOrder.poNumber}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Goods Receipt History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {purchaseOrder.poNumber} — {receipts.length} receipt
              {receipts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error instanceof Error
              ? error.message
              : "Failed to load receipt history."}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && receipts.length === 0 && (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              No receipts found for this purchase order.
            </p>
          </div>
        )}

        {/* Receipt List */}
        {!isLoading && !isError && receipts.length > 0 && (
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                {/* Receipt Header */}
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                      {receipt.receiptNumber}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(receipt.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Received by{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {receipt.receivedBy?.name || "—"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Reason / Reference */}
                {(receipt.reason || receipt.reference) && (
                  <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {receipt.reason && (
                      <span>
                        Reason:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {receipt.reason}
                        </span>
                      </span>
                    )}
                    {receipt.reference && (
                      <span>
                        Reference:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {receipt.reference}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Items */}
                {receipt.items && receipt.items.length > 0 && (
                  <div className="overflow-x-auto rounded-md border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                          <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">
                            Product
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {receipt.items.map((item) => (
                          <tr
                            key={item.id}
                            className="bg-white dark:bg-slate-950"
                          >
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                              {item.product?.name || item.productId}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                              {Number(item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
