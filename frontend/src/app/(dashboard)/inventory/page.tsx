"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import {
  useWarehouseInventory,
  useWarehouseLocationStock,
  useStockMovements,
  useLocationMovements,
  useAdjustStock,
  useAllocateStock,
  useDeallocateStock,
  useTransferStock,
} from "@/features/inventory/inventory.hooks";
import {
  InventoryLocationStock,
  StockAdjustmentPayload,
  AllocateStockPayload,
  DeallocateStockPayload,
  TransferStockPayload,
} from "@/features/inventory/inventory.types";
import { InventoryStockTable } from "@/features/inventory/components/inventory-stock-table";
import { InventoryLocationTable } from "@/features/inventory/components/inventory-location-table";
import { StockMovementTable } from "@/features/inventory/components/stock-movement-table";
import { StockAdjustDialog } from "@/features/inventory/components/stock-adjust-dialog";
import { StockAllocateDialog } from "@/features/inventory/components/stock-allocate-dialog";
import { StockDeallocateDialog } from "@/features/inventory/components/stock-deallocate-dialog";
import { StockTransferDialog } from "@/features/inventory/components/stock-transfer-dialog";
import { InventorySummaryDialog } from "@/features/inventory/components/inventory-summary-dialog";
import { BinStockDetailsDialog } from "@/features/inventory/components/bin-stock-details-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { TableEmptyState } from "@/components/shared/table-empty-state";
import { Button } from "@/components/ui/button";
import { Building2, Boxes, Box, History, Plus, RefreshCw, X } from "lucide-react";

type InventoryTab = "warehouse" | "location" | "movements";

