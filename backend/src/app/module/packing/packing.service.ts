import httpStatus from "http-status";
import {
    PackageStatus,
    PackingItemStatus,
    PackingStatus,
    PackingTask,
    PickingItemStatus,
    PickingStatus,
    Prisma,
    SalesOrderStatus,
} from "../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    packingFilterableFields,
    packingSearchableFields,
} from "./packing.constant";
import {
    IAddPackageItems,
    ICreatePackage,
    ICreatePackingTask,
} from "./packing.interface";

// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable packing number (e.g. PACK-2026-000001)
// ---------------------------------------------------------------------------
const generatePackingNumber = async (
    tx: Prisma.TransactionClient,
): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const prefix = `PACK-${currentYear}-`;

    const latestTask = await tx.packingTask.findFirst({
        where: {
            packingNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            packingNumber: true,
        },
    });

    let nextSequence = 1;
    if (latestTask && latestTask.packingNumber) {
        const parts = latestTask.packingNumber.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSequence = lastNum + 1;
        }
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
};

// ---------------------------------------------------------------------------
// Helper: Generate unique human-readable package number (e.g. PKG-2026-000001)
// ---------------------------------------------------------------------------
const generatePackageNumber = async (
    tx: Prisma.TransactionClient,
): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const prefix = `PKG-${currentYear}-`;

    const latestPackage = await tx.package.findFirst({
        where: {
            packageNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            packageNumber: true,
        },
    });

    let nextSequence = 1;
    if (latestPackage && latestPackage.packageNumber) {
        const parts = latestPackage.packageNumber.split("-");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
            nextSequence = lastNum + 1;
        }
    }

    return `${prefix}${String(nextSequence).padStart(6, "0")}`;
};

// ---------------------------------------------------------------------------
// 1. GET PACKING TASK BY ID
// ---------------------------------------------------------------------------
const getPackingTaskById = async (id: string) => {
    const task = await prisma.packingTask.findUnique({
        where: { id },
        include: {
            warehouse: true,
            salesOrder: true,
            packedBy: {
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
            packages: {
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            },
        },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Packing task not found.");
    }

    const formattedItems = task.items.map((item) => {
        const requiredQty = Number(item.requiredQuantity);
        const packedQty = Number(item.packedQuantity);
        const remainingQty = Math.max(0, requiredQty - packedQty);

        return {
            id: item.id,
            packingTaskId: item.packingTaskId,
            salesOrderItemId: item.salesOrderItemId,
            productId: item.productId,
            requiredQuantity: requiredQty,
            packedQuantity: packedQty,
            remainingQuantity: remainingQty,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            product: item.product,
        };
    });

    const formattedPackages = task.packages.map((pkg) => {
        const formattedPackageItems = pkg.items.map((pkgItem) => ({
            id: pkgItem.id,
            packageId: pkgItem.packageId,
            packingTaskItemId: pkgItem.packingTaskItemId,
            productId: pkgItem.productId,
            quantity: Number(pkgItem.quantity),
            createdAt: pkgItem.createdAt,
            updatedAt: pkgItem.updatedAt,
            product: pkgItem.product,
        }));

        return {
            id: pkg.id,
            packingTaskId: pkg.packingTaskId,
            packageNumber: pkg.packageNumber,
            status: pkg.status,
            weight: pkg.weight ? Number(pkg.weight) : null,
            notes: pkg.notes,
            createdAt: pkg.createdAt,
            updatedAt: pkg.updatedAt,
            items: formattedPackageItems,
        };
    });

    return {
        id: task.id,
        packingNumber: task.packingNumber,
        salesOrderId: task.salesOrderId,
        warehouseId: task.warehouseId,
        packedById: task.packedById,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        warehouse: task.warehouse,
        salesOrder: task.salesOrder,
        packedBy: task.packedBy,
        items: formattedItems,
        packages: formattedPackages,
    };
};

// ---------------------------------------------------------------------------
// 2. CREATE PACKING TASK
// ---------------------------------------------------------------------------
const createPackingTask = async (
    payload: ICreatePackingTask,
) => {
    const createdTaskId = await prisma.$transaction(
        async (tx) => {
            // 1. Validate Sales Order
            const salesOrder = await tx.salesOrder.findUnique({
                where: { id: payload.salesOrderId },
                include: {
                    pickingTask: {
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
                    "Sales order is not ready for packing.",
                );
            }

            // 2. Validate PickingTask eligibility
            if (!salesOrder.pickingTask) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for packing.",
                );
            }

            if (salesOrder.pickingTask.status !== PickingStatus.PICKED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for packing.",
                );
            }

            const pickingItems = salesOrder.pickingTask.items;
            if (pickingItems.length === 0) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for packing.",
                );
            }

            const allFullyPicked = pickingItems.every(
                (item) =>
                    item.status === PickingItemStatus.PICKED ||
                    Number(item.pickedQuantity) >= Number(item.requiredQuantity),
            );

            if (!allFullyPicked) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Sales order is not ready for packing.",
                );
            }

            // 3. Prevent duplicate active/existing packing task for this Sales Order
            const existingTask = await tx.packingTask.findUnique({
                where: { salesOrderId: payload.salesOrderId },
            });

            if (existingTask) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `A packing task (${existingTask.packingNumber}) already exists for this Sales Order.`,
                );
            }

            // 4. Generate unique packing number
            const packingNumber = await generatePackingNumber(tx);

            // 5. Create PackingTask
            const packingTask = await tx.packingTask.create({
                data: {
                    packingNumber,
                    salesOrderId: salesOrder.id,
                    warehouseId: salesOrder.warehouseId,
                    status: PackingStatus.PENDING,
                },
            });

            // 6. Create PackingTaskItem for every picked PickingTaskItem
            for (const pItem of pickingItems) {
                const pickedQty = Number(pItem.pickedQuantity);
                if (pickedQty > 0) {
                    await tx.packingTaskItem.create({
                        data: {
                            packingTaskId: packingTask.id,
                            salesOrderItemId: pItem.salesOrderItemId,
                            productId: pItem.productId,
                            requiredQuantity: pItem.pickedQuantity,
                            packedQuantity: new Prisma.Decimal(0),
                            status: PackingItemStatus.PENDING,
                        },
                    });
                }
            }

            return packingTask.id;
        },
        { maxWait: 10000, timeout: 20000 },
    );

    return await getPackingTaskById(createdTaskId);
};

