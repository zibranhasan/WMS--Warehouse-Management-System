import httpStatus from "http-status";
import {
    NotificationType,
    ProductStatus,
    Prisma,
    PurchaseOrder,
    PurchaseOrderStatus,
    Role,
    SupplierStatus,
    UserStatus,
    WarehouseStatus,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { InventoryService } from "../inventory/inventory.service";
import { NotificationService } from "../notification/notification.service";
import {
    purchaseOrderFilterableFields,
    purchaseOrderSearchableFields,
} from "./purchaseOrder.constant";
import {
    ICancelPurchaseOrder,
    ICreatePurchaseOrder,
    IReceiveGoods,
    IRejectPurchaseOrder,
    IUpdatePurchaseOrder,
} from "./purchaseOrder.interface";

// ---------------------------------------------------------------------------
// Helper: Safe notification dispatcher (non-fatal side effect)
// ---------------------------------------------------------------------------
const safeSendNotification = async (payload: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
}) => {
    try {
        await NotificationService.createNotification(payload);
    } catch (error) {
        console.error(
            `[Notification] Failed to create ${payload.type} notification for user ${payload.userId} (entity: ${payload.entityType}, id: ${payload.entityId}):`,
            error instanceof Error ? error.message : error,
        );
    }
};

// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable PO number (e.g. PO-2026-000001)
// ---------------------------------------------------------------------------
const generatePONumber = async (tx: Prisma.TransactionClient): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const prefix = `PO-${currentYear}-`;

    const latestPO = await tx.purchaseOrder.findFirst({
        where: {
            poNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            poNumber: true,
        },
    });

    let nextSequence = 1;
    if (latestPO && latestPO.poNumber) {
        const parts = latestPO.poNumber.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSequence = lastNum + 1;
        }
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
};

// ---------------------------------------------------------------------------
// createPurchaseOrder
// ---------------------------------------------------------------------------
const createPurchaseOrder = async (
    payload: ICreatePurchaseOrder,
    userId: string,
) => {
    // 1. Validate supplier
    const supplier = await prisma.supplier.findFirst({
        where: { id: payload.supplierId, isDeleted: false },
    });

    if (!supplier) {
        throw new AppError(httpStatus.NOT_FOUND, "Supplier not found.");
    }

    if (supplier.status !== SupplierStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot create purchase order for an inactive supplier.",
        );
    }

    // 2. Validate warehouse
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: payload.warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    if (warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot create purchase order for an inactive warehouse.",
        );
    }

    // 3. Check duplicate products in item list
    const productIds = payload.items.map((i) => i.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Duplicate products are not allowed in the same purchase order.",
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

    // 5. Calculate totals backend-side
    let totalAmount = new Prisma.Decimal(0);
    const itemDataList = payload.items.map((item) => {
        const qty = new Prisma.Decimal(item.orderedQuantity);
        const price = new Prisma.Decimal(item.unitPrice);
        const itemTotal = qty.mul(price);
        totalAmount = totalAmount.plus(itemTotal);

        return {
            productId: item.productId,
            orderedQuantity: qty,
            receivedQuantity: new Prisma.Decimal(0),
            unitPrice: price,
            totalPrice: itemTotal,
        };
    });

    // 6. Execute atomic transaction
    const newPO = await prisma.$transaction(async (tx) => {
        const poNumber = await generatePONumber(tx);

        const createdPO = await tx.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: payload.supplierId,
                warehouseId: payload.warehouseId,
                notes: payload.notes ?? null,
                totalAmount,
                createdById: userId,
                status: PurchaseOrderStatus.PENDING,
                items: {
                    create: itemDataList,
                },
            },
            include: {
                supplier: true,
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

        return createdPO;
    }, {
        maxWait: 10000,
        timeout: 20000,
    });

    // Notify appropriate Warehouse Manager(s) for the PO's warehouse
    try {
        const warehouseManagers = await prisma.user.findMany({
            where: {
                warehouseId: newPO.warehouseId,
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
                title: "Purchase Order Created",
                message: `Purchase Order ${newPO.poNumber} was created and requires review.`,
                entityType: "PURCHASE_ORDER",
                entityId: newPO.id,
            });
        }
    } catch (error) {
        console.error(
            `[Notification] Failed to query warehouse managers for PO ${newPO.id}:`,
            error instanceof Error ? error.message : error,
        );
    }

    return newPO;
};

