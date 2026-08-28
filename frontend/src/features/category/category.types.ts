export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CategoryStatus;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  status?: CategoryStatus;
}

export interface UpdateCategoryStatusPayload {
  status: CategoryStatus;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: CategoryStatus;
  name?: string;
  slug?: string;
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

export interface CategoryListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Category[];
}
