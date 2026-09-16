import { z } from "zod";
import { PaginatedResponse, SuccessResponse, ErrorResponse } from "../components/responses";
import { WarehouseResponse, SupplierResponse, ProductResponse } from "../components/schemas";
// ─── Response sub-schemas ─────────────────────────────────────────────
const UserRef = z
    .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
})
    .openapi("POUserRef");
const PurchaseOrderItemResponse = z
    .object({
    id: z.string(),
    purchaseOrderId: z.string(),
    productId: z.string(),
    orderedQuantity: z.number(),
    receivedQuantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    product: ProductResponse.optional(),
})
    .openapi("PurchaseOrderItem");
const PurchaseOrderResponse = z
    .object({
    id: z.string(),
    poNumber: z.string(),
    supplierId: z.string(),
    warehouseId: z.string(),
    notes: z.string().nullable().optional(),
    totalAmount: z.number(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]),
    createdById: z.string(),
    approvedById: z.string().nullable().optional(),
    approvedAt: z.string().nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    cancellationReason: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    supplier: SupplierResponse.optional(),
    warehouse: WarehouseResponse.optional(),
    createdBy: UserRef.optional(),
    approvedBy: UserRef.nullable().optional(),
    items: z.array(PurchaseOrderItemResponse).optional(),
})
    .openapi("PurchaseOrder");
const GoodsReceiptItemResponse = z
    .object({
    id: z.string(),
    goodsReceiptId: z.string(),
    productId: z.string(),
    quantity: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    product: ProductResponse.optional(),
})
    .openapi("GoodsReceiptItem");
const GoodsReceiptResponse = z
    .object({
    id: z.string(),
    receiptNumber: z.string(),
    purchaseOrderId: z.string(),
    warehouseId: z.string(),
    receivedById: z.string(),
    reason: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    receivedBy: UserRef.optional(),
    warehouse: WarehouseResponse.optional(),
    items: z.array(GoodsReceiptItemResponse).optional(),
})
    .openapi("GoodsReceipt");
// ─── Request schemas ─────────────────────────────────────────────────
const PurchaseOrderItemRequest = z
    .object({
    productId: z.string().min(1),
    orderedQuantity: z.number().gt(0),
    unitPrice: z.number().gte(0),
})
    .openapi("PurchaseOrderItemRequest");
const CreatePurchaseOrderRequest = z
    .object({
    supplierId: z.string().min(1),
    warehouseId: z.string().min(1),
    notes: z.string().nullable().optional(),
    items: z.array(PurchaseOrderItemRequest).min(1),
})
    .openapi("CreatePurchaseOrderRequest");
const UpdatePurchaseOrderRequest = z
    .object({
    supplierId: z.string().min(1).optional(),
    warehouseId: z.string().min(1).optional(),
    notes: z.string().nullable().optional(),
    items: z.array(PurchaseOrderItemRequest).min(1).optional(),
})
    .openapi("UpdatePurchaseOrderRequest");
const RejectPurchaseOrderRequest = z
    .object({
    rejectionReason: z.string().nullable().optional(),
})
    .openapi("RejectPurchaseOrderRequest");
const CancelPurchaseOrderRequest = z
    .object({
    cancellationReason: z.string().nullable().optional(),
})
    .openapi("CancelPurchaseOrderRequest");
const ReceiveItemRequest = z
    .object({
    productId: z.string().min(1),
    receivedQuantity: z.number().gt(0),
})
    .openapi("ReceiveItemRequest");
const ReceiveGoodsRequest = z
    .object({
    items: z.array(ReceiveItemRequest).min(1),
    reason: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
})
    .openapi("ReceiveGoodsRequest");
// ─── Query schemas ───────────────────────────────────────────────────
const PurchaseOrderListQuery = z
    .object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    supplierId: z.string().optional(),
    warehouseId: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]).optional(),
    createdById: z.string().optional(),
    approvedById: z.string().optional(),
    poNumber: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
})
    .openapi("PurchaseOrderListQuery");
