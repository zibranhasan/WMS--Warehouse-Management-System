"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import {
  usePackingTasks,
} from "@/features/packing/packing.hooks";
import type { PackingTask } from "@/features/packing/packing.types";
import type { StatusTabOption } from "@/components/shared/status-tab-filter";
import { PackingTable } from "@/features/packing/components/packing-table";
import { PackingDetailsDialog } from "@/features/packing/components/packing-details-dialog";
import { CreatePackingDialog } from "@/features/packing/components/create-packing-dialog";
import { AssignPackerDialog } from "@/features/packing/components/assign-packer-dialog";
import { StartPackingDialog } from "@/features/packing/components/start-packing-dialog";
import { CancelPackingDialog } from "@/features/packing/components/cancel-packing-dialog";
import { CreatePackageDialog } from "@/features/packing/components/create-package-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusTabFilter } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const STATUS_TABS: StatusTabOption[] = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PARTIALLY_PACKED", label: "Partially Packed" },
  { value: "PACKED", label: "Packed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function PackingPage() {
  const { data: meData } = useCurrentUser();
  const user = meData?.data?.user;
  const isGlobalUser = !user?.warehouseId;

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
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
          : (activeStatus as PackingTask["status"]),
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

  const { data, isLoading, error, isError, refetch } = usePackingTasks(queryParams);
  const packingTasks = data?.data ?? [];
  const meta = data?.meta;

  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [cancellingTaskId, setCancellingTaskId] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [createPackageTaskId, setCreatePackageTaskId] = useState<string | null>(null);
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);

  const userCanCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Packing Tasks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage warehouse packing tasks for sales order fulfillment.
          </p>
        </div>

        {userCanCreate && (
          <Button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create Packing Task
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search packing tasks..."
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

      <StatusTabFilter
        options={STATUS_TABS}
        value={activeStatus}
        onChange={(tab) => {
          setActiveStatus(tab);
          setCurrentPage(1);
        }}
      />

      {isError && (
        <PageErrorAlert
          title="Error loading packing tasks"
          message={
            error instanceof Error
              ? error.message
              : "Failed to fetch packing tasks."
          }
          onRetry={refetch}
        />
      )}

      <PackingTable
        packingTasks={packingTasks}
        isLoading={isLoading}
        userRole={user?.role}
        currentUserId={user?.id}
        onView={(task) => {
          setViewingTaskId(task.id);
          setIsDetailsOpen(true);
        }}
        onAssign={(task) => {
          setAssigningTaskId(task.id);
          setIsAssignDialogOpen(true);
        }}
        onStart={(task) => {
          setStartingTaskId(task.id);
          setIsStartDialogOpen(true);
        }}
        onCancel={(task) => {
          setCancellingTaskId(task.id);
          setIsCancelDialogOpen(true);
        }}
        onCreatePackage={(task) => {
          setCreatePackageTaskId(task.id);
          setIsCreatePackageDialogOpen(true);
        }}
      />

      {meta && (
        <DataTablePagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={setCurrentPage}
          entityName="packing tasks"
        />
      )}

      <PackingDetailsDialog
        packingTaskId={viewingTaskId}
        isOpen={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) setViewingTaskId(null);
        }}
      />

      <CreatePackingDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => setCurrentPage(1)}
      />

      {/* Assign Packer Dialog */}
      <AssignPackerDialog
        packingTaskId={assigningTaskId}
        packingWarehouseId={
          assigningTaskId
            ? packingTasks.find((t) => t.id === assigningTaskId)?.warehouseId ?? null
            : null
        }
        currentPacker={
          assigningTaskId
            ? packingTasks.find((t) => t.id === assigningTaskId)?.packedBy ?? null
            : null
        }
        isOpen={isAssignDialogOpen}
        onOpenChange={(open) => {
          setIsAssignDialogOpen(open);
          if (!open) setAssigningTaskId(null);
        }}
      />

      {/* Start Packing Dialog */}
      <StartPackingDialog
        packingTask={
          startingTaskId
            ? packingTasks.find((t) => t.id === startingTaskId) ?? null
            : null
        }
        isOpen={isStartDialogOpen}
        onOpenChange={(open) => {
          setIsStartDialogOpen(open);
          if (!open) setStartingTaskId(null);
        }}
      />

      {/* Cancel Packing Dialog */}
      <CancelPackingDialog
        packingTask={
          cancellingTaskId
            ? packingTasks.find((t) => t.id === cancellingTaskId) ?? null
            : null
        }
        isOpen={isCancelDialogOpen}
        onOpenChange={(open) => {
          setIsCancelDialogOpen(open);
          if (!open) setCancellingTaskId(null);
        }}
      />

      {/* Create Package Dialog */}
      <CreatePackageDialog
        packingTask={
          createPackageTaskId
            ? packingTasks.find((t) => t.id === createPackageTaskId) ?? null
            : null
        }
        isOpen={isCreatePackageDialogOpen}
        onOpenChange={(open) => {
          setIsCreatePackageDialogOpen(open);
          if (!open) setCreatePackageTaskId(null);
        }}
      />
    </div>
  );
}
