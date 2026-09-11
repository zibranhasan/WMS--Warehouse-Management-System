"use client";

import { Shipment, ShipmentStatus } from "../shipping.types";
import { Button } from "@/components/ui/button";
import { Send, Ban, Truck, CheckCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Transition Map — each status maps to an array of valid next statuses
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS: Partial<Record<ShipmentStatus, ShipmentStatus[]>> = {
  READY: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
};

const TRANSITION_LABELS: Record<string, string> = {
  SHIPPED: "Mark as Shipped",
  IN_TRANSIT: "Mark In Transit",
  DELIVERED: "Mark as Delivered",
  CANCELLED: "Cancel Shipment",
};

const TRANSITION_ICONS: Record<string, typeof Send> = {
  SHIPPED: Send,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: Ban,
};

const TRANSITION_STYLES: Record<string, string> = {
  SHIPPED: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
  IN_TRANSIT: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
  DELIVERED: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
  CANCELLED: "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ShipmentStatusActionsProps {
  shipment: Shipment;
  userRole?: string;
  onStatusChange?: (shipment: Shipment, nextStatus: ShipmentStatus) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ShipmentStatusActions({
  shipment,
  userRole,
  onStatusChange,
}: ShipmentStatusActionsProps) {
  const canTransition =
    onStatusChange &&
    (userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN" ||
      userRole === "WAREHOUSE_MANAGER" ||
      userRole === "STAFF");

  if (!canTransition) return null;

  const nextStatuses = VALID_TRANSITIONS[shipment.status];

  if (!nextStatuses?.length) return null;

  return (
    <>
      {nextStatuses.map((nextStatus) => {
        const label = TRANSITION_LABELS[nextStatus];
        const Icon = TRANSITION_ICONS[nextStatus] ?? Send;
        const style = TRANSITION_STYLES[nextStatus] ?? "text-slate-600 hover:text-slate-700";

        return (
          <Button
            key={nextStatus}
            type="button"
            variant="ghost"
            size="sm"
            title={label}
            onClick={() => onStatusChange(shipment, nextStatus)}
            className={style}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        );
      })}
    </>
  );
}
