import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { BinController } from "./bin.controller";
import { BinValidation } from "./bin.validation";
const router = Router();
// Create Bin (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(BinValidation.createBinValidationSchema), BinController.createBin);
// List Bins
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), BinController.getAllBins);
// Get single Bin by ID
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), BinController.getBinById);
// Update Bin (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(BinValidation.updateBinValidationSchema), BinController.updateBin);
// Update Bin Status (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch("/:id/status", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(BinValidation.updateBinStatusValidationSchema), BinController.updateBinStatus);
// Soft Delete Bin (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.delete("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), BinController.deleteBin);
export const BinRoutes = router;
