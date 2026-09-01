import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateShelfPayload,
  LocationStatus,
  UpdateShelfPayload,
  Shelf,
  ShelfListResponse,
  ShelfQueryParams,
} from "./shelf.types";

export const shelfApi = {
  getShelves: async (params?: ShelfQueryParams): Promise<ShelfListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<ShelfListResponse>("shelves", {
      params: cleanParams,
    });
  },

  getShelfById: async (id: string): Promise<ApiResponse<Shelf>> => {
    return apiClient.get<ApiResponse<Shelf>>(`shelves/${id}`);
  },

  getShelfBins: async (id: string): Promise<ApiResponse<unknown[]>> => {
    return apiClient.get<ApiResponse<unknown[]>>(`shelves/${id}/bins`);
  },

  createShelf: async (payload: CreateShelfPayload): Promise<ApiResponse<Shelf>> => {
    return apiClient.post<ApiResponse<Shelf>>("shelves", payload);
  },

  updateShelf: async (
    id: string,
    payload: UpdateShelfPayload
  ): Promise<ApiResponse<Shelf>> => {
    return apiClient.patch<ApiResponse<Shelf>>(`shelves/${id}`, payload);
  },

  updateShelfStatus: async (
    id: string,
    status: LocationStatus
  ): Promise<ApiResponse<Shelf>> => {
    return apiClient.patch<ApiResponse<Shelf>>(`shelves/${id}/status`, {
      status,
    });
  },

  deleteShelf: async (id: string): Promise<ApiResponse<Shelf>> => {
    return apiClient.delete<ApiResponse<Shelf>>(`shelves/${id}`);
  },
};
