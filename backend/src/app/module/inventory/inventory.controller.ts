import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { InventoryLocationService } from "./inventory-location.service";
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
// getInventorySummary — GET /inventory/warehouse/:warehouseId/product/:productId/summary
// ---------------------------------------------------------------------------

const getInventorySummary = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId, productId } = req.params;
    const result = await InventoryService.getInventorySummary(
        warehouseId as string,
        productId as string,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Inventory summary fetched successfully.",
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

// ---------------------------------------------------------------------------
// allocateStock — POST /inventory/locations/allocate
// ---------------------------------------------------------------------------

const allocateStock = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await InventoryLocationService.allocateStock(req.body, userId);

    sendResponse(res, {
        httpStatusCode: httpStatus.CREATED,
        success: true,
        message: "Stock allocated to bin successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// deallocateStock — POST /inventory/locations/deallocate
// ---------------------------------------------------------------------------

const deallocateStock = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await InventoryLocationService.deallocateStock(
        req.body,
        userId,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Stock deallocated from bin successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// transferStock — POST /inventory/locations/transfer
// ---------------------------------------------------------------------------

const transferStock = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await InventoryLocationService.transferStock(
        req.body,
        userId,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Stock transferred between bins successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// getStockByBin — GET /inventory/locations/bin/:binId
// ---------------------------------------------------------------------------

const getStockByBin = catchAsync(async (req: Request, res: Response) => {
    const { binId } = req.params;
    const result = await InventoryLocationService.getStockByBin(binId as string);

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Bin stock fetched successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// getProductLocations — GET /inventory/locations/product/:productId
// ---------------------------------------------------------------------------

const getProductLocations = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await InventoryLocationService.getProductLocations(
        productId as string,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Product locations fetched successfully.",
        data: result,
    });
});

// ---------------------------------------------------------------------------
// getWarehouseLocationStock — GET /inventory/locations/warehouse/:warehouseId
// ---------------------------------------------------------------------------

const getWarehouseLocationStock = catchAsync(
    async (req: Request, res: Response) => {
        const { warehouseId } = req.params;
        const result = await InventoryLocationService.getWarehouseLocationStock(
            warehouseId as string,
            req.query,
        );

        sendResponse(res, {
            httpStatusCode: httpStatus.OK,
            success: true,
            message: "Warehouse location stock fetched successfully.",
            meta: result.meta,
            data: result.data,
        });
    },
);

// ---------------------------------------------------------------------------
// getLocationMovements — GET /inventory/locations/movements
// ---------------------------------------------------------------------------

const getLocationMovements = catchAsync(async (req: Request, res: Response) => {
    const result = await InventoryLocationService.getLocationMovements(
        req.query,
    );

    sendResponse(res, {
        httpStatusCode: httpStatus.OK,
        success: true,
        message: "Location stock movements fetched successfully.",
        meta: result.meta,
        data: result.data,
    });
});

export const InventoryController = {
    getStockByWarehouse,
    getProductStock,
    getInventorySummary,
    adjustStock,
    getStockMovements,
    getProductMovements,
    allocateStock,
    deallocateStock,
    transferStock,
    getStockByBin,
    getProductLocations,
    getWarehouseLocationStock,
    getLocationMovements,
};
