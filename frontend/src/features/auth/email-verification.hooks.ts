import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emailVerificationApi } from "./email-verification.api";
import {
  SendVerificationOtpPayload,
  VerifyEmailPayload,
} from "./email-verification.types";
import { authKeys } from "./auth.hooks";

export function useSendVerificationOtp() {
  return useMutation({
    mutationFn: (payload: SendVerificationOtpPayload) =>
      emailVerificationApi.sendVerificationOtp(payload),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) =>
      emailVerificationApi.verifyEmail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}
