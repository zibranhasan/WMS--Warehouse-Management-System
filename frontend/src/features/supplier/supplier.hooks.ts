import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supplierApi } from "./supplier.api";
import {
  CreateSupplierPayload,
  SupplierQueryParams,
  SupplierStatus,
  UpdateSupplierPayload,
} from "./supplier.types";

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params?: SupplierQueryParams) =>
    [...supplierKeys.all, "list", params] as const,
  details: () => [...supplierKeys.all, "detail"] as const,
  detail: (id: string) => ["supplier", id] as const,
};

export function useSuppliers(params?: SupplierQueryParams) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => supplierApi.getSuppliers(params),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierApi.getSupplierById(id),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) =>
      supplierApi.createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSupplierPayload;
    }) => supplierApi.updateSupplier(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(variables.id),
      });
    },
  });
}

export function useUpdateSupplierStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: SupplierStatus;
    }) => supplierApi.updateSupplierStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierApi.deleteSupplier(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(id),
      });
    },
  });
}

