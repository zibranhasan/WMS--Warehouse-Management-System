"use client";

import { useState } from "react";
import { LocationStatus, Zone } from "../zone.types";
import { LOCATION_STATUS_OPTIONS } from "../zone.schema";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ZoneStatusDialogProps {
  zone: Zone | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (zoneId: string, status: LocationStatus) => Promise<void>;
  isPending: boolean;
}

export function ZoneStatusDialog({
  zone,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ZoneStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<LocationStatus>(
    zone?.status || "ACTIVE"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;
    await onConfirm(zone.id, selectedStatus);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={zone ? `Change Status: ${zone.name} (${zone.code})` : "Change Zone Status"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select the physical operational status for this storage zone.
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
                  name="zoneStatus"
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
