import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./dashboard.api";

export function useDashboardMetrics(role?: string) {
  return useQuery({
    queryKey: ["dashboard", "metrics", role],
    queryFn: () => dashboardApi.getMetricsForRole(role),
    enabled: Boolean(role),
    staleTime: 30000,
  });
}
