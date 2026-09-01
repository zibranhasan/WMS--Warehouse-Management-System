"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { InventoryStock } from "../inventory.types";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Boxes, Info } from "lucide-react";

interface InventoryStockTableProps {
  stocks: InventoryStock[];
  isLoading: boolean;
  onViewSummary: (stock: InventoryStock) => void;
}

export function InventoryStockTable({
  stocks,
  isLoading,
  onViewSummary,
}: InventoryStockTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
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

  const columns = React.useMemo<ColumnDef<InventoryStock>[]>(() => {
    return [
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => {
          const product = row.original.product;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {product?.name || "Unknown Product"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Unit: {product?.unit || "PCS"}
              </span>
            </div>
          );
        },
      },
      {
        id: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {row.original.product?.sku || "-"}
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Total Stock",
        cell: ({ row }) => {
          const qty = Number(row.original.quantity);
          return (
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                qty > 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {qty} {row.original.product?.unit || ""}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end whitespace-nowrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewSummary(row.original)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5 h-8 px-2.5"
            >
              <Info className="h-3.5 w-3.5" />
              View Summary & Locations
            </Button>
          </div>
        ),
      },
    ];
  }, [onViewSummary]);

  return (
    <DataTable
      columns={columns}
      data={stocks}
      isLoading={isLoading}
      emptyTitle="No Inventory Records Found"
      emptyDescription="No stock records exist for the selected warehouse or search query."
    />
  );
}
