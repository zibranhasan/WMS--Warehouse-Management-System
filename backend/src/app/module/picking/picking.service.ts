import httpStatus from "http-status";
import {
    NotificationType,
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
import { NotificationService } from "../notification/notification.service";
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
    const newTask = await prisma.$transaction(
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

    // Notify appropriate Warehouse Manager(s) for the Picking Task's warehouse
    if (newTask) {
        try {
            const warehouseManagers = await prisma.user.findMany({
                where: {
                    warehouseId: newTask.warehouseId,
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
                    title: "Picking Task Created",
                    message: `Picking Task ${newTask.pickingNumber} was created for Sales Order ${newTask.salesOrder.orderNumber}.`,
                    entityType: "PICKING_TASK",
                    entityId: newTask.id,
                });
            }
        } catch (error) {
            console.error(
                `[Notification] Failed to query warehouse managers for picking task ${newTask.id}:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    return newTask;
};

// ---------------------------------------------------------------------------
// 2. GET ALL PICKING TASKS
// ---------------------------------------------------------------------------
const getAllPickingTasks = async (
    query: Record<string, unknown>,
    warehouseScope?: string | null,
    userId?: string,
    userRole?: Role,
) => {
    // STAFF restriction: only show tasks assigned to this user, scoped to their warehouse
    let enforcedQuery = { ...query };
    if (userRole === Role.STAFF) {
        if (!userId) {
            return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
        }

        // Strip client-provided overrides — force STAFF restrictions
        delete enforcedQuery.assignedToId;
        delete enforcedQuery.warehouseId;

        // If STAFF user has no warehouse, they can't see anything
        if (!warehouseScope || warehouseScope === "NO_ACCESS") {
            return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
        }

        // Force warehouse scope and assignedToId for STAFF
        enforcedQuery.warehouseId = warehouseScope;
        enforcedQuery.assignedToId = userId;
    }

    const queryBuilder = new QueryBuilder<PickingTask>(
        prisma.pickingTask,
        enforcedQuery as IQueryParams,
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
        });

    if (warehouseScope && warehouseScope !== "NO_ACCESS") {
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

    // Enforce STAFF-only picker eligibility
    if (user.role !== Role.STAFF) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only STAFF users can be assigned as pickers.",
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

    // Enforce same-warehouse: picker must belong to the picking task's warehouse
    if (!user.warehouseId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Picker must be assigned to a warehouse.",
        );
    }

    if (user.warehouseId !== task.warehouseId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Picker must belong to the same warehouse as the picking task.",
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

    // Notify the newly assigned picker
    if (updatedTask.assignedToId) {
        try {
            const picker = await prisma.user.findFirst({
                where: {
                    id: updatedTask.assignedToId,
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                },
                select: { id: true },
            });

            if (picker) {
                await safeSendNotification({
                    userId: picker.id,
                    type: NotificationType.INFO,
                    title: "Picking Task Assigned",
                    message: `You have been assigned Picking Task ${updatedTask.pickingNumber} for Sales Order ${updatedTask.salesOrder.orderNumber}.`,
                    entityType: "PICKING_TASK",
                    entityId: updatedTask.id,
                });
            }
        } catch (error) {
            console.error(
                `[Notification] Failed to query assigned picker for task ${updatedTask.id}:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    return updatedTask;
};

// ---------------------------------------------------------------------------
// 6. START PICKING
// ---------------------------------------------------------------------------
const startPicking = async (id: string, userId: string, userRole: Role) => {
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

    // STAFF can only start tasks assigned to themselves
    if (userRole === Role.STAFF) {
        if (task.assignedToId !== userId) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You can only start a picking task assigned to you.",
            );
        }
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

    // Notify the assigned picker if one exists and is active/non-deleted
    if (updatedTask.assignedToId) {
        try {
            const picker = await prisma.user.findFirst({
                where: {
                    id: updatedTask.assignedToId,
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                },
                select: { id: true },
            });

            if (picker) {
                await safeSendNotification({
                    userId: picker.id,
                    type: NotificationType.INFO,
                    title: "Picking Started",
                    message: `Picking Task ${updatedTask.pickingNumber} has been started for Sales Order ${updatedTask.salesOrder.orderNumber}.`,
                    entityType: "PICKING_TASK",
                    entityId: updatedTask.id,
                });
            }
        } catch (error) {
            console.error(
                `[Notification] Failed to query assigned picker for started task ${updatedTask.id}:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    return updatedTask;
};

// ---------------------------------------------------------------------------
// 7. PICK ITEMS FROM BINS (ATOMIC TRANSACTION WITH ROW LOCKS)
// ---------------------------------------------------------------------------
const pickItems = async (
    id: string,
    payload: IPickItems,
    userId: string,
    userRole: Role,
) => {
    // -----------------------------------------------------------------------
    // Step 0: Pre-validation outside transaction (fast-fail without holding locks/connections)
    // -----------------------------------------------------------------------
    const initialTask = await prisma.pickingTask.findUnique({
        where: { id },
        include: {
            items: true,
        },
    });

    if (!initialTask) {
        throw new AppError(httpStatus.NOT_FOUND, "Picking task not found.");
    }

    if (initialTask.status === PickingStatus.CANCELLED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot pick items for a cancelled picking task.",
        );
    }

    if (initialTask.status === PickingStatus.PICKED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot pick items for an already completed picking task.",
        );
    }

    // STAFF can only pick items for tasks assigned to themselves
    if (userRole === Role.STAFF) {
        if (initialTask.assignedToId !== userId) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "You can only pick items for a task assigned to you.",
            );
        }
    }

    // Validate all items belong to this picking task before acquiring locks
    for (const itemUnit of payload.items) {
        const taskItem = initialTask.items.find(
            (it) => it.id === itemUnit.pickingTaskItemId,
        );
        if (!taskItem) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Picking task item '${itemUnit.pickingTaskItemId}' does not belong to picking task '${id}'.`,
            );
        }
    }

    // -----------------------------------------------------------------------
    // Atomic Transaction: Minimal lock-holding duration
    // -----------------------------------------------------------------------
    await prisma.$transaction(
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

            // STAFF check inside lock
            if (userRole === Role.STAFF) {
                if (pickingTask.assignedToId !== userId) {
                    throw new AppError(
                        httpStatus.FORBIDDEN,
                        "You can only pick items for a task assigned to you.",
                    );
                }
            }

            // Re-validate item membership against fresh task items
            for (const itemUnit of payload.items) {
                const taskItem = pickingTask.items.find(
                    (it) => it.id === itemUnit.pickingTaskItemId,
                );
                if (!taskItem) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Picking task item '${itemUnit.pickingTaskItemId}' does not belong to picking task '${id}'.`,
                    );
                }
            }

            // Establish deterministic productId ascending lock ordering for all affected aggregate inventory_stocks rows
            const distinctProductIds = Array.from(
                new Set(
                    payload.items.map((unit) => {
                        const taskItem = pickingTask.items.find(
                            (it) => it.id === unit.pickingTaskItemId,
                        )!;
                        return taskItem.productId;
                    }),
                ),
            ).sort((a, b) => a.localeCompare(b));

            // Track in-memory stock for correct sequential StockMovement snapshots
            const stockTracker = new Map<string, Prisma.Decimal>();
            // Track which InventoryStock rows have been locked in this transaction
            const lockedStockRows = new Set<string>();

            // Pre-lock and initialize stockTracker for every distinct product in deterministic ascending order in a single query
            for (const productId of distinctProductIds) {
                const stockKey = `${pickingTask.warehouseId}:${productId}`;

                const lockedStocks = await tx.$queryRaw<
                    Array<{ id: string; quantity: Prisma.Decimal | string | number }>
                >`
                    SELECT id, quantity FROM inventory_stocks
                    WHERE "warehouseId" = ${pickingTask.warehouseId}
                      AND "productId" = ${productId}
                    FOR UPDATE
                `;
                lockedStockRows.add(stockKey);

                const existingStock = lockedStocks[0];
                const initialStock = existingStock
                    ? new Prisma.Decimal(existingStock.quantity)
                    : new Prisma.Decimal(0);

                stockTracker.set(stockKey, initialStock);
            }

            // In-memory tracker for picking task item quantities and statuses
            const itemProgressMap = new Map<
                string,
                {
                    pickedQuantity: Prisma.Decimal;
                    requiredQuantity: Prisma.Decimal;
                    status: PickingItemStatus;
                }
            >();

            for (const it of pickingTask.items) {
                itemProgressMap.set(it.id, {
                    pickedQuantity: new Prisma.Decimal(it.pickedQuantity),
                    requiredQuantity: new Prisma.Decimal(it.requiredQuantity),
                    status: it.status,
                });
            }

            for (const itemUnit of payload.items) {
                const taskItem = pickingTask.items.find(
                    (it) => it.id === itemUnit.pickingTaskItemId,
                )!;

                // Lock & fetch location stock in a single combined query
                const lockedLocationStocks = await tx.$queryRaw<
                    Array<{
                        id: string;
                        warehouseId: string;
                        productId: string;
                        quantity: Prisma.Decimal | string | number;
                    }>
                >`
                    SELECT id, "warehouseId", "productId", quantity
                    FROM inventory_location_stocks
                    WHERE id = ${itemUnit.locationStockId}
                    FOR UPDATE
                `;

                const locationStock = lockedLocationStocks[0];

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

                // Rule 6 — Reserved / Required quantity check against current in-progress state
                const currentProgress = itemProgressMap.get(taskItem.id)!;
                const requiredQty = Number(currentProgress.requiredQuantity);
                const currentPickedQty = Number(currentProgress.pickedQuantity);
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
                const newPickedQtyDecimal = currentProgress.pickedQuantity.plus(
                    itemUnit.quantity,
                );
                let itemStatus: PickingItemStatus = PickingItemStatus.PARTIALLY_PICKED;
                if (newPickedQtyDecimal.gte(currentProgress.requiredQuantity)) {
                    itemStatus = PickingItemStatus.PICKED;
                }

                currentProgress.pickedQuantity = newPickedQtyDecimal;
                currentProgress.status = itemStatus;

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

                // Step 6 — Create StockMovement OUT & decrement aggregate InventoryStock
                const stockKey = `${pickingTask.warehouseId}:${taskItem.productId}`;
                const previousStock = stockTracker.get(stockKey)!;
                const newStock = previousStock.minus(itemUnit.quantity);
                stockTracker.set(stockKey, newStock);

                // Enforce invariant: aggregate stock must never go negative
                if (newStock.lessThan(0)) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Insufficient aggregate stock for product '${taskItem.productId}'. (Previous: ${previousStock}, Attempted pick: ${itemUnit.quantity})`,
                    );
                }

                // Decrement the aggregate InventoryStock quantity
                await tx.inventoryStock.update({
                    where: {
                        warehouseId_productId: {
                            warehouseId: pickingTask.warehouseId,
                            productId: taskItem.productId,
                        },
                    },
                    data: {
                        quantity: { decrement: itemUnit.quantity },
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        warehouseId: pickingTask.warehouseId,
                        productId: taskItem.productId,
                        type: StockMovementType.OUT,
                        quantity: new Prisma.Decimal(itemUnit.quantity),
                        previousStock,
                        newStock,
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

            // Step 7 — Calculate overall task picking status from in-memory progress
            let totalRequired = new Prisma.Decimal(0);
            let totalPicked = new Prisma.Decimal(0);

            for (const itemProgress of itemProgressMap.values()) {
                totalRequired = totalRequired.plus(itemProgress.requiredQuantity);
                totalPicked = totalPicked.plus(itemProgress.pickedQuantity);
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
        },
        { maxWait: 10000, timeout: 20000 },
    );

    // Step 8 — Fetch full populated task record outside the transaction (locks already released)
    const finalTask = await prisma.pickingTask.findUnique({
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

    // Notify Sales Order creator ONLY when task transitions to PICKED
    if (finalTask && finalTask.status === PickingStatus.PICKED) {
        try {
            const creator = await prisma.user.findFirst({
                where: {
                    id: finalTask.salesOrder.createdById,
                    status: UserStatus.ACTIVE,
                    isDeleted: false,
                },
                select: { id: true },
            });

            if (creator) {
                await safeSendNotification({
                    userId: creator.id,
                    type: NotificationType.SUCCESS,
                    title: "Picking Completed",
                    message: `Picking Task ${finalTask.pickingNumber} for Sales Order ${finalTask.salesOrder.orderNumber} has been completed.`,
                    entityType: "PICKING_TASK",
                    entityId: finalTask.id,
                });
            }
        } catch (error) {
            console.error(
                `[Notification] Failed to query creator for completed picking task ${finalTask.id}:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    return finalTask;
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
