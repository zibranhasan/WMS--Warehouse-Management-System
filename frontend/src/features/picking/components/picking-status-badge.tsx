import { PickingStatus } from "../picking.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface PickingStatusBadgeProps {
  status: PickingStatus;
}

const STATUS_MAP: Record<
  PickingStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "info" | "neutral";
  }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  ASSIGNED: { label: "Assigned", variant: "info" },
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  PARTIALLY_PICKED: { label: "Partially Picked", variant: "warning" },
  PICKED: { label: "Picked", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function PickingStatusBadge({ status }: PickingStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    variant: "neutral" as const,
  };
  return <StatusBadge label={config.label} variant={config.variant} />;
}
