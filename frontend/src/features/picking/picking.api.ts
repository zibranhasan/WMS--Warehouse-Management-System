import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  AssignPickerPayload,
  CreatePickingPayload,
  PaginatedResponse,
  PickItemsPayload,
  PickingQueryParams,
  PickingTask,
  PickingTaskDetail,
} from "./picking.types";

export const pickingApi = {
  // 1. Create Picking Task
  createPickingTask: async (
    payload: CreatePickingPayload
  ): Promise<ApiResponse<PickingTask>> => {
    return apiClient.post<ApiResponse<PickingTask>>("picking", payload);
  },

  // 2. List Picking Tasks (paginated, searchable, filterable, sortable)
  getPickingTasks: async (
    params?: PickingQueryParams
  ): Promise<PaginatedResponse<PickingTask>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<PickingTask>>("picking", {
      params: cleanParams,
    });
  },

  // 3. Get Picking Task by ID
  getPickingTaskById: async (
    id: string
  ): Promise<ApiResponse<PickingTaskDetail>> => {
    return apiClient.get<ApiResponse<PickingTaskDetail>>(`picking/${id}`);
  },

  // 4. Get Picking Task by Sales Order
  getPickingTaskBySalesOrder: async (
    salesOrderId: string
  ): Promise<ApiResponse<PickingTaskDetail>> => {
    return apiClient.get<ApiResponse<PickingTaskDetail>>(
      `picking/sales-order/${salesOrderId}`
    );
  },

  // 5. Assign Picker
  assignPicker: async (
    id: string,
    payload: AssignPickerPayload
  ): Promise<ApiResponse<PickingTask>> => {
    return apiClient.patch<ApiResponse<PickingTask>>(
      `picking/${id}/assign`,
      payload
    );
  },

  // 6. Start Picking
  startPicking: async (id: string): Promise<ApiResponse<PickingTask>> => {
    return apiClient.patch<ApiResponse<PickingTask>>(`picking/${id}/start`);
  },

  // 7. Pick Items from Bin
  pickItems: async (
    id: string,
    payload: PickItemsPayload
  ): Promise<ApiResponse<PickingTask>> => {
    return apiClient.post<ApiResponse<PickingTask>>(
      `picking/${id}/pick`,
      payload
    );
  },
};
