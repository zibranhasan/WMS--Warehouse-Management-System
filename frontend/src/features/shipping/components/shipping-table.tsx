"use client";

import React, { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Truck, Eye, Pencil } from "lucide-react";
import { Shipment, ShipmentStatus } from "../shipping.types";
import { ShippingStatusBadge } from "./shipping-status-badge";
import { ShipmentStatusActions } from "./shipment-status-actions";
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

const formatShippingMethod = (method: string) => {
  const map: Record<string, string> = {
    STANDARD: "Standard",
    EXPRESS: "Express",
    SAME_DAY: "Same Day",
    PICKUP: "Pickup",
  };
  return map[method] ?? method;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ShippingTableProps {
  shipments: Shipment[];
  isLoading: boolean;
  onView?: (shipment: Shipment) => void;
  onEdit?: (shipment: Shipment) => void;
  onStatusChange?: (shipment: Shipment, nextStatus: ShipmentStatus) => void;
  userRole?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ShippingTable({
  shipments,
  isLoading,
  onView,
  onEdit,
  onStatusChange,
  userRole,
}: ShippingTableProps) {
  const columns = useMemo<ColumnDef<Shipment>[]>(
    () => [
      {
        accessorKey: "shipmentNumber",
        header: "Shipment Number",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
              {row.original.shipmentNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "salesOrder",
        header: "Sales Order",
        cell: ({ row }) => (
          <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
            {row.original.salesOrder?.orderNumber ??
              row.original.salesOrderId ??
              "\u2014"}
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
        accessorKey: "shippingMethod",
        header: "Shipping Method",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {formatShippingMethod(row.original.shippingMethod)}
          </span>
        ),
      },
      {
        accessorKey: "carrier",
        header: "Carrier",
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {row.original.carrier ?? "\u2014"}
          </span>
        ),
      },
      {
        accessorKey: "trackingNumber",
        header: "Tracking Number",
        cell: ({ row }) => (
          <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
            {row.original.trackingNumber ?? "\u2014"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <ShippingStatusBadge status={row.original.status} />
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
          const shipment = row.original;

          const canEdit =
            onEdit &&
            shipment.status === "READY" &&
            (userRole === "SUPER_ADMIN" ||
              userRole === "ADMIN" ||
              userRole === "WAREHOUSE_MANAGER");

          return (
            <div className="flex items-center gap-1">
              {onView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="View Details"
                  onClick={() => onView(shipment)}
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              )}
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Edit Shipment"
                  onClick={() => onEdit(shipment)}
                  className="text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit Shipment</span>
                </Button>
              )}
              <ShipmentStatusActions
                shipment={shipment}
                userRole={userRole}
                onStatusChange={onStatusChange}
              />
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onStatusChange, userRole]
  );

  return (
    <DataTable
      columns={columns}
      data={shipments}
      isLoading={isLoading}
      emptyTitle="No Shipments Found"
      emptyDescription="No shipments match your search query or filter criteria."
    />
  );
}
