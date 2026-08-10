import { CategoryStatus } from "../../../generated/prisma/index.js";

export interface ICreateCategory {
    name: string;
    slug?: string;
    description?: string;
}

export interface IUpdateCategory {
    name?: string;
    slug?: string;
    description?: string;
    status?: CategoryStatus;
}

export interface IUpdateCategoryStatus {
    status: CategoryStatus;
}

export interface ICategoryFilters {
    searchTerm?: string;
    status?: CategoryStatus;
    name?: string;
    slug?: string;
}
