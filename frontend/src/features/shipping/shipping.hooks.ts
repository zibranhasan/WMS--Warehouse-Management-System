import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { shippingApi } from "./shipping.api";
import {
  CreateShipmentPayload,
  ShippingQueryParams,
  UpdateShipmentPayload,
  UpdateShipmentStatusPayload,
} from "./shipping.types";

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
export const shippingKeys = {
  all: ["shipping"] as const,
  lists: () => [...shippingKeys.all, "list"] as const,
  list: (params?: ShippingQueryParams) =>
    [...shippingKeys.all, "list", params] as const,
  details: () => [...shippingKeys.all, "detail"] as const,
  detail: (id: string) => [...shippingKeys.all, "detail", id] as const,
  bySalesOrder: (salesOrderId: string) =>
    [...shippingKeys.all, "sales-order", salesOrderId] as const,
};

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function useShipments(params?: ShippingQueryParams) {
  return useQuery({
    queryKey: shippingKeys.list(params),
    queryFn: () => shippingApi.getShipments(params),
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: shippingKeys.detail(id),
    queryFn: () => shippingApi.getShipment(id),
    enabled: Boolean(id),
  });
}

export function useShipmentBySalesOrder(salesOrderId: string) {
  return useQuery({
    queryKey: shippingKeys.bySalesOrder(salesOrderId),
    queryFn: () => shippingApi.getShipmentBySalesOrder(salesOrderId),
    enabled: Boolean(salesOrderId),
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShipmentPayload) =>
      shippingApi.createShipment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.all });
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateShipmentPayload;
    }) => shippingApi.updateShipment(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.all });
      queryClient.invalidateQueries({
        queryKey: shippingKeys.detail(variables.id),
      });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateShipmentStatusPayload;
    }) => shippingApi.updateShipmentStatus(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: shippingKeys.all });
      queryClient.invalidateQueries({
        queryKey: shippingKeys.detail(variables.id),
      });
    },
  });
}
