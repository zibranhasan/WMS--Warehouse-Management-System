import { apiClient } from "@/lib/api/api-client";
import { DashboardMetrics } from "./dashboard.types";

interface CountMetaResponse {
  meta?: {
    total?: number;
  };
}

async function fetchTotalCount(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<number | undefined> {
  try {
    const response = await apiClient.get<CountMetaResponse>(endpoint, {
      params: { limit: 1, ...params },
    });
    return response?.meta?.total;
  } catch {
    return undefined;
  }
}

export const dashboardApi = {
  getMetricsForRole: async (role?: string): Promise<DashboardMetrics> => {
    if (!role) return {};

    const metrics: DashboardMetrics = {};

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      const [
        totalCategories,
        totalProducts,
        totalWarehouses,
        pendingPurchaseOrders,
        totalUsers,
      ] = await Promise.all([
        fetchTotalCount("categories"),
        fetchTotalCount("products"),
        fetchTotalCount("warehouses"),
        fetchTotalCount("purchase-orders", { status: "PENDING" }),
        fetchTotalCount("users"),
      ]);

      metrics.totalCategories = totalCategories;
      metrics.totalProducts = totalProducts;
      metrics.totalWarehouses = totalWarehouses;
      metrics.pendingPurchaseOrders = pendingPurchaseOrders;
      metrics.totalUsers = totalUsers;
    } else if (role === "WAREHOUSE_MANAGER") {
      const [
        totalWarehouses,
        pendingPickingTasks,
        pendingPackingTasks,
        totalShipments,
      ] = await Promise.all([
        fetchTotalCount("warehouses"),
        fetchTotalCount("picking", { status: "PENDING" }),
        fetchTotalCount("packing", { status: "PENDING" }),
        fetchTotalCount("shipping"),
      ]);

      metrics.totalWarehouses = totalWarehouses;
      metrics.pendingPickingTasks = pendingPickingTasks;
      metrics.pendingPackingTasks = pendingPackingTasks;
      metrics.totalShipments = totalShipments;
    } else if (role === "PROCUREMENT") {
      const [pendingPurchaseOrders, totalPurchaseOrders, totalSuppliers] =
        await Promise.all([
          fetchTotalCount("purchase-orders", { status: "PENDING" }),
          fetchTotalCount("purchase-orders"),
          fetchTotalCount("suppliers"),
        ]);

      metrics.pendingPurchaseOrders = pendingPurchaseOrders;
      metrics.totalPurchaseOrders = totalPurchaseOrders;
      metrics.totalSuppliers = totalSuppliers;
    } else if (role === "FINANCE") {
      const [totalPurchaseOrders, totalSalesOrders, totalSuppliers] =
        await Promise.all([
          fetchTotalCount("purchase-orders"),
          fetchTotalCount("sales-orders"),
          fetchTotalCount("suppliers"),
        ]);

      metrics.totalPurchaseOrders = totalPurchaseOrders;
      metrics.totalSalesOrders = totalSalesOrders;
      metrics.totalSuppliers = totalSuppliers;
    } else if (role === "STAFF") {
      const [pendingPickingTasks, pendingPackingTasks, totalShipments] =
        await Promise.all([
          fetchTotalCount("picking", { status: "PENDING" }),
          fetchTotalCount("packing", { status: "PENDING" }),
          fetchTotalCount("shipping"),
        ]);

      metrics.pendingPickingTasks = pendingPickingTasks;
      metrics.pendingPackingTasks = pendingPackingTasks;
      metrics.totalShipments = totalShipments;
    }

    return metrics;
  },
};
