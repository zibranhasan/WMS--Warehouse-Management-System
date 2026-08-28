export type BrandStatus = "ACTIVE" | "INACTIVE";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: BrandStatus;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandPayload {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateBrandPayload {
  name?: string;
  slug?: string;
  description?: string;
  status?: BrandStatus;
}

export interface UpdateBrandStatusPayload {
  status: BrandStatus;
}

export interface BrandQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: BrandStatus;
  name?: string;
  slug?: string;
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

export interface BrandListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Brand[];
}
