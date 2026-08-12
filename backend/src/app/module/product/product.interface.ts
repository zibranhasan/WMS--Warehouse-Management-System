import { ProductStatus } from "../../../generated/prisma/index.js";

export interface ICreateProduct {
    sku: string;
    name: string;
    slug?: string;
    description?: string;
    categoryId: string;
    brandId?: string;
    unit: string;
    image?: string | null;
    status?: ProductStatus;
}

export interface IUpdateProduct {
    sku?: string;
    name?: string;
    slug?: string;
    description?: string;
    categoryId?: string;
    brandId?: string | null;
    unit?: string;
    image?: string | null;
    removeImage?: boolean;
    status?: ProductStatus;
}

export interface IUpdateProductStatus {
    status: ProductStatus;
}

export interface IProductFilters {
    searchTerm?: string;
    sku?: string;
    name?: string;
    slug?: string;
    categoryId?: string;
    brandId?: string;
    status?: ProductStatus;
    unit?: string;
    id?: string;
}
