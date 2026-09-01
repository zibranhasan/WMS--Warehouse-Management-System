import { StatusBadge, StatusBadgeVariant } from "@/components/shared/status-badge";
import { LocationStatus } from "../zone.types";

interface LocationStatusBadgeProps {
  status: LocationStatus | string;
}

export function LocationStatusBadge({ status }: LocationStatusBadgeProps) {
  const getBadgeConfig = (stat: string): { label: string; variant: StatusBadgeVariant } => {
    switch (stat) {
      case "ACTIVE":
        return { label: "Active", variant: "success" };
      case "MAINTENANCE":
        return { label: "Maintenance", variant: "warning" };
      case "FULL":
        return { label: "Full", variant: "info" };
      case "INACTIVE":
      default:
        return { label: "Inactive", variant: "destructive" };
    }
  };

  const config = getBadgeConfig(status);

  return <StatusBadge label={config.label} variant={config.variant} />;
}
