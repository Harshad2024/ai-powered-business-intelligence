import { useState } from "react";
import { Search, ArrowUpDown, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  searchable?: boolean;
  searchKey?: string;
  exportable?: boolean;
  exportFilename?: string;
}

export function DataTable({ 
  columns, 
  data, 
  searchable = true, 
  searchKey,
  exportable = true,
  exportFilename = "report_data.csv"
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = searchable && searchKey
    ? data.filter((row) =>
        String(row[searchKey]).toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortDir === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      })
    : filtered;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const downloadCSV = () => {
    if (sorted.length === 0) return;

    const headers = columns.map(c => c.label).join(",");
    const csvRows = sorted.map(row => {
      return columns.map(c => {
        let val = String(row[c.key] ?? "");
        // Escape quotes and wrap in quotes if contains comma
        if (val.includes(",") || val.includes('"')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",");
    });

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", exportFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        {searchable ? (
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        ) : <div />}
        
        {exportable && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadCSV}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-card-foreground">
                    {String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