// ─── Register paths ──────────────────────────────────────────────────
export function registerPurchaseOrderPaths(registry) {
    registry.registerComponent("schemas", "PurchaseOrder", PurchaseOrderResponse);
    registry.registerComponent("schemas", "PurchaseOrderItem", PurchaseOrderItemResponse);
    registry.registerComponent("schemas", "GoodsReceipt", GoodsReceiptResponse);
    registry.registerComponent("schemas", "GoodsReceiptItem", GoodsReceiptItemResponse);
    registry.registerComponent("schemas", "CreatePurchaseOrderRequest", CreatePurchaseOrderRequest);
    registry.registerComponent("schemas", "UpdatePurchaseOrderRequest", UpdatePurchaseOrderRequest);
    registry.registerComponent("schemas", "RejectPurchaseOrderRequest", RejectPurchaseOrderRequest);
    registry.registerComponent("schemas", "CancelPurchaseOrderRequest", CancelPurchaseOrderRequest);
    registry.registerComponent("schemas", "ReceiveGoodsRequest", ReceiveGoodsRequest);
    // ─── CREATE ───────────────────────────────────────────────────────
    // 1. POST /api/v1/purchase-orders
    registry.registerPath({
        method: "post",
        path: "/api/v1/purchase-orders",
        operationId: "createPurchaseOrder",
        tags: ["Purchase Orders"],
        summary: "Create purchase order",
        description: "Creates a new purchase order with items. Generates a unique PO number (e.g. PO-2026-000001). Validates supplier (must be ACTIVE), warehouse (must be ACTIVE), and all products (must be ACTIVE, not deleted). No duplicate products allowed. Totals are calculated server-side. Status is set to PENDING. Sends notification to Warehouse Manager(s) for the assigned warehouse. Separation of duties: only SUPER_ADMIN, ADMIN, or PROCUREMENT roles can create POs.",
        security: [{ cookieAuth: [] }],
        request: {
            body: { content: { "application/json": { schema: CreatePurchaseOrderRequest } } },
        },
        responses: {
            201: {
                description: "Purchase order created successfully",
                content: { "application/json": { schema: SuccessResponse(PurchaseOrderResponse) } },
            },
            400: { description: "Validation error, duplicate products, or inactive supplier/warehouse/product", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — requires SUPER_ADMIN, ADMIN, or PROCUREMENT role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Supplier, warehouse, or product not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── LIST ─────────────────────────────────────────────────────────
    // 2. GET /api/v1/purchase-orders
    registry.registerPath({
        method: "get",
        path: "/api/v1/purchase-orders",
        operationId: "listPurchaseOrders",
        tags: ["Purchase Orders"],
        summary: "List purchase orders",
        description: "Retrieves a paginated list of purchase orders with supplier, warehouse, createdBy, approvedBy, and items (with product) included. Warehouse-scoped users (non-SUPER_ADMIN/ADMIN) see only POs for their assigned warehouse. Supports search by poNumber, notes, supplier name/code, warehouse name/code. Filterable by status, supplierId, warehouseId, createdById, approvedById, date ranges.",
        security: [{ cookieAuth: [] }],
        request: { query: PurchaseOrderListQuery },
        responses: {
            200: {
                description: "Purchase orders fetched successfully",
                content: { "application/json": { schema: PaginatedResponse(PurchaseOrderResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── GET BY ID ────────────────────────────────────────────────────
    // 3. GET /api/v1/purchase-orders/:id
    registry.registerPath({
        method: "get",
        path: "/api/v1/purchase-orders/{id}",
        operationId: "getPurchaseOrderById",
        tags: ["Purchase Orders"],
        summary: "Get purchase order by ID",
        description: "Retrieves a single purchase order with full details: supplier, warehouse, createdBy, approvedBy, and items (with product). Warehouse access is validated via checkPoWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Purchase Order ID") }),
        },
        responses: {
            200: {
                description: "Purchase order retrieved successfully",
                content: { "application/json": { schema: SuccessResponse(PurchaseOrderResponse) } },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Purchase order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── UPDATE ───────────────────────────────────────────────────────
    // 4. PATCH /api/v1/purchase-orders/:id
    registry.registerPath({
        method: "patch",
        path: "/api/v1/purchase-orders/{id}",
        operationId: "updatePurchaseOrder",
        tags: ["Purchase Orders"],
        summary: "Update purchase order",
        description: "Updates a PENDING purchase order. Only PENDING orders can be updated. Supplier must be ACTIVE. If items are provided, existing items are deleted and replaced (no partial updates). Products must be ACTIVE and unique within the order. Totals are recalculated server-side. Only SUPER_ADMIN or ADMIN can change the warehouse assignment. Separation of duties: only SUPER_ADMIN, ADMIN, or PROCUREMENT roles can update POs.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Purchase Order ID") }),
            body: { content: { "application/json": { schema: UpdatePurchaseOrderRequest } } },
        },
        responses: {
            200: {
                description: "Purchase order updated successfully",
                content: { "application/json": { schema: SuccessResponse(PurchaseOrderResponse) } },
            },
            400: { description: "Validation error, not PENDING, or inactive supplier/warehouse/product", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or cannot change warehouse", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Purchase order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── APPROVE ──────────────────────────────────────────────────────
    // 5. PATCH /api/v1/purchase-orders/:id/approve
    registry.registerPath({
        method: "patch",
        path: "/api/v1/purchase-orders/{id}/approve",
        operationId: "approvePurchaseOrder",
        tags: ["Purchase Orders"],
        summary: "Approve purchase order",
        description: "Approves a PENDING purchase order. Only PENDING orders can be approved. The creator of the PO cannot approve their own order (separation of duties). Validates that the PO has items, supplier is ACTIVE, warehouse is ACTIVE, and all products are ACTIVE/deleted. Sets approvedById and approvedAt. Sends notification to the PO creator. Separation of duties: only SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER roles can approve.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Purchase Order ID") }),
        },
        responses: {
            200: {
                description: "Purchase order approved successfully",
                content: { "application/json": { schema: SuccessResponse(PurchaseOrderResponse) } },
            },
            400: { description: "Not PENDING, no items, or inactive supplier/warehouse/product", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — creator cannot approve own PO, or no warehouse access, or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Purchase order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── REJECT ───────────────────────────────────────────────────────
    // 6. PATCH /api/v1/purchase-orders/:id/reject
    registry.registerPath({
        method: "patch",
        path: "/api/v1/purchase-orders/{id}/reject",
        operationId: "rejectPurchaseOrder",
        tags: ["Purchase Orders"],
        summary: "Reject purchase order",
        description: "Rejects a PENDING purchase order. Only PENDING orders can be rejected. The creator of the PO cannot reject their own order (separation of duties). Sets rejectionReason if provided. Sends notification to the PO creator with the rejection reason. Separation of duties: only SUPER_ADMIN, ADMIN, or WAREHOUSE_MANAGER roles can reject.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Purchase Order ID") }),
            body: { content: { "application/json": { schema: RejectPurchaseOrderRequest } } },
        },
        responses: {
            200: {
                description: "Purchase order rejected successfully",
                content: { "application/json": { schema: SuccessResponse(PurchaseOrderResponse) } },
            },
            400: { description: "Not PENDING", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — creator cannot reject own PO, or no warehouse access, or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Purchase order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── CANCEL ───────────────────────────────────────────────────────
    // 7. PATCH /api/v1/purchase-orders/:id/cancel
    registry.registerPath({
        method: "patch",
        path: "/api/v1/purchase-orders/{id}/cancel",
        operationId: "cancelPurchaseOrder",
        tags: ["Purchase Orders"],
        summary: "Cancel purchase order",
        description: "Cancels a PENDING or APPROVED purchase order. Only PENDING or APPROVED orders can be cancelled. Sets cancellationReason if provided. Separation of duties: only SUPER_ADMIN, ADMIN, or PROCUREMENT roles can cancel.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Purchase Order ID") }),
            body: { content: { "application/json": { schema: CancelPurchaseOrderRequest } } },
        },
        responses: {
            200: {
                description: "Purchase order cancelled successfully",
                content: { "application/json": { schema: SuccessResponse(PurchaseOrderResponse) } },
            },
            400: { description: "Cannot cancel — status is not PENDING or APPROVED", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Purchase order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── RECEIVE GOODS ────────────────────────────────────────────────
    // 8. POST /api/v1/purchase-orders/:id/receive
    registry.registerPath({
        method: "post",
        path: "/api/v1/purchase-orders/{id}/receive",
        operationId: "receivePurchaseOrderGoods",
        tags: ["Purchase Orders"],
        summary: "Receive goods for purchase order",
        description: "Receives goods against an APPROVED or PARTIALLY_RECEIVED purchase order. Creates a GoodsReceipt record with GoodsReceiptItems, triggers inventory stock adjustment (IN) for each received product via the InventoryService transaction, updates PurchaseOrderItem.receivedQuantity, and updates PO status to RECEIVED (all items fully received) or PARTIALLY_RECEIVED (some items received). Received quantity cannot exceed ordered quantity. Products must be part of the PO. The transaction uses a pre-validation phase outside the transaction for fast-fail, then performs the atomic operation inside a transaction. Separation of duties: SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, or PROCUREMENT roles can receive.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Purchase Order ID") }),
            body: { content: { "application/json": { schema: ReceiveGoodsRequest } } },
        },
        responses: {
            200: {
                description: "Goods received successfully and inventory updated",
                content: {
                    "application/json": {
                        schema: SuccessResponse(z.object({
                            purchaseOrder: PurchaseOrderResponse,
                            goodsReceipt: GoodsReceiptResponse,
                        })),
                    },
                },
            },
            400: { description: "Validation error, not APPROVED/PARTIALLY_RECEIVED, quantity exceeds ordered, or product not in PO", content: { "application/json": { schema: ErrorResponse } } },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access or insufficient role", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Purchase order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
    // ─── GET RECEIPTS ─────────────────────────────────────────────────
    // 9. GET /api/v1/purchase-orders/:id/receipts
    registry.registerPath({
        method: "get",
        path: "/api/v1/purchase-orders/{id}/receipts",
        operationId: "getPurchaseOrderReceipts",
        tags: ["Purchase Orders"],
        summary: "Get purchase order receipts",
        description: "Retrieves all goods receipts for a purchase order, ordered by createdAt descending. Includes receivedBy user, warehouse, and items (with product). Returns an array of GoodsReceipt objects. Warehouse access is validated via checkPoWarehouseAccess.",
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string().describe("Purchase Order ID") }),
        },
        responses: {
            200: {
                description: "Purchase order receipts fetched successfully",
                content: {
                    "application/json": {
                        schema: SuccessResponse(z.array(GoodsReceiptResponse)),
                    },
                },
            },
            401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
            403: { description: "Forbidden — no warehouse access", content: { "application/json": { schema: ErrorResponse } } },
            404: { description: "Purchase order not found", content: { "application/json": { schema: ErrorResponse } } },
        },
    });
}
