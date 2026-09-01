"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import {
  useZones,
  useCreateZone,
  useUpdateZone,
  useUpdateZoneStatus,
  useDeleteZone,
} from "@/features/zone/zone.hooks";
import {
  LocationStatus,
  Zone,
  CreateZonePayload,
  UpdateZonePayload,
} from "@/features/zone/zone.types";
import { LOCATION_STATUS_OPTIONS } from "@/features/zone/zone.schema";
import { ZoneTable } from "@/features/zone/components/zone-table";
import { ZoneForm } from "@/features/zone/components/zone-form";
import { ZoneStatusDialog } from "@/features/zone/components/zone-status-dialog";
import { ZoneDeleteDialog } from "@/features/zone/components/zone-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  StatusTabFilter,
  StatusTabOption,
} from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Building2, Plus, X } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

export default function GlobalZonesPage() {
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
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleWarehouseFilterChange = (warehouseId: string) => {
    setWarehouseFilter(warehouseId);
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
  };

  const { data, isLoading, isError, error, refetch } = useZones(queryParams);

  // Mutations
  const createMutation = useCreateZone();
  const updateMutation = useUpdateZone();
  const updateStatusMutation = useUpdateZoneStatus();
  const deleteMutation = useDeleteZone();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [statusZone, setStatusZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);

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
    values: CreateZonePayload | UpdateZonePayload
  ) => {
    try {
      await createMutation.mutateAsync(values as CreateZonePayload);
      setIsCreateOpen(false);
      showFeedback("success", "Zone created successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to create zone."
      );
    }
  };

  const handleEditSubmit = async (
    values: CreateZonePayload | UpdateZonePayload
  ) => {
    if (!editingZone) return;
    try {
      await updateMutation.mutateAsync({
        id: editingZone.id,
        payload: values as UpdateZonePayload,
      });
      setEditingZone(null);
      showFeedback("success", "Zone updated successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update zone."
      );
    }
  };

  const handleStatusConfirm = async (zoneId: string, status: LocationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: zoneId, status });
      setStatusZone(null);
      showFeedback("success", `Zone status updated to ${status}.`);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update status."
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingZone) return;
    await deleteMutation.mutateAsync(deletingZone.id);
    setDeletingZone(null);
    showFeedback("success", `Zone "${deletingZone.name}" deleted successfully.`);
  };

  const zones = data?.data || [];
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
            Zone Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure primary storage zones, capacity allocations, and location status across facilities.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Zone
          </Button>
        )}
      </div>

      {/* Filter Controls (Search, Warehouse & Status) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search zones by code, name, or description..."
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
          title="Error loading zones"
          message={
            error instanceof Error ? error.message : "Failed to fetch zone list."
          }
          onRetry={refetch}
        />
      )}

      {/* Zone Table */}
      {!isError && (
        <ZoneTable
          zones={zones}
          isLoading={isLoading}
          canMutate={canMutate}
          onEdit={(z) => setEditingZone(z)}
          onStatusChange={(z) => setStatusZone(z)}
          onDelete={(z) => setDeletingZone(z)}
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
          entityName="zones"
        />
      )}

      {/* Modal: Create Zone */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Storage Zone"
      >
        <ZoneForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Zone */}
      <Modal
        isOpen={Boolean(editingZone)}
        onClose={() => setEditingZone(null)}
        title={
          editingZone
            ? `Edit Zone "${editingZone.name}" (${editingZone.code})`
            : "Edit Zone"
        }
      >
        <ZoneForm
          initialData={editingZone}
          defaultWarehouseId={editingZone?.warehouseId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingZone(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Modal: Change Status */}
      <ZoneStatusDialog
        zone={statusZone}
        isOpen={Boolean(statusZone)}
        onClose={() => setStatusZone(null)}
        onConfirm={handleStatusConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {/* Dialog: Delete Zone */}
      <ZoneDeleteDialog
        zone={deletingZone}
        isOpen={Boolean(deletingZone)}
        onClose={() => setDeletingZone(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
