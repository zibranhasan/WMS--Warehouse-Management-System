export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehousePayload {
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface UpdateWarehousePayload {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: WarehouseStatus;
}

export interface UpdateWarehouseStatusPayload {
  status: WarehouseStatus;
}

export interface WarehouseQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: WarehouseStatus;
  city?: string;
  country?: string;
  code?: string;
  name?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  fields?: string;
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

export interface WarehouseListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Warehouse[];
}

export interface WarehouseUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  warehouseId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseUserListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: WarehouseUser[];
}

export interface WarehouseStructureNode {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  capacity?: number;
  status: string;
  [key: string]: unknown;
}

export interface WarehouseStructure extends Warehouse {
  zones: Array<
    WarehouseStructureNode & {
      aisles: Array<
        WarehouseStructureNode & {
          shelves: Array<
            WarehouseStructureNode & {
              bins: WarehouseStructureNode[];
            }
          >;
        }
      >;
    }
  >;
}
