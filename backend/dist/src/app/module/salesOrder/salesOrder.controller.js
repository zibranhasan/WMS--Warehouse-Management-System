import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { SalesOrderService } from "./salesOrder.service";
const createSalesOrder = catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const result = await SalesOrderService.createSalesOrder(req.body, userId);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Sales order created successfully.",
        data: result,
    });
});
const getAllSalesOrders = catchAsync(async (req, res) => {
    const warehouseScope = getWarehouseScope(req.user.role, req.user.warehouseId);
    const result = await SalesOrderService.getAllSalesOrders(req.query, warehouseScope);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Sales orders fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});
const getSalesOrderById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await SalesOrderService.getSalesOrderById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Sales order retrieved successfully.",
        data: result,
    });
});
const cancelSalesOrder = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await SalesOrderService.cancelSalesOrder(id, req.body);
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
