import httpStatus from "http-status";
import { NotificationType, Prisma, ProductStatus, ReservationStatus, Role, SalesOrderStatus, UserStatus, WarehouseStatus, } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { InventoryService } from "../inventory/inventory.service";
import { NotificationService } from "../notification/notification.service";
import { salesOrderFilterableFields, salesOrderSearchableFields, } from "./salesOrder.constant";
// ---------------------------------------------------------------------------
// Helper: Safe notification dispatcher (non-fatal side effect)
// ---------------------------------------------------------------------------
const safeSendNotification = async (payload) => {
    try {
        await NotificationService.createNotification(payload);
    }
    catch (error) {
        console.error(`[Notification] Failed to create ${payload.type} notification for user ${payload.userId} (entity: ${payload.entityType}, id: ${payload.entityId}):`, error instanceof Error ? error.message : error);
    }
};
// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable SO number (e.g. SO-2026-000001)
// ---------------------------------------------------------------------------
const generateOrderNumber = async (tx) => {
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
const createSalesOrder = async (payload, userId) => {
    // 1. Validate warehouse
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: payload.warehouseId },
    });
    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }
    if (warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot create sales order for an inactive warehouse.");
    }
    // 2. Validate items
    if (!payload.items || payload.items.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Sales order must contain at least one item.");
    }
    // 3. Check duplicate products in item list
    const productIds = payload.items.map((i) => i.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
        throw new AppError(httpStatus.BAD_REQUEST, "Duplicate products are not allowed in the same sales order.");
    }
    // 4. Validate products existence, deletion & active status
    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            isDeleted: false,
        },
    });
    if (products.length !== productIds.length) {
        throw new AppError(httpStatus.NOT_FOUND, "One or more products specified in the items were not found.");
    }
    for (const prod of products) {
        if (prod.status !== ProductStatus.ACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, `Product '${prod.name}' is inactive and cannot be ordered.`);
        }
    }
    // 5. Validate positive quantities and unit prices
    for (const item of payload.items) {
        if (item.quantity <= 0) {
            throw new AppError(httpStatus.BAD_REQUEST, "Quantity must be greater than zero.");
        }
        if (typeof item.unitPrice !== "number" || isNaN(item.unitPrice) || item.unitPrice <= 0) {
            throw new AppError(httpStatus.BAD_REQUEST, "Unit price must be greater than zero.");
        }
    }
    // 6. Execute atomic transaction with concurrency safe row locking & available stock check
    const newSO = await prisma.$transaction(async (tx) => {
        // Sort items deterministically by productId ascending before acquiring locks
        const sortedItems = [...payload.items].sort((a, b) => a.productId.localeCompare(b.productId));
        // Check available stock for EVERY item in deterministic order
        for (const item of sortedItems) {
            // Acquire FOR UPDATE row lock on inventory_stocks if record exists
            await tx.$executeRaw `
                    SELECT id FROM inventory_stocks 
                    WHERE "warehouseId" = ${payload.warehouseId} AND "productId" = ${item.productId}
                    FOR UPDATE
                `;
            const availStock = await InventoryService.getAvailableStockTx(tx, payload.warehouseId, item.productId);
            if (item.quantity > availStock.availableStock) {
                throw new AppError(httpStatus.BAD_REQUEST, "Insufficient available stock for product.");
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
        const createdSO = await tx.salesOrder.create({
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
        const reservationDataList = createdSO.items.map((soItem) => ({
            salesOrderId: createdSO.id,
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
            where: { id: createdSO.id },
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
    }, { maxWait: 10000, timeout: 20000 });
    // Notify appropriate Warehouse Manager(s) for the Sales Order's warehouse
    if (newSO) {
        try {
            const warehouseManagers = await prisma.user.findMany({
                where: {
                    warehouseId: newSO.warehouseId,
                    role: Role.WAREHOUSE_MANAGER,
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                },
                select: { id: true },
            });
            for (const manager of warehouseManagers) {
                await safeSendNotification({
                    userId: manager.id,
                    type: NotificationType.INFO,
                    title: "Sales Order Created",
                    message: `Sales Order ${newSO.orderNumber} was created and is ready for fulfillment.`,
                    entityType: "SALES_ORDER",
                    entityId: newSO.id,
                });
            }
        }
        catch (error) {
            console.error(`[Notification] Failed to query warehouse managers for SO ${newSO.id}:`, error instanceof Error ? error.message : error);
        }
    }
    return newSO;
};
// ---------------------------------------------------------------------------
// getAllSalesOrders
// ---------------------------------------------------------------------------
const getAllSalesOrders = async (query, warehouseScope) => {
    const queryBuilder = new QueryBuilder(prisma.salesOrder, query, {
        searchableFields: salesOrderSearchableFields,
        filterableFields: salesOrderFilterableFields,
    })
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
        queryBuilder.where({ warehouseId: warehouseScope });
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
const getSalesOrderById = async (id) => {
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
const cancelSalesOrder = async (id, payload) => {
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
        throw new AppError(httpStatus.BAD_REQUEST, "Sales order is already cancelled.");
    }
    if (salesOrder.status !== SalesOrderStatus.CONFIRMED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Only confirmed sales orders can be cancelled.");
    }
    const updatedSO = await prisma.$transaction(async (tx) => {
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
    }, { maxWait: 10000, timeout: 20000 });
    // Notify the Sales Order creator
    if (updatedSO) {
        try {
            const creator = await prisma.user.findFirst({
                where: {
                    id: updatedSO.createdById,
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                },
                select: { id: true },
            });
            if (creator) {
                const reasonText = updatedSO.cancellationReason
                    ? ` Reason: ${updatedSO.cancellationReason}`
                    : "";
                await safeSendNotification({
                    userId: creator.id,
                    type: NotificationType.WARNING,
                    title: "Sales Order Cancelled",
                    message: `Sales Order ${updatedSO.orderNumber} was cancelled.${reasonText}`,
                    entityType: "SALES_ORDER",
                    entityId: updatedSO.id,
                });
            }
        }
        catch (error) {
            console.error(`[Notification] Failed to query creator for cancelled SO ${updatedSO.id}:`, error instanceof Error ? error.message : error);
        }
    }
    return updatedSO;
};
export const SalesOrderService = {
    createSalesOrder,
    getAllSalesOrders,
    getSalesOrderById,
    cancelSalesOrder,
};
