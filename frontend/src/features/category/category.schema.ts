import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required."),
  slug: z.string().optional(),
  description: z.string().optional(),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name must not be empty.").optional(),
  slug: z.string().min(1, "Slug must not be empty.").optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;

export const updateCategoryStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], {
    message: "Invalid or missing status.",
  }),
});

export type UpdateCategoryStatusFormValues = z.infer<
  typeof updateCategoryStatusSchema
>;
