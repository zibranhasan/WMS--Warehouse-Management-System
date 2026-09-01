import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shelfApi } from "./shelf.api";
import {
  CreateShelfPayload,
  LocationStatus,
  UpdateShelfPayload,
  ShelfQueryParams,
} from "./shelf.types";
import { aisleKeys } from "@/features/aisle/aisle.hooks";
import { zoneKeys } from "@/features/zone/zone.hooks";
import { warehouseKeys } from "@/features/warehouse/warehouse.hooks";

export const shelfKeys = {
  all: ["shelves"] as const,
  lists: () => [...shelfKeys.all, "list"] as const,
  list: (params?: ShelfQueryParams) => [...shelfKeys.lists(), params] as const,
  details: () => [...shelfKeys.all, "detail"] as const,
  detail: (id: string) => [...shelfKeys.details(), id] as const,
};

export function useShelves(params?: ShelfQueryParams) {
  return useQuery({
    queryKey: shelfKeys.list(params),
    queryFn: () => shelfApi.getShelves(params),
  });
}

export function useShelf(id: string) {
  return useQuery({
    queryKey: shelfKeys.detail(id),
    queryFn: () => shelfApi.getShelfById(id),
    enabled: Boolean(id),
  });
}

export function useCreateShelf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShelfPayload) => shelfApi.createShelf(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateShelf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShelfPayload }) =>
      shelfApi.updateShelf(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateShelfStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LocationStatus }) =>
      shelfApi.updateShelfStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useDeleteShelf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shelfApi.deleteShelf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}
