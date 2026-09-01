"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Aisle } from "../aisle.types";
import { LocationStatusBadge } from "@/features/zone/components/location-status-badge";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Columns, Layers, Building2 } from "lucide-react";

interface AisleTableProps {
  aisles: Aisle[];
  isLoading: boolean;
  canMutate: boolean;
  onEdit: (aisle: Aisle) => void;
  onStatusChange: (aisle: Aisle) => void;
  onDelete: (aisle: Aisle) => void;
}

export function AisleTable({
  aisles,
  isLoading,
  canMutate,
  onEdit,
  onStatusChange,
  onDelete,
}: AisleTableProps) {
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

  const columns = React.useMemo<ColumnDef<Aisle>[]>(() => {
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
              <Columns className="h-3.5 w-3.5 text-blue-500" />
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
        accessorKey: "zone",
        header: "Zone",
        cell: ({ row }) => {
          const zone = row.original.zone;
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-medium">
                {zone ? `${zone.name} (${zone.code})` : row.original.zoneId}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => {
          const wh = row.original.zone?.warehouse;
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium">
                {wh ? `${wh.name} (${wh.code})` : "-"}
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
          const aisle = row.original;

          if (!canMutate) return null;

          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {/* Change Status */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(aisle)}
                title="Change Aisle Status"
                className="text-xs text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                Change Status
              </Button>

              {/* Edit */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(aisle)}
                title="Edit Aisle"
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
                onClick={() => onDelete(aisle)}
                title="Delete Aisle"
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
      data={aisles}
      isLoading={isLoading}
      emptyTitle="No Aisles Found"
      emptyDescription="No aisle records match your search query, zone, or status filter."
    />
  );
}
