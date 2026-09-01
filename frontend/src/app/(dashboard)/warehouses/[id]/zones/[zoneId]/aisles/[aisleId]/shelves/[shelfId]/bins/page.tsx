"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useWarehouse } from "@/features/warehouse/warehouse.hooks";
import { useZone } from "@/features/zone/zone.hooks";
import { useAisle } from "@/features/aisle/aisle.hooks";
import { useShelf } from "@/features/shelf/shelf.hooks";
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
import { ArrowLeft, Plus, X, Building2, Layers, Columns, Grid } from "lucide-react";

type StatusFilterType = LocationStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  ...LOCATION_STATUS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value as StatusFilterType,
  })),
];

interface ShelfBinsPageProps {
  params: Promise<{ id: string; zoneId: string; aisleId: string; shelfId: string }>;
}

export default function ShelfBinsPage({ params }: ShelfBinsPageProps) {
  const resolvedParams = use(params);
  const warehouseId = resolvedParams.id;
  const zoneId = resolvedParams.zoneId;
  const aisleId = resolvedParams.aisleId;
  const shelfId = resolvedParams.shelfId;

  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  // Parent location details
  const { data: warehouseData } = useWarehouse(warehouseId);
  const warehouse = warehouseData?.data;

  const { data: zoneData } = useZone(zoneId);
  const zone = zoneData?.data;

  const { data: aisleData } = useAisle(aisleId);
  const aisle = aisleData?.data;

  const { data: shelfData } = useShelf(shelfId);
  const shelf = shelfData?.data;

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

  // Query Backend API (Scoped to Shelf)
  const queryParams = {
    shelfId,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
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
    values: CreateBinPayload | UpdateBinPayload
  ) => {
    try {
      await createMutation.mutateAsync(values as CreateBinPayload);
      setIsCreateOpen(false);
      showFeedback("success", "Bin created successfully.");
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to create bin.");
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
      showFeedback("error", err instanceof Error ? err.message : "Failed to update bin.");
    }
  };

  const handleStatusConfirm = async (binId: string, status: LocationStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: binId, status });
      setStatusBin(null);
      showFeedback("success", `Bin status updated to ${status}.`);
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBin) return;
    try {
      await deleteMutation.mutateAsync(deletingBin.id);
      setDeletingBin(null);
      showFeedback("success", `Bin "${deletingBin.name}" deleted successfully.`);
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "Failed to delete bin.");
    }
  };

  const bins = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link href={`/warehouses/${warehouseId}/zones/${zoneId}/aisles/${aisleId}/shelves`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Aisle Shelves
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
              Bin Management
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
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Columns className="h-3.5 w-3.5" />
                Aisle: {aisle.name}
              </span>
            )}
            {shelf && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Grid className="h-3.5 w-3.5" />
                Shelf: {shelf.name} ({shelf.code})
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure storage bins, capacities, and compartment locations under this shelf.
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search bins by code, name, or description..."
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
          title="Error loading bins"
          message={error instanceof Error ? error.message : "Failed to fetch bin list."}
          onRetry={refetch}
        />
      )}

      {/* Table */}
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

      {/* Pagination */}
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

      {/* Modal: Create */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Storage Bin"
      >
        <BinForm
          defaultShelfId={shelfId}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit */}
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
          defaultShelfId={shelfId}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingBin(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Status Dialog */}
      <BinStatusDialog
        bin={statusBin}
        isOpen={Boolean(statusBin)}
        onClose={() => setStatusBin(null)}
        onConfirm={handleStatusConfirm}
        isPending={updateStatusMutation.isPending}
      />

      {/* Delete Dialog */}
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
