import httpStatus from "http-status";
import {
    InventoryStock,
    ProductStatus,
    Prisma,
    StockMovement,
    StockMovementType,
    WarehouseStatus,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    inventoryFilterableFields,
    inventorySearchableFields,
    stockMovementFilterableFields,
    stockMovementSearchableFields,
} from "./inventory.constant";
import { IStockAdjustment } from "./inventory.interface";

// ---------------------------------------------------------------------------
// getStockByWarehouse — Get all current stock for a specific warehouse
// ---------------------------------------------------------------------------

const getStockByWarehouse = async (
    warehouseId: string,
    query: Record<string, unknown>,
) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    const queryBuilder = new QueryBuilder<InventoryStock>(
        prisma.inventoryStock,
        query as IQueryParams,
        {
            searchableFields: inventorySearchableFields,
            filterableFields: inventoryFilterableFields,
        },
    )
        .where({ warehouseId })
        .include({ warehouse: true, product: true })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    return await queryBuilder.execute();
};

// ---------------------------------------------------------------------------
// getProductStock — Get stock of a specific product in a warehouse
// ---------------------------------------------------------------------------

const getProductStock = async (warehouseId: string, productId: string) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false },
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    const stock = await prisma.inventoryStock.findUnique({
        where: {
            warehouseId_productId: { warehouseId, productId },
        },
        include: {
            warehouse: true,
            product: true,
        },
    });

    if (!stock) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "No stock record found for this product in the specified warehouse.",
        );
    }

    return {
        warehouseId: stock.warehouseId,
        productId: stock.productId,
        quantity: stock.quantity,
        warehouse: stock.warehouse,
        product: stock.product,
        createdAt: stock.createdAt,
        updatedAt: stock.updatedAt,
    };
};

// ---------------------------------------------------------------------------
// adjustStock — Core business transaction for stock change operations
// Atomically updates InventoryStock & records an immutable StockMovement.
// ---------------------------------------------------------------------------

const adjustStock = async (payload: IStockAdjustment, userId: string) => {
    const { warehouseId, productId, type, quantity, reason, reference } =
        payload;

    // 1. Guard: warehouse must exist and be ACTIVE
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    if (warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot adjust stock for an inactive warehouse.",
        );
    }

    // 2. Guard: product must exist, not be deleted, and be ACTIVE
    const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false },
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    if (product.status !== ProductStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot adjust stock for an inactive product.",
        );
    }

    // 3. Guard: validate quantity constraints according to movement type
    if (type === StockMovementType.IN || type === StockMovementType.OUT) {
        if (quantity <= 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Quantity must be greater than zero for IN and OUT movements.",
            );
        }
    } else if (type === StockMovementType.ADJUSTMENT) {
        if (quantity === 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Quantity cannot be zero for stock adjustment.",
            );
        }
    }

    // 4. Perform atomic stock update inside transaction with row-level safety
    const result = await prisma.$transaction(async (tx) => {
        // Row lock check using SQL FOR UPDATE if stock record exists
        await tx.$executeRaw`
            SELECT id FROM inventory_stocks 
            WHERE "warehouseId" = ${warehouseId} AND "productId" = ${productId}
            FOR UPDATE
        `;

        const existingStock = await tx.inventoryStock.findUnique({
            where: {
                warehouseId_productId: { warehouseId, productId },
            },
        });

        const previousStock: Prisma.Decimal = existingStock
            ? existingStock.quantity
            : new Prisma.Decimal(0);

        let newStock: Prisma.Decimal;

        if (type === StockMovementType.IN) {
            newStock = previousStock.plus(quantity);
        } else if (type === StockMovementType.OUT) {
            newStock = previousStock.minus(quantity);
        } else {
            // ADJUSTMENT: signed adjustment (positive or negative quantity)
            newStock = previousStock.plus(quantity);
        }

        // Enforce invariant: stock quantity must never be negative
        if (newStock.lessThan(0)) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Insufficient stock.",
            );
        }

        const stock = await tx.inventoryStock.upsert({
            where: {
                warehouseId_productId: { warehouseId, productId },
            },
            create: {
                warehouseId,
                productId,
                quantity: newStock,
            },
            update: {
                quantity: newStock,
            },
            include: {
                warehouse: true,
                product: true,
            },
        });

        const movement = await tx.stockMovement.create({
            data: {
                warehouseId,
                productId,
                type,
                quantity: new Prisma.Decimal(quantity),
                previousStock,
                newStock,
                reason: reason ?? null,
                reference: reference ?? null,
                createdById: userId,
            },
            include: {
                warehouse: true,
                product: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return { stock, movement };
    });

    return result;
};

// ---------------------------------------------------------------------------
// getStockMovements — Filterable, paginated audit trail of all stock movements
// ---------------------------------------------------------------------------

const getStockMovements = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<StockMovement>(
        prisma.stockMovement,
        query as IQueryParams,
        {
            searchableFields: stockMovementSearchableFields,
            filterableFields: stockMovementFilterableFields,
        },
    )
        .include({
            warehouse: true,
            product: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    return await queryBuilder.execute();
};

// ---------------------------------------------------------------------------
// getProductMovements — Movement history for a specific product
// ---------------------------------------------------------------------------

const getProductMovements = async (
    productId: string,
    query: Record<string, unknown>,
) => {
    const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false },
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    const queryBuilder = new QueryBuilder<StockMovement>(
        prisma.stockMovement,
        query as IQueryParams,
        {
            searchableFields: stockMovementSearchableFields,
            filterableFields: stockMovementFilterableFields,
        },
    )
        .where({ productId })
        .include({
            warehouse: true,
            product: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    return await queryBuilder.execute();
};

export const InventoryService = {
    getStockByWarehouse,
    getProductStock,
    adjustStock,
    getStockMovements,
    getProductMovements,
};
