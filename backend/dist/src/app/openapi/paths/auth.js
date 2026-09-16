import { z } from "zod";
import { SuccessResponse, ErrorResponse } from "../components/responses";
import { UserProfileResponse } from "../components/schemas";
const LoginRequest = z
    .object({
    email: z.string().email(),
    password: z.string().min(1),
})
    .openapi("LoginRequest");
const LoginResponse = z
    .object({
    user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
        status: z.string(),
        image: z.string().nullable().optional(),
    }),
    session: z.object({
        id: z.string(),
        expiresAt: z.string(),
    }),
})
    .openapi("LoginResponse");
const ForgotPasswordRequest = z
    .object({
    email: z.string().email(),
})
    .openapi("ForgotPasswordRequest");
const ResetPasswordRequest = z
    .object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().min(8),
})
    .openapi("ResetPasswordRequest");
const ChangePasswordRequest = z
    .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
})
    .openapi("ChangePasswordRequest");
const SendVerificationOtpRequest = z
    .object({
    email: z.string().email(),
})
    .openapi("SendVerificationOtpRequest");
const VerifyEmailRequest = z
    .object({
    email: z.string().email(),
    otp: z.string().length(6),
})
    .openapi("VerifyEmailRequest");
const UpdateProfileRequest = z
    .object({
    name: z.string().min(2).optional(),
})
    .openapi("UpdateProfileRequest");
const MessageResponse = z
    .object({
    success: z.literal(true),
    message: z.string(),
})
    .openapi("MessageResponse");
export function registerAuthPaths(registry) {
    registry.registerComponent("schemas", "LoginRequest", LoginRequest);
    registry.registerComponent("schemas", "LoginResponse", LoginResponse);
    registry.registerComponent("schemas", "ForgotPasswordRequest", ForgotPasswordRequest);
    registry.registerComponent("schemas", "ResetPasswordRequest", ResetPasswordRequest);
    registry.registerComponent("schemas", "ChangePasswordRequest", ChangePasswordRequest);
    registry.registerComponent("schemas", "SendVerificationOtpRequest", SendVerificationOtpRequest);
    registry.registerComponent("schemas", "VerifyEmailRequest", VerifyEmailRequest);
    registry.registerComponent("schemas", "UpdateProfileRequest", UpdateProfileRequest);
    registry.registerComponent("schemas", "MessageResponse", MessageResponse);
    // POST /api/v1/auth/login
    registry.registerPath({
        method: "post",
        path: "/api/v1/auth/login",
        operationId: "login",
        tags: ["Auth"],
        summary: "Log in",
        description: "Authenticates a user with email and password. Returns a session cookie.",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: LoginRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "User logged in successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(LoginResponse),
                    },
                },
            },
            400: {
                description: "Invalid credentials",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
    // POST /api/v1/auth/logout
    registry.registerPath({
        method: "post",
        path: "/api/v1/auth/logout",
        operationId: "logout",
        tags: ["Auth"],
        summary: "Log out",
        description: "Ends the current session and clears the session cookie.",
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: "User logged out successfully",
                content: {
                    "application/json": {
                        schema: MessageResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized — invalid or missing session cookie",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
    // GET /api/v1/auth/me
    registry.registerPath({
        method: "get",
        path: "/api/v1/auth/me",
        operationId: "getProfile",
        tags: ["Auth"],
        summary: "Get current user profile",
        description: "Returns the authenticated user's profile and current session information.",
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: "User profile fetched successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserProfileResponse),
                    },
                },
            },
            401: {
                description: "Unauthorized — invalid or missing session cookie",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
    // PATCH /api/v1/auth/me
    registry.registerPath({
        method: "patch",
        path: "/api/v1/auth/me",
        operationId: "updateProfile",
        tags: ["Auth"],
        summary: "Update current user profile",
        description: "Updates the authenticated user's profile. Accepts multipart/form-data with optional image file.",
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: {
                                name: { type: "string", minLength: 2, description: "User display name" },
                                image: { type: "string", format: "binary", description: "Profile image (optional)" },
                            },
                        },
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Profile updated successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(UserProfileResponse),
                    },
                },
            },
            400: {
                description: "Validation error",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized — invalid or missing session cookie",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
    // POST /api/v1/auth/forget-password
    registry.registerPath({
        method: "post",
        path: "/api/v1/auth/forget-password",
        operationId: "forgotPassword",
        tags: ["Auth"],
        summary: "Request password reset",
        description: "Sends a password reset OTP to the provided email address. Returns a generic message regardless of whether the account exists.",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: ForgotPasswordRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Password reset OTP sent",
                content: {
                    "application/json": {
                        schema: MessageResponse,
                    },
                },
            },
        },
    });
    // POST /api/v1/auth/reset-password
    registry.registerPath({
        method: "post",
        path: "/api/v1/auth/reset-password",
        operationId: "resetPassword",
        tags: ["Auth"],
        summary: "Reset password with OTP",
        description: "Resets the user's password using a valid OTP. Deletes all existing sessions after reset.",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: ResetPasswordRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Password reset successfully",
                content: {
                    "application/json": {
                        schema: MessageResponse,
                    },
                },
            },
            400: {
                description: "Invalid or expired OTP",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
    // POST /api/v1/auth/change-password
    registry.registerPath({
        method: "post",
        path: "/api/v1/auth/change-password",
        operationId: "changePassword",
        tags: ["Auth"],
        summary: "Change password",
        description: "Changes the authenticated user's password. The new password must differ from the current one.",
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: ChangePasswordRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Password changed successfully",
                content: {
                    "application/json": {
                        schema: MessageResponse,
                    },
                },
            },
            400: {
                description: "Validation error (e.g. new password same as current)",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
            401: {
                description: "Unauthorized — invalid or missing session cookie",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
    // POST /api/v1/auth/send-verification-otp
    registry.registerPath({
        method: "post",
        path: "/api/v1/auth/send-verification-otp",
        operationId: "sendVerificationOtp",
        tags: ["Auth"],
        summary: "Send email verification OTP",
        description: "Sends a 6-digit OTP to the provided email for verification.",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: SendVerificationOtpRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Verification OTP sent successfully",
                content: {
                    "application/json": {
                        schema: MessageResponse,
                    },
                },
            },
        },
    });
    // POST /api/v1/auth/verify-email
    registry.registerPath({
        method: "post",
        path: "/api/v1/auth/verify-email",
        operationId: "verifyEmail",
        tags: ["Auth"],
        summary: "Verify email with OTP",
        description: "Verifies the user's email address using the OTP sent to them.",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: VerifyEmailRequest,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Email verified successfully",
                content: {
                    "application/json": {
                        schema: MessageResponse,
                    },
                },
            },
            400: {
                description: "Invalid or expired OTP",
                content: {
                    "application/json": {
                        schema: ErrorResponse,
                    },
                },
            },
        },
    });
}
