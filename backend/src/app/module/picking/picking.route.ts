import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import {
    checkSoParamsWarehouseAccess,
    checkSoBodyWarehouseAccess,
    checkPickingWarehouseAccess,
} from "../../middleware/checkWarehouseAccess";
import { validateRequest } from "../../middleware/validateRequest";
import { PickingController } from "./picking.controller";
import { PickingValidation } from "./picking.validation";

const router = Router();

// Create Picking Task
// Warehouse resolved from SalesOrder in request body via checkSoBodyWarehouseAccess
router.post(
    "/",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
    ),
    checkSoBodyWarehouseAccess,
    validateRequest(PickingValidation.createPickingTaskValidationSchema),
    PickingController.createPickingTask,
);

// List Picking Tasks
// Warehouse-scope filtering handled in Part 6.3
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
    PickingController.getAllPickingTasks,
);

// Get Picking Task by Sales Order (Must be defined BEFORE /:id)
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
    PickingController.getPickingTaskBySalesOrder,
);

// Get Picking Task by ID
// Warehouse resolved from PickingTask via checkPickingWarehouseAccess
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
    checkPickingWarehouseAccess,
    PickingController.getPickingTaskById,
);

// Assign Picker
// Warehouse resolved from PickingTask via checkPickingWarehouseAccess
router.patch(
    "/:id/assign",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
    ),
    checkPickingWarehouseAccess,
    validateRequest(PickingValidation.assignPickerValidationSchema),
    PickingController.assignPicker,
);

// Start Picking
// Warehouse resolved from PickingTask via checkPickingWarehouseAccess
// STAFF can only start tasks assigned to themselves (enforced in service)
router.patch(
    "/:id/start",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.STAFF,
    ),
    checkPickingWarehouseAccess,
    PickingController.startPicking,
);

// Pick Items from Bin
// Warehouse resolved from PickingTask via checkPickingWarehouseAccess
// Individual locationStock warehouse validated in service layer
router.post(
    "/:id/pick",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.STAFF,
    ),
    checkPickingWarehouseAccess,
    validateRequest(PickingValidation.pickItemsValidationSchema),
    PickingController.pickItems,
);

export const PickingRoutes = router;
