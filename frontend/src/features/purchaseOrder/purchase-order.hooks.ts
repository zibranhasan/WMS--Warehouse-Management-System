import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { purchaseOrderApi } from "./purchase-order.api";
import {
  CancelPurchaseOrderPayload,
  CreatePurchaseOrderPayload,
  PurchaseOrderQueryParams,
  ReceiveGoodsPayload,
  RejectPurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
} from "./purchase-order.types";
import { inventoryKeys } from "@/features/inventory/inventory.hooks";
import { warehouseKeys } from "@/features/warehouse/warehouse.hooks";

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (params?: PurchaseOrderQueryParams) =>
    [...purchaseOrderKeys.all, "list", params] as const,
  details: () => [...purchaseOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...purchaseOrderKeys.all, "detail", id] as const,
  receipts: (id: string) =>
    [...purchaseOrderKeys.all, "detail", id, "receipts"] as const,
};

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function usePurchaseOrders(params?: PurchaseOrderQueryParams) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => purchaseOrderApi.getPurchaseOrders(params),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => purchaseOrderApi.getPurchaseOrderById(id),
    enabled: Boolean(id),
  });
}

export function usePurchaseOrderReceipts(id: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.receipts(id),
    queryFn: () => purchaseOrderApi.getPurchaseOrderReceipts(id),
    enabled: Boolean(id),
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) =>
      purchaseOrderApi.createPurchaseOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePurchaseOrderPayload;
    }) => purchaseOrderApi.updatePurchaseOrder(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(variables.id),
      });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrderApi.approvePurchaseOrder(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(id),
      });
    },
  });
}

export function useRejectPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: RejectPurchaseOrderPayload;
    }) => purchaseOrderApi.rejectPurchaseOrder(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(variables.id),
      });
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelPurchaseOrderPayload;
    }) => purchaseOrderApi.cancelPurchaseOrder(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(variables.id),
      });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReceiveGoodsPayload;
    }) => purchaseOrderApi.receiveGoods(id, payload),
    onSuccess: (_data, variables) => {
      // Invalidate PO queries
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.receipts(variables.id),
      });

      // Receiving updates inventory on the backend
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
}
