import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CancelSalesOrderPayload,
  CreateSalesOrderPayload,
  PaginatedResponse,
  SalesOrder,
  SalesOrderQueryParams,
} from "./sales-order.types";

export const salesOrderApi = {
  // 1. Create Sales Order
  createSalesOrder: async (
    payload: CreateSalesOrderPayload
  ): Promise<ApiResponse<SalesOrder>> => {
    return apiClient.post<ApiResponse<SalesOrder>>("sales-orders", payload);
  },

  // 2. List Sales Orders (paginated, searchable, filterable, sortable)
  getSalesOrders: async (
    params?: SalesOrderQueryParams
  ): Promise<PaginatedResponse<SalesOrder>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<SalesOrder>>("sales-orders", {
      params: cleanParams,
    });
  },

  // 3. Get Sales Order by ID
  getSalesOrderById: async (
    id: string
  ): Promise<ApiResponse<SalesOrder>> => {
    return apiClient.get<ApiResponse<SalesOrder>>(`sales-orders/${id}`);
  },

  // 4. Cancel Sales Order
  cancelSalesOrder: async (
    id: string,
    payload: CancelSalesOrderPayload
  ): Promise<ApiResponse<SalesOrder>> => {
    return apiClient.patch<ApiResponse<SalesOrder>>(
      `sales-orders/${id}/cancel`,
      payload
    );
  },
};
