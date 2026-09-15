"use client";

import { useState } from "react";
import { usePackingTask, usePackingPackages } from "../packing.hooks";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { AddPackageItemsDialog } from "./add-package-items-dialog";
import { ClosePackageDialog } from "./close-package-dialog";
import { CreatePackageDialog } from "./create-package-dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Box,
  Boxes,
  Plus,
  CheckCircle2,
  PackagePlus,
} from "lucide-react";
import type { Package, PackageStatus } from "../packing.types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PackingPackagesDialogProps {
  packingTaskId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PACKAGE_STATUS_CONFIG: Record<
  PackageStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "info" | "neutral" }
> = {
  OPEN: { label: "Open", variant: "warning" },
  PACKED: { label: "Packed", variant: "success" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PackingPackagesDialog({
  packingTaskId,
  isOpen,
  onOpenChange,
}: PackingPackagesDialogProps) {
  const {
    data: taskData,
    isLoading: isTaskLoading,
    isError: isTaskError,
    error: taskError,
    refetch: refetchTask,
  } = usePackingTask(packingTaskId || "");

  const task = taskData?.data;

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

  // Role check for staff vs managers/admins
  const isStaff = userRole === "STAFF";
  const isAssignedToMe = isStaff && task?.packedById === currentUserId;

  const isPacked = task?.status === "PACKED";
  const isCancelled = task?.status === "CANCELLED";
  const taskStatusAllowed =
    task?.status === "PENDING" ||
    task?.status === "IN_PROGRESS" ||
    task?.status === "PARTIALLY_PACKED";

  // Create Package permission
  const canCreatePackage =
    !isPacked &&
    !isCancelled &&
    (userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN" ||
      userRole === "WAREHOUSE_MANAGER" ||
      (userRole === "STAFF" && isAssignedToMe));

  // Package mutation permissions (Add Items, Close Package)
  const showPackageMutations =
    taskStatusAllowed &&
    (userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN" ||
      userRole === "WAREHOUSE_MANAGER" ||
      (userRole === "STAFF" && isAssignedToMe));

  // Dialog states for child actions
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false);
  const [addItemsPackage, setAddItemsPackage] = useState<Package | null>(null);
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [closePackagePackage, setClosePackagePackage] = useState<Package | null>(null);
  const [isClosePackageOpen, setIsClosePackageOpen] = useState(false);

  const isLoading = isTaskLoading || packagesLoading;
  const isError = isTaskError || packagesError;
  const errorMessage =
    (taskError instanceof Error ? taskError.message : null) ||
    (packagesErrorObj instanceof Error ? packagesErrorObj.message : null) ||
    "An unexpected error occurred.";

  const handleRetry = () => {
    if (isTaskError) refetchTask();
    if (packagesError) refetchPackages();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Packing Packages"
      description={task?.packingNumber}
      maxWidthClass="max-w-3xl"
      className="max-h-[90vh] flex flex-col"
      contentClassName="min-h-0 flex-1 overflow-y-auto space-y-4"
    >
      <div>
        {/* Loading */}
        {isLoading && !task && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium">Loading packages...</p>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <PageErrorAlert
            title="Failed to load packages"
            message={errorMessage}
            onRetry={handleRetry}
          />
        )}

        {/* Not Found */}
        {!isLoading && !isError && !task && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Boxes className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">Packing task not found</p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              The requested packing task packages could not be loaded.
            </p>
          </div>
        )}

        {/* Child Dialogs */}
        <CreatePackageDialog
          packingTask={task ?? null}
          isOpen={isCreatePackageOpen}
          onOpenChange={setIsCreatePackageOpen}
        />

        <AddPackageItemsDialog
          packingTask={task ?? null}
          selectedPackage={addItemsPackage}
          isOpen={isAddItemsOpen}
          onOpenChange={(open) => {
            setIsAddItemsOpen(open);
            if (!open) setAddItemsPackage(null);
          }}
        />

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
        {!isLoading && task && (
          <div className="space-y-4">
            {/* Header / Meta Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                  <Boxes className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {task.packingNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Packages ({packages.length})
                  </p>
                </div>
              </div>

              {canCreatePackage && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsCreatePackageOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1 self-start sm:self-auto"
                >
                  <PackagePlus className="h-3.5 w-3.5 mr-1" />
                  Create Package
                </Button>
              )}
            </div>

            {/* Packages Loading overlay or indicator */}
            {packagesLoading && (
              <div className="flex items-center justify-center py-4 text-slate-500 dark:text-slate-400">
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-[11px] font-medium">Updating packages...</p>
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

            {/* Package Cards List */}
            {!packagesError && packages.length > 0 && (
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const statusConfig = PACKAGE_STATUS_CONFIG[pkg.status] ?? {
                    label: pkg.status,
                    variant: "neutral" as const,
                  };

                  return (
                    <div
                      key={pkg.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                            {pkg.packageNumber}
                          </span>
                          <StatusBadge
                            label={statusConfig.label}
                            variant={statusConfig.variant}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Items: <strong className="font-semibold text-slate-700 dark:text-slate-300">{pkg.items.length}</strong>
                          </span>
                          <span>
                            Weight:{" "}
                            <strong className="font-semibold text-slate-700 dark:text-slate-300">
                              {pkg.weight != null ? `${pkg.weight} kg` : "Not specified"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {pkg.notes && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Notes:</span> {pkg.notes}
                        </p>
                      )}

                      {/* Package Items Table */}
                      {pkg.items.length > 0 ? (
                        <div className="mt-2.5 overflow-x-auto rounded border border-slate-100 dark:border-slate-800/80">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
                                <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                                  Product
                                </th>
                                <th className="px-2.5 py-1.5 font-semibold text-slate-600 dark:text-slate-400">
                                  SKU
                                </th>
                                <th className="px-2.5 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                  Quantity
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {pkg.items.map((pkgItem) => (
                                <tr key={pkgItem.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                  <td className="px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200">
                                    {pkgItem.product?.name || pkgItem.productId}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400">
                                    {pkgItem.product?.sku || "\u2014"}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                                    {pkgItem.quantity}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">
                          No items in this package yet.
                        </p>
                      )}

                      {/* Actions for OPEN packages */}
                      {showPackageMutations && pkg.status === "OPEN" && (
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAddItemsPackage(pkg);
                              setIsAddItemsOpen(true);
                            }}
                            className="h-7 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
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
                              className="h-7 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              Close Package
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Packages Empty State */}
            {!packagesLoading && !packagesError && packages.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                <Box className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No packages created yet
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  Create a package to start packing items for this task.
                </p>
                {canCreatePackage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatePackageOpen(true)}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Create Package
                  </Button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 pt-3 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
