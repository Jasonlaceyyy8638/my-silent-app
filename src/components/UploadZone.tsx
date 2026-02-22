"use client";

import { useCallback, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";

type UploadZoneProps = {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
};

export function UploadZone({ onFileSelect, isUploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file?.type === "application/pdf") onFileSelect(file);
      e.target.value = "";
    },
    [onFileSelect]
  );

  return (
    <label
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12
        transition-colors cursor-pointer
        ${isDragging ? "border-teal-accent/60 bg-teal-accent/10" : "border-white/20 hover:border-teal-accent/40 bg-white/5"}
        ${isUploading ? "pointer-events-none opacity-70" : ""}
      `}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />
      {isUploading ? (
        <Loader2 className="h-12 w-12 text-teal-accent animate-spin" />
      ) : (
        <FileUp className="h-12 w-12 text-teal-accent/90" />
      )}
      <span className="text-slate-300 text-center text-sm">
        {isUploading
          ? "Extracting data…"
          : "Drag & drop a PDF invoice here, or click to browse"}
      </span>
    </label>
  );
}
