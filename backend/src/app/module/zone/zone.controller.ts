import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { ZoneService } from "./zone.service";

const createZone = catchAsync(async (req: Request, res: Response) => {
    const result = await ZoneService.createZone(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Zone created successfully.",
        data: result,
    });
});

const getAllZones = catchAsync(async (req: Request, res: Response) => {
    const warehouseScope = getWarehouseScope(
        req.user.role,
        req.user.warehouseId,
    );
    const result = await ZoneService.getAllZones(req.query, warehouseScope);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zones retrieved successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getZoneById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ZoneService.getZoneById(id as string);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone retrieved successfully.",
        data: result,
    });
});

const getZoneAisles = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ZoneService.getZoneAisles(id as string);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone aisles retrieved successfully.",
        data: result,
    });
});

const updateZone = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ZoneService.updateZone(id as string, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone updated successfully.",
        data: result,
    });
});

const updateZoneStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ZoneService.updateZoneStatus(id as string, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Zone status updated successfully.",
        data: result,
    });
});

const deleteZone = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ZoneService.deleteZone(id as string);

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