// ---------------------------------------------------------------------------
// getAllPurchaseOrders
// ---------------------------------------------------------------------------
const getAllPurchaseOrders = async (
    query: Record<string, unknown>,
    warehouseScope?: string | null,
) => {
    const queryBuilder = new QueryBuilder<PurchaseOrder>(
        prisma.purchaseOrder,
        query as IQueryParams,
        {
            searchableFields: purchaseOrderSearchableFields,
            filterableFields: purchaseOrderFilterableFields,
        },
    )
        .include({
            supplier: true,
            warehouse: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            approvedBy: {
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
// getPurchaseOrderById
// ---------------------------------------------------------------------------
const getPurchaseOrderById = async (id: string) => {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            supplier: true,
            warehouse: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            approvedBy: {
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

    if (!po) {
        throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
    }

    return po;
};

// ---------------------------------------------------------------------------
// updatePurchaseOrder (Only when PENDING)
// ---------------------------------------------------------------------------
const updatePurchaseOrder = async (
    id: string,
    payload: IUpdatePurchaseOrder,
    userRole?: Role,
) => {
    const existingPO = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
    });

    if (!existingPO) {
        throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
    }

    if (existingPO.status !== PurchaseOrderStatus.PENDING) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot update Purchase Order with status '${existingPO.status}'. Only PENDING orders can be updated.`,
        );
    }

    let supplierId = existingPO.supplierId;
    if (payload.supplierId && payload.supplierId !== existingPO.supplierId) {
        const supplier = await prisma.supplier.findFirst({
            where: { id: payload.supplierId, isDeleted: false },
        });

        if (!supplier) {
            throw new AppError(httpStatus.NOT_FOUND, "Supplier not found.");
        }

        if (supplier.status !== SupplierStatus.ACTIVE) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Cannot assign an inactive supplier to the purchase order.",
            );
        }
        supplierId = payload.supplierId;
    }

    let warehouseId = existingPO.warehouseId;
    if (payload.warehouseId && payload.warehouseId !== existingPO.warehouseId) {
        // Only SUPER_ADMIN and ADMIN may change the warehouse assignment
        if (userRole !== Role.SUPER_ADMIN && userRole !== Role.ADMIN) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You do not have permission to change the warehouse assignment.",
            );
        }

        const warehouse = await prisma.warehouse.findUnique({
            where: { id: payload.warehouseId },
        });

        if (!warehouse) {
            throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
        }

        if (warehouse.status !== WarehouseStatus.ACTIVE) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Cannot assign an inactive warehouse to the purchase order.",
            );
        }
        warehouseId = payload.warehouseId;
    }

    let totalAmount = existingPO.totalAmount;
    let itemDataList:
        | {
              productId: string;
              orderedQuantity: Prisma.Decimal;
              receivedQuantity: Prisma.Decimal;
              unitPrice: Prisma.Decimal;
              totalPrice: Prisma.Decimal;
          }[]
        | null = null;

    if (payload.items) {
        const productIds = payload.items.map((i) => i.productId);
        const uniqueProductIds = new Set(productIds);
        if (uniqueProductIds.size !== productIds.length) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Duplicate products are not allowed in the same purchase order.",
            );
        }

        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isDeleted: false,
            },
        });

        if (products.length !== productIds.length) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "One or more products specified in items were not found.",
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

        let calculatedTotal = new Prisma.Decimal(0);
        itemDataList = payload.items.map((item) => {
            const qty = new Prisma.Decimal(item.orderedQuantity);
            const price = new Prisma.Decimal(item.unitPrice);
            const itemTotal = qty.mul(price);
            calculatedTotal = calculatedTotal.plus(itemTotal);

            return {
                productId: item.productId,
                orderedQuantity: qty,
                receivedQuantity: new Prisma.Decimal(0),
                unitPrice: price,
                totalPrice: itemTotal,
            };
        });
        totalAmount = calculatedTotal;
    }

    return await prisma.$transaction(async (tx) => {
        if (itemDataList) {
            await tx.purchaseOrderItem.deleteMany({
                where: { purchaseOrderId: id },
            });
        }

        const updatedPO = await tx.purchaseOrder.update({
            where: { id },
            data: {
                supplierId,
                warehouseId,
                notes: payload.notes !== undefined ? payload.notes : existingPO.notes,
                totalAmount,
                ...(itemDataList && {
                    items: {
                        create: itemDataList,
                    },
                }),
            },
            include: {
                supplier: true,
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

        return updatedPO;
    }, {
        maxWait: 10000,
        timeout: 20000,
    });
};

// ---------------------------------------------------------------------------
// approvePurchaseOrder
// ---------------------------------------------------------------------------
const approvePurchaseOrder = async (id: string, userId: string) => {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            supplier: true,
            warehouse: true,
            items: {
                include: { product: true },
            },
        },
    });

    if (!po) {
        throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
    }

    if (po.status !== PurchaseOrderStatus.PENDING) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot approve Purchase Order with status '${po.status}'. Only PENDING orders can be approved.`,
        );
    }

    if (po.createdById === userId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You cannot approve a purchase order you created.",
        );
    }

    if (po.items.length === 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot approve a purchase order with no items.",
        );
    }

    if (po.supplier.isDeleted || po.supplier.status !== SupplierStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot approve purchase order: Supplier is inactive or deleted.",
        );
    }

    if (po.warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot approve purchase order: Warehouse is inactive.",
        );
    }

    for (const item of po.items) {
        if (item.product.isDeleted || item.product.status !== ProductStatus.ACTIVE) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Cannot approve purchase order: Product '${item.product.name}' is inactive or deleted.`,
            );
        }
    }

    const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: {
            status: PurchaseOrderStatus.APPROVED,
            approvedById: userId,
            approvedAt: new Date(),
        },
        include: {
            supplier: true,
            warehouse: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            approvedBy: {
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

    // Notify the creator (Procurement user)
    try {
        const creator = await prisma.user.findFirst({
            where: {
                id: updatedPO.createdById,
                status: UserStatus.ACTIVE,
                isDeleted: false,
            },
            select: { id: true },
        });

        if (creator) {
            await safeSendNotification({
                userId: creator.id,
                type: NotificationType.SUCCESS,
                title: "Purchase Order Approved",
                message: `Purchase Order ${updatedPO.poNumber} has been approved.`,
                entityType: "PURCHASE_ORDER",
                entityId: updatedPO.id,
            });
        }
    } catch (error) {
        console.error(
            `[Notification] Failed to query creator for approved PO ${updatedPO.id}:`,
            error instanceof Error ? error.message : error,
        );
    }

    return updatedPO;
};

// ---------------------------------------------------------------------------
// rejectPurchaseOrder
// ---------------------------------------------------------------------------
const rejectPurchaseOrder = async (
    id: string,
    payload: IRejectPurchaseOrder,
    userId: string,
) => {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
    });

    if (!po) {
        throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
    }

    if (po.status !== PurchaseOrderStatus.PENDING) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot reject Purchase Order with status '${po.status}'. Only PENDING orders can be rejected.`,
        );
    }

    if (po.createdById === userId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You cannot reject a purchase order you created.",
        );
    }

    const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: {
            status: PurchaseOrderStatus.REJECTED,
            rejectionReason: payload.rejectionReason ?? null,
        },
        include: {
            supplier: true,
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

    // Notify the creator (Procurement user)
    try {
        const creator = await prisma.user.findFirst({
            where: {
                id: updatedPO.createdById,
                status: UserStatus.ACTIVE,
                isDeleted: false,
            },
            select: { id: true },
        });

        if (creator) {
            const reasonText = updatedPO.rejectionReason
                ? ` Reason: ${updatedPO.rejectionReason}`
                : "";
            await safeSendNotification({
                userId: creator.id,
                type: NotificationType.WARNING,
                title: "Purchase Order Rejected",
                message: `Purchase Order ${updatedPO.poNumber} was rejected.${reasonText}`,
                entityType: "PURCHASE_ORDER",
                entityId: updatedPO.id,
            });
        }
    } catch (error) {
        console.error(
            `[Notification] Failed to query creator for rejected PO ${updatedPO.id}:`,
            error instanceof Error ? error.message : error,
        );
    }

    return updatedPO;
};

