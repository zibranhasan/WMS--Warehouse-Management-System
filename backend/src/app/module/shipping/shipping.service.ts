import httpStatus from "http-status";
import {
    NotificationType,
    PackingItemStatus,
    PackingStatus,
    Prisma,
    Role,
    SalesOrderStatus,
    Shipment,
    ShipmentStatus,
    UserStatus,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError.js";
import { IQueryParams } from "../../interfaces/query.interface.js";
import { prisma } from "../../lib/prisma.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { NotificationService } from "../notification/notification.service.js";
import {
    shippingFilterableFields,
    shippingSearchableFields,
} from "./shipping.constant.js";
import {
    ICreateShipment,
    IUpdateShipment,
    IUpdateShipmentStatus,
} from "./shipping.interface.js";

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
// Helper: Generate unique human-readable shipment number (e.g. SHIP-2026-000001)
// ---------------------------------------------------------------------------
const generateShipmentNumber = async (
    tx: Prisma.TransactionClient,
): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const prefix = `SHIP-${currentYear}-`;

    const latestShipment = await tx.shipment.findFirst({
        where: {
            shipmentNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            shipmentNumber: true,
        },
    });

    let nextSequence = 1;
    if (latestShipment && latestShipment.shipmentNumber) {
        const parts = latestShipment.shipmentNumber.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSequence = lastNum + 1;
        }
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
};

// ---------------------------------------------------------------------------
// 1. GET SHIPMENT BY ID
// ---------------------------------------------------------------------------
const getShipmentById = async (id: string) => {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
            warehouse: true,
            salesOrder: {
                include: {
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
            },
        },
    });

    if (!shipment) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment not found.");
    }

    return shipment;
};

