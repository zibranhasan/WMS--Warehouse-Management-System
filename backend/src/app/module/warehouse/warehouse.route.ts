import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { WarehouseController } from "./warehouse.controller";
import { WarehouseValidation } from "./warehouse.validation";

const router = Router();

// Create warehouse (SUPER_ADMIN, ADMIN)
router.post(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(WarehouseValidation.createWarehouseValidationSchema),
    WarehouseController.createWarehouse,
);

// List warehouses with pagination, search, filter, and sort
router.get(
    "/",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    WarehouseController.getAllWarehouses,
);

// Get users assigned to a warehouse
router.get(
    "/:warehouseId/users",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    WarehouseController.getWarehouseUsers,
);

// Get complete physical structure of a warehouse
router.get(
    "/:warehouseId/structure",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    WarehouseController.getWarehouseStructure,
);

// Assign user to warehouse (SUPER_ADMIN, ADMIN)
router.patch(
    "/:warehouseId/assign-user/:userId",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    WarehouseController.assignUser,
);

// Unassign user from warehouse (SUPER_ADMIN, ADMIN)
router.patch(
    "/:warehouseId/unassign-user/:userId",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    WarehouseController.unassignUser,
);

// Get single warehouse details
router.get(
    "/:id",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    WarehouseController.getWarehouseById,
);

// Update warehouse details (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(WarehouseValidation.updateWarehouseValidationSchema),
    WarehouseController.updateWarehouse,
);

// Update warehouse status (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id/status",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(WarehouseValidation.updateWarehouseStatusValidationSchema),
    WarehouseController.updateWarehouseStatus,
);

export const WarehouseRoutes = router;
