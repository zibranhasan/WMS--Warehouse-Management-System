"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PackageCheck, Eye, UserPlus, Play, Ban, PackagePlus } from "lucide-react";
import { PackingTask } from "../packing.types";
import { PackingStatusBadge } from "./packing-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const formatDate = (dateString: string) => {
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface PackingTableProps {
  packingTasks: PackingTask[];
  isLoading: boolean;
  userRole?: string;
  currentUserId?: string;
  onView?: (task: PackingTask) => void;
  onAssign?: (task: PackingTask) => void;
  onStart?: (task: PackingTask) => void;
  onCancel?: (task: PackingTask) => void;
  onCreatePackage?: (task: PackingTask) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PackingTable({
  packingTasks,
  isLoading,
  userRole,
  currentUserId,
  onView,
  onAssign,
  onStart,
  onCancel,
  onCreatePackage,
}: PackingTableProps) {
  const canAssign =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "WAREHOUSE_MANAGER";
  const canStart =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "STAFF";
  const canCancel =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "WAREHOUSE_MANAGER";
  const columns = useMemo<ColumnDef<PackingTask>[]>(
    () => [
      {
        accessorKey: "packingNumber",
        header: "Packing Number",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
              {row.original.packingNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "salesOrder",
        header: "Sales Order",
        cell: ({ row }) => (
          <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
            {row.original.salesOrder?.orderNumber ?? "\u2014"}
          </span>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {row.original.warehouse?.name ?? "\u2014"}
          </span>
        ),
      },
      {
        accessorKey: "packedBy",
        header: "Assigned Packer",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {row.original.packedBy?.name ?? "Unassigned"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <PackingStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => {
          const count = row.original.items?.length ?? 0;
          return (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {count} {count === 1 ? "item" : "items"}
            </span>
          );
        },
      },
      {
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          const totalRequired = items.reduce(
            (sum, item) => sum + item.requiredQuantity,
            0
          );
          const totalPacked = items.reduce(
            (sum, item) => sum + item.packedQuantity,
            0
          );
          return (
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {totalPacked} / {totalRequired}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const task = row.original;
          const isPacked = task.status === "PACKED";
          const isCancelled = task.status === "CANCELLED";
          const isPending = task.status === "PENDING";
          const canAssignThis = !isPacked && !isCancelled;
          const isStaff = userRole === "STAFF";
          const isAssignedToMe = isStaff && task.packedById === currentUserId;
          const canStartThis = isPending && (
            (!isStaff && canStart) ||
            (isStaff && isAssignedToMe)
          );
          const isCancellable =
            !isPacked && !isCancelled && canCancel;

          return (
            <div className="flex items-center gap-1 whitespace-nowrap">
              {onView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="View Details"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(task);
                  }}
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              )}
              {canAssign && canAssignThis && onAssign && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Assign Packer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign(task);
                  }}
                  className="text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="sr-only">Assign Packer</span>
                </Button>
              )}
              {canStartThis && onStart && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Start Packing"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(task);
                  }}
                  className="text-slate-600 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400"
                >
                  <Play className="h-4 w-4" />
                  <span className="sr-only">Start Packing</span>
                </Button>
              )}
              {isCancellable && onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Cancel Packing"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(task);
                  }}
                  className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                >
                  <Ban className="h-4 w-4" />
                  <span className="sr-only">Cancel Packing</span>
                </Button>
              )}
              {(() => {
                const canCreatePackage =
                  !isPacked &&
                  !isCancelled &&
                  (userRole === "SUPER_ADMIN" ||
                    userRole === "ADMIN" ||
                    userRole === "WAREHOUSE_MANAGER" ||
                    (userRole === "STAFF" && isAssignedToMe));
                return canCreatePackage && onCreatePackage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Create Package"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreatePackage(task);
                    }}
                    className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <PackagePlus className="h-4 w-4" />
                    <span className="sr-only">Create Package</span>
                  </Button>
                ) : null;
              })()}
            </div>
          );
        },
      },
    ],
    [onView, onAssign, onStart, onCancel, onCreatePackage, canAssign, canStart, canCancel, currentUserId]
  );

  return (
    <DataTable
      columns={columns}
      data={packingTasks}
      isLoading={isLoading}
      emptyTitle="No Packing Tasks Found"
      emptyDescription="No packing tasks match your search query or filter criteria."
    />
  );
}
