"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouse } from "@/features/warehouse/warehouse.hooks";
import { useZone } from "@/features/zone/zone.hooks";
import { useAisle } from "@/features/aisle/aisle.hooks";
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
import { ArrowLeft, Plus, X, Building2, Layers, Columns } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

interface AisleShelvesPageProps {
  params: Promise<{ id: string; zoneId: string; aisleId: string }>;
}

export default function AisleShelvesPage({ params }: AisleShelvesPageProps) {
  const resolvedParams = use(params);
  const warehouseId = resolvedParams.id;
  const zoneId = resolvedParams.zoneId;
  const aisleId = resolvedParams.aisleId;

  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  // Parent Warehouse, Zone, and Aisle details
  const { data: warehouseData } = useWarehouse(warehouseId);
  const warehouse = warehouseData?.data;

  const { data: zoneData } = useZone(zoneId);
  const zone = zoneData?.data;

  const { data: aisleData } = useAisle(aisleId);
  const aisle = aisleData?.data;

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

  // Query Backend API (Scoped to Aisle)
  const queryParams = {
    aisleId,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
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
    values: CreateShelfPayload | UpdateShelfPayload
  ) => {
    try {
      await createMutation.mutateAsync(values as CreateShelfPayload);
      setIsCreateOpen(false);
      showFeedback("success", "Shelf created successfully.");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to create shelf.");
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
      showFeedback("error", err instanceof Error ? err.message : "Failed to update shelf.");
    }
  };

  const handleStatusConfirm = async (shelfId: string, status: LocationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: shelfId, status });
      setStatusShelf(null);
      showFeedback("success", `Shelf status updated to ${status}.`);
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingShelf) return;
    try {
      await deleteMutation.mutateAsync(deletingShelf.id);
      setDeletingShelf(null);
      showFeedback("success", `Shelf "${deletingShelf.name}" deleted successfully.`);
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to delete shelf.");
    }
  };

  const shelves = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link href={`/warehouses/${warehouseId}/zones/${zoneId}/aisles`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Zone Aisles
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
              Shelf Management
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
                Zone: {zone.name}
              </span>
            )}
            {aisle && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Columns className="h-3.5 w-3.5" />
                Aisle: {aisle.name} ({aisle.code})
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure storage shelves, capacities, and levels under this aisle.
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search shelves by code, name, or description..."
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
          title="Error loading shelves"
          message={error instanceof Error ? error.message : "Failed to fetch shelf list."}
          onRetry={refetch}
        />
      )}

      {/* Table */}
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

      {/* Pagination */}
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

      {/* Modal: Create */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Storage Shelf"
      >
        <ShelfForm
          defaultAisleId={aisleId}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit */}
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
          defaultAisleId={aisleId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingShelf(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Status Dialog */}
      <ShelfStatusDialog
        shelf={statusShelf}
        isOpen={Boolean(statusShelf)}
        onClose={() => setStatusShelf(null)}
        onConfirm={handleStatusConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {/* Delete Dialog */}
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
