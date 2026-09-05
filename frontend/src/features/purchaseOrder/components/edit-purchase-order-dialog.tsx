"use client";

import { useUpdatePurchaseOrder } from "../purchase-order.hooks";
import {
  UpdatePurchaseOrderPayload,
  PurchaseOrder,
} from "../purchase-order.types";
import { PurchaseOrderForm } from "./purchase-order-form";
import { Modal } from "@/components/shared/modal";

interface EditPurchaseOrderDialogProps {
  purchaseOrder: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (po: PurchaseOrder) => void;
}

export function EditPurchaseOrderDialog({
  purchaseOrder,
  isOpen,
  onClose,
  onSuccess,
}: EditPurchaseOrderDialogProps) {
  const updateMutation = useUpdatePurchaseOrder();

  const handleSubmit = async (
    values: UpdatePurchaseOrderPayload
  ) => {
    if (!purchaseOrder) return;
    const result = await updateMutation.mutateAsync({
      id: purchaseOrder.id,
      payload: values,
    });
    onSuccess?.(result.data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        purchaseOrder
          ? `Edit ${purchaseOrder.poNumber}`
          : "Edit Purchase Order"
      }
      description="Update purchase order details. Only PENDING orders can be edited."
      maxWidthClass="max-w-2xl"
    >
      <PurchaseOrderForm
        mode="edit"
        initialData={purchaseOrder}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isPending={updateMutation.isPending}
      />
    </Modal>
  );
}
