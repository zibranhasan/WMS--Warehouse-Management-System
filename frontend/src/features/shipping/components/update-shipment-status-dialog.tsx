"use client";

import { useUpdateShipmentStatus } from "../shipping.hooks";
import { Shipment, ShipmentStatus } from "../shipping.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Send, Ban, Truck, CheckCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Status Labels
// ---------------------------------------------------------------------------
const STATUS_LABELS: Record<ShipmentStatus, string> = {
  READY: "Ready",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface UpdateShipmentStatusDialogProps {
  shipment: Shipment | null;
  nextStatus: ShipmentStatus | null;
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function UpdateShipmentStatusDialog({
  shipment,
  nextStatus,
  isOpen,
  onClose,
}: UpdateShipmentStatusDialogProps) {
  const updateMutation = useUpdateShipmentStatus();

  if (!shipment || !nextStatus) return null;

  const isCancel = nextStatus === "CANCELLED";
  const label = TRANSITION_LABELS[nextStatus] ?? nextStatus;
  const Icon = TRANSITION_ICONS[nextStatus] ?? Send;

  const handleConfirm = async () => {
    await updateMutation.mutateAsync({
      id: shipment.id,
      payload: { status: nextStatus },
    });
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title={label}
      subtitle={shipment.shipmentNumber}
      description={
        <div className="space-y-2">
          <p>
            Are you sure you want to update this shipment's status?
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Shipment
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {shipment.shipmentNumber}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Sales Order
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {shipment.salesOrder?.orderNumber ?? shipment.salesOrderId}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Current Status
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {STATUS_LABELS[shipment.status]}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  New Status
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {STATUS_LABELS[nextStatus]}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
      confirmLabel={label}
      onConfirm={handleConfirm}
      isPending={updateMutation.isPending}
      variant={isCancel ? "destructive" : "primary"}
      icon={Icon}
    />
  );
}
