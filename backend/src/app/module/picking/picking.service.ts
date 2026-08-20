import httpStatus from "http-status";
import {
    PickingItemStatus,
    PickingStatus,
    PickingTask,
    Prisma,
    ReservationStatus,
    Role,
    SalesOrderStatus,
    StockMovementType,
    UserStatus,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    pickingFilterableFields,
    pickingSearchableFields,
} from "./picking.constant";
import {
    IAssignPicker,
    ICreatePickingTask,
    IPickItems,
} from "./picking.interface";

// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable picking number (e.g. PICK-2026-000001)
// ---------------------------------------------------------------------------
const generatePickingNumber = async (
    tx: Prisma.TransactionClient,
): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const prefix = `PICK-${currentYear}-`;

    const latestTask = await tx.pickingTask.findFirst({
        where: {
            pickingNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            pickingNumber: true,
        },
    });

    let nextSequence = 1;
    if (latestTask && latestTask.pickingNumber) {
        const parts = latestTask.pickingNumber.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSequence = lastNum + 1;
        }
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
};

// ---------------------------------------------------------------------------
// 1. CREATE PICKING TASK
// ---------------------------------------------------------------------------
const createPickingTask = async (
    payload: ICreatePickingTask,
    userId: string,
) => {
    return await prisma.$transaction(
        async (tx) => {
            // 1. Validate Sales Order
            const salesOrder = await tx.salesOrder.findUnique({
                where: { id: payload.salesOrderId },
                include: {
                    items: true,
                    reservations: {
                        where: { status: ReservationStatus.ACTIVE },
                    },
                },
            });

            if (!salesOrder) {
                throw new AppError(httpStatus.NOT_FOUND, "Sales Order not found.");
            }

            if (salesOrder.status !== SalesOrderStatus.CONFIRMED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Cannot create picking task: Sales Order status is '${salesOrder.status}'. Must be 'CONFIRMED'.`,
                );
            }

            // 2. Prevent duplicate picking task for the same Sales Order
            const existingTask = await tx.pickingTask.findUnique({
                where: { salesOrderId: payload.salesOrderId },
            });

            if (existingTask) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `A picking task (${existingTask.pickingNumber}) already exists for this Sales Order.`,
                );
            }

            // 3. Validate active reservations
            if (salesOrder.reservations.length === 0) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales Order has no active stock reservations to pick.",
                );
            }

            // 4. Generate unique picking number
            const pickingNumber = await generatePickingNumber(tx);

            // 5. Create PickingTask
            const pickingTask = await tx.pickingTask.create({
                data: {
                    pickingNumber,
                    salesOrderId: salesOrder.id,
                    warehouseId: salesOrder.warehouseId,
                    status: PickingStatus.PENDING,
                },
            });

            // 6. Create PickingTaskItems for every item with active reservations
            for (const item of salesOrder.items) {
                const itemReservations = salesOrder.reservations.filter(
                    (res) => res.salesOrderItemId === item.id,
                );

                const totalReserved = itemReservations.reduce(
                    (sum, res) => sum + Number(res.quantity),
                    0,
                );

                if (totalReserved > 0) {
                    await tx.pickingTaskItem.create({
                        data: {
                            pickingTaskId: pickingTask.id,
                            salesOrderItemId: item.id,
                            productId: item.productId,
                            requiredQuantity: new Prisma.Decimal(totalReserved),
                            pickedQuantity: new Prisma.Decimal(0),
                            status: PickingItemStatus.PENDING,
                        },
                    });
                }
            }

            // 7. Return complete task details
            return await tx.pickingTask.findUnique({
                where: { id: pickingTask.id },
                include: {
                    warehouse: true,
                    salesOrder: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

// ---------------------------------------------------------------------------
// 2. GET ALL PICKING TASKS
// ---------------------------------------------------------------------------
const getAllPickingTasks = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<PickingTask>(
        prisma.pickingTask,
        query as IQueryParams,
        {
            searchableFields: pickingSearchableFields,
            filterableFields: pickingFilterableFields,
        },
    )
        .include({
            warehouse: true,
            salesOrder: true,
            assignedTo: {
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
        })
        .search()
        .filter()
        .sort()
        .paginate()
        .fields();

    return await queryBuilder.execute();
};

// ---------------------------------------------------------------------------
// 3. GET PICKING TASK BY ID
// ---------------------------------------------------------------------------
const getPickingTaskById = async (id: string) => {
    const task = await prisma.pickingTask.findUnique({
        where: { id },
        include: {
            warehouse: true,
            salesOrder: true,
            assignedTo: {
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
                    allocations: {
                        include: {
                            locationStock: {
                                include: {
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
                            },
                            pickedBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Picking task not found.");
    }

    // Transform items to include calculated remainingQuantity
    const formattedItems = task.items.map((item) => {
        const requiredQty = Number(item.requiredQuantity);
        const pickedQty = Number(item.pickedQuantity);
        const remainingQty = Math.max(0, requiredQty - pickedQty);

        const formattedAllocations = item.allocations.map((alloc) => {
            const locStock = alloc.locationStock;
            const bin = locStock?.bin;
            const shelf = bin?.shelf;
            const aisle = shelf?.aisle;
            const zone = aisle?.zone;

            return {
                id: alloc.id,
                quantity: Number(alloc.quantity),
                pickedAt: alloc.pickedAt,
                pickedBy: alloc.pickedBy,
                locationStockId: alloc.locationStockId,
                bin: bin
                    ? {
                          id: bin.id,
                          code: bin.code,
                          name: bin.name,
                      }
                    : null,
                shelf: shelf
                    ? {
                          id: shelf.id,
                          code: shelf.code,
                          name: shelf.name,
                      }
                    : null,
                aisle: aisle
                    ? {
                          id: aisle.id,
                          code: aisle.code,
                          name: aisle.name,
                      }
                    : null,
                zone: zone
                    ? {
                          id: zone.id,
                          code: zone.code,
                          name: zone.name,
                      }
                    : null,
            };
        });

        return {
            id: item.id,
            pickingTaskId: item.pickingTaskId,
            salesOrderItemId: item.salesOrderItemId,
            productId: item.productId,
            requiredQuantity: requiredQty,
            pickedQuantity: pickedQty,
            remainingQuantity: remainingQty,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            product: item.product,
            allocations: formattedAllocations,
        };
    });

    return {
        id: task.id,
        pickingNumber: task.pickingNumber,
        salesOrderId: task.salesOrderId,
        warehouseId: task.warehouseId,
        assignedToId: task.assignedToId,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        warehouse: task.warehouse,
        salesOrder: task.salesOrder,
        assignedTo: task.assignedTo,
        items: formattedItems,
    };
};

// ---------------------------------------------------------------------------
// 4. GET PICKING TASK BY SALES ORDER
// ---------------------------------------------------------------------------
const getPickingTaskBySalesOrder = async (salesOrderId: string) => {
    const task = await prisma.pickingTask.findUnique({
        where: { salesOrderId },
        select: { id: true },
    });

    if (!task) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Picking task not found for the specified Sales Order.",
        );
    }

    return await getPickingTaskById(task.id);
};

// ---------------------------------------------------------------------------
// 5. ASSIGN PICKER
// ---------------------------------------------------------------------------
const assignPicker = async (id: string, payload: IAssignPicker) => {
    // Validate target user exists and is active
    const user = await prisma.user.findFirst({
        where: {
            id: payload.assignedToId,
            isDeleted: false,
        },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Target user not found.");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot assign picking task to an inactive user.",
        );
    }

    // Task check & transition
    const task = await prisma.pickingTask.findUnique({
        where: { id },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Picking task not found.");
    }

    if (task.status === PickingStatus.CANCELLED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot assign a cancelled picking task.",
        );
    }

    if (task.status === PickingStatus.PICKED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot assign a completed picking task.",
        );
    }

    const updatedTask = await prisma.pickingTask.update({
        where: { id },
        data: {
            assignedToId: payload.assignedToId,
            status: PickingStatus.ASSIGNED,
        },
        include: {
            warehouse: true,
            salesOrder: true,
            assignedTo: {
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

    return updatedTask;
};

// ---------------------------------------------------------------------------
// 6. START PICKING
// ---------------------------------------------------------------------------
const startPicking = async (id: string) => {
    const task = await prisma.pickingTask.findUnique({
        where: { id },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Picking task not found.");
    }

    if (task.status === PickingStatus.CANCELLED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot start a cancelled picking task.",
        );
    }

    if (task.status === PickingStatus.PICKED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot start an already completed picking task.",
        );
    }

    const updatedTask = await prisma.pickingTask.update({
        where: { id },
        data: {
            status: PickingStatus.IN_PROGRESS,
        },
        include: {
            warehouse: true,
            salesOrder: true,
            assignedTo: {
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

    return updatedTask;
};

// ---------------------------------------------------------------------------
// 7. PICK ITEMS FROM BINS (ATOMIC TRANSACTION WITH ROW LOCKS)
// ---------------------------------------------------------------------------
const pickItems = async (
    id: string,
    payload: IPickItems,
    userId: string,
) => {
    return await prisma.$transaction(
        async (tx) => {
            // Step 1: Lock & re-read picking task to prevent concurrent pick collisions
            await tx.$executeRaw`
                SELECT id FROM picking_tasks WHERE id = ${id} FOR UPDATE
            `;

            const pickingTask = await tx.pickingTask.findUnique({
                where: { id },
                include: {
                    items: true,
                },
            });

            if (!pickingTask) {
                throw new AppError(httpStatus.NOT_FOUND, "Picking task not found.");
            }

            if (pickingTask.status === PickingStatus.CANCELLED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot pick items for a cancelled picking task.",
                );
            }

            if (pickingTask.status === PickingStatus.PICKED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot pick items for an already completed picking task.",
                );
            }

            // Process each item pick request in array
            for (const itemUnit of payload.items) {
                // Rule 2 — Item belonging check
                const taskItem = pickingTask.items.find(
                    (it) => it.id === itemUnit.pickingTaskItemId,
                );

                if (!taskItem) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Picking task item '${itemUnit.pickingTaskItemId}' does not belong to picking task '${id}'.`,
                    );
                }

                // Lock location stock record
                await tx.$executeRaw`
                    SELECT id FROM inventory_location_stocks WHERE id = ${itemUnit.locationStockId} FOR UPDATE
                `;

                const locationStock = await tx.inventoryLocationStock.findUnique({
                    where: { id: itemUnit.locationStockId },
                    include: {
                        bin: true,
                        product: true,
                    },
                });

                if (!locationStock) {
                    throw new AppError(
                        httpStatus.NOT_FOUND,
                        `Location stock record '${itemUnit.locationStockId}' not found.`,
                    );
                }

                // Rule 3 — Product match check
                if (locationStock.productId !== taskItem.productId) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Product mismatch: Location stock product '${locationStock.productId}' does not match required picking product '${taskItem.productId}'.`,
                    );
                }

                // Rule 4 — Warehouse match check
                if (locationStock.warehouseId !== pickingTask.warehouseId) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Warehouse mismatch: Location stock belongs to warehouse '${locationStock.warehouseId}' while picking task is for '${pickingTask.warehouseId}'.`,
                    );
                }

                // Rule 5 — Bin quantity check
                const currentBinQty = Number(locationStock.quantity);
                if (currentBinQty < itemUnit.quantity) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Insufficient stock in selected bin. (Available in Bin: ${currentBinQty}, Requested: ${itemUnit.quantity})`,
                    );
                }

                // Rule 6 — Reserved / Required quantity check
                const requiredQty = Number(taskItem.requiredQuantity);
                const currentPickedQty = Number(taskItem.pickedQuantity);
                const remainingQtyToPick = requiredQty - currentPickedQty;

                if (itemUnit.quantity > remainingQtyToPick) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Cannot pick more than remaining required quantity. (Required: ${requiredQty}, Picked: ${currentPickedQty}, Remaining: ${remainingQtyToPick}, Requested: ${itemUnit.quantity})`,
                    );
                }

                // Step 3 — Decrease InventoryLocationStock
                await tx.inventoryLocationStock.update({
                    where: { id: locationStock.id },
                    data: {
                        quantity: { decrement: itemUnit.quantity },
                    },
                });

                // Step 4 — Increase PickingTaskItem.pickedQuantity & update status
                const newPickedQtyDecimal = new Prisma.Decimal(currentPickedQty).plus(
                    itemUnit.quantity,
                );
                let itemStatus: PickingItemStatus = PickingItemStatus.PARTIALLY_PICKED;
                if (newPickedQtyDecimal.gte(taskItem.requiredQuantity)) {
                    itemStatus = PickingItemStatus.PICKED;
                }

                await tx.pickingTaskItem.update({
                    where: { id: taskItem.id },
                    data: {
                        pickedQuantity: newPickedQtyDecimal,
                        status: itemStatus,
                    },
                });

                // Step 5 — Create picking allocation history
                await tx.pickingAllocation.create({
                    data: {
                        pickingTaskItemId: taskItem.id,
                        locationStockId: locationStock.id,
                        quantity: new Prisma.Decimal(itemUnit.quantity),
                        pickedById: userId,
                    },
                });

                // Step 6 — Create StockMovement OUT
                const existingStock = await tx.inventoryStock.findUnique({
                    where: {
                        warehouseId_productId: {
                            warehouseId: pickingTask.warehouseId,
                            productId: taskItem.productId,
                        },
                    },
                });

                const totalPhysicalStock = existingStock
                    ? existingStock.quantity
                    : new Prisma.Decimal(0);

                await tx.stockMovement.create({
                    data: {
                        warehouseId: pickingTask.warehouseId,
                        productId: taskItem.productId,
                        type: StockMovementType.OUT,
                        quantity: new Prisma.Decimal(itemUnit.quantity),
                        previousStock: totalPhysicalStock,
                        newStock: totalPhysicalStock,
                        reason: "Physical stock picked from bin",
                        reference: pickingTask.pickingNumber,
                        createdById: userId,
                    },
                });

                // Check item-level reservation update
                if (itemStatus === PickingItemStatus.PICKED) {
                    await tx.stockReservation.updateMany({
                        where: {
                            salesOrderId: pickingTask.salesOrderId,
                            salesOrderItemId: taskItem.salesOrderItemId,
                            status: ReservationStatus.ACTIVE,
                        },
                        data: {
                            status: ReservationStatus.CONSUMED,
                        },
                    });
                }
            }

            // Step 7 — Calculate overall task picking status
            const updatedItems = await tx.pickingTaskItem.findMany({
                where: { pickingTaskId: id },
            });

            let totalRequired = new Prisma.Decimal(0);
            let totalPicked = new Prisma.Decimal(0);

            for (const item of updatedItems) {
                totalRequired = totalRequired.plus(item.requiredQuantity);
                totalPicked = totalPicked.plus(item.pickedQuantity);
            }

            let overallStatus: PickingStatus;
            if (totalPicked.gte(totalRequired)) {
                overallStatus = PickingStatus.PICKED;
            } else if (totalPicked.gt(0)) {
                overallStatus = PickingStatus.PARTIALLY_PICKED;
            } else {
                overallStatus = PickingStatus.IN_PROGRESS;
            }

            await tx.pickingTask.update({
                where: { id },
                data: {
                    status: overallStatus,
                },
            });

            // If overall task is PICKED, consume all remaining active reservations for this sales order
            if (overallStatus === PickingStatus.PICKED) {
                await tx.stockReservation.updateMany({
                    where: {
                        salesOrderId: pickingTask.salesOrderId,
                        status: ReservationStatus.ACTIVE,
                    },
                    data: {
                        status: ReservationStatus.CONSUMED,
                    },
                });
            }

            return await tx.pickingTask.findUnique({
                where: { id },
                include: {
                    warehouse: true,
                    salesOrder: true,
                    assignedTo: {
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
                            allocations: true,
                        },
                    },
                },
            });
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

export const PickingService = {
    createPickingTask,
    getAllPickingTasks,
    getPickingTaskById,
    getPickingTaskBySalesOrder,
    assignPicker,
    startPicking,
    pickItems,
};
