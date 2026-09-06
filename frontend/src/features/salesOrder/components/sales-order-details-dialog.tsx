"use client";

import { useSalesOrder } from "../sales-order.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { SalesOrderStatusBadge } from "./sales-order-status-badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, User, Calendar, Building2 } from "lucide-react";

interface SalesOrderDetailsDialogProps {
  salesOrderId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesOrderDetailsDialog({
  salesOrderId,
  isOpen,
  onOpenChange,
}: SalesOrderDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = useSalesOrder(
    salesOrderId || ""
  );

  const so = data?.data;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Sales Order Details"
      description={so?.orderNumber}
      maxWidthClass="max-w-3xl"
      className="max-h-[90vh] flex flex-col"
      contentClassName="min-h-0 flex-1 overflow-y-auto space-y-3"
    >
      <div>
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium">Fetching sales order details...</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <PageErrorAlert
            title="Failed to load sales order details"
            message={
              error instanceof Error
                ? error.message
                : "An unexpected error occurred."
            }
            onRetry={refetch}
          />
        )}

        {/* Not Found */}
        {!isLoading && !isError && !so && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Package className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">Sales order not found</p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              The requested sales order could not be loaded.
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && so && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {so.orderNumber}
                </h3>
                <div className="flex items-center gap-1.5">
                  <SalesOrderStatusBadge status={so.status} />
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoCard
                icon={<Building2 className="h-3.5 w-3.5" />}
                label="Warehouse"
                value={so.warehouse?.name || "—"}
                sub={so.warehouse?.code}
              />
              <InfoCard
                icon={<User className="h-3.5 w-3.5" />}
                label="Created By"
                value={so.createdBy?.name || "—"}
                sub={so.createdBy?.email}
              />
              <InfoCard
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Created At"
                value={formatDate(so.createdAt)}
              />
              <InfoCard
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Updated At"
                value={formatDate(so.updatedAt)}
              />
            </div>

            {/* Cancellation Reason */}
            {so.cancellationReason && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 dark:border-amber-900/50 dark:bg-amber-950/40">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Cancellation Reason
                </p>
                <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                  {so.cancellationReason}
                </p>
              </div>
            )}

            {/* Notes */}
            {so.notes && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Notes
                </p>
                <p className="mt-0.5 text-[11px] text-slate-700 dark:text-slate-300 break-words">
                  {so.notes}
                </p>
              </div>
            )}

            {/* Items Table */}
            {so.items && so.items.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Items ({so.items.length})
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Product
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Qty
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Reserved
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Unit Price
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {so.items.map((item) => (
                        <tr
                          key={item.id}
                          className="bg-white dark:bg-slate-950"
                        >
                          <td className="px-2.5 py-1.5 font-medium text-slate-900 dark:text-white break-words max-w-[180px]">
                            {item.product?.name || item.productId}
                            {item.product?.sku && (
                              <span className="ml-1 text-slate-400 dark:text-slate-500">
                                ({item.product.sku})
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {Number(item.quantity)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {Number(item.reservedQuantity)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {formatCurrency(Number(item.unitPrice))}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(Number(item.totalPrice))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reservations */}
            {so.reservations && so.reservations.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Stock Reservations ({so.reservations.length})
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Product
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Quantity
                        </th>
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {so.reservations.map((res) => {
                        const product = so.items?.find(
                          (item) => item.productId === res.productId
                        )?.product;

                        return (
                          <tr
                            key={res.id}
                            className="bg-white dark:bg-slate-950"
                          >
                            <td className="px-2.5 py-1.5 font-medium text-slate-900 dark:text-white">
                              {product?.name || res.productId}
                              {product?.sku && (
                                <span className="ml-1 text-slate-400 dark:text-slate-500">
                                  ({product.sku})
                                </span>
                              )}
                            </td>
                            <td className="px-2.5 py-1.5 text-right text-slate-700 dark:text-slate-300">
                              {Number(res.quantity)}
                            </td>
                            <td className="px-2.5 py-1.5">
                              <span className="inline-flex items-center whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400">
                                {res.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reservations Empty */}
            {so.reservations && so.reservations.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No stock reservations found.
                </p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-end border-t border-slate-200 pt-2 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Total: {formatCurrency(Number(so.totalAmount))}
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 pt-2 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
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
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-white break-words">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 break-words">{sub}</p>
      )}
    </div>
  );
}
