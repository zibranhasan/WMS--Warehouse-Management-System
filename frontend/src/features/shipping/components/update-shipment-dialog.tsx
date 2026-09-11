"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateShipment } from "../shipping.hooks";
import { Shipment } from "../shipping.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2, Truck } from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const updateShipmentSchema = z.object({
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

type UpdateShipmentFormValues = z.infer<typeof updateShipmentSchema>;

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
interface UpdateShipmentDialogProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function UpdateShipmentDialog({
  shipment,
  isOpen,
  onClose,
  onSuccess,
}: UpdateShipmentDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateMutation = useUpdateShipment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateShipmentFormValues>({
    resolver: zodResolver(updateShipmentSchema),
    defaultValues: {
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

  // Reset form when shipment changes or dialog opens
  useEffect(() => {
    if (isOpen && shipment) {
      reset({
        shippingMethod: shipment.shippingMethod,
        shippingAddress: shipment.shippingAddress,
        shippingCity: shipment.shippingCity,
        shippingCountry: shipment.shippingCountry,
        shippingPhone: shipment.shippingPhone,
        carrier: shipment.carrier ?? "",
        trackingNumber: shipment.trackingNumber ?? "",
        notes: shipment.notes ?? "",
      });
      setErrorMessage(null);
    }
  }, [isOpen, shipment, reset]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const onSubmit = async (values: UpdateShipmentFormValues) => {
    if (!shipment) return;
    setErrorMessage(null);
    try {
      await updateMutation.mutateAsync({
        id: shipment.id,
        payload: {
          shippingMethod: values.shippingMethod,
          shippingAddress: values.shippingAddress,
          shippingCity: values.shippingCity,
          shippingCountry: values.shippingCountry,
          shippingPhone: values.shippingPhone,
          carrier: values.carrier || undefined,
          trackingNumber: values.trackingNumber || undefined,
          notes: values.notes || undefined,
        },
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
      title={
        shipment
          ? `Edit ${shipment.shipmentNumber}`
          : "Edit Shipment"
      }
      description="Update shipment details. Only READY shipments can be edited."
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Immutable Info */}
        {shipment && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Shipment Number
                </span>
                <p className="flex items-center gap-1.5 font-mono font-medium text-slate-900 dark:text-white">
                  <Truck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {shipment.shipmentNumber}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Sales Order
                </span>
                <p className="font-mono font-medium text-slate-900 dark:text-white">
                  {shipment.salesOrder?.orderNumber ?? shipment.salesOrderId}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Warehouse
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {shipment.warehouse?.name ?? "\u2014"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Status
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {shipment.status}
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
            disabled={updateMutation.isPending}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
          >
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
            disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