// ---------------------------------------------------------------------------
// 2. CREATE SHIPMENT
// ---------------------------------------------------------------------------
const createShipment = async (payload: ICreateShipment) => {
    const createdShipmentId = await prisma.$transaction(
        async (tx) => {
            // Rule 1 — Validate Sales Order existence
            const salesOrder = await tx.salesOrder.findUnique({
                where: { id: payload.salesOrderId },
                include: {
                    packingTask: {
                        include: {
                            items: true,
                        },
                    },
                },
            });

            if (!salesOrder) {
                throw new AppError(httpStatus.NOT_FOUND, "Sales Order not found.");
            }

            if (salesOrder.status === SalesOrderStatus.CANCELLED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot create shipment for a cancelled Sales Order.",
                );
            }

            // Rule 2 — Validate Sales Order is Packed
            if (!salesOrder.packingTask) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for shipping. Packing has not been completed.",
                );
            }

            if (salesOrder.packingTask.status !== PackingStatus.PACKED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for shipping. Packing has not been completed.",
                );
            }

            // Also verify all PackingTaskItems satisfy packedQuantity >= requiredQuantity
            const packingItems = salesOrder.packingTask.items;
            if (packingItems.length === 0) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for shipping. Packing has not been completed.",
                );
            }

            const allItemsPacked = packingItems.every(
                (item) =>
                    item.status === PackingItemStatus.PACKED ||
                    Number(item.packedQuantity) >= Number(item.requiredQuantity),
            );

            if (!allItemsPacked) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for shipping. Packing has not been completed.",
                );
            }

            // Rule 3 — Prevent Duplicate Shipment
            const existingShipment = await tx.shipment.findUnique({
                where: { salesOrderId: payload.salesOrderId },
            });

            if (existingShipment) {
                throw new AppError(
                    httpStatus.CONFLICT,
                    "Shipment already exists for this sales order.",
                );
            }

            // Generate unique shipment number
            const shipmentNumber = await generateShipmentNumber(tx);

            // Create Shipment
            const shipment = await tx.shipment.create({
                data: {
                    shipmentNumber,
                    salesOrderId: salesOrder.id,
                    warehouseId: salesOrder.warehouseId,
                    status: ShipmentStatus.READY,
                    shippingMethod: payload.shippingMethod,
                    carrier: payload.carrier ?? null,
                    trackingNumber: payload.trackingNumber ?? null,
                    shippingAddress: payload.shippingAddress,
                    shippingCity: payload.shippingCity,
                    shippingCountry: payload.shippingCountry,
                    shippingPhone: payload.shippingPhone,
                    notes: payload.notes ?? null,
                },
            });

            // Update SalesOrder status to SHIPPED
            await tx.salesOrder.update({
                where: { id: salesOrder.id },
                data: {
                    status: SalesOrderStatus.SHIPPED,
                },
            });

            return shipment.id;
        },
        { maxWait: 10000, timeout: 20000 },
    );

    const createdShipment = await getShipmentById(createdShipmentId);

    // Notify appropriate Warehouse Manager(s) for the Shipment's warehouse
    if (createdShipment) {
        try {
            const warehouseManagers = await prisma.user.findMany({
                where: {
                    warehouseId: createdShipment.warehouseId,
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
                    title: "Shipment Created",
                    message: `Shipment ${createdShipment.shipmentNumber} was created for Sales Order ${createdShipment.salesOrder.orderNumber}.`,
                    entityType: "SHIPMENT",
                    entityId: createdShipment.id,
                });
            }
        } catch (error) {
            console.error(
                `[Notification] Failed to query warehouse managers for shipment ${createdShipment.id}:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    return createdShipment;
};

// ---------------------------------------------------------------------------
// 3. GET ALL SHIPMENTS
// ---------------------------------------------------------------------------
const getAllShipments = async (
    query: Record<string, unknown>,
    warehouseScope?: string | null,
) => {
    // NO_ACCESS: scoped user without an assigned warehouse sees nothing
    if (warehouseScope === "NO_ACCESS") {
        return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    // For scoped users, force warehouse constraint and strip client override
    let enforcedQuery = { ...query };
    if (warehouseScope) {
        delete enforcedQuery.warehouseId;
        enforcedQuery.warehouseId = warehouseScope;
    }

    const queryBuilder = new QueryBuilder<Shipment>(
        prisma.shipment,
        enforcedQuery as IQueryParams,
        {
            searchableFields: shippingSearchableFields,
            filterableFields: shippingFilterableFields,
        },
    )
        .include({
            warehouse: true,
            salesOrder: {
                include: {
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
// 4. GET SHIPMENT BY SALES ORDER
// ---------------------------------------------------------------------------
const getShipmentBySalesOrder = async (salesOrderId: string) => {
    const shipment = await prisma.shipment.findUnique({
        where: { salesOrderId },
        select: { id: true },
    });

    if (!shipment) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Shipment not found for the specified Sales Order.",
        );
    }

    return await getShipmentById(shipment.id);
};

// ---------------------------------------------------------------------------
// 5. UPDATE SHIPMENT STATUS
// ---------------------------------------------------------------------------
const updateShipmentStatus = async (
    id: string,
    payload: IUpdateShipmentStatus,
) => {
    let previousStatus: ShipmentStatus | null = null;

    const updatedShipmentId = await prisma.$transaction(
        async (tx) => {
            const shipment = await tx.shipment.findUnique({
                where: { id },
                include: {
                    salesOrder: true,
                },
            });

            if (!shipment) {
                throw new AppError(httpStatus.NOT_FOUND, "Shipment not found.");
            }

            const currentStatus = shipment.status;
            const targetStatus = payload.status;

            if (currentStatus === targetStatus) {
                return shipment.id;
            }

            previousStatus = currentStatus;

            // Terminal state checks
            if (currentStatus === ShipmentStatus.DELIVERED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot change status of a delivered shipment.",
                );
            }

            if (currentStatus === ShipmentStatus.CANCELLED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot change status of a cancelled shipment.",
                );
            }

            // Allowed transitions:
            // READY -> SHIPPED | CANCELLED
            // SHIPPED -> IN_TRANSIT
            // IN_TRANSIT -> DELIVERED
            let isValidTransition = false;

            if (currentStatus === ShipmentStatus.READY) {
                if (
                    targetStatus === ShipmentStatus.SHIPPED ||
                    targetStatus === ShipmentStatus.CANCELLED
                ) {
                    isValidTransition = true;
                }
            } else if (currentStatus === ShipmentStatus.SHIPPED) {
                if (targetStatus === ShipmentStatus.IN_TRANSIT) {
                    isValidTransition = true;
                }
            } else if (currentStatus === ShipmentStatus.IN_TRANSIT) {
                if (targetStatus === ShipmentStatus.DELIVERED) {
                    isValidTransition = true;
                }
            }

            if (!isValidTransition) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Invalid shipment status transition from '${currentStatus}' to '${targetStatus}'.`,
                );
            }

            const dataToUpdate: Prisma.ShipmentUpdateInput = {
                status: targetStatus,
            };

            if (targetStatus === ShipmentStatus.SHIPPED && !shipment.shippedAt) {
                dataToUpdate.shippedAt = new Date();
            }

            if (targetStatus === ShipmentStatus.DELIVERED && !shipment.deliveredAt) {
                dataToUpdate.deliveredAt = new Date();
            }

            await tx.shipment.update({
                where: { id },
                data: dataToUpdate,
            });

            // Sync SalesOrder status
            if (targetStatus === ShipmentStatus.SHIPPED) {
                await tx.salesOrder.update({
                    where: { id: shipment.salesOrderId },
                    data: { status: SalesOrderStatus.SHIPPED },
                });
            } else if (targetStatus === ShipmentStatus.DELIVERED) {
                await tx.salesOrder.update({
                    where: { id: shipment.salesOrderId },
                    data: { status: SalesOrderStatus.DELIVERED },
                });
            }

            return shipment.id;
        },
        { maxWait: 10000, timeout: 20000 },
    );

    const result = await getShipmentById(updatedShipmentId);

    // Dispatch status-transition notification to Sales Order creator
    if (result && previousStatus && previousStatus !== result.status) {
        try {
            const creator = await prisma.user.findFirst({
                where: {
                    id: result.salesOrder.createdById,
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                },
                select: { id: true },
            });

            if (creator) {
                if (
                    previousStatus === ShipmentStatus.READY &&
                    result.status === ShipmentStatus.SHIPPED
                ) {
                    await safeSendNotification({
                        userId: creator.id,
                        type: NotificationType.SUCCESS,
                        title: "Shipment Shipped",
                        message: `Shipment ${result.shipmentNumber} for Sales Order ${result.salesOrder.orderNumber} has been shipped.`,
                        entityType: "SHIPMENT",
                        entityId: result.id,
                    });
                } else if (
                    previousStatus === ShipmentStatus.SHIPPED &&
                    result.status === ShipmentStatus.IN_TRANSIT
                ) {
                    await safeSendNotification({
                        userId: creator.id,
                        type: NotificationType.INFO,
                        title: "Shipment In Transit",
                        message: `Shipment ${result.shipmentNumber} for Sales Order ${result.salesOrder.orderNumber} is now in transit.`,
                        entityType: "SHIPMENT",
                        entityId: result.id,
                    });
                } else if (
                    previousStatus === ShipmentStatus.IN_TRANSIT &&
                    result.status === ShipmentStatus.DELIVERED
                ) {
                    await safeSendNotification({
                        userId: creator.id,
                        type: NotificationType.SUCCESS,
                        title: "Shipment Delivered",
                        message: `Shipment ${result.shipmentNumber} for Sales Order ${result.salesOrder.orderNumber} has been delivered.`,
                        entityType: "SHIPMENT",
                        entityId: result.id,
                    });
                } else if (
                    previousStatus === ShipmentStatus.READY &&
                    result.status === ShipmentStatus.CANCELLED
                ) {
                    await safeSendNotification({
                        userId: creator.id,
                        type: NotificationType.WARNING,
                        title: "Shipment Cancelled",
                        message: `Shipment ${result.shipmentNumber} for Sales Order ${result.salesOrder.orderNumber} was cancelled.`,
                        entityType: "SHIPMENT",
                        entityId: result.id,
                    });
                }
            }
        } catch (error) {
            console.error(
                `[Notification] Failed to query creator for shipment status transition ${result.id}:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    return result;
};

// ---------------------------------------------------------------------------
// 6. UPDATE SHIPMENT INFORMATION
// ---------------------------------------------------------------------------
const updateShipment = async (id: string, payload: IUpdateShipment) => {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
    });

    if (!shipment) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment not found.");
    }

    if (shipment.status !== ShipmentStatus.READY) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Cannot update shipment information when status is '${shipment.status}'. Modification is only allowed in 'READY' status.`,
        );
    }

    await prisma.shipment.update({
        where: { id },
        data: {
            ...(payload.shippingMethod && { shippingMethod: payload.shippingMethod }),
            ...(payload.carrier !== undefined && { carrier: payload.carrier }),
            ...(payload.trackingNumber !== undefined && { trackingNumber: payload.trackingNumber }),
            ...(payload.shippingAddress && { shippingAddress: payload.shippingAddress }),
            ...(payload.shippingCity && { shippingCity: payload.shippingCity }),
            ...(payload.shippingCountry && { shippingCountry: payload.shippingCountry }),
            ...(payload.shippingPhone && { shippingPhone: payload.shippingPhone }),
            ...(payload.notes !== undefined && { notes: payload.notes }),
        },
    });

    return await getShipmentById(id);
};

export const ShippingService = {
    createShipment,
    getAllShipments,
    getShipmentById,
    getShipmentBySalesOrder,
    updateShipmentStatus,
    updateShipment,
};
