"use client";

import { usePicking } from "../picking.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { PickingStatusBadge } from "./picking-status-badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  PackageCheck,
  User,
  Calendar,
  Building2,
  MapPin,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PickingDetailsDialogProps {
  pickingId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

const LOCATION_SEPARATOR = " > ";

function buildLocationPath(
  bin: { code?: string | null; name?: string | null } | null,
  shelf: { code?: string | null; name?: string | null } | null,
  aisle: { code?: string | null; name?: string | null } | null,
  zone: { code?: string | null; name?: string | null } | null
): string {
  const parts: string[] = [];
  if (zone) parts.push(zone.code || zone.name || "");
  if (aisle) parts.push(aisle.code || aisle.name || "");
  if (shelf) parts.push(shelf.code || shelf.name || "");
  if (bin) parts.push(bin.code || bin.name || "");
  return parts.filter(Boolean).join(LOCATION_SEPARATOR) || "\u2014";
}

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PICKING: "Picking",
  PICKED: "Picked",
  SKIPPED: "Skipped",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PickingDetailsDialog({
  pickingId,
  isOpen,
  onOpenChange,
}: PickingDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = usePicking(
    pickingId || ""
  );

  const task = data?.data;

  // Calculate progress from items
  const totalRequired =
    task?.items.reduce((sum, i) => sum + i.requiredQuantity, 0) ?? 0;
  const totalPicked =
    task?.items.reduce((sum, i) => sum + i.pickedQuantity, 0) ?? 0;
  const progressPercent =
    totalRequired > 0
      ? Math.round((totalPicked / totalRequired) * 100)
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Picking Task Details"
      description={task?.pickingNumber}
      maxWidthClass="max-w-3xl"
      className="max-h-[90vh] flex flex-col"
      contentClassName="min-h-0 flex-1 overflow-y-auto space-y-3"
    >
      <div>
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium">
              Fetching picking task details...
            </p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <PageErrorAlert
            title="Failed to load picking task details"
            message={
              error instanceof Error
                ? error.message
                : "An unexpected error occurred."
            }
            onRetry={refetch}
          />
        )}

        {/* Not Found */}
        {!isLoading && !isError && !task && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <PackageCheck className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">Picking task not found</p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              The requested picking task could not be loaded.
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && task && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                <PackageCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {task.pickingNumber}
                </h3>
                <div className="flex items-center gap-1.5">
                  <PickingStatusBadge status={task.status} />
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoCard
                icon={<PackageCheck className="h-3.5 w-3.5" />}
                label="Sales Order"
                value={task.salesOrder?.orderNumber || "\u2014"}
              />
              <InfoCard
                icon={<Building2 className="h-3.5 w-3.5" />}
                label="Warehouse"
                value={task.warehouse?.name || "\u2014"}
                sub={task.warehouse?.code}
              />
              <InfoCard
                icon={<User className="h-3.5 w-3.5" />}
                label="Assigned Picker"
                value={task.assignedTo?.name || "\u2014"}
                sub={task.assignedTo?.email}
              />
              <InfoCard
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Created At"
                value={formatDate(task.createdAt)}
              />
              <InfoCard
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Updated At"
                value={formatDate(task.updatedAt)}
              />
            </div>

            {/* Progress */}
            {task.items.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Picking Progress
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-400">
                    {totalPicked} / {totalRequired}
                  </span>
                </div>
              </div>
            )}

            {/* Items Table */}
            {task.items.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Items ({task.items.length})
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Product
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Required
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Picked
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Remaining
                        </th>
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {task.items.map((item) => (
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
                            {item.requiredQuantity}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {item.pickedQuantity}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-slate-700 dark:text-slate-300">
                            {item.remainingQuantity}
                          </td>
                          <td className="px-2.5 py-1.5">
                            <span className="inline-flex items-center whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400">
                              {ITEM_STATUS_LABELS[item.status] || item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Items Empty */}
            {task.items.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No items in this picking task.
                </p>
              </div>
            )}

            {/* Allocations */}
            {task.items.some((item) => item.allocations.length > 0) && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Allocations
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Product
                        </th>
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Location
                        </th>
                        <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          Qty
                        </th>
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Picked By
                        </th>
                        <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                          Picked At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {task.items.flatMap((item) =>
                        item.allocations.map((alloc) => (
                          <tr
                            key={alloc.id}
                            className="bg-white dark:bg-slate-950"
                          >
                            <td className="px-2.5 py-1.5 font-medium text-slate-900 dark:text-white">
                              {item.product?.name || item.productId}
                              {item.product?.sku && (
                                <span className="ml-1 text-slate-400 dark:text-slate-500">
                                  ({item.product.sku})
                                </span>
                              )}
                            </td>
                            <td className="px-2.5 py-1.5">
                              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                <MapPin className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
                                <span>
                                  {buildLocationPath(
                                    alloc.bin,
                                    alloc.shelf,
                                    alloc.aisle,
                                    alloc.zone
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-2.5 py-1.5 text-right text-slate-700 dark:text-slate-300">
                              {alloc.quantity}
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
                              {alloc.pickedBy?.name || "\u2014"}
                            </td>
                            <td className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
                              {alloc.pickedAt
                                ? formatDate(alloc.pickedAt)
                                : "\u2014"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Allocations Empty */}
            {task.items.length > 0 &&
              !task.items.some((item) => item.allocations.length > 0) && (
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No allocations yet.
                  </p>
                </div>
              )}

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 pt-2 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// InfoCard sub-component
// ---------------------------------------------------------------------------
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
        <p className="text-[11px] text-slate-500 dark:text-slate-400 break-words">
          {sub}
        </p>
      )}
    </div>
  );
}
