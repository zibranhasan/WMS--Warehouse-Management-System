"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Supplier, SupplierStatus } from "../supplier.types";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Eye,
} from "lucide-react";

interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  canMutate: boolean;
  onView?: (supplier: Supplier) => void;
  onEdit?: (supplier: Supplier) => void;
  onStatusToggle?: (id: string, currentStatus: SupplierStatus) => void;
  onDelete?: (supplier: Supplier) => void;
  statusTogglePendingId?: string | null;
}

export function SupplierTable({
  suppliers,
  isLoading,
  canMutate,
  onView,
  onEdit,
  onStatusToggle,
  onDelete,
  statusTogglePendingId,
}: SupplierTableProps) {
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

  const columns = React.useMemo<ColumnDef<Supplier>[]>(() => {
    const cols: ColumnDef<Supplier>[] = [
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
        header: "Supplier Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white">
              {row.original.name}
            </span>
            {row.original.address && (
              <span className="text-xs text-slate-500 truncate max-w-xs dark:text-slate-400">
                {row.original.address}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "contactPerson",
        header: "Contact Person",
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 font-medium dark:text-slate-300">
            {row.original.contactPerson || "—"}
          </span>
        ),
      },
      {
        id: "contactInfo",
        header: "Contact Info",
        cell: ({ row }) => {
          const { email, phone } = row.original;
          if (!email && !phone) {
            return <span className="text-xs text-slate-400 dark:text-slate-600">—</span>;
          }
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              {email && (
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                  {email}
                </span>
              )}
              {phone && (
                <span className="text-slate-500 dark:text-slate-400">
                  {phone}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => {
          const { city, country } = row.original;
          const locationParts = [city, country].filter(Boolean);
          return (
            <span className="text-xs text-slate-700 font-medium dark:text-slate-300">
              {locationParts.length > 0 ? locationParts.join(", ") : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <StatusBadge
              label={status === "ACTIVE" ? "Active" : "Inactive"}
              variant={status === "ACTIVE" ? "success" : "neutral"}
            />
          );
        },
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
    ];

    if (onView || canMutate) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const supplier = row.original;
          const isPending = statusTogglePendingId === supplier.id;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {/* View Details */}
              {onView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(supplier)}
                  title="View Supplier Details"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              )}

              {/* Mutations for authorized roles */}
              {canMutate && (
                <>
                  {/* Toggle Status */}
                  {onStatusToggle && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusToggle(supplier.id, supplier.status)}
                      disabled={isPending}
                      title={`Switch status to ${
                        supplier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                      }`}
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : supplier.status === "ACTIVE" ? (
                        <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="sr-only">Toggle Status</span>
                    </Button>
                  )}

                  {/* Edit */}
                  {onEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(supplier)}
                      title="Edit Supplier"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  )}

                  {/* Delete */}
                  {onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(supplier)}
                      title="Delete Supplier"
                      className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        },
      });
    }

    return cols;
  }, [
    canMutate,
    statusTogglePendingId,
    onView,
    onStatusToggle,
    onEdit,
    onDelete,
  ]);

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      isLoading={isLoading}
      emptyTitle="No Suppliers Found"
      emptyDescription="No supplier records match your filter criteria or search query."
    />
  );
}
