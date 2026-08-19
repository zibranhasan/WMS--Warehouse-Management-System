-- CreateEnum
CREATE TYPE "LocationMovementType" AS ENUM ('ALLOCATE', 'DEALLOCATE', 'TRANSFER');

-- CreateTable
CREATE TABLE "inventory_location_stocks" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_location_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_location_movements" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "LocationMovementType" NOT NULL,
    "fromBinId" TEXT,
    "toBinId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_location_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_location_stocks_warehouseId_idx" ON "inventory_location_stocks"("warehouseId");

-- CreateIndex
CREATE INDEX "inventory_location_stocks_binId_idx" ON "inventory_location_stocks"("binId");

-- CreateIndex
CREATE INDEX "inventory_location_stocks_productId_idx" ON "inventory_location_stocks"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_location_stocks_binId_productId_key" ON "inventory_location_stocks"("binId", "productId");

-- CreateIndex
CREATE INDEX "inventory_location_movements_warehouseId_idx" ON "inventory_location_movements"("warehouseId");

-- CreateIndex
CREATE INDEX "inventory_location_movements_productId_idx" ON "inventory_location_movements"("productId");

-- CreateIndex
CREATE INDEX "inventory_location_movements_fromBinId_idx" ON "inventory_location_movements"("fromBinId");

-- CreateIndex
CREATE INDEX "inventory_location_movements_toBinId_idx" ON "inventory_location_movements"("toBinId");

-- AddForeignKey
ALTER TABLE "inventory_location_stocks" ADD CONSTRAINT "inventory_location_stocks_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location_stocks" ADD CONSTRAINT "inventory_location_stocks_binId_fkey" FOREIGN KEY ("binId") REFERENCES "bins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location_stocks" ADD CONSTRAINT "inventory_location_stocks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location_movements" ADD CONSTRAINT "inventory_location_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location_movements" ADD CONSTRAINT "inventory_location_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location_movements" ADD CONSTRAINT "inventory_location_movements_fromBinId_fkey" FOREIGN KEY ("fromBinId") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location_movements" ADD CONSTRAINT "inventory_location_movements_toBinId_fkey" FOREIGN KEY ("toBinId") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location_movements" ADD CONSTRAINT "inventory_location_movements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
