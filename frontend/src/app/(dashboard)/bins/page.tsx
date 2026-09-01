"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useZones } from "@/features/zone/zone.hooks";
import { useAisles } from "@/features/aisle/aisle.hooks";
import { useShelves } from "@/features/shelf/shelf.hooks";
import {
  useBins,
  useCreateBin,
  useUpdateBin,
  useUpdateBinStatus,
  useDeleteBin,
} from "@/features/bin/bin.hooks";
import {
  LocationStatus,
  Bin,
  CreateBinPayload,
  UpdateBinPayload,
} from "@/features/bin/bin.types";
import { LOCATION_STATUS_OPTIONS } from "@/features/bin/bin.schema";
import { BinTable } from "@/features/bin/components/bin-table";
import { BinForm } from "@/features/bin/components/bin-form";
import { BinStatusDialog } from "@/features/bin/components/bin-status-dialog";
import { BinDeleteDialog } from "@/features/bin/components/bin-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  StatusTabFilter,
  StatusTabOption,
} from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Building2, Layers, Columns, Grid, Plus, X } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

export default function GlobalBinsPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  // Fetch warehouses for global filter dropdown
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses({
    limit: 100,
  });
  const warehousesList = warehousesData?.data || [];

  // Filter & Query States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [aisleFilter, setAisleFilter] = useState<string>("ALL");
  const [shelfFilter, setShelfFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  // Dependent dropdowns
  const { data: zonesData, isLoading: isLoadingZones } = useZones({
    limit: 200,
    ...(warehouseFilter !== "ALL" ? { warehouseId: warehouseFilter } : {}),
  });
  const zonesList = zonesData?.data || [];

  const { data: aislesData, isLoading: isLoadingAisles } = useAisles({
    limit: 200,
    ...(zoneFilter !== "ALL" ? { zoneId: zoneFilter } : {}),
  });
  const aislesList = aislesData?.data || [];

  const { data: shelvesData, isLoading: isLoadingShelves } = useShelves({
    limit: 200,
    ...(aisleFilter !== "ALL" ? { aisleId: aisleFilter } : {}),
  });
  const shelvesList = shelvesData?.data || [];

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleWarehouseFilterChange = (warehouseId: string) => {
    setWarehouseFilter(warehouseId);
    setZoneFilter("ALL");
    setAisleFilter("ALL");
    setShelfFilter("ALL");
    setPage(1);
  };

  const handleZoneFilterChange = (zoneId: string) => {
    setZoneFilter(zoneId);
    setAisleFilter("ALL");
    setShelfFilter("ALL");
    setPage(1);
  };

  const handleAisleFilterChange = (aisleId: string) => {
    setAisleFilter(aisleId);
    setShelfFilter("ALL");
    setPage(1);
  };

  const handleShelfFilterChange = (shelfId: string) => {
    setShelfFilter(shelfId);
    setPage(1);
  };

  // Query Backend API
  const queryParams = {
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(warehouseFilter !== "ALL" ? { warehouseId: warehouseFilter } : {}),
    ...(zoneFilter !== "ALL" ? { zoneId: zoneFilter } : {}),
    ...(aisleFilter !== "ALL" ? { aisleId: aisleFilter } : {}),
    ...(shelfFilter !== "ALL" ? { shelfId: shelfFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useBins(queryParams);

  // Mutations
  const createMutation = useCreateBin();
  const updateMutation = useUpdateBin();
  const updateStatusMutation = useUpdateBinStatus();
  const deleteMutation = useDeleteBin();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [statusBin, setStatusBin] = useState<Bin | null>(null);
  const [deletingBin, setDeletingBin] = useState<Bin | null>(null);

  // Feedback Notification State
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Submit Handlers
  const handleCreateSubmit = async (
    values: CreateBinPayload | UpdateBinPayload
  ) => {
    try {
      await createMutation.mutateAsync(values as CreateBinPayload);
      setIsCreateOpen(false);
      showFeedback("success", "Bin created successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to create bin."
      );
    }
  };

  const handleEditSubmit = async (
    values: CreateBinPayload | UpdateBinPayload
  ) => {
    if (!editingBin) return;
    try {
      await updateMutation.mutateAsync({
        id: editingBin.id,
        payload: values as UpdateBinPayload,
      });
      setEditingBin(null);
      showFeedback("success", "Bin updated successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update bin."
      );
    }
  };

  const handleStatusConfirm = async (binId: string, status: LocationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: binId, status });
      setStatusBin(null);
      showFeedback("success", `Bin status updated to ${status}.`);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update status."
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBin) return;
    try {
      await deleteMutation.mutateAsync(deletingBin.id);
      setDeletingBin(null);
      showFeedback("success", `Bin "${deletingBin.name}" deleted successfully.`);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to delete bin."
      );
    }
  };

  const bins = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Feedback Toast Banner */}
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

      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bin Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure storage bins, capacities, and compartment locations across shelf units.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Bin
          </Button>
        )}
      </div>

      {/* Filter Controls (Search, Warehouse, Zone, Aisle, Shelf & Status) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search bins by code, name, or description..."
          />

          {/* Warehouse Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            <select
              value={warehouseFilter}
              onChange={(e) => handleWarehouseFilterChange(e.target.value)}
              disabled={isLoadingWarehouses}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All Warehouses</option>
              {warehousesList.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Zone Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            <select
              value={zoneFilter}
              onChange={(e) => handleZoneFilterChange(e.target.value)}
              disabled={isLoadingZones}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All Zones</option>
              {zonesList.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>

          {/* Aisle Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Columns className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            <select
              value={aisleFilter}
              onChange={(e) => handleAisleFilterChange(e.target.value)}
              disabled={isLoadingAisles}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All Aisles</option>
              {aislesList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>

          {/* Shelf Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Grid className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            <select
              value={shelfFilter}
              onChange={(e) => handleShelfFilterChange(e.target.value)}
              disabled={isLoadingShelves}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All Shelves</option>
              {shelvesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <StatusTabFilter
          label="Status:"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />
      </div>

      {/* Error State */}
      {isError && (
        <PageErrorAlert
          title="Error loading bins"
          message={
            error instanceof Error ? error.message : "Failed to fetch bin list."
          }
          onRetry={refetch}
        />
      )}

      {/* Bin Table */}
      {!isError && (
        <BinTable
          bins={bins}
          isLoading={isLoading}
          canMutate={canMutate}
          onEdit={(b) => setEditingBin(b)}
          onStatusChange={(b) => setStatusBin(b)}
          onDelete={(b) => setDeletingBin(b)}
        />
      )}

      {/* Pagination Bar */}
      {meta && (
        <DataTablePagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          isLoading={isLoading}
          onPageChange={(newPage) => setPage(newPage)}
          entityName="bins"
        />
      )}

      {/* Modal: Create Bin */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Storage Bin"
      >
        <BinForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Bin */}
      <Modal
        isOpen={Boolean(editingBin)}
        onClose={() => setEditingBin(null)}
        title={
          editingBin
            ? `Edit Bin "${editingBin.name}" (${editingBin.code})`
            : "Edit Bin"
        }
      >
        <BinForm
          initialData={editingBin}
          defaultShelfId={editingBin?.shelfId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingBin(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Modal: Change Status */}
      <BinStatusDialog
        bin={statusBin}
        isOpen={Boolean(statusBin)}
        onClose={() => setStatusBin(null)}
        onConfirm={handleStatusConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {/* Dialog: Delete Bin */}
      <BinDeleteDialog
        bin={deletingBin}
        isOpen={Boolean(deletingBin)}
        onClose={() => setDeletingBin(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
