"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { usePurchaseOrders } from "@/features/purchaseOrder/purchase-order.hooks";
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderQueryParams,
} from "@/features/purchaseOrder/purchase-order.types";
import { PurchaseOrderTable } from "@/features/purchaseOrder/components/purchase-order-table";
import { CreatePurchaseOrderDialog } from "@/features/purchaseOrder/components/create-purchase-order-dialog";
import { EditPurchaseOrderDialog } from "@/features/purchaseOrder/components/edit-purchase-order-dialog";
import { ApprovePurchaseOrderDialog } from "@/features/purchaseOrder/components/approve-purchase-order-dialog";
import { RejectPurchaseOrderDialog } from "@/features/purchaseOrder/components/reject-purchase-order-dialog";
import { CancelPurchaseOrderDialog } from "@/features/purchaseOrder/components/cancel-purchase-order-dialog";
import { ReceivePurchaseOrderDialog } from "@/features/purchaseOrder/components/receive-purchase-order-dialog";
import { PurchaseOrderReceiptsDialog } from "@/features/purchaseOrder/components/purchase-order-receipts-dialog";
import { PurchaseOrderDetailsDialog } from "@/features/purchaseOrder/components/purchase-order-details-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  StatusTabFilter,
  StatusTabOption,
} from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

type StatusFilterType = PurchaseOrderStatus | "ALL";

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Partially Received", value: "PARTIALLY_RECEIVED" },
  { label: "Received", value: "RECEIVED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function PurchaseOrdersPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const canCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "PROCUREMENT";
  const canManage =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "PROCUREMENT";
  const canReceive =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER" ||
    user?.role === "PROCUREMENT";

  // Filter & Pagination States
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [approvingPO, setApprovingPO] = useState<PurchaseOrder | null>(null);
  const [rejectingPO, setRejectingPO] = useState<PurchaseOrder | null>(null);
  const [cancellingPO, setCancellingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receiptsPO, setReceiptsPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: StatusFilterType) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Query Backend API
  const queryParams: PurchaseOrderQueryParams = {
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = usePurchaseOrders(queryParams);

  const purchaseOrders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
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

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Purchase Orders
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage inbound procurement orders, approvals, and goods receiving.
          </p>
        </div>

        {canCreate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </Button>
        )}
      </div>

      {/* Filter Controls (Search & Status) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Search Input */}
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by PO number, supplier, warehouse, or notes..."
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
          title="Error loading purchase orders"
          message={
            error instanceof Error ? error.message : "Failed to fetch purchase orders."
          }
          onRetry={refetch}
        />
      )}

      {/* Purchase Orders Table */}
      {!isError && (
        <PurchaseOrderTable
          purchaseOrders={purchaseOrders}
          isLoading={isLoading}
          canEdit={canCreate}
          canManage={canManage}
          canReceive={canReceive}
          onView={(po) => setViewingPO(po)}
          onEdit={(po) => setEditingPO(po)}
          onApprove={(po) => setApprovingPO(po)}
          onReject={(po) => setRejectingPO(po)}
          onCancel={(po) => setCancellingPO(po)}
          onReceive={(po) => setReceivingPO(po)}
          onReceipts={(po) => setReceiptsPO(po)}
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
          entityName="purchase orders"
        />
      )}

      {/* Dialog: Create Purchase Order */}
      <CreatePurchaseOrderDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() =>
          showFeedback("success", "Purchase order created successfully.")
        }
      />

      {/* Dialog: Edit Purchase Order */}
      <EditPurchaseOrderDialog
        purchaseOrder={editingPO}
        isOpen={Boolean(editingPO)}
        onClose={() => setEditingPO(null)}
        onSuccess={() =>
          showFeedback("success", "Purchase order updated successfully.")
        }
      />

      {/* Dialog: Approve Purchase Order */}
      <ApprovePurchaseOrderDialog
        purchaseOrder={approvingPO}
        isOpen={Boolean(approvingPO)}
        onClose={() => setApprovingPO(null)}
        onSuccess={() =>
          showFeedback("success", "Purchase order approved successfully.")
        }
      />

      {/* Dialog: Reject Purchase Order */}
      <RejectPurchaseOrderDialog
        purchaseOrder={rejectingPO}
        isOpen={Boolean(rejectingPO)}
        onClose={() => setRejectingPO(null)}
        onSuccess={() =>
          showFeedback("success", "Purchase order rejected successfully.")
        }
      />

      {/* Dialog: Cancel Purchase Order */}
      <CancelPurchaseOrderDialog
        purchaseOrder={cancellingPO}
        isOpen={Boolean(cancellingPO)}
        onClose={() => setCancellingPO(null)}
        onSuccess={() =>
          showFeedback("success", "Purchase order cancelled successfully.")
        }
      />

      {/* Dialog: Receive Goods */}
      <ReceivePurchaseOrderDialog
        purchaseOrder={receivingPO}
        isOpen={Boolean(receivingPO)}
        onClose={() => setReceivingPO(null)}
        onSuccess={() =>
          showFeedback("success", "Goods received successfully.")
        }
      />

      {/* Dialog: Receipt History */}
      <PurchaseOrderReceiptsDialog
        purchaseOrder={receiptsPO}
        isOpen={Boolean(receiptsPO)}
        onClose={() => setReceiptsPO(null)}
      />

      {/* Dialog: Purchase Order Details */}
      <PurchaseOrderDetailsDialog
        purchaseOrder={viewingPO}
        isOpen={Boolean(viewingPO)}
        onClose={() => setViewingPO(null)}
      />
    </div>
  );
}
