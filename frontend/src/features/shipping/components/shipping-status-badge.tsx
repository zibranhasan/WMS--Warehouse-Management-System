import { ShipmentStatus } from "../shipping.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface ShippingStatusBadgeProps {
  status: ShipmentStatus;
}

const STATUS_MAP: Record<
  ShipmentStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "info" | "neutral";
  }
> = {
  READY: { label: "Ready", variant: "warning" },
  SHIPPED: { label: "Shipped", variant: "info" },
  IN_TRANSIT: { label: "In Transit", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function ShippingStatusBadge({ status }: ShippingStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    variant: "neutral" as const,
  };
  return <StatusBadge label={config.label} variant={config.variant} />;
}
