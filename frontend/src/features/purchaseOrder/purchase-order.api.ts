import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  ApiResponse,
  CancelPurchaseOrderPayload,
  CreatePurchaseOrderPayload,
  GoodsReceipt,
  PaginatedResponse,
  PurchaseOrder,
  PurchaseOrderQueryParams,
  ReceiveGoodsPayload,
  RejectPurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from "./purchase-order.types";

export const purchaseOrderApi = {
  // 1. Create Purchase Order
  createPurchaseOrder: async (
    payload: CreatePurchaseOrderPayload
  ): Promise<ApiResponse<PurchaseOrder>> => {
    return apiClient.post<ApiResponse<PurchaseOrder>>("purchase-orders", payload);
  },

  // 2. List Purchase Orders (paginated, searchable, filterable, sortable)
  getPurchaseOrders: async (
    params?: PurchaseOrderQueryParams
  ): Promise<PaginatedResponse<PurchaseOrder>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<PurchaseOrder>>("purchase-orders", {
      params: cleanParams,
    });
  },

  // 3. Get Purchase Order by ID
  getPurchaseOrderById: async (
    id: string
  ): Promise<ApiResponse<PurchaseOrder>> => {
    return apiClient.get<ApiResponse<PurchaseOrder>>(`purchase-orders/${id}`);
  },

  // 4. Update Purchase Order (PENDING only)
  updatePurchaseOrder: async (
    id: string,
    payload: UpdatePurchaseOrderPayload
  ): Promise<ApiResponse<PurchaseOrder>> => {
    return apiClient.patch<ApiResponse<PurchaseOrder>>(
      `purchase-orders/${id}`,
      payload
    );
  },

  // 5. Approve Purchase Order (PENDING → APPROVED)
  approvePurchaseOrder: async (
    id: string
  ): Promise<ApiResponse<PurchaseOrder>> => {
    return apiClient.patch<ApiResponse<PurchaseOrder>>(
      `purchase-orders/${id}/approve`
    );
  },

  // 6. Reject Purchase Order (PENDING → REJECTED)
  rejectPurchaseOrder: async (
    id: string,
    payload: RejectPurchaseOrderPayload
  ): Promise<ApiResponse<PurchaseOrder>> => {
    return apiClient.patch<ApiResponse<PurchaseOrder>>(
      `purchase-orders/${id}/reject`,
      payload
    );
  },

  // 7. Cancel Purchase Order (PENDING/APPROVED → CANCELLED)
  cancelPurchaseOrder: async (
    id: string,
    payload: CancelPurchaseOrderPayload
  ): Promise<ApiResponse<PurchaseOrder>> => {
    return apiClient.patch<ApiResponse<PurchaseOrder>>(
      `purchase-orders/${id}/cancel`,
      payload
    );
  },

  // 8. Receive Goods (APPROVED/PARTIALLY_RECEIVED → PARTIALLY_RECEIVED/RECEIVED)
  receiveGoods: async (
    id: string,
    payload: ReceiveGoodsPayload
  ): Promise<
    ApiResponse<{ purchaseOrder: PurchaseOrder; goodsReceipt: GoodsReceipt }>
  > => {
    return apiClient.post<
      ApiResponse<{ purchaseOrder: PurchaseOrder; goodsReceipt: GoodsReceipt }>
    >(`purchase-orders/${id}/receive`, payload);
  },

  // 9. Get Goods Receipts for a Purchase Order
  getPurchaseOrderReceipts: async (
    id: string
  ): Promise<ApiResponse<GoodsReceipt[]>> => {
    return apiClient.get<ApiResponse<GoodsReceipt[]>>(
      `purchase-orders/${id}/receipts`
    );
  },
};
