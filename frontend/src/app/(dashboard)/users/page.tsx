"use client";

import { useState } from "react";
import { useCurrentUser } from "@/features/auth/auth.hooks";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useBlockUser,
  useUnblockUser,
  useDeleteUser,
} from "@/features/user/user.hooks";
import {
  User,
  Role,
  UserStatus,
  CreateUserPayload,
  UpdateUserPayload,
} from "@/features/user/user.types";
import { ROLE_VALUES } from "@/features/user/user.schema";
import { UserTable } from "@/features/user/components/user-table";
import { UserForm } from "@/features/user/components/user-form";
import { UserDeleteDialog } from "@/features/user/components/user-delete-dialog";
import { UserWarehouseDialog } from "@/features/user/components/user-warehouse-dialog";
import { UserDetailsDialog } from "@/features/user/components/user-details-dialog";
import { SearchInput } from "@/components/shared/search-input";
import {
  StatusTabFilter,
  StatusTabOption,
} from "@/components/shared/status-tab-filter";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";

type RoleFilterType = Role | "ALL";
type StatusFilterType = UserStatus | "ALL";

const ROLE_OPTIONS: StatusTabOption<RoleFilterType>[] = [
  { label: "All Roles", value: "ALL" },
  ...ROLE_VALUES.map((r) => ({
    label: r.replace("_", " "),
    value: r as RoleFilterType,
  })),
];

const STATUS_OPTIONS: StatusTabOption<StatusFilterType>[] = [
  { label: "All Status", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Blocked", value: "BLOCKED" },
];

export default function UsersPage() {
  const { data: meData } = useCurrentUser();
  const currentUser = meData?.data?.user;
  const canMutate =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  // Query state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [searchInput, setSearchInput] = useState("");

  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const queryParams = {
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...(debouncedSearch ? { searchTerm: debouncedSearch } : {}),
    ...(roleFilter !== "ALL" ? { role: roleFilter } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useUsers(queryParams);

  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const deleteMutation = useDeleteUser();

  // Dialog & pending states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [warehouseUser, setWarehouseUser] = useState<User | null>(null);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  // Toast feedback state
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

  // Submit handlers
  const handleCreateSubmit = async (
    values: CreateUserPayload | UpdateUserPayload
  ) => {
    await createMutation.mutateAsync(values as CreateUserPayload);
    setIsCreateOpen(false);
    showFeedback(
      "success",
      "User created successfully. Login credentials have been sent to the user's email address."
    );
  };


  const handleEditSubmit = async (
    values: CreateUserPayload | UpdateUserPayload
  ) => {
    if (!editingUser) return;
    await updateMutation.mutateAsync({
      id: editingUser.id,
      payload: values as UpdateUserPayload,
    });
    setEditingUser(null);
    showFeedback("success", "User details updated successfully.");
  };

  const handleBlockToggle = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      showFeedback("error", "You cannot block your own account.");
      return;
    }

    setActionPendingId(targetUser.id);
    try {
      if (targetUser.status === "BLOCKED") {
        await unblockMutation.mutateAsync(targetUser.id);
        showFeedback("success", `User "${targetUser.name}" unblocked successfully.`);
      } else {
        await blockMutation.mutateAsync(targetUser.id);
        showFeedback("success", `User "${targetUser.name}" blocked successfully.`);
      }
    } catch {
      showFeedback("error", "Failed to update user status.");
    }
    setActionPendingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id) {
      showFeedback("error", "You cannot delete your own account.");
      setDeletingUser(null);
      return;
    }

    try {
      await deleteMutation.mutateAsync(deletingUser.id);
      showFeedback("success", `User "${deletingUser.name}" deleted successfully.`);
    } catch {
      showFeedback("error", "Failed to delete user.");
    }
    setDeletingUser(null);
  };

  const users = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Toast feedback banner */}
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

      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            User Management
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage system employee accounts, roles, access permissions, and status.
          </p>
        </div>

        {canMutate && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search users by name or email address..."
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Role Filter */}
          <StatusTabFilter
            label="Role:"
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={(val) => {
              setRoleFilter(val);
              setPage(1);
            }}
          />

          {/* Status Filter */}
          <StatusTabFilter
            label="Status:"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <PageErrorAlert
          title="Error loading users"
          message={
            error instanceof Error ? error.message : "Failed to fetch user list."
          }
          onRetry={refetch}
        />
      )}

      {/* User Table */}
      {!isError && (
        <UserTable
          users={users}
          isLoading={isLoading}
          canMutate={canMutate}
          currentUserId={currentUser?.id}
          onEdit={(u) => setEditingUser(u)}
          onBlockToggle={handleBlockToggle}
          onDelete={(u) => setDeletingUser(u)}
          onAssignWarehouse={(u) => setWarehouseUser(u)}
          onViewDetails={(u) => setDetailsUserId(u.id)}
          actionPendingId={actionPendingId}
        />
      )}

      {/* Pagination */}
      {meta && (
        <DataTablePagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          isLoading={isLoading}
          onPageChange={(newPage) => setPage(newPage)}
          entityName="users"
        />
      )}

      {/* Modal: Create User */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Employee User"
      >
        <UserForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={
          editingUser
            ? `Edit User "${editingUser.name}"`
            : "Edit User"
        }
      >
        <UserForm
          initialData={editingUser}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingUser(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Dialog: Delete User */}
      <UserDeleteDialog
        user={deletingUser}
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
        currentUserId={currentUser?.id}
      />

      {/* Dialog: Warehouse Assignment */}
      <UserWarehouseDialog
        user={warehouseUser}
        isOpen={Boolean(warehouseUser)}
        onClose={() => setWarehouseUser(null)}
        onSuccess={(msg) => showFeedback("success", msg)}
      />

      {/* Dialog: User Details */}
      <UserDetailsDialog
        userId={detailsUserId}
        isOpen={Boolean(detailsUserId)}
        onClose={() => setDetailsUserId(null)}
      />
    </div>
  );
}
