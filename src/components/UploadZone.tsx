"use client";

import { useCallback, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";

type UploadZoneProps = {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  disabled?: boolean;
  /** When disabled due to credits, show this instead of the default drop message. */
  disabledLabel?: string;
  /** When disabled, clicking the zone calls this (e.g. open upgrade modal) instead of doing nothing. */
  onDisabledClick?: () => void;
};

export function UploadZone({ onFileSelect, isUploading, disabled = false, disabledLabel, onDisabledClick }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") onFileSelect(file);
    },
    [onFileSelect, disabled]
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
      if (disabled) return;
      const file = e.target.files?.[0];
      if (file?.type === "application/pdf") onFileSelect(file);
      e.target.value = "";
    },
    [onFileSelect, disabled]
  );

  const isDisabled = isUploading || disabled;
  const allowDisabledClick = disabled && !isUploading && onDisabledClick;

  const handleLabelClick = useCallback(
    (e: React.MouseEvent) => {
      if (allowDisabledClick) {
        e.preventDefault();
        onDisabledClick?.();
      }
    },
    [allowDisabledClick, onDisabledClick]
  );

  return (
    <label
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleLabelClick}
      className={`
        flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12
        transition-colors
        ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
        ${isDragging && !isDisabled ? "border-teal-accent/60 bg-teal-accent/10" : "border-white/20 hover:border-teal-accent/40 bg-white/5"}
        ${isUploading ? "pointer-events-none" : ""}
        ${disabled && !isUploading && !onDisabledClick ? "pointer-events-none" : ""}
      `}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="hidden"
        disabled={isDisabled}
      />
      {isUploading ? (
        <Loader2 className="h-12 w-12 text-teal-accent animate-spin" />
      ) : (
        <FileUp className="h-12 w-12 text-teal-accent/90" />
      )}
      <span className="text-slate-300 text-center text-sm">
        {isUploading
          ? "Extracting data…"
          : disabled && disabledLabel
            ? disabledLabel
            : "Drop any PDF here—Invoices, Contracts, Records, or Quotes."}
      </span>
      <span className="text-slate-500 text-center text-xs max-w-sm">
        Enterprise note: Documents over 5 pages utilize 1 credit per 5-page block.
      </span>
    </label>
  );
}
