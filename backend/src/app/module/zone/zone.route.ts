import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ZoneController } from "./zone.controller";
import { ZoneValidation } from "./zone.validation";

const router = Router();

// Create Zone (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.post(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validateRequest(ZoneValidation.createZoneValidationSchema),
    ZoneController.createZone,
);

// List Zones
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
    ZoneController.getAllZones,
);

// Get single Zone by ID
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
    ZoneController.getZoneById,
);

// Get aisles under Zone
router.get(
    "/:id/aisles",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    ZoneController.getZoneAisles,
);

// Update Zone (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validateRequest(ZoneValidation.updateZoneValidationSchema),
    ZoneController.updateZone,
);

// Update Zone Status (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.patch(
    "/:id/status",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validateRequest(ZoneValidation.updateZoneStatusValidationSchema),
    ZoneController.updateZoneStatus,
);

// Soft Delete Zone (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER)
router.delete(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    ZoneController.deleteZone,
);

export const ZoneRoutes = router;
