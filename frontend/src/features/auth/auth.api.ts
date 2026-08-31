import { apiClient } from "@/lib/api/api-client";
import {
  AuthMessageResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  ResetPasswordPayload,
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

  changePassword: (
    payload: ChangePasswordPayload
  ): Promise<ChangePasswordResponse> => {
    return apiClient.post<ChangePasswordResponse>("auth/change-password", payload);
  },

  forgotPassword: (
    payload: ForgotPasswordPayload
  ): Promise<AuthMessageResponse> => {
    return apiClient.post<AuthMessageResponse>("auth/forget-password", payload);
  },

  resetPassword: (
    payload: ResetPasswordPayload
  ): Promise<AuthMessageResponse> => {
    return apiClient.post<AuthMessageResponse>("auth/reset-password", payload);
  },
};


