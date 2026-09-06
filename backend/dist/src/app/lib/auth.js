import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { bearer, emailOTP } from "better-auth/plugins";
import { envVars } from "../config/env";
import { sendEmail } from "../utils/email";
// If your Prisma file is located elsewhere, you can change the path
export const auth = betterAuth({
    baseURL: envVars.BETTER_AUTH_URL,
    secret: envVars.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: Role.STAFF,
                input: false,
            },
            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE,
                input: false,
            },
            needPasswordChange: {
                type: "boolean",
                required: true,
                defaultValue: false,
                input: false,
            },
            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false,
                input: false,
            },
            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null,
                input: false,
            },
        },
    },
    plugins: [
        bearer(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                if (type === "email-verification") {
                    const user = await prisma.user.findUnique({
                        where: {
                            email,
                        },
                    });
                    // Super Admin
                    if (!user) {
                        console.error(`User with email ${email} not found. Cannot send verification OTP.`);
                        return;
                    }
                    //Super Admin
                    if (user && user.role === Role.SUPER_ADMIN) {
                        console.log(`User with email ${email} is a super admin. Skipping sending verification OTP.`);
                        return;
                    }
                    if (user && !user.emailVerified) {
                        sendEmail({
                            to: email,
                            subject: "Verify your email",
                            templateName: "otp",
                            templateData: {
                                name: user.name,
                                otp,
                            },
                        });
                    }
                }
                else if (type === "forget-password") {
                    const user = await prisma.user.findUnique({
                        where: {
                            email,
                        },
                    });
                    if (user) {
                        sendEmail({
                            to: email,
                            subject: "Password Reset OTP",
                            templateName: "otp",
                            templateData: {
                                name: user.name,
                                otp,
                            },
                        });
                    }
                }
            },
            expiresIn: 2 * 60, // 2 minutes in seconds
            otpLength: 6,
        }),
    ],
    session: {
        expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
        updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
        },
    },
    redirectURLs: {
        signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
    },
    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:5000"],
    advanced: {
        // disableCSRFCheck: true,
        useSecureCookies: false,
        cookies: {
            state: {
                attributes: {
                    sameSite: "none",
                    secure: true,
                    httpOnly: true,
                    path: "/",
                },
            },
            sessionToken: {
                attributes: {
                    sameSite: "none",
                    secure: true,
                    httpOnly: true,
                    path: "/",
                },
            },
        },
    },
});
