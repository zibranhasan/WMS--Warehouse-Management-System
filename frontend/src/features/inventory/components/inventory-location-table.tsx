"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { InventoryLocationStock } from "../inventory.types";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Box, Grid, Columns, Layers, ArrowRightLeft, MinusCircle, PlusCircle, Info } from "lucide-react";

interface InventoryLocationTableProps {
  locationStocks: InventoryLocationStock[];
  isLoading: boolean;
  canMutate: boolean;
  onAllocate: (stock: InventoryLocationStock) => void;
  onDeallocate: (stock: InventoryLocationStock) => void;
  onTransfer: (stock: InventoryLocationStock) => void;
  onViewBinDetails: (binId: string) => void;
}

export function InventoryLocationTable({
  locationStocks,
  isLoading,
  canMutate,
  onAllocate,
  onDeallocate,
  onTransfer,
  onViewBinDetails,
}: InventoryLocationTableProps) {
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

  const columns = React.useMemo<ColumnDef<InventoryLocationStock>[]>(() => {
    return [
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => {
          const product = row.original.product;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white">
                {product?.name || "Unknown Product"}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                SKU: {product?.sku || "-"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "bin",
        header: "Storage Location (Hierarchy)",
        cell: ({ row }) => {
          const bin = row.original.bin;
          const shelf = bin?.shelf;
          const aisle = shelf?.aisle;
          const zone = aisle?.zone;

          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Box className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>
                  Bin: {bin?.name || "-"} ({bin?.code || "-"})
                </span>
                {bin?.id && (
                  <button
                    type="button"
                    onClick={() => onViewBinDetails(bin.id)}
                    title="View Bin Details & Capacity"
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 ml-1"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                <span className="flex items-center gap-1">
                  <Grid className="h-3 w-3 text-amber-500" />
                  {shelf?.name || "-"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Columns className="h-3 w-3 text-blue-500" />
                  {aisle?.name || "-"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-indigo-500" />
                  {zone?.name || "-"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: "Allocated Qty",
        cell: ({ row }) => {
          const qty = Number(row.original.quantity);
          return (
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
              {qty} {row.original.product?.unit || ""}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Allocated At",
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const loc = row.original;
          if (!canMutate) return null;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAllocate(loc)}
                title="Allocate More Stock to this Bin"
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 px-2 h-7"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Allocate
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDeallocate(loc)}
                title="Deallocate Stock from this Bin"
                className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 px-2 h-7"
              >
                <MinusCircle className="h-3.5 w-3.5" />
                Deallocate
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onTransfer(loc)}
                title="Transfer Stock to another Bin"
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 px-2 h-7"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Transfer
              </Button>
            </div>
          );
        },
      },
    ];
  }, [canMutate, onAllocate, onDeallocate, onTransfer, onViewBinDetails]);

  return (
    <DataTable
      columns={columns}
      data={locationStocks}
      isLoading={isLoading}
      emptyTitle="No Bin Allocations Found"
      emptyDescription="No stock has been allocated to physical bins in this warehouse yet."
    />
  );
}
