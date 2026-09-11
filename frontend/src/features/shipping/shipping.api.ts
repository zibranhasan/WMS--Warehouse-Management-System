import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateShipmentPayload,
  PaginatedResponse,
  Shipment,
  ShippingQueryParams,
  UpdateShipmentPayload,
  UpdateShipmentStatusPayload,
} from "./shipping.types";

export const shippingApi = {
  // 1. Create Shipment
  createShipment: async (
    payload: CreateShipmentPayload
  ): Promise<ApiResponse<Shipment>> => {
    return apiClient.post<ApiResponse<Shipment>>("shipping", payload);
  },

  // 2. List Shipments (paginated, searchable, filterable, sortable)
  getShipments: async (
    params?: ShippingQueryParams
  ): Promise<PaginatedResponse<Shipment>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<Shipment>>("shipping", {
      params: cleanParams,
    });
  },

  // 3. Get Shipment by ID
  getShipment: async (id: string): Promise<ApiResponse<Shipment>> => {
    return apiClient.get<ApiResponse<Shipment>>(`shipping/${id}`);
  },

  // 4. Get Shipment by Sales Order
  getShipmentBySalesOrder: async (
    salesOrderId: string
  ): Promise<ApiResponse<Shipment>> => {
    return apiClient.get<ApiResponse<Shipment>>(
      `shipping/sales-order/${salesOrderId}`
    );
  },

  // 5. Update Shipment Information
  updateShipment: async (
    id: string,
    payload: UpdateShipmentPayload
  ): Promise<ApiResponse<Shipment>> => {
    return apiClient.patch<ApiResponse<Shipment>>(`shipping/${id}`, payload);
  },

  // 6. Update Shipment Status
  updateShipmentStatus: async (
    id: string,
    payload: UpdateShipmentStatusPayload
  ): Promise<ApiResponse<Shipment>> => {
    return apiClient.patch<ApiResponse<Shipment>>(
      `shipping/${id}/status`,
      payload
    );
  },
};
