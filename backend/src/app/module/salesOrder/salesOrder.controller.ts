import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { SalesOrderService } from "./salesOrder.service";

const createSalesOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const result = await SalesOrderService.createSalesOrder(
        req.body,
        userId,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Sales order created successfully.",
        data: result,
    });
});

const getAllSalesOrders = catchAsync(async (req: Request, res: Response) => {
    const warehouseScope = getWarehouseScope(
        req.user.role,
        req.user.warehouseId,
    );
    const result = await SalesOrderService.getAllSalesOrders(
        req.query,
        warehouseScope,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Sales orders fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getSalesOrderById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SalesOrderService.getSalesOrderById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Sales order retrieved successfully.",
        data: result,
    });
});

const cancelSalesOrder = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SalesOrderService.cancelSalesOrder(
        id,
        req.body,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Sales order cancelled successfully.",
        data: result,
    });
});

export const SalesOrderController = {
    createSalesOrder,
    getAllSalesOrders,
    getSalesOrderById,
    cancelSalesOrder,
};
