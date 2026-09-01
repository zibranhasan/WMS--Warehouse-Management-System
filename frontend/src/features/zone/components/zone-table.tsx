"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Zone } from "../zone.types";
import { LocationStatusBadge } from "./location-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Layers, Building2 } from "lucide-react";

interface ZoneTableProps {
  zones: Zone[];
  isLoading: boolean;
  canMutate: boolean;
  onEdit: (zone: Zone) => void;
  onStatusChange: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
}

export function ZoneTable({
  zones,
  isLoading,
  canMutate,
  onEdit,
  onStatusChange,
  onDelete,
}: ZoneTableProps) {
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

  const columns = React.useMemo<ColumnDef<Zone>[]>(() => {
    return [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              {row.original.name}
            </span>
            {row.original.description && (
              <span className="text-xs text-slate-500 truncate max-w-xs dark:text-slate-400">
                {row.original.description}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => {
          const wh = row.original.warehouse;
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium">
                {wh ? `${wh.name} (${wh.code})` : row.original.warehouseId}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "capacity",
        header: "Capacity",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {row.original.capacity}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <LocationStatusBadge status={row.original.status} />
        ),
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
          const zone = row.original;

          if (!canMutate) return null;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {/* Change Status */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(zone)}
                title="Change Zone Status"
                className="text-xs text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                Change Status
              </Button>

              {/* Edit */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(zone)}
                title="Edit Zone"
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
                onClick={() => onDelete(zone)}
                title="Delete Zone"
                className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          );
        },
      },
    ];
  }, [canMutate, onEdit, onStatusChange, onDelete]);

  return (
    <DataTable
      columns={columns}
      data={zones}
      isLoading={isLoading}
      emptyTitle="No Zones Found"
      emptyDescription="No zone records match your search query or status filter."
    />
  );
}
