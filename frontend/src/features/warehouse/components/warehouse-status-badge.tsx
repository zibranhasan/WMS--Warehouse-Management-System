import { WarehouseStatus } from "../warehouse.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface WarehouseStatusBadgeProps {
  status: WarehouseStatus;
}

export function WarehouseStatusBadge({ status }: WarehouseStatusBadgeProps) {
  return (
    <StatusBadge
      label={status === "ACTIVE" ? "Active" : "Inactive"}
      variant={status === "ACTIVE" ? "success" : "neutral"}
    />
  );
}
