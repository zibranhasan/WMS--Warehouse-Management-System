import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { packingApi } from "./packing.api";
import {
  AddPackageItemsPayload,
  AssignPackerPayload,
  CancelPackingTaskPayload,
  CreatePackagePayload,
  CreatePackingTaskPayload,
  PackingTaskQueryParams,
} from "./packing.types";

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------
export const packingKeys = {
  all: ["packing"] as const,
  lists: () => [...packingKeys.all, "list"] as const,
  list: (params?: PackingTaskQueryParams) =>
    [...packingKeys.all, "list", params] as const,
  details: () => [...packingKeys.all, "detail"] as const,
  detail: (id: string) => [...packingKeys.all, "detail", id] as const,
  bySalesOrder: (salesOrderId: string) =>
    [...packingKeys.all, "sales-order", salesOrderId] as const,
  packages: (id: string) => [...packingKeys.all, "detail", id, "packages"] as const,
};

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function usePackingTasks(params?: PackingTaskQueryParams) {
  return useQuery({
    queryKey: packingKeys.list(params),
    queryFn: () => packingApi.getPackingTasks(params),
  });
}

export function usePackingTask(id: string) {
  return useQuery({
    queryKey: packingKeys.detail(id),
    queryFn: () => packingApi.getPackingTaskById(id),
    enabled: Boolean(id),
  });
}

export function usePackingTaskBySalesOrder(salesOrderId: string) {
  return useQuery({
    queryKey: packingKeys.bySalesOrder(salesOrderId),
    queryFn: () => packingApi.getPackingTaskBySalesOrder(salesOrderId),
    enabled: Boolean(salesOrderId),
  });
}

export function usePackingPackages(id: string) {
  return useQuery({
    queryKey: packingKeys.packages(id),
    queryFn: () => packingApi.getPackages(id),
    enabled: Boolean(id),
  });
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export function useCreatePackingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePackingTaskPayload) =>
      packingApi.createPackingTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packingKeys.all });
    },
  });
}

export function useAssignPacker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AssignPackerPayload;
    }) => packingApi.assignPacker(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: packingKeys.all });
      queryClient.invalidateQueries({
        queryKey: packingKeys.detail(variables.id),
      });
    },
  });
}

export function useStartPacking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packingApi.startPacking(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: packingKeys.all });
      queryClient.invalidateQueries({
        queryKey: packingKeys.detail(variables),
      });
    },
  });
}

export function useCancelPackingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelPackingTaskPayload;
    }) => packingApi.cancelPackingTask(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: packingKeys.all });
      queryClient.invalidateQueries({
        queryKey: packingKeys.detail(variables.id),
      });
    },
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreatePackagePayload;
    }) => packingApi.createPackage(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: packingKeys.all });
      queryClient.invalidateQueries({
        queryKey: packingKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: packingKeys.packages(variables.id),
      });
    },
  });
}

export function useAddPackageItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      packageId,
      payload,
    }: {
      id: string;
      packageId: string;
      payload: AddPackageItemsPayload;
    }) => packingApi.addPackageItems(id, packageId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: packingKeys.all });
      queryClient.invalidateQueries({
        queryKey: packingKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: packingKeys.packages(variables.id),
      });
    },
  });
}

export function useClosePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      packageId,
    }: {
      id: string;
      packageId: string;
    }) => packingApi.closePackage(id, packageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: packingKeys.all });
      queryClient.invalidateQueries({
        queryKey: packingKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: packingKeys.packages(variables.id),
      });
    },
  });
}
