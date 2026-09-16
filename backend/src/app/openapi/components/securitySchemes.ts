export const securitySchemes = {
    cookieAuth: {
        type: "apiKey" as const,
        in: "cookie" as const,
        name: "better-auth.session_token",
        description:
            "Better Auth session cookie. Obtained via POST /api/v1/auth/login.",
    },
};
