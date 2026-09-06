import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { BrandService } from "./brand.service";
const createBrand = catchAsync(async (req, res) => {
    const result = await BrandService.createBrand(req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Brand created successfully.",
        data: result,
    });
});
const getAllBrands = catchAsync(async (req, res) => {
    const result = await BrandService.getAllBrands(req.query);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Brands fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});
const getBrandById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await BrandService.getBrandById(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Brand retrieved successfully.",
        data: result,
    });
});
const updateBrand = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await BrandService.updateBrand(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Brand updated successfully.",
        data: result,
    });
});
const updateBrandStatus = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await BrandService.updateBrandStatus(id, req.body);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Brand status updated successfully.",
        data: result,
    });
});
const deleteBrand = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await BrandService.deleteBrand(id);
    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Brand deleted successfully.",
        data: result,
    });
});
export const BrandController = {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    updateBrandStatus,
    deleteBrand,
};
