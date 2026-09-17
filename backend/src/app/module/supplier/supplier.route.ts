import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { SupplierController } from "./supplier.controller.js";
import { SupplierValidation } from "./supplier.validation.js";

const router = Router();

// Create supplier (SUPER_ADMIN, ADMIN)
router.post(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(SupplierValidation.createSupplierValidationSchema),
    SupplierController.createSupplier,
);

// List suppliers with pagination, search, filter, and sort
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
    SupplierController.getAllSuppliers,
);

// Get single supplier details
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
    SupplierController.getSupplierById,
);

// Update supplier details (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(SupplierValidation.updateSupplierValidationSchema),
    SupplierController.updateSupplier,
);

// Update supplier status (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id/status",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(SupplierValidation.updateSupplierStatusValidationSchema),
    SupplierController.updateSupplierStatus,
);

// Delete supplier (SUPER_ADMIN, ADMIN)
router.delete(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    SupplierController.deleteSupplier,
);

export const SupplierRoutes = router;
