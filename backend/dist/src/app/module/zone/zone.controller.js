import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { ZoneService } from "./zone.service";
const createZone = catchAsync(async (req, res) => {
    const result = await ZoneService.createZone(req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Zone created successfully.",
        data: result,
    });
});
const getAllZones = catchAsync(async (req, res) => {
    const warehouseScope = getWarehouseScope(req.user.role, req.user.warehouseId);
    const result = await ZoneService.getAllZones(req.query, warehouseScope);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zones retrieved successfully.",
        data: result.data,
        meta: result.meta,
    });
});
const getZoneById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ZoneService.getZoneById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone retrieved successfully.",
        data: result,
    });
});
const getZoneAisles = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ZoneService.getZoneAisles(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone aisles retrieved successfully.",
        data: result,
    });
});
const updateZone = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ZoneService.updateZone(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone updated successfully.",
        data: result,
    });
});
const updateZoneStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ZoneService.updateZoneStatus(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone status updated successfully.",
        data: result,
    });
});
const deleteZone = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ZoneService.deleteZone(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone deleted successfully.",
        data: result,
    });
});
export const ZoneController = {
    createZone,
    getAllZones,
    getZoneById,
    getZoneAisles,
    updateZone,
    updateZoneStatus,
    deleteZone,
};
