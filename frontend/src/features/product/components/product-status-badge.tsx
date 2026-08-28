import { ProductStatus } from "../product.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return (
    <StatusBadge
      label={status === "ACTIVE" ? "Active" : "Inactive"}
      variant={status === "ACTIVE" ? "success" : "neutral"}
    />
  );
}
