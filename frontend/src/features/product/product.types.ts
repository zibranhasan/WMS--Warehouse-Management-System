export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  brandId: string | null;
  unit: string;
  image: string | null;
  status: ProductStatus;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: ProductCategory;
  brand: ProductBrand | null;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  categoryId: string;
  brandId?: string | null;
  unit: string;
  status?: ProductStatus;
  image?: File | null;
}

export interface UpdateProductPayload {
  sku?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  categoryId?: string;
  brandId?: string | null;
  unit?: string;
  status?: ProductStatus;
  image?: File | null;
  removeImage?: boolean;
}

export interface UpdateProductStatusPayload {
  status: ProductStatus;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: ProductStatus;
  categoryId?: string;
  brandId?: string;
  sku?: string;
  name?: string;
  slug?: string;
  unit?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  fields?: string;
  [key: string]: string | number | boolean | (string | number | boolean)[] | undefined | null;
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

export interface ProductListResponse {
  success: boolean;
  message: string;
  meta: ApiMeta;
  data: Product[];
}
