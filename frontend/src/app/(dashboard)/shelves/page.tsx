"use client";

import { useState, useMemo, useEffect } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useZones } from "@/features/zone/zone.hooks";
import { useAisles } from "@/features/aisle/aisle.hooks";
import {
  useShelves,
  useCreateShelf,
  useUpdateShelf,
  useUpdateShelfStatus,
  useDeleteShelf,
} from "@/features/shelf/shelf.hooks";
import {
  LocationStatus,
  Shelf,
  CreateShelfPayload,
  UpdateShelfPayload,
} from "@/features/shelf/shelf.types";
import { LOCATION_STATUS_OPTIONS } from "@/features/shelf/shelf.schema";
import { ShelfTable } from "@/features/shelf/components/shelf-table";
import { ShelfForm } from "@/features/shelf/components/shelf-form";
import { ShelfStatusDialog } from "@/features/shelf/components/shelf-status-dialog";
import { ShelfDeleteDialog } from "@/features/shelf/components/shelf-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  StatusTabFilter,
  StatusTabOption,
} from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Layers, Columns, Plus, X } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

const GLOBAL_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default function GlobalShelvesPage() {
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

  const warehouseSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "All Warehouses" },
      ...warehousesList.map((wh) => ({
        value: wh.id,
        label: `${wh.name} (${wh.code})`,
      })),
    ],
    [warehousesList]
  );

  const scopedWarehouseOptions = useMemo(() => {
    if (warehousesList.length === 0) {
      return [{ value: "", label: "No warehouse assigned" }];
    }
    return warehousesList.map((wh) => ({
      value: wh.id,
      label: `${wh.name} (${wh.code})`,
    }));
  }, [warehousesList]);

  // Filter & Query States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [aisleFilter, setAisleFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");

  // Sync warehouse filter for scoped users
  useEffect(() => {
    if (!isGlobalUser && user?.warehouseId) {
      setWarehouseFilter(user.warehouseId);
    }
  }, [isGlobalUser, user?.warehouseId]);

  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  // Determine effective warehouse filter for scoping zones, aisles, and shelves
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

  const zoneSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "All Zones" },
      ...zonesList.map((z) => ({
        value: z.id,
        label: `${z.name} (${z.code})`,
      })),
    ],
    [zonesList]
  );

  // Fetch aisles for aisle filter dropdown (scoped to warehouse and zone)
  const { data: aislesData, isLoading: isLoadingAisles } = useAisles({
    limit: 200,
    ...(effectiveWarehouseFilter ? { warehouseId: effectiveWarehouseFilter } : {}),
    ...(zoneFilter !== "ALL" ? { zoneId: zoneFilter } : {}),
  });
  const aislesList = aislesData?.data || [];

  const aisleSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "All Aisles" },
      ...aislesList.map((a) => ({
        value: a.id,
        label: `${a.name} (${a.code})`,
      })),
    ],
    [aislesList]
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleWarehouseFilterChange = (warehouseId: string) => {
    setWarehouseFilter(warehouseId);
    setZoneFilter("ALL");
    setAisleFilter("ALL");
    setPage(1);
  };

  const handleZoneFilterChange = (zoneId: string) => {
    setZoneFilter(zoneId);
    setAisleFilter("ALL");
    setPage(1);
  };

  const handleAisleFilterChange = (aisleId: string) => {
    setAisleFilter(aisleId);
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
    ...(aisleFilter !== "ALL" ? { aisleId: aisleFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useShelves(queryParams);

  // Mutations
  const createMutation = useCreateShelf();
  const updateMutation = useUpdateShelf();
  const updateStatusMutation = useUpdateShelfStatus();
  const deleteMutation = useDeleteShelf();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [statusShelf, setStatusShelf] = useState<Shelf | null>(null);
  const [deletingShelf, setDeletingShelf] = useState<Shelf | null>(null);

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
    values: CreateShelfPayload | UpdateShelfPayload
  ) => {
    try {
      await createMutation.mutateAsync(values as CreateShelfPayload);
      setIsCreateOpen(false);
      showFeedback("success", "Shelf created successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to create shelf."
      );
    }
  };

  const handleEditSubmit = async (
    values: CreateShelfPayload | UpdateShelfPayload
  ) => {
    if (!editingShelf) return;
    try {
      await updateMutation.mutateAsync({
        id: editingShelf.id,
        payload: values as UpdateShelfPayload,
      });
      setEditingShelf(null);
      showFeedback("success", "Shelf updated successfully.");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update shelf."
      );
    }
  };

  const handleStatusConfirm = async (shelfId: string, status: LocationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: shelfId, status });
      setStatusShelf(null);
      showFeedback("success", `Shelf status updated to ${status}.`);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to update status."
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingShelf) return;
    try {
      await deleteMutation.mutateAsync(deletingShelf.id);
      setDeletingShelf(null);
      showFeedback("success", `Shelf "${deletingShelf.name}" deleted successfully.`);
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Failed to delete shelf."
      );
    }
  };

  const shelves = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-lg border p-4 text-xs font-medium ${feedback.type === "success"
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
            Shelf Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure storage shelves, capacities, and levels across aisle facilities.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Shelf
          </Button>
        )}
      </div>

      {/* Filter Controls (Search, Warehouse, Zone, Aisle & Status) */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search shelves by code, name, or description..."
          />

          {/* Warehouse Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            {isGlobalUser ? (
              <Select
                value={warehouseFilter}
                onValueChange={(val) => {
                  if (val !== null) handleWarehouseFilterChange(val);
                }}
                disabled={isLoadingWarehouses}
                items={warehouseSelectOptions}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Warehouses</SelectItem>
                  {warehousesList.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={user?.warehouseId ?? ""}
                disabled={true}
                items={scopedWarehouseOptions}
              >
                <SelectTrigger className="w-48 bg-slate-50 dark:bg-slate-900 cursor-not-allowed">
                  <SelectValue placeholder="No warehouse assigned" />
                </SelectTrigger>
                <SelectContent>
                  {warehousesList.length === 0 ? (
                    <SelectItem value="">No warehouse assigned</SelectItem>
                  ) : (
                    warehousesList.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Zone Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            <Select
              value={zoneFilter}
              onValueChange={(val) => {
                if (val !== null) handleZoneFilterChange(val);
              }}
              disabled={isLoadingZones}
              items={zoneSelectOptions}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Zones</SelectItem>
                {zonesList.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aisle Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Columns className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
            <Select
              value={aisleFilter}
              onValueChange={(val) => {
                if (val !== null) handleAisleFilterChange(val);
              }}
              disabled={isLoadingAisles}
              items={aisleSelectOptions}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Aisles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Aisles</SelectItem>
                {aislesList.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          title="Error loading shelves"
          message={
            error instanceof Error ? error.message : "Failed to fetch shelf list."
          }
          onRetry={refetch}
        />
      )}

      {/* Shelf Table */}
      {!isError && (
        <ShelfTable
          shelves={shelves}
          isLoading={isLoading}
          canMutate={canMutate}
          onEdit={(s) => setEditingShelf(s)}
          onStatusChange={(s) => setStatusShelf(s)}
          onDelete={(s) => setDeletingShelf(s)}
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
          entityName="shelves"
        />
      )}

      {/* Modal: Create Shelf */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Storage Shelf"
      >
        <ShelfForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Shelf */}
      <Modal
        isOpen={Boolean(editingShelf)}
        onClose={() => setEditingShelf(null)}
        title={
          editingShelf
            ? `Edit Shelf "${editingShelf.name}" (${editingShelf.code})`
            : "Edit Shelf"
        }
      >
        <ShelfForm
          initialData={editingShelf}
          defaultAisleId={editingShelf?.aisleId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingShelf(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Modal: Change Status */}
      <ShelfStatusDialog
        shelf={statusShelf}
        isOpen={Boolean(statusShelf)}
        onClose={() => setStatusShelf(null)}
        onConfirm={handleStatusConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {/* Dialog: Delete Shelf */}
      <ShelfDeleteDialog
        shelf={deletingShelf}
        isOpen={Boolean(deletingShelf)}
        onClose={() => setDeletingShelf(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