// ---------------------------------------------------------------------------
// cancelPurchaseOrder
// ---------------------------------------------------------------------------
const cancelPurchaseOrder = async (
    id: string,
    payload: ICancelPurchaseOrder,
) => {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
    });

    if (!po) {
        throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
    }

    if (
        po.status !== PurchaseOrderStatus.PENDING &&
        po.status !== PurchaseOrderStatus.APPROVED
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot cancel Purchase Order with status '${po.status}'. Only PENDING or APPROVED orders can be cancelled.`,
        );
    }

    const updatedPO = await prisma.purchaseOrder.update({
        where: { id },
        data: {
            status: PurchaseOrderStatus.CANCELLED,
            cancellationReason: payload.cancellationReason ?? null,
        },
        include: {
            supplier: true,
            warehouse: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            approvedBy: {
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

    return updatedPO;
};

// ---------------------------------------------------------------------------
// receiveGoods — Critical Integration Transaction
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable GRN number (e.g. GRN-2026-000001)
// ---------------------------------------------------------------------------
const generateGRNNumber = async (tx: Prisma.TransactionClient): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const prefix = `GRN-${currentYear}-`;

    const latestReceipt = await tx.goodsReceipt.findFirst({
        where: {
            receiptNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            receiptNumber: true,
        },
    });

    let nextSequence = 1;
    if (latestReceipt && latestReceipt.receiptNumber) {
        const parts = latestReceipt.receiptNumber.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSequence = lastNum + 1;
        }
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
};

// ---------------------------------------------------------------------------
// receiveGoods — Critical Integration Transaction with GoodsReceipt audit history
// ---------------------------------------------------------------------------
const receiveGoods = async (
    id: string,
    payload: IReceiveGoods,
    userId: string,
) => {
    // -----------------------------------------------------------------------
    // Step 0: Pre-validation outside transaction (fast-fail without holding locks/connections)
    // -----------------------------------------------------------------------
    const initialPO = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            warehouse: true,
        },
    });

    if (!initialPO) {
        throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
    }

    if (
        initialPO.status !== PurchaseOrderStatus.APPROVED &&
        initialPO.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot receive goods for Purchase Order with status '${initialPO.status}'. Order must be APPROVED or PARTIALLY_RECEIVED.`,
        );
    }

    if (initialPO.warehouse.status !== WarehouseStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot receive goods: Warehouse is inactive.",
        );
    }

    // Map initial PO items by productId
    const initialPoItemsMap = new Map(initialPO.items.map((item) => [item.productId, item]));

    // Pre-validate all receive items before entering transaction
    for (const rxItem of payload.items) {
        const poItem = initialPoItemsMap.get(rxItem.productId);
        if (!poItem) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Product ID '${rxItem.productId}' is not part of this purchase order.`,
            );
        }

        if (poItem.product.status !== ProductStatus.ACTIVE || poItem.product.isDeleted) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Cannot receive goods: Product '${poItem.product.name}' is inactive or deleted.`,
            );
        }

        const rxQtyVal = rxItem.receivedQuantity ?? rxItem.quantity ?? rxItem.Quantity ?? 0;
        if (typeof rxQtyVal !== "number" || isNaN(rxQtyVal) || rxQtyVal <= 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Received quantity must be greater than zero for product '${poItem.product.name}'.`,
            );
        }

        const currentReceived = poItem.receivedQuantity;
        const newReceived = currentReceived.plus(new Prisma.Decimal(rxQtyVal));

        if (newReceived.greaterThan(poItem.orderedQuantity)) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Received quantity cannot exceed ordered quantity for product '${poItem.product.name}'. (Ordered: ${poItem.orderedQuantity}, Already Received: ${currentReceived}, Attempted: ${rxQtyVal})`,
            );
        }
    }

    // -----------------------------------------------------------------------
    // Atomic Transaction: Minimal lock-holding duration
    // -----------------------------------------------------------------------
    const createdReceiptId = await prisma.$transaction(async (tx) => {
        // 1. Fetch fresh PO with items inside transaction
        const po = await tx.purchaseOrder.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        if (!po) {
            throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
        }

        if (
            po.status !== PurchaseOrderStatus.APPROVED &&
            po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
        ) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Cannot receive goods for Purchase Order with status '${po.status}'. Order must be APPROVED or PARTIALLY_RECEIVED.`,
            );
        }

        // Map PO items by productId
        const poItemsMap = new Map(po.items.map((item) => [item.productId, item]));

        // 2. Validate all receive items against fresh PO state
        for (const rxItem of payload.items) {
            const poItem = poItemsMap.get(rxItem.productId);
            if (!poItem) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Product ID '${rxItem.productId}' is not part of this purchase order.`,
                );
            }

            const rxQtyVal = rxItem.receivedQuantity ?? rxItem.quantity ?? rxItem.Quantity ?? 0;
            const rxQty = new Prisma.Decimal(rxQtyVal);
            const currentReceived = poItem.receivedQuantity;
            const newReceived = currentReceived.plus(rxQty);

            if (newReceived.greaterThan(poItem.orderedQuantity)) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Received quantity cannot exceed ordered quantity for product '${rxItem.productId}'. (Ordered: ${poItem.orderedQuantity}, Already Received: ${currentReceived}, Attempted: ${rxQtyVal})`,
                );
            }
        }

        // 3. Generate receipt number & create GoodsReceipt + GoodsReceiptItems record (no heavy presentation includes)
        const receiptNumber = await generateGRNNumber(tx);
        const receivingReference = payload.reference ?? `GRN-${po.poNumber}`;
        const receivingReason = payload.reason ?? "Goods received from supplier";

        const goodsReceipt = await tx.goodsReceipt.create({
            data: {
                receiptNumber,
                purchaseOrderId: po.id,
                warehouseId: po.warehouseId,
                receivedById: userId,
                reason: receivingReason,
                reference: receivingReference,
                items: {
                    create: payload.items.map((rxItem) => {
                        const rxQtyVal = rxItem.receivedQuantity ?? rxItem.quantity ?? rxItem.Quantity ?? 0;
                        return {
                            productId: rxItem.productId,
                            quantity: new Prisma.Decimal(rxQtyVal),
                        };
                    }),
                },
            },
            select: {
                id: true,
            },
        });

        // 4. Process receiving: sort items by productId for deterministic lock ordering
        const sortedRxItems = [...payload.items].sort((a, b) =>
            a.productId.localeCompare(b.productId),
        );

        const updatedReceivedMap = new Map<string, Prisma.Decimal>();

        for (const rxItem of sortedRxItems) {
            const poItem = poItemsMap.get(rxItem.productId)!;
            const rxQtyVal = rxItem.receivedQuantity ?? rxItem.quantity ?? rxItem.Quantity ?? 0;
            const rxQty = new Prisma.Decimal(rxQtyVal);

            // Trigger Inventory IN adjustment inside transaction (validation pre-performed above)
            await InventoryService.adjustStockTx(
                tx,
                {
                    warehouseId: po.warehouseId,
                    productId: rxItem.productId,
                    type: "IN" as const,
                    quantity: Number(rxQtyVal),
                    reason: receivingReason,
                    reference: receiptNumber,
                },
                userId,
                { skipValidation: true },
            );

            // Update PurchaseOrderItem receivedQuantity
            const newReceived = poItem.receivedQuantity.plus(rxQty);
            updatedReceivedMap.set(poItem.id, newReceived);

            await tx.purchaseOrderItem.update({
                where: { id: poItem.id },
                data: {
                    receivedQuantity: newReceived,
                },
            });
        }

        // 5. Calculate new overall PO receiving status in memory
        let allFullyReceived = true;
        let anyReceived = false;

        for (const item of po.items) {
            const itemReceived = updatedReceivedMap.get(item.id) ?? item.receivedQuantity;
            if (itemReceived.greaterThan(0)) {
                anyReceived = true;
            }
            if (itemReceived.lessThan(item.orderedQuantity)) {
                allFullyReceived = false;
            }
        }

        let newPOStatus: PurchaseOrderStatus = PurchaseOrderStatus.APPROVED;
        if (allFullyReceived) {
            newPOStatus = PurchaseOrderStatus.RECEIVED;
        } else if (anyReceived) {
            newPOStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
        }

        // 6. Update PurchaseOrder status (without heavy presentation includes)
        await tx.purchaseOrder.update({
            where: { id },
            data: {
                status: newPOStatus,
            },
        });

        return goodsReceipt.id;
    }, {
        maxWait: 10000,
        timeout: 20000,
    });

    // -----------------------------------------------------------------------
    // Step 7: Presentation queries executed outside the transaction (locks already released)
    // -----------------------------------------------------------------------
    const finalPO = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    const goodsReceipt = await prisma.goodsReceipt.findUnique({
        where: { id: createdReceiptId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            receivedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    // Notify the creator (Procurement user)
    if (finalPO) {
        try {
            const creator = await prisma.user.findFirst({
                where: {
                    id: finalPO.createdById,
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                },
                select: { id: true },
            });

            if (creator) {
                await safeSendNotification({
                    userId: creator.id,
                    type: NotificationType.SUCCESS,
                    title: "Purchase Order Received",
                    message: `Goods for Purchase Order ${finalPO.poNumber} have been received.`,
                    entityType: "PURCHASE_ORDER",
                    entityId: finalPO.id,
                });
            }
        } catch (error) {
            console.error(
                `[Notification] Failed to query creator for received PO ${finalPO.id}:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    return {
        purchaseOrder: finalPO,
        goodsReceipt,
    };
};

// ---------------------------------------------------------------------------
// getPurchaseOrderReceipts — Fetch receiving audit history for a PO
// ---------------------------------------------------------------------------
const getPurchaseOrderReceipts = async (purchaseOrderId: string) => {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
    });

    if (!po) {
        throw new AppError(httpStatus.NOT_FOUND, "Purchase order not found.");
    }

    const receipts = await prisma.goodsReceipt.findMany({
        where: { purchaseOrderId },
        include: {
            receivedBy: {
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
            warehouse: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return receipts;
};

export const PurchaseOrderService = {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    cancelPurchaseOrder,
    receiveGoods,
    getPurchaseOrderReceipts,
};

