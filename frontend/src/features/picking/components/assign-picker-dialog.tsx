"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUsers } from "@/features/user/user.hooks";
import { useAssignPicker } from "../picking.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/user/user.types";
import {
  Loader2,
  UserCheck,
  ChevronDown,
  Search,
  X,
  Check,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AssignPickerDialogProps {
  pickingTaskId: string | null;
  pickingWarehouseId: string | null | undefined;
  currentPicker: { id: string; name: string; email: string } | null | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// User combobox (inline, follows ShelfCombobox pattern)
// ---------------------------------------------------------------------------
function UserCombobox({
  users,
  value,
  onChange,
  disabled,
  isLoading,
}: {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = users.find((u) => u.id === value) ?? null;

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [disabled]);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const roleLabel = (role: string) =>
    role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={openDropdown}
        disabled={disabled || isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
      >
        <span
          className={`truncate text-left leading-tight ${
            selected
              ? "text-slate-900 dark:text-white font-medium"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {isLoading
            ? "Loading users..."
            : selected
              ? `${selected.name} (${selected.email})`
              : "-- Select Picker --"}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleClear(e as unknown as React.MouseEvent)
              }
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

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role..."
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

          <div className="max-h-64 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-slate-400">
                No users match your search.
              </p>
            ) : (
              filtered.map((u) => {
                const isSelected = u.id === value;
                return (
                  <button
                    key={u.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(u.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                      isSelected ? "bg-blue-50 dark:bg-blue-950/40" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {u.email} · {roleLabel(u.role)}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AssignPickerDialog({
  pickingTaskId,
  pickingWarehouseId,
  currentPicker,
  isOpen,
  onOpenChange,
}: AssignPickerDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState(
    currentPicker?.id ?? ""
  );

  // Reset selection when dialog opens with a new task
  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(currentPicker?.id ?? "");
    }
  }, [isOpen, currentPicker?.id]);

  // Fetch active STAFF users in the same warehouse as the picking task
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    limit: 200,
    status: "ACTIVE",
    role: "STAFF",
    warehouseId: pickingWarehouseId || undefined,
  });
  const users = usersData?.data ?? [];

  // Mutation
  const assignMutation = useAssignPicker();

  const isSubmitting = assignMutation.isPending;
  const hasChanged = selectedUserId && selectedUserId !== (currentPicker?.id ?? "");

  const handleSubmit = async () => {
    if (!pickingTaskId || !selectedUserId) return;

    try {
      await assignMutation.mutateAsync({
        id: pickingTaskId,
        payload: { assignedToId: selectedUserId },
      });
      onOpenChange(false);
    } catch {
      // Error handled by mutation — toast/error display
    }
  };

  const errorMessage =
    assignMutation.isError && assignMutation.error instanceof Error
      ? assignMutation.error.message
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Assign Picker"
      description="Assign a picker to this picking task."
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 p-2">
        {/* Current picker info */}
        {currentPicker && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Current Picker
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-medium text-slate-900 dark:text-white">
                {currentPicker.name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ({currentPicker.email})
              </span>
            </div>
          </div>
        )}

        {/* User selector */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Select Picker
          </label>
          <UserCombobox
            users={users}
            value={selectedUserId}
            onChange={setSelectedUserId}
            disabled={isSubmitting}
            isLoading={isLoadingUsers}
          />
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 dark:border-red-900/50 dark:bg-red-950/40">
            <p className="text-[11px] font-medium text-red-700 dark:text-red-300">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedUserId || !hasChanged}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Picker"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
