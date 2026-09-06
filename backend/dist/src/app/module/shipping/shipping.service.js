import httpStatus from "http-status";
import { PackingItemStatus, PackingStatus, SalesOrderStatus, ShipmentStatus, } from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { shippingFilterableFields, shippingSearchableFields, } from "./shipping.constant";
// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable shipment number (e.g. SHIP-2026-000001)
// ---------------------------------------------------------------------------
const generateShipmentNumber = async (tx) => {
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
const getShipmentById = async (id) => {
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
const createShipment = async (payload) => {
    const createdShipmentId = await prisma.$transaction(async (tx) => {
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
            throw new AppError(httpStatus.BAD_REQUEST, "Cannot create shipment for a cancelled Sales Order.");
        }
        // Rule 2 — Validate Sales Order is Packed
        if (!salesOrder.packingTask) {
            throw new AppError(httpStatus.BAD_REQUEST, "Sales order is not ready for shipping. Packing has not been completed.");
        }
        if (salesOrder.packingTask.status !== PackingStatus.PACKED) {
            throw new AppError(httpStatus.BAD_REQUEST, "Sales order is not ready for shipping. Packing has not been completed.");
        }
        // Also verify all PackingTaskItems satisfy packedQuantity >= requiredQuantity
        const packingItems = salesOrder.packingTask.items;
        if (packingItems.length === 0) {
            throw new AppError(httpStatus.BAD_REQUEST, "Sales order is not ready for shipping. Packing has not been completed.");
        }
        const allItemsPacked = packingItems.every((item) => item.status === PackingItemStatus.PACKED ||
            Number(item.packedQuantity) >= Number(item.requiredQuantity));
        if (!allItemsPacked) {
            throw new AppError(httpStatus.BAD_REQUEST, "Sales order is not ready for shipping. Packing has not been completed.");
        }
        // Rule 3 — Prevent Duplicate Shipment
        const existingShipment = await tx.shipment.findUnique({
            where: { salesOrderId: payload.salesOrderId },
        });
        if (existingShipment) {
            throw new AppError(httpStatus.CONFLICT, "Shipment already exists for this sales order.");
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
    }, { maxWait: 10000, timeout: 20000 });
    return await getShipmentById(createdShipmentId);
};
// ---------------------------------------------------------------------------
// 3. GET ALL SHIPMENTS
// ---------------------------------------------------------------------------
const getAllShipments = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.shipment, query, {
        searchableFields: shippingSearchableFields,
        filterableFields: shippingFilterableFields,
    })
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
    })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();
    return await queryBuilder.execute();
};
// ---------------------------------------------------------------------------
// 4. GET SHIPMENT BY SALES ORDER
// ---------------------------------------------------------------------------
const getShipmentBySalesOrder = async (salesOrderId) => {
    const shipment = await prisma.shipment.findUnique({
        where: { salesOrderId },
        select: { id: true },
    });
    if (!shipment) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment not found for the specified Sales Order.");
    }
    return await getShipmentById(shipment.id);
};
// ---------------------------------------------------------------------------
// 5. UPDATE SHIPMENT STATUS
// ---------------------------------------------------------------------------
const updateShipmentStatus = async (id, payload) => {
    const updatedShipmentId = await prisma.$transaction(async (tx) => {
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
        // Terminal state checks
        if (currentStatus === ShipmentStatus.DELIVERED) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cannot change status of a delivered shipment.");
        }
        if (currentStatus === ShipmentStatus.CANCELLED) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cannot change status of a cancelled shipment.");
        }
        // Allowed transitions:
        // READY -> SHIPPED | CANCELLED
        // SHIPPED -> IN_TRANSIT
        // IN_TRANSIT -> DELIVERED
        let isValidTransition = false;
        if (currentStatus === ShipmentStatus.READY) {
            if (targetStatus === ShipmentStatus.SHIPPED ||
                targetStatus === ShipmentStatus.CANCELLED) {
                isValidTransition = true;
            }
        }
        else if (currentStatus === ShipmentStatus.SHIPPED) {
            if (targetStatus === ShipmentStatus.IN_TRANSIT) {
                isValidTransition = true;
            }
        }
        else if (currentStatus === ShipmentStatus.IN_TRANSIT) {
            if (targetStatus === ShipmentStatus.DELIVERED) {
                isValidTransition = true;
            }
        }
        if (!isValidTransition) {
            throw new AppError(httpStatus.BAD_REQUEST, `Invalid shipment status transition from '${currentStatus}' to '${targetStatus}'.`);
        }
        const dataToUpdate = {
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
        }
        else if (targetStatus === ShipmentStatus.DELIVERED) {
            await tx.salesOrder.update({
                where: { id: shipment.salesOrderId },
                data: { status: SalesOrderStatus.DELIVERED },
            });
        }
        return shipment.id;
    }, { maxWait: 10000, timeout: 20000 });
    return await getShipmentById(updatedShipmentId);
};
// ---------------------------------------------------------------------------
// 6. UPDATE SHIPMENT INFORMATION
// ---------------------------------------------------------------------------
const updateShipment = async (id, payload) => {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
    });
    if (!shipment) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment not found.");
    }
    if (shipment.status !== ShipmentStatus.READY) {
        throw new AppError(httpStatus.BAD_REQUEST, `Cannot update shipment information when status is '${shipment.status}'. Modification is only allowed in 'READY' status.`);
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
