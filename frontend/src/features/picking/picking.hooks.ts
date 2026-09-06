import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { pickingApi } from "./picking.api";
import {
  AssignPickerPayload,
  CreatePickingPayload,
  PickItemsPayload,
  PickingQueryParams,
} from "./picking.types";
import { inventoryKeys } from "@/features/inventory/inventory.hooks";

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
export const pickingKeys = {
  all: ["picking"] as const,
  lists: () => [...pickingKeys.all, "list"] as const,
  list: (params?: PickingQueryParams) =>
    [...pickingKeys.all, "list", params] as const,
  details: () => [...pickingKeys.all, "detail"] as const,
  detail: (id: string) => [...pickingKeys.all, "detail", id] as const,
  bySalesOrder: (salesOrderId: string) =>
    [...pickingKeys.all, "sales-order", salesOrderId] as const,
};

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function usePickings(params?: PickingQueryParams) {
  return useQuery({
    queryKey: pickingKeys.list(params),
    queryFn: () => pickingApi.getPickingTasks(params),
  });
}

export function usePicking(id: string) {
  return useQuery({
    queryKey: pickingKeys.detail(id),
    queryFn: () => pickingApi.getPickingTaskById(id),
    enabled: Boolean(id),
  });
}

export function usePickingBySalesOrder(salesOrderId: string) {
  return useQuery({
    queryKey: pickingKeys.bySalesOrder(salesOrderId),
    queryFn: () => pickingApi.getPickingTaskBySalesOrder(salesOrderId),
    enabled: Boolean(salesOrderId),
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export function useCreatePicking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePickingPayload) =>
      pickingApi.createPickingTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickingKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useAssignPicker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AssignPickerPayload;
    }) => pickingApi.assignPicker(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: pickingKeys.all });
      queryClient.invalidateQueries({
        queryKey: pickingKeys.detail(variables.id),
      });
    },
  });
}

export function useStartPicking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pickingApi.startPicking(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: pickingKeys.all });
      queryClient.invalidateQueries({
        queryKey: pickingKeys.detail(variables),
      });
    },
  });
}

export function usePickItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PickItemsPayload;
    }) => pickingApi.pickItems(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: pickingKeys.all });
      queryClient.invalidateQueries({
        queryKey: pickingKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
