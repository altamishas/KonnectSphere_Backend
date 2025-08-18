import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upload, X, File, Image as ImageIcon, AlertCircle } from "lucide-react";
import { uploadService } from "@/services/uploadService";
import { UploadResponse } from "@/lib/types";
import Image from "next/image";

interface FileUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  type?: "image" | "document" | "video" | "any";
  placeholder?: string;
  description?: string;
  preview?: boolean;
  className?: string;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  value,
  onChange,
  onRemove,
  accept,
  maxSize = 10,
  type = "any",
  placeholder,
  description,
  preview = true,
  className,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedTypes = () => {
    if (accept) return accept;

    switch (type) {
      case "image":
        return "image/*";
      case "document":
        return ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
      case "video":
        return "video/*";
      default:
        return "*/*";
    }
  };

  const handleFileSelect = async (file: File) => {
    if (disabled) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let uploadResult: UploadResponse;

      switch (type) {
        case "image":
          uploadResult = await uploadService.uploadImage(
            file,
            setUploadProgress
          );
          break;
        case "document":
          uploadResult = await uploadService.uploadDocument(
            file,
            setUploadProgress
          );
          break;
        case "video":
          uploadResult = await uploadService.uploadVideo(
            file,
            setUploadProgress
          );
          break;
        default:
          uploadResult = await uploadService.uploadFile(
            file,
            {
              maxSize: maxSize * 1024 * 1024,
            },
            setUploadProgress
          );
          break;
      }

      if (uploadResult.success && uploadResult.url) {
        onChange(uploadResult.url);
      } else {
        setError(uploadResult.error || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange("");
    }
    setError(null);
  };

  const renderPreview = () => {
    if (!value || !preview) return null;

    if (type === "image") {
      return (
        <div className="relative w-full max-w-xs">
          <div className="absolute -top-2 -right-2 z-10">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Image
            src={value} // Path to the image or URL
            alt="Preview"
            className="object-contain max-h-48 w-full rounded-lg"
            width={500} // Set a fixed width for the image
            height={500} // Set a fixed height for the image
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <File className="h-5 w-5 text-slate-500" />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            File uploaded successfully
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (value && preview) {
    return renderPreview();
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          {
            "border-primary bg-primary/5": isDragging,
            "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50":
              !isDragging && !disabled,
            "border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50":
              disabled,
            "border-red-300 bg-red-50 dark:bg-red-900/10": error,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="w-full max-w-xs space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Upload className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Uploading... {Math.round(uploadProgress)}%
              </p>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                error
                  ? "bg-red-100 dark:bg-red-900/20"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              {error ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : type === "image" ? (
                <ImageIcon className="h-8 w-8 text-slate-400" />
              ) : (
                <Upload className="h-8 w-8 text-slate-400" />
              )}
            </div>

            {error ? (
              <div className="text-center">
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                  {error}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  disabled={disabled}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 text-center">
                  {placeholder ||
                    `Drag and drop your ${type} here, or click to browse`}
                </p>
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                    {description}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
