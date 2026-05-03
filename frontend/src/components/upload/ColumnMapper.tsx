import { useState } from "react";
import { ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColumnMapperProps {
  columns: string[];
  fileKey: string;
  onSubmit: (fileKey: string, colMap: Record<string, string>) => void;
  isSubmitting: boolean;
  error?: string | null;
}

const REQUIRED_FIELDS = [
  { key: "date", label: "Date", description: "Transaction date column", required: true },
  { key: "quantity", label: "Quantity / Sales", description: "Number of items sold", required: false },
  { key: "total", label: "Total Revenue", description: "Total amount of the transaction", required: false },
];

const OPTIONAL_FIELDS = [
  { key: "city", label: "City / Region", description: "Store location or city" },
  { key: "category", label: "Product Category", description: "Product line or category" },
  { key: "cogs", label: "Cost of Goods Sold", description: "Cost column (for profit calculation)" },
  { key: "gross_income", label: "Gross Income / Profit", description: "Profit or gross income column" },
];

export function ColumnMapper({ columns, fileKey, onSubmit, isSubmitting, error }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const canSubmit = mapping.date && (mapping.quantity || mapping.total);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(fileKey, mapping);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Map your CSV columns to the fields below. <strong>Date</strong> and at
          least one of <strong>Quantity</strong> or <strong>Total Revenue</strong> are required.
        </p>
      </div>

      {/* Required Fields */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Required Fields
        </h3>
        <div className="space-y-3">
          {REQUIRED_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-44 shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {field.label}
                  {field.key === "date" && <span className="text-destructive ml-1">*</span>}
                </p>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <select
                value={mapping[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select column —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Fields */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Optional Fields
        </h3>
        <div className="space-y-3">
          {OPTIONAL_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-44 shrink-0">
                <p className="text-sm font-medium text-foreground">{field.label}</p>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <select
                value={mapping[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— None —</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!canSubmit && (
        <p className="text-xs text-amber-600">
          ⚠ Please map the <strong>Date</strong> column and at least one of <strong>Quantity</strong> or <strong>Total Revenue</strong>.
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
        ) : (
          <>Continue to Dashboard <ArrowRight className="h-4 w-4 ml-2" /></>
        )}
      </Button>
    </div>
  );
}
