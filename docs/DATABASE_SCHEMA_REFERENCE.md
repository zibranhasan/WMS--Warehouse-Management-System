# WMS Database Schema Reference

> **Authoritative Source Notice:** This reference is generated strictly and exclusively from the Prisma schema files located in `backend/prisma/schema/`. No relationships or attributes have been inferred from controllers, services, APIs, or business logic assumptions.

---

## 1. Schema Files

The following 12 Prisma schema files were inspected:

1. `backend/prisma/schema/schema.prisma` (Base configuration, generator & datasource)
2. `backend/prisma/schema/enums.prisma` (Shared enum definitions)
3. `backend/prisma/schema/auth.prisma` (Authentication, user management, and session models)
4. `backend/prisma/schema/physical-structure.prisma` (Warehouse physical hierarchy: Zone, Aisle, Shelf, Bin)
5. `backend/prisma/schema/master-data.prisma` (Core entities: Warehouse, Category, Brand, Product)
6. `backend/prisma/schema/procurement.prisma` (Suppliers, Purchase Orders, Goods Receipts)
7. `backend/prisma/schema/inventory.prisma` (Inventory stock levels and stock movement audit logs)
8. `backend/prisma/schema/sales.prisma` (Sales Orders, Order Items, Stock Reservations)
9. `backend/prisma/schema/picking.prisma` (Picking Tasks, Task Items, Picking Allocations)
10. `backend/prisma/schema/packing.prisma` (Packing Tasks, Task Items, Packages, Package Items)
11. `backend/prisma/schema/shipping.prisma` (Shipment records and tracking)
12. `backend/prisma/schema/system.prisma` (System notifications and audit alerts)

---

## 2. Models

### 2.1 User
- **Table Name:** `users`
- **Schema File:** `backend/prisma/schema/auth.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | None |
| `name` | `String` | Yes | No | No | No | None |
| `email` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `emailVerified` | `Boolean` | Yes | No | No | No | `false` |
| `image` | `String` | No | No | No | No | None |
| `role` | `Role` (Enum) | Yes | No | No | No | `STAFF` |
| `status` | `UserStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `warehouseId` | `String` | No | No | Yes (`Warehouse.id`) | No | None |
| `needPasswordChange` | `Boolean` | Yes | No | No | No | `false` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `warehouseId` -> `Warehouse(id)` (Optional, onDelete: default/none specified, onUpdate: default/none specified)
- **Relations:**
  - `warehouse`: `Warehouse?` (N:1, Optional)
  - `sessions`: `Session[]` (1:N)
  - `accounts`: `Account[]` (1:N)
  - `stockMovements`: `StockMovement[]` (1:N)
  - `createdPurchaseOrders`: `PurchaseOrder[]` (`@relation("POCreatedBy")`, 1:N)
  - `approvedPurchaseOrders`: `PurchaseOrder[]` (`@relation("POApprovedBy")`, 1:N)
  - `inventoryLocationMovements`: `InventoryLocationMovement[]` (1:N)
  - `goodsReceipts`: `GoodsReceipt[]` (`@relation("GoodsReceivedBy")`, 1:N)
  - `createdSalesOrders`: `SalesOrder[]` (`@relation("SOCreatedBy")`, 1:N)
  - `assignedPickingTasks`: `PickingTask[]` (`@relation("PickingTaskAssignedTo")`, 1:N)
  - `pickingAllocations`: `PickingAllocation[]` (1:N)
  - `packedTasks`: `PackingTask[]` (`@relation("PackingTaskPackedBy")`, 1:N)
  - `notifications`: `Notification[]` (1:N)
- **Unique constraints:**
  - `@unique` on `email`
- **Indexes:** None

---

### 2.2 Session
- **Table Name:** `session`
- **Schema File:** `backend/prisma/schema/auth.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | None |
| `expiresAt` | `DateTime` | Yes | No | No | No | None |
| `token` | `String` | Yes | No | No | Yes (`@unique([token])`) | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |
| `ipAddress` | `String` | No | No | No | No | None |
| `userAgent` | `String` | No | No | No | No | None |
| `userId` | `String` | Yes | No | Yes (`User.id`) | No | None |

- **Foreign key details:**
  - `userId` -> `User(id)` (Required, onDelete: `Cascade`, onUpdate: default)
- **Relations:**
  - `user`: `User` (N:1, Required)
- **Unique constraints:**
  - `@@unique([token])`
- **Indexes:**
  - `@@index([userId])`

---

### 2.3 Account
- **Table Name:** `account`
- **Schema File:** `backend/prisma/schema/auth.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | None |
| `accountId` | `String` | Yes | No | No | No | None |
| `providerId` | `String` | Yes | No | No | No | None |
| `userId` | `String` | Yes | No | Yes (`User.id`) | No | None |
| `accessToken` | `String` | No | No | No | No | None |
| `refreshToken` | `String` | No | No | No | No | None |
| `idToken` | `String` | No | No | No | No | None |
| `accessTokenExpiresAt` | `DateTime` | No | No | No | No | None |
| `refreshTokenExpiresAt` | `DateTime` | No | No | No | No | None |
| `scope` | `String` | No | No | No | No | None |
| `password` | `String` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `userId` -> `User(id)` (Required, onDelete: `Cascade`, onUpdate: default)
- **Relations:**
  - `user`: `User` (N:1, Required)
- **Unique constraints:** None
- **Indexes:**
  - `@@index([userId])`

---

