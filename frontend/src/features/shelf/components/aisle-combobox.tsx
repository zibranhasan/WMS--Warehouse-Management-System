"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Aisle } from "@/features/aisle/aisle.types";
import { ChevronDown, Search, X, Check } from "lucide-react";

interface AisleComboboxProps {
  aisles: Aisle[];
  value: string; // aisleId
  onChange: (aisleId: string) => void;
  disabled?: boolean;
  error?: string;
}

function buildShortLabel(a: Aisle): string {
  const wh = a.zone?.warehouse;
  const zone = a.zone;
  const parts: string[] = [`${a.name} (${a.code})`];
  if (zone) parts.push(zone.name);
  if (wh) parts.push(wh.name);
  return parts.join(" · ");
}

function matchesSearch(a: Aisle, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    a.name,
    a.code,
    a.zone?.name ?? "",
    a.zone?.code ?? "",
    a.zone?.warehouse?.name ?? "",
    a.zone?.warehouse?.code ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function AisleCombobox({
  aisles,
  value,
  onChange,
  disabled = false,
  error,
}: AisleComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedAisle = aisles.find((a) => a.id === value) ?? null;

  const filtered = aisles.filter((a) => matchesSearch(a, search));

  // Group by warehouse for structured display
  const grouped = filtered.reduce<Record<string, { warehouseLabel: string; aisles: Aisle[] }>>(
    (acc, a) => {
      const wh = a.zone?.warehouse;
      const key = wh?.id ?? "__no_warehouse__";
      const warehouseLabel = wh ? `${wh.name} (${wh.code})` : "Unknown Warehouse";
      if (!acc[key]) {
        acc[key] = { warehouseLabel, aisles: [] };
      }
      acc[key].aisles.push(a);
      return acc;
    },
    {}
  );

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [disabled]);

  const handleSelect = (aisleId: string) => {
    onChange(aisleId);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
    setSearch("");
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={openDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/20"
            : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <span
          className={`truncate text-left leading-tight ${
            selectedAisle
              ? "text-slate-900 dark:text-white font-medium"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {selectedAisle ? buildShortLabel(selectedAisle) : "-- Select Storage Aisle --"}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedAisle && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search aisle, zone, warehouse..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">
                No aisles match your search.
              </p>
            ) : (
              Object.entries(grouped).map(([whKey, group]) => (
                <div key={whKey}>
                  {/* Warehouse group header */}
                  <div className="sticky top-0 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {group.warehouseLabel}
                    </span>
                  </div>

                  {group.aisles.map((a) => {
                    const zone = a.zone;
                    const isSelected = a.id === value;

                    return (
                      <button
                        key={a.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(a.id)}
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/40"
                            : ""
                        }`}
                      >
                        {/* Hierarchy breadcrumb */}
                        <div className="flex-1 min-w-0">
                          {zone && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {zone.name} ({zone.code})
                            </p>
                          )}
                          <p
                            className={`text-xs font-semibold truncate ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {a.name}{" "}
                            <span className="font-mono font-normal text-slate-500">
                              ({a.code})
                            </span>
                          </p>
                        </div>

                        {/* Checkmark for selected */}
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
