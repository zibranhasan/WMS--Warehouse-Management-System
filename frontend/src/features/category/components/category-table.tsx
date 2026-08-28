"use client";

import { Category, CategoryStatus } from "../category.types";
import { CategoryStatusBadge } from "./category-status-badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ToggleLeft, ToggleRight, FolderOpen, Loader2 } from "lucide-react";

interface CategoryTableProps {
  categories: Category[];
  isLoading: boolean;
  canMutate: boolean;
  onEdit: (category: Category) => void;
  onStatusToggle: (id: string, currentStatus: CategoryStatus) => void;
  onDelete: (category: Category) => void;
  statusTogglePendingId?: string | null;
}

export function CategoryTable({
  categories,
  isLoading,
  canMutate,
  onEdit,
  onStatusToggle,
  onDelete,
  statusTogglePendingId,
}: CategoryTableProps) {
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

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No Categories Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            No category records match your filter criteria or search query.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th scope="col" className="px-5 py-3.5">
              Name
            </th>
            <th scope="col" className="px-5 py-3.5">
              Slug
            </th>
            <th scope="col" className="px-5 py-3.5">
              Description
            </th>
            <th scope="col" className="px-5 py-3.5">
              Status
            </th>
            <th scope="col" className="px-5 py-3.5">
              Created At
            </th>
            {canMutate && (
              <th scope="col" className="px-5 py-3.5 text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {categories.map((category) => (
            <tr
              key={category.id}
              className="hover:bg-slate-50/75 transition-colors dark:hover:bg-slate-900/50"
            >
              <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                {category.name}
              </td>
              <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                {category.slug}
              </td>
              <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                {category.description || (
                  <span className="italic text-slate-400 dark:text-slate-600">
                    No description
                  </span>
                )}
              </td>
              <td className="px-5 py-4">
                <CategoryStatusBadge status={category.status} />
              </td>
              <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {formatDate(category.createdAt)}
              </td>
              {canMutate && (
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Toggle Status */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onStatusToggle(category.id, category.status)
                      }
                      disabled={statusTogglePendingId === category.id}
                      title={`Switch status to ${
                        category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                      }`}
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      {statusTogglePendingId === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : category.status === "ACTIVE" ? (
                        <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="sr-only">Toggle Status</span>
                    </Button>

                    {/* Edit */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(category)}
                      title="Edit Category"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(category)}
                      title="Delete Category"
                      className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
