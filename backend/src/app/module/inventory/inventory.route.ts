import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { InventoryController } from "./inventory.controller";
import { InventoryValidation } from "./inventory.validation";

const router = Router();

const ALL_ROLES = [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.WAREHOUSE_MANAGER,
    Role.PROCUREMENT,
    Role.FINANCE,
    Role.STAFF,
];

// 1. Get warehouse stock
router.get(
    "/warehouse/:warehouseId",
    checkAuth(...ALL_ROLES),
    InventoryController.getStockByWarehouse,
);

// 2. Get product stock in warehouse
router.get(
    "/warehouse/:warehouseId/product/:productId",
    checkAuth(...ALL_ROLES),
    InventoryController.getProductStock,
);

// 3. Adjust stock
router.post(
    "/adjust",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validateRequest(InventoryValidation.stockAdjustmentValidationSchema),
    InventoryController.adjustStock,
);

// 4. Get stock movements
router.get(
    "/movements",
    checkAuth(...ALL_ROLES),
    InventoryController.getStockMovements,
);

// 5. Get product movements
router.get(
    "/product/:productId/movements",
    checkAuth(...ALL_ROLES),
    InventoryController.getProductMovements,
);

export const InventoryRoutes = router;
