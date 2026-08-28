"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, RotateCcw, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onFileChange: (file: File | null) => void;
  onRemoveImage: (remove: boolean) => void;
  disabled?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  onFileChange,
  onRemoveImage,
  disabled = false,
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemoved, setIsRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      setIsRemoved(false);
      onRemoveImage(false);
      onFileChange(file);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleRemove = () => {
    if (selectedFile) {
      setSelectedFile(null);
      setPreviewUrl(null);
      onFileChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else if (currentImageUrl) {
      setIsRemoved(true);
      onRemoveImage(true);
      onFileChange(null);
    }
  };

  const handleUndoRemove = () => {
    setIsRemoved(false);
    onRemoveImage(false);
  };

  const activePreview = previewUrl || (!isRemoved ? currentImageUrl : null);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        Product Image <span className="font-normal text-slate-500">(Optional)</span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        id="product-image-input"
      />

      <div className="flex items-center gap-4">
        {/* Preview box */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          {activePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activePreview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10px]">No image</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2">
          {!isRemoved && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {activePreview ? "Change Image" : "Upload Image"}
              </Button>

              {activePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={handleRemove}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
          )}

          {isRemoved && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <span>Image will be removed on save.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndoRemove}
                disabled={disabled}
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Undo
              </Button>
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Supports JPG, PNG, WEBP, GIF formats.
          </p>
        </div>
      </div>
    </div>
  );
}
