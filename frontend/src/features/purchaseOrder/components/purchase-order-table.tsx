"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PurchaseOrder } from "../purchase-order.types";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Receipt, Eye, Edit2, CheckCircle, XCircle, Ban, Truck, History } from "lucide-react";

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  isLoading: boolean;
  canEdit?: boolean;
  canManage?: boolean;
  canReceive?: boolean;
  onView?: (po: PurchaseOrder) => void;
  onEdit?: (po: PurchaseOrder) => void;
  onApprove?: (po: PurchaseOrder) => void;
  onReject?: (po: PurchaseOrder) => void;
  onCancel?: (po: PurchaseOrder) => void;
  onReceive?: (po: PurchaseOrder) => void;
  onReceipts?: (po: PurchaseOrder) => void;
}

export function PurchaseOrderTable({
  purchaseOrders,
  isLoading,
  canEdit = false,
  canManage = false,
  canReceive = false,
  onView,
  onEdit,
  onApprove,
  onReject,
  onCancel,
  onReceive,
  onReceipts,
}: PurchaseOrderTableProps) {
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

  const columns = React.useMemo<ColumnDef<PurchaseOrder>[]>(() => {
    return [
      {
        accessorKey: "poNumber",
        header: "PO Number",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
              {row.original.poNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white text-xs">
              {row.original.supplier?.name || "—"}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {row.original.supplier?.code || ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {row.original.warehouse?.name || "—"}
          </span>
        ),
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => {
          const itemCount = row.original.items?.length || 0;
          return (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            {formatCurrency(Number(row.original.totalAmount))}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <PurchaseOrderStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 font-medium dark:text-slate-300">
            {row.original.createdBy?.name || "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created Date",
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
          const po = row.original;
          const isEditable = canEdit && po.status === "PENDING";
          const isApprovable = canManage && po.status === "PENDING";
          const isRejectable = canManage && po.status === "PENDING";
          const isCancellable =
            canManage &&
            (po.status === "PENDING" || po.status === "APPROVED");
          const isReceivable =
            canReceive &&
            (po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED");
          const hasReceipts =
            po.status === "PARTIALLY_RECEIVED" || po.status === "RECEIVED";

          return (
            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
              {onView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(po)}
                  title="View Purchase Order"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View</span>
                </Button>
              )}
              {isEditable && onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(po)}
                  title="Edit Purchase Order"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
              {isApprovable && onApprove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onApprove(po)}
                  title="Approve Purchase Order"
                  className="text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Approve</span>
                </Button>
              )}
              {isRejectable && onReject && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onReject(po)}
                  title="Reject Purchase Order"
                  className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Reject</span>
                </Button>
              )}
              {isCancellable && onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(po)}
                  title="Cancel Purchase Order"
                  className="text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                >
                  <Ban className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              )}
              {isReceivable && onReceive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onReceive(po)}
                  title="Receive Goods"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Truck className="h-4 w-4" />
                  <span className="sr-only">Receive</span>
                </Button>
              )}
              {hasReceipts && onReceipts && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onReceipts(po)}
                  title="View Receipt History"
                  className="text-slate-600 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                >
                  <History className="h-4 w-4" />
                  <span className="sr-only">Receipts</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ];
  }, [canEdit, canManage, canReceive, onView, onEdit, onApprove, onReject, onCancel, onReceive, onReceipts]);

  return (
    <DataTable
      columns={columns}
      data={purchaseOrders}
      isLoading={isLoading}
      emptyTitle="No Purchase Orders Found"
      emptyDescription="No purchase orders match your search query or filter criteria."
    />
  );
}
