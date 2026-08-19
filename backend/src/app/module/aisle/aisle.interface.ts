import { LocationStatus } from "../../../generated/prisma/index.js";

export interface ICreateAisle {
    zoneId: string;
    code: string;
    name: string;
    description?: string;
    capacity?: number;
}

export interface IUpdateAisle {
    code?: string;
    name?: string;
    description?: string;
    capacity?: number;
    zoneId?: string;
}

export interface IUpdateAisleStatus {
    status: LocationStatus;
}
