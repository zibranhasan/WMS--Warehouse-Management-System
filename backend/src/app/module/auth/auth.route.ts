import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
    "/login",
    AuthController.loginUser,
);

router.post(
    "/logout",
    checkAuth(),
    AuthController.logoutUser,
);

router.get(
    "/me",
    checkAuth(),
    AuthController.getMe,
);

router.post(
    "/forget-password",
    validateRequest(AuthValidation.forgetPasswordValidationSchema),
    AuthController.forgetPassword,
);

router.post(
    "/reset-password",
    validateRequest(AuthValidation.resetPasswordValidationSchema),
    AuthController.resetPassword,
);

router.post(
    "/change-password",
    checkAuth(),
    validateRequest(AuthValidation.changePasswordValidationSchema),
    AuthController.changePassword,
);

router.post(
    "/send-verification-otp",
    validateRequest(AuthValidation.sendVerificationOTP),
    AuthController.sendVerificationOTP,
);

router.post(
    "/verify-email",
    validateRequest(AuthValidation.verifyEmail),
    AuthController.verifyEmail,
);

export const AuthRoutes = router;