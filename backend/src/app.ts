import express, { Application } from "express";


import { IndexRoutes } from "./app/routes/index.js";


import { notFound } from "./app/middleware/notFound.js";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth.js";
import path from "node:path";
import cors from "cors";
import qs from "qs";

import { envVars } from "./app/config/env.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";


const app: Application = express();
app.set("query parser", (str: string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

//payment
// app.post(
//     "/webhook",
//     express.raw({ type: "application/json" }),
//     PaymentController.handleStripeWebhookEvent,
// );

app.use(
    cors({
        origin: [
            envVars.FRONTEND_URL,
            envVars.BETTER_AUTH_URL,
            "http://localhost:3000",
            "http://localhost:5000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use("/api/auth", toNodeHandler(auth));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

//payment
// cron.schedule("*/25 * * * *", async () => {
//     try {
//         console.log("Running cron job to cancel unpaid appointments...");
//         await AppointmentService.cancelUnpaidAppointments();
//     } catch (error: any) {
//         console.error(
//             "Error occurred while canceling unpaid appointments:",
//             error.message,
//         );
//     }
// });

app.use("/api/v1", IndexRoutes);

// OpenAPI spec serving (proof of concept)
app.get("/api/v1/docs/openapi.json", (_req, res) => {
    import("./app/openapi/index.js").then(({ generateOpenApiDocument }) => {
        const spec = generateOpenApiDocument();
        res.json(spec);
    });
});

// Health check endpoint for uptime monitoring
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

// // Basic route
// app.get("/", async (req: Request, res: Response) => {
//     const specialty = await prisma.specialty.create({
//         data: {
//             title: "Cardiology",
//         },
//     });
//     res.status(201).json({
//         success: true,
//         message: "API is working",
//         data: specialty,
//     });
// });

app.use(globalErrorHandler);
app.use(notFound);

export default app;