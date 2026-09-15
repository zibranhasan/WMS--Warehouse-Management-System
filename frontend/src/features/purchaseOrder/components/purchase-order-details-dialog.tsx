"use client";

import { usePurchaseOrder } from "../purchase-order.hooks";
import { PurchaseOrder } from "../purchase-order.types";
import { Modal } from "@/components/shared/modal";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { Loader2, Receipt } from "lucide-react";

interface PurchaseOrderDetailsDialogProps {
  purchaseOrder: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseOrderDetailsDialog({
  purchaseOrder,
  isOpen,
  onClose,
}: PurchaseOrderDetailsDialogProps) {
  const { data, isLoading, isError, error } = usePurchaseOrder(
    purchaseOrder?.id || ""
  );

  const po = data?.data;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

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

  if (!purchaseOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Purchase Order Details"
      description={purchaseOrder.poNumber}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-3 p-2">
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
              : "Failed to load purchase order details."}
          </div>
        )}

        {/* Details */}
        {!isLoading && !isError && po && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {po.poNumber}
                </h3>
                <PurchaseOrderStatusBadge status={po.status} />
              </div>
            </div>

            {/* Compact Metadata */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <MetaRow label="Supplier" value={po.supplier?.name || "—"} />
              <MetaRow label="Warehouse" value={po.warehouse?.name || "—"} />
              <MetaRow label="Created By" value={po.createdBy?.name || "—"} />
              <MetaRow label="Created Date" value={formatDate(po.createdAt)} />
              {po.approvedBy && (
                <MetaRow label="Approved By" value={po.approvedBy.name || "—"} />
              )}
              {po.approvedAt && (
                <MetaRow label="Approved At" value={formatDate(po.approvedAt)} />
              )}
            </div>

            {/* Rejection Reason */}
            {po.rejectionReason && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/40">
                <p className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                  Rejection Reason
                </p>
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                  {po.rejectionReason}
                </p>
              </div>
            )}

            {/* Cancellation Reason */}
            {po.cancellationReason && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/40">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Cancellation Reason
                </p>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                  {po.cancellationReason}
                </p>
              </div>
            )}

            {/* Notes */}
            {po.notes && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Notes
                </p>
                <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                  {po.notes}
                </p>
              </div>
            )}

            {/* Items Table */}
            {po.items && po.items.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Items ({po.items.length})
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <th className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Product
                        </th>
                        <th className="px-3 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Ordered
                        </th>
                        <th className="px-3 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Received
                        </th>
                        <th className="px-3 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Remaining
                        </th>
                        <th className="px-3 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Unit Price
                        </th>
                        <th className="px-3 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {po.items.map((item) => (
                        <tr
                          key={item.id}
                          className="bg-white dark:bg-slate-950"
                        >
                          <td className="px-3 py-1.5 font-medium text-slate-900 dark:text-white">
                            {item.product?.name || item.productId}
                            {item.product?.sku && (
                              <span className="ml-1 text-slate-400 dark:text-slate-500">
                                ({item.product.sku})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {item.orderedQuantity}
                          </td>
                          <td className="px-3 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {item.receivedQuantity}
                          </td>
                          <td className="px-3 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {item.orderedQuantity - item.receivedQuantity}
                          </td>
                          <td className="px-3 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {formatCurrency(Number(item.unitPrice))}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(Number(item.totalPrice))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-end border-t border-slate-200 pt-2 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Total: {formatCurrency(Number(po.totalAmount))}
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
