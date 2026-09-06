import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AisleController } from "./aisle.controller";
import { AisleValidation } from "./aisle.validation";
const router = Router();
// Create Aisle (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(AisleValidation.createAisleValidationSchema), AisleController.createAisle);
// List Aisles
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), AisleController.getAllAisles);
// Get single Aisle by ID
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), AisleController.getAisleById);
// Get shelves under Aisle
router.get("/:id/shelves", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), AisleController.getAisleShelves);
// Update Aisle (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(AisleValidation.updateAisleValidationSchema), AisleController.updateAisle);
// Update Aisle Status (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch("/:id/status", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(AisleValidation.updateAisleStatusValidationSchema), AisleController.updateAisleStatus);
// Soft Delete Aisle (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.delete("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), AisleController.deleteAisle);
export const AisleRoutes = router;
