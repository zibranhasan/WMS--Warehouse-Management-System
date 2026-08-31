import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  AssignRolePayload,
  AssignWarehousePayload,
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserListResponse,
  UserQueryParams,
} from "./user.types";

export const userApi = {
  getUsers: async (params?: UserQueryParams): Promise<UserListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<UserListResponse>("users", {
      params: cleanParams,
    });
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    return apiClient.get<ApiResponse<User>>(`users/${id}`);
  },

  createUser: async (
    payload: CreateUserPayload | FormData
  ): Promise<ApiResponse<User>> => {
    let body: FormData | CreateUserPayload = payload;

    if (!(payload instanceof FormData)) {
      if (payload.image instanceof File) {
        const formData = new FormData();
        formData.append("name", payload.name);
        formData.append("email", payload.email);
        formData.append("role", payload.role);
        formData.append("image", payload.image);
        body = formData;
      }
    }

    return apiClient.post<ApiResponse<User>>("users", body);
  },


  updateUser: async (
    id: string,
    payload: UpdateUserPayload | FormData
  ): Promise<ApiResponse<User>> => {
    let body: FormData | UpdateUserPayload = payload;

    if (!(payload instanceof FormData)) {
      if (payload.image instanceof File) {
        const formData = new FormData();
        if (payload.name) formData.append("name", payload.name);
        if (payload.role) formData.append("role", payload.role);
        if (payload.status) formData.append("status", payload.status);
        formData.append("image", payload.image);
        body = formData;
      }
    }

    return apiClient.patch<ApiResponse<User>>(`users/${id}`, body);
  },

  blockUser: async (id: string): Promise<ApiResponse<User>> => {
    return apiClient.patch<ApiResponse<User>>(`users/${id}/block`);
  },

  unblockUser: async (id: string): Promise<ApiResponse<User>> => {
    return apiClient.patch<ApiResponse<User>>(`users/${id}/unblock`);
  },

  assignRole: async (
    id: string,
    payload: AssignRolePayload
  ): Promise<ApiResponse<User>> => {
    return apiClient.patch<ApiResponse<User>>(`users/${id}/role`, payload);
  },

  assignWarehouse: async (
    id: string,
    payload: AssignWarehousePayload
  ): Promise<
    ApiResponse<{ user: User; warehouseId: string; message: string }>
  > => {
    return apiClient.patch<
      ApiResponse<{ user: User; warehouseId: string; message: string }>
    >(`users/${id}/warehouse`, payload);
  },

  deleteUser: async (id: string): Promise<ApiResponse<User>> => {
    return apiClient.delete<ApiResponse<User>>(`users/${id}`);
  },
};
