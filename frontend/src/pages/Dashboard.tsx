import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, ShoppingCart, BrainCircuit, Loader2, Upload, AlertCircle } from "lucide-react";
import { KPICard } from "@/components/charts/KPICard";
import { ChartCard } from "@/components/charts/ChartCard";
import { DataTable } from "@/components/charts/DataTable";
import { Button } from "@/components/ui/button";
import {
  dashboardApi, uploadApi,
  type KPIStats, type MonthlySale, type CitySale,
  type CategoryData, type TopProduct,
} from "@/services/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const productColumns = [
  { key: "rank", label: "#" },
  { key: "name", label: "Product" },
  { key: "category", label: "Category" },
  { key: "sales", label: "Sales" },
  { key: "revenue", label: "Revenue" },
  { key: "growth", label: "Growth" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlySale[]>([]);
  const [citySales, setCitySales] = useState<CitySale[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Check if user has uploaded & mapped data
        const status = await uploadApi.getStatus();
        if (!status.has_file || !status.mapping_done) {
          setNoData(true);
          setLoading(false);
          return;
        }

        const [statsData, monthlyData, cityData, catData, prodData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getMonthlyTrend(),
          dashboardApi.getCitySales(),
          dashboardApi.getCategoryData(),
          dashboardApi.getTopProducts(),
        ]);
        setStats(statsData);
        setMonthly(monthlyData);
        setCitySales(cityData);
        setCategories(catData);
        setProducts(prodData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
        if (msg.includes("No file uploaded") || msg.includes("Column mapping")) {
          setNoData(true);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  // No data uploaded yet — prompt user
  if (noData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md px-4">
          <div className="flex justify-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Data Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your sales CSV file to see your personalized business analytics dashboard with real insights and ML predictions.
          </p>
          <Button
            onClick={() => navigate("/upload")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Your Data
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center px-4">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-1">Make sure the backend server is running on port 8000</p>
        </div>
      </div>
    );
  }

  const kpis = stats
    ? [
        { title: "Total Revenue", value: `$${stats.total_revenue.toLocaleString()}`, trend: stats.revenue_trend, trendUp: !stats.revenue_trend.startsWith("-"), icon: DollarSign, gradient: "gradient-primary" },
        { title: "Total Profit", value: `$${stats.total_profit.toLocaleString()}`, trend: stats.profit_trend, trendUp: !stats.profit_trend.startsWith("-"), icon: TrendingUp, gradient: "gradient-success" },
        { title: "Total Sales", value: stats.total_sales.toLocaleString(), trend: stats.sales_trend, trendUp: !stats.sales_trend.startsWith("-"), icon: ShoppingCart, gradient: "gradient-warning" },
        { title: "Predicted Sales", value: stats.predicted_sales.toLocaleString(), trend: stats.predicted_trend, trendUp: !stats.predicted_trend.startsWith("-"), icon: BrainCircuit, gradient: "gradient-purple" },
      ]
    : [];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Business Analytics from your uploaded data</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Sales Trend" subtitle="Sales performance over time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220,10%,50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,10%,50%)" />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="hsl(215,90%,50%)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {citySales.length > 0 ? (
          <ChartCard title="City-wise Sales" subtitle="Sales comparison across cities">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={citySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} stroke="hsl(220,10%,50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,10%,50%)" />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(215,90%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="City-wise Sales" subtitle="Not available">
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              City data not available in your dataset
            </div>
          </ChartCard>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {categories.length > 0 ? (
          <ChartCard title="Category Distribution" subtitle="Product category breakdown" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categories.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Category Distribution" subtitle="Not available" className="lg:col-span-2">
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
              Category data not available in your dataset
            </div>
          </ChartCard>
        )}

        {products.length > 0 ? (
          <ChartCard title="Top Selling Products" subtitle="Best performers" className="lg:col-span-3">
            <DataTable columns={productColumns} data={products} searchKey="name" />
          </ChartCard>
        ) : (
          <ChartCard title="Top Products" subtitle="Not available" className="lg:col-span-3">
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              Product category data not available in your dataset
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
