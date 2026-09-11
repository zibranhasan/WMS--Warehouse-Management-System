"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { useShipments } from "@/features/shipping/shipping.hooks";
import type { Shipment } from "@/features/shipping/shipping.types";
import type { StatusTabOption } from "@/components/shared/status-tab-filter";
import { ShippingTable } from "@/features/shipping/components/shipping-table";
import { ShippingDetailsDialog } from "@/features/shipping/components/shipping-details-dialog";
import { CreateShipmentDialog } from "@/features/shipping/components/create-shipment-dialog";
import { UpdateShipmentDialog } from "@/features/shipping/components/update-shipment-dialog";
import { UpdateShipmentStatusDialog } from "@/features/shipping/components/update-shipment-status-dialog";
import type { ShipmentStatus } from "@/features/shipping/shipping.types";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StatusTabFilter } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";

const STATUS_TABS: StatusTabOption[] = [
  { value: "all", label: "All" },
  { value: "READY", label: "Ready" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const SHIPPING_METHOD_OPTIONS = [
  { value: "all", label: "All Methods" },
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Express" },
  { value: "SAME_DAY", label: "Same Day" },
  { value: "PICKUP", label: "Pickup" },
] as const;

export default function ShippingPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const isGlobalUser = !user?.warehouseId;

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeShippingMethod, setActiveShippingMethod] = useState("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    user?.warehouseId ?? ""
  );

  const debouncedSearch = useDebounce(search, 300);

  const { data: warehousesData } = useWarehouses({
    limit: 200,
    status: "ACTIVE",
  });
  const warehouses = warehousesData?.data || [];

  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: 10,
      searchTerm: debouncedSearch || undefined,
      status:
        activeStatus === "all"
          ? undefined
          : (activeStatus as Shipment["status"]),
      shippingMethod:
        activeShippingMethod === "all"
          ? undefined
          : (activeShippingMethod as Shipment["shippingMethod"]),
      warehouseId: isGlobalUser
        ? selectedWarehouseId || undefined
        : undefined,
    }),
    [
      currentPage,
      debouncedSearch,
      activeStatus,
      activeShippingMethod,
      isGlobalUser,
      selectedWarehouseId,
    ]
  );

  const { data, isLoading, error, isError, refetch } = useShipments(queryParams);
  const shipments = data?.data ?? [];
  const meta = data?.meta;

  const [viewingShipmentId, setViewingShipmentId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [statusChangeShipment, setStatusChangeShipment] = useState<Shipment | null>(null);
  const [nextStatus, setNextStatus] = useState<ShipmentStatus | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const userCanCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Shipments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage warehouse shipments for sales order fulfillment.
          </p>
        </div>

        {userCanCreate && (
          <Button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create Shipment
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search shipments..."
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabFilter
          options={STATUS_TABS}
          value={activeStatus}
          onChange={(tab) => {
            setActiveStatus(tab);
            setCurrentPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Method:
          </label>
          <select
            value={activeShippingMethod}
            onChange={(e) => {
              setActiveShippingMethod(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {SHIPPING_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError && (
        <PageErrorAlert
          title="Error loading shipments"
          message={
            error instanceof Error
              ? error.message
              : "Failed to fetch shipments."
          }
          onRetry={refetch}
        />
      )}

      <ShippingTable
        shipments={shipments}
        isLoading={isLoading}
        userRole={user?.role}
        onView={(shipment) => {
          setViewingShipmentId(shipment.id);
          setIsDetailsOpen(true);
        }}
        onEdit={(shipment) => {
          setEditingShipment(shipment);
          setIsUpdateDialogOpen(true);
        }}
        onStatusChange={(shipment, next) => {
          setStatusChangeShipment(shipment);
          setNextStatus(next);
          setIsStatusDialogOpen(true);
        }}
      />

      {meta && (
        <DataTablePagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={setCurrentPage}
          entityName="shipments"
        />
      )}

      <ShippingDetailsDialog
        shipmentId={viewingShipmentId}
        isOpen={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) setViewingShipmentId(null);
        }}
      />

      <CreateShipmentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      <UpdateShipmentDialog
        shipment={editingShipment}
        isOpen={isUpdateDialogOpen}
        onClose={() => {
          setIsUpdateDialogOpen(false);
          setEditingShipment(null);
        }}
      />

      <UpdateShipmentStatusDialog
        shipment={statusChangeShipment}
        nextStatus={nextStatus}
        isOpen={isStatusDialogOpen}
        onClose={() => {
          setIsStatusDialogOpen(false);
          setStatusChangeShipment(null);
          setNextStatus(null);
        }}
      />
    </div>
  );
}
