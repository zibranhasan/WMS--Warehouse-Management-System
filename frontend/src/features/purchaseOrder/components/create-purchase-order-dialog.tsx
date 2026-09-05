"use client";

import { useCreatePurchaseOrder } from "../purchase-order.hooks";
import {
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
  PurchaseOrder,
} from "../purchase-order.types";
import { PurchaseOrderForm } from "./purchase-order-form";
import { Modal } from "@/components/shared/modal";

interface CreatePurchaseOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (po: PurchaseOrder) => void;
}

export function CreatePurchaseOrderDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreatePurchaseOrderDialogProps) {
  const createMutation = useCreatePurchaseOrder();

  const handleSubmit = async (
    values: CreatePurchaseOrderPayload | UpdatePurchaseOrderPayload
  ) => {
    const result = await createMutation.mutateAsync(
      values as CreatePurchaseOrderPayload
    );
    onSuccess?.(result.data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      description="Create a new inbound purchase order for supplier fulfillment."
      maxWidthClass="max-w-2xl"
    >
      <PurchaseOrderForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={onClose}
        isPending={createMutation.isPending}
      />
    </Modal>
  );
}
