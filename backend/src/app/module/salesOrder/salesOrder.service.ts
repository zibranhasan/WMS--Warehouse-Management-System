import httpStatus from "http-status";
import {
    Prisma,
    ProductStatus,
    ReservationStatus,
    SalesOrder,
    SalesOrderStatus,
    WarehouseStatus,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { InventoryService } from "../inventory/inventory.service";
import {
    salesOrderFilterableFields,
    salesOrderSearchableFields,
} from "./salesOrder.constant";
import {
    ICancelSalesOrder,
    ICreateSalesOrder,
} from "./salesOrder.interface";

// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable SO number (e.g. SO-2026-000001)
// ---------------------------------------------------------------------------
const generateOrderNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const prefix = `SO-${currentYear}-`;

    const latestSO = await tx.salesOrder.findFirst({
        where: {
            orderNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            orderNumber: true,
        },
    });

    let nextSequence = 1;
    if (latestSO && latestSO.orderNumber) {
        const parts = latestSO.orderNumber.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSequence = lastNum + 1;
        }
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
};

// ---------------------------------------------------------------------------
// createSalesOrder
// ---------------------------------------------------------------------------
const createSalesOrder = async (
    payload: ICreateSalesOrder,
    userId: string,
) => {
    // 1. Validate warehouse
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: payload.warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    if (warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot create sales order for an inactive warehouse.",
        );
    }

    // 2. Validate items
    if (!payload.items || payload.items.length === 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Sales order must contain at least one item.",
        );
    }

    // 3. Check duplicate products in item list
    const productIds = payload.items.map((i) => i.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Duplicate products are not allowed in the same sales order.",
        );
    }

    // 4. Validate products existence, deletion & active status
    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            isDeleted: false,
        },
    });

    if (products.length !== productIds.length) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "One or more products specified in the items were not found.",
        );
    }

    for (const prod of products) {
        if (prod.status !== ProductStatus.ACTIVE) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Product '${prod.name}' is inactive and cannot be ordered.`,
            );
        }
    }

    // 5. Validate positive quantities and unit prices
    for (const item of payload.items) {
        if (item.quantity <= 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Quantity must be greater than zero.",
            );
        }
        if (typeof item.unitPrice !== "number" || isNaN(item.unitPrice) || item.unitPrice <= 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Unit price must be greater than zero.",
            );
        }
    }

    // 6. Execute atomic transaction with concurrency safe row locking & available stock check
    return await prisma.$transaction(
        async (tx) => {
            // Check available stock for EVERY item
            for (const item of payload.items) {
                // Acquire FOR UPDATE row lock on inventory_stocks if record exists
                await tx.$executeRaw`
                    SELECT id FROM inventory_stocks 
                    WHERE "warehouseId" = ${payload.warehouseId} AND "productId" = ${item.productId}
                    FOR UPDATE
                `;

                const availStock = await InventoryService.getAvailableStockTx(
                    tx,
                    payload.warehouseId,
                    item.productId,
                );

                if (item.quantity > availStock.availableStock) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        "Insufficient available stock for product.",
                    );
                }
            }

            // Calculate totals backend-side inside transaction
            let totalAmount = new Prisma.Decimal(0);
            const itemDataList = payload.items.map((item) => {
                const qty = new Prisma.Decimal(item.quantity);
                const price = new Prisma.Decimal(item.unitPrice);
                const totalPrice = qty.mul(price);
                totalAmount = totalAmount.plus(totalPrice);

                return {
                    productId: item.productId,
                    quantity: qty,
                    unitPrice: price,
                    totalPrice,
                    reservedQuantity: qty,
                };
            });

            const orderNumber = await generateOrderNumber(tx);

            const newSO = await tx.salesOrder.create({
                data: {
                    orderNumber,
                    createdById: userId,
                    warehouseId: payload.warehouseId,
                    status: SalesOrderStatus.CONFIRMED,
                    totalAmount,
                    notes: payload.notes ?? null,
                    items: {
                        create: itemDataList,
                    },
                },
                include: {
                    warehouse: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            // Create stock reservations
            const reservationDataList = newSO.items.map((soItem) => ({
                salesOrderId: newSO.id,
                salesOrderItemId: soItem.id,
                warehouseId: payload.warehouseId,
                productId: soItem.productId,
                quantity: soItem.quantity,
                status: ReservationStatus.ACTIVE,
            }));

            await tx.stockReservation.createMany({
                data: reservationDataList,
            });

            // Return full order with reservations included
            return await tx.salesOrder.findUnique({
                where: { id: newSO.id },
                include: {
                    warehouse: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    reservations: true,
                },
            });
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

// ---------------------------------------------------------------------------
// getAllSalesOrders
// ---------------------------------------------------------------------------
const getAllSalesOrders = async (
    query: Record<string, unknown>,
    warehouseScope?: string | null,
) => {
    const queryBuilder = new QueryBuilder<SalesOrder>(
        prisma.salesOrder,
        query as IQueryParams,
        {
            searchableFields: salesOrderSearchableFields,
            filterableFields: salesOrderFilterableFields,
        },
    )
        .include({
            warehouse: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            items: {
                include: {
                    product: true,
                },
            },
            reservations: true,
        });

    if (warehouseScope) {
        queryBuilder.where({ warehouseId: warehouseScope } as never);
    }

    return await queryBuilder
        .search()
        .filter()
        .sort()
        .paginate()
        .fields()
        .execute();
};

// ---------------------------------------------------------------------------
// getSalesOrderById
// ---------------------------------------------------------------------------
const getSalesOrderById = async (id: string) => {
    const salesOrder = await prisma.salesOrder.findUnique({
        where: { id },
        include: {
            warehouse: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            items: {
                include: {
                    product: true,
                },
            },
            reservations: true,
        },
    });

    if (!salesOrder) {
        throw new AppError(httpStatus.NOT_FOUND, "Sales order not found.");
    }

    return salesOrder;
};

// ---------------------------------------------------------------------------
// cancelSalesOrder
// ---------------------------------------------------------------------------
const cancelSalesOrder = async (
    id: string,
    payload: ICancelSalesOrder,
) => {
    const salesOrder = await prisma.salesOrder.findUnique({
        where: { id },
        include: {
            items: true,
            reservations: {
                where: { status: ReservationStatus.ACTIVE },
            },
        },
    });

    if (!salesOrder) {
        throw new AppError(httpStatus.NOT_FOUND, "Sales order not found.");
    }

    if (salesOrder.status === SalesOrderStatus.CANCELLED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Sales order is already cancelled.",
        );
    }

    if (salesOrder.status !== SalesOrderStatus.CONFIRMED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only confirmed sales orders can be cancelled.",
        );
    }

    return await prisma.$transaction(
        async (tx) => {
            // 1. Change reservation status to RELEASED
            await tx.stockReservation.updateMany({
                where: {
                    salesOrderId: id,
                    status: ReservationStatus.ACTIVE,
                },
                data: {
                    status: ReservationStatus.RELEASED,
                },
            });

            // 2. Clear reservedQuantity on SalesOrderItems
            await tx.salesOrderItem.updateMany({
                where: {
                    salesOrderId: id,
                },
                data: {
                    reservedQuantity: new Prisma.Decimal(0),
                },
            });

            // 3. Update SalesOrder status to CANCELLED and record cancellationReason
            const updatedSalesOrder = await tx.salesOrder.update({
                where: { id },
                data: {
                    status: SalesOrderStatus.CANCELLED,
                    cancellationReason: payload.cancellationReason,
                },
                include: {
                    warehouse: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    reservations: true,
                },
            });

            return updatedSalesOrder;
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

export const SalesOrderService = {
    createSalesOrder,
    getAllSalesOrders,
    getSalesOrderById,
    cancelSalesOrder,
};
