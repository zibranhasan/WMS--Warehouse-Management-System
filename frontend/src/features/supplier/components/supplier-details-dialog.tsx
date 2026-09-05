"use client";

import { useSupplier } from "../supplier.hooks";
import { Modal } from "@/components/shared/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import {
  Building2,
  Calendar,
  Clock,
  Factory,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

interface SupplierDetailsDialogProps {
  supplierId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierDetailsDialog({
  supplierId,
  isOpen,
  onClose,
}: SupplierDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = useSupplier(
    supplierId || ""
  );

  const supplier = data?.data;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const renderValue = (value?: string | null) => value || "—";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supplier Details"
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium">Fetching supplier details...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <PageErrorAlert
            title="Failed to load supplier details"
            message={
              error instanceof Error
                ? error.message
                : "An unexpected error occurred."
            }
            onRetry={refetch}
          />
        )}

        {/* Empty / Not Found State */}
        {!isLoading && !isError && !supplier && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Factory className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium">Supplier not found</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              The requested supplier could not be loaded.
            </p>
          </div>
        )}

        {/* Supplier Content */}
        {!isLoading && !isError && supplier && (
          <>
            {/* Header Banner */}
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <Factory className="h-8 w-8 text-slate-400" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                    {supplier.name}
                  </h3>
                  <StatusBadge
                    label={supplier.status === "ACTIVE" ? "Active" : "Inactive"}
                    variant={supplier.status === "ACTIVE" ? "success" : "neutral"}
                  />
                </div>
                <span className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                  <Building2 className="h-3.5 w-3.5" />
                  {supplier.code}
                </span>
              </div>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Contact Information */}
              <div className="space-y-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Contact Information
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Contact Person:
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {renderValue(supplier.contactPerson)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Email:
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {renderValue(supplier.email)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Phone:
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {renderValue(supplier.phone)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Address
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Street Address:
                    </span>
                    <span className="flex items-start gap-1 font-semibold text-slate-900 dark:text-slate-100">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="break-words">{renderValue(supplier.address)}</span>
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-500 dark:text-slate-400">
                      City:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {renderValue(supplier.city)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Country:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {renderValue(supplier.country)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps Section */}
            <div className="flex flex-col items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 sm:flex-row sm:items-center">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Created:{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {formatDate(supplier.createdAt)}
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Updated:{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {formatDate(supplier.updatedAt)}
                </strong>
              </span>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-end border-t border-slate-200 pt-2 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
