import { Role, UserStatus } from "../../../generated/prisma/index.js";

export interface ICreateUser {
    name: string;
    email: string;
    password: string;
    role: Role;
    image?: string;
}

export interface IUpdateUser {
    name?: string;
    role?: Role;
    status?: UserStatus;
    image?: string;
}

export interface IAssignRole {
    role: Role;
}

export interface IAssignWarehouse {
    warehouseId: string;
}

export interface IUserFilters {
    searchTerm?: string;
    role?: Role;
    status?: UserStatus;
}

export interface IPaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
