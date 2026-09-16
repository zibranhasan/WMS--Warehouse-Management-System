import { z } from "zod";

export const PaginatedResponse = (dataSchema: z.ZodType) =>
    z.object({
        success: z.literal(true),
        message: z.string(),
        meta: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
        }),
        data: z.array(dataSchema),
    });

export const SuccessResponse = (dataSchema: z.ZodType) =>
    z.object({
        success: z.literal(true),
        message: z.string(),
        data: dataSchema,
    });

export const ErrorResponse = z.object({
    success: z.literal(false),
    message: z.string(),
    errorSources: z.array(
        z.object({
            path: z.string(),
            message: z.string(),
        }),
    ),
});
