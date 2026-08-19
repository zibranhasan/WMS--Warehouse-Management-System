import { LocationStatus } from "../../../generated/prisma/index.js";

export interface ICreateBin {
    shelfId: string;
    code: string;
    name: string;
    description?: string;
    capacity?: number;
}

export interface IUpdateBin {
    code?: string;
    name?: string;
    description?: string;
    capacity?: number;
    shelfId?: string;
}

export interface IUpdateBinStatus {
    status: LocationStatus;
}
