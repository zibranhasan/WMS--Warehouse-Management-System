import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { ShelfService } from "./shelf.service";
const createShelf = catchAsync(async (req, res) => {
    const result = await ShelfService.createShelf(req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Shelf created successfully.",
        data: result,
    });
});
const getAllShelves = catchAsync(async (req, res) => {
    const warehouseScope = getWarehouseScope(req.user.role, req.user.warehouseId);
    const result = await ShelfService.getAllShelves(req.query, warehouseScope);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelves retrieved successfully.",
        data: result.data,
        meta: result.meta,
    });
});
const getShelfById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ShelfService.getShelfById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf retrieved successfully.",
        data: result,
    });
});
const getShelfBins = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ShelfService.getShelfBins(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf bins retrieved successfully.",
        data: result,
    });
});
const updateShelf = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ShelfService.updateShelf(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf updated successfully.",
        data: result,
    });
});
const updateShelfStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ShelfService.updateShelfStatus(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf status updated successfully.",
        data: result,
    });
});
const deleteShelf = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ShelfService.deleteShelf(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf deleted successfully.",
        data: result,
    });
});
export const ShelfController = {
    createShelf,
    getAllShelves,
    getShelfById,
    getShelfBins,
    updateShelf,
    updateShelfStatus,
    deleteShelf,
};
