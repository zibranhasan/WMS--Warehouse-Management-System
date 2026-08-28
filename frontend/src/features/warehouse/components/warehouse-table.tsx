"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Warehouse, WarehouseStatus } from "../warehouse.types";
import { WarehouseStatusBadge } from "./warehouse-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Edit2, ToggleLeft, ToggleRight, Loader2, Eye } from "lucide-react";

interface WarehouseTableProps {
  warehouses: Warehouse[];
  isLoading: boolean;
  canMutate: boolean;
  onEdit: (warehouse: Warehouse) => void;
  onStatusToggle: (id: string, currentStatus: WarehouseStatus) => void;
  statusTogglePendingId?: string | null;
}

export function WarehouseTable({
  warehouses,
  isLoading,
  canMutate,
  onEdit,
  onStatusToggle,
  statusTogglePendingId,
}: WarehouseTableProps) {
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

  const columns = React.useMemo<ColumnDef<Warehouse>[]>(() => {
    return [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/warehouses/${row.original.id}`}
              className="font-semibold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
            >
              {row.original.name}
            </Link>
            {row.original.description && (
              <span className="text-xs text-slate-500 truncate max-w-xs dark:text-slate-400">
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 font-medium dark:text-slate-300">
            {row.original.city || "—"}
          </span>
        ),
      },
      {
        accessorKey: "country",
        header: "Country",
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 font-medium dark:text-slate-300">
            {row.original.country || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <WarehouseStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const warehouse = row.original;
          const isPending = statusTogglePendingId === warehouse.id;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {/* View Detail Link */}
              <Link href={`/warehouses/${warehouse.id}`}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="View Warehouse Detail"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Button>
              </Link>

              {/* Toggle Status (SUPER_ADMIN / ADMIN only) */}
              {canMutate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusToggle(warehouse.id, warehouse.status)}
                  disabled={isPending}
                  title={`Switch status to ${
                    warehouse.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                  }`}
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : warehouse.status === "ACTIVE" ? (
                    <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="sr-only">Toggle Status</span>
                </Button>
              )}

              {/* Edit (SUPER_ADMIN / ADMIN only) */}
              {canMutate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(warehouse)}
                  title="Edit Warehouse"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ];
  }, [canMutate, statusTogglePendingId, onStatusToggle, onEdit]);

  return (
    <DataTable
      columns={columns}
      data={warehouses}
      isLoading={isLoading}
      emptyTitle="No Warehouses Found"
      emptyDescription="No warehouse records match your search query or status filter."
    />
  );
}
