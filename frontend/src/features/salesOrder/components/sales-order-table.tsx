"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Package, Eye, Ban } from "lucide-react";
import { SalesOrder } from "../sales-order.types";
import { SalesOrderStatusBadge } from "./sales-order-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Formatting helpers (local, same pattern as other tables)
// ---------------------------------------------------------------------------
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

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
interface SalesOrderTableProps {
  salesOrders: SalesOrder[];
  isLoading: boolean;
  canCancel?: boolean;
  onView?: (so: SalesOrder) => void;
  onCancel?: (so: SalesOrder) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SalesOrderTable({
  salesOrders,
  isLoading,
  canCancel = false,
  onView,
  onCancel,
}: SalesOrderTableProps) {
  const columns = useMemo<ColumnDef<SalesOrder>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Order Number",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
              {row.original.orderNumber}
            </span>
          </div>
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <SalesOrderStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(row.original.totalAmount)}
          </span>
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
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {row.original.createdBy?.name ?? "\u2014"}
          </span>
        ),
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
          const so = row.original;

          return (
            <div className="flex items-center gap-1">
              {onView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="View Details"
                  onClick={() => onView(so)}
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              )}
              {canCancel && onCancel && so.status === "CONFIRMED" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Cancel Order"
                  onClick={() => onCancel(so)}
                  className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                >
                  <Ban className="h-4 w-4" />
                  <span className="sr-only">Cancel Order</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onCancel, canCancel]
  );

  return (
    <DataTable
      columns={columns}
      data={salesOrders}
      isLoading={isLoading}
      emptyTitle="No Sales Orders Found"
      emptyDescription="No sales orders match your search query or filter criteria."
    />
  );
}
