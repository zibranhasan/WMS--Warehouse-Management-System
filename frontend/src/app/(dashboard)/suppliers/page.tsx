"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/features/supplier/supplier.hooks";
import { Supplier, SupplierStatus } from "@/features/supplier/supplier.types";
import { CreateSupplierFormValues } from "@/features/supplier/supplier.schema";
import { SupplierTable } from "@/features/supplier/components/supplier-table";
import { SupplierForm } from "@/features/supplier/components/supplier-form";
import { SupplierDetailsDialog } from "@/features/supplier/components/supplier-details-dialog";
import { SupplierStatusDialog } from "@/features/supplier/components/supplier-status-dialog";
import { SupplierDeleteDialog } from "@/features/supplier/components/supplier-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusTabFilter, StatusTabOption } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

type StatusFilterType = SupplierStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function SuppliersPage() {
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

  const { data, isLoading, isError, error, refetch } = useSuppliers(queryParams);

  // Mutations
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplierId, setViewingSupplierId] = useState<string | null>(null);
  const [statusSupplier, setStatusSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
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

  const handleCreateSubmit = async (values: CreateSupplierFormValues) => {
    await createMutation.mutateAsync(values);
    setIsCreateOpen(false);
    showFeedback("success", "Supplier created successfully.");
  };

  const handleEditSubmit = async (values: CreateSupplierFormValues) => {
    if (!editingSupplier) return;
    await updateMutation.mutateAsync({
      id: editingSupplier.id,
      payload: values,
    });
    setEditingSupplier(null);
    showFeedback("success", "Supplier updated successfully.");
  };

  const handleStatusToggle = async (
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currentStatus: SupplierStatus
  ) => {
    setStatusTogglePendingId(id);
    setStatusSupplier(
      data?.data?.find((s) => s.id === id) || null
    );
    setStatusTogglePendingId(null);
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    showFeedback("success", "Supplier deleted successfully.");
  };

  const suppliers = data?.data || [];
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
            Suppliers
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage supplier records, contact details, and active status.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Filter Controls (Search & Status) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Search Input */}
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search suppliers by name, code, or contact..."
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
          title="Error loading suppliers"
          message={error instanceof Error ? error.message : "Failed to fetch data."}
          onRetry={refetch}
        />
      )}

      {/* Suppliers Table */}
      {!isError && (
        <SupplierTable
          suppliers={suppliers}
          isLoading={isLoading}
          canMutate={canMutate}
          onView={(supplier) => setViewingSupplierId(supplier.id)}
          onEdit={(supplier) => setEditingSupplier(supplier)}
          onStatusToggle={handleStatusToggle}
          onDelete={(supplier) => setDeletingSupplier(supplier)}
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
          entityName="suppliers"
        />
      )}

      {/* Modal: Create Supplier */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Supplier"
      >
        <SupplierForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Supplier */}
      <Modal
        isOpen={Boolean(editingSupplier)}
        onClose={() => setEditingSupplier(null)}
        title={editingSupplier ? `Edit Supplier "${editingSupplier.name}"` : "Edit Supplier"}
      >
        <SupplierForm
          initialData={editingSupplier}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingSupplier(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Dialog: Supplier Details (View) */}
      <SupplierDetailsDialog
        supplierId={viewingSupplierId}
        isOpen={Boolean(viewingSupplierId)}
        onClose={() => setViewingSupplierId(null)}
      />

      {/* Dialog: Status Change */}
      <SupplierStatusDialog
        supplierId={statusSupplier?.id ?? null}
        supplierName={statusSupplier?.name}
        currentStatus={statusSupplier?.status ?? null}
        open={Boolean(statusSupplier)}
        onOpenChange={(open) => {
          if (!open) setStatusSupplier(null);
        }}
      />

      {/* Dialog: Delete Supplier */}
      <SupplierDeleteDialog
        supplierId={deletingSupplier?.id ?? null}
        supplierName={deletingSupplier?.name}
        open={Boolean(deletingSupplier)}
        onOpenChange={(open) => {
          if (!open) setDeletingSupplier(null);
        }}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
