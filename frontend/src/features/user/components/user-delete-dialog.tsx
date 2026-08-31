"use client";

import { User } from "../user.types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface UserDeleteDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  currentUserId?: string;
}

export function UserDeleteDialog({
  user,
  isOpen,
  onClose,
  onConfirm,
  isPending,
  currentUserId,
}: UserDeleteDialogProps) {
  if (!user) return null;

  const isSelf = currentUserId === user.id;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete User "${user.name}"?`}
      description={
        isSelf
          ? "You cannot delete your own account."
          : `Are you sure you want to delete user account "${user.email}"? This will soft-delete the user and revoke their active login sessions.`
      }
      confirmLabel="Delete User"
      cancelLabel="Cancel"
      variant="destructive"
      isPending={isPending}
    />
  );
}
