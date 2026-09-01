"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { StockMovement, InventoryLocationMovement } from "../inventory.types";
import { DataTable } from "@/components/shared/data-table";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, MoveRight, User as UserIcon } from "lucide-react";

type UnifiedMovement = {
  id: string;
  source: "warehouse" | "location";
  date: string;
  productName: string;
  productSku: string;
  warehouseName: string;
  type: string;
  quantity: number;
  previousStock?: number;
  newStock?: number;
  fromBinName?: string;
  toBinName?: string;
  reason?: string | null;
  reference?: string | null;
  createdByName?: string;
};

interface StockMovementTableProps {
  warehouseMovements: StockMovement[];
  locationMovements: InventoryLocationMovement[];
  isLoading: boolean;
}

export function StockMovementTable({
  warehouseMovements,
  locationMovements,
  isLoading,
}: StockMovementTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
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

  const unifiedData = React.useMemo<UnifiedMovement[]>(() => {
    const list: UnifiedMovement[] = [];

    warehouseMovements.forEach((m) => {
      list.push({
        id: `wh-${m.id}`,
        source: "warehouse",
        date: m.createdAt,
        productName: m.product?.name || "Unknown Product",
        productSku: m.product?.sku || "-",
        warehouseName: m.warehouse?.name || "-",
        type: m.type,
        quantity: Number(m.quantity),
        previousStock: Number(m.previousStock),
        newStock: Number(m.newStock),
        reason: m.reason,
        reference: m.reference,
        createdByName: m.createdBy?.name || "System",
      });
    });

    locationMovements.forEach((lm) => {
      list.push({
        id: `loc-${lm.id}`,
        source: "location",
        date: lm.createdAt,
        productName: lm.product?.name || "Unknown Product",
        productSku: lm.product?.sku || "-",
        warehouseName: lm.warehouse?.name || "-",
        type: lm.type,
        quantity: Number(lm.quantity),
        fromBinName: lm.fromBin ? `${lm.fromBin.name} (${lm.fromBin.code})` : undefined,
        toBinName: lm.toBin ? `${lm.toBin.name} (${lm.toBin.code})` : undefined,
        reason: lm.reason,
        reference: lm.reference,
        createdByName: lm.createdBy?.name || "System",
      });
    });

    // Sort combined audit logs descending by timestamp
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [warehouseMovements, locationMovements]);

  const renderBadge = (type: string) => {
    switch (type) {
      case "IN":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ArrowDownLeft className="h-3 w-3" />
            STOCK IN
          </span>
        );
      case "OUT":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
            <ArrowUpRight className="h-3 w-3" />
            STOCK OUT
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <RefreshCw className="h-3 w-3" />
            ADJUSTMENT
          </span>
        );
      case "ALLOCATE":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <MoveRight className="h-3 w-3" />
            ALLOCATE
          </span>
        );
      case "DEALLOCATE":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <MoveRight className="h-3 w-3 rotate-180" />
            DEALLOCATE
          </span>
        );
      case "TRANSFER":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <RefreshCw className="h-3 w-3" />
            TRANSFER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {type}
          </span>
        );
    }
  };

  const columns = React.useMemo<ColumnDef<UnifiedMovement>[]>(() => {
    return [
      {
        accessorKey: "date",
        header: "Timestamp",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDate(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "productName",
        header: "Product & SKU",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white text-xs">
              {row.original.productName}
            </span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              SKU: {row.original.productSku}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Movement Type",
        cell: ({ row }) => renderBadge(row.original.type),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const qty = row.original.quantity;
          return (
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
              {qty > 0 && row.original.type === "IN" ? `+${qty}` : qty}
            </span>
          );
        },
      },
      {
        id: "details",
        header: "Audit Details",
        cell: ({ row }) => {
          const item = row.original;

          if (item.source === "warehouse") {
            return (
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                Stock: {item.previousStock} → {item.newStock}
              </span>
            );
          }

          if (item.type === "ALLOCATE") {
            return (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                To: <strong className="text-slate-800 dark:text-slate-200">{item.toBinName}</strong>
              </span>
            );
          }

          if (item.type === "DEALLOCATE") {
            return (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                From: <strong className="text-slate-800 dark:text-slate-200">{item.fromBinName}</strong>
              </span>
            );
          }

          if (item.type === "TRANSFER") {
            return (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {item.fromBinName} → {item.toBinName}
              </span>
            );
          }

          return null;
        },
      },
      {
        accessorKey: "reference",
        header: "Reason / Reference",
        cell: ({ row }) => (
          <div className="flex flex-col text-xs">
            {row.original.reference && (
              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Ref: {row.original.reference}
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {row.original.reason || "No reason specified"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdByName",
        header: "Performed By",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{row.original.createdByName}</span>
          </div>
        ),
      },
    ];
  }, []);

  return (
    <DataTable
      columns={columns}
      data={unifiedData}
      isLoading={isLoading}
      emptyTitle="No Movement History Found"
      emptyDescription="No stock movements or location transfers have been logged yet."
    />
  );
}
