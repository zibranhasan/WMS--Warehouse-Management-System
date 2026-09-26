"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useUpdateCategoryStatus,
  useDeleteCategory,
} from "@/features/category/category.hooks";
import {
  Category,
  CategoryStatus,
} from "@/features/category/category.types";
import { CreateCategoryFormValues } from "@/features/category/category.schema";
import { CategoryTable } from "@/features/category/components/category-table";
import { CategoryForm } from "@/features/category/components/category-form";
import { CategoryDeleteDialog } from "@/features/category/components/category-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusTabFilter, StatusTabOption } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

type StatusFilterType = CategoryStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function CategoriesPage() {
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

  const { data, isLoading, isError, error, refetch } = useCategories(queryParams);

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const updateStatusMutation = useUpdateCategoryStatus();
  const deleteMutation = useDeleteCategory();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
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

  const handleCreateSubmit = async (values: CreateCategoryFormValues) => {
    await createMutation.mutateAsync(values);
    setIsCreateOpen(false);
    showFeedback("success", "Category created successfully.");
  };

  const handleEditSubmit = async (values: CreateCategoryFormValues) => {
    if (!editingCategory) return;
    await updateMutation.mutateAsync({
      id: editingCategory.id,
      payload: values,
    });
    setEditingCategory(null);
    showFeedback("success", "Category updated successfully.");
  };

  const handleStatusToggle = async (
    id: string,
    currentStatus: CategoryStatus
  ) => {
    const nextStatus: CategoryStatus =
      currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusTogglePendingId(id);
    try {
      await updateStatusMutation.mutateAsync({ id, status: nextStatus });
      showFeedback(
        "success",
        `Category status updated to ${nextStatus}.`
      );
    } catch {
      showFeedback("error", "Failed to update category status.");
    }
    setStatusTogglePendingId(null);
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    showFeedback("success", "Category deleted successfully.");
  };

  const categories = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
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
            Categories
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage product categorization, status visibility, and metadata.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Filter Controls (Search & Status) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Search Input */}
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search categories by name or slug..."
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
          title="Error loading categories"
          message={error instanceof Error ? error.message : "Failed to fetch data."}
          onRetry={refetch}
        />
      )}

      {/* Categories Table */}
      {!isError && (
        <CategoryTable
          categories={categories}
          isLoading={isLoading}
          canMutate={canMutate}
          onEdit={(cat) => setEditingCategory(cat)}
          onStatusToggle={handleStatusToggle}
          onDelete={(cat) => setDeletingCategory(cat)}
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
          entityName="categories"
        />
      )}

      {/* Modal: Create Category */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Category"
      >
        <CategoryForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Category */}
      <Modal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title={editingCategory ? `Edit Category "${editingCategory.name}"` : "Edit Category"}
      >
        <CategoryForm
          initialData={editingCategory}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingCategory(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Modal: Delete Category */}
      <CategoryDeleteDialog
        category={deletingCategory}
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
