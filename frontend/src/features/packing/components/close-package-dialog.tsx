"use client";

import { useClosePackage } from "../packing.hooks";
import { Package } from "../packing.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PackageCheck } from "lucide-react";

interface ClosePackageDialogProps {
  packingTaskId: string;
  selectedPackage: Package | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClosePackageDialog({
  packingTaskId,
  selectedPackage,
  isOpen,
  onOpenChange,
}: ClosePackageDialogProps) {
  const closePackageMutation = useClosePackage();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!selectedPackage) return;

    await closePackageMutation.mutateAsync({
      id: packingTaskId,
      packageId: selectedPackage.id,
    });
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Close Package"
      subtitle={selectedPackage?.packageNumber}
      confirmLabel="Close Package"
      cancelLabel="Keep Open"
      variant="primary"
      icon={PackageCheck}
      isPending={closePackageMutation.isPending}
      onConfirm={handleConfirm}
      description={
        <div className="space-y-2">
          <p>
            Are you sure you want to close package{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {selectedPackage?.packageNumber}
            </span>
            ?
          </p>
          {selectedPackage && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Package Number
                  </span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedPackage.packageNumber}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Items
                  </span>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedPackage.items.length}
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This action is irreversible. The package status will be changed to
            Packed.
          </p>
        </div>
      }
    />
  );
}
