"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useWarehouses } from "@/features/warehouse/warehouse.hooks";
import { usePickings, useStartPicking } from "@/features/picking/picking.hooks";
import type { PickingTask } from "@/features/picking/picking.types";
import type { StatusTabOption } from "@/components/shared/status-tab-filter";
import { PickingTable } from "@/features/picking/components/picking-table";
import { CreatePickingDialog } from "@/features/picking/components/create-picking-dialog";
import { PickingDetailsDialog } from "@/features/picking/components/picking-details-dialog";
import { AssignPickerDialog } from "@/features/picking/components/assign-picker-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SearchInput } from "@/components/shared/search-input";
import { StatusTabFilter } from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Button } from "@/components/ui/button";
import { Plus, Play } from "lucide-react";

const STATUS_TABS: StatusTabOption[] = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PARTIALLY_PICKED", label: "Partially Picked" },
  { value: "PICKED", label: "Picked" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function PickingPage() {
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
      search: debouncedSearch || undefined,
      status:
        activeStatus === "all"
          ? undefined
          : (activeStatus as PickingTask["status"]),
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

  const { data, isLoading, error, isError, refetch } = usePickings(queryParams);
  const pickingTasks = data?.data ?? [];
  const meta = data?.meta;

  // Dialog states
  const [viewingTask, setViewingTask] = useState<PickingTask | null>(null);
  const [assigningTask, setAssigningTask] = useState<PickingTask | null>(null);
  const [startingTask, setStartingTask] = useState<PickingTask | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Start picking mutation
  const startMutation = useStartPicking();

  // Permission flags
  const userCanCreate =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "WAREHOUSE_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Picking Tasks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage warehouse picking tasks for sales order fulfillment.
          </p>
        </div>

        {userCanCreate && (
          <Button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create Picking Task
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search picking tasks..."
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
          title="Error loading picking tasks"
          message={
            error instanceof Error
              ? error.message
              : "Failed to fetch picking tasks."
          }
          onRetry={refetch}
        />
      )}

      <PickingTable
        pickingTasks={pickingTasks}
        isLoading={isLoading}
        userRole={user?.role}
        currentUserId={user?.id}
        onView={(task) => setViewingTask(task)}
        onAssign={(task) => setAssigningTask(task)}
        onStart={(task) => setStartingTask(task)}
      />

      {meta && (
        <DataTablePagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={setCurrentPage}
          entityName="picking tasks"
        />
      )}

      {/* Details Dialog */}
      <PickingDetailsDialog
        pickingId={viewingTask?.id ?? null}
        isOpen={!!viewingTask}
        onOpenChange={(open) => {
          if (!open) setViewingTask(null);
        }}
      />

      {/* Assign Picker Dialog */}
      <AssignPickerDialog
        pickingTaskId={assigningTask?.id ?? null}
        pickingWarehouseId={assigningTask?.warehouseId ?? null}
        currentPicker={assigningTask?.assignedTo ?? null}
        isOpen={!!assigningTask}
        onOpenChange={(open) => {
          if (!open) setAssigningTask(null);
        }}
      />

      {/* Start Picking Confirmation */}
      <ConfirmDialog
        isOpen={!!startingTask}
        onClose={() => setStartingTask(null)}
        title="Start Picking"
        subtitle={startingTask?.pickingNumber}
        description="Start this picking task? This will change the status to In Progress."
        confirmLabel="Start Picking"
        cancelLabel="Cancel"
        variant="primary"
        icon={Play}
        isPending={startMutation.isPending}
        onConfirm={async () => {
          if (!startingTask?.id) return;
          await startMutation.mutateAsync(startingTask.id);
        }}
      />

      {/* Create Picking Dialog */}
      <CreatePickingDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => setCurrentPage(1)}
      />
    </div>
  );
}
