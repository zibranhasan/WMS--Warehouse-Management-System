import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ShelfService } from "./shelf.service";

const createShelf = catchAsync(async (req: Request, res: Response) => {
    const result = await ShelfService.createShelf(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Shelf created successfully.",
        data: result,
    });
});

const getAllShelves = catchAsync(async (req: Request, res: Response) => {
    const result = await ShelfService.getAllShelves(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelves retrieved successfully.",
        data: result.data,
        meta: result.meta,
    });
});

const getShelfById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ShelfService.getShelfById(id as string);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf retrieved successfully.",
        data: result,
    });
});

const getShelfBins = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ShelfService.getShelfBins(id as string);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf bins retrieved successfully.",
        data: result,
    });
});

const updateShelf = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ShelfService.updateShelf(id as string, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf updated successfully.",
        data: result,
    });
});

const updateShelfStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ShelfService.updateShelfStatus(id as string, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Shelf status updated successfully.",
        data: result,
    });
});

const deleteShelf = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ShelfService.deleteShelf(id as string);

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
