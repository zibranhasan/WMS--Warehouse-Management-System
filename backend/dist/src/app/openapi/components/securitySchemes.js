export const securitySchemes = {
    cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Better Auth session cookie. Obtained via POST /api/v1/auth/login.",
    },
};
