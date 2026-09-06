import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";
const createUser = catchAsync(async (req, res) => {
    const result = await UserService.createUser(req.body, req.file);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Employee created successfully.",
        data: result,
    });
});
const getAllUsers = catchAsync(async (req, res) => {
    const result = await UserService.getAllUsers(req.query);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Users fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});
const getUserById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await UserService.getUserById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully.",
        data: result,
    });
});
const updateUser = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await UserService.updateUser(id, req.body, req.file);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User updated successfully.",
        data: result,
    });
});
const blockUser = catchAsync(async (req, res) => {
    const id = req.params.id;
    const currentUserId = req.user?.userId;
    const result = await UserService.blockUser(id, currentUserId);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User blocked successfully.",
        data: result,
    });
});
const unblockUser = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await UserService.unblockUser(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User unblocked successfully.",
        data: result,
    });
});
const assignRole = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await UserService.assignRole(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User role assigned successfully.",
        data: result,
    });
});
const assignWarehouse = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await UserService.assignWarehouse(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouse assigned successfully.",
        data: result,
    });
});
const deleteUser = catchAsync(async (req, res) => {
    const id = req.params.id;
    const currentUserId = req.user?.userId;
    const result = await UserService.deleteUser(id, currentUserId);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User deleted successfully.",
        data: result,
    });
});
export const UserController = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    blockUser,
    unblockUser,
    assignRole,
    assignWarehouse,
    deleteUser,
};
