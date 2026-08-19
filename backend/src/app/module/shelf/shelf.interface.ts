import { LocationStatus } from "../../../generated/prisma/index.js";

export interface ICreateShelf {
    aisleId: string;
    code: string;
    name: string;
    description?: string;
    capacity?: number;
}

export interface IUpdateShelf {
    code?: string;
    name?: string;
    description?: string;
    capacity?: number;
    aisleId?: string;
}

export interface IUpdateShelfStatus {
    status: LocationStatus;
}
