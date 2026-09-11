import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import {
    checkSoBodyWarehouseAccess,
    checkSoParamsWarehouseAccess,
    checkShipmentWarehouseAccess,
} from "../../middleware/checkWarehouseAccess";
import { validateRequest } from "../../middleware/validateRequest";
import { ShippingController } from "./shipping.controller";
import { ShippingValidation } from "./shipping.validation";

const router = Router();

// Create Shipment
// Warehouse resolved from SalesOrder in request body via checkSoBodyWarehouseAccess
router.post(
    "/",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
    ),
    checkSoBodyWarehouseAccess,
    validateRequest(ShippingValidation.createShipmentValidationSchema),
    ShippingController.createShipment,
);

// List Shipments
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
    ShippingController.getAllShipments,
);

// Get Shipment by Sales Order (Must be defined BEFORE /:id)
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
    ShippingController.getShipmentBySalesOrder,
);

// Get Shipment by ID
// Warehouse resolved from Shipment via checkShipmentWarehouseAccess
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
    checkShipmentWarehouseAccess,
    ShippingController.getShipmentById,
);

// Update Shipment Info (allowed only in READY status)
// Warehouse resolved from Shipment via checkShipmentWarehouseAccess
router.patch(
    "/:id",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
    ),
    checkShipmentWarehouseAccess,
    validateRequest(ShippingValidation.updateShipmentValidationSchema),
    ShippingController.updateShipment,
);

// Update Shipment Status
// Warehouse resolved from Shipment via checkShipmentWarehouseAccess
router.patch(
    "/:id/status",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.STAFF,
    ),
    checkShipmentWarehouseAccess,
    validateRequest(ShippingValidation.updateShipmentStatusValidationSchema),
    ShippingController.updateShipmentStatus,
);

export const ShippingRoutes = router;
