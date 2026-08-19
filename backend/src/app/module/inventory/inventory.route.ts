import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { InventoryController } from "./inventory.controller";
import { InventoryLocationValidation } from "./inventory-location.validation";
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

// 2. Get full inventory summary for product in warehouse (MUST be registered before general product stock route)
router.get(
    "/warehouse/:warehouseId/product/:productId/summary",
    checkAuth(...ALL_ROLES),
    InventoryController.getInventorySummary,
);

// 3. Get product stock in warehouse
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

// ---------------------------------------------------------------------------
// INVENTORY LOCATION / BIN STOCK ENDPOINTS
// ---------------------------------------------------------------------------

// Allocate stock to bin
router.post(
    "/locations/allocate",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validateRequest(InventoryLocationValidation.allocateStockValidationSchema),
    InventoryController.allocateStock,
);

// Deallocate stock from bin
router.post(
    "/locations/deallocate",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validateRequest(InventoryLocationValidation.deallocateStockValidationSchema),
    InventoryController.deallocateStock,
);

// Transfer stock between bins
router.post(
    "/locations/transfer",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validateRequest(InventoryLocationValidation.transferStockValidationSchema),
    InventoryController.transferStock,
);

// Get stock in a bin
router.get(
    "/locations/bin/:binId",
    checkAuth(...ALL_ROLES),
    InventoryController.getStockByBin,
);

// Get product locations
router.get(
    "/locations/product/:productId",
    checkAuth(...ALL_ROLES),
    InventoryController.getProductLocations,
);

// Get warehouse location stock
router.get(
    "/locations/warehouse/:warehouseId",
    checkAuth(...ALL_ROLES),
    InventoryController.getWarehouseLocationStock,
);

// Get location stock movement history
router.get(
    "/locations/movements",
    checkAuth(...ALL_ROLES),
    InventoryController.getLocationMovements,
);

export const InventoryRoutes = router;
