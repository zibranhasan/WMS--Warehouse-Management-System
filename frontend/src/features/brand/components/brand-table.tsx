"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Brand, BrandStatus } from "../brand.types";
import { BrandStatusBadge } from "./brand-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface BrandTableProps {
  brands: Brand[];
  isLoading: boolean;
  canMutate: boolean;
  onEdit: (brand: Brand) => void;
  onStatusToggle: (id: string, currentStatus: BrandStatus) => void;
  onDelete: (brand: Brand) => void;
  statusTogglePendingId?: string | null;
}

export function BrandTable({
  brands,
  isLoading,
  canMutate,
  onEdit,
  onStatusToggle,
  onDelete,
  statusTogglePendingId,
}: BrandTableProps) {
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

  const columns = React.useMemo<ColumnDef<Brand>[]>(() => {
    const cols: ColumnDef<Brand>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 dark:text-white">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {row.original.slug}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
            {row.original.description || (
              <span className="italic text-slate-400 dark:text-slate-600">
                No description
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <BrandStatusBadge status={row.original.status} />
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
    ];

    if (canMutate) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const brand = row.original;
          const isPending = statusTogglePendingId === brand.id;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {/* Toggle Status */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusToggle(brand.id, brand.status)}
                disabled={isPending}
                title={`Switch status to ${
                  brand.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                }`}
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : brand.status === "ACTIVE" ? (
                  <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-slate-400" />
                )}
                <span className="sr-only">Toggle Status</span>
              </Button>

              {/* Edit */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(brand)}
                title="Edit Brand"
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(brand)}
                title="Delete Brand"
                className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          );
        },
      });
    }

    return cols;
  }, [canMutate, statusTogglePendingId, onStatusToggle, onEdit, onDelete]);

  return (
    <DataTable
      columns={columns}
      data={brands}
      isLoading={isLoading}
      emptyTitle="No Brands Found"
      emptyDescription="No brand records match your filter criteria or search query."
    />
  );
}
