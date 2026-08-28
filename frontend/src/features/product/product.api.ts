import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CreateProductPayload,
  Product,
  ProductListResponse,
  ProductQueryParams,
  ProductStatus,
  UpdateProductPayload,
} from "./product.types";

export const productApi = {
  getProducts: async (
    params?: ProductQueryParams
  ): Promise<ProductListResponse> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<ProductListResponse>("products", {
      params: cleanParams,
    });
  },

  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
    return apiClient.get<ApiResponse<Product>>(`products/${id}`);
  },

  getProductBySku: async (sku: string): Promise<ApiResponse<Product>> => {
    return apiClient.get<ApiResponse<Product>>(`products/sku/${sku}`);
  },

  createProduct: async (
    payload: CreateProductPayload
  ): Promise<ApiResponse<Product>> => {
    const formData = new FormData();
    formData.append("sku", payload.sku.trim());
    formData.append("name", payload.name.trim());
    formData.append("categoryId", payload.categoryId);
    formData.append("unit", payload.unit.trim());

    if (payload.slug && payload.slug.trim()) {
      formData.append("slug", payload.slug.trim());
    }

    if (payload.description && payload.description.trim()) {
      formData.append("description", payload.description.trim());
    }

    if (payload.brandId) {
      formData.append("brandId", payload.brandId);
    }

    if (payload.status) {
      formData.append("status", payload.status);
    }

    if (payload.image instanceof File) {
      formData.append("image", payload.image);
    }

    return apiClient.post<ApiResponse<Product>>("products", formData);
  },

  updateProduct: async (
    id: string,
    payload: UpdateProductPayload
  ): Promise<ApiResponse<Product>> => {
    const formData = new FormData();

    if (payload.sku !== undefined && payload.sku.trim()) {
      formData.append("sku", payload.sku.trim());
    }

    if (payload.name !== undefined && payload.name.trim()) {
      formData.append("name", payload.name.trim());
    }

    if (payload.slug !== undefined && payload.slug.trim()) {
      formData.append("slug", payload.slug.trim());
    }

    if (payload.description !== undefined) {
      formData.append("description", payload.description || "");
    }

    if (payload.categoryId !== undefined && payload.categoryId.trim()) {
      formData.append("categoryId", payload.categoryId);
    }

    if (payload.brandId !== undefined) {
      formData.append("brandId", payload.brandId || "");
    }

    if (payload.unit !== undefined && payload.unit.trim()) {
      formData.append("unit", payload.unit.trim());
    }

    if (payload.status !== undefined) {
      formData.append("status", payload.status);
    }

    if (payload.removeImage === true) {
      formData.append("removeImage", "true");
    }

    if (payload.image instanceof File) {
      formData.append("image", payload.image);
    }

    return apiClient.patch<ApiResponse<Product>>(`products/${id}`, formData);
  },

  updateProductStatus: async (
    id: string,
    status: ProductStatus
  ): Promise<ApiResponse<Product>> => {
    return apiClient.patch<ApiResponse<Product>>(`products/${id}/status`, {
      status,
    });
  },

  deleteProduct: async (id: string): Promise<ApiResponse<Product>> => {
    return apiClient.delete<ApiResponse<Product>>(`products/${id}`);
  },
};
