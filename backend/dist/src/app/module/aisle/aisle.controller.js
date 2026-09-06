import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { AisleService } from "./aisle.service";
const createAisle = catchAsync(async (req, res) => {
    const result = await AisleService.createAisle(req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Aisle created successfully.",
        data: result,
    });
});
const getAllAisles = catchAsync(async (req, res) => {
    const warehouseScope = getWarehouseScope(req.user.role, req.user.warehouseId);
    const result = await AisleService.getAllAisles(req.query, warehouseScope);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Aisles retrieved successfully.",
        data: result.data,
        meta: result.meta,
    });
});
const getAisleById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await AisleService.getAisleById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Aisle retrieved successfully.",
        data: result,
    });
});
const getAisleShelves = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await AisleService.getAisleShelves(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Aisle shelves retrieved successfully.",
        data: result,
    });
});
const updateAisle = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await AisleService.updateAisle(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Aisle updated successfully.",
        data: result,
    });
});
const updateAisleStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await AisleService.updateAisleStatus(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Aisle status updated successfully.",
        data: result,
    });
});
const deleteAisle = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await AisleService.deleteAisle(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Aisle deleted successfully.",
        data: result,
    });
});
export const AisleController = {
    createAisle,
    getAllAisles,
    getAisleById,
    getAisleShelves,
    updateAisle,
    updateAisleStatus,
    deleteAisle,
};
