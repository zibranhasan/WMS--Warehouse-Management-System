import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authApi } from "./auth.api";
import {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
} from "./auth.types";

export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "me"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: authApi.getCurrentUser,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.currentUser() });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authApi.changePassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) =>
      authApi.forgotPassword(payload),
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      authApi.resetPassword(payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.currentUser() });
    },
  });
}


