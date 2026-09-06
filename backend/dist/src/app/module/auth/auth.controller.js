import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
const loginUser = catchAsync(async (req, res) => {
    const result = await AuthService.loginUser(req);
    const setCookies = result.headers.getSetCookie();
    if (setCookies.length > 0) {
        res.setHeader("Set-Cookie", setCookies);
    }
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged in successfully",
        data: result.data,
    });
});
const logoutUser = catchAsync(async (req, res) => {
    const result = await AuthService.logoutUser(req);
    const setCookies = result.headers.getSetCookie();
    if (setCookies.length > 0) {
        res.setHeader("Set-Cookie", setCookies);
    }
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User logged out successfully",
        data: null,
    });
});
const getMe = catchAsync(async (req, res) => {
    const result = await AuthService.getMe(req);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "User profile fetched successfully",
        data: result,
    });
});
const forgetPassword = catchAsync(async (req, res) => {
    const result = await AuthService.forgetPassword(req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
    });
});
const resetPassword = catchAsync(async (req, res) => {
    const result = await AuthService.resetPassword(req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
    });
});
const changePassword = catchAsync(async (req, res) => {
    const result = await AuthService.changePassword(req);
    if (result.headers) {
        const setCookies = result.headers.getSetCookie();
        if (setCookies.length > 0) {
            res.setHeader("Set-Cookie", setCookies);
        }
    }
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.data.message,
    });
});
const sendVerificationOTP = catchAsync(async (req, res) => {
    const result = await AuthService.sendVerificationOTP(req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
    });
});
const verifyEmail = catchAsync(async (req, res) => {
    const result = await AuthService.verifyEmail(req.body);
    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: result.message,
    });
});
export const AuthController = {
    loginUser,
    logoutUser,
    getMe,
    forgetPassword,
    resetPassword,
    changePassword,
    sendVerificationOTP,
    verifyEmail,
};
