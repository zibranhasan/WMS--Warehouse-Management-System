import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  Brand,
  BrandListResponse,
  BrandQueryParams,
  BrandStatus,
  CreateBrandPayload,
  UpdateBrandPayload,
} from "./brand.types";

export const brandApi = {
  getBrands: async (
    params?: BrandQueryParams
  ): Promise<BrandListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<BrandListResponse>("brands", {
      params: cleanParams,
    });
  },

  getBrandById: async (id: string): Promise<ApiResponse<Brand>> => {
    return apiClient.get<ApiResponse<Brand>>(`brands/${id}`);
  },

  createBrand: async (
    payload: CreateBrandPayload
  ): Promise<ApiResponse<Brand>> => {
    return apiClient.post<ApiResponse<Brand>>("brands", payload);
  },

  updateBrand: async (
    id: string,
    payload: UpdateBrandPayload
  ): Promise<ApiResponse<Brand>> => {
    return apiClient.patch<ApiResponse<Brand>>(`brands/${id}`, payload);
  },

  updateBrandStatus: async (
    id: string,
    status: BrandStatus
  ): Promise<ApiResponse<Brand>> => {
    return apiClient.patch<ApiResponse<Brand>>(`brands/${id}/status`, {
      status,
    });
  },

  deleteBrand: async (id: string): Promise<ApiResponse<Brand>> => {
    return apiClient.delete<ApiResponse<Brand>>(`brands/${id}`);
  },
};
