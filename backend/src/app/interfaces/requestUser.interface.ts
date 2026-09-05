import { Role } from "../../generated/prisma/enums";

export interface IRequestUser {
    userId: string;
    role: Role;
    email: string;
    warehouseId?: string | null;
}