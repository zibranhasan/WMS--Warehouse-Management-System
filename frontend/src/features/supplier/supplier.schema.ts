import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required."),
  code: z.string().min(1, "Code is required."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contactPerson: z.string().optional(),
});

export type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").optional(),
  code: z.string().min(1, "Code cannot be empty.").optional(),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  contactPerson: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateSupplierFormValues = z.infer<typeof updateSupplierSchema>;
