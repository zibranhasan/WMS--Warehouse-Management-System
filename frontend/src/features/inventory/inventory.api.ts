import { apiClient, QueryParams } from "@/lib/api/api-client";
import {
  AllocateStockPayload,
  ApiResponse,
  BinStockSummary,
  DeallocateStockPayload,
  InventoryLocationMovement,
  InventoryLocationStock,
  InventoryStock,
  InventorySummary,
  LocationMovementQueryParams,
  LocationStockQueryParams,
  PaginatedResponse,
  ProductLocationsResponse,
  StockAdjustmentPayload,
  StockMovement,
  StockMovementQueryParams,
  TransferStockPayload,
  InventoryQueryParams,
} from "./inventory.types";

export const inventoryApi = {
  // 1. Warehouse Stock List
  getStockByWarehouse: async (
    warehouseId: string,
    params?: InventoryQueryParams
  ): Promise<PaginatedResponse<InventoryStock>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<InventoryStock>>(
      `inventory/warehouse/${warehouseId}`,
      { params: cleanParams }
    );
  },

  // 2. Product Stock Summary in Warehouse
  getInventorySummary: async (
    warehouseId: string,
    productId: string
  ): Promise<ApiResponse<InventorySummary>> => {
    return apiClient.get<ApiResponse<InventorySummary>>(
      `inventory/warehouse/${warehouseId}/product/${productId}/summary`
    );
  },

  // 3. Product Stock Level in Warehouse
  getProductStock: async (
    warehouseId: string,
    productId: string
  ): Promise<ApiResponse<InventoryStock>> => {
    return apiClient.get<ApiResponse<InventoryStock>>(
      `inventory/warehouse/${warehouseId}/product/${productId}`
    );
  },

  // 4. Adjust Stock (IN / OUT / ADJUSTMENT)
  adjustStock: async (
    payload: StockAdjustmentPayload
  ): Promise<ApiResponse<{ stock: InventoryStock; movement: StockMovement }>> => {
    return apiClient.post<
      ApiResponse<{ stock: InventoryStock; movement: StockMovement }>
    >("inventory/adjust", payload);
  },

  // 5. Audit Log: Warehouse Stock Movements
  getStockMovements: async (
    params?: StockMovementQueryParams
  ): Promise<PaginatedResponse<StockMovement>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<StockMovement>>(
      "inventory/movements",
      { params: cleanParams }
    );
  },

  // 6. Audit Log: Product Stock Movements
  getProductMovements: async (
    productId: string,
    params?: StockMovementQueryParams
  ): Promise<PaginatedResponse<StockMovement>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<StockMovement>>(
      `inventory/product/${productId}/movements`,
      { params: cleanParams }
    );
  },

  // 7. Allocate Stock to Bin
  allocateStock: async (
    payload: AllocateStockPayload
  ): Promise<
    ApiResponse<{
      locationStock: InventoryLocationStock;
      movement: InventoryLocationMovement;
    }>
  > => {
    return apiClient.post<
      ApiResponse<{
        locationStock: InventoryLocationStock;
        movement: InventoryLocationMovement;
      }>
    >("inventory/locations/allocate", payload);
  },

  // 8. Deallocate Stock from Bin
  deallocateStock: async (
    payload: DeallocateStockPayload
  ): Promise<
    ApiResponse<{
      locationStock: InventoryLocationStock;
      movement: InventoryLocationMovement;
    }>
  > => {
    return apiClient.post<
      ApiResponse<{
        locationStock: InventoryLocationStock;
        movement: InventoryLocationMovement;
      }>
    >("inventory/locations/deallocate", payload);
  },

  // 9. Transfer Stock between Bins
  transferStock: async (
    payload: TransferStockPayload
  ): Promise<
    ApiResponse<{
      fromBinStock: InventoryLocationStock;
      toBinStock: InventoryLocationStock;
      movement: InventoryLocationMovement;
    }>
  > => {
    return apiClient.post<
      ApiResponse<{
        fromBinStock: InventoryLocationStock;
        toBinStock: InventoryLocationStock;
        movement: InventoryLocationMovement;
      }>
    >("inventory/locations/transfer", payload);
  },

  // 10. Bin Stock & Capacity Details
  getStockByBin: async (binId: string): Promise<ApiResponse<BinStockSummary>> => {
    return apiClient.get<ApiResponse<BinStockSummary>>(
      `inventory/locations/bin/${binId}`
    );
  },

  // 11. Product Physical Locations
  getProductLocations: async (
    productId: string
  ): Promise<ApiResponse<ProductLocationsResponse>> => {
    return apiClient.get<ApiResponse<ProductLocationsResponse>>(
      `inventory/locations/product/${productId}`
    );
  },

  // 12. Warehouse Location Stock List
  getWarehouseLocationStock: async (
    warehouseId: string,
    params?: LocationStockQueryParams
  ): Promise<PaginatedResponse<InventoryLocationStock>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<InventoryLocationStock>>(
      `inventory/locations/warehouse/${warehouseId}`,
      { params: cleanParams }
    );
  },

  // 13. Location Movement History
  getLocationMovements: async (
    params?: LocationMovementQueryParams
  ): Promise<PaginatedResponse<InventoryLocationMovement>> => {
    const cleanParams: QueryParams = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = value;
        }
      });
    }

    return apiClient.get<PaginatedResponse<InventoryLocationMovement>>(
      "inventory/locations/movements",
      { params: cleanParams }
    );
  },
};
