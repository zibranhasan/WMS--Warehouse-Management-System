-- CreateEnum
CREATE TYPE "PickingStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PARTIALLY_PICKED', 'PICKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PickingItemStatus" AS ENUM ('PENDING', 'PARTIALLY_PICKED', 'PICKED');

-- CreateTable
CREATE TABLE "picking_tasks" (
    "id" TEXT NOT NULL,
    "pickingNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "PickingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "picking_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picking_task_items" (
    "id" TEXT NOT NULL,
    "pickingTaskId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requiredQuantity" DECIMAL(65,30) NOT NULL,
    "pickedQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "PickingItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "picking_task_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picking_allocations" (
    "id" TEXT NOT NULL,
    "pickingTaskItemId" TEXT NOT NULL,
    "locationStockId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "pickedById" TEXT NOT NULL,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "picking_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "picking_tasks_pickingNumber_key" ON "picking_tasks"("pickingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "picking_tasks_salesOrderId_key" ON "picking_tasks"("salesOrderId");

-- CreateIndex
CREATE INDEX "picking_tasks_warehouseId_status_idx" ON "picking_tasks"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "picking_task_items_pickingTaskId_idx" ON "picking_task_items"("pickingTaskId");

-- CreateIndex
CREATE INDEX "picking_task_items_productId_idx" ON "picking_task_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "picking_task_items_pickingTaskId_salesOrderItemId_key" ON "picking_task_items"("pickingTaskId", "salesOrderItemId");

-- CreateIndex
CREATE INDEX "picking_allocations_pickingTaskItemId_idx" ON "picking_allocations"("pickingTaskItemId");

-- CreateIndex
CREATE INDEX "picking_allocations_locationStockId_idx" ON "picking_allocations"("locationStockId");

-- AddForeignKey
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_task_items" ADD CONSTRAINT "picking_task_items_pickingTaskId_fkey" FOREIGN KEY ("pickingTaskId") REFERENCES "picking_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_task_items" ADD CONSTRAINT "picking_task_items_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_task_items" ADD CONSTRAINT "picking_task_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_allocations" ADD CONSTRAINT "picking_allocations_pickingTaskItemId_fkey" FOREIGN KEY ("pickingTaskItemId") REFERENCES "picking_task_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_allocations" ADD CONSTRAINT "picking_allocations_locationStockId_fkey" FOREIGN KEY ("locationStockId") REFERENCES "inventory_location_stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picking_allocations" ADD CONSTRAINT "picking_allocations_pickedById_fkey" FOREIGN KEY ("pickedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
