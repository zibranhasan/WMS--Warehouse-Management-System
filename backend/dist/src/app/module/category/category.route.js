import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CategoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";
const router = Router();
// Create category (SUPER_ADMIN, ADMIN)
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(CategoryValidation.createCategoryValidationSchema), CategoryController.createCategory);
// List categories with pagination, search, filter, and sort
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), CategoryController.getAllCategories);
// Get single category details
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PROCUREMENT, Role.FINANCE, Role.STAFF), CategoryController.getCategoryById);
// Update category details (SUPER_ADMIN, ADMIN)
router.patch("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(CategoryValidation.updateCategoryValidationSchema), CategoryController.updateCategory);
// Update category status (SUPER_ADMIN, ADMIN)
router.patch("/:id/status", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(CategoryValidation.updateCategoryStatusValidationSchema), CategoryController.updateCategoryStatus);
// Delete category (SUPER_ADMIN, ADMIN)
router.delete("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), CategoryController.deleteCategory);
export const CategoryRoutes = router;
