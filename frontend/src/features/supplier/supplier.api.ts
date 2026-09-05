import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateSupplierPayload,
  PaginatedResponse,
  Supplier,
  SupplierQueryParams,
  SupplierStatus,
  UpdateSupplierPayload,
  UpdateSupplierStatusPayload,
} from "./supplier.types";

export const supplierApi = {
  getSuppliers: async (
    params?: SupplierQueryParams
  ): Promise<PaginatedResponse<Supplier>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<Supplier>>("suppliers", {
      params: cleanParams,
    });
  },

  getSupplierById: async (id: string): Promise<ApiResponse<Supplier>> => {
    return apiClient.get<ApiResponse<Supplier>>(`suppliers/${id}`);
  },

  createSupplier: async (
    payload: CreateSupplierPayload
  ): Promise<ApiResponse<Supplier>> => {
    return apiClient.post<ApiResponse<Supplier>>("suppliers", payload);
  },

  updateSupplier: async (
    id: string,
    payload: UpdateSupplierPayload
  ): Promise<ApiResponse<Supplier>> => {
    return apiClient.patch<ApiResponse<Supplier>>(`suppliers/${id}`, payload);
  },

  updateSupplierStatus: async (
    id: string,
    statusOrPayload: UpdateSupplierStatusPayload | SupplierStatus
  ): Promise<ApiResponse<Supplier>> => {
    const payload =
      typeof statusOrPayload === "string"
        ? { status: statusOrPayload }
        : statusOrPayload;
    return apiClient.patch<ApiResponse<Supplier>>(
      `suppliers/${id}/status`,
      payload
    );
  },

  deleteSupplier: async (id: string): Promise<ApiResponse<Supplier>> => {
    return apiClient.delete<ApiResponse<Supplier>>(`suppliers/${id}`);
  },
};

