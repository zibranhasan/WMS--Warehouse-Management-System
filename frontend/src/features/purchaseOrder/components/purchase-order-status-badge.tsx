import { PurchaseOrderStatus } from "../purchase-order.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus;
}

const STATUS_MAP: Record<
  PurchaseOrderStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "info" | "neutral" }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  PARTIALLY_RECEIVED: { label: "Partially Received", variant: "info" },
  RECEIVED: { label: "Received", variant: "info" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function PurchaseOrderStatusBadge({ status }: PurchaseOrderStatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: status, variant: "neutral" as const };
  return <StatusBadge label={config.label} variant={config.variant} />;
}
