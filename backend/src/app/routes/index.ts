import { Router } from "express";

import { AuthRoutes } from "../module/auth/auth.route";
import { BrandRoutes } from "../module/brand/brand.route";
import { CategoryRoutes } from "../module/category/category.route";
import { InventoryRoutes } from "../module/inventory/inventory.route";
import { ProductRoutes } from "../module/product/product.route";
import { UserRoutes } from "../module/user/user.route";
import { WarehouseRoutes } from "../module/warehouse/warehouse.route";

const router = Router();
router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/warehouses", WarehouseRoutes);
router.use("/categories", CategoryRoutes);
router.use("/brands", BrandRoutes);
router.use("/products", ProductRoutes);
router.use("/inventory", InventoryRoutes);

export const IndexRoutes = router;