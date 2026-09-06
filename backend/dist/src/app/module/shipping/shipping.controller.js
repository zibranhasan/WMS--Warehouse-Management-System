import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ShippingService } from "./shipping.service";
const createShipment = catchAsync(async (req, res) => {
    const result = await ShippingService.createShipment(req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Shipment created successfully.",
        data: result,
    });
});
const getAllShipments = catchAsync(async (req, res) => {
    const result = await ShippingService.getAllShipments(req.query);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipments retrieved successfully.",
        meta: result.meta,
        data: result.data,
    });
});
const getShipmentById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await ShippingService.getShipmentById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipment details retrieved successfully.",
        data: result,
    });
});
const getShipmentBySalesOrder = catchAsync(async (req, res) => {
    const salesOrderId = req.params.salesOrderId;
    const result = await ShippingService.getShipmentBySalesOrder(salesOrderId);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipment retrieved for sales order successfully.",
        data: result,
    });
});
const updateShipment = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await ShippingService.updateShipment(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shipment information updated successfully.",
        data: result,
    });
});
const updateShipmentStatus = catchAsync(async (req, res) => {
    const id = req.params.id;
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
