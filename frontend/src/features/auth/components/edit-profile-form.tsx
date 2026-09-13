"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import {
  updateMyProfileSchema,
  UpdateMyProfileSchemaType,
} from "../auth.schema";
import { useUpdateMyProfile, useCurrentUser, authKeys } from "../auth.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/api-error";
import { User as UserType } from "../auth.types";

interface EditProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
}

export function EditProfileForm({
  isOpen,
  onClose,
  user,
}: EditProfileFormProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateMyProfile();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateMyProfileSchemaType>({
    resolver: zodResolver(updateMyProfileSchema),
    values: {
      name: user.name,
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSuccessMessage(null);
    reset({ name: user.name });
    onClose();
  };

  const onSubmit = async (data: UpdateMyProfileSchemaType) => {
    setSuccessMessage(null);

    const formData = new FormData();
    if (data.name !== undefined) {
      formData.append("name", data.name.trim());
    }
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    if (Array.from(formData.keys()).length === 0) {
      handleClose();
      return;
    }

    try {
      await updateMutation.mutateAsync(formData);
      setSuccessMessage("Profile updated successfully.");

      await queryClient.invalidateQueries({
        queryKey: authKeys.currentUser(),
      });

      setTimeout(() => {
        handleClose();
      }, 800);
    } catch {
      // Error handled below
    }
  };

  const getErrorMessage = (): string | null => {
    if (!updateMutation.error) return null;
    if (updateMutation.error instanceof ApiError) {
      return updateMutation.error.message;
    }
    return (
      updateMutation.error.message ||
      "An unexpected error occurred while updating profile"
    );
  };

  const serverError = getErrorMessage();
  const isBusy = updateMutation.isPending;
  const activePreview = previewUrl || user.image;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Profile"
      description="Update your name and profile image."
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1 font-medium">{serverError}</div>
          </div>
        )}

        {successMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Profile Image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Profile Image
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isBusy}
            className="hidden"
            id="profile-image-input"
          />

          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              {activePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activePreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {activePreview ? "Change Image" : "Upload Image"}
                </Button>

                {(selectedFile || previewUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isBusy}
                    onClick={handleRemoveFile}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                JPG, PNG, WEBP, GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Full Name
          </label>
          <Input
            id="name"
            placeholder="Enter your name"
            disabled={isBusy}
            aria-invalid={errors.name ? "true" : "false"}
            {...register("name")}
            className={
              errors.name
                ? "border-red-500 focus-visible:ring-red-500/20"
                : ""
            }
          />
          {errors.name && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isBusy}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isBusy ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
