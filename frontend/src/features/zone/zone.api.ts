import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateZonePayload,
  LocationStatus,
  UpdateZonePayload,
  Zone,
  ZoneListResponse,
  ZoneQueryParams,
} from "./zone.types";

export const zoneApi = {
  getZones: async (params?: ZoneQueryParams): Promise<ZoneListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<ZoneListResponse>("zones", {
      params: cleanParams,
    });
  },

  getZoneById: async (id: string): Promise<ApiResponse<Zone>> => {
    return apiClient.get<ApiResponse<Zone>>(`zones/${id}`);
  },

  createZone: async (payload: CreateZonePayload): Promise<ApiResponse<Zone>> => {
    return apiClient.post<ApiResponse<Zone>>("zones", payload);
  },

  updateZone: async (
    id: string,
    payload: UpdateZonePayload
  ): Promise<ApiResponse<Zone>> => {
    return apiClient.patch<ApiResponse<Zone>>(`zones/${id}`, payload);
  },

  updateZoneStatus: async (
    id: string,
    status: LocationStatus
  ): Promise<ApiResponse<Zone>> => {
    return apiClient.patch<ApiResponse<Zone>>(`zones/${id}/status`, {
      status,
    });
  },

  deleteZone: async (id: string): Promise<ApiResponse<Zone>> => {
    return apiClient.delete<ApiResponse<Zone>>(`zones/${id}`);
  },
};
