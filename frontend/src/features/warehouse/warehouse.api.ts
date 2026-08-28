import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  Warehouse,
  WarehouseListResponse,
  WarehouseQueryParams,
  WarehouseStatus,
  WarehouseStructure,
  WarehouseUser,
  WarehouseUserListResponse,
} from "./warehouse.types";

export const warehouseApi = {
  getWarehouses: async (
    params?: WarehouseQueryParams
  ): Promise<WarehouseListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<WarehouseListResponse>("warehouses", {
      params: cleanParams,
    });
  },

  getWarehouseById: async (id: string): Promise<ApiResponse<Warehouse>> => {
    return apiClient.get<ApiResponse<Warehouse>>(`warehouses/${id}`);
  },

  createWarehouse: async (
    payload: CreateWarehousePayload
  ): Promise<ApiResponse<Warehouse>> => {
    return apiClient.post<ApiResponse<Warehouse>>("warehouses", payload);
  },

  updateWarehouse: async (
    id: string,
    payload: UpdateWarehousePayload
  ): Promise<ApiResponse<Warehouse>> => {
    return apiClient.patch<ApiResponse<Warehouse>>(`warehouses/${id}`, payload);
  },

  updateWarehouseStatus: async (
    id: string,
    status: WarehouseStatus
  ): Promise<ApiResponse<Warehouse>> => {
    return apiClient.patch<ApiResponse<Warehouse>>(`warehouses/${id}/status`, {
      status,
    });
  },

  getWarehouseUsers: async (
    warehouseId: string,
    params?: Record<string, unknown>
  ): Promise<WarehouseUserListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value as string | number | boolean;
        }
      });
    }

    return apiClient.get<WarehouseUserListResponse>(
      `warehouses/${warehouseId}/users`,
      { params: cleanParams }
    );
  },

  getWarehouseStructure: async (
    warehouseId: string
  ): Promise<ApiResponse<WarehouseStructure>> => {
    return apiClient.get<ApiResponse<WarehouseStructure>>(
      `warehouses/${warehouseId}/structure`
    );
  },

  assignUser: async (
    warehouseId: string,
    userId: string
  ): Promise<ApiResponse<WarehouseUser>> => {
    return apiClient.patch<ApiResponse<WarehouseUser>>(
      `warehouses/${warehouseId}/assign-user/${userId}`
    );
  },

  unassignUser: async (
    warehouseId: string,
    userId: string
  ): Promise<ApiResponse<WarehouseUser>> => {
    return apiClient.patch<ApiResponse<WarehouseUser>>(
      `warehouses/${warehouseId}/unassign-user/${userId}`
    );
  },
};
