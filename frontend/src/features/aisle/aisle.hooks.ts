import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aisleApi } from "./aisle.api";
import {
  CreateAislePayload,
  LocationStatus,
  UpdateAislePayload,
  AisleQueryParams,
} from "./aisle.types";
import { zoneKeys } from "@/features/zone/zone.hooks";
import { warehouseKeys } from "@/features/warehouse/warehouse.hooks";

export const aisleKeys = {
  all: ["aisles"] as const,
  lists: () => [...aisleKeys.all, "list"] as const,
  list: (params?: AisleQueryParams) => [...aisleKeys.lists(), params] as const,
  details: () => [...aisleKeys.all, "detail"] as const,
  detail: (id: string) => [...aisleKeys.details(), id] as const,
};

export function useAisles(params?: AisleQueryParams) {
  return useQuery({
    queryKey: aisleKeys.list(params),
    queryFn: () => aisleApi.getAisles(params),
  });
}

export function useAisle(id: string) {
  return useQuery({
    queryKey: aisleKeys.detail(id),
    queryFn: () => aisleApi.getAisleById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAisle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAislePayload) => aisleApi.createAisle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateAisle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAislePayload }) =>
      aisleApi.updateAisle(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateAisleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LocationStatus }) =>
      aisleApi.updateAisleStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useDeleteAisle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => aisleApi.deleteAisle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}
