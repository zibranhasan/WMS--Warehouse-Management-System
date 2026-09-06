"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PackageCheck, Eye, UserPlus, Play } from "lucide-react";
import { PickingTask } from "../picking.types";
import { PickingStatusBadge } from "./picking-status-badge";
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
interface PickingTableProps {
  pickingTasks: PickingTask[];
  isLoading: boolean;
  userRole?: string;
  currentUserId?: string;
  onView?: (task: PickingTask) => void;
  onAssign?: (task: PickingTask) => void;
  onStart?: (task: PickingTask) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PickingTable({
  pickingTasks,
  isLoading,
  userRole,
  currentUserId,
  onView,
  onAssign,
  onStart,
}: PickingTableProps) {
  const canAssign =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "WAREHOUSE_MANAGER";

  const canStart =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "STAFF";

  const columns = useMemo<ColumnDef<PickingTask>[]>(
    () => [
      {
        accessorKey: "pickingNumber",
        header: "Picking Number",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
              {row.original.pickingNumber}
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
        accessorKey: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {row.original.assignedTo?.name ?? "\u2014"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <PickingStatusBadge status={row.original.status} />
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
          const isCancelled = task.status === "CANCELLED";
          const isPicked = task.status === "PICKED";
          const isInProgress = task.status === "IN_PROGRESS";
          const canStartThis = !isCancelled && !isPicked && !isInProgress;
          const canAssignThis = !isCancelled && !isPicked;

          // STAFF can only start tasks assigned to them
          const isAssignedToMe =
            userRole === "STAFF" ? task.assignedToId === currentUserId : true;

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
                  title="Assign Picker"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign(task);
                  }}
                  className="text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="sr-only">Assign Picker</span>
                </Button>
              )}
              {canStart && canStartThis && isAssignedToMe && onStart && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Start Picking"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(task);
                  }}
                  className="text-slate-600 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400"
                >
                  <Play className="h-4 w-4" />
                  <span className="sr-only">Start Picking</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onAssign, onStart, canAssign, canStart, userRole, currentUserId]
  );

  return (
    <DataTable
      columns={columns}
      data={pickingTasks}
      isLoading={isLoading}
      emptyTitle="No Picking Tasks Found"
      emptyDescription="No picking tasks match your search query or filter criteria."
    />
  );
}
