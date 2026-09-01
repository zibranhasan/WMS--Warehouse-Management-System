import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateAislePayload,
  LocationStatus,
  UpdateAislePayload,
  Aisle,
  AisleListResponse,
  AisleQueryParams,
} from "./aisle.types";

export const aisleApi = {
  getAisles: async (params?: AisleQueryParams): Promise<AisleListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<AisleListResponse>("aisles", {
      params: cleanParams,
    });
  },

  getAisleById: async (id: string): Promise<ApiResponse<Aisle>> => {
    return apiClient.get<ApiResponse<Aisle>>(`aisles/${id}`);
  },

  createAisle: async (payload: CreateAislePayload): Promise<ApiResponse<Aisle>> => {
    return apiClient.post<ApiResponse<Aisle>>("aisles", payload);
  },

  updateAisle: async (
    id: string,
    payload: UpdateAislePayload
  ): Promise<ApiResponse<Aisle>> => {
    return apiClient.patch<ApiResponse<Aisle>>(`aisles/${id}`, payload);
  },

  updateAisleStatus: async (
    id: string,
    status: LocationStatus
  ): Promise<ApiResponse<Aisle>> => {
    return apiClient.patch<ApiResponse<Aisle>>(`aisles/${id}/status`, {
      status,
    });
  },

  deleteAisle: async (id: string): Promise<ApiResponse<Aisle>> => {
    return apiClient.delete<ApiResponse<Aisle>>(`aisles/${id}`);
  },
};
