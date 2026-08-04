"use client";

import { useState } from "react";
import {
  formatBytes,
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from "@/hooks/use-file-upload";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  TriangleAlert,
  Upload,
  XIcon,
  ZoomInIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface GalleryUploadProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
  initialFiles?: FileMetadata[];
  onFilesChange?: (files: FileWithPreview[]) => void;
}

export default function GalleryUpload({
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = "image/*",
  multiple = true,
  className,
  initialFiles = [],
  onFilesChange,
}: GalleryUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [
    { files, isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles,
    onFilesChange,
  });

  const isImage = (file: File | FileMetadata) => {
    const type = file instanceof File ? file.type : file.type;
    return type.startsWith("image/");
  };

  return (
    <div className={cn("w-full max-w-4xl", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative rounded-lg border border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input {...getInputProps()} className="sr-only" />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              isDragging ? "bg-primary/10" : "bg-muted",
            )}
          >
            <ImageIcon
              className={cn(
                "h-5 w-5",
                isDragging ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload images to gallery</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop images here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to {formatBytes(maxSize)} each (max {maxFiles}{" "}
              files)
            </p>
          </div>

          <Button type="button" variant={"outline"} onClick={openFileDialog}>
            <Upload className="h-4 w-4" />
            Select images
          </Button>
        </div>
      </div>

      {/* Gallery Stats */}
      {files.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-medium">
              Gallery ({files.length}/{maxFiles})
            </h4>
            <div className="text-xs text-muted-foreground">
              Total:{" "}
              {formatBytes(
                files.reduce((acc, file) => acc + file.file.size, 0),
              )}
            </div>
          </div>
          <Button type="button" onClick={clearFiles} variant="outline" size="sm">
            Clear all
          </Button>
        </div>
      )}

      {/* Image Grid */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {files.map((fileItem) => (
            <div key={fileItem.id} className="group relative aspect-square">
              {isImage(fileItem.file) && fileItem.preview ? (
                <Image
                  src={fileItem.preview}
                  alt={fileItem.file.name}
                  width={200}
                  height={200}
                  className="h-full w-full rounded-lg border object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {/* View Button */}
                {fileItem.preview && (
                  <Button
                    type="button"
                    onClick={() => setSelectedImage(fileItem.preview!)}
                    variant="secondary"
                    size="icon"
                    className="size-7"
                  >
                    <ZoomInIcon className="opacity-100/80" />
                  </Button>
                )}

                {/* Remove Button */}
                <Button
                  type="button"
                  onClick={() => removeFile(fileItem.id)}
                  variant="secondary"
                  size="icon"
                  className="size-7"
                >
                  <XIcon className="opacity-100/80" />
                </Button>
              </div>

              {/* File Info */}
              {/* <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/70 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs font-medium">
                  {fileItem.file.name}
                </p>
                <p className="text-xs text-gray-300">
                  {formatBytes(fileItem.file.size)}
                </p>
              </div> */}
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" appearance="light" className="mt-5">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>File upload error(s)</AlertTitle>
            <AlertDescription>
              {errors.map((error, index) => (
                <p key={index} className="last:mb-0">
                  {error}
                </p>
              ))}
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            <Image
              src={selectedImage}
              alt="Preview"
              width={200}
              height={200}
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              type="button"
              onClick={() => setSelectedImage(null)}
              variant="secondary"
              size="icon"
              className="absolute end-2 top-2 size-7 p-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
