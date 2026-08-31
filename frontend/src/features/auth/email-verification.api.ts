import { apiClient } from "@/lib/api/api-client";
import {
  EmailVerificationResponse,
  SendVerificationOtpPayload,
  VerifyEmailPayload,
} from "./email-verification.types";

export const emailVerificationApi = {
  sendVerificationOtp: (
    payload: SendVerificationOtpPayload
  ): Promise<EmailVerificationResponse> => {
    return apiClient.post<EmailVerificationResponse>(
      "auth/send-verification-otp",
      payload
    );
  },

  verifyEmail: (
    payload: VerifyEmailPayload
  ): Promise<EmailVerificationResponse> => {
    return apiClient.post<EmailVerificationResponse>(
      "auth/verify-email",
      payload
    );
  },
};
