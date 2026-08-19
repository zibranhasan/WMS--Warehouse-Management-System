import httpStatus from "http-status";
import {
    LocationMovementType,
    LocationStatus,
    Prisma,
    ProductStatus,
    WarehouseStatus,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    IAllocateStock,
    IDeallocateStock,
    ITransferStock,
} from "./inventory-location.interface";
import {
    inventoryLocationMovementFilterableFields,
    inventoryLocationMovementSearchableFields,
    inventoryLocationStockFilterableFields,
    inventoryLocationStockSearchableFields,
} from "./inventory.constant";

/**
 * Helper function to validate complete hierarchy for a Bin within a specified Warehouse.
 */
const fetchAndValidateBinHierarchy = async (
    tx: Prisma.TransactionClient,
    binId: string,
    expectedWarehouseId: string,
) => {
    const bin = await tx.bin.findFirst({
        where: { id: binId, isDeleted: false },
        include: {
            shelf: {
                include: {
                    aisle: {
                        include: {
                            zone: {
                                include: {
                                    warehouse: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!bin) {
        throw new AppError(httpStatus.NOT_FOUND, `Bin '${binId}' not found.`);
    }

    if (bin.status !== LocationStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `Bin '${bin.code}' is inactive.`);
    }

    const { shelf } = bin;
    if (!shelf || shelf.isDeleted || shelf.status !== LocationStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Parent shelf for bin '${bin.code}' is inactive or deleted.`,
        );
    }

    const { aisle } = shelf;
    if (!aisle || aisle.isDeleted || aisle.status !== LocationStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Parent aisle for bin '${bin.code}' is inactive or deleted.`,
        );
    }

    const { zone } = aisle;
    if (!zone || zone.isDeleted || zone.status !== LocationStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Parent zone for bin '${bin.code}' is inactive or deleted.`,
        );
    }

    if (zone.warehouseId !== expectedWarehouseId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Bin '${bin.code}' does not belong to warehouse '${expectedWarehouseId}'.`,
        );
    }

    return bin;
};

// ---------------------------------------------------------------------------
// 1. ALLOCATE STOCK TO BIN
// ---------------------------------------------------------------------------
const allocateStock = async (payload: IAllocateStock, userId: string) => {
    return await prisma.$transaction(
        async (tx) => {
            // 1. Validate warehouse
            const warehouse = await tx.warehouse.findUnique({
                where: { id: payload.warehouseId },
            });
            if (!warehouse) {
                throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
            }
            if (warehouse.status !== WarehouseStatus.ACTIVE) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot allocate stock: Warehouse is inactive.",
                );
            }

            // 2. Validate product
            const product = await tx.product.findFirst({
                where: { id: payload.productId, isDeleted: false },
            });
            if (!product) {
                throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
            }
            if (product.status !== ProductStatus.ACTIVE) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot allocate stock: Product is inactive.",
                );
            }

            // 3. Validate hierarchy & bin
            const bin = await fetchAndValidateBinHierarchy(
                tx,
                payload.binId,
                payload.warehouseId,
            );

            // 4. Validate unallocated stock
            const inventoryStock = await tx.inventoryStock.findUnique({
                where: {
                    warehouseId_productId: {
                        warehouseId: payload.warehouseId,
                        productId: payload.productId,
                    },
                },
            });
            const totalStock = inventoryStock ? Number(inventoryStock.quantity) : 0;

            const sumAggregate = await tx.inventoryLocationStock.aggregate({
                where: {
                    warehouseId: payload.warehouseId,
                    productId: payload.productId,
                },
                _sum: { quantity: true },
            });
            const totalAllocated = Number(sumAggregate._sum.quantity ?? 0);
            const unallocatedStock = totalStock - totalAllocated;

            if (payload.quantity > unallocatedStock) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Insufficient unallocated stock for product '${product.name}'. (Total Warehouse Stock: ${totalStock}, Already Allocated: ${totalAllocated}, Unallocated: ${unallocatedStock}, Attempted: ${payload.quantity})`,
                );
            }

            // 5. Validate bin capacity
            const binStockAggregate = await tx.inventoryLocationStock.aggregate({
                where: { binId: payload.binId },
                _sum: { quantity: true },
            });
            const binUsedCapacity = Number(binStockAggregate._sum.quantity ?? 0);

            if (binUsedCapacity + payload.quantity > bin.capacity) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Bin capacity exceeded. (Bin Capacity: ${bin.capacity}, Current Used: ${binUsedCapacity}, Attempted Total: ${binUsedCapacity + payload.quantity})`,
                );
            }

            // 6. Update or create InventoryLocationStock
            const updatedLocationStock = await tx.inventoryLocationStock.upsert({
                where: {
                    binId_productId: {
                        binId: payload.binId,
                        productId: payload.productId,
                    },
                },
                create: {
                    warehouseId: payload.warehouseId,
                    binId: payload.binId,
                    productId: payload.productId,
                    quantity: payload.quantity,
                },
                update: {
                    quantity: { increment: payload.quantity },
                },
                include: {
                    bin: true,
                    product: true,
                },
            });

            // 7. Audit log in InventoryLocationMovement
            const movement = await tx.inventoryLocationMovement.create({
                data: {
                    warehouseId: payload.warehouseId,
                    productId: payload.productId,
                    type: LocationMovementType.ALLOCATE,
                    toBinId: payload.binId,
                    quantity: payload.quantity,
                    reason: payload.reason ?? "Stock allocation to bin",
                    reference: payload.reference ?? `ALLOC-${Date.now()}`,
                    createdById: userId,
                },
            });

            return {
                locationStock: updatedLocationStock,
                movement,
            };
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

// ---------------------------------------------------------------------------
// 2. DEALLOCATE STOCK FROM BIN
// ---------------------------------------------------------------------------
const deallocateStock = async (payload: IDeallocateStock, userId: string) => {
    return await prisma.$transaction(
        async (tx) => {
            // 1. Validate warehouse
            const warehouse = await tx.warehouse.findUnique({
                where: { id: payload.warehouseId },
            });
            if (!warehouse) {
                throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
            }
            if (warehouse.status !== WarehouseStatus.ACTIVE) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot deallocate stock: Warehouse is inactive.",
                );
            }

            // 2. Validate product
            const product = await tx.product.findFirst({
                where: { id: payload.productId, isDeleted: false },
            });
            if (!product) {
                throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
            }

            // 3. Validate hierarchy & bin
            await fetchAndValidateBinHierarchy(
                tx,
                payload.binId,
                payload.warehouseId,
            );

            // 4. Validate existing bin location stock
            const existingLocationStock = await tx.inventoryLocationStock.findUnique({
                where: {
                    binId_productId: {
                        binId: payload.binId,
                        productId: payload.productId,
                    },
                },
            });

            const currentBinStock = existingLocationStock
                ? Number(existingLocationStock.quantity)
                : 0;

            if (currentBinStock < payload.quantity) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Cannot deallocate: Insufficient stock in specified bin. (Current Bin Quantity: ${currentBinStock}, Attempted Deallocation: ${payload.quantity})`,
                );
            }

            // 5. Update InventoryLocationStock
            const updatedLocationStock = await tx.inventoryLocationStock.update({
                where: {
                    binId_productId: {
                        binId: payload.binId,
                        productId: payload.productId,
                    },
                },
                data: {
                    quantity: { decrement: payload.quantity },
                },
                include: {
                    bin: true,
                    product: true,
                },
            });

            // 6. Audit log in InventoryLocationMovement
            const movement = await tx.inventoryLocationMovement.create({
                data: {
                    warehouseId: payload.warehouseId,
                    productId: payload.productId,
                    type: LocationMovementType.DEALLOCATE,
                    fromBinId: payload.binId,
                    quantity: payload.quantity,
                    reason: payload.reason ?? "Stock deallocation from bin",
                    reference: payload.reference ?? `DEALLOC-${Date.now()}`,
                    createdById: userId,
                },
            });

            return {
                locationStock: updatedLocationStock,
                movement,
            };
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

// ---------------------------------------------------------------------------
// 3. BIN-TO-BIN TRANSFER
// ---------------------------------------------------------------------------
const transferStock = async (payload: ITransferStock, userId: string) => {
    return await prisma.$transaction(
        async (tx) => {
            // 1. Validate warehouse
            const warehouse = await tx.warehouse.findUnique({
                where: { id: payload.warehouseId },
            });
            if (!warehouse) {
                throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
            }
            if (warehouse.status !== WarehouseStatus.ACTIVE) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot transfer stock: Warehouse is inactive.",
                );
            }

            // 2. Validate product
            const product = await tx.product.findFirst({
                where: { id: payload.productId, isDeleted: false },
            });
            if (!product) {
                throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
            }
            if (product.status !== ProductStatus.ACTIVE) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot transfer stock: Product is inactive.",
                );
            }

            // 3. Validate source & destination bins hierarchy
            await fetchAndValidateBinHierarchy(
                tx,
                payload.fromBinId,
                payload.warehouseId,
            );
            const toBin = await fetchAndValidateBinHierarchy(
                tx,
                payload.toBinId,
                payload.warehouseId,
            );

            // 4. Validate source bin stock
            const sourceLocationStock = await tx.inventoryLocationStock.findUnique({
                where: {
                    binId_productId: {
                        binId: payload.fromBinId,
                        productId: payload.productId,
                    },
                },
            });
            const sourceCurrentStock = sourceLocationStock
                ? Number(sourceLocationStock.quantity)
                : 0;

            if (sourceCurrentStock < payload.quantity) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Cannot transfer: Insufficient stock in source bin. (Current Quantity: ${sourceCurrentStock}, Attempted Transfer: ${payload.quantity})`,
                );
            }

            // 5. Validate destination bin capacity
            const destAggregate = await tx.inventoryLocationStock.aggregate({
                where: { binId: payload.toBinId },
                _sum: { quantity: true },
            });
            const destUsedCapacity = Number(destAggregate._sum.quantity ?? 0);

            if (destUsedCapacity + payload.quantity > toBin.capacity) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Destination Bin capacity exceeded. (Bin Capacity: ${toBin.capacity}, Current Used: ${destUsedCapacity}, Attempted Transfer Total: ${destUsedCapacity + payload.quantity})`,
                );
            }

            // 6. Decrease source bin stock
            const updatedSourceStock = await tx.inventoryLocationStock.update({
                where: {
                    binId_productId: {
                        binId: payload.fromBinId,
                        productId: payload.productId,
                    },
                },
                data: {
                    quantity: { decrement: payload.quantity },
                },
            });

            // 7. Increase destination bin stock
            const updatedDestStock = await tx.inventoryLocationStock.upsert({
                where: {
                    binId_productId: {
                        binId: payload.toBinId,
                        productId: payload.productId,
                    },
                },
                create: {
                    warehouseId: payload.warehouseId,
                    binId: payload.toBinId,
                    productId: payload.productId,
                    quantity: payload.quantity,
                },
                update: {
                    quantity: { increment: payload.quantity },
                },
                include: {
                    bin: true,
                    product: true,
                },
            });

            // 8. Audit log in InventoryLocationMovement
            const movement = await tx.inventoryLocationMovement.create({
                data: {
                    warehouseId: payload.warehouseId,
                    productId: payload.productId,
                    type: LocationMovementType.TRANSFER,
                    fromBinId: payload.fromBinId,
                    toBinId: payload.toBinId,
                    quantity: payload.quantity,
                    reason: payload.reason ?? "Bin-to-bin stock transfer",
                    reference: payload.reference ?? `TRANSFER-${Date.now()}`,
                    createdById: userId,
                },
            });

            return {
                fromBinStock: updatedSourceStock,
                toBinStock: updatedDestStock,
                movement,
            };
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

// ---------------------------------------------------------------------------
// 4. GET BIN STOCK & CAPACITY
// ---------------------------------------------------------------------------
const getStockByBin = async (binId: string) => {
    const bin = await prisma.bin.findFirst({
        where: { id: binId, isDeleted: false },
        include: {
            shelf: {
                include: {
                    aisle: {
                        include: {
                            zone: {
                                include: {
                                    warehouse: true,
                                },
                            },
                        },
                    },
                },
            },
            inventoryLocationStocks: {
                where: {
                    quantity: { gt: 0 },
                },
                include: {
                    product: true,
                },
            },
        },
    });

    if (!bin) {
        throw new AppError(httpStatus.NOT_FOUND, "Bin not found.");
    }

    const { shelf } = bin;
    const aisle = shelf?.aisle;
    const zone = aisle?.zone;
    const warehouse = zone?.warehouse;

    let usedCapacity = 0;
    const products = bin.inventoryLocationStocks.map((stock) => {
        const qty = Number(stock.quantity);
        usedCapacity += qty;
        return {
            id: stock.id,
            productId: stock.productId,
            product: stock.product,
            quantity: stock.quantity,
        };
    });

    const availableCapacity = Math.max(0, bin.capacity - usedCapacity);

    return {
        bin: {
            id: bin.id,
            code: bin.code,
            name: bin.name,
            description: bin.description,
            status: bin.status,
        },
        warehouse,
        zone: zone ? { id: zone.id, code: zone.code, name: zone.name } : null,
        aisle: aisle ? { id: aisle.id, code: aisle.code, name: aisle.name } : null,
        shelf: shelf ? { id: shelf.id, code: shelf.code, name: shelf.name } : null,
        capacity: bin.capacity,
        usedCapacity,
        availableCapacity,
        products,
    };
};

// ---------------------------------------------------------------------------
// 5. GET PRODUCT LOCATIONS
// ---------------------------------------------------------------------------
const getProductLocations = async (productId: string) => {
    const product = await prisma.product.findFirst({
        where: { id: productId, isDeleted: false },
    });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    const locationStocks = await prisma.inventoryLocationStock.findMany({
        where: {
            productId,
            quantity: { gt: 0 },
        },
        include: {
            warehouse: true,
            bin: {
                include: {
                    shelf: {
                        include: {
                            aisle: {
                                include: {
                                    zone: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    // Group location stock by Warehouse
    const warehouseMap = new Map<string, { warehouse: any; locations: any[] }>();

    for (const loc of locationStocks) {
        const whId = loc.warehouseId;
        if (!warehouseMap.has(whId)) {
            warehouseMap.set(whId, {
                warehouse: loc.warehouse,
                locations: [],
            });
        }

        const bin = loc.bin;
        const shelf = bin.shelf;
        const aisle = shelf?.aisle;
        const zone = aisle?.zone;

        warehouseMap.get(whId)!.locations.push({
            id: loc.id,
            quantity: loc.quantity,
            zone: zone ? { id: zone.id, code: zone.code, name: zone.name } : null,
            aisle: aisle ? { id: aisle.id, code: aisle.code, name: aisle.name } : null,
            shelf: shelf ? { id: shelf.id, code: shelf.code, name: shelf.name } : null,
            bin: { id: bin.id, code: bin.code, name: bin.name },
        });
    }

    return {
        product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
            unit: product.unit,
        },
        warehouseLocations: Array.from(warehouseMap.values()),
    };
};

// ---------------------------------------------------------------------------
// 6. GET WAREHOUSE LOCATION STOCK LIST
// ---------------------------------------------------------------------------
const getWarehouseLocationStock = async (
    warehouseId: string,
    query: Record<string, unknown>,
) => {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
    });

    if (!warehouse) {
        throw new AppError(httpStatus.NOT_FOUND, "Warehouse not found.");
    }

    const filterQuery = { warehouseId, ...query };

    const queryBuilder = new QueryBuilder(
        prisma.inventoryLocationStock,
        filterQuery as unknown as IQueryParams,
        {
            searchableFields: inventoryLocationStockSearchableFields,
            filterableFields: inventoryLocationStockFilterableFields,
        },
    )
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await queryBuilder.execute();
    return result;
};

// ---------------------------------------------------------------------------
// 7. GET LOCATION MOVEMENT AUDIT HISTORY
// ---------------------------------------------------------------------------
const getLocationMovements = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(
        prisma.inventoryLocationMovement,
        query as unknown as IQueryParams,
        {
            searchableFields: inventoryLocationMovementSearchableFields,
            filterableFields: inventoryLocationMovementFilterableFields,
        },
    )
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await queryBuilder.execute();
    return result;
};

export const InventoryLocationService = {
    allocateStock,
    deallocateStock,
    transferStock,
    getStockByBin,
    getProductLocations,
    getWarehouseLocationStock,
    getLocationMovements,
};
