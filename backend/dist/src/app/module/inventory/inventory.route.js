import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { checkWarehouseAccess, checkBinWarehouseAccess, } from "../../middleware/checkWarehouseAccess";
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
const WRITE_ROLES = [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.WAREHOUSE_MANAGER,
];
// =========================================================================
// READ ENDPOINTS — warehouse-scoped
// =========================================================================
// 1. Get warehouse stock
router.get("/warehouse/:warehouseId", checkAuth(...ALL_ROLES), checkWarehouseAccess, InventoryController.getStockByWarehouse);
// 2. Get full inventory summary for product in warehouse (MUST be registered before general product stock route)
router.get("/warehouse/:warehouseId/product/:productId/summary", checkAuth(...ALL_ROLES), checkWarehouseAccess, InventoryController.getInventorySummary);
// 3. Get product stock in warehouse
router.get("/warehouse/:warehouseId/product/:productId", checkAuth(...ALL_ROLES), checkWarehouseAccess, InventoryController.getProductStock);
// =========================================================================
// WRITE ENDPOINTS — role + warehouse scoped
// =========================================================================
// 4. Adjust stock
router.post("/adjust", checkAuth(...WRITE_ROLES), checkWarehouseAccess, validateRequest(InventoryValidation.stockAdjustmentValidationSchema), InventoryController.adjustStock);
// =========================================================================
// MOVEMENT ENDPOINTS — auto-filtered for warehouse-scoped users
// =========================================================================
// 5. Get stock movements
router.get("/movements", checkAuth(...ALL_ROLES), InventoryController.getStockMovements);
// 6. Get product movements
router.get("/product/:productId/movements", checkAuth(...ALL_ROLES), InventoryController.getProductMovements);
// =========================================================================
// INVENTORY LOCATION / BIN STOCK ENDPOINTS
// =========================================================================
// 7. Allocate stock to bin
router.post("/locations/allocate", checkAuth(...WRITE_ROLES), checkBinWarehouseAccess, validateRequest(InventoryLocationValidation.allocateStockValidationSchema), InventoryController.allocateStock);
// 8. Deallocate stock from bin
router.post("/locations/deallocate", checkAuth(...WRITE_ROLES), checkBinWarehouseAccess, validateRequest(InventoryLocationValidation.deallocateStockValidationSchema), InventoryController.deallocateStock);
// 9. Transfer stock between bins
router.post("/locations/transfer", checkAuth(...WRITE_ROLES), checkBinWarehouseAccess, validateRequest(InventoryLocationValidation.transferStockValidationSchema), InventoryController.transferStock);
// 10. Get stock in a bin
router.get("/locations/bin/:binId", checkAuth(...ALL_ROLES), checkBinWarehouseAccess, InventoryController.getStockByBin);
// 11. Get product locations (auto-filtered for warehouse-scoped users)
router.get("/locations/product/:productId", checkAuth(...ALL_ROLES), InventoryController.getProductLocations);
// 12. Get warehouse location stock
router.get("/locations/warehouse/:warehouseId", checkAuth(...ALL_ROLES), checkWarehouseAccess, InventoryController.getWarehouseLocationStock);
// 13. Get location stock movement history (auto-filtered for warehouse-scoped users)
router.get("/locations/movements", checkAuth(...ALL_ROLES), InventoryController.getLocationMovements);
export const InventoryRoutes = router;
