import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required."),
  slug: z.string().optional(),
  description: z.string().optional(),
});

export type CreateBrandFormValues = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = z.object({
  name: z.string().min(1, "Name must not be empty.").optional(),
  slug: z.string().min(1, "Slug must not be empty.").optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateBrandFormValues = z.infer<typeof updateBrandSchema>;

export const updateBrandStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], {
    message: "Invalid or missing status.",
  }),
});

export type UpdateBrandStatusFormValues = z.infer<
  typeof updateBrandStatusSchema
>;
