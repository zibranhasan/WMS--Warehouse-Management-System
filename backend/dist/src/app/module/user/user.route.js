import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
const router = Router();
// Create employee user (Only SUPER_ADMIN or ADMIN)
router.post("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), multerUpload.single("image"), validateRequest(UserValidation.createUserValidationSchema), UserController.createUser);
// List users with pagination, search, filter, and sort (Only SUPER_ADMIN or ADMIN)
router.get("/", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), UserController.getAllUsers);
// Block user (Only SUPER_ADMIN or ADMIN) — must be before /:id to avoid conflict
router.patch("/:id/block", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), UserController.blockUser);
// Unblock user (Only SUPER_ADMIN or ADMIN) — must be before /:id to avoid conflict
router.patch("/:id/unblock", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), UserController.unblockUser);
// Assign role to user (Only SUPER_ADMIN or ADMIN) — must be before /:id
router.patch("/:id/role", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(UserValidation.assignRoleValidationSchema), UserController.assignRole);
// Assign warehouse to user (Prepared for future Warehouse model integration) — must be before /:id
router.patch("/:id/warehouse", validateRequest(UserValidation.assignWarehouseValidationSchema), UserController.assignWarehouse);
// Get single user details (Only SUPER_ADMIN or ADMIN)
router.get("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), UserController.getUserById);
// Update user details (Only SUPER_ADMIN or ADMIN)
router.patch("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), multerUpload.single("image"), validateRequest(UserValidation.updateUserValidationSchema), UserController.updateUser);
// Soft delete user (Only SUPER_ADMIN or ADMIN)
router.delete("/:id", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), UserController.deleteUser);
export const UserRoutes = router;
