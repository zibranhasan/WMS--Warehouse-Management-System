"use client";

import { useCreateSalesOrder } from "../sales-order.hooks";
import { CreateSalesOrderPayload, SalesOrder } from "../sales-order.types";
import { SalesOrderForm } from "./sales-order-form";
import { Modal } from "@/components/shared/modal";

interface CreateSalesOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (so: SalesOrder) => void;
}

export function CreateSalesOrderDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateSalesOrderDialogProps) {
  const createMutation = useCreateSalesOrder();

  const handleSubmit = async (values: CreateSalesOrderPayload) => {
    const result = await createMutation.mutateAsync(values);
    onSuccess?.(result.data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sales Order"
      description="Create a new outbound sales order for customer fulfillment."
      maxWidthClass="max-w-2xl"
    >
      <SalesOrderForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isPending={createMutation.isPending}
      />
    </Modal>
  );
}
