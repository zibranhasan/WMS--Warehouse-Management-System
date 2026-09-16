import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";
import { registerWarehouseModulePaths } from "./paths/warehouseModule";
import { registerAuthPaths } from "./paths/auth";
import { registerUserPaths } from "./paths/users";
import { registerZonePaths } from "./paths/zones";
import { registerAislePaths } from "./paths/aisles";
import { registerShelfPaths } from "./paths/shelves";
import { registerBinPaths } from "./paths/bins";
import { registerCategoryPaths } from "./paths/categories";
import { registerBrandPaths } from "./paths/brands";
import { registerProductPaths } from "./paths/products";
import { registerSupplierPaths } from "./paths/suppliers";
import { registerInventoryPaths } from "./paths/inventory";
import { registerPurchaseOrderPaths } from "./paths/purchaseOrders";
import { registerSalesOrderPaths } from "./paths/salesOrders";
import { registerPickingPaths } from "./paths/picking";
import { registerPackingPaths } from "./paths/packing";
import { registerShippingPaths } from "./paths/shipping";
import { registerNotificationPaths } from "./paths/notifications";
registerAuthPaths(registry);
registerUserPaths(registry);
registerWarehouseModulePaths(registry);
registerZonePaths(registry);
registerAislePaths(registry);
registerShelfPaths(registry);
registerBinPaths(registry);
registerCategoryPaths(registry);
registerBrandPaths(registry);
registerProductPaths(registry);
registerSupplierPaths(registry);
registerInventoryPaths(registry);
registerPurchaseOrderPaths(registry);
registerSalesOrderPaths(registry);
registerPickingPaths(registry);
registerPackingPaths(registry);
registerShippingPaths(registry);
registerNotificationPaths(registry);
// Security scheme — type assertion needed for same Zod v4 type-level mismatch
registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
    description: "Better Auth session cookie. Obtained via POST /api/v1/auth/login.",
});
// ─── Fix malformed Zod-to-OpenAPI schemas ────────────────────────────
// Some Zod schemas with `.min().optional()` or `.nullable().optional()`
// produce raw Zod internals (`def`/`shape`) instead of proper JSON Schema
// when processed by registerComponent. Register these as raw JSON Schema
// objects directly to produce correct OpenAPI output.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
registry._definitions.push({
    type: "component",
    componentType: "schemas",
    name: "UpdateProfileRequest",
    component: {
        type: "object",
        properties: {
            name: { type: "string", minLength: 2, description: "User display name" },
        },
    },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
registry._definitions.push({
    type: "component",
    componentType: "schemas",
    name: "CreateProductRequest",
    component: {
        type: "object",
        required: ["sku", "name", "categoryId", "unit"],
        properties: {
            sku: { type: "string", minLength: 1, description: "Unique stock keeping unit" },
            name: { type: "string", minLength: 1, description: "Product name" },
            slug: { type: "string", description: "URL slug (auto-generated if omitted)" },
            description: { type: "string", description: "Product description" },
            categoryId: { type: "string", minLength: 1, description: "Category ID" },
            brandId: { type: ["string", "null"], description: "Brand ID (nullable)" },
            unit: { type: "string", minLength: 1, description: "Unit of measure" },
            status: { type: "string", enum: ["ACTIVE", "INACTIVE"], description: "Product status" },
        },
    },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
registry._definitions.push({
    type: "component",
    componentType: "schemas",
    name: "UpdateProductRequest",
    component: {
        type: "object",
        properties: {
            sku: { type: "string", minLength: 1, description: "Unique stock keeping unit" },
            name: { type: "string", minLength: 1, description: "Product name" },
            slug: { type: "string", description: "URL slug" },
            description: { type: ["string", "null"], description: "Product description" },
            categoryId: { type: "string", minLength: 1, description: "Category ID" },
            brandId: { type: ["string", "null"], description: "Brand ID (nullable)" },
            unit: { type: "string", minLength: 1, description: "Unit of measure" },
            status: { type: "string", enum: ["ACTIVE", "INACTIVE"], description: "Product status" },
            removeImage: { type: "boolean", description: "Set to true to remove the current image" },
        },
    },
});
export function generateOpenApiDocument() {
    const generator = new OpenApiGeneratorV31(registry.definitions);
    return generator.generateDocument({
        openapi: "3.1.0",
        info: {
            title: "WMS — Warehouse Management System API",
            version: "1.0.0",
            description: "Enterprise warehouse management API with procurement, inventory, sales fulfillment, and real-time notifications.",
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Development server",
            },
        ],
        security: [],
    });
}
