import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ProductService } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const imageUrl = req.file?.path;
    const result = await ProductService.createProduct(req.body, imageUrl);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Product created successfully.",
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.getAllProducts(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Products fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ProductService.getProductById(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Product fetched successfully.",
        data: result,
    });
});

const getProductBySku = catchAsync(async (req: Request, res: Response) => {
    const sku = req.params.sku as string;
    const result = await ProductService.getProductBySku(sku);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Product fetched successfully.",
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const imageUrl = req.file?.path;
    // multipart/form-data delivers booleans as strings — normalise explicitly
    const removeImage = req.body.removeImage === true || req.body.removeImage === "true";
    const result = await ProductService.updateProduct(id, req.body, imageUrl, removeImage);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Product updated successfully.",
        data: result,
    });
});

const updateProductStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ProductService.updateProductStatus(id, req.body);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Product status updated successfully.",
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ProductService.deleteProduct(id);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Product deleted successfully.",
        data: result,
    });
});

export const ProductController = {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySku,
    updateProduct,
    updateProductStatus,
    deleteProduct,
};
