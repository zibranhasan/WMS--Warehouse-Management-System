import { PackingStatus } from "../packing.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface PackingStatusBadgeProps {
  status: PackingStatus;
}

const STATUS_MAP: Record<
  PackingStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "info" | "neutral";
  }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  PARTIALLY_PACKED: { label: "Partially Packed", variant: "info" },
  PACKED: { label: "Packed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function PackingStatusBadge({ status }: PackingStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    variant: "neutral" as const,
  };
  return <StatusBadge label={config.label} variant={config.variant} />;
}
