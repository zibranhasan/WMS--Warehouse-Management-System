import { Zone } from "@/features/zone/zone.types";

export type LocationStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FULL";

export interface Aisle {
  id: string;
  zoneId: string;
  code: string;
  name: string;
  description?: string | null;
  capacity: number;
  status: LocationStatus;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  zone?: Zone;
}

export interface CreateAislePayload {
  zoneId: string;
  code: string;
  name: string;
  description?: string;
  capacity?: number;
}

export interface UpdateAislePayload {
  zoneId?: string;
  code?: string;
  name?: string;
  description?: string;
  capacity?: number;
}

export interface UpdateAisleStatusPayload {
  status: LocationStatus;
}

export interface AisleQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: LocationStatus;
  zoneId?: string;
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

export interface AisleListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Aisle[];
}
