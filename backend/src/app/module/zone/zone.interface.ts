import { LocationStatus } from "../../../generated/prisma/index.js";

export interface ICreateZone {
    warehouseId: string;
    code: string;
    name: string;
    description?: string;
    capacity?: number;
}

export interface IUpdateZone {
    code?: string;
    name?: string;
    description?: string;
    capacity?: number;
    warehouseId?: string;
}

export interface IUpdateZoneStatus {
    status: LocationStatus;
}
