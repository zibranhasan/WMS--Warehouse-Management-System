import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import {
    checkSoParamsWarehouseAccess,
    checkSoBodyWarehouseAccess,
    checkPackingWarehouseAccess,
} from "../../middleware/checkWarehouseAccess";
import { validateRequest } from "../../middleware/validateRequest";
import { PackingController } from "./packing.controller";
import { PackingValidation } from "./packing.validation";

const router = Router();

// Create Packing Task
// Warehouse resolved from SalesOrder in request body via checkSoBodyWarehouseAccess
router.post(
    "/",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
    ),
    checkSoBodyWarehouseAccess,
    validateRequest(PackingValidation.createPackingTaskValidationSchema),
    PackingController.createPackingTask,
);

// List Packing Tasks
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
    PackingController.getAllPackingTasks,
);

// Get Packing Task by Sales Order (Must be defined BEFORE /:id)
// Warehouse resolved from SalesOrder via checkSoParamsWarehouseAccess
router.get(
    "/sales-order/:salesOrderId",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    checkSoParamsWarehouseAccess("salesOrderId"),
    PackingController.getPackingTaskBySalesOrder,
);

// Get Packing Task by ID
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
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
    checkPackingWarehouseAccess,
    PackingController.getPackingTaskById,
);

// Assign Packer
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
router.patch(
    "/:id/assign",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
    ),
    checkPackingWarehouseAccess,
    validateRequest(PackingValidation.assignPackerValidationSchema),
    PackingController.assignPacker,
);

// Start Packing Task
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
// STAFF can only start tasks assigned to themselves (enforced in service)
router.patch(
    "/:id/start",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.STAFF,
    ),
    checkPackingWarehouseAccess,
    PackingController.startPacking,
);

// Create Package for Packing Task
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
router.post(
    "/:id/packages",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.STAFF,
    ),
    checkPackingWarehouseAccess,
    validateRequest(PackingValidation.createPackageValidationSchema),
    PackingController.createPackage,
);

// Get Packages for Packing Task
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
router.get(
    "/:id/packages",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    checkPackingWarehouseAccess,
    PackingController.getPackages,
);

// Add Items to Package
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
router.post(
    "/:id/packages/:packageId/items",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.STAFF,
    ),
    checkPackingWarehouseAccess,
    validateRequest(PackingValidation.addPackageItemsValidationSchema),
    PackingController.addPackageItems,
);

// Close Package
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
router.patch(
    "/:id/packages/:packageId/close",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.STAFF,
    ),
    checkPackingWarehouseAccess,
    PackingController.closePackage,
);

// Cancel Packing Task
// Warehouse resolved from PackingTask via checkPackingWarehouseAccess
router.patch(
    "/:id/cancel",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
    ),
    checkPackingWarehouseAccess,
    validateRequest(PackingValidation.cancelPackingTaskValidationSchema),
    PackingController.cancelPackingTask,
);

export const PackingRoutes = router;
