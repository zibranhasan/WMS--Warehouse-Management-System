export interface SendVerificationOtpPayload {
  email: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface EmailVerificationResponse {
  httpStatusCode?: number;
  success: boolean;
  message: string;
}
