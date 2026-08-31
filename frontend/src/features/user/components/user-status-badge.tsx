import { UserStatus } from "../user.types";
import { StatusBadge } from "@/components/shared/status-badge";

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const getBadgeConfig = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return { label: "Active", variant: "success" as const };
      case "BLOCKED":
        return { label: "Blocked", variant: "destructive" as const };
      case "DELETED":
      default:
        return { label: "Deleted", variant: "neutral" as const };
    }
  };

  const config = getBadgeConfig(status);

  return <StatusBadge label={config.label} variant={config.variant} />;
}
