"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Product, ProductStatus } from "../product.types";
import { ProductStatusBadge } from "./product-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, ImageIcon } from "lucide-react";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  canMutate: boolean;
  onEdit: (product: Product) => void;
  onStatusToggle: (id: string, currentStatus: ProductStatus) => void;
  onDelete: (product: Product) => void;
  statusTogglePendingId?: string | null;
}

export function ProductTable({
  products,
  isLoading,
  canMutate,
  onEdit,
  onStatusToggle,
  onDelete,
  statusTogglePendingId,
}: ProductTableProps) {
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

  const columns = React.useMemo<ColumnDef<Product>[]>(() => {
    const cols: ColumnDef<Product>[] = [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }) => {
          const imageUrl = row.original.image;
          return (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center dark:border-slate-800 dark:bg-slate-900">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={row.original.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-slate-400" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {row.original.sku}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white">
              {row.original.name}
            </span>
            {row.original.description && (
              <span className="text-xs text-slate-500 truncate max-w-xs dark:text-slate-400">
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 font-medium dark:text-slate-300">
            {row.original.category?.name || "—"}
          </span>
        ),
      },
      {
        id: "brand",
        header: "Brand",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {row.original.brand?.name || (
              <span className="italic text-slate-400 dark:text-slate-600">
                No Brand
              </span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 dark:text-slate-400 uppercase font-medium">
            {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <ProductStatusBadge status={row.original.status} />
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
          const product = row.original;
          const isPending = statusTogglePendingId === product.id;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {/* Toggle Status */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusToggle(product.id, product.status)}
                disabled={isPending}
                title={`Switch status to ${
                  product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                }`}
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : product.status === "ACTIVE" ? (
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
                onClick={() => onEdit(product)}
                title="Edit Product"
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
                onClick={() => onDelete(product)}
                title="Delete Product"
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
      data={products}
      isLoading={isLoading}
      emptyTitle="No Products Found"
      emptyDescription="No product records match your filter criteria or search query."
    />
  );
}
