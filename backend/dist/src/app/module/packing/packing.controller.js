import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { PackingService } from "./packing.service";
const createPackingTask = catchAsync(async (req, res) => {
    const result = await PackingService.createPackingTask(req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Packing task created successfully.",
        data: result,
    });
});
const getAllPackingTasks = catchAsync(async (req, res) => {
    const warehouseScope = getWarehouseScope(req.user.role, req.user.warehouseId);
    const result = await PackingService.getAllPackingTasks(req.query, warehouseScope);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing tasks fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});
const getPackingTaskById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await PackingService.getPackingTaskById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing task details retrieved successfully.",
        data: result,
    });
});
const getPackingTaskBySalesOrder = catchAsync(async (req, res) => {
    const salesOrderId = req.params.salesOrderId;
    const result = await PackingService.getPackingTaskBySalesOrder(salesOrderId);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing task retrieved for sales order successfully.",
        data: result,
    });
});
const startPacking = catchAsync(async (req, res) => {
    const id = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const result = await PackingService.startPacking(id, userId, userRole);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing task started successfully.",
        data: result,
    });
});
const assignPacker = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await PackingService.assignPacker(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packer assigned successfully.",
        data: result,
    });
});
const createPackage = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await PackingService.createPackage(id, req.body, {
        id: req.user.userId,
        role: req.user.role,
    });
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Package created successfully.",
        data: result,
    });
});
const getPackages = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await PackingService.getPackages(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packages retrieved successfully.",
        data: result,
    });
});
const addPackageItems = catchAsync(async (req, res) => {
    const id = req.params.id;
    const packageId = req.params.packageId;
    const result = await PackingService.addPackageItems(id, packageId, req.body, {
        id: req.user.userId,
        role: req.user.role,
    });
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Items added to package successfully.",
        data: result,
    });
});
const closePackage = catchAsync(async (req, res) => {
    const id = req.params.id;
    const packageId = req.params.packageId;
    const result = await PackingService.closePackage(id, packageId, {
        id: req.user.userId,
        role: req.user.role,
    });
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Package closed successfully.",
        data: result,
    });
});
const cancelPackingTask = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await PackingService.cancelPackingTask(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing task cancelled successfully.",
        data: result,
    });
});
export const PackingController = {
    createPackingTask,
    getAllPackingTasks,
    getPackingTaskById,
    getPackingTaskBySalesOrder,
    assignPacker,
    startPacking,
    createPackage,
    getPackages,
    addPackageItems,
    closePackage,
    cancelPackingTask,
};
