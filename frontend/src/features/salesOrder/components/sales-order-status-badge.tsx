import { SalesOrderStatus } from "../sales-order.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface SalesOrderStatusBadgeProps {
  status: SalesOrderStatus;
}

const STATUS_MAP: Record<
  SalesOrderStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "info" | "neutral";
  }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  SHIPPED: { label: "Shipped", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function SalesOrderStatusBadge({ status }: SalesOrderStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    variant: "neutral" as const,
  };
  return <StatusBadge label={config.label} variant={config.variant} />;
}
