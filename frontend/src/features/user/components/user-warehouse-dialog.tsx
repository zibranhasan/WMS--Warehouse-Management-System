"use client";

import { useState } from "react";
import { User } from "../user.types";
import { useWarehouses, useAssignUser, useUnassignUser } from "@/features/warehouse/warehouse.hooks";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Building2, Loader2, Unlink } from "lucide-react";

interface UserWarehouseDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function UserWarehouseDialog({
  user,
  isOpen,
  onClose,
  onSuccess,
}: UserWarehouseDialogProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch active warehouses for assignment dropdown
  const { data: warehouseData, isLoading: isLoadingWarehouses } = useWarehouses({
    limit: 100,
    status: "ACTIVE",
  });

  const assignMutation = useAssignUser();
  const unassignMutation = useUnassignUser();

  const isPending = assignMutation.isPending || unassignMutation.isPending;

  const [prevUser, setPrevUser] = useState<User | null>(user);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  if (user !== prevUser || isOpen !== prevIsOpen) {
    setPrevUser(user);
    setPrevIsOpen(isOpen);
    setSelectedWarehouseId(user?.warehouseId || "");
    setErrorMessage(null);
  }

  if (!user) return null;

  const warehouses = warehouseData?.data || [];
  const currentWarehouseName = user.warehouse
    ? `${user.warehouse.name} (${user.warehouse.code})`
    : user.warehouseId;

  const handleAssign = async () => {
    if (!selectedWarehouseId) {
      setErrorMessage("Please select a warehouse to assign.");
      return;
    }

    setErrorMessage(null);

    try {
      // If user is already assigned to a different warehouse, unassign first
      if (user.warehouseId && user.warehouseId !== selectedWarehouseId) {
        await unassignMutation.mutateAsync({
          warehouseId: user.warehouseId,
          userId: user.id,
        });
      } else if (user.warehouseId === selectedWarehouseId) {
        onClose();
        return;
      }

      await assignMutation.mutateAsync({
        warehouseId: selectedWarehouseId,
        userId: user.id,
      });

      onSuccess(`Warehouse assigned to "${user.name}" successfully.`);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleUnassign = async () => {
    if (!user.warehouseId) return;

    setErrorMessage(null);

    try {
      await unassignMutation.mutateAsync({
        warehouseId: user.warehouseId,
        userId: user.id,
      });

      onSuccess(`Warehouse unassigned from "${user.name}" successfully.`);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Warehouse Assignment"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* User Details Overview */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Employee Account
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {user.name}
          </p>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {user.email}
          </p>
          {user.warehouseId && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Assigned Warehouse:
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {currentWarehouseName}
              </span>
            </div>
          )}
        </div>

        {/* Warehouse Selection */}
        <div className="space-y-1.5">
          <label
            htmlFor="warehouse-select"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Select Warehouse <span className="text-red-500">*</span>
          </label>

          {isLoadingWarehouses ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading active warehouses...</span>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              No active warehouses available. Please create or activate a warehouse first.
            </div>
          ) : (
            <select
              id="warehouse-select"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">-- Select a Warehouse --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          {user.warehouseId ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleUnassign}
              disabled={isPending}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              {unassignMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-1.5 h-4 w-4" />
              )}
              Unassign
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={isPending || warehouses.length === 0 || !selectedWarehouseId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {assignMutation.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {user.warehouseId ? "Update Assignment" : "Assign Warehouse"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
