"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useSalesOrders } from "@/features/salesOrder/sales-order.hooks";
import type { SalesOrder } from "@/features/salesOrder/sales-order.types";
import type { StatusTabOption } from "@/components/shared/status-tab-filter";
import { SalesOrderTable } from "@/features/salesOrder/components/sales-order-table";
import { CreateSalesOrderDialog } from "@/features/salesOrder/components/create-sales-order-dialog";
import { SalesOrderDetailsDialog } from "@/features/salesOrder/components/sales-order-details-dialog";
import { CancelSalesOrderDialog } from "@/features/salesOrder/components/cancel-sales-order-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusTabFilter } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

// ---------------------------------------------------------------------------
// Status tab configuration
// ---------------------------------------------------------------------------
const STATUS_TABS: StatusTabOption[] = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function SalesOrdersPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const isGlobalUser = !user?.warehouseId;

  // Filters
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    user?.warehouseId ?? ""
  );

  const debouncedSearch = useDebounce(search, 300);

  // Warehouses (for global users)
  const { data: warehousesData } = useWarehouses({
    limit: 200,
    status: "ACTIVE",
  });
  const warehouses = warehousesData?.data || [];

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Query params
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: 10,
      search: debouncedSearch || undefined,
      status:
        activeStatus === "all"
          ? undefined
          : (activeStatus as SalesOrder["status"]),
      warehouseId: isGlobalUser
        ? selectedWarehouseId || undefined
        : undefined,
    }),
    [
      currentPage,
      debouncedSearch,
      activeStatus,
      isGlobalUser,
      selectedWarehouseId,
    ]
  );

  // Data
  const { data, isLoading, error, isError, refetch } = useSalesOrders(queryParams);
  const salesOrders = data?.data ?? [];
  const meta = data?.meta;

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<SalesOrder | null>(
    null
  );

  // Permission flags (PROCUREMENT & FINANCE are view-only)
  const userCanCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER" ||
    user?.role === "STAFF";

  const userCanCancel = userCanCreate;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Sales Orders
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage outbound sales orders for customer fulfillment.
            </p>
          </div>
        </div>

        {/* 
        {canCreate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </Button>
        )} */}





        {userCanCreate && (
          <Button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Sales Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search orders..."
          className="w-full sm:w-72"
        />
        {isGlobalUser && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Warehouse:
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <StatusTabFilter
        options={STATUS_TABS}
        value={activeStatus}
        onChange={(tab) => {
          setActiveStatus(tab);
          setCurrentPage(1);
        }}
      />

      {/* Error */}
      {isError && (
        <PageErrorAlert
          title="Error loading sales orders"
          message={
            error instanceof Error
              ? error.message
              : "Failed to fetch sales orders."
          }
          onRetry={refetch}
        />
      )}

      {/* Table */}
      <SalesOrderTable
        salesOrders={salesOrders}
        isLoading={isLoading}
        canCancel={userCanCancel}
        onView={(so) => setViewingOrder(so)}
        onCancel={(so) => setCancellingOrder(so)}
      />

      {/* Pagination */}
      {meta && (
        <DataTablePagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={setCurrentPage}
          entityName="sales orders"
        />
      )}

      {/* Dialogs */}
      <CreateSalesOrderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
      <SalesOrderDetailsDialog
        salesOrderId={viewingOrder?.id ?? null}
        isOpen={!!viewingOrder}
        onOpenChange={(open) => {
          if (!open) setViewingOrder(null);
        }}
      />
      <CancelSalesOrderDialog
        salesOrderId={cancellingOrder?.id ?? null}
        orderNumber={cancellingOrder?.orderNumber}
        open={!!cancellingOrder}
        onOpenChange={(open) => {
          if (!open) setCancellingOrder(null);
        }}
        onSuccess={() => setCancellingOrder(null)}
      />
    </div>
  );
}
