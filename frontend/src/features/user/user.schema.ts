import { z } from "zod";

export const ROLE_VALUES = [
  "SUPER_ADMIN",
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "PROCUREMENT",
  "STAFF",
  "FINANCE",
] as const;

export const USER_STATUS_VALUES = ["ACTIVE", "BLOCKED", "DELETED"] as const;

export const createUserSchema = z.object({
  name: z
    .string({ message: "Name is required." })
    .trim()
    .min(2, "Name must be at least 2 characters."),
  email: z
    .string({ message: "Email is required." })
    .trim()
    .email("Invalid email address format."),
  role: z.enum(ROLE_VALUES, {
    message: "Invalid or missing role.",
  }),
});


export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").optional(),
  role: z.enum(ROLE_VALUES).optional(),
  status: z.enum(USER_STATUS_VALUES).optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const assignRoleSchema = z.object({
  role: z.enum(ROLE_VALUES, {
    message: "Invalid or missing role.",
  }),
});

export type AssignRoleFormValues = z.infer<typeof assignRoleSchema>;

export const assignWarehouseSchema = z.object({
  warehouseId: z
    .string({ message: "Warehouse ID is required." })
    .trim()
    .min(1, "Warehouse ID cannot be empty."),
});

export type AssignWarehouseFormValues = z.infer<typeof assignWarehouseSchema>;
