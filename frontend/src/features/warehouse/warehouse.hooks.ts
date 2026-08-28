import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { warehouseApi } from "./warehouse.api";
import {
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseQueryParams,
  WarehouseStatus,
} from "./warehouse.types";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => [...warehouseKeys.all, "list"] as const,
  list: (params?: WarehouseQueryParams) =>
    [...warehouseKeys.all, params] as const,
  details: () => [...warehouseKeys.all, "detail"] as const,
  detail: (id: string) => ["warehouse", id] as const,
  structure: (id: string) => ["warehouse", id, "structure"] as const,
  users: (id: string, params?: Record<string, unknown>) =>
    ["warehouse", id, "users", params] as const,
};

export function useWarehouses(params?: WarehouseQueryParams) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: () => warehouseApi.getWarehouses(params),
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseApi.getWarehouseById(id),
    enabled: Boolean(id),
  });
}

export function useWarehouseStructure(warehouseId: string) {
  return useQuery({
    queryKey: warehouseKeys.structure(warehouseId),
    queryFn: () => warehouseApi.getWarehouseStructure(warehouseId),
    enabled: Boolean(warehouseId),
  });
}

export function useWarehouseUsers(
  warehouseId: string,
  params?: Record<string, unknown>
) {
  return useQuery({
    queryKey: warehouseKeys.users(warehouseId, params),
    queryFn: () => warehouseApi.getWarehouseUsers(warehouseId, params),
    enabled: Boolean(warehouseId),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWarehousePayload) =>
      warehouseApi.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateWarehousePayload;
    }) => warehouseApi.updateWarehouse(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.structure(variables.id),
      });
    },
  });
}

export function useUpdateWarehouseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WarehouseStatus }) =>
      warehouseApi.updateWarehouseStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.structure(variables.id),
      });
    },
  });
}

export function useAssignUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      warehouseId,
      userId,
    }: {
      warehouseId: string;
      userId: string;
    }) => warehouseApi.assignUser(warehouseId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.users(variables.warehouseId),
      });
    },
  });
}

export function useUnassignUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      warehouseId,
      userId,
    }: {
      warehouseId: string;
      userId: string;
    }) => warehouseApi.unassignUser(warehouseId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.users(variables.warehouseId),
      });
    },
  });
}
