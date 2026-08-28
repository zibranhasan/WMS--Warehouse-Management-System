import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { brandApi } from "./brand.api";
import {
  BrandQueryParams,
  BrandStatus,
  CreateBrandPayload,
  UpdateBrandPayload,
} from "./brand.types";

export const brandKeys = {
  all: ["brands"] as const,
  lists: () => [...brandKeys.all, "list"] as const,
  list: (params?: BrandQueryParams) =>
    [...brandKeys.all, params] as const,
  details: () => [...brandKeys.all, "detail"] as const,
  detail: (id: string) => ["brand", id] as const,
};

export function useBrands(params?: BrandQueryParams) {
  return useQuery({
    queryKey: brandKeys.list(params),
    queryFn: () => brandApi.getBrands(params),
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => brandApi.getBrandById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandPayload) =>
      brandApi.createBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBrandPayload;
    }) => brandApi.updateBrand(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({
        queryKey: brandKeys.detail(variables.id),
      });
    },
  });
}

export function useUpdateBrandStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BrandStatus }) =>
      brandApi.updateBrandStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({
        queryKey: brandKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandApi.deleteBrand(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({
        queryKey: brandKeys.detail(id),
      });
    },
  });
}
