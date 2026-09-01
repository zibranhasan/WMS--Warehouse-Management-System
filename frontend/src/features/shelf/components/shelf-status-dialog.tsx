"use client";

import { useState } from "react";
import { LocationStatus, Shelf } from "../shelf.types";
import { LOCATION_STATUS_OPTIONS } from "../shelf.schema";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ShelfStatusDialogProps {
  shelf: Shelf | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shelfId: string, status: LocationStatus) => Promise<void>;
  isPending: boolean;
}

export function ShelfStatusDialog({
  shelf,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ShelfStatusDialogProps) {
  const [prevShelfId, setPrevShelfId] = useState<string | null>(shelf?.id || null);
  const [selectedStatus, setSelectedStatus] = useState<LocationStatus>(
    shelf?.status || "ACTIVE"
  );

  if (shelf && shelf.id !== prevShelfId) {
    setPrevShelfId(shelf.id);
    setSelectedStatus(shelf.status);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelf) return;
    await onConfirm(shelf.id, selectedStatus);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shelf ? `Change Status: ${shelf.name} (${shelf.code})` : "Change Shelf Status"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select the physical operational status for this storage shelf.
        </p>

        <div className="space-y-2">
          {LOCATION_STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-between rounded-lg border p-3 text-xs font-medium cursor-pointer transition ${
                selectedStatus === opt.value
                  ? "border-blue-500 bg-blue-50/50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shelfStatus"
                  value={opt.value}
                  checked={selectedStatus === opt.value}
                  onChange={() => setSelectedStatus(opt.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                {opt.label}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {opt.value}
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update Status
          </Button>
        </div>
      </form>
    </Modal>
  );
}