### 2.4 Verification
- **Table Name:** `verification`
- **Schema File:** `backend/prisma/schema/auth.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | None |
| `identifier` | `String` | Yes | No | No | No | None |
| `value` | `String` | Yes | No | No | No | None |
| `expiresAt` | `DateTime` | Yes | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:** None
- **Relations:** None
- **Unique constraints:** None
- **Indexes:**
  - `@@index([identifier])`

---

### 2.5 Zone
- **Table Name:** `zones`
- **Schema File:** `backend/prisma/schema/physical-structure.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No (Composite) | None |
| `code` | `String` | Yes | No | No | No (Composite) | None |
| `name` | `String` | Yes | No | No | No | None |
| `description` | `String` | No | No | No | No | None |
| `capacity` | `Int` | Yes | No | No | No | `0` |
| `status` | `LocationStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `warehouse`: `Warehouse` (N:1, Required)
  - `aisles`: `Aisle[]` (1:N)
- **Unique constraints:**
  - `@@unique([warehouseId, code])`
- **Indexes:** None

---

### 2.6 Aisle
- **Table Name:** `aisles`
- **Schema File:** `backend/prisma/schema/physical-structure.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `zoneId` | `String` | Yes | No | Yes (`Zone.id`) | No (Composite) | None |
| `code` | `String` | Yes | No | No | No (Composite) | None |
| `name` | `String` | Yes | No | No | No | None |
| `description` | `String` | No | No | No | No | None |
| `capacity` | `Int` | Yes | No | No | No | `0` |
| `status` | `LocationStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `zoneId` -> `Zone(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `zone`: `Zone` (N:1, Required)
  - `shelves`: `Shelf[]` (1:N)
- **Unique constraints:**
  - `@@unique([zoneId, code])`
- **Indexes:** None

---

### 2.7 Shelf
- **Table Name:** `shelves`
- **Schema File:** `backend/prisma/schema/physical-structure.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `aisleId` | `String` | Yes | No | Yes (`Aisle.id`) | No (Composite) | None |
| `code` | `String` | Yes | No | No | No (Composite) | None |
| `name` | `String` | Yes | No | No | No | None |
| `description` | `String` | No | No | No | No | None |
| `capacity` | `Int` | Yes | No | No | No | `0` |
| `status` | `LocationStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `aisleId` -> `Aisle(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `aisle`: `Aisle` (N:1, Required)
  - `bins`: `Bin[]` (1:N)
- **Unique constraints:**
  - `@@unique([aisleId, code])`
- **Indexes:** None

---

### 2.8 Bin
- **Table Name:** `bins`
- **Schema File:** `backend/prisma/schema/physical-structure.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `shelfId` | `String` | Yes | No | Yes (`Shelf.id`) | No (Composite) | None |
| `code` | `String` | Yes | No | No | No (Composite) | None |
| `name` | `String` | Yes | No | No | No | None |
| `description` | `String` | No | No | No | No | None |
| `capacity` | `Int` | Yes | No | No | No | `0` |
| `status` | `LocationStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `shelfId` -> `Shelf(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `shelf`: `Shelf` (N:1, Required)
  - `inventoryLocationStocks`: `InventoryLocationStock[]` (1:N)
  - `fromLocationMovements`: `InventoryLocationMovement[]` (`@relation("FromBinLocationMovements")`, 1:N)
  - `toLocationMovements`: `InventoryLocationMovement[]` (`@relation("ToBinLocationMovements")`, 1:N)
- **Unique constraints:**
  - `@@unique([shelfId, code])`
- **Indexes:** None

---

### 2.9 Warehouse
- **Table Name:** `warehouses`
- **Schema File:** `backend/prisma/schema/master-data.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `code` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `name` | `String` | Yes | No | No | No | None |
| `description` | `String` | No | No | No | No | None |
| `address` | `String` | No | No | No | No | None |
| `city` | `String` | No | No | No | No | None |
| `country` | `String` | No | No | No | No | None |
| `status` | `WarehouseStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:** None
- **Relations:**
  - `users`: `User[]` (1:N)
  - `inventoryStocks`: `InventoryStock[]` (1:N)
  - `stockMovements`: `StockMovement[]` (1:N)
  - `purchaseOrders`: `PurchaseOrder[]` (1:N)
  - `zones`: `Zone[]` (1:N)
  - `inventoryLocationStocks`: `InventoryLocationStock[]` (1:N)
  - `inventoryLocationMovements`: `InventoryLocationMovement[]` (1:N)
  - `goodsReceipts`: `GoodsReceipt[]` (1:N)
  - `salesOrders`: `SalesOrder[]` (1:N)
  - `stockReservations`: `StockReservation[]` (1:N)
  - `pickingTasks`: `PickingTask[]` (1:N)
  - `packingTasks`: `PackingTask[]` (1:N)
  - `shipments`: `Shipment[]` (1:N)
- **Unique constraints:**
  - `@unique` on `code`
- **Indexes:** None

---

### 2.10 Category
- **Table Name:** `categories`
- **Schema File:** `backend/prisma/schema/master-data.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `name` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `slug` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `description` | `String` | No | No | No | No | None |
| `status` | `CategoryStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:** None
- **Relations:**
  - `products`: `Product[]` (1:N)
- **Unique constraints:**
  - `@unique` on `name`
  - `@unique` on `slug`
- **Indexes:** None

---

### 2.11 Brand
- **Table Name:** `brands`
- **Schema File:** `backend/prisma/schema/master-data.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `name` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `slug` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `description` | `String` | No | No | No | No | None |
| `status` | `BrandStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:** None
- **Relations:**
  - `products`: `Product[]` (1:N)
- **Unique constraints:**
  - `@unique` on `name`
  - `@unique` on `slug`
- **Indexes:** None

---

### 2.12 Product
- **Table Name:** `products`
- **Schema File:** `backend/prisma/schema/master-data.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `sku` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `name` | `String` | Yes | No | No | No | None |
| `slug` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `description` | `String` | No | No | No | No | None |
| `categoryId` | `String` | Yes | No | Yes (`Category.id`) | No | None |
| `brandId` | `String` | No | No | Yes (`Brand.id`) | No | None |
| `unit` | `String` | Yes | No | No | No | None |
| `image` | `String` | No | No | No | No | None |
| `status` | `ProductStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `categoryId` -> `Category(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `brandId` -> `Brand(id)` (Optional, onDelete: `SetNull`, onUpdate: default)
- **Relations:**
  - `category`: `Category` (N:1, Required)
  - `brand`: `Brand?` (N:1, Optional)
  - `inventoryStocks`: `InventoryStock[]` (1:N)
  - `stockMovements`: `StockMovement[]` (1:N)
  - `purchaseOrderItems`: `PurchaseOrderItem[]` (1:N)
  - `inventoryLocationStocks`: `InventoryLocationStock[]` (1:N)
  - `inventoryLocationMovements`: `InventoryLocationMovement[]` (1:N)
  - `goodsReceiptItems`: `GoodsReceiptItem[]` (1:N)
  - `salesOrderItems`: `SalesOrderItem[]` (1:N)
  - `stockReservations`: `StockReservation[]` (1:N)
  - `pickingTaskItems`: `PickingTaskItem[]` (1:N)
  - `packingTaskItems`: `PackingTaskItem[]` (1:N)
  - `packageItems`: `PackageItem[]` (1:N)
- **Unique constraints:**
  - `@unique` on `sku`
  - `@unique` on `slug`
- **Indexes:** None

---

### 2.13 Supplier
- **Table Name:** `suppliers`
- **Schema File:** `backend/prisma/schema/procurement.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `name` | `String` | Yes | No | No | No | None |
| `code` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `email` | `String` | No | No | No | No | None |
| `phone` | `String` | No | No | No | No | None |
| `address` | `String` | No | No | No | No | None |
| `city` | `String` | No | No | No | No | None |
| `country` | `String` | No | No | No | No | None |
| `contactPerson` | `String` | No | No | No | No | None |
| `status` | `SupplierStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `isDeleted` | `Boolean` | Yes | No | No | No | `false` |
| `deletedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:** None
- **Relations:**
  - `purchaseOrders`: `PurchaseOrder[]` (1:N)
- **Unique constraints:**
  - `@unique` on `code`
- **Indexes:** None

---

### 2.14 PurchaseOrder
- **Table Name:** `purchase_orders`
- **Schema File:** `backend/prisma/schema/procurement.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `poNumber` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `supplierId` | `String` | Yes | No | Yes (`Supplier.id`) | No | None |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `status` | `PurchaseOrderStatus` (Enum) | Yes | No | No | No | `PENDING` |
| `notes` | `String` | No | No | No | No | None |
| `totalAmount` | `Decimal` | Yes | No | No | No | `0` |
| `rejectionReason` | `String` | No | No | No | No | None |
| `cancellationReason` | `String` | No | No | No | No | None |
| `createdById` | `String` | Yes | No | Yes (`User.id`) | No | None |
| `approvedById` | `String` | No | No | Yes (`User.id`) | No | None |
| `approvedAt` | `DateTime` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `supplierId` -> `Supplier(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `createdById` -> `User(id)` (`@relation("POCreatedBy")`, Required, onDelete: `Restrict`, onUpdate: default)
  - `approvedById` -> `User(id)` (`@relation("POApprovedBy")`, Optional, onDelete: `SetNull`, onUpdate: default)
- **Relations:**
  - `supplier`: `Supplier` (N:1, Required)
  - `warehouse`: `Warehouse` (N:1, Required)
  - `createdBy`: `User` (`@relation("POCreatedBy")`, N:1, Required)
  - `approvedBy`: `User?` (`@relation("POApprovedBy")`, N:1, Optional)
  - `items`: `PurchaseOrderItem[]` (1:N)
  - `goodsReceipts`: `GoodsReceipt[]` (1:N)
- **Unique constraints:**
  - `@unique` on `poNumber`
- **Indexes:** None

---

### 2.15 PurchaseOrderItem
*(Junction / Association Model between `PurchaseOrder` and `Product`)*
- **Table Name:** `purchase_order_items`
- **Schema File:** `backend/prisma/schema/procurement.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `purchaseOrderId` | `String` | Yes | No | Yes (`PurchaseOrder.id`) | No (Composite) | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No (Composite) | None |
| `orderedQuantity` | `Decimal` | Yes | No | No | No | None |
| `receivedQuantity` | `Decimal` | Yes | No | No | No | `0` |
| `unitPrice` | `Decimal` | Yes | No | No | No | None |
| `totalPrice` | `Decimal` | Yes | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `purchaseOrderId` -> `PurchaseOrder(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `purchaseOrder`: `PurchaseOrder` (N:1, Required)
  - `product`: `Product` (N:1, Required)
- **Unique constraints:**
  - `@@unique([purchaseOrderId, productId])`
- **Indexes:** None

---

### 2.16 GoodsReceipt
- **Table Name:** `goods_receipts`
- **Schema File:** `backend/prisma/schema/procurement.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `receiptNumber` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `purchaseOrderId` | `String` | Yes | No | Yes (`PurchaseOrder.id`) | No | None |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `receivedById` | `String` | Yes | No | Yes (`User.id`) | No | None |
| `receivedAt` | `DateTime` | Yes | No | No | No | `now()` |
| `reason` | `String` | No | No | No | No | None |
| `reference` | `String` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `purchaseOrderId` -> `PurchaseOrder(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `receivedById` -> `User(id)` (`@relation("GoodsReceivedBy")`, Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `purchaseOrder`: `PurchaseOrder` (N:1, Required)
  - `warehouse`: `Warehouse` (N:1, Required)
  - `receivedBy`: `User` (`@relation("GoodsReceivedBy")`, N:1, Required)
  - `items`: `GoodsReceiptItem[]` (1:N)
- **Unique constraints:**
  - `@unique` on `receiptNumber`
- **Indexes:** None

---

### 2.17 GoodsReceiptItem
*(Junction / Line Item Model between `GoodsReceipt` and `Product`)*
- **Table Name:** `goods_receipt_items`
- **Schema File:** `backend/prisma/schema/procurement.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `goodsReceiptId` | `String` | Yes | No | Yes (`GoodsReceipt.id`) | No | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No | None |
| `quantity` | `Decimal` | Yes | No | No | No | None |

- **Foreign key details:**
  - `goodsReceiptId` -> `GoodsReceipt(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `goodsReceipt`: `GoodsReceipt` (N:1, Required)
  - `product`: `Product` (N:1, Required)
- **Unique constraints:** None
- **Indexes:** None

---

### 2.18 InventoryStock
*(Association Model between `Warehouse` and `Product`)*
- **Table Name:** `inventory_stocks`
- **Schema File:** `backend/prisma/schema/inventory.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No (Composite) | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No (Composite) | None |
| `quantity` | `Decimal` | Yes | No | No | No | `0` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `warehouse`: `Warehouse` (N:1, Required)
  - `product`: `Product` (N:1, Required)
- **Unique constraints:**
  - `@@unique([warehouseId, productId])`
- **Indexes:** None

---

### 2.19 StockMovement
*(Immutable Audit Log Model)*
- **Table Name:** `stock_movements`
- **Schema File:** `backend/prisma/schema/inventory.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No | None |
| `type` | `StockMovementType` (Enum) | Yes | No | No | No | None |
| `quantity` | `Decimal` | Yes | No | No | No | None |
| `previousStock` | `Decimal` | Yes | No | No | No | None |
| `newStock` | `Decimal` | Yes | No | No | No | None |
| `reason` | `String` | No | No | No | No | None |
| `reference` | `String` | No | No | No | No | None |
| `createdById` | `String` | No | No | Yes (`User.id`) | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |

- **Foreign key details:**
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `createdById` -> `User(id)` (Optional, onDelete: `SetNull`, onUpdate: default)
- **Relations:**
  - `warehouse`: `Warehouse` (N:1, Required)
  - `product`: `Product` (N:1, Required)
  - `createdBy`: `User?` (N:1, Optional)
- **Unique constraints:** None
- **Indexes:** None

---

### 2.20 InventoryLocationStock
*(Association Model between `Bin`, `Product`, and `Warehouse`)*
- **Table Name:** `inventory_location_stocks`
- **Schema File:** `backend/prisma/schema/inventory.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `binId` | `String` | Yes | No | Yes (`Bin.id`) | No (Composite) | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No (Composite) | None |
| `quantity` | `Decimal` | Yes | No | No | No | `0` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `binId` -> `Bin(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `warehouse`: `Warehouse` (N:1, Required)
  - `bin`: `Bin` (N:1, Required)
  - `product`: `Product` (N:1, Required)
  - `pickingAllocations`: `PickingAllocation[]` (1:N)
- **Unique constraints:**
  - `@@unique([binId, productId])`
- **Indexes:**
  - `@@index([warehouseId])`
  - `@@index([binId])`
  - `@@index([productId])`

---

### 2.21 InventoryLocationMovement
*(Immutable Audit Log Model for Location Movements)*
- **Table Name:** `inventory_location_movements`
- **Schema File:** `backend/prisma/schema/inventory.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No | None |
| `type` | `LocationMovementType` (Enum) | Yes | No | No | No | None |
| `fromBinId` | `String` | No | No | Yes (`Bin.id`) | No | None |
| `toBinId` | `String` | No | No | Yes (`Bin.id`) | No | None |
| `quantity` | `Decimal` | Yes | No | No | No | None |
| `reason` | `String` | No | No | No | No | None |
| `reference` | `String` | No | No | No | No | None |
| `createdById` | `String` | No | No | Yes (`User.id`) | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |

- **Foreign key details:**
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `fromBinId` -> `Bin(id)` (`@relation("FromBinLocationMovements")`, Optional, onDelete: `SetNull`, onUpdate: default)
  - `toBinId` -> `Bin(id)` (`@relation("ToBinLocationMovements")`, Optional, onDelete: `SetNull`, onUpdate: default)
  - `createdById` -> `User(id)` (Optional, onDelete: `SetNull`, onUpdate: default)
- **Relations:**
  - `warehouse`: `Warehouse` (N:1, Required)
  - `product`: `Product` (N:1, Required)
  - `fromBin`: `Bin?` (`@relation("FromBinLocationMovements")`, N:1, Optional)
  - `toBin`: `Bin?` (`@relation("ToBinLocationMovements")`, N:1, Optional)
  - `createdBy`: `User?` (N:1, Optional)
- **Unique constraints:** None
- **Indexes:**
  - `@@index([warehouseId])`
  - `@@index([productId])`
  - `@@index([fromBinId])`
  - `@@index([toBinId])`

---

### 2.22 SalesOrder
- **Table Name:** `sales_orders`
- **Schema File:** `backend/prisma/schema/sales.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `orderNumber` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `createdById` | `String` | Yes | No | Yes (`User.id`) | No | None |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `status` | `SalesOrderStatus` (Enum) | Yes | No | No | No | `PENDING` |
| `totalAmount` | `Decimal` | Yes | No | No | No | `0` |
| `notes` | `String` | No | No | No | No | None |
| `cancellationReason` | `String` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `createdById` -> `User(id)` (`@relation("SOCreatedBy")`, Required, onDelete: `Restrict`, onUpdate: default)
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `createdBy`: `User` (`@relation("SOCreatedBy")`, N:1, Required)
  - `warehouse`: `Warehouse` (N:1, Required)
  - `items`: `SalesOrderItem[]` (1:N)
  - `reservations`: `StockReservation[]` (1:N)
  - `pickingTask`: `PickingTask?` (1:1, Optional on SalesOrder side)
  - `packingTask`: `PackingTask?` (1:1, Optional on SalesOrder side)
  - `shipment`: `Shipment?` (1:1, Optional on SalesOrder side)
- **Unique constraints:**
  - `@unique` on `orderNumber`
- **Indexes:** None

---

### 2.23 SalesOrderItem
*(Junction / Line Item Model between `SalesOrder` and `Product`)*
- **Table Name:** `sales_order_items`
- **Schema File:** `backend/prisma/schema/sales.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `salesOrderId` | `String` | Yes | No | Yes (`SalesOrder.id`) | No (Composite) | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No (Composite) | None |
| `quantity` | `Decimal` | Yes | No | No | No | None |
| `unitPrice` | `Decimal` | Yes | No | No | No | None |
| `totalPrice` | `Decimal` | Yes | No | No | No | None |
| `reservedQuantity` | `Decimal` | Yes | No | No | No | `0` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `salesOrderId` -> `SalesOrder(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `salesOrder`: `SalesOrder` (N:1, Required)
  - `product`: `Product` (N:1, Required)
  - `reservations`: `StockReservation[]` (1:N)
  - `pickingTaskItems`: `PickingTaskItem[]` (1:N)
  - `packingTaskItems`: `PackingTaskItem[]` (1:N)
- **Unique constraints:**
  - `@@unique([salesOrderId, productId])`
- **Indexes:** None

---

### 2.24 StockReservation
*(Association Model between `SalesOrder`, `SalesOrderItem`, `Warehouse`, and `Product`)*
- **Table Name:** `stock_reservations`
- **Schema File:** `backend/prisma/schema/sales.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `salesOrderId` | `String` | Yes | No | Yes (`SalesOrder.id`) | No | None |
| `salesOrderItemId` | `String` | Yes | No | Yes (`SalesOrderItem.id`) | No | None |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No | None |
| `quantity` | `Decimal` | Yes | No | No | No | None |
| `status` | `ReservationStatus` (Enum) | Yes | No | No | No | `ACTIVE` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `salesOrderId` -> `SalesOrder(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `salesOrderItemId` -> `SalesOrderItem(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `salesOrder`: `SalesOrder` (N:1, Required)
  - `salesOrderItem`: `SalesOrderItem` (N:1, Required)
  - `warehouse`: `Warehouse` (N:1, Required)
  - `product`: `Product` (N:1, Required)
- **Unique constraints:** None
- **Indexes:**
  - `@@index([warehouseId, productId, status])`

---

### 2.25 PickingTask
- **Table Name:** `picking_tasks`
- **Schema File:** `backend/prisma/schema/picking.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `pickingNumber` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `salesOrderId` | `String` | Yes | No | Yes (`SalesOrder.id`) | Yes (`@unique`) | None |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `assignedToId` | `String` | No | No | Yes (`User.id`) | No | None |
| `status` | `PickingStatus` (Enum) | Yes | No | No | No | `PENDING` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `salesOrderId` -> `SalesOrder(id)` (Required, `@unique`, onDelete: `Restrict`, onUpdate: default)
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `assignedToId` -> `User(id)` (`@relation("PickingTaskAssignedTo")`, Optional, onDelete: `SetNull`, onUpdate: default)
- **Relations:**
  - `salesOrder`: `SalesOrder` (1:1, Required on PickingTask side)
  - `warehouse`: `Warehouse` (N:1, Required)
  - `assignedTo`: `User?` (`@relation("PickingTaskAssignedTo")`, N:1, Optional)
  - `items`: `PickingTaskItem[]` (1:N)
- **Unique constraints:**
  - `@unique` on `pickingNumber`
  - `@unique` on `salesOrderId`
- **Indexes:**
  - `@@index([warehouseId, status])`

---

### 2.26 PickingTaskItem
*(Association Model between `PickingTask`, `SalesOrderItem`, and `Product`)*
- **Table Name:** `picking_task_items`
- **Schema File:** `backend/prisma/schema/picking.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `pickingTaskId` | `String` | Yes | No | Yes (`PickingTask.id`) | No (Composite) | None |
| `salesOrderItemId` | `String` | Yes | No | Yes (`SalesOrderItem.id`) | No (Composite) | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No | None |
| `requiredQuantity` | `Decimal` | Yes | No | No | No | None |
| `pickedQuantity` | `Decimal` | Yes | No | No | No | `0` |
| `status` | `PickingItemStatus` (Enum) | Yes | No | No | No | `PENDING` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `pickingTaskId` -> `PickingTask(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `salesOrderItemId` -> `SalesOrderItem(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `pickingTask`: `PickingTask` (N:1, Required)
  - `salesOrderItem`: `SalesOrderItem` (N:1, Required)
  - `product`: `Product` (N:1, Required)
  - `allocations`: `PickingAllocation[]` (1:N)
- **Unique constraints:**
  - `@@unique([pickingTaskId, salesOrderItemId])`
- **Indexes:**
  - `@@index([pickingTaskId])`
  - `@@index([productId])`

---

### 2.27 PickingAllocation
*(Association Model between `PickingTaskItem`, `InventoryLocationStock`, and `User`)*
- **Table Name:** `picking_allocations`
- **Schema File:** `backend/prisma/schema/picking.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `pickingTaskItemId` | `String` | Yes | No | Yes (`PickingTaskItem.id`) | No | None |
| `locationStockId` | `String` | Yes | No | Yes (`InventoryLocationStock.id`) | No | None |
| `quantity` | `Decimal` | Yes | No | No | No | None |
| `pickedById` | `String` | Yes | No | Yes (`User.id`) | No | None |
| `pickedAt` | `DateTime` | Yes | No | No | No | `now()` |

- **Foreign key details:**
  - `pickingTaskItemId` -> `PickingTaskItem(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `locationStockId` -> `InventoryLocationStock(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `pickedById` -> `User(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `pickingTaskItem`: `PickingTaskItem` (N:1, Required)
  - `locationStock`: `InventoryLocationStock` (N:1, Required)
  - `pickedBy`: `User` (N:1, Required)
- **Unique constraints:** None
- **Indexes:**
  - `@@index([pickingTaskItemId])`
  - `@@index([locationStockId])`

---

### 2.28 PackingTask
- **Table Name:** `packing_tasks`
- **Schema File:** `backend/prisma/schema/packing.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `packingNumber` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `salesOrderId` | `String` | Yes | No | Yes (`SalesOrder.id`) | Yes (`@unique`) | None |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `packedById` | `String` | No | No | Yes (`User.id`) | No | None |
| `status` | `PackingStatus` (Enum) | Yes | No | No | No | `PENDING` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `salesOrderId` -> `SalesOrder(id)` (Required, `@unique`, onDelete: `Restrict`, onUpdate: default)
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `packedById` -> `User(id)` (`@relation("PackingTaskPackedBy")`, Optional, onDelete: `SetNull`, onUpdate: default)
- **Relations:**
  - `salesOrder`: `SalesOrder` (1:1, Required on PackingTask side)
  - `warehouse`: `Warehouse` (N:1, Required)
  - `packedBy`: `User?` (`@relation("PackingTaskPackedBy")`, N:1, Optional)
  - `items`: `PackingTaskItem[]` (1:N)
  - `packages`: `Package[]` (1:N)
- **Unique constraints:**
  - `@unique` on `packingNumber`
  - `@unique` on `salesOrderId`
- **Indexes:**
  - `@@index([warehouseId, status])`

---

### 2.29 PackingTaskItem
*(Association Model between `PackingTask`, `SalesOrderItem`, and `Product`)*
- **Table Name:** `packing_task_items`
- **Schema File:** `backend/prisma/schema/packing.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `packingTaskId` | `String` | Yes | No | Yes (`PackingTask.id`) | No (Composite) | None |
| `salesOrderItemId` | `String` | Yes | No | Yes (`SalesOrderItem.id`) | No (Composite) | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No | None |
| `requiredQuantity` | `Decimal` | Yes | No | No | No | None |
| `packedQuantity` | `Decimal` | Yes | No | No | No | `0` |
| `status` | `PackingItemStatus` (Enum) | Yes | No | No | No | `PENDING` |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `packingTaskId` -> `PackingTask(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `salesOrderItemId` -> `SalesOrderItem(id)` (Required, onDelete: `Restrict`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `packingTask`: `PackingTask` (N:1, Required)
  - `salesOrderItem`: `SalesOrderItem` (N:1, Required)
  - `product`: `Product` (N:1, Required)
  - `packageItems`: `PackageItem[]` (1:N)
- **Unique constraints:**
  - `@@unique([packingTaskId, salesOrderItemId])`
- **Indexes:**
  - `@@index([packingTaskId])`
  - `@@index([productId])`

---

### 2.30 Package
- **Table Name:** `packages`
- **Schema File:** `backend/prisma/schema/packing.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `packingTaskId` | `String` | Yes | No | Yes (`PackingTask.id`) | No | None |
| `packageNumber` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `status` | `PackageStatus` (Enum) | Yes | No | No | No | `OPEN` |
| `weight` | `Decimal` | No | No | No | No | None |
| `notes` | `String` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `packingTaskId` -> `PackingTask(id)` (Required, onDelete: `Cascade`, onUpdate: default)
- **Relations:**
  - `packingTask`: `PackingTask` (N:1, Required)
  - `items`: `PackageItem[]` (1:N)
- **Unique constraints:**
  - `@unique` on `packageNumber`
- **Indexes:**
  - `@@index([packingTaskId])`

---

### 2.31 PackageItem
*(Association Model between `Package`, `PackingTaskItem`, and `Product`)*
- **Table Name:** `package_items`
- **Schema File:** `backend/prisma/schema/packing.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `packageId` | `String` | Yes | No | Yes (`Package.id`) | No | None |
| `packingTaskItemId` | `String` | Yes | No | Yes (`PackingTaskItem.id`) | No | None |
| `productId` | `String` | Yes | No | Yes (`Product.id`) | No | None |
| `quantity` | `Decimal` | Yes | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `packageId` -> `Package(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `packingTaskItemId` -> `PackingTaskItem(id)` (Required, onDelete: `Cascade`, onUpdate: default)
  - `productId` -> `Product(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `package`: `Package` (N:1, Required)
  - `packingTaskItem`: `PackingTaskItem` (N:1, Required)
  - `product`: `Product` (N:1, Required)
- **Unique constraints:** None
- **Indexes:**
  - `@@index([packageId])`
  - `@@index([packingTaskItemId])`
  - `@@index([productId])`

---

### 2.32 Shipment
- **Table Name:** `shipments`
- **Schema File:** `backend/prisma/schema/shipping.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `shipmentNumber` | `String` | Yes | No | No | Yes (`@unique`) | None |
| `salesOrderId` | `String` | Yes | No | Yes (`SalesOrder.id`) | Yes (`@unique`) | None |
| `warehouseId` | `String` | Yes | No | Yes (`Warehouse.id`) | No | None |
| `status` | `ShipmentStatus` (Enum) | Yes | No | No | No | `READY` |
| `shippingMethod` | `ShippingMethod` (Enum) | Yes | No | No | No | None |
| `carrier` | `String` | No | No | No | No | None |
| `trackingNumber` | `String` | No | No | No | No | None |
| `shippingAddress` | `String` | Yes | No | No | No | None |
| `shippingCity` | `String` | Yes | No | No | No | None |
| `shippingCountry` | `String` | Yes | No | No | No | None |
| `shippingPhone` | `String` | Yes | No | No | No | None |
| `shippedAt` | `DateTime` | No | No | No | No | None |
| `deliveredAt` | `DateTime` | No | No | No | No | None |
| `notes` | `String` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `salesOrderId` -> `SalesOrder(id)` (Required, `@unique`, onDelete: `Restrict`, onUpdate: default)
  - `warehouseId` -> `Warehouse(id)` (Required, onDelete: `Restrict`, onUpdate: default)
- **Relations:**
  - `salesOrder`: `SalesOrder` (1:1, Required on Shipment side)
  - `warehouse`: `Warehouse` (N:1, Required)
- **Unique constraints:**
  - `@unique` on `shipmentNumber`
  - `@unique` on `salesOrderId`
- **Indexes:**
  - `@@index([warehouseId, status])`

---

### 2.33 Notification
- **Table Name:** `notifications`
- **Schema File:** `backend/prisma/schema/system.prisma`

| Field | Type | Required | Primary Key | Foreign Key | Unique | Default |
|---|---|---|---|---|---|---|
| `id` | `String` | Yes | Yes (`@id`) | No | No (PK) | `cuid()` |
| `userId` | `String` | Yes | No | Yes (`User.id`) | No | None |
| `type` | `NotificationType` (Enum) | Yes | No | No | No | `INFO` |
| `title` | `String` | Yes | No | No | No | None |
| `message` | `String` | Yes | No | No | No | None |
| `isRead` | `Boolean` | Yes | No | No | No | `false` |
| `readAt` | `DateTime` | No | No | No | No | None |
| `entityType` | `String` | No | No | No | No | None |
| `entityId` | `String` | No | No | No | No | None |
| `createdAt` | `DateTime` | Yes | No | No | No | `now()` |
| `updatedAt` | `DateTime` | Yes (`@updatedAt`) | No | No | No | auto-updated |

- **Foreign key details:**
  - `userId` -> `User(id)` (Required, onDelete: `Cascade`, onUpdate: default)
- **Relations:**
  - `user`: `User` (N:1, Required)
- **Unique constraints:** None
- **Indexes:**
  - `@@index([userId, createdAt])`
  - `@@index([userId, isRead, createdAt])`
  - `@@index([entityType, entityId])`

---

## 3. Relationships

Below is the consolidated table of all explicit relationships defined across the Prisma schema files.
*(Note: Relationship cardinality is determined strictly by the Prisma field type and uniqueness constraints)*

| From Model | From Field | Relationship | To Model | To Field | Optional? | onDelete | onUpdate | Relation Name / Notes |
|---|---|---|---|---|---|---|---|---|
| `User` | `warehouseId` | N:1 | `Warehouse` | `id` | Yes | *default* | *default* | Optional warehouse assignment |
| `Session` | `userId` | N:1 | `User` | `id` | No | `Cascade` | *default* | |
| `Account` | `userId` | N:1 | `User` | `id` | No | `Cascade` | *default* | |
| `Zone` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `Aisle` | `zoneId` | N:1 | `Zone` | `id` | No | `Restrict` | *default* | |
| `Shelf` | `aisleId` | N:1 | `Aisle` | `id` | No | `Restrict` | *default* | |
| `Bin` | `shelfId` | N:1 | `Shelf` | `id` | No | `Restrict` | *default* | |
| `Product` | `categoryId` | N:1 | `Category` | `id` | No | `Restrict` | *default* | |
| `Product` | `brandId` | N:1 | `Brand` | `id` | Yes | `SetNull` | *default* | |
| `PurchaseOrder` | `supplierId` | N:1 | `Supplier` | `id` | No | `Restrict` | *default* | |
| `PurchaseOrder` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `PurchaseOrder` | `createdById` | N:1 | `User` | `id` | No | `Restrict` | *default* | `"POCreatedBy"` |
| `PurchaseOrder` | `approvedById` | N:1 | `User` | `id` | Yes | `SetNull` | *default* | `"POApprovedBy"` |
| `PurchaseOrderItem` | `purchaseOrderId` | N:1 | `PurchaseOrder` | `id` | No | `Cascade` | *default* | |
| `PurchaseOrderItem` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `GoodsReceipt` | `purchaseOrderId` | N:1 | `PurchaseOrder` | `id` | No | `Restrict` | *default* | |
| `GoodsReceipt` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `GoodsReceipt` | `receivedById` | N:1 | `User` | `id` | No | `Restrict` | *default* | `"GoodsReceivedBy"` |
| `GoodsReceiptItem` | `goodsReceiptId` | N:1 | `GoodsReceipt` | `id` | No | `Cascade` | *default* | |
| `GoodsReceiptItem` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `InventoryStock` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `InventoryStock` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `StockMovement` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `StockMovement` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `StockMovement` | `createdById` | N:1 | `User` | `id` | Yes | `SetNull` | *default* | |
| `InventoryLocationStock` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `InventoryLocationStock` | `binId` | N:1 | `Bin` | `id` | No | `Restrict` | *default* | |
| `InventoryLocationStock` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `InventoryLocationMovement` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `InventoryLocationMovement` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `InventoryLocationMovement` | `fromBinId` | N:1 | `Bin` | `id` | Yes | `SetNull` | *default* | `"FromBinLocationMovements"` |
| `InventoryLocationMovement` | `toBinId` | N:1 | `Bin` | `id` | Yes | `SetNull` | *default* | `"ToBinLocationMovements"` |
| `InventoryLocationMovement` | `createdById` | N:1 | `User` | `id` | Yes | `SetNull` | *default* | |
| `SalesOrder` | `createdById` | N:1 | `User` | `id` | No | `Restrict` | *default* | `"SOCreatedBy"` |
| `SalesOrder` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `SalesOrderItem` | `salesOrderId` | N:1 | `SalesOrder` | `id` | No | `Cascade` | *default* | |
| `SalesOrderItem` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `StockReservation` | `salesOrderId` | N:1 | `SalesOrder` | `id` | No | `Cascade` | *default* | |
| `StockReservation` | `salesOrderItemId` | N:1 | `SalesOrderItem` | `id` | No | `Cascade` | *default* | |
| `StockReservation` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `StockReservation` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `PickingTask` | `salesOrderId` | 1:1 | `SalesOrder` | `id` | No (Required on `PickingTask`, Optional on `SalesOrder`) | `Restrict` | *default* | `PickingTask.salesOrderId` is `@unique` |
| `PickingTask` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `PickingTask` | `assignedToId` | N:1 | `User` | `id` | Yes | `SetNull` | *default* | `"PickingTaskAssignedTo"` |
| `PickingTaskItem` | `pickingTaskId` | N:1 | `PickingTask` | `id` | No | `Cascade` | *default* | |
| `PickingTaskItem` | `salesOrderItemId` | N:1 | `SalesOrderItem` | `id` | No | `Restrict` | *default* | |
| `PickingTaskItem` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `PickingAllocation` | `pickingTaskItemId` | N:1 | `PickingTaskItem` | `id` | No | `Cascade` | *default* | |
| `PickingAllocation` | `locationStockId` | N:1 | `InventoryLocationStock` | `id` | No | `Restrict` | *default* | |
| `PickingAllocation` | `pickedById` | N:1 | `User` | `id` | No | `Restrict` | *default* | |
| `PackingTask` | `salesOrderId` | 1:1 | `SalesOrder` | `id` | No (Required on `PackingTask`, Optional on `SalesOrder`) | `Restrict` | *default* | `PackingTask.salesOrderId` is `@unique` |
| `PackingTask` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `PackingTask` | `packedById` | N:1 | `User` | `id` | Yes | `SetNull` | *default* | `"PackingTaskPackedBy"` |
| `PackingTaskItem` | `packingTaskId` | N:1 | `PackingTask` | `id` | No | `Cascade` | *default* | |
| `PackingTaskItem` | `salesOrderItemId` | N:1 | `SalesOrderItem` | `id` | No | `Restrict` | *default* | |
| `PackingTaskItem` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `Package` | `packingTaskId` | N:1 | `PackingTask` | `id` | No | `Cascade` | *default* | |
| `PackageItem` | `packageId` | N:1 | `Package` | `id` | No | `Cascade` | *default* | |
| `PackageItem` | `packingTaskItemId` | N:1 | `PackingTaskItem` | `id` | No | `Cascade` | *default* | |
| `PackageItem` | `productId` | N:1 | `Product` | `id` | No | `Restrict` | *default* | |
| `Shipment` | `salesOrderId` | 1:1 | `SalesOrder` | `id` | No (Required on `Shipment`, Optional on `SalesOrder`) | `Restrict` | *default* | `Shipment.salesOrderId` is `@unique` |
| `Shipment` | `warehouseId` | N:1 | `Warehouse` | `id` | No | `Restrict` | *default* | |
| `Notification` | `userId` | N:1 | `User` | `id` | No | `Cascade` | *default* | |

---

## 4. Enums

The following 21 enums are defined in `backend/prisma/schema/enums.prisma` and used across models:

### 4.1 Role
- **Values:** `SUPER_ADMIN`, `ADMIN`, `WAREHOUSE_MANAGER`, `PROCUREMENT`, `STAFF`, `FINANCE`
- **Used by:** `User.role`

### 4.2 UserStatus
- **Values:** `ACTIVE`, `BLOCKED`, `DELETED`
- **Used by:** `User.status`

### 4.3 WarehouseStatus
- **Values:** `ACTIVE`, `INACTIVE`
- **Used by:** `Warehouse.status`

### 4.4 LocationStatus
- **Values:** `ACTIVE`, `INACTIVE`
- **Used by:** `Zone.status`, `Aisle.status`, `Shelf.status`, `Bin.status`

### 4.5 CategoryStatus
- **Values:** `ACTIVE`, `INACTIVE`
- **Used by:** `Category.status`

### 4.6 BrandStatus
- **Values:** `ACTIVE`, `INACTIVE`
- **Used by:** `Brand.status`

### 4.7 ProductStatus
- **Values:** `ACTIVE`, `INACTIVE`
- **Used by:** `Product.status`

### 4.8 StockMovementType
- **Values:** `IN`, `OUT`, `ADJUSTMENT`
- **Used by:** `StockMovement.type`

### 4.9 LocationMovementType
- **Values:** `ALLOCATE`, `DEALLOCATE`, `TRANSFER`
- **Used by:** `InventoryLocationMovement.type`

### 4.10 SupplierStatus
- **Values:** `ACTIVE`, `INACTIVE`
- **Used by:** `Supplier.status`

### 4.11 PurchaseOrderStatus
- **Values:** `PENDING`, `APPROVED`, `REJECTED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`
- **Used by:** `PurchaseOrder.status`

### 4.12 SalesOrderStatus
- **Values:** `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- **Used by:** `SalesOrder.status`

### 4.13 ReservationStatus
- **Values:** `ACTIVE`, `RELEASED`, `CONSUMED`
- **Used by:** `StockReservation.status`

### 4.14 PickingStatus
- **Values:** `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `PARTIALLY_PICKED`, `PICKED`, `CANCELLED`
- **Used by:** `PickingTask.status`

### 4.15 PickingItemStatus
- **Values:** `PENDING`, `PARTIALLY_PICKED`, `PICKED`
- **Used by:** `PickingTaskItem.status`

### 4.16 PackingStatus
- **Values:** `PENDING`, `IN_PROGRESS`, `PARTIALLY_PACKED`, `PACKED`, `CANCELLED`
- **Used by:** `PackingTask.status`

### 4.17 PackingItemStatus
- **Values:** `PENDING`, `PARTIALLY_PACKED`, `PACKED`
- **Used by:** `PackingTaskItem.status`

### 4.18 PackageStatus
- **Values:** `OPEN`, `PACKED`, `CANCELLED`
- **Used by:** `Package.status`

### 4.19 ShipmentStatus
- **Values:** `READY`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`
- **Used by:** `Shipment.status`

### 4.20 ShippingMethod
- **Values:** `STANDARD`, `EXPRESS`, `SAME_DAY`, `PICKUP`
- **Used by:** `Shipment.shippingMethod`

### 4.21 NotificationType
- **Values:** `INFO`, `SUCCESS`, `WARNING`, `ERROR`, `SYSTEM`
- **Used by:** `Notification.type`

---

## 5. ER Diagram Essentials

This simplified reference lists only the essential structural components needed for creating the draw.io ER diagram.

### 1. User (`users`)
- **Primary Key:** `id`
- **Foreign Keys:** `warehouseId -> Warehouse.id` (Optional)
- **Relationships:**
  - `User` N:1 `Warehouse`
  - `User` 1:N `Session`
  - `User` 1:N `Account`
  - `User` 1:N `StockMovement`
  - `User` 1:N `PurchaseOrder` (as createdBy)
  - `User` 1:N `PurchaseOrder` (as approvedBy)
  - `User` 1:N `InventoryLocationMovement` (as createdBy)
  - `User` 1:N `GoodsReceipt` (as receivedBy)
  - `User` 1:N `SalesOrder` (as createdBy)
  - `User` 1:N `PickingTask` (as assignedTo)
  - `User` 1:N `PickingAllocation` (as pickedBy)
  - `User` 1:N `PackingTask` (as packedBy)
  - `User` 1:N `Notification`

### 2. Session (`session`)
- **Primary Key:** `id`
- **Foreign Keys:** `userId -> User.id`
- **Relationships:**
  - `Session` N:1 `User`

### 3. Account (`account`)
- **Primary Key:** `id`
- **Foreign Keys:** `userId -> User.id`
- **Relationships:**
  - `Account` N:1 `User`

### 4. Verification (`verification`)
- **Primary Key:** `id`
- **Foreign Keys:** None
- **Relationships:** None

### 5. Warehouse (`warehouses`)
- **Primary Key:** `id`
- **Foreign Keys:** None
- **Relationships:**
  - `Warehouse` 1:N `User`
  - `Warehouse` 1:N `Zone`
  - `Warehouse` 1:N `InventoryStock`
  - `Warehouse` 1:N `StockMovement`
  - `Warehouse` 1:N `PurchaseOrder`
  - `Warehouse` 1:N `GoodsReceipt`
  - `Warehouse` 1:N `InventoryLocationStock`
  - `Warehouse` 1:N `InventoryLocationMovement`
  - `Warehouse` 1:N `SalesOrder`
  - `Warehouse` 1:N `StockReservation`
  - `Warehouse` 1:N `PickingTask`
  - `Warehouse` 1:N `PackingTask`
  - `Warehouse` 1:N `Shipment`

### 6. Zone (`zones`)
- **Primary Key:** `id`
- **Foreign Keys:** `warehouseId -> Warehouse.id`
- **Relationships:**
  - `Zone` N:1 `Warehouse`
  - `Zone` 1:N `Aisle`

### 7. Aisle (`aisles`)
- **Primary Key:** `id`
- **Foreign Keys:** `zoneId -> Zone.id`
- **Relationships:**
  - `Aisle` N:1 `Zone`
  - `Aisle` 1:N `Shelf`

### 8. Shelf (`shelves`)
- **Primary Key:** `id`
- **Foreign Keys:** `aisleId -> Aisle.id`
- **Relationships:**
  - `Shelf` N:1 `Aisle`
  - `Shelf` 1:N `Bin`

### 9. Bin (`bins`)
- **Primary Key:** `id`
- **Foreign Keys:** `shelfId -> Shelf.id`
- **Relationships:**
  - `Bin` N:1 `Shelf`
  - `Bin` 1:N `InventoryLocationStock`
  - `Bin` 1:N `InventoryLocationMovement` (as fromBin)
  - `Bin` 1:N `InventoryLocationMovement` (as toBin)

### 10. Category (`categories`)
- **Primary Key:** `id`
- **Foreign Keys:** None
- **Relationships:**
  - `Category` 1:N `Product`

### 11. Brand (`brands`)
- **Primary Key:** `id`
- **Foreign Keys:** None
- **Relationships:**
  - `Brand` 1:N `Product`

### 12. Product (`products`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `categoryId -> Category.id`
  - `brandId -> Brand.id` (Optional)
- **Relationships:**
  - `Product` N:1 `Category`
  - `Product` N:1 `Brand`
  - `Product` 1:N `InventoryStock`
  - `Product` 1:N `StockMovement`
  - `Product` 1:N `PurchaseOrderItem`
  - `Product` 1:N `GoodsReceiptItem`
  - `Product` 1:N `InventoryLocationStock`
  - `Product` 1:N `InventoryLocationMovement`
  - `Product` 1:N `SalesOrderItem`
  - `Product` 1:N `StockReservation`
  - `Product` 1:N `PickingTaskItem`
  - `Product` 1:N `PackingTaskItem`
  - `Product` 1:N `PackageItem`

### 13. Supplier (`suppliers`)
- **Primary Key:** `id`
- **Foreign Keys:** None
- **Relationships:**
  - `Supplier` 1:N `PurchaseOrder`

### 14. PurchaseOrder (`purchase_orders`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `supplierId -> Supplier.id`
  - `warehouseId -> Warehouse.id`
  - `createdById -> User.id`
  - `approvedById -> User.id` (Optional)
- **Relationships:**
  - `PurchaseOrder` N:1 `Supplier`
  - `PurchaseOrder` N:1 `Warehouse`
  - `PurchaseOrder` N:1 `User` (createdBy)
  - `PurchaseOrder` N:1 `User` (approvedBy)
  - `PurchaseOrder` 1:N `PurchaseOrderItem`
  - `PurchaseOrder` 1:N `GoodsReceipt`

### 15. PurchaseOrderItem (`purchase_order_items`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `purchaseOrderId -> PurchaseOrder.id`
  - `productId -> Product.id`
- **Relationships:**
  - `PurchaseOrderItem` N:1 `PurchaseOrder`
  - `PurchaseOrderItem` N:1 `Product`

### 16. GoodsReceipt (`goods_receipts`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `purchaseOrderId -> PurchaseOrder.id`
  - `warehouseId -> Warehouse.id`
  - `receivedById -> User.id`
- **Relationships:**
  - `GoodsReceipt` N:1 `PurchaseOrder`
  - `GoodsReceipt` N:1 `Warehouse`
  - `GoodsReceipt` N:1 `User` (receivedBy)
  - `GoodsReceipt` 1:N `GoodsReceiptItem`

### 17. GoodsReceiptItem (`goods_receipt_items`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `goodsReceiptId -> GoodsReceipt.id`
  - `productId -> Product.id`
- **Relationships:**
  - `GoodsReceiptItem` N:1 `GoodsReceipt`
  - `GoodsReceiptItem` N:1 `Product`

### 18. InventoryStock (`inventory_stocks`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `warehouseId -> Warehouse.id`
  - `productId -> Product.id`
- **Relationships:**
  - `InventoryStock` N:1 `Warehouse`
  - `InventoryStock` N:1 `Product`

### 19. StockMovement (`stock_movements`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `warehouseId -> Warehouse.id`
  - `productId -> Product.id`
  - `createdById -> User.id` (Optional)
- **Relationships:**
  - `StockMovement` N:1 `Warehouse`
  - `StockMovement` N:1 `Product`
  - `StockMovement` N:1 `User` (createdBy)

### 20. InventoryLocationStock (`inventory_location_stocks`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `warehouseId -> Warehouse.id`
  - `binId -> Bin.id`
  - `productId -> Product.id`
- **Relationships:**
  - `InventoryLocationStock` N:1 `Warehouse`
  - `InventoryLocationStock` N:1 `Bin`
  - `InventoryLocationStock` N:1 `Product`
  - `InventoryLocationStock` 1:N `PickingAllocation`

### 21. InventoryLocationMovement (`inventory_location_movements`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `warehouseId -> Warehouse.id`
  - `productId -> Product.id`
  - `fromBinId -> Bin.id` (Optional)
  - `toBinId -> Bin.id` (Optional)
  - `createdById -> User.id` (Optional)
- **Relationships:**
  - `InventoryLocationMovement` N:1 `Warehouse`
  - `InventoryLocationMovement` N:1 `Product`
  - `InventoryLocationMovement` N:1 `Bin` (fromBin)
  - `InventoryLocationMovement` N:1 `Bin` (toBin)
  - `InventoryLocationMovement` N:1 `User` (createdBy)

### 22. SalesOrder (`sales_orders`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `createdById -> User.id`
  - `warehouseId -> Warehouse.id`
- **Relationships:**
  - `SalesOrder` N:1 `User` (createdBy)
  - `SalesOrder` N:1 `Warehouse`
  - `SalesOrder` 1:N `SalesOrderItem`
  - `SalesOrder` 1:N `StockReservation`
  - `SalesOrder` 1:1 `PickingTask` (Optional on SalesOrder side)
  - `SalesOrder` 1:1 `PackingTask` (Optional on SalesOrder side)
  - `SalesOrder` 1:1 `Shipment` (Optional on SalesOrder side)

### 23. SalesOrderItem (`sales_order_items`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `salesOrderId -> SalesOrder.id`
  - `productId -> Product.id`
- **Relationships:**
  - `SalesOrderItem` N:1 `SalesOrder`
  - `SalesOrderItem` N:1 `Product`
  - `SalesOrderItem` 1:N `StockReservation`
  - `SalesOrderItem` 1:N `PickingTaskItem`
  - `SalesOrderItem` 1:N `PackingTaskItem`

### 24. StockReservation (`stock_reservations`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `salesOrderId -> SalesOrder.id`
  - `salesOrderItemId -> SalesOrderItem.id`
  - `warehouseId -> Warehouse.id`
  - `productId -> Product.id`
- **Relationships:**
  - `StockReservation` N:1 `SalesOrder`
  - `StockReservation` N:1 `SalesOrderItem`
  - `StockReservation` N:1 `Warehouse`
  - `StockReservation` N:1 `Product`

### 25. PickingTask (`picking_tasks`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `salesOrderId -> SalesOrder.id` (Unique)
  - `warehouseId -> Warehouse.id`
  - `assignedToId -> User.id` (Optional)
- **Relationships:**
  - `PickingTask` 1:1 `SalesOrder`
  - `PickingTask` N:1 `Warehouse`
  - `PickingTask` N:1 `User` (assignedTo)
  - `PickingTask` 1:N `PickingTaskItem`

### 26. PickingTaskItem (`picking_task_items`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `pickingTaskId -> PickingTask.id`
  - `salesOrderItemId -> SalesOrderItem.id`
  - `productId -> Product.id`
- **Relationships:**
  - `PickingTaskItem` N:1 `PickingTask`
  - `PickingTaskItem` N:1 `SalesOrderItem`
  - `PickingTaskItem` N:1 `Product`
  - `PickingTaskItem` 1:N `PickingAllocation`

### 27. PickingAllocation (`picking_allocations`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `pickingTaskItemId -> PickingTaskItem.id`
  - `locationStockId -> InventoryLocationStock.id`
  - `pickedById -> User.id`
- **Relationships:**
  - `PickingAllocation` N:1 `PickingTaskItem`
  - `PickingAllocation` N:1 `InventoryLocationStock`
  - `PickingAllocation` N:1 `User` (pickedBy)

### 28. PackingTask (`packing_tasks`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `salesOrderId -> SalesOrder.id` (Unique)
  - `warehouseId -> Warehouse.id`
  - `packedById -> User.id` (Optional)
- **Relationships:**
  - `PackingTask` 1:1 `SalesOrder`
  - `PackingTask` N:1 `Warehouse`
  - `PackingTask` N:1 `User` (packedBy)
  - `PackingTask` 1:N `PackingTaskItem`
  - `PackingTask` 1:N `Package`

### 29. PackingTaskItem (`packing_task_items`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `packingTaskId -> PackingTask.id`
  - `salesOrderItemId -> SalesOrderItem.id`
  - `productId -> Product.id`
- **Relationships:**
  - `PackingTaskItem` N:1 `PackingTask`
  - `PackingTaskItem` N:1 `SalesOrderItem`
  - `PackingTaskItem` N:1 `Product`
  - `PackingTaskItem` 1:N `PackageItem`

### 30. Package (`packages`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `packingTaskId -> PackingTask.id`
- **Relationships:**
  - `Package` N:1 `PackingTask`
  - `Package` 1:N `PackageItem`

### 31. PackageItem (`package_items`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `packageId -> Package.id`
  - `packingTaskItemId -> PackingTaskItem.id`
  - `productId -> Product.id`
- **Relationships:**
  - `PackageItem` N:1 `Package`
  - `PackageItem` N:1 `PackingTaskItem`
  - `PackageItem` N:1 `Product`

### 32. Shipment (`shipments`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `salesOrderId -> SalesOrder.id` (Unique)
  - `warehouseId -> Warehouse.id`
- **Relationships:**
  - `Shipment` 1:1 `SalesOrder`
  - `Shipment` N:1 `Warehouse`

### 33. Notification (`notifications`)
- **Primary Key:** `id`
- **Foreign Keys:**
  - `userId -> User.id`
- **Relationships:**
  - `Notification` N:1 `User`

---

## 6. Verification

- **Total number of Prisma models:** `33`
- **Total number of enums:** `21`
- **Total number of explicit relationships:** `63`
- **Total number of foreign-key fields:** `63`
- **Any ambiguous relationships:** `None`
- **Any models where the relationship/cardinality could not be determined directly from the Prisma schema:** `None` (All relationships and cardinalities are strictly declared in the Prisma schema files).
