import { z } from "zod";
import { LocationStatus } from "./zone.types";

export const LOCATION_STATUS_OPTIONS: { label: string; value: LocationStatus }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Full", value: "FULL" },
];

export const createZoneSchema = z.object({
  warehouseId: z.string().trim().min(1, "Warehouse ID is required."),
  code: z.string().trim().min(1, "Zone code is required."),
  name: z.string().trim().min(1, "Zone name is required."),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0."),
});

export const updateZoneSchema = z.object({
  warehouseId: z.string().trim().min(1, "Warehouse ID cannot be empty.").optional(),
  code: z.string().trim().min(1, "Zone code cannot be empty.").optional(),
  name: z.string().trim().min(1, "Zone name cannot be empty.").optional(),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0.")
    .optional(),
});

export type CreateZoneFormValues = z.infer<typeof createZoneSchema>;
export type UpdateZoneFormValues = z.infer<typeof updateZoneSchema>;
