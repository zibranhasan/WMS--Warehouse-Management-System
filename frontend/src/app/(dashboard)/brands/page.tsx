"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useUpdateBrandStatus,
  useDeleteBrand,
} from "@/features/brand/brand.hooks";
import {
  Brand,
  BrandStatus,
} from "@/features/brand/brand.types";
import { CreateBrandFormValues } from "@/features/brand/brand.schema";
import { BrandTable } from "@/features/brand/components/brand-table";
import { BrandForm } from "@/features/brand/components/brand-form";
import { BrandDeleteDialog } from "@/features/brand/components/brand-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusTabFilter, StatusTabOption } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

type StatusFilterType = BrandStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function BrandsPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

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
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useBrands(queryParams);

  // Mutations
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const updateStatusMutation = useUpdateBrandStatus();
  const deleteMutation = useDeleteBrand();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [statusTogglePendingId, setStatusTogglePendingId] = useState<string | null>(null);

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

  // Handlers
  const handleStatusFilterChange = (value: StatusFilterType) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCreateSubmit = async (values: CreateBrandFormValues) => {
    await createMutation.mutateAsync(values);
    setIsCreateOpen(false);
    showFeedback("success", "Brand created successfully.");
  };

  const handleEditSubmit = async (values: CreateBrandFormValues) => {
    if (!editingBrand) return;
    await updateMutation.mutateAsync({
      id: editingBrand.id,
      payload: values,
    });
    setEditingBrand(null);
    showFeedback("success", "Brand updated successfully.");
  };

  const handleStatusToggle = async (
    id: string,
    currentStatus: BrandStatus
  ) => {
    const nextStatus: BrandStatus =
      currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusTogglePendingId(id);
    try {
      await updateStatusMutation.mutateAsync({ id, status: nextStatus });
      showFeedback(
        "success",
        `Brand status updated to ${nextStatus}.`
      );
    } catch {
      showFeedback("error", "Failed to update brand status.");
    }
    setStatusTogglePendingId(null);
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    showFeedback("success", "Brand deleted successfully.");
  };

  const brands = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Feedback Alert Toast */}
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

      {/* Page Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Brands
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage product brand organization, status visibility, and metadata.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Brand
          </Button>
        )}
      </div>

      {/* Filter Controls (Search & Status) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Search Input */}
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search brands by name or slug..."
        />

        {/* Status Filter */}
        <StatusTabFilter
          label="Status:"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={handleStatusFilterChange}
        />
      </div>

      {/* Error State */}
      {isError && (
        <PageErrorAlert
          title="Error loading brands"
          message={error instanceof Error ? error.message : "Failed to fetch data."}
          onRetry={refetch}
        />
      )}

      {/* Brands Table */}
      {!isError && (
        <BrandTable
          brands={brands}
          isLoading={isLoading}
          canMutate={canMutate}
          onEdit={(brand) => setEditingBrand(brand)}
          onStatusToggle={handleStatusToggle}
          onDelete={(brand) => setDeletingBrand(brand)}
          statusTogglePendingId={statusTogglePendingId}
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
          entityName="brands"
        />
      )}

      {/* Modal: Create Brand */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Brand"
      >
        <BrandForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Brand */}
      <Modal
        isOpen={Boolean(editingBrand)}
        onClose={() => setEditingBrand(null)}
        title={editingBrand ? `Edit Brand "${editingBrand.name}"` : "Edit Brand"}
      >
        <BrandForm
          initialData={editingBrand}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingBrand(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Modal: Delete Brand */}
      <BrandDeleteDialog
        brand={deletingBrand}
        isOpen={Boolean(deletingBrand)}
        onClose={() => setDeletingBrand(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
