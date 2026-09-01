"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouse } from "@/features/warehouse/warehouse.hooks";
import { useZone } from "@/features/zone/zone.hooks";
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
import { ArrowLeft, Plus, X, Building2, Layers } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

interface ZoneAislesPageProps {
  params: Promise<{ id: string; zoneId: string }>;
}

export default function ZoneAislesPage({ params }: ZoneAislesPageProps) {
  const resolvedParams = use(params);
  const warehouseId = resolvedParams.id;
  const zoneId = resolvedParams.zoneId;

  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  // Parent Warehouse and Zone details
  const { data: warehouseData } = useWarehouse(warehouseId);
  const warehouse = warehouseData?.data;

  const { data: zoneData } = useZone(zoneId);
  const zone = zoneData?.data;

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

  // Query Backend API (Scoped to Zone)
  const queryParams = {
    zoneId,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
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

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
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
      showFeedback("error", err instanceof Error ? err.message : "Failed to create aisle.");
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
      showFeedback("error", err instanceof Error ? err.message : "Failed to update aisle.");
    }
  };

  const handleStatusConfirm = async (aisleId: string, status: LocationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: aisleId, status });
      setStatusAisle(null);
      showFeedback("success", `Aisle status updated to ${status}.`);
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAisle) return;
    try {
      await deleteMutation.mutateAsync(deletingAisle.id);
      setDeletingAisle(null);
      showFeedback("success", `Aisle "${deletingAisle.name}" deleted successfully.`);
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to delete aisle.");
    }
  };

  const aisles = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Aisle Management
            </h2>
            {warehouse && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Building2 className="h-3.5 w-3.5" />
                {warehouse.name}
              </span>
            )}
            {zone && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Layers className="h-3.5 w-3.5" />
                Zone: {zone.name} ({zone.code})
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure storage aisles, capacities, and layout under this zone.
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search aisles by code, name, or description..."
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

      {/* Error */}
      {isError && (
        <PageErrorAlert
          title="Error loading aisles"
          message={error instanceof Error ? error.message : "Failed to fetch aisle list."}
          onRetry={refetch}
        />
      )}

      {/* Table */}
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

      {/* Pagination */}
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

      {/* Modal: Create */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Storage Aisle"
      >
        <AisleForm
          defaultZoneId={zoneId}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit */}
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
          defaultZoneId={zoneId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingAisle(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Status Dialog */}
      <AisleStatusDialog
        aisle={statusAisle}
        isOpen={Boolean(statusAisle)}
        onClose={() => setStatusAisle(null)}
        onConfirm={handleStatusConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {/* Delete Dialog */}
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
