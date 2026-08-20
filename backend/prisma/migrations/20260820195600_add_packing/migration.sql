-- CreateEnum
CREATE TYPE "PackingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PARTIALLY_PACKED', 'PACKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackingItemStatus" AS ENUM ('PENDING', 'PARTIALLY_PACKED', 'PACKED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('OPEN', 'PACKED', 'CANCELLED');

-- CreateTable
CREATE TABLE "packing_tasks" (
    "id" TEXT NOT NULL,
    "packingNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "packedById" TEXT,
    "status" "PackingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packing_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_task_items" (
    "id" TEXT NOT NULL,
    "packingTaskId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requiredQuantity" DECIMAL(65,30) NOT NULL,
    "packedQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "PackingItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packing_task_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "packingTaskId" TEXT NOT NULL,
    "packageNumber" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'OPEN',
    "weight" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packingTaskItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "packing_tasks_packingNumber_key" ON "packing_tasks"("packingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "packing_tasks_salesOrderId_key" ON "packing_tasks"("salesOrderId");

-- CreateIndex
CREATE INDEX "packing_tasks_warehouseId_status_idx" ON "packing_tasks"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "packing_task_items_packingTaskId_idx" ON "packing_task_items"("packingTaskId");

-- CreateIndex
CREATE INDEX "packing_task_items_productId_idx" ON "packing_task_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "packing_task_items_packingTaskId_salesOrderItemId_key" ON "packing_task_items"("packingTaskId", "salesOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "packages_packageNumber_key" ON "packages"("packageNumber");

-- CreateIndex
CREATE INDEX "packages_packingTaskId_idx" ON "packages"("packingTaskId");

-- CreateIndex
CREATE INDEX "package_items_packageId_idx" ON "package_items"("packageId");

-- CreateIndex
CREATE INDEX "package_items_packingTaskItemId_idx" ON "package_items"("packingTaskItemId");

-- CreateIndex
CREATE INDEX "package_items_productId_idx" ON "package_items"("productId");

-- AddForeignKey
ALTER TABLE "packing_tasks" ADD CONSTRAINT "packing_tasks_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_tasks" ADD CONSTRAINT "packing_tasks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_tasks" ADD CONSTRAINT "packing_tasks_packedById_fkey" FOREIGN KEY ("packedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_task_items" ADD CONSTRAINT "packing_task_items_packingTaskId_fkey" FOREIGN KEY ("packingTaskId") REFERENCES "packing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_task_items" ADD CONSTRAINT "packing_task_items_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_task_items" ADD CONSTRAINT "packing_task_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_packingTaskId_fkey" FOREIGN KEY ("packingTaskId") REFERENCES "packing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_packingTaskItemId_fkey" FOREIGN KEY ("packingTaskItemId") REFERENCES "packing_task_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
