import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ShelfController } from "./shelf.controller";
import { ShelfValidation } from "./shelf.validation";
const router = Router();
// Create Shelf (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(ShelfValidation.createShelfValidationSchema), ShelfController.createShelf);
// List Shelves
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), ShelfController.getAllShelves);
// Get single Shelf by ID
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), ShelfController.getShelfById);
// Get bins under Shelf
router.get("/:id/bins", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), ShelfController.getShelfBins);
// Update Shelf (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(ShelfValidation.updateShelfValidationSchema), ShelfController.updateShelf);
// Update Shelf Status (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch("/:id/status", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(ShelfValidation.updateShelfStatusValidationSchema), ShelfController.updateShelfStatus);
// Soft Delete Shelf (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.delete("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), ShelfController.deleteShelf);
export const ShelfRoutes = router;
