import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";

const router = Router();

// Create product (SUPER_ADMIN, ADMIN)
router.post(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    multerUpload.single("image"),
    validateRequest(ProductValidation.createProductValidationSchema),
    ProductController.createProduct,
);

// List products with pagination, search, filter, and sort
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
    ProductController.getAllProducts,
);

// Get single product by SKU
router.get(
    "/sku/:sku",
    checkAuth(
        Role.SUPER_ADMIN,
        Role.ADMIN,
        Role.WAREHOUSE_MANAGER,
        Role.PROCUREMENT,
        Role.FINANCE,
        Role.STAFF,
    ),
    ProductController.getProductBySku,
);

// Get single product details by ID
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
    ProductController.getProductById,
);

// Update product details (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    multerUpload.single("image"),
    validateRequest(ProductValidation.updateProductValidationSchema),
    ProductController.updateProduct,
);

// Update product status (SUPER_ADMIN, ADMIN)
router.patch(
    "/:id/status",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(ProductValidation.updateProductStatusValidationSchema),
    ProductController.updateProductStatus,
);

// Delete product (SUPER_ADMIN, ADMIN)
router.delete(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    ProductController.deleteProduct,
);

export const ProductRoutes = router;
