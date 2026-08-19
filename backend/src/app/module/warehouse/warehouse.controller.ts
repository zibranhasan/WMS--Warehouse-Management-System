import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { WarehouseService } from "./warehouse.service";

const createWarehouse = catchAsync(async (req: Request, res: Response) => {
    const result = await WarehouseService.createWarehouse(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Warehouse created successfully.",
        data: result,
    });
});

const getAllWarehouses = catchAsync(async (req: Request, res: Response) => {
    const result = await WarehouseService.getAllWarehouses(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouses fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getWarehouseById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await WarehouseService.getWarehouseById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouse retrieved successfully.",
        data: result,
    });
});

const updateWarehouse = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await WarehouseService.updateWarehouse(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouse updated successfully.",
        data: result,
    });
});

const updateWarehouseStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await WarehouseService.updateWarehouseStatus(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouse status updated successfully.",
        data: result,
    });
});

const assignUser = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId, userId } = req.params;
    const result = await WarehouseService.assignUserToWarehouse(
        warehouseId as string,
        userId as string,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User assigned to warehouse successfully.",
        data: result,
    });
});

const unassignUser = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId, userId } = req.params;
    const result = await WarehouseService.unassignUserFromWarehouse(
        warehouseId as string,
        userId as string,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "User unassigned from warehouse successfully.",
        data: result,
    });
});

const getWarehouseUsers = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId } = req.params;
    const result = await WarehouseService.getWarehouseUsers(
        warehouseId as string,
        req.query,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouse users fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getWarehouseStructure = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId } = req.params;
    const result = await WarehouseService.getWarehouseStructure(
        warehouseId as string,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouse structure retrieved successfully.",
        data: result,
    });
});

export const WarehouseController = {
    createWarehouse,
    getAllWarehouses,
    getWarehouseById,
    updateWarehouse,
    updateWarehouseStatus,
    assignUser,
    unassignUser,
    getWarehouseUsers,
    getWarehouseStructure,
};
