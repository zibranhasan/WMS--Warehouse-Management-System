"use client";

import { usePurchaseOrder } from "../purchase-order.hooks";
import { PurchaseOrder } from "../purchase-order.types";
import { Modal } from "@/components/shared/modal";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { Loader2, Receipt, User, Calendar, Building2 } from "lucide-react";

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
      <div className="space-y-4">
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
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {po.poNumber}
                </h3>
                <div className="flex items-center gap-2">
                  <PurchaseOrderStatusBadge status={po.status} />
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<Building2 className="h-4 w-4" />}
                label="Supplier"
                value={po.supplier?.name || "—"}
                sub={po.supplier?.code}
              />
              <InfoCard
                icon={<Building2 className="h-4 w-4" />}
                label="Warehouse"
                value={po.warehouse?.name || "—"}
              />
              <InfoCard
                icon={<User className="h-4 w-4" />}
                label="Created By"
                value={po.createdBy?.name || "—"}
                sub={po.createdBy?.email}
              />
              <InfoCard
                icon={<Calendar className="h-4 w-4" />}
                label="Created Date"
                value={formatDate(po.createdAt)}
              />
              {po.approvedBy && (
                <InfoCard
                  icon={<User className="h-4 w-4" />}
                  label="Approved By"
                  value={po.approvedBy.name || "—"}
                />
              )}
              {po.approvedAt && (
                <InfoCard
                  icon={<Calendar className="h-4 w-4" />}
                  label="Approved At"
                  value={formatDate(po.approvedAt)}
                />
              )}
            </div>

            {/* Rejection Reason */}
            {po.rejectionReason && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/40">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                  Rejection Reason
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {po.rejectionReason}
                </p>
              </div>
            )}

            {/* Cancellation Reason */}
            {po.cancellationReason && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/40">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Cancellation Reason
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {po.cancellationReason}
                </p>
              </div>
            )}

            {/* Notes */}
            {po.notes && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Notes
                </p>
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                  {po.notes}
                </p>
              </div>
            )}

            {/* Items Table */}
            {po.items && po.items.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Items ({po.items.length})
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <th className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400">
                          Product
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Ordered
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Received
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Remaining
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Unit Price
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">
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
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                            {item.product?.name || item.productId}
                            {item.product?.sku && (
                              <span className="ml-1 text-slate-400 dark:text-slate-500">
                                ({item.product.sku})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                            {item.orderedQuantity}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                            {item.receivedQuantity}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                            {item.orderedQuantity - item.receivedQuantity}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                            {formatCurrency(Number(item.unitPrice))}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
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
            <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-slate-800">
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

function InfoCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
      )}
    </div>
  );
}
