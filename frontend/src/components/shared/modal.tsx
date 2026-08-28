"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidthClass?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidthClass = "max-w-lg",
}: ModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      className={className}
      maxWidthClass={maxWidthClass}
    >
      {children}
    </Dialog>
  );
}
