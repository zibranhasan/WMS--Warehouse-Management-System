import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PurchaseOrderController } from "./purchaseOrder.controller";
import { PurchaseOrderValidation } from "./purchaseOrder.validation";

const router = Router();

// Create Purchase Order (SUPER_ADMIN, ADMIN, PROCUREMENT)
router.post(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PROCUREMENT),
    validateRequest(
        PurchaseOrderValidation.createPurchaseOrderValidationSchema,
    ),
    PurchaseOrderController.createPurchaseOrder,
);

// List Purchase Orders with pagination, search, filter, and sort
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
    PurchaseOrderController.getAllPurchaseOrders,
);

// Approve Purchase Order (SUPER_ADMIN, ADMIN, PROCUREMENT)
router.patch(
    "/:id/approve",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PROCUREMENT),
    PurchaseOrderController.approvePurchaseOrder,
);

// Reject Purchase Order (SUPER_ADMIN, ADMIN, PROCUREMENT)
router.patch(
    "/:id/reject",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PROCUREMENT),
    validateRequest(
        PurchaseOrderValidation.rejectPurchaseOrderValidationSchema,
    ),
    PurchaseOrderController.rejectPurchaseOrder,
);

// Cancel Purchase Order (SUPER_ADMIN, ADMIN, PROCUREMENT)
router.patch(
    "/:id/cancel",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PROCUREMENT),
    validateRequest(
        PurchaseOrderValidation.cancelPurchaseOrderValidationSchema,
    ),
    PurchaseOrderController.cancelPurchaseOrder,
);

// Goods Receiving for Purchase Order (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, PROCUREMENT)
router.post(
    "/:id/receive",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
    ),
    validateRequest(PurchaseOrderValidation.receiveGoodsValidationSchema),
    PurchaseOrderController.receiveGoods,
);

// Get Goods Receipts for a Purchase Order (SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, PROCUREMENT, FINANCE, STAFF)
router.get(
    "/:id/receipts",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    PurchaseOrderController.getPurchaseOrderReceipts,
);

// Get single Purchase Order details
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
    PurchaseOrderController.getPurchaseOrderById,
);

// Update Purchase Order (SUPER_ADMIN, ADMIN, PROCUREMENT)
router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.PROCUREMENT),
    validateRequest(
        PurchaseOrderValidation.updatePurchaseOrderValidationSchema,
    ),
    PurchaseOrderController.updatePurchaseOrder,
);

export const PurchaseOrderRoutes = router;
