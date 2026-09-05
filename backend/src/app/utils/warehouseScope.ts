import { Role } from "../../generated/prisma/enums";

/**
 * Determine warehouse scope for filtering / queries.
 *
 * - SUPER_ADMIN / ADMIN → null (global access to all warehouses)
 * - All other roles with an assigned warehouse → user's assigned warehouseId
 * - Scoped roles without an assigned warehouse → "NO_ACCESS" (prevents unauthorized access)
 *
 * @param userRole Role of the authenticated user
 * @param userWarehouseId Assigned warehouse ID of the user (if any)
 * @returns string (warehouseId / "NO_ACCESS") or null (global access)
 */
export const getWarehouseScope = (
    userRole: Role,
    userWarehouseId?: string | null,
): string | null => {
    if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
        return null;
    }
    return userWarehouseId ?? "NO_ACCESS";
};
