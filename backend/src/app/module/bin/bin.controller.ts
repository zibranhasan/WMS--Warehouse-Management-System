import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { getWarehouseScope } from "../../utils/warehouseScope";
import { BinService } from "./bin.service";

const createBin = catchAsync(async (req: Request, res: Response) => {
    const result = await BinService.createBin(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Bin created successfully.",
        data: result,
    });
});

const getAllBins = catchAsync(async (req: Request, res: Response) => {
    const warehouseScope = getWarehouseScope(
        req.user.role,
        req.user.warehouseId,
    );
    const result = await BinService.getAllBins(req.query, warehouseScope);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Bins retrieved successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getBinById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BinService.getBinById(id as string);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Bin retrieved successfully.",
        data: result,
    });
});

const updateBin = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BinService.updateBin(id as string, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Bin updated successfully.",
        data: result,
    });
});

const updateBinStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BinService.updateBinStatus(id as string, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Bin status updated successfully.",
        data: result,
    });
});

const deleteBin = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BinService.deleteBin(id as string);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Bin deleted successfully.",
        data: result,
    });
});

export const BinController = {
    createBin,
    getAllBins,
    getBinById,
    updateBin,
    updateBinStatus,
    deleteBin,
};
