"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Role,
  UserStatus,
  CreateUserPayload,
  UpdateUserPayload,
} from "../user.types";
import {
  createUserSchema,
  CreateUserFormValues,
  ROLE_VALUES,
  USER_STATUS_VALUES,
} from "../user.schema";
import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";
import { AlertCircle, Loader2 } from "lucide-react";

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function UserForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: UserFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "STAFF",
    },
  });

  // State for status edit in update mode
  const [editStatus, setEditStatus] = useState<UserStatus>(
    initialData?.status || "ACTIVE"
  );

  const handleFormSubmit = async (values: CreateUserFormValues) => {
    setErrorMessage(null);
    try {
      if (initialData) {
        // Update User mode
        const updatePayload: UpdateUserPayload = {
          name: values.name.trim(),
          role: values.role as Role,
          status: editStatus,
          image: selectedFile || undefined,
        };
        await onSubmit(updatePayload);
      } else {
        // Create User mode
        const createPayload: CreateUserPayload = {
          name: values.name.trim(),
          email: values.email.trim(),
          role: values.role as Role,
          image: selectedFile || undefined,
        };
        await onSubmit(createPayload);
      }
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


  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-1"
    >
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Image Upload */}
      <ImageUpload
        currentImageUrl={initialData?.image}
        onFileChange={(file) => setSelectedFile(file)}
        onRemoveImage={() => setSelectedFile(null)}
        disabled={isPending}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Sarah Connor"
            disabled={isPending}
            {...register("name")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {errors.name && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="e.g. sarah@company.com"
            disabled={isPending || Boolean(initialData)}
            {...register("email")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
          />
          {initialData && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              User email address cannot be modified.
            </p>
          )}
          {!initialData && errors.email && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>



      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Role Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="role"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Assigned Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            disabled={isPending}
            {...register("role")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {ROLE_VALUES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Status Field — Edit Mode Only */}
        {initialData && (
          <div className="space-y-1.5">
            <label
              htmlFor="status"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Account Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as UserStatus)}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {USER_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {initialData ? "Save Changes" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
