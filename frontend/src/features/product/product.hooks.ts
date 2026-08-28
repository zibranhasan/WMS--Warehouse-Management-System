import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { productApi } from "./product.api";
import {
  CreateProductPayload,
  ProductQueryParams,
  ProductStatus,
  UpdateProductPayload,
} from "./product.types";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params?: ProductQueryParams) =>
    [...productKeys.all, params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => ["product", id] as const,
  sku: (sku: string) => ["product", "sku", sku] as const,
};

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.getProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProductById(id),
    enabled: Boolean(id),
  });
}

export function useProductBySku(sku: string) {
  return useQuery({
    queryKey: productKeys.sku(sku),
    queryFn: () => productApi.getProductBySku(sku),
    enabled: Boolean(sku),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      productApi.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductPayload;
    }) => productApi.updateProduct(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      productApi.updateProductStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(id),
      });
    },
  });
}
