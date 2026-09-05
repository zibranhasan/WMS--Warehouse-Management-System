import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { PurchaseOrderService } from "./purchaseOrder.service";

const createPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const result = await PurchaseOrderService.createPurchaseOrder(
        req.body,
        userId,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Purchase order created successfully.",
        data: result,
    });
});

const getAllPurchaseOrders = catchAsync(async (req: Request, res: Response) => {
    const warehouseScope = getWarehouseScope(
        req.user.role,
        req.user.warehouseId,
    );
    const result = await PurchaseOrderService.getAllPurchaseOrders(
        req.query,
        warehouseScope,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Purchase orders fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getPurchaseOrderById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PurchaseOrderService.getPurchaseOrderById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Purchase order retrieved successfully.",
        data: result,
    });
});

const updatePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userRole = req.user.role;
    const result = await PurchaseOrderService.updatePurchaseOrder(
        id,
        req.body,
        userRole,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Purchase order updated successfully.",
        data: result,
    });
});

const approvePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user.userId;
    const result = await PurchaseOrderService.approvePurchaseOrder(id, userId);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Purchase order approved successfully.",
        data: result,
    });
});

const rejectPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PurchaseOrderService.rejectPurchaseOrder(
        id,
        req.body,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Purchase order rejected successfully.",
        data: result,
    });
});

const cancelPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PurchaseOrderService.cancelPurchaseOrder(
        id,
        req.body,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Purchase order cancelled successfully.",
        data: result,
    });
});

const receiveGoods = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user.userId;
    const result = await PurchaseOrderService.receiveGoods(
        id,
        req.body,
        userId,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Goods received successfully and inventory updated.",
        data: result,
    });
});

const getPurchaseOrderReceipts = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await PurchaseOrderService.getPurchaseOrderReceipts(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Purchase order receipts fetched successfully.",
        data: result,
    });
});

export const PurchaseOrderController = {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    cancelPurchaseOrder,
    receiveGoods,
    getPurchaseOrderReceipts,
};

