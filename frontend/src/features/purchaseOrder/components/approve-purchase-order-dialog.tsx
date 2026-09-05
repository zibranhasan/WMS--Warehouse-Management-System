"use client";

import { useApprovePurchaseOrder } from "../purchase-order.hooks";
import { PurchaseOrder } from "../purchase-order.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CheckCircle } from "lucide-react";

interface ApprovePurchaseOrderDialogProps {
  purchaseOrder: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (po: PurchaseOrder) => void;
}

export function ApprovePurchaseOrderDialog({
  purchaseOrder,
  isOpen,
  onClose,
  onSuccess,
}: ApprovePurchaseOrderDialogProps) {
  const approveMutation = useApprovePurchaseOrder();

  const handleConfirm = async () => {
    if (!purchaseOrder) return;
    const result = await approveMutation.mutateAsync(purchaseOrder.id);
    onSuccess?.(result.data);
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Purchase Order"
      subtitle={purchaseOrder?.poNumber}
      description={
        <p>
          Are you sure you want to approve this purchase order? This will mark it
          as <span className="font-semibold">APPROVED</span> and make it eligible
          for goods receiving.
        </p>
      }
      confirmLabel="Approve Order"
      onConfirm={handleConfirm}
      isPending={approveMutation.isPending}
      variant="primary"
      icon={CheckCircle}
    />
  );
}
