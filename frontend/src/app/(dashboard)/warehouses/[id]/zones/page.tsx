"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouse } from "@/features/warehouse/warehouse.hooks";
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
import { ArrowLeft, Plus, X, Building2 } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

interface WarehouseZonesPageProps {
  params: Promise<{ id: string }>;
}

export default function WarehouseZonesPage({ params }: WarehouseZonesPageProps) {
  const resolvedParams = use(params);
  const warehouseId = resolvedParams.id;

  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  // Parent Warehouse info
  const { data: warehouseData } = useWarehouse(warehouseId);
  const warehouse = warehouseData?.data;

  // Filter & Query States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  // Query Backend API
  const queryParams = {
    warehouseId,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
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
      {/* Back to Warehouse Detail */}
      <div>
        <Link href={`/warehouses/${warehouseId}`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Warehouse Details
          </Button>
        </Link>
      </div>

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
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Zone Management
            </h2>
            {warehouse && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Building2 className="h-3.5 w-3.5" />
                {warehouse.name} ({warehouse.code})
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure primary storage zones, capacity allocations, and location status for this facility.
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

      {/* Filter Controls (Search & Status) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search zones by code, name, or description..."
        />

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
          defaultWarehouseId={warehouseId}
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
          defaultWarehouseId={warehouseId}
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
