import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SupplierService } from "./supplier.service";

const createSupplier = catchAsync(async (req: Request, res: Response) => {
    const result = await SupplierService.createSupplier(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Supplier created successfully.",
        data: result,
    });
});

const getAllSuppliers = catchAsync(async (req: Request, res: Response) => {
    const result = await SupplierService.getAllSuppliers(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Suppliers fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getSupplierById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SupplierService.getSupplierById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Supplier retrieved successfully.",
        data: result,
    });
});

const updateSupplier = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SupplierService.updateSupplier(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Supplier updated successfully.",
        data: result,
    });
});

const updateSupplierStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SupplierService.updateSupplierStatus(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Supplier status updated successfully.",
        data: result,
    });
});

const deleteSupplier = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await SupplierService.deleteSupplier(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Supplier deleted successfully.",
        data: result,
    });
});

export const SupplierController = {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    updateSupplierStatus,
    deleteSupplier,
};
