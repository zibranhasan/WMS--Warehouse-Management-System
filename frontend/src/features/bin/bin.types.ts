import { Shelf } from "@/features/shelf/shelf.types";
import { LocationStatus } from "@/features/shelf/shelf.types";

export type { LocationStatus };

export interface Bin {
  id: string;
  shelfId: string;
  code: string;
  name: string;
  description?: string | null;
  capacity: number;
  status: LocationStatus;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  shelf?: Shelf;
}

export interface CreateBinPayload {
  shelfId: string;
  code: string;
  name: string;
  description?: string;
  capacity?: number;
}

export interface UpdateBinPayload {
  shelfId?: string;
  code?: string;
  name?: string;
  description?: string;
  capacity?: number;
}

export interface UpdateBinStatusPayload {
  status: LocationStatus;
}

export interface BinQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: LocationStatus;
  shelfId?: string;
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

export interface BinListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Bin[];
}
