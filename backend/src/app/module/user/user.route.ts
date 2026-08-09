import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

// Create employee user (Only ADMIN or SUPER_ADMIN)
router.post(
    "/",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    multerUpload.single("image"),
    validateRequest(UserValidation.createUserValidationSchema),
    UserController.createUser,
);

// List users with pagination, search, filter, and sort
router.get("/", UserController.getAllUsers);

// Get single user details
router.get("/:id", UserController.getUserById);

// Update user details
router.patch(
    "/:id",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    multerUpload.single("image"),
    validateRequest(UserValidation.updateUserValidationSchema),
    UserController.updateUser,
);

// Block user
router.patch("/:id/block", UserController.blockUser);

// Unblock user
router.patch("/:id/unblock", UserController.unblockUser);

// Assign role to user
router.patch(
    "/:id/role",
    validateRequest(UserValidation.assignRoleValidationSchema),
    UserController.assignRole,
);

// Assign warehouse to user (Prepared for future Warehouse model integration)
router.patch(
    "/:id/warehouse",
    validateRequest(UserValidation.assignWarehouseValidationSchema),
    UserController.assignWarehouse,
);

// Soft delete user
router.delete("/:id", UserController.deleteUser);

export const UserRoutes = router;
