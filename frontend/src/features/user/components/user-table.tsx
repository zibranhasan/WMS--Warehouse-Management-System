"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { User, Role } from "../user.types";
import { UserRoleBadge } from "./user-role-badge";
import { UserStatusBadge } from "./user-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Building2,
  Eye,
} from "lucide-react";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  canMutate: boolean;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onBlockToggle: (user: User) => void;
  onDelete: (user: User) => void;
  onAssignWarehouse?: (user: User) => void;
  onViewDetails?: (user: User) => void;
  actionPendingId?: string | null;
}

export function UserTable({
  users,
  isLoading,
  canMutate,
  currentUserId,
  onEdit,
  onBlockToggle,
  onDelete,
  onAssignWarehouse,
  onViewDetails,
  actionPendingId,
}: UserTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const columns = React.useMemo<ColumnDef<User>[]>(() => {
    return [
      {
        id: "avatar",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-4 w-4 text-slate-400" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white">
              {row.original.name}
              {row.original.id === currentUserId && (
                <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  You
                </span>
              )}
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <UserRoleBadge role={row.original.role as Role} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "emailVerified",
        header: "Verified",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs font-medium">
            {row.original.emailVerified ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <XCircle className="h-3.5 w-3.5" /> Pending
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "warehouseId",
        header: "Warehouse",
        cell: ({ row }) => {
          const user = row.original;
          if (user.warehouse) {
            return (
              <div className="flex flex-col max-w-[140px]">
                <span className="font-medium text-xs text-slate-900 dark:text-white truncate">
                  {user.warehouse.name}
                </span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  {user.warehouse.code}
                </span>
              </div>
            );
          }
          if (user.warehouseId) {
            return (
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-[120px] block">
                {user.warehouseId}
              </span>
            );
          }
          return <span className="text-xs text-slate-400 dark:text-slate-500">—</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = currentUserId === user.id;
          const isPending = actionPendingId === user.id;

          if (!canMutate && !onViewDetails) return null;

          return (
            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
              {/* View Details Action */}
              {onViewDetails && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(user)}
                  title="View User Details"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              )}

              {/* Assign Warehouse Action */}
              {canMutate && onAssignWarehouse && user.status !== "DELETED" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAssignWarehouse(user)}
                  title={user.warehouseId ? "Change / Unassign Warehouse" : "Assign Warehouse"}
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="sr-only">Assign Warehouse</span>
                </Button>
              )}

              {/* Block / Unblock Action */}
              {canMutate && user.status !== "DELETED" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onBlockToggle(user)}
                  disabled={isPending || isSelf}
                  title={
                    isSelf
                      ? "You cannot block yourself"
                      : user.status === "BLOCKED"
                      ? "Unblock User"
                      : "Block User"
                  }
                  className="text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 disabled:opacity-40"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : user.status === "BLOCKED" ? (
                    <Unlock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="sr-only">
                    {user.status === "BLOCKED" ? "Unblock" : "Block"}
                  </span>
                </Button>
              )}

              {/* Edit User */}
              {canMutate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(user)}
                  title="Edit User"
                  className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}

              {/* Delete User */}
              {canMutate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(user)}
                  disabled={isSelf}
                  title={isSelf ? "You cannot delete your own account" : "Delete User"}
                  className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>
          );
        },
      },
    ];
  }, [canMutate, currentUserId, actionPendingId, onEdit, onBlockToggle, onDelete, onAssignWarehouse, onViewDetails]);

  return (
    <DataTable
      columns={columns}
      data={users}
      isLoading={isLoading}
      emptyTitle="No Users Found"
      emptyDescription="No user accounts match your search query or role/status filter."
    />
  );
}
