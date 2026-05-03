import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText, Upload } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard";
import { DataTable } from "@/components/charts/DataTable";
import { Button } from "@/components/ui/button";
import { reportsApi, uploadApi, type TopProduct, type CityReport, type ProfitReport } from "@/services/api";

const productCols = [
  { key: "rank", label: "#" },
  { key: "name", label: "Product" },
  { key: "category", label: "Category" },
  { key: "sales", label: "Units Sold" },
  { key: "revenue", label: "Revenue" },
  { key: "growth", label: "Growth" },
];

const cityCols = [
  { key: "city", label: "City" },
  { key: "totalSales", label: "Total Sales" },
  { key: "revenue", label: "Revenue" },
  { key: "avgOrder", label: "Avg Order" },
  { key: "topCategory", label: "Top Category" },
];

const profitCols = [
  { key: "category", label: "Category" },
  { key: "revenue", label: "Revenue" },
  { key: "cost", label: "Cost" },
  { key: "profit", label: "Profit" },
  { key: "margin", label: "Margin" },
];

export default function Reports() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [cityData, setCityData] = useState<CityReport[]>([]);
  const [profitData, setProfitData] = useState<ProfitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const status = await uploadApi.getStatus();
        if (!status.has_file || !status.mapping_done) {
          setNoData(true);
          setLoading(false);
          return;
        }

        const [prod, city, profit] = await Promise.all([
          reportsApi.getTopProducts(),
          reportsApi.getSalesByCity(),
          reportsApi.getProfitByCategory(),
        ]);
        setProducts(prod);
        setCityData(city);
        setProfitData(profit);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load reports";
        if (msg.includes("No file") || msg.includes("Column mapping")) {
          setNoData(true);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading reports...</span>
      </div>
    );
  }

  if (noData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md px-4">
          <div className="flex justify-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
              <FileText className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Reports Available</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your sales CSV to generate detailed business reports.
          </p>
          <Button onClick={() => navigate("/upload")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
            <Upload className="h-4 w-4" /> Upload Your Data
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Business Reports</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Reports generated from your uploaded data</p>
      </div>

      {products.length > 0 && (
        <ChartCard title="Top Selling Products" subtitle="Best performing products ranked by sales">
          <DataTable columns={productCols} data={products} searchKey="name" exportFilename="top_products_report.csv" />
        </ChartCard>
      )}

      {cityData.length > 0 ? (
        <ChartCard title="Sales by City" subtitle="City-wise performance breakdown">
          <DataTable columns={cityCols} data={cityData} searchKey="city" exportFilename="sales_by_city_report.csv" />
        </ChartCard>
      ) : (
        <ChartCard title="Sales by City" subtitle="Not available">
          <div className="flex items-center justify-center h-[100px] text-sm text-muted-foreground">
            City data not available in your dataset
          </div>
        </ChartCard>
      )}

      {profitData.length > 0 ? (
        <ChartCard title="Profit by Category" subtitle="Category-wise profitability analysis">
          <DataTable columns={profitCols} data={profitData} searchKey="category" exportFilename="profit_by_category_report.csv" />
        </ChartCard>
      ) : (
        <ChartCard title="Profit by Category" subtitle="Not available">
          <div className="flex items-center justify-center h-[100px] text-sm text-muted-foreground">
            Category/profit data not available in your dataset
          </div>
        </ChartCard>
      )}
    </div>
  );
}
