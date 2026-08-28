import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  Category,
  CategoryListResponse,
  CategoryQueryParams,
  CategoryStatus,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "./category.types";

export const categoryApi = {
  getCategories: async (
    params?: CategoryQueryParams
  ): Promise<CategoryListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<CategoryListResponse>("categories", {
      params: cleanParams,
    });
  },

  getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
    return apiClient.get<ApiResponse<Category>>(`categories/${id}`);
  },

  createCategory: async (
    payload: CreateCategoryPayload
  ): Promise<ApiResponse<Category>> => {
    return apiClient.post<ApiResponse<Category>>("categories", payload);
  },

  updateCategory: async (
    id: string,
    payload: UpdateCategoryPayload
  ): Promise<ApiResponse<Category>> => {
    return apiClient.patch<ApiResponse<Category>>(`categories/${id}`, payload);
  },

  updateCategoryStatus: async (
    id: string,
    status: CategoryStatus
  ): Promise<ApiResponse<Category>> => {
    return apiClient.patch<ApiResponse<Category>>(`categories/${id}/status`, {
      status,
    });
  },

  deleteCategory: async (id: string): Promise<ApiResponse<Category>> => {
    return apiClient.delete<ApiResponse<Category>>(`categories/${id}`);
  },
};
