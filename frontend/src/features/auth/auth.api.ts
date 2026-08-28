import { apiClient } from "@/lib/api/api-client";
import {
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  MeResponse,
} from "./auth.types";

export const authApi = {
  login: (payload: LoginPayload): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>("auth/login", payload);
  },

  getCurrentUser: (): Promise<MeResponse> => {
    return apiClient.get<MeResponse>("auth/me");
  },

  logout: (): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>("auth/logout");
  },
};
