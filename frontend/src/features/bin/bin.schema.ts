import { z } from "zod";
import { LocationStatus } from "./bin.types";

export const LOCATION_STATUS_OPTIONS: { label: string; value: LocationStatus }[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Full", value: "FULL" },
];

export const createBinSchema = z.object({
  shelfId: z.string().trim().min(1, "Shelf ID is required."),
  code: z.string().trim().min(1, "Bin code is required."),
  name: z.string().trim().min(1, "Bin name is required."),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0."),
});

export const updateBinSchema = z.object({
  shelfId: z.string().trim().min(1, "Shelf ID cannot be empty.").optional(),
  code: z.string().trim().min(1, "Bin code cannot be empty.").optional(),
  name: z.string().trim().min(1, "Bin name cannot be empty.").optional(),
  description: z.string().optional(),
  capacity: z
    .number({ message: "Capacity must be a number." })
    .min(0, "Capacity must be greater than or equal to 0.")
    .optional(),
});

export type CreateBinFormValues = z.infer<typeof createBinSchema>;
export type UpdateBinFormValues = z.infer<typeof updateBinSchema>;
