import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, Upload as UploadIcon, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { uploadApi } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Step = "upload" | "processing" | "done";

export default function Upload() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [detectedMapping, setDetectedMapping] = useState<Record<string, string> | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; rowCount: number } | null>(null);

  const handleFileAccepted = async (file: File) => {
    // Client-side validation
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Only CSV files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setStep("processing");

    try {
      const result = await uploadApi.uploadFile(file);
      setUploadedFile({
        name: result.original_name,
        size: file.size,
        rowCount: result.row_count,
      });
      setDetectedMapping(result.col_map || null);
      setStep("done");
      toast.success("File uploaded & analyzed successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(errorMsg);
      setStep("upload");
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const steps = [
    { key: "upload", label: "Upload CSV", num: 1 },
    { key: "processing", label: "Auto-Detect", num: 2 },
    { key: "done", label: "Ready", num: 3 },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  const fieldLabels: Record<string, string> = {
    date: "📅 Date",
    quantity: "📦 Quantity",
    total: "💰 Revenue",
    city: "🏙️ City / Region",
    category: "🏷️ Category",
    cogs: "📊 Cost of Goods",
    gross_income: "💵 Gross Income",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <UploadIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Upload Your Data</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Upload a sales CSV — columns are detected automatically
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 sm:gap-4">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`
              flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors
              ${i <= currentStepIdx
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground"
              }
            `}>
              {i < currentStepIdx ? "✓" : s.num}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${
              i <= currentStepIdx ? "text-foreground" : "text-muted-foreground"
            }`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 ${i < currentStepIdx ? "bg-blue-600" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content Card */}
      <div className="rounded-2xl bg-card p-5 sm:p-8 shadow-card border border-border">
        {step === "upload" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              Upload your CSV file
            </h3>
            <p className="text-sm text-muted-foreground">
              Just drop your sales CSV here — our AI will automatically detect columns like Date, Quantity, Revenue, Category, and more.
            </p>
            <FileDropzone
              onFileAccepted={handleFileAccepted}
              isUploading={isUploading}
              error={uploadError}
            />
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center text-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h3 className="text-xl font-bold text-foreground">Analyzing Your Data...</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Uploading file, detecting columns, and preparing your analytics dashboard.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">All Set!</h3>
              <p className="text-sm text-muted-foreground">
                {uploadedFile && (
                  <span className="font-medium text-foreground">{uploadedFile.name}</span>
                )}
                {uploadedFile && ` • ${uploadedFile.rowCount.toLocaleString()} rows`}
              </p>
            </div>

            {/* Auto-Detected Columns */}
            {detectedMapping && Object.keys(detectedMapping).length > 0 && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm font-semibold text-blue-800 mb-3">
                  🧠 Auto-Detected Column Mapping
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(detectedMapping).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600 font-medium min-w-[130px]">
                        {fieldLabels[key] || key}
                      </span>
                      <ArrowRight className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="text-blue-900 font-mono text-xs bg-white px-2 py-0.5 rounded border border-blue-200 truncate">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Your data is ready. Click below to view your analytics dashboard.
            </p>

            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
