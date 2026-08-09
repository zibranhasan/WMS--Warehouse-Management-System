import { Router } from "express";

import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";
import { WarehouseRoutes } from "../module/warehouse/warehouse.route";

const router = Router();
router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/warehouses", WarehouseRoutes);

export const IndexRoutes = router;