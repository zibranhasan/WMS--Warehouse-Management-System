import { z } from "zod";

export const sendVerificationOtpSchema = z.object({
  email: z
    .string({ message: "Email is required." })
    .trim()
    .min(1, "Email is required.")
    .email("Invalid email address format."),
});

export type SendVerificationOtpSchemaType = z.infer<
  typeof sendVerificationOtpSchema
>;

export const verifyEmailSchema = z.object({
  email: z
    .string({ message: "Email is required." })
    .trim()
    .min(1, "Email is required.")
    .email("Invalid email address format."),
  otp: z
    .string({ message: "OTP is required." })
    .trim()
    .length(6, "OTP must be exactly 6 digits.")
    .regex(/^\d+$/, "OTP must contain only numeric digits."),
});

export type VerifyEmailSchemaType = z.infer<typeof verifyEmailSchema>;
