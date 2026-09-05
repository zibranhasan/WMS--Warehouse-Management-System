"use client";

import { useState, useMemo } from "react";
import { useReceivePurchaseOrder } from "../purchase-order.hooks";
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "../purchase-order.types";
import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2, Truck } from "lucide-react";

interface ReceiveItemState {
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remaining: number;
  inputQty: string;
}

interface ReceivePurchaseOrderDialogProps {
  purchaseOrder: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (po: PurchaseOrder) => void;
}

export function ReceivePurchaseOrderDialog({
  purchaseOrder,
  isOpen,
  onClose,
  onSuccess,
}: ReceivePurchaseOrderDialogProps) {
  const receiveMutation = useReceivePurchaseOrder();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiveItemState[]>([]);

  // Build receive items state when PO changes
  useMemo(() => {
    if (!purchaseOrder) return;
    const receiveItems: ReceiveItemState[] = (
      purchaseOrder.items || []
    ).map((item: PurchaseOrderItem) => {
      const ordered = Number(item.orderedQuantity) || 0;
      const received = Number(item.receivedQuantity) || 0;
      const remaining = ordered - received;
      return {
        productId: item.productId,
        orderedQuantity: ordered,
        receivedQuantity: received,
        remaining,
        inputQty: remaining > 0 ? "" : "0",
      };
    });
    setItems(receiveItems);
  }, [purchaseOrder?.id]);

  const handleClose = () => {
    setItems([]);
    setErrorMessage(null);
    onClose();
  };

  const handleInputChange = (productId: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, inputQty: value } : item
      )
    );
  };

  const handleSetMax = (productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, inputQty: String(item.remaining) }
          : item
      )
    );
  };

  // Validation
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    let hasAnyQty = false;

    for (const item of items) {
      const qty = Number(item.inputQty);
      if (item.inputQty === "" || item.inputQty === undefined) continue;
      if (qty < 0) {
        errors[item.productId] = "Cannot be negative.";
      } else if (qty > item.remaining) {
        errors[item.productId] = `Cannot exceed remaining ${item.remaining}.`;
      } else if (qty > 0) {
        hasAnyQty = true;
      }
    }

    if (
      Object.keys(errors).length === 0 &&
      items.length > 0 &&
      !hasAnyQty &&
      items.every((i) => i.inputQty === "" || i.inputQty === "0")
    ) {
      return { _form: "Enter at least one quantity to receive." };
    }

    return errors;
  }, [items]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const allItemsFullyReceived = items.every((i) => i.remaining <= 0);

  const handleSubmit = async () => {
    if (!purchaseOrder) return;
    setErrorMessage(null);

    const receiveItems = items
      .filter((item) => {
        const qty = Number(item.inputQty);
        return item.inputQty !== "" && qty > 0;
      })
      .map((item) => ({
        productId: item.productId,
        receivedQuantity: Number(item.inputQty),
      }));

    if (receiveItems.length === 0) {
      setErrorMessage("Enter at least one quantity to receive.");
      return;
    }

    try {
      const result = await receiveMutation.mutateAsync({
        id: purchaseOrder.id,
        payload: { items: receiveItems },
      });
      onSuccess?.(result.data.purchaseOrder);
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An error occurred while receiving goods.");
      }
    }
  };

  if (!purchaseOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Receive Goods"
      description={purchaseOrder.poNumber}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Header Icon */}
        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Receive Goods
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {purchaseOrder.poNumber} — {purchaseOrder.supplier?.name}
            </p>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Fully received banner */}
        {allItemsFullyReceived && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            All items in this purchase order have been fully received.
          </div>
        )}

        {/* Items Table */}
        {!allItemsFullyReceived && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <th className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                    Product
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Ordered
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Received
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Remaining
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                    Receive Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => {
                  const hasError =
                    validationErrors[item.productId] !== undefined;
                  return (
                    <tr
                      key={item.productId}
                      className="bg-white dark:bg-slate-950"
                    >
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {purchaseOrder.items?.find(
                            (i) => i.productId === item.productId
                          )?.product?.name || item.productId}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">
                        {item.orderedQuantity}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">
                        {item.receivedQuantity}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                        {item.remaining}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {item.remaining > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={item.remaining}
                              value={item.inputQty}
                              onChange={(e) =>
                                handleInputChange(item.productId, e.target.value)
                              }
                              disabled={receiveMutation.isPending}
                              placeholder="0"
                              className={`w-20 rounded-md border px-2 py-1 text-right text-xs outline-none transition disabled:opacity-50 dark:bg-slate-900 dark:text-white ${
                                hasError
                                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                  : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700"
                              }`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetMax(item.productId)}
                              disabled={receiveMutation.isPending}
                              className="h-7 px-1.5 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Max
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Per-item validation errors */}
        {Object.entries(validationErrors).map(([key, msg]) => {
          if (key === "_form") return null;
          return (
            <p key={key} className="text-xs text-red-600 dark:text-red-400">
              {msg}
            </p>
          );
        })}

        {/* Form-level error */}
        {validationErrors._form && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {validationErrors._form}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={receiveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={receiveMutation.isPending || hasValidationErrors || allItemsFullyReceived}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {receiveMutation.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Confirm Receiving
          </Button>
        </div>
      </div>
    </Modal>
  );
}
