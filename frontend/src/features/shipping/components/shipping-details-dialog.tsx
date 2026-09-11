"use client";

import { useShipment } from "../shipping.hooks";
import { Modal } from "@/components/shared/modal";
import { PageErrorAlert } from "@/components/shared/page-error-alert";
import { ShippingStatusBadge } from "./shipping-status-badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Truck,
  Calendar,
  Building2,
  MapPin,
  Phone,
  Package,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ShippingDetailsDialogProps {
  shipmentId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDate = (dateString: string) => {
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

const formatShippingMethod = (method: string) => {
  const map: Record<string, string> = {
    STANDARD: "Standard",
    EXPRESS: "Express",
    SAME_DAY: "Same Day",
    PICKUP: "Pickup",
  };
  return map[method] ?? method;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ShippingDetailsDialog({
  shipmentId,
  isOpen,
  onOpenChange,
}: ShippingDetailsDialogProps) {
  const { data, isLoading, isError, error, refetch } = useShipment(
    shipmentId || ""
  );

  const shipment = data?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Shipment Details"
      description={shipment?.shipmentNumber}
      maxWidthClass="max-w-3xl"
      className="max-h-[90vh] flex flex-col"
      contentClassName="min-h-0 flex-1 overflow-y-auto space-y-3"
    >
      <div>
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium">
              Fetching shipment details...
            </p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <PageErrorAlert
            title="Failed to load shipment details"
            message={
              error instanceof Error
                ? error.message
                : "An unexpected error occurred."
            }
            onRetry={refetch}
          />
        )}

        {/* Not Found */}
        {!isLoading && !isError && !shipment && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
            <Truck className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">Shipment not found</p>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              The requested shipment could not be loaded.
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && shipment && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {shipment.shipmentNumber}
                </h3>
                <div className="flex items-center gap-1.5">
                  <ShippingStatusBadge status={shipment.status} />
                </div>
              </div>
            </div>

            {/* Shipment Info */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoCard
                icon={<Package className="h-3.5 w-3.5" />}
                label="Sales Order"
                value={
                  shipment.salesOrder?.orderNumber ||
                  shipment.salesOrderId ||
                  "\u2014"
                }
              />
              <InfoCard
                icon={<Building2 className="h-3.5 w-3.5" />}
                label="Warehouse"
                value={shipment.warehouse?.name || "\u2014"}
                sub={shipment.warehouse?.code}
              />
              <InfoCard
                icon={<Truck className="h-3.5 w-3.5" />}
                label="Shipping Method"
                value={formatShippingMethod(shipment.shippingMethod)}
              />
              <InfoCard
                icon={<Truck className="h-3.5 w-3.5" />}
                label="Carrier"
                value={shipment.carrier || "\u2014"}
              />
              <InfoCard
                icon={<Truck className="h-3.5 w-3.5" />}
                label="Tracking Number"
                value={shipment.trackingNumber || "\u2014"}
              />
            </div>

            {/* Shipping Address */}
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Shipping Address
              </p>
              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950">
                <div className="space-y-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        {shipment.shippingAddress}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {shipment.shippingCity}, {shipment.shippingCountry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {shipment.shippingPhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Timeline
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <InfoCard
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Created At"
                  value={formatDate(shipment.createdAt)}
                />
                <InfoCard
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Shipped At"
                  value={shipment.shippedAt ? formatDate(shipment.shippedAt) : "\u2014"}
                />
                <InfoCard
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Delivered At"
                  value={shipment.deliveredAt ? formatDate(shipment.deliveredAt) : "\u2014"}
                />
              </div>
            </div>

            {/* Notes */}
            {shipment.notes && (
              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Notes
                </p>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {shipment.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 pt-2 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// InfoCard sub-component
// ---------------------------------------------------------------------------
function InfoCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-white break-words">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 break-words">
          {sub}
        </p>
      )}
    </div>
  );
}