// ---------------------------------------------------------------------------
// 3. GET ALL PACKING TASKS
// ---------------------------------------------------------------------------
const getAllPackingTasks = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder<PackingTask>(
        prisma.packingTask,
        query as IQueryParams,
        {
            searchableFields: packingSearchableFields,
            filterableFields: packingFilterableFields,
        },
    )
        .include({
            warehouse: true,
            salesOrder: true,
            packedBy: {
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
            packages: {
                include: {
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
// 4. GET PACKING TASK BY SALES ORDER
// ---------------------------------------------------------------------------
const getPackingTaskBySalesOrder = async (salesOrderId: string) => {
    const task = await prisma.packingTask.findUnique({
        where: { salesOrderId },
        select: { id: true },
    });

    if (!task) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Packing task not found for the specified Sales Order.",
        );
    }

    return await getPackingTaskById(task.id);
};

// ---------------------------------------------------------------------------
// 5. START PACKING
// ---------------------------------------------------------------------------
const startPacking = async (id: string, userId: string) => {
    const task = await prisma.packingTask.findUnique({
        where: { id },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Packing task not found.");
    }

    if (task.status === PackingStatus.CANCELLED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot start a cancelled packing task.",
        );
    }

    if (task.status === PackingStatus.PACKED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot start an already completed packing task.",
        );
    }

    await prisma.packingTask.update({
        where: { id },
        data: {
            status: PackingStatus.IN_PROGRESS,
            packedById: userId,
        },
    });

    return await getPackingTaskById(id);
};

// ---------------------------------------------------------------------------
// 6. CREATE PACKAGE
// ---------------------------------------------------------------------------
const createPackage = async (id: string, payload: ICreatePackage) => {
    const task = await prisma.packingTask.findUnique({
        where: { id },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Packing task not found.");
    }

    if (
        task.status === PackingStatus.CANCELLED ||
        task.status === PackingStatus.PACKED
    ) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot create package for a cancelled or completed packing task.",
        );
    }

    return await prisma.$transaction(
        async (tx) => {
            const packageNumber = await generatePackageNumber(tx);

            const newPackage = await tx.package.create({
                data: {
                    packingTaskId: id,
                    packageNumber,
                    status: PackageStatus.OPEN,
                    weight: payload.weight != null ? new Prisma.Decimal(payload.weight) : null,
                    notes: payload.notes ?? null,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            return {
                id: newPackage.id,
                packingTaskId: newPackage.packingTaskId,
                packageNumber: newPackage.packageNumber,
                status: newPackage.status,
                weight: newPackage.weight ? Number(newPackage.weight) : null,
                notes: newPackage.notes,
                createdAt: newPackage.createdAt,
                updatedAt: newPackage.updatedAt,
                items: [],
            };
        },
        { maxWait: 10000, timeout: 20000 },
    );
};

// ---------------------------------------------------------------------------
// 7. GET PACKAGES
// ---------------------------------------------------------------------------
const getPackages = async (id: string) => {
    const task = await prisma.packingTask.findUnique({
        where: { id },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Packing task not found.");
    }

    const packages = await prisma.package.findMany({
        where: { packingTaskId: id },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return packages.map((pkg) => ({
        id: pkg.id,
        packingTaskId: pkg.packingTaskId,
        packageNumber: pkg.packageNumber,
        status: pkg.status,
        weight: pkg.weight ? Number(pkg.weight) : null,
        notes: pkg.notes,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
        items: pkg.items.map((pkgItem) => ({
            id: pkgItem.id,
            packageId: pkgItem.packageId,
            packingTaskItemId: pkgItem.packingTaskItemId,
            productId: pkgItem.productId,
            quantity: Number(pkgItem.quantity),
            createdAt: pkgItem.createdAt,
            updatedAt: pkgItem.updatedAt,
            product: pkgItem.product,
        })),
    }));
};

// ---------------------------------------------------------------------------
// 8. ADD ITEMS TO PACKAGE (ATOMIC TRANSACTION)
// ---------------------------------------------------------------------------
const addPackageItems = async (
    id: string,
    packageId: string,
    payload: IAddPackageItems,
) => {
    return await prisma.$transaction(
        async (tx) => {
            // Step 1: Validate PackingTask
            const task = await tx.packingTask.findUnique({
                where: { id },
                include: {
                    items: true,
                },
            });

            if (!task) {
                throw new AppError(httpStatus.NOT_FOUND, "Packing task not found.");
            }

            if (
                task.status === PackingStatus.CANCELLED ||
                task.status === PackingStatus.PACKED
            ) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot add items to a cancelled or completed packing task.",
                );
            }

            // Step 2: Validate Package
            const pkg = await tx.package.findUnique({
                where: { id: packageId },
            });

            if (!pkg) {
                throw new AppError(httpStatus.NOT_FOUND, "Package not found.");
            }

            // Rule 1: Package must belong to PackingTask
            if (pkg.packingTaskId !== id) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    `Package '${packageId}' does not belong to packing task '${id}'.`,
                );
            }

            // Package must be OPEN
            if (pkg.status !== PackageStatus.OPEN) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Cannot add items to a closed package.",
                );
            }

            // Step 3: Process item list
            for (const itemUnit of payload.items) {
                // Rule 2: PackingTaskItem must belong to PackingTask
                const taskItem = task.items.find(
                    (it) => it.id === itemUnit.packingTaskItemId,
                );

                if (!taskItem) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Packing task item '${itemUnit.packingTaskItemId}' does not belong to packing task '${id}'.`,
                    );
                }

                // Rule 3: Requested quantity > 0
                if (itemUnit.quantity <= 0) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        "Requested quantity must be greater than zero.",
                    );
                }

                // Rule 4: Cannot pack more than (requiredQuantity - packedQuantity)
                const requiredQty = Number(taskItem.requiredQuantity);
                const currentPackedQty = Number(taskItem.packedQuantity);
                const remainingQty = requiredQty - currentPackedQty;

                if (itemUnit.quantity > remainingQty) {
                    throw new AppError(
                        httpStatus.BAD_REQUEST,
                        `Cannot pack more than remaining required quantity. (Required: ${requiredQty}, Packed: ${currentPackedQty}, Remaining: ${remainingQty}, Requested: ${itemUnit.quantity})`,
                    );
                }

                // Create PackageItem
                await tx.packageItem.create({
                    data: {
                        packageId: pkg.id,
                        packingTaskItemId: taskItem.id,
                        productId: taskItem.productId,
                        quantity: new Prisma.Decimal(itemUnit.quantity),
                    },
                });

                // Increase PackingTaskItem.packedQuantity & update item status
                const newPackedQtyDecimal = new Prisma.Decimal(currentPackedQty).plus(
                    itemUnit.quantity,
                );
                let itemStatus: PackingItemStatus = PackingItemStatus.PARTIALLY_PACKED;
                if (newPackedQtyDecimal.gte(taskItem.requiredQuantity)) {
                    itemStatus = PackingItemStatus.PACKED;
                }

                await tx.packingTaskItem.update({
                    where: { id: taskItem.id },
                    data: {
                        packedQuantity: newPackedQtyDecimal,
                        status: itemStatus,
                    },
                });
            }

            // Step 4: Recalculate PackingTask status
            const updatedItems = await tx.packingTaskItem.findMany({
                where: { packingTaskId: id },
            });

            let totalRequired = new Prisma.Decimal(0);
            let totalPacked = new Prisma.Decimal(0);

            for (const item of updatedItems) {
                totalRequired = totalRequired.plus(item.requiredQuantity);
                totalPacked = totalPacked.plus(item.packedQuantity);
            }

            let overallStatus: PackingStatus;
            if (totalPacked.gte(totalRequired)) {
                overallStatus = PackingStatus.PACKED;
            } else if (totalPacked.gt(0)) {
                overallStatus = PackingStatus.PARTIALLY_PACKED;
            } else {
                overallStatus = PackingStatus.IN_PROGRESS;
            }

            await tx.packingTask.update({
                where: { id },
                data: {
                    status: overallStatus,
                },
            });
        },
        { maxWait: 10000, timeout: 20000 },
    );

    return await getPackingTaskById(id);
};

// ---------------------------------------------------------------------------
// 9. CLOSE PACKAGE
// ---------------------------------------------------------------------------
const closePackage = async (id: string, packageId: string) => {
    const task = await prisma.packingTask.findUnique({
        where: { id },
    });

    if (!task) {
        throw new AppError(httpStatus.NOT_FOUND, "Packing task not found.");
    }

    const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        include: {
            items: true,
        },
    });

    if (!pkg) {
        throw new AppError(httpStatus.NOT_FOUND, "Package not found.");
    }

    if (pkg.packingTaskId !== id) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Package '${packageId}' does not belong to packing task '${id}'.`,
        );
    }

    if (pkg.status === PackageStatus.PACKED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Package is already closed.",
        );
    }

    if (pkg.items.length === 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot close an empty package. Add at least one item first.",
        );
    }

    const updatedPackage = await prisma.package.update({
        where: { id: packageId },
        data: {
            status: PackageStatus.PACKED,
        },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    return {
        id: updatedPackage.id,
        packingTaskId: updatedPackage.packingTaskId,
        packageNumber: updatedPackage.packageNumber,
        status: updatedPackage.status,
        weight: updatedPackage.weight ? Number(updatedPackage.weight) : null,
        notes: updatedPackage.notes,
        createdAt: updatedPackage.createdAt,
        updatedAt: updatedPackage.updatedAt,
        items: updatedPackage.items.map((pkgItem) => ({
            id: pkgItem.id,
            packageId: pkgItem.packageId,
            packingTaskItemId: pkgItem.packingTaskItemId,
            productId: pkgItem.productId,
            quantity: Number(pkgItem.quantity),
            createdAt: pkgItem.createdAt,
            updatedAt: pkgItem.updatedAt,
            product: pkgItem.product,
        })),
    };
};

export const PackingService = {
    createPackingTask,
    getAllPackingTasks,
    getPackingTaskById,
    getPackingTaskBySalesOrder,
    startPacking,
    createPackage,
    getPackages,
    addPackageItems,
    closePackage,
};
