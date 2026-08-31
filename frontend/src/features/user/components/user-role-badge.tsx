import { Role } from "../user.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface UserRoleBadgeProps {
  role: Role;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const getBadgeConfig = (role: Role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Super Admin", variant: "warning" as const };
      case "ADMIN":
        return { label: "Admin", variant: "info" as const };
      case "WAREHOUSE_MANAGER":
        return { label: "Warehouse Manager", variant: "warning" as const };
      case "PROCUREMENT":
        return { label: "Procurement", variant: "info" as const };
      case "FINANCE":
        return { label: "Finance", variant: "success" as const };
      case "STAFF":
      default:
        return { label: "Staff", variant: "neutral" as const };
    }
  };

  const config = getBadgeConfig(role);

  return <StatusBadge label={config.label} variant={config.variant} />;
}
