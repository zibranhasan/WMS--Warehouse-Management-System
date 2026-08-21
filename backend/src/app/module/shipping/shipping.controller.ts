import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ShippingService } from "./shipping.service";

const createShipment = catchAsync(async (req: Request, res: Response) => {
    const result = await ShippingService.createShipment(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Shipment created successfully.",
        data: result,
    });
});

const getAllShipments = catchAsync(async (req: Request, res: Response) => {
    const result = await ShippingService.getAllShipments(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipments retrieved successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getShipmentById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ShippingService.getShipmentById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipment details retrieved successfully.",
        data: result,
    });
});

const getShipmentBySalesOrder = catchAsync(
    async (req: Request, res: Response) => {
        const salesOrderId = req.params.salesOrderId as string;
        const result =
            await ShippingService.getShipmentBySalesOrder(salesOrderId);

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Shipment retrieved for sales order successfully.",
            data: result,
        });
    },
);

const updateShipment = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ShippingService.updateShipment(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipment information updated successfully.",
        data: result,
    });
});

const updateShipmentStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ShippingService.updateShipmentStatus(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipment status updated successfully.",
        data: result,
    });
});

export const ShippingController = {
    createShipment,
    getAllShipments,
    getShipmentById,
    getShipmentBySalesOrder,
    updateShipment,
    updateShipmentStatus,
};
