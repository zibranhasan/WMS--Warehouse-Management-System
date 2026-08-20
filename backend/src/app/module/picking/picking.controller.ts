import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PickingService } from "./picking.service";

const createPickingTask = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const result = await PickingService.createPickingTask(req.body, userId);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Picking task created successfully.",
        data: result,
    });
});

const getAllPickingTasks = catchAsync(async (req: Request, res: Response) => {
    const result = await PickingService.getAllPickingTasks(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Picking tasks fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getPickingTaskById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PickingService.getPickingTaskById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Picking task details retrieved successfully.",
        data: result,
    });
});

const getPickingTaskBySalesOrder = catchAsync(
    async (req: Request, res: Response) => {
        const salesOrderId = req.params.salesOrderId as string;
        const result =
            await PickingService.getPickingTaskBySalesOrder(salesOrderId);

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Picking task retrieved for sales order successfully.",
            data: result,
        });
    },
);

const assignPicker = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PickingService.assignPicker(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Picker assigned successfully.",
        data: result,
    });
});

const startPicking = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PickingService.startPicking(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Picking started successfully.",
        data: result,
    });
});

const pickItems = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user.userId;
    const result = await PickingService.pickItems(id, req.body, userId);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Stock items picked successfully.",
        data: result,
    });
});

export const PickingController = {
    createPickingTask,
    getAllPickingTasks,
    getPickingTaskById,
    getPickingTaskBySalesOrder,
    assignPicker,
    startPicking,
    pickItems,
};
