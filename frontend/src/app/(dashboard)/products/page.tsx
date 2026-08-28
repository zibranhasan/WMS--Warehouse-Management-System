"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useUpdateProductStatus,
  useDeleteProduct,
} from "@/features/product/product.hooks";
import {
  Product,
  ProductStatus,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/features/product/product.types";
import { ProductTable } from "@/features/product/components/product-table";
import { ProductForm } from "@/features/product/components/product-form";
import { ProductDeleteDialog } from "@/features/product/components/product-delete-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusTabFilter, StatusTabOption } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

type StatusFilterType = ProductStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function ProductsPage() {
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

  const { data, isLoading, isError, error, refetch } = useProducts(queryParams);

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const updateStatusMutation = useUpdateProductStatus();
  const deleteMutation = useDeleteProduct();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
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

  const handleCreateSubmit = async (values: CreateProductPayload | UpdateProductPayload) => {
    await createMutation.mutateAsync(values as CreateProductPayload);
    setIsCreateOpen(false);
    showFeedback("success", "Product created successfully.");
  };

  const handleEditSubmit = async (values: CreateProductPayload | UpdateProductPayload) => {
    if (!editingProduct) return;
    await updateMutation.mutateAsync({
      id: editingProduct.id,
      payload: values as UpdateProductPayload,
    });
    setEditingProduct(null);
    showFeedback("success", "Product updated successfully.");
  };

  const handleStatusToggle = async (
    id: string,
    currentStatus: ProductStatus
  ) => {
    const nextStatus: ProductStatus =
      currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusTogglePendingId(id);
    try {
      await updateStatusMutation.mutateAsync({ id, status: nextStatus });
      showFeedback(
        "success",
        `Product status updated to ${nextStatus}.`
      );
    } catch {
      showFeedback("error", "Failed to update product status.");
    }
    setStatusTogglePendingId(null);
  };

  const handleDeleteConfirm = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    showFeedback("success", "Product deleted successfully.");
  };

  const products = data?.data || [];
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
            Products
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage product catalog, SKUs, category & brand mappings, and image media.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filter Controls (Search & Status) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Search Input */}
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search products by SKU, name, or slug..."
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
          title="Error loading products"
          message={error instanceof Error ? error.message : "Failed to fetch data."}
          onRetry={refetch}
        />
      )}

      {/* Products Table */}
      {!isError && (
        <ProductTable
          products={products}
          isLoading={isLoading}
          canMutate={canMutate}
          onEdit={(prod) => setEditingProduct(prod)}
          onStatusToggle={handleStatusToggle}
          onDelete={(prod) => setDeletingProduct(prod)}
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
          entityName="products"
        />
      )}

      {/* Modal: Create Product */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Product"
      >
        <ProductForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit Product */}
      <Modal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={editingProduct ? `Edit Product "${editingProduct.name}"` : "Edit Product"}
      >
        <ProductForm
          initialData={editingProduct}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingProduct(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Modal: Delete Product */}
      <ProductDeleteDialog
        product={deletingProduct}
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
