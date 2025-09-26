"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label?: string;
  accept?: string;
  currentImage?: string | null;
  onImageChange?: (file: File | null, preview: string | null) => void;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function FileUpload({
  label = "Upload Image",
  accept = "image/*",
  currentImage,
  onImageChange,
  className,
  size = "lg"
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24", 
    lg: "h-32 w-32",
    xl: "h-40 w-40"
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onImageChange?.(file, result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(currentImage || null);
      onImageChange?.(null, null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange?.(null, null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label>{label}</Label>
      
      <div className="flex items-center space-x-4">
        {/* Avatar Preview */}
        <Avatar className={cn(sizeClasses[size], "border-2 border-dashed border-muted-foreground/25")}>
          {preview ? (
            <AvatarImage src={preview} alt="Preview" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop an image here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>

          {/* Hidden File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
            
            {preview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
