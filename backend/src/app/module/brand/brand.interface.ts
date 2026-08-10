import { BrandStatus } from "../../../generated/prisma/index.js";

export interface ICreateBrand {
    name: string;
    slug?: string;
    description?: string;
}

export interface IUpdateBrand {
    name?: string;
    slug?: string;
    description?: string;
    status?: BrandStatus;
}

export interface IUpdateBrandStatus {
    status: BrandStatus;
}

export interface IBrandFilters {
    searchTerm?: string;
    status?: BrandStatus;
    name?: string;
    slug?: string;
}
