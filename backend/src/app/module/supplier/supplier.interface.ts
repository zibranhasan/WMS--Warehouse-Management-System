import { SupplierStatus } from "../../../generated/prisma/index.js";

export interface ICreateSupplier {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    contactPerson?: string;
    status?: SupplierStatus;
}

export interface IUpdateSupplier {
    name?: string;
    code?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    contactPerson?: string;
    status?: SupplierStatus;
}

export interface IUpdateSupplierStatus {
    status: SupplierStatus;
}
