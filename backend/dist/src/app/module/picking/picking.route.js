import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PickingController } from "./picking.controller";
import { PickingValidation } from "./picking.validation";
const router = Router();
// Create Picking Task
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(PickingValidation.createPickingTaskValidationSchema), PickingController.createPickingTask);
// List Picking Tasks
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), PickingController.getAllPickingTasks);
// Get Picking Task by Sales Order (Must be defined BEFORE /:id)
router.get("/sales-order/:salesOrderId", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), PickingController.getPickingTaskBySalesOrder);
// Get Picking Task by ID
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), PickingController.getPickingTaskById);
// Assign Picker
router.patch("/:id/assign", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(PickingValidation.assignPickerValidationSchema), PickingController.assignPicker);
// Start Picking
router.patch("/:id/start", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), PickingController.startPicking);
// Pick Items from Bin
router.post("/:id/pick", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), validateRequest(PickingValidation.pickItemsValidationSchema), PickingController.pickItems);
export const PickingRoutes = router;
