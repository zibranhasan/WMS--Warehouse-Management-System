import { z } from "zod";
import { LocationStatus } from "./aisle.types";

export const LOCATION_STATUS_OPTIONS: { label: string; value: LocationStatus }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Full", value: "FULL" },
];

export const createAisleSchema = z.object({
  zoneId: z.string().trim().min(1, "Zone ID is required."),
  code: z.string().trim().min(1, "Aisle code is required."),
  name: z.string().trim().min(1, "Aisle name is required."),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0."),
});

export const updateAisleSchema = z.object({
  zoneId: z.string().trim().min(1, "Zone ID cannot be empty.").optional(),
  code: z.string().trim().min(1, "Aisle code cannot be empty.").optional(),
  name: z.string().trim().min(1, "Aisle name cannot be empty.").optional(),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0.")
    .optional(),
});

export type CreateAisleFormValues = z.infer<typeof createAisleSchema>;
export type UpdateAisleFormValues = z.infer<typeof updateAisleSchema>;
