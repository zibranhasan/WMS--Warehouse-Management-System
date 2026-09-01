import { Aisle } from "@/features/aisle/aisle.types";
import { LocationStatus } from "@/features/aisle/aisle.types";

export type { LocationStatus };

export interface Shelf {
  id: string;
  aisleId: string;
  code: string;
  name: string;
  description?: string | null;
  capacity: number;
  status: LocationStatus;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  aisle?: Aisle;
}

export interface CreateShelfPayload {
  aisleId: string;
  code: string;
  name: string;
  description?: string;
  capacity?: number;
}

export interface UpdateShelfPayload {
  aisleId?: string;
  code?: string;
  name?: string;
  description?: string;
  capacity?: number;
}

export interface UpdateShelfStatusPayload {
  status: LocationStatus;
}

export interface ShelfQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: LocationStatus;
  aisleId?: string;
  zoneId?: string;
  warehouseId?: string;
  code?: string;
  name?: string;
  id?: string;
  [key: string]: string | number | undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShelfListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Shelf[];
}
