export type SupplierStatus = "ACTIVE" | "INACTIVE";

export interface Supplier {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  contactPerson?: string | null;
  status: SupplierStatus;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierPayload {
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  contactPerson?: string | null;
  status?: SupplierStatus;
}

export interface UpdateSupplierPayload {
  name?: string;
  code?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  contactPerson?: string | null;
  status?: SupplierStatus;
}

export interface UpdateSupplierStatusPayload {
  status: SupplierStatus;
}

export interface SupplierQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: SupplierStatus;
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: T[];
}

export type SupplierListResponse = PaginatedResponse<Supplier>;

