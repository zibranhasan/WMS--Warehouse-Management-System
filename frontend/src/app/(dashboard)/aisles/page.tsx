"use client";

import { useState, useMemo, useEffect } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useZones } from "@/features/zone/zone.hooks";
import {
  useAisles,
  useCreateAisle,
  useUpdateAisle,
  useUpdateAisleStatus,
  useDeleteAisle,
} from "@/features/aisle/aisle.hooks";
import {
  LocationStatus,
  Aisle,
  CreateAislePayload,
  UpdateAislePayload,
} from "@/features/aisle/aisle.types";
import { LOCATION_STATUS_OPTIONS } from "@/features/aisle/aisle.schema";
import { AisleTable } from "@/features/aisle/components/aisle-table";
import { AisleForm } from "@/features/aisle/components/aisle-form";
import { AisleStatusDialog } from "@/features/aisle/components/aisle-status-dialog";
import { AisleDeleteDialog } from "@/features/aisle/components/aisle-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  StatusTabFilter,
  StatusTabOption,
} from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Building2, Layers, Plus, X } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

const GLOBAL_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default function GlobalAislesPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const isGlobalUser = GLOBAL_ROLES.includes(user?.role ?? "");
  const canMutate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  // Fetch warehouses for global filter dropdown
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses({
    limit: 100,
  });
  const allWarehouses = warehousesData?.data || [];

  // Scoped users only see their assigned warehouse in the list filter
  const warehousesList = useMemo(() => {
    if (isGlobalUser) return allWarehouses;
    if (!user?.warehouseId) return [];
    const filtered = allWarehouses.filter((wh) => wh.id === user.warehouseId);
    if (filtered.length === 0 && user.warehouse) {
      return [user.warehouse as any];
    }
    return filtered;
  }, [isGlobalUser, allWarehouses, user?.warehouseId, user?.warehouse]);

  // Filter & Query States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");

  // Sync warehouse filter for scoped users
  useEffect(() => {
    if (!isGlobalUser && user?.warehouseId) {
      setWarehouseFilter(user.warehouseId);
    }
  }, [isGlobalUser, user?.warehouseId]);

  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  // Determine effective warehouse filter for scoping zones and aisles
  const effectiveWarehouseFilter = !isGlobalUser
    ? user?.warehouseId
    : warehouseFilter !== "ALL"
      ? warehouseFilter
      : undefined;

  // Fetch zones for zone filter dropdown (scoped to warehouse)
  const { data: zonesData, isLoading: isLoadingZones } = useZones({
    limit: 200,
    ...(effectiveWarehouseFilter ? { warehouseId: effectiveWarehouseFilter } : {}),
  });
  const zonesList = zonesData?.data || [];

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleWarehouseFilterChange = (warehouseId: string) => {
    setWarehouseFilter(warehouseId);
    setZoneFilter("ALL");
    setPage(1);
  };

  const handleZoneFilterChange = (zoneId: string) => {
    setZoneFilter(zoneId);
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
    ...(effectiveWarehouseFilter ? { warehouseId: effectiveWarehouseFilter } : {}),
    ...(zoneFilter !== "ALL" ? { zoneId: zoneFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useAisles(queryParams);

  // Mutations
  const createMutation = useCreateAisle();
  const updateMutation = useUpdateAisle();
  const updateStatusMutation = useUpdateAisleStatus();
  const deleteMutation = useDeleteAisle();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAisle, setEditingAisle] = useState<Aisle | null>(null);
  const [statusAisle, setStatusAisle] = useState<Aisle | null>(null);
  const [deletingAisle, setDeletingAisle] = useState<Aisle | null>(null);

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
    values: CreateAislePayload | UpdateAislePayload
  ) => {
    try {
      await createMutation.mutateAsync(values as CreateAislePayload);
      setIsCreateOpen(false);
      showFeedback("success", "Aisle created successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to create aisle."
      );
    }
  };

  const handleEditSubmit = async (
    values: CreateAislePayload | UpdateAislePayload
  ) => {
    if (!editingAisle) return;
    try {
      await updateMutation.mutateAsync({
        id: editingAisle.id,
        payload: values as UpdateAislePayload,
      });
      setEditingAisle(null);
      showFeedback("success", "Aisle updated successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update aisle."
      );
    }
  };

  const handleStatusConfirm = async (aisleId: string, status: LocationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: aisleId, status });
      setStatusAisle(null);
      showFeedback("success", `Aisle status updated to ${status}.`);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update status."
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAisle) return;
    try {
      await deleteMutation.mutateAsync(deletingAisle.id);
      setDeletingAisle(null);
      showFeedback("success", `Aisle "${deletingAisle.name}" deleted successfully.`);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to delete aisle."
      );
    }
  };

  const aisles = data?.data || [];
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
            Aisle Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure storage aisles, capacities, and layout across warehouse facilities.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Aisle
          </Button>
        )}
      </div>

      {/* Filter Controls (Search, Warehouse, Zone & Status) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 flex-wrap">
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search aisles by code, name, or description..."
          />

          {/* Warehouse Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            {isGlobalUser ? (
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
            ) : (
              <select
                value={user?.warehouseId ?? ""}
                disabled={true}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-not-allowed"
              >
                {warehousesList.length === 0 ? (
                  <option value="">No warehouse assigned</option>
                ) : (
                  warehousesList.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))
                )}
              </select>
            )}
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
          title="Error loading aisles"
          message={
            error instanceof Error ? error.message : "Failed to fetch aisle list."
          }
          onRetry={refetch}
        />
      )}

      {/* Aisle Table */}
      {!isError && (
        <AisleTable
          aisles={aisles}
          isLoading={isLoading}
          canMutate={canMutate}
          onEdit={(a) => setEditingAisle(a)}
          onStatusChange={(a) => setStatusAisle(a)}
          onDelete={(a) => setDeletingAisle(a)}
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
          entityName="aisles"
        />
      )}

      {/* Modal: Create Aisle */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Storage Aisle"
      >
        <AisleForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Aisle */}
      <Modal
        isOpen={Boolean(editingAisle)}
        onClose={() => setEditingAisle(null)}
        title={
          editingAisle
            ? `Edit Aisle "${editingAisle.name}" (${editingAisle.code})`
            : "Edit Aisle"
        }
      >
        <AisleForm
          initialData={editingAisle}
          defaultZoneId={editingAisle?.zoneId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingAisle(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Modal: Change Status */}
      <AisleStatusDialog
        aisle={statusAisle}
        isOpen={Boolean(statusAisle)}
        onClose={() => setStatusAisle(null)}
        onConfirm={handleStatusConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {/* Dialog: Delete Aisle */}
      <AisleDeleteDialog
        aisle={deletingAisle}
        isOpen={Boolean(deletingAisle)}
        onClose={() => setDeletingAisle(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
