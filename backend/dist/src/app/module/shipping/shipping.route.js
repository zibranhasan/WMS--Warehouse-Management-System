import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ShippingController } from "./shipping.controller";
import { ShippingValidation } from "./shipping.validation";
const router = Router();
// Create Shipment
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(ShippingValidation.createShipmentValidationSchema), ShippingController.createShipment);
// List Shipments
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), ShippingController.getAllShipments);
// Get Shipment by Sales Order (Must be defined BEFORE /:id)
router.get("/sales-order/:salesOrderId", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), ShippingController.getShipmentBySalesOrder);
// Get Shipment by ID
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), ShippingController.getShipmentById);
// Update Shipment Info (allowed only in READY status)
router.patch("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER), validateRequest(ShippingValidation.updateShipmentValidationSchema), ShippingController.updateShipment);
// Update Shipment Status
router.patch("/:id/status", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.STAFF), validateRequest(ShippingValidation.updateShipmentStatusValidationSchema), ShippingController.updateShipmentStatus);
export const ShippingRoutes = router;
