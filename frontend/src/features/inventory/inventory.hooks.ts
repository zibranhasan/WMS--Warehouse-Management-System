import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "./inventory.api";
import {
  AllocateStockPayload,
  DeallocateStockPayload,
  InventoryQueryParams,
  LocationMovementQueryParams,
  LocationStockQueryParams,
  StockAdjustmentPayload,
  StockMovementQueryParams,
  TransferStockPayload,
} from "./inventory.types";
import { binKeys } from "@/features/bin/bin.hooks";
import { shelfKeys } from "@/features/shelf/shelf.hooks";
import { aisleKeys } from "@/features/aisle/aisle.hooks";
import { zoneKeys } from "@/features/zone/zone.hooks";
import { warehouseKeys } from "@/features/warehouse/warehouse.hooks";

export const inventoryKeys = {
  all: ["inventory"] as const,
  warehouseStock: (warehouseId?: string, params?: InventoryQueryParams) =>
    [...inventoryKeys.all, "warehouse", warehouseId, params] as const,
  summary: (warehouseId?: string, productId?: string) =>
    [...inventoryKeys.all, "summary", warehouseId, productId] as const,
  productStock: (warehouseId?: string, productId?: string) =>
    [...inventoryKeys.all, "product-stock", warehouseId, productId] as const,
  movements: (params?: StockMovementQueryParams) =>
    [...inventoryKeys.all, "movements", params] as const,
  productMovements: (productId?: string, params?: StockMovementQueryParams) =>
    [...inventoryKeys.all, "product-movements", productId, params] as const,
  binStock: (binId?: string) =>
    [...inventoryKeys.all, "bin-stock", binId] as const,
  productLocations: (productId?: string) =>
    [...inventoryKeys.all, "product-locations", productId] as const,
  warehouseLocationStock: (
    warehouseId?: string,
    params?: LocationStockQueryParams
  ) => [...inventoryKeys.all, "warehouse-locations", warehouseId, params] as const,
  locationMovements: (params?: LocationMovementQueryParams) =>
    [...inventoryKeys.all, "location-movements", params] as const,
};

// 1. Fetch warehouse inventory stock list
export function useWarehouseInventory(
  warehouseId?: string,
  params?: InventoryQueryParams
) {
  return useQuery({
    queryKey: inventoryKeys.warehouseStock(warehouseId, params),
    queryFn: () => inventoryApi.getStockByWarehouse(warehouseId!, params),
    enabled: Boolean(warehouseId),
  });
}

// 2. Fetch inventory summary for product in warehouse
export function useInventorySummary(
  warehouseId?: string,
  productId?: string
) {
  return useQuery({
    queryKey: inventoryKeys.summary(warehouseId, productId),
    queryFn: () => inventoryApi.getInventorySummary(warehouseId!, productId!),
    enabled: Boolean(warehouseId && productId),
  });
}

// 3. Fetch product stock in warehouse
export function useProductStock(warehouseId?: string, productId?: string) {
  return useQuery({
    queryKey: inventoryKeys.productStock(warehouseId, productId),
    queryFn: () => inventoryApi.getProductStock(warehouseId!, productId!),
    enabled: Boolean(warehouseId && productId),
  });
}

// 4. Fetch stock movement audit trail
export function useStockMovements(params?: StockMovementQueryParams) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => inventoryApi.getStockMovements(params),
  });
}

// 5. Fetch stock movement history for product
export function useProductStockMovements(
  productId?: string,
  params?: StockMovementQueryParams
) {
  return useQuery({
    queryKey: inventoryKeys.productMovements(productId, params),
    queryFn: () => inventoryApi.getProductMovements(productId!, params),
    enabled: Boolean(productId),
  });
}

// 6. Fetch bin stock and capacity details
export function useBinStock(binId?: string) {
  return useQuery({
    queryKey: inventoryKeys.binStock(binId),
    queryFn: () => inventoryApi.getStockByBin(binId!),
    enabled: Boolean(binId),
  });
}

// 7. Fetch product physical bin locations
export function useProductLocations(productId?: string) {
  return useQuery({
    queryKey: inventoryKeys.productLocations(productId),
    queryFn: () => inventoryApi.getProductLocations(productId!),
    enabled: Boolean(productId),
  });
}

// 8. Fetch warehouse location stock list
export function useWarehouseLocationStock(
  warehouseId?: string,
  params?: LocationStockQueryParams
) {
  return useQuery({
    queryKey: inventoryKeys.warehouseLocationStock(warehouseId, params),
    queryFn: () => inventoryApi.getWarehouseLocationStock(warehouseId!, params),
    enabled: Boolean(warehouseId),
  });
}

// 9. Fetch location movement audit history
export function useLocationMovements(params?: LocationMovementQueryParams) {
  return useQuery({
    queryKey: inventoryKeys.locationMovements(params),
    queryFn: () => inventoryApi.getLocationMovements(params),
  });
}

// --- MUTATIONS ---

// Adjust Stock (IN / OUT / ADJUSTMENT)
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) =>
      inventoryApi.adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

// Allocate Stock to Bin
export function useAllocateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AllocateStockPayload) =>
      inventoryApi.allocateStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

// Deallocate Stock from Bin
export function useDeallocateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeallocateStockPayload) =>
      inventoryApi.deallocateStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}

// Transfer Stock between Bins
export function useTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransferStockPayload) =>
      inventoryApi.transferStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: binKeys.all });
      queryClient.invalidateQueries({ queryKey: shelfKeys.all });
      queryClient.invalidateQueries({ queryKey: aisleKeys.all });
      queryClient.invalidateQueries({ queryKey: zoneKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
    },
  });
}
