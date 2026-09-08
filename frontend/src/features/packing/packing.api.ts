import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  AddPackageItemsPayload,
  ApiResponse,
  AssignPackerPayload,
  CancelPackingTaskPayload,
  CreatePackagePayload,
  CreatePackingTaskPayload,
  PaginatedResponse,
  PackingTask,
  PackingTaskQueryParams,
  Package,
} from "./packing.types";

export const packingApi = {
  // 1. Create Packing Task
  createPackingTask: async (
    payload: CreatePackingTaskPayload
  ): Promise<ApiResponse<PackingTask>> => {
    return apiClient.post<ApiResponse<PackingTask>>("packing", payload);
  },

  // 2. List Packing Tasks (paginated, searchable, filterable, sortable)
  getPackingTasks: async (
    params?: PackingTaskQueryParams
  ): Promise<PaginatedResponse<PackingTask>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<PackingTask>>("packing", {
      params: cleanParams,
    });
  },

  // 3. Get Packing Task by ID
  getPackingTaskById: async (id: string): Promise<ApiResponse<PackingTask>> => {
    return apiClient.get<ApiResponse<PackingTask>>(`packing/${id}`);
  },

  // 4. Get Packing Task by Sales Order
  getPackingTaskBySalesOrder: async (
    salesOrderId: string
  ): Promise<ApiResponse<PackingTask>> => {
    return apiClient.get<ApiResponse<PackingTask>>(
      `packing/sales-order/${salesOrderId}`
    );
  },

  // 5. Assign Packer
  assignPacker: async (
    id: string,
    payload: AssignPackerPayload
  ): Promise<ApiResponse<PackingTask>> => {
    return apiClient.patch<ApiResponse<PackingTask>>(
      `packing/${id}/assign`,
      payload
    );
  },

  // 6. Start Packing
  startPacking: async (id: string): Promise<ApiResponse<PackingTask>> => {
    return apiClient.patch<ApiResponse<PackingTask>>(`packing/${id}/start`);
  },

  // 7. Cancel Packing Task
  cancelPackingTask: async (
    id: string,
    payload: CancelPackingTaskPayload
  ): Promise<ApiResponse<PackingTask>> => {
    return apiClient.patch<ApiResponse<PackingTask>>(
      `packing/${id}/cancel`,
      payload
    );
  },

  // 8. Create Package
  createPackage: async (
    id: string,
    payload: CreatePackagePayload
  ): Promise<ApiResponse<Package>> => {
    return apiClient.post<ApiResponse<Package>>(
      `packing/${id}/packages`,
      payload
    );
  },

  // 9. Get Packages for Packing Task
  getPackages: async (id: string): Promise<ApiResponse<Package[]>> => {
    return apiClient.get<ApiResponse<Package[]>>(`packing/${id}/packages`);
  },

  // 10. Add Items to Package
  addPackageItems: async (
    id: string,
    packageId: string,
    payload: AddPackageItemsPayload
  ): Promise<ApiResponse<PackingTask>> => {
    return apiClient.post<ApiResponse<PackingTask>>(
      `packing/${id}/packages/${packageId}/items`,
      payload
    );
  },

  // 11. Close Package
  closePackage: async (
    id: string,
    packageId: string
  ): Promise<ApiResponse<Package>> => {
    return apiClient.patch<ApiResponse<Package>>(
      `packing/${id}/packages/${packageId}/close`
    );
  },
};
