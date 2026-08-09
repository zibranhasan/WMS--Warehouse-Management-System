import { z } from "zod";

const forgetPasswordValidationSchema = z.object({
    email: z
        .string({
            message: "Email is required.",
        })
        .email("Invalid email address format."),
});

const resetPasswordValidationSchema = z.object({
    email: z
        .string({
            message: "Email is required.",
        })
        .email("Invalid email address format."),
    otp: z
        .string({
            message: "OTP is required.",
        })
        .length(6, "OTP must be exactly 6 digits.")
        .regex(/^\d+$/, "OTP must contain only numeric digits."),
    newPassword: z
        .string({
            message: "New password is required.",
        })
        .min(8, "New password must be at least 8 characters."),
});

const changePasswordValidationSchema = z
    .object({
        currentPassword: z
            .string({
                message: "Current password is required.",
            })
            .min(1, "Current password is required."),
        newPassword: z
            .string({
                message: "New password is required.",
            })
            .min(8, "New password must be at least 8 characters."),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from current password.",
        path: ["newPassword"],
    });

const sendVerificationOTP = z.object({
    email: z
        .string({
            message: "Email is required.",
        })
        .email("Invalid email address format."),
});

const verifyEmail = z.object({
    email: z
        .string({
            message: "Email is required.",
        })
        .email("Invalid email address format."),
    otp: z
        .string({
            message: "OTP is required.",
        })
        .length(6, "OTP must be exactly 6 digits.")
        .regex(/^\d+$/, "OTP must contain only numeric digits."),
});

export const AuthValidation = {
    forgetPasswordValidationSchema,
    resetPasswordValidationSchema,
    changePasswordValidationSchema,
    sendVerificationOTP,
    verifyEmail,
};

