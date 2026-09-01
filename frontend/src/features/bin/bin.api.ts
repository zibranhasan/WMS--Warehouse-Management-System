import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateBinPayload,
  LocationStatus,
  UpdateBinPayload,
  Bin,
  BinListResponse,
  BinQueryParams,
} from "./bin.types";

export const binApi = {
  getBins: async (params?: BinQueryParams): Promise<BinListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<BinListResponse>("bins", {
      params: cleanParams,
    });
  },

  getBinById: async (id: string): Promise<ApiResponse<Bin>> => {
    return apiClient.get<ApiResponse<Bin>>(`bins/${id}`);
  },

  createBin: async (payload: CreateBinPayload): Promise<ApiResponse<Bin>> => {
    return apiClient.post<ApiResponse<Bin>>("bins", payload);
  },

  updateBin: async (
    id: string,
    payload: UpdateBinPayload
  ): Promise<ApiResponse<Bin>> => {
    return apiClient.patch<ApiResponse<Bin>>(`bins/${id}`, payload);
  },

  updateBinStatus: async (
    id: string,
    status: LocationStatus
  ): Promise<ApiResponse<Bin>> => {
    return apiClient.patch<ApiResponse<Bin>>(`bins/${id}/status`, {
      status,
    });
  },

  deleteBin: async (id: string): Promise<ApiResponse<Bin>> => {
    return apiClient.delete<ApiResponse<Bin>>(`bins/${id}`);
  },
};
