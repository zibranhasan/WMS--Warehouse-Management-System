import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zoneApi } from "./zone.api";
import {
  CreateZonePayload,
  LocationStatus,
  UpdateZonePayload,
  ZoneQueryParams,
} from "./zone.types";

export const zoneKeys = {
  all: ["zones"] as const,
  lists: () => [...zoneKeys.all, "list"] as const,
  list: (params?: ZoneQueryParams) => [...zoneKeys.lists(), params] as const,
  details: () => [...zoneKeys.all, "detail"] as const,
  detail: (id: string) => [...zoneKeys.details(), id] as const,
};

export function useZones(params?: ZoneQueryParams) {
  return useQuery({
    queryKey: zoneKeys.list(params),
    queryFn: () => zoneApi.getZones(params),
  });
}

export function useZone(id: string) {
  return useQuery({
    queryKey: zoneKeys.detail(id),
    queryFn: () => zoneApi.getZoneById(id),
    enabled: Boolean(id),
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateZonePayload) => zoneApi.createZone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateZonePayload }) =>
      zoneApi.updateZone(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useUpdateZoneStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LocationStatus }) =>
      zoneApi.updateZoneStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => zoneApi.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}
