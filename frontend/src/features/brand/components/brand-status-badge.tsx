import { BrandStatus } from "../brand.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface BrandStatusBadgeProps {
  status: BrandStatus;
}

export function BrandStatusBadge({ status }: BrandStatusBadgeProps) {
  return (
    <StatusBadge
      label={status === "ACTIVE" ? "Active" : "Inactive"}
      variant={status === "ACTIVE" ? "success" : "neutral"}
    />
  );
}
