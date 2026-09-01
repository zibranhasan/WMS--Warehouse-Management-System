import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { binApi } from "./bin.api";
import {
  CreateBinPayload,
  LocationStatus,
  UpdateBinPayload,
  BinQueryParams,
} from "./bin.types";
import { shelfKeys } from "@/features/shelf/shelf.hooks";
import { aisleKeys } from "@/features/aisle/aisle.hooks";
import { zoneKeys } from "@/features/zone/zone.hooks";
import { warehouseKeys } from "@/features/warehouse/warehouse.hooks";

export const binKeys = {
  all: ["bins"] as const,
  lists: () => [...binKeys.all, "list"] as const,
  list: (params?: BinQueryParams) => [...binKeys.lists(), params] as const,
  details: () => [...binKeys.all, "detail"] as const,
  detail: (id: string) => [...binKeys.details(), id] as const,
};

export function useBins(params?: BinQueryParams) {
  return useQuery({
    queryKey: binKeys.list(params),
    queryFn: () => binApi.getBins(params),
  });
}

export function useBin(id: string) {
  return useQuery({
    queryKey: binKeys.detail(id),
    queryFn: () => binApi.getBinById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBinPayload) => binApi.createBin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBinPayload }) =>
      binApi.updateBin(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: binKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateBinStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LocationStatus }) =>
      binApi.updateBinStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: binKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useDeleteBin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => binApi.deleteBin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}
