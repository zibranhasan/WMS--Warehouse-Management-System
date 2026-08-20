import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PackingService } from "./packing.service";

const createPackingTask = catchAsync(async (req: Request, res: Response) => {
    const result = await PackingService.createPackingTask(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Packing task created successfully.",
        data: result,
    });
});

const getAllPackingTasks = catchAsync(async (req: Request, res: Response) => {
    const result = await PackingService.getAllPackingTasks(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing tasks fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getPackingTaskById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PackingService.getPackingTaskById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing task details retrieved successfully.",
        data: result,
    });
});

const getPackingTaskBySalesOrder = catchAsync(
    async (req: Request, res: Response) => {
        const salesOrderId = req.params.salesOrderId as string;
        const result =
            await PackingService.getPackingTaskBySalesOrder(salesOrderId);

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Packing task retrieved for sales order successfully.",
            data: result,
        });
    },
);

const startPacking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user.userId;
    const result = await PackingService.startPacking(id, userId);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packing task started successfully.",
        data: result,
    });
});

const createPackage = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PackingService.createPackage(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Package created successfully.",
        data: result,
    });
});

const getPackages = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PackingService.getPackages(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Packages retrieved successfully.",
        data: result,
    });
});

const addPackageItems = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const packageId = req.params.packageId as string;
    const result = await PackingService.addPackageItems(id, packageId, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Items added to package successfully.",
        data: result,
    });
});

const closePackage = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const packageId = req.params.packageId as string;
    const result = await PackingService.closePackage(id, packageId);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Package closed successfully.",
        data: result,
    });
});

export const PackingController = {
    createPackingTask,
    getAllPackingTasks,
    getPackingTaskById,
    getPackingTaskBySalesOrder,
    startPacking,
    createPackage,
    getPackages,
    addPackageItems,
    closePackage,
};
