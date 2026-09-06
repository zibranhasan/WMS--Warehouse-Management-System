import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PackingController } from "./packing.controller";
import { PackingValidation } from "./packing.validation";
const router = Router();
// Create Packing Task
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(PackingValidation.createPackingTaskValidationSchema), PackingController.createPackingTask);
// List Packing Tasks
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), PackingController.getAllPackingTasks);
// Get Packing Task by Sales Order (Must be defined BEFORE /:id)
router.get("/sales-order/:salesOrderId", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), PackingController.getPackingTaskBySalesOrder);
// Get Packing Task by ID
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), PackingController.getPackingTaskById);
// Start Packing Task
router.patch("/:id/start", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), PackingController.startPacking);
// Create Package for Packing Task
router.post("/:id/packages", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), validateRequest(PackingValidation.createPackageValidationSchema), PackingController.createPackage);
// Get Packages for Packing Task
router.get("/:id/packages", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), PackingController.getPackages);
// Add Items to Package
router.post("/:id/packages/:packageId/items", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), validateRequest(PackingValidation.addPackageItemsValidationSchema), PackingController.addPackageItems);
// Close Package
router.patch("/:id/packages/:packageId/close", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), PackingController.closePackage);
export const PackingRoutes = router;
