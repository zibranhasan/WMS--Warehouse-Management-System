import { WarehouseStatus } from "../../../generated/prisma/index.js";

export interface ICreateWarehouse {
    code: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
}

export interface IUpdateWarehouse {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    status?: WarehouseStatus;
}

export interface IUpdateWarehouseStatus {
    status: WarehouseStatus;
}

export interface IWarehouseFilters {
    searchTerm?: string;
    status?: WarehouseStatus;
    city?: string;
    country?: string;
    code?: string;
    name?: string;
}
