import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  isUploading: boolean;
  uploadedFile?: { name: string; size: number; rowCount: number } | null;
  error?: string | null;
}

export function FileDropzone({ onFileAccepted, isUploading, uploadedFile, error }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Already uploaded — show success
  if (uploadedFile) {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 sm:p-8">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">File Uploaded Successfully</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm text-green-700">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {uploadedFile.name}
              </span>
              <span>•</span>
              <span>{formatSize(uploadedFile.size)}</span>
              <span>•</span>
              <span>{uploadedFile.rowCount.toLocaleString()} rows</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor="csv-upload"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed
          p-8 sm:p-12 cursor-pointer transition-all duration-200
          ${isDragOver
            ? "border-blue-400 bg-blue-50 scale-[1.01]"
            : "border-border bg-card hover:border-blue-300 hover:bg-blue-50/50"
          }
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
          isDragOver ? "bg-blue-100" : "bg-muted"
        }`}>
          <Upload className={`h-7 w-7 ${isDragOver ? "text-blue-600" : "text-muted-foreground"}`} />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {isUploading ? "Uploading…" : "Drag & drop your CSV file here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or <span className="text-blue-600 font-medium">click to browse</span>
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Accepted: .csv files only • Max size: 10MB
          </p>
        </div>

        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
          disabled={isUploading}
        />
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