export default function InventoryDashboardPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  // Fetch active warehouses
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses({
    limit: 100,
    status: "ACTIVE",
  });
  const warehouses = warehousesData?.data || [];

  // Active state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<InventoryTab>("warehouse");

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  const handleWarehouseChange = (id: string) => {
    setSelectedWarehouseId(id);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    setPage(1);
  };

  // Queries
  const stockQuery = useWarehouseInventory(
    activeTab === "warehouse" && selectedWarehouseId ? selectedWarehouseId : undefined,
    {
      page,
      limit,
      searchTerm: debouncedSearch || undefined,
    }
  );

  const locationQuery = useWarehouseLocationStock(
    activeTab === "location" && selectedWarehouseId ? selectedWarehouseId : undefined,
    {
      page,
      limit,
      searchTerm: debouncedSearch || undefined,
    }
  );

  const warehouseMovementsQuery = useStockMovements(
    activeTab === "movements"
      ? {
          page,
          limit,
          ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
          ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
        }
      : undefined
  );

  const locationMovementsQuery = useLocationMovements(
    activeTab === "movements"
      ? {
          page,
          limit,
          ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
          ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
        }
      : undefined
  );

  // Mutations
  const adjustMutation = useAdjustStock();
  const allocateMutation = useAllocateStock();
  const deallocateMutation = useDeallocateStock();
  const transferMutation = useTransferStock();

  // Dialog States
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [deallocatingStock, setDeallocatingStock] = useState<InventoryLocationStock | null>(null);
  const [transferringStock, setTransferringStock] = useState<InventoryLocationStock | null>(null);

  // Detail Modal States
  const [summaryTarget, setSummaryTarget] = useState<{ warehouseId: string; productId: string } | null>(null);
  const [detailsBinId, setDetailsBinId] = useState<string | null>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Mutation Handlers
  const handleAdjustSubmit = async (payload: StockAdjustmentPayload) => {
    try {
      await adjustMutation.mutateAsync(payload);
      setIsAdjustOpen(false);
      showFeedback("success", "Stock adjustment recorded successfully.");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to adjust stock.");
    }
  };

  const handleAllocateSubmit = async (payload: AllocateStockPayload) => {
    try {
      await allocateMutation.mutateAsync(payload);
      setIsAllocateOpen(false);
      showFeedback("success", "Stock allocated to bin successfully.");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to allocate stock.");
    }
  };

  const handleDeallocateSubmit = async (payload: DeallocateStockPayload) => {
    try {
      await deallocateMutation.mutateAsync(payload);
      setDeallocatingStock(null);
      showFeedback("success", "Stock deallocated from bin successfully.");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to deallocate stock.");
    }
  };

  const handleTransferSubmit = async (payload: TransferStockPayload) => {
    try {
      await transferMutation.mutateAsync(payload);
      setTransferringStock(null);
      showFeedback("success", "Stock transferred between bins successfully.");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to transfer stock.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-lg border p-4 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Inventory & Stock Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor warehouse stock levels, allocate items to bins, transfer inventory, and track stock movement audit logs.
          </p>
        </div>

        {canMutate && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => setIsAdjustOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Adjust Stock
            </Button>
            <Button
              type="button"
              onClick={() => setIsAllocateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Allocate to Bin
            </Button>
          </div>
        )}
      </div>

      {/* Top Selector & Tabs Control */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Warehouse Dropdown */}
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Select Active Facility:
              </span>
              {isLoadingWarehouses ? (
                <div className="h-8 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
              ) : (
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">-- Select Warehouse Facility --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab("warehouse");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "warehouse"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Boxes className="h-3.5 w-3.5" />
              Warehouse Stock
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("location");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "location"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              Bin Allocation
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("movements");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === "movements"
                  ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Movement History
            </button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by product name, SKU, bin code, reason, or reference..."
          />
        </div>
      </div>

      {/* --- TAB CONTENT 1: WAREHOUSE STOCK --- */}
      {activeTab === "warehouse" && (
        <>
          {!selectedWarehouseId ? (
            <TableEmptyState
              title="No Warehouse Selected"
              description="Please select a warehouse facility above to view total stock levels."
            />
          ) : stockQuery.isError ? (
            <PageErrorAlert
              title="Error loading warehouse stock"
              message={
                stockQuery.error instanceof Error
                  ? stockQuery.error.message
                  : "Failed to fetch warehouse stock."
              }
              onRetry={stockQuery.refetch}
            />
          ) : (
            <>
              <InventoryStockTable
                stocks={stockQuery.data?.data || []}
                isLoading={stockQuery.isLoading}
                onViewSummary={(stock) =>
                  setSummaryTarget({
                    warehouseId: stock.warehouseId,
                    productId: stock.productId,
                  })
                }
              />

              {stockQuery.data?.meta && (
                <DataTablePagination
                  page={stockQuery.data.meta.page}
                  limit={stockQuery.data.meta.limit}
                  total={stockQuery.data.meta.total}
                  totalPages={stockQuery.data.meta.totalPages}
                  isLoading={stockQuery.isLoading}
                  onPageChange={(newPage) => setPage(newPage)}
                  entityName="inventory stock records"
                />
              )}
            </>
          )}
        </>
      )}

      {/* --- TAB CONTENT 2: BIN ALLOCATION --- */}
      {activeTab === "location" && (
        <>
          {!selectedWarehouseId ? (
            <TableEmptyState
              title="No Warehouse Selected"
              description="Please select a warehouse facility above to view bin allocations."
            />
          ) : locationQuery.isError ? (
            <PageErrorAlert
              title="Error loading bin allocations"
              message={
                locationQuery.error instanceof Error
                  ? locationQuery.error.message
                  : "Failed to fetch location stock."
              }
              onRetry={locationQuery.refetch}
            />
          ) : (
            <>
              <InventoryLocationTable
                locationStocks={locationQuery.data?.data || []}
                isLoading={locationQuery.isLoading}
                canMutate={canMutate}
                onAllocate={() => setIsAllocateOpen(true)}
                onDeallocate={(loc) => setDeallocatingStock(loc)}
                onTransfer={(loc) => setTransferringStock(loc)}
                onViewBinDetails={(binId) => setDetailsBinId(binId)}
              />

              {locationQuery.data?.meta && (
                <DataTablePagination
                  page={locationQuery.data.meta.page}
                  limit={locationQuery.data.meta.limit}
                  total={locationQuery.data.meta.total}
                  totalPages={locationQuery.data.meta.totalPages}
                  isLoading={locationQuery.isLoading}
                  onPageChange={(newPage) => setPage(newPage)}
                  entityName="bin allocation records"
                />
              )}
            </>
          )}
        </>
      )}

      {/* --- TAB CONTENT 3: MOVEMENT HISTORY --- */}
      {activeTab === "movements" && (
        <>
          {warehouseMovementsQuery.isError || locationMovementsQuery.isError ? (
            <PageErrorAlert
              title="Error loading movement history"
              message="Failed to fetch stock movement audit trail."
              onRetry={() => {
                warehouseMovementsQuery.refetch();
                locationMovementsQuery.refetch();
              }}
            />
          ) : (
            <>
              <StockMovementTable
                warehouseMovements={warehouseMovementsQuery.data?.data || []}
                locationMovements={locationMovementsQuery.data?.data || []}
                isLoading={warehouseMovementsQuery.isLoading || locationMovementsQuery.isLoading}
              />

              {warehouseMovementsQuery.data?.meta && (
                <DataTablePagination
                  page={warehouseMovementsQuery.data.meta.page}
                  limit={warehouseMovementsQuery.data.meta.limit}
                  total={warehouseMovementsQuery.data.meta.total}
                  totalPages={warehouseMovementsQuery.data.meta.totalPages}
                  isLoading={warehouseMovementsQuery.isLoading}
                  onPageChange={(newPage) => setPage(newPage)}
                  entityName="movement audit records"
                />
              )}
            </>
          )}
        </>
      )}

      {/* Dialog: Adjust Stock */}
      <StockAdjustDialog
        isOpen={isAdjustOpen}
        defaultWarehouseId={selectedWarehouseId || undefined}
        onClose={() => setIsAdjustOpen(false)}
        onSubmit={handleAdjustSubmit}
        isPending={adjustMutation.isPending}
      />

      {/* Dialog: Allocate Stock */}
      <StockAllocateDialog
        isOpen={isAllocateOpen}
        defaultWarehouseId={selectedWarehouseId || undefined}
        onClose={() => setIsAllocateOpen(false)}
        onSubmit={handleAllocateSubmit}
        isPending={allocateMutation.isPending}
      />

      {/* Dialog: Deallocate Stock */}
      <StockDeallocateDialog
        locationStock={deallocatingStock}
        isOpen={Boolean(deallocatingStock)}
        onClose={() => setDeallocatingStock(null)}
        onSubmit={handleDeallocateSubmit}
        isPending={deallocateMutation.isPending}
      />

      {/* Dialog: Transfer Stock */}
      <StockTransferDialog
        locationStock={transferringStock}
        isOpen={Boolean(transferringStock)}
        onClose={() => setTransferringStock(null)}
        onSubmit={handleTransferSubmit}
        isPending={transferMutation.isPending}
      />

      {/* Dialog: Inventory Summary & Physical Locations */}
      <InventorySummaryDialog
        warehouseId={summaryTarget?.warehouseId || null}
        productId={summaryTarget?.productId || null}
        isOpen={Boolean(summaryTarget)}
        onClose={() => setSummaryTarget(null)}
      />

      {/* Dialog: Bin Stock Details & Capacity */}
      <BinStockDetailsDialog
        binId={detailsBinId}
        isOpen={Boolean(detailsBinId)}
        onClose={() => setDetailsBinId(null)}
      />
    </div>
  );
}
