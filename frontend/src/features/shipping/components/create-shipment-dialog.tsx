"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSalesOrders } from "@/features/salesOrder/sales-order.hooks";
import { usePackingTasks } from "@/features/packing/packing.hooks";
import { useShipments, useCreateShipment } from "../shipping.hooks";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const createShipmentSchema = z.object({
  salesOrderId: z.string().min(1, "Sales order is required"),
  shippingMethod: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "PICKUP"]),
  shippingAddress: z
    .string()
    .min(1, "Shipping address is required")
    .trim(),
  shippingCity: z
    .string()
    .min(1, "City is required")
    .trim(),
  shippingCountry: z
    .string()
    .min(1, "Country is required")
    .trim(),
  shippingPhone: z
    .string()
    .min(1, "Phone is required")
    .trim(),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

type CreateShipmentFormValues = z.infer<typeof createShipmentSchema>;

// ---------------------------------------------------------------------------
// Shipping Method Options
// ---------------------------------------------------------------------------
const SHIPPING_METHOD_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Express" },
  { value: "SAME_DAY", label: "Same Day" },
  { value: "PICKUP", label: "Pickup" },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CreateShipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CreateShipmentDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateShipmentDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateShipment();

  // Fetch CONFIRMED Sales Orders (valid baseline for shipping eligibility)
  const { data: soData, isLoading: isLoadingSOs } = useSalesOrders({
    status: "CONFIRMED",
    limit: 200,
  });

  // Fetch PACKED packing tasks to find SOs with fully packed tasks
  const { data: packingData, isLoading: isLoadingPackings } = usePackingTasks({
    status: "PACKED",
    limit: 200,
  });

  // Fetch existing shipments to exclude SOs that already have one
  const { data: shipmentData, isLoading: isLoadingShipments } = useShipments({
    limit: 200,
  });

  // Build a Set of Sales Order IDs that already have a Shipment
  const salesOrderIdsWithShipment = useMemo(() => {
    const shipments = shipmentData?.data ?? [];
    return new Set(shipments.map((s) => s.salesOrderId));
  }, [shipmentData?.data]);

  // Build a Set of Sales Order IDs that have a PACKED PackingTask
  const salesOrderIdsWithPackedTask = useMemo(() => {
    const tasks = packingData?.data ?? [];
    return new Set(tasks.map((t) => t.salesOrderId));
  }, [packingData?.data]);

  // Filter: only CONFIRMED SOs that have a PACKED PackingTask and no existing Shipment
  const eligibleSalesOrders = useMemo(() => {
    const allSOs = soData?.data ?? [];
    return allSOs.filter(
      (so) =>
        salesOrderIdsWithPackedTask.has(so.id) &&
        !salesOrderIdsWithShipment.has(so.id)
    );
  }, [soData?.data, salesOrderIdsWithPackedTask, salesOrderIdsWithShipment]);

  const isLoading = isLoadingSOs || isLoadingPackings || isLoadingShipments;

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateShipmentFormValues>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      salesOrderId: "",
      shippingMethod: undefined,
      shippingAddress: "",
      shippingCity: "",
      shippingCountry: "",
      shippingPhone: "",
      carrier: "",
      trackingNumber: "",
      notes: "",
    },
  });

  const selectedSalesOrderId = watch("salesOrderId");

  const selectedSO = useMemo(
    () => eligibleSalesOrders.find((so) => so.id === selectedSalesOrderId),
    [eligibleSalesOrders, selectedSalesOrderId]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const onSubmit = async (values: CreateShipmentFormValues) => {
    setErrorMessage(null);
    try {
      await createMutation.mutateAsync({
        salesOrderId: values.salesOrderId,
        shippingMethod: values.shippingMethod,
        shippingAddress: values.shippingAddress,
        shippingCity: values.shippingCity,
        shippingCountry: values.shippingCountry,
        shippingPhone: values.shippingPhone,
        carrier: values.carrier || undefined,
        trackingNumber: values.trackingNumber || undefined,
        notes: values.notes || undefined,
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------
  const handleClose = () => {
    reset();
    setErrorMessage(null);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Shipment"
      description="Create a new shipment from a fully packed sales order."
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sales Order Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Sales Order <span className="text-red-500">*</span>
          </label>
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading eligible sales orders...</span>
            </div>
          ) : (
            <select
              {...register("salesOrderId")}
              disabled={createMutation.isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
            >
              <option value="">-- Select Sales Order --</option>
              {eligibleSalesOrders.map((so) => (
                <option key={so.id} value={so.id}>
                  {so.orderNumber} ({so.warehouse?.name ?? "N/A"}) —{" "}
                  {formatCurrency(so.totalAmount)}
                </option>
              ))}
            </select>
          )}
          {errors.salesOrderId && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.salesOrderId.message}
            </p>
          )}
          {eligibleSalesOrders.length === 0 && !isLoading && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {soData?.data && soData.data.length > 0
                ? "No confirmed sales orders are fully packed and ready for shipment."
                : "No eligible sales orders available for shipment."}
            </p>
          )}
        </div>

        {/* Selected Order Context */}
        {selectedSO && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Order Number
                </span>
                <p className="font-mono font-medium text-slate-900 dark:text-white">
                  {selectedSO.orderNumber}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Warehouse
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSO.warehouse?.name ?? "\u2014"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Total Amount
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(selectedSO.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Items
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSO.items?.length ?? 0}{" "}
                  {(selectedSO.items?.length ?? 0) === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Method */}
        <div className="space-y-1.5">
          <label
            htmlFor="shippingMethod"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Shipping Method <span className="text-red-500">*</span>
          </label>
          <select
            id="shippingMethod"
            {...register("shippingMethod")}
            disabled={createMutation.isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
          >
            <option value="">-- Select Method --</option>
            {SHIPPING_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.shippingMethod && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.shippingMethod.message}
            </p>
          )}
        </div>

        {/* Shipping Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="shippingAddress"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Shipping Address <span className="text-red-500">*</span>
          </label>
          <input
            id="shippingAddress"
            type="text"
            placeholder="e.g. 123 Main Street"
            disabled={createMutation.isPending}
            {...register("shippingAddress")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.shippingAddress && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.shippingAddress.message}
            </p>
          )}
        </div>

        {/* City + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="shippingCity"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="shippingCity"
              type="text"
              placeholder="e.g. New York"
              disabled={createMutation.isPending}
              {...register("shippingCity")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            {errors.shippingCity && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.shippingCity.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="shippingCountry"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Country <span className="text-red-500">*</span>
            </label>
            <input
              id="shippingCountry"
              type="text"
              placeholder="e.g. USA"
              disabled={createMutation.isPending}
              {...register("shippingCountry")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            {errors.shippingCountry && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.shippingCountry.message}
              </p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label
            htmlFor="shippingPhone"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="shippingPhone"
            type="text"
            placeholder="e.g. +1 (555) 123-4567"
            disabled={createMutation.isPending}
            {...register("shippingPhone")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.shippingPhone && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.shippingPhone.message}
            </p>
          )}
        </div>

        {/* Carrier + Tracking Number (Optional) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="carrier"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Carrier{" "}
              <span className="font-normal text-slate-500">(Optional)</span>
            </label>
            <input
              id="carrier"
              type="text"
              placeholder="e.g. FedEx"
              disabled={createMutation.isPending}
              {...register("carrier")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="trackingNumber"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Tracking Number{" "}
              <span className="font-normal text-slate-500">(Optional)</span>
            </label>
            <input
              id="trackingNumber"
              type="text"
              placeholder="e.g. 1Z999AA10123456784"
              disabled={createMutation.isPending}
              {...register("trackingNumber")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label
            htmlFor="notes"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Notes{" "}
            <span className="font-normal text-slate-500">(Optional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder="Additional shipping notes..."
            disabled={createMutation.isPending}
            {...register("notes")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={
              createMutation.isPending || eligibleSalesOrders.length === 0
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Create Shipment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
