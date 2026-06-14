"use client";

import { useId } from "react";
import { FileText, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FileUploadMockProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (fileName: string) => void;
  error?: string;
  hint?: string;
}

/**
 * Selector de archivo simulado: no sube nada a ningún servidor, solo
 * guarda y muestra el nombre del archivo elegido por el usuario.
 */
export function FileUploadMock({
  label,
  required,
  value,
  onChange,
  error,
  hint,
}: FileUploadMockProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>
        {label}
        {required && <span className="text-primary">*</span>}
      </Label>

      <label
        htmlFor={inputId}
        className={cn(
          "border-input hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors",
          error && "border-destructive",
        )}
      >
        {value ? (
          <FileText className="text-primary size-4 shrink-0" />
        ) : (
          <Upload className="text-muted-foreground size-4 shrink-0" />
        )}
        <span
          className={cn(
            "flex-1 truncate",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {value || "Seleccionar archivo..."}
        </span>
        <span className="text-primary text-xs font-medium whitespace-nowrap">
          Elegir
        </span>
        <input
          id={inputId}
          type="file"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            onChange(file ? file.name : "");
          }}
        />
      </label>

      {hint && !error && (
        <p className="text-muted-foreground text-xs">{hint}</p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
