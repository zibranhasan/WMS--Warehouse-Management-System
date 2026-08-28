"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
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
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";

export default function CategoriesPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canMutate =
    user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  // Filter & Query States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Reset page on search change
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Query Backend API
  const queryParams = {
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error } = useCategories(queryParams);

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
  const handleStatusFilterChange = (value: CategoryStatus | "ALL") => {
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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Status:
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusFilterChange(st)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {st === "ALL" ? "All" : st === "ACTIVE" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold">Error loading categories</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">
              {error instanceof Error ? error.message : "Failed to fetch data."}
            </p>
          </div>
        </div>
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
      {meta && meta.totalPages > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing page <span className="font-semibold text-slate-900 dark:text-white">{meta.page}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{meta.totalPages}</span> ({meta.total} total categories)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, meta.totalPages))
              }
              disabled={page >= meta.totalPages || isLoading}
              className="flex items-center gap-1 text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Create Category */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Add New Category
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CategoryForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateOpen(false)}
              isPending={createMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit Category &quot;{editingCategory.name}&quot;
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CategoryForm
              initialData={editingCategory}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingCategory(null)}
              isPending={updateMutation.isPending}
            />
          </div>
        </div>
      )}

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
