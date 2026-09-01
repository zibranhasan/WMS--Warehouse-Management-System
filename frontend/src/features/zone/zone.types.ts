import { Warehouse } from "@/features/warehouse/warehouse.types";

export type LocationStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FULL";

export interface Zone {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  description?: string | null;
  capacity: number;
  status: LocationStatus;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse?: Warehouse;
}

export interface CreateZonePayload {
  warehouseId: string;
  code: string;
  name: string;
  description?: string;
  capacity?: number;
}

export interface UpdateZonePayload {
  warehouseId?: string;
  code?: string;
  name?: string;
  description?: string;
  capacity?: number;
}

export interface UpdateZoneStatusPayload {
  status: LocationStatus;
}

export interface ZoneQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: LocationStatus;
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

export interface ZoneListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Zone[];
}
