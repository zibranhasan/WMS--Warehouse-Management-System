"use client";

import { useState } from "react";
import { usePackingTask, usePackingPackages } from "../packing.hooks";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { PackingStatusBadge } from "./packing-status-badge";
import { AddPackageItemsDialog } from "./add-package-items-dialog";
import { ClosePackageDialog } from "./close-package-dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  PackageCheck,
  User,
  Calendar,
  Building2,
  Box,
  Plus,
  CheckCircle2,
} from "lucide-react";
import type { Package, PackageStatus } from "../packing.types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PackingDetailsDialogProps {
  packingTaskId: string | null;
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

const PACKAGE_STATUS_CONFIG: Record<
  PackageStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "info" | "neutral" }
> = {
  OPEN: { label: "Open", variant: "warning" },
  PACKED: { label: "Packed", variant: "success" },
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PARTIALLY_PACKED: "Partially Packed",
  PACKED: "Packed",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PackingDetailsDialog({
  packingTaskId,
  isOpen,
  onOpenChange,
}: PackingDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = usePackingTask(
    packingTaskId || ""
  );

  const task = data?.data;

  const {
    data: packagesData,
    isLoading: packagesLoading,
    isError: packagesError,
    error: packagesErrorObj,
    refetch: refetchPackages,
  } = usePackingPackages(packingTaskId || "");

  const packages = packagesData?.data ?? [];

  // Current user for role/ownership checks
  const { data: meData } = useCurrentUser();
  const currentUser = meData?.data?.user;
  const userRole = currentUser?.role;
  const currentUserId = currentUser?.id;

  // Add Items visibility: role check
  const canAddItems =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "WAREHOUSE_MANAGER" ||
    userRole === "STAFF";

  // Add Items visibility: task-level status check
  const taskStatusAllowed =
    task?.status === "PENDING" ||
    task?.status === "IN_PROGRESS" ||
    task?.status === "PARTIALLY_PACKED";

  // Add Items visibility: STAFF ownership check
  const isStaff = userRole === "STAFF";
  const isAssignedToMe =
    isStaff && task?.packedById === currentUserId;

  // Final: can show Add Items on a given package
  const showAddItems = canAddItems && taskStatusAllowed && (!isStaff || isAssignedToMe);

  // Add Package Items dialog state
  const [addItemsPackage, setAddItemsPackage] = useState<Package | null>(null);
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);

  // Close Package dialog state
  const [closePackagePackage, setClosePackagePackage] =
    useState<Package | null>(null);
  const [isClosePackageOpen, setIsClosePackageOpen] = useState(false);

  // Calculate progress from items
  const totalRequired =
    task?.items.reduce((sum, i) => sum + i.requiredQuantity, 0) ?? 0;
  const totalPacked =
    task?.items.reduce((sum, i) => sum + i.packedQuantity, 0) ?? 0;
  const progressPercent =
    totalRequired > 0
      ? Math.round((totalPacked / totalRequired) * 100)
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Packing Task Details"
      description={task?.packingNumber}
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
              Fetching packing task details...
            </p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <PageErrorAlert
            title="Failed to load packing task details"
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
            <p className="text-xs font-medium">Packing task not found</p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              The requested packing task could not be loaded.
            </p>
          </div>
        )}

        {/* Add Package Items Dialog */}
        <AddPackageItemsDialog
          packingTask={task ?? null}
          selectedPackage={addItemsPackage}
          isOpen={isAddItemsOpen}
          onOpenChange={(open) => {
            setIsAddItemsOpen(open);
            if (!open) setAddItemsPackage(null);
          }}
        />

        {/* Close Package Dialog */}
        <ClosePackageDialog
          packingTaskId={packingTaskId || ""}
          selectedPackage={closePackagePackage}
          isOpen={isClosePackageOpen}
          onOpenChange={(open) => {
            setIsClosePackageOpen(open);
            if (!open) setClosePackagePackage(null);
          }}
        />

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
                  {task.packingNumber}
                </h3>
                <div className="flex items-center gap-1.5">
                  <PackingStatusBadge status={task.status} />
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
                label="Assigned Packer"
                value={task.packedBy?.name || "Unassigned"}
                sub={task.packedBy?.email}
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
                  Packing Progress
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-400">
                    {totalPacked} / {totalRequired}
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
                          Packed
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
                            {item.packedQuantity}
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
                  No items in this packing task.
                </p>
              </div>
            )}

            {/* Packages */}
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Packages{" "}
                {!packagesLoading && !packagesError && (
                  <span className="font-normal text-slate-400 dark:text-slate-500">
                    ({packages.length})
                  </span>
                )}
              </p>

              {/* Packages Loading */}
              {packagesLoading && (
                <div className="flex items-center justify-center py-4 text-slate-500 dark:text-slate-400">
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  <p className="text-[11px] font-medium">Loading packages...</p>
                </div>
              )}

              {/* Packages Error */}
              {packagesError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Failed to load packages</p>
                      <p className="text-red-600/80 dark:text-red-400/80">
                        {packagesErrorObj instanceof Error
                          ? packagesErrorObj.message
                          : "An unexpected error occurred."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => refetchPackages()}
                      className="border-red-200 text-red-700 hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {/* Packages List */}
              {!packagesLoading && !packagesError && packages.length > 0 && (
                <div className="space-y-2">
                  {packages.map((pkg) => {
                    const statusConfig = PACKAGE_STATUS_CONFIG[pkg.status] ?? {
                      label: pkg.status,
                      variant: "neutral" as const,
                    };
                    return (
                      <div
                        key={pkg.id}
                        className="rounded-md border border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-950"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Box className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="text-[11px] font-semibold text-slate-900 dark:text-white">
                              {pkg.packageNumber}
                            </span>
                            <StatusBadge
                              label={statusConfig.label}
                              variant={statusConfig.variant}
                            />
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              Items: {pkg.items.length}
                            </span>
                            <span>
                              Weight:{" "}
                              {pkg.weight != null ? pkg.weight : "Not specified"}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {pkg.notes && (
                          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {pkg.notes}
                          </p>
                        )}

                        {/* Package Items */}
                        {pkg.items.length > 0 && (
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-left text-[10px]">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                  <th className="pb-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                    Product
                                  </th>
                                  <th className="pb-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                    SKU
                                  </th>
                                  <th className="pb-0.5 text-right font-semibold text-slate-500 dark:text-slate-400">
                                    Quantity
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {pkg.items.map((pkgItem) => (
                                  <tr key={pkgItem.id}>
                                    <td className="py-0.5 text-slate-700 dark:text-slate-300">
                                      {pkgItem.product?.name ||
                                        pkgItem.productId}
                                    </td>
                                    <td className="py-0.5 text-slate-500 dark:text-slate-400">
                                      {pkgItem.product?.sku || "\u2014"}
                                    </td>
                                    <td className="py-0.5 text-right text-slate-700 dark:text-slate-300">
                                      {pkgItem.quantity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {pkg.items.length === 0 && (
                          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                            No items in this package.
                          </p>
                        )}

                        {/* Add Items button for OPEN packages (role + ownership gated) */}
                        {showAddItems && pkg.status === "OPEN" && (
                          <div className="mt-2.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAddItemsPackage(pkg);
                                  setIsAddItemsOpen(true);
                                }}
                                className="h-7 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Items
                              </Button>
                              {pkg.items.length > 0 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setClosePackagePackage(pkg);
                                    setIsClosePackageOpen(true);
                                  }}
                                  className="h-7 text-[11px] text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Close Package
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Packages Empty */}
              {!packagesLoading && !packagesError && packages.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No packages created yet.
                  </p>
                </div>
              )}
            </div>

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
