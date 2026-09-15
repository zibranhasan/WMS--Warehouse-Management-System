import { envVars } from "../config/env";
export const socketServerOptions = {
    cors: {
        origin: [
            envVars.FRONTEND_URL,
            envVars.BETTER_AUTH_URL,
            "http://localhost:3000",
            "http://localhost:5000",
        ],
        credentials: true,
        methods: ["GET", "POST"],
    },
};
