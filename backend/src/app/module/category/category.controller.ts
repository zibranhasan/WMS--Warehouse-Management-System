import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CategoryService } from "./category.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.createCategory(req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Category created successfully.",
        data: result,
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getAllCategories(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Categories fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CategoryService.getCategoryById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Category retrieved successfully.",
        data: result,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CategoryService.updateCategory(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Category updated successfully.",
        data: result,
    });
});

const updateCategoryStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CategoryService.updateCategoryStatus(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Category status updated successfully.",
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CategoryService.deleteCategory(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Category deleted successfully.",
        data: result,
    });
});

export const CategoryController = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,
};
