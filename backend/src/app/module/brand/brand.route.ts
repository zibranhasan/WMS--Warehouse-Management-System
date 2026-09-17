import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { BrandController } from "./brand.controller.js";
import { BrandValidation } from "./brand.validation.js";

const router = Router();

// Create brand (SUPER_ADMIN, ADMIN)
router.post(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(BrandValidation.createBrandValidationSchema),
    BrandController.createBrand,
);

// List brands with pagination, search, filter, and sort
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
    BrandController.getAllBrands,
);

// Get single brand details
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
    BrandController.getBrandById,
);

// Update brand details (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(BrandValidation.updateBrandValidationSchema),
    BrandController.updateBrand,
);

// Update brand status (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id/status",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(BrandValidation.updateBrandStatusValidationSchema),
    BrandController.updateBrandStatus,
);

// Delete brand (SUPER_ADMIN, ADMIN)
router.delete(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    BrandController.deleteBrand,
);

export const BrandRoutes = router;
