import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SalesOrderController } from "./salesOrder.controller";
import { SalesOrderValidation } from "./salesOrder.validation";

const router = Router();

// Create Sales Order (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, STAFF)
router.post(
    "/",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.STAFF,
    ),
    validateRequest(SalesOrderValidation.createSalesOrderValidationSchema),
    SalesOrderController.createSalesOrder,
);

// List Sales Orders with pagination, search, filter, and sort
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
    SalesOrderController.getAllSalesOrders,
);

// Cancel Sales Order (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, STAFF)
router.patch(
    "/:id/cancel",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.STAFF,
    ),
    validateRequest(SalesOrderValidation.cancelSalesOrderValidationSchema),
    SalesOrderController.cancelSalesOrder,
);

// Get single Sales Order details
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
    SalesOrderController.getSalesOrderById,
);

export const SalesOrderRoutes = router;
