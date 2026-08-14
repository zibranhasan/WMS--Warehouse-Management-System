import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { InventoryService } from "./inventory.service";

// ---------------------------------------------------------------------------
// getStockByWarehouse — GET /inventory/warehouse/:warehouseId
// ---------------------------------------------------------------------------

const getStockByWarehouse = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId } = req.params;
    const result = await InventoryService.getStockByWarehouse(
        warehouseId as string,
        req.query,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Warehouse stock fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

// ---------------------------------------------------------------------------
// getProductStock — GET /inventory/warehouse/:warehouseId/product/:productId
// ---------------------------------------------------------------------------

const getProductStock = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId, productId } = req.params;
    const result = await InventoryService.getProductStock(
        warehouseId as string,
        productId as string,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Product stock fetched successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// adjustStock — POST /inventory/adjust
// ---------------------------------------------------------------------------

const adjustStock = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await InventoryService.adjustStock(req.body, userId);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Stock adjusted successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// getStockMovements — GET /inventory/movements
// ---------------------------------------------------------------------------

const getStockMovements = catchAsync(async (req: Request, res: Response) => {
    const result = await InventoryService.getStockMovements(req.query);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Stock movements fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

// ---------------------------------------------------------------------------
// getProductMovements — GET /inventory/product/:productId/movements
// ---------------------------------------------------------------------------

const getProductMovements = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await InventoryService.getProductMovements(
        productId as string,
        req.query,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Stock movements fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

export const InventoryController = {
    getStockByWarehouse,
    getProductStock,
    adjustStock,
    getStockMovements,
    getProductMovements,
};
