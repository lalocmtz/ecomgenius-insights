"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectFileType } from "./FileTypeMapper";
import type { FileType } from "./FileTypeMapper";
import { toast } from "sonner";

interface DetectedFile {
  file: File;
  detectedType: FileType | null;
  label: string;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
}

interface UploadZoneProps {
  brandId: string;
}

export function UploadZone({ brandId }: UploadZoneProps) {
  const [files, setFiles] = useState<DetectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: DetectedFile[] = Array.from(fileList)
      .filter((f) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))
      .map((file) => {
        const match = detectFileType(file.name);
        return {
          file,
          detectedType: match?.type ?? null,
          label: match?.label ?? "Tipo no reconocido",
          status: "pending" as const,
        };
      });

    if (newFiles.length === 0) {
      toast.error("Solo se aceptan archivos .xlsx");
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const uploadAll = useCallback(async () => {
    const uploadable = files.filter(
      (f) => f.detectedType && f.status === "pending"
    );

    if (uploadable.length === 0) {
      toast.error("No hay archivos validos para subir");
      return;
    }

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      if (!entry.detectedType || entry.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("brandId", brandId);
        formData.append("fileType", entry.detectedType);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "success" as const,
                    message: `${data.rowsProcessed} filas procesadas`,
                  }
                : f
            )
          );
          toast.success(`${entry.file.name}: ${data.rowsProcessed} filas`);
        } else {
          const errMsg = data.errors?.join(", ") || data.error || "Error";
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? { ...f, status: "error" as const, message: errMsg }
                : f
            )
          );
          toast.error(`${entry.file.name}: ${errMsg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de red";
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error" as const, message: msg } : f
          )
        );
        toast.error(`${entry.file.name}: ${msg}`);
      }
    }

    setIsUploading(false);
  }, [files, brandId]);

  const pendingCount = files.filter(
    (f) => f.detectedType && f.status === "pending"
  ).length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragging
            ? "border-[#f97316] bg-[#f97316]/10"
            : "border-[#30363d] bg-[#1c2128] hover:border-[#f97316]/50"
        }`}
      >
        <Upload className="mb-3 h-10 w-10 text-[#8b949e]" />
        <p className="text-sm font-medium text-[#e6edf3]">
          Arrastra archivos XLSX aqui o haz clic para seleccionar
        </p>
        <p className="mt-1 text-xs text-[#8b949e]">
          Se aceptan multiples archivos. El tipo se detecta automaticamente.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((entry, idx) => (
            <div
              key={`${entry.file.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-[#30363d] bg-[#1c2128] px-4 py-3"
            >
              <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#e6edf3]">
                  {entry.file.name}
                </p>
                <p
                  className={`text-xs ${
                    entry.detectedType
                      ? "text-[#f97316]"
                      : "text-red-400"
                  }`}
                >
                  {entry.label}
                </p>
                {entry.message && (
                  <p className="text-xs text-[#8b949e]">{entry.message}</p>
                )}
              </div>
              <div className="shrink-0">
                {entry.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#f97316]" />
                )}
                {entry.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {entry.status === "error" && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {entry.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-xs text-[#8b949e] hover:text-red-400"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ))}

          {pendingCount > 0 && (
            <Button
              onClick={uploadAll}
              disabled={isUploading}
              className="w-full bg-[#f97316] text-white hover:bg-[#ea580c]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                `Subir ${pendingCount} archivo${pendingCount > 1 ? "s" : ""}`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
