import { z } from "zod";
import { LocationStatus } from "./shelf.types";

export const LOCATION_STATUS_OPTIONS: { label: string; value: LocationStatus }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Full", value: "FULL" },
];

export const createShelfSchema = z.object({
  aisleId: z.string().trim().min(1, "Aisle ID is required."),
  code: z.string().trim().min(1, "Shelf code is required."),
  name: z.string().trim().min(1, "Shelf name is required."),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0."),
});

export const updateShelfSchema = z.object({
  aisleId: z.string().trim().min(1, "Aisle ID cannot be empty.").optional(),
  code: z.string().trim().min(1, "Shelf code cannot be empty.").optional(),
  name: z.string().trim().min(1, "Shelf name cannot be empty.").optional(),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0.")
    .optional(),
});

export type CreateShelfFormValues = z.infer<typeof createShelfSchema>;
export type UpdateShelfFormValues = z.infer<typeof updateShelfSchema>;
