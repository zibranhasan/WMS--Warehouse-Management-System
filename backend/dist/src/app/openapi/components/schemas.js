import { z } from "zod";
// ─── Shared sub-schemas ───────────────────────────────────────────────
const WarehouseRef = z
    .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
})
    .openapi("WarehouseRef");
const CategoryRef = z
    .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
})
    .openapi("CategoryRef");
const BrandRef = z
    .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
})
    .openapi("BrandRef");
const UserRef = z
    .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
})
    .openapi("UserRef");
// ─── Warehouse ────────────────────────────────────────────────────────
export const WarehouseResponse = z
    .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
    .openapi("Warehouse");
// ─── User ─────────────────────────────────────────────────────────────
export const UserResponse = z
    .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean().nullable().optional(),
    image: z.string().nullable().optional(),
    role: z.string(),
    status: z.string(),
    needPasswordChange: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    deletedAt: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    warehouseId: z.string().nullable().optional(),
    warehouse: WarehouseRef.nullable().optional(),
})
    .openapi("User");
export const UserProfileResponse = z
    .object({
    user: UserResponse,
    session: z
        .object({
        id: z.string(),
        expiresAt: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
        .optional(),
})
    .openapi("UserProfile");
// ─── Zone ─────────────────────────────────────────────────────────────
export const ZoneResponse = z
    .object({
    id: z.string(),
    warehouseId: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    warehouse: WarehouseRef.optional(),
})
    .openapi("Zone");
// ─── Aisle ────────────────────────────────────────────────────────────
export const AisleResponse = z
    .object({
    id: z.string(),
    zoneId: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    zone: ZoneResponse.optional(),
})
    .openapi("Aisle");
// ─── Shelf ────────────────────────────────────────────────────────────
export const ShelfResponse = z
    .object({
    id: z.string(),
    aisleId: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    aisle: AisleResponse.optional(),
})
    .openapi("Shelf");
// ─── Bin ──────────────────────────────────────────────────────────────
export const BinResponse = z
    .object({
    id: z.string(),
    shelfId: z.string(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    capacity: z.number().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    shelf: ShelfResponse.optional(),
    usedCapacity: z.number().optional(),
    availableCapacity: z.number().optional(),
})
    .openapi("Bin");
// ─── Category ─────────────────────────────────────────────────────────
export const CategoryResponse = z
    .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
    .openapi("Category");
// ─── Brand ────────────────────────────────────────────────────────────
export const BrandResponse = z
    .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
    .openapi("Brand");
// ─── Product ──────────────────────────────────────────────────────────
export const ProductResponse = z
    .object({
    id: z.string(),
    sku: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    categoryId: z.string(),
    brandId: z.string().nullable().optional(),
    unit: z.string(),
    image: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    category: CategoryRef.optional(),
    brand: BrandRef.nullable().optional(),
})
    .openapi("Product");
// ─── Supplier ─────────────────────────────────────────────────────────
export const SupplierResponse = z
    .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    contactPerson: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
    .openapi("Supplier");
// ─── SalesOrder summary (shared by Picking, Packing, Shipping) ──────
export const SalesOrderSummary = z
    .object({
    id: z.string(),
    orderNumber: z.string(),
    createdById: z.string(),
    warehouseId: z.string(),
    status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
    totalAmount: z.number(),
    notes: z.string().nullable().optional(),
    cancellationReason: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
    .openapi("SalesOrderSummary");
