import http from "node:http";
import app from "./app";
import { envVars } from "./app/config/env";
import { initializeSocketServer } from "./app/socket";

const bootstrap = () => {
    try {
        const server = http.createServer(app);

        // Initialize Socket.IO server infrastructure
        initializeSocketServer(server);

        const PORT = envVars.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};
bootstrap();

