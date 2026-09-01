"use client";

import { useState } from "react";
import { useWarehouseStructure } from "../warehouse.hooks";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { TableEmptyState } from "@/components/shared/table-empty-state";
import { StatusBadge, StatusBadgeVariant } from "@/components/shared/status-badge";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Columns,
  Grid,
  Box,
  Network,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WarehouseStructureTreeProps {
  warehouseId: string;
}

function LocationStatusBadge({ status }: { status: string }) {
  let variant: StatusBadgeVariant = "neutral";
  if (status === "ACTIVE") variant = "success";
  else if (status === "MAINTENANCE") variant = "warning";
  else if (status === "FULL") variant = "info";
  else if (status === "INACTIVE") variant = "destructive";

  return <StatusBadge label={status} variant={variant} />;
}

export function WarehouseStructureTree({ warehouseId }: WarehouseStructureTreeProps) {
  const { data, isLoading, isError, error, refetch } = useWarehouseStructure(warehouseId);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const structure = data?.data;
  const zones = structure?.zones || [];

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Network className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Physical Structure (Zones, Aisles, Shelves, Bins)
        </h3>
        <Link href={`/warehouses/${warehouseId}/zones`}>
          <Button type="button" variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Manage Zones
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-900" />
          <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-900" />
        </div>
      )}

      {isError && (
        <PageErrorAlert
          title="Error loading physical structure"
          message={error instanceof Error ? error.message : "Failed to load physical structure."}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && zones.length === 0 && (
        <TableEmptyState
          title="No Physical Structure Configured"
          description="No zones, aisles, shelves, or bins have been configured for this warehouse facility."
        />
      )}

      {!isLoading && !isError && zones.length > 0 && (
        <div className="space-y-3">
          {zones.map((zone) => {
            const isZoneExpanded = expandedNodes[zone.id] ?? true;
            const aisles = zone.aisles || [];

            return (
              <div
                key={zone.id}
                className="rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 overflow-hidden"
              >
                {/* Zone Header */}
                <div
                  onClick={() => toggleNode(zone.id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center gap-2">
                    {aisles.length > 0 ? (
                      isZoneExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )
                    ) : (
                      <span className="w-4" />
                    )}
                    <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      Zone: {zone.name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      ({zone.code})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                    {zone.capacity !== undefined && (
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Capacity: <strong className="text-slate-700 dark:text-slate-300">{zone.capacity}</strong>
                      </span>
                    )}
                    <LocationStatusBadge status={zone.status} />
                    <Link href={`/warehouses/${warehouseId}/zones/${zone.id}/aisles`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded"
                      >
                        <Columns className="h-3 w-3" />
                        Manage Aisles
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Aisles List */}
                {isZoneExpanded && aisles.length > 0 && (
                  <div className="p-3 pt-0 pl-7 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60 mt-1">
                    {aisles.map((aisle) => {
                      const isAisleExpanded = expandedNodes[aisle.id] ?? false;
                      const shelves = aisle.shelves || [];

                      return (
                        <div
                          key={aisle.id}
                          className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden"
                        >
                          {/* Aisle Header */}
                          <div
                            onClick={() => toggleNode(aisle.id)}
                            className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                          >
                            <div className="flex items-center gap-2">
                              {shelves.length > 0 ? (
                                isAisleExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                )
                              ) : (
                                <span className="w-3.5" />
                              )}
                              <Columns className="h-3.5 w-3.5 text-blue-500" />
                              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                Aisle: {aisle.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500">
                                ({aisle.code})
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                              {aisle.capacity !== undefined && (
                                <span className="text-slate-500 font-medium">
                                  Capacity: <strong className="text-slate-700 dark:text-slate-300">{aisle.capacity}</strong>
                                </span>
                              )}
                              <LocationStatusBadge status={aisle.status} />
                              <Link href={`/warehouses/${warehouseId}/zones/${zone.id}/aisles/${aisle.id}/shelves`}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded"
                                >
                                  <Grid className="h-3 w-3 text-amber-500" />
                                  Manage Shelves
                                </Button>
                              </Link>
                            </div>
                          </div>

                          {/* Shelves List */}
                          {isAisleExpanded && shelves.length > 0 && (
                            <div className="p-2.5 pt-0 pl-6 space-y-2 border-t border-slate-100 dark:border-slate-900 mt-1">
                              {shelves.map((shelf) => {
                                const isShelfExpanded = expandedNodes[shelf.id] ?? false;
                                const bins = shelf.bins || [];

                                return (
                                  <div
                                    key={shelf.id}
                                    className="rounded border border-slate-100 bg-slate-50/60 dark:border-slate-900 dark:bg-slate-900/60 overflow-hidden"
                                  >
                                    {/* Shelf Header */}
                                    <div
                                      onClick={() => toggleNode(shelf.id)}
                                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                    >
                                      <div className="flex items-center gap-2">
                                        {bins.length > 0 ? (
                                          isShelfExpanded ? (
                                            <ChevronDown className="h-3 w-3 text-slate-400" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 text-slate-400" />
                                          )
                                        ) : (
                                          <span className="w-3" />
                                        )}
                                        <Grid className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
                                          Shelf: {shelf.name}
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-500">
                                          ({shelf.code})
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3 text-xs">
                                        {shelf.capacity !== undefined && (
                                          <span className="text-slate-500 font-medium">
                                            Capacity: <strong>{shelf.capacity}</strong>
                                          </span>
                                        )}
                                        <LocationStatusBadge status={shelf.status} />
                                      </div>
                                    </div>

                                    {/* Bins List */}
                                    {isShelfExpanded && bins.length > 0 && (
                                      <div className="p-2 pt-0 pl-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border-t border-slate-200/50 dark:border-slate-800/50 mt-1">
                                        {bins.map((bin) => (
                                          <div
                                            key={bin.id}
                                            className="flex items-center justify-between rounded border border-slate-200/80 bg-white p-1.5 px-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <Box className="h-3 w-3 text-emerald-500 shrink-0" />
                                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                                {bin.name}
                                              </span>
                                              <span className="font-mono text-[10px] text-slate-400">
                                                ({bin.code})
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              {bin.capacity !== undefined && (
                                                <span className="text-[10px] text-slate-500">
                                                  Cap: {bin.capacity}
                                                </span>
                                              )}
                                              <LocationStatusBadge status={bin.status} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
