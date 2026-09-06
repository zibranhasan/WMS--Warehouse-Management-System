import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { salesOrderApi } from "./sales-order.api";
import {
  CancelSalesOrderPayload,
  CreateSalesOrderPayload,
  SalesOrderQueryParams,
} from "./sales-order.types";
import { inventoryKeys } from "@/features/inventory/inventory.hooks";

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
export const salesOrderKeys = {
  all: ["sales-orders"] as const,
  lists: () => [...salesOrderKeys.all, "list"] as const,
  list: (params?: SalesOrderQueryParams) =>
    [...salesOrderKeys.all, "list", params] as const,
  details: () => [...salesOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...salesOrderKeys.all, "detail", id] as const,
};

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function useSalesOrders(params?: SalesOrderQueryParams) {
  return useQuery({
    queryKey: salesOrderKeys.list(params),
    queryFn: () => salesOrderApi.getSalesOrders(params),
  });
}

export function useSalesOrder(id: string) {
  return useQuery({
    queryKey: salesOrderKeys.detail(id),
    queryFn: () => salesOrderApi.getSalesOrderById(id),
    enabled: Boolean(id),
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSalesOrderPayload) =>
      salesOrderApi.createSalesOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelSalesOrderPayload;
    }) => salesOrderApi.cancelSalesOrder(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({
        queryKey: salesOrderKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
