import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrainCircuit, Play, Loader2, Upload, TrendingUp, TrendingDown,
  AlertTriangle, Info, CheckCircle2, Target, Lightbulb, Printer, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/charts/ChartCard";
import {
  predictionApi, uploadApi,
  type PredictionHistoryItem, type InsightItem, type ActionItem,
} from "@/services/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Map insight types to visual styles
const insightStyles: Record<string, { bg: string; border: string; icon: typeof CheckCircle2; iconColor: string; badgeBg: string; badgeText: string }> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  danger: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: TrendingDown,
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Info,
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
};

function InsightCard({ insight }: { insight: InsightItem }) {
  const style = insightStyles[insight.type] || insightStyles.info;
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4 sm:p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.badgeBg}`}>
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground leading-snug">{insight.title}</h4>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badgeBg} ${style.badgeText}`}>
              {insight.metric}
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Prediction() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("3");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const status = await uploadApi.getStatus();
        if (!status.has_file || !status.mapping_done) {
          setNoData(true);
          setHistoryLoading(false);
          setInsightsLoading(false);
          return;
        }

        // Fetch history and insights in parallel
        const [histData, responseData] = await Promise.all([
          predictionApi.getHistory(),
          predictionApi.getInsights(),
        ]);
        setHistory(histData);
        setInsights(responseData.insights);
        setActionPlan(responseData.action_plan);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("No file") || msg.includes("Column mapping")) {
          setNoData(true);
        } else {
          console.error("Failed to load prediction data:", err);
        }
      } finally {
        setHistoryLoading(false);
        setInsightsLoading(false);
      }
    }
    init();
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const data = await predictionApi.predict({ months: parseInt(period) });
      setResult(data.predicted_sales);
      if (data.chart_data && data.chart_data.length > 0) {
        setHistory(data.chart_data);
      }
    } catch (err) {
      console.error("Prediction failed:", err);
      setResult("Error — check backend");
    } finally {
      setLoading(false);
    }
  };

  if (noData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md px-4">
          <div className="flex justify-center mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100">
              <BrainCircuit className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Data to Analyze</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your sales CSV to get ML-powered predictions and actionable business insights.
          </p>
          <Button onClick={() => navigate("/upload")} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
            <Upload className="h-4 w-4" /> Upload Your Data
          </Button>
        </div>
      </div>
    );
  }

  // Categorize insights for the summary section
  const successInsights = insights.filter(i => i.type === "success");
  const warningInsights = insights.filter(i => i.type === "warning" || i.type === "danger");
  const infoInsights = insights.filter(i => i.type === "info");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-purple-600" />
            AI Business Insights & Predictions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Actionable intelligence and strategic plans to grow your business.
          </p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="hidden sm:flex items-center gap-2 print-hidden">
          <Printer className="h-4 w-4" />
          Download Full Report
        </Button>
      </div>

      {/* ─── KEY INSIGHTS SUMMARY ──────────────────────────────────── */}
      {!insightsLoading && insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <div className="flex justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{successInsights.length}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Strengths Found</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
            <div className="flex justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700">{warningInsights.length}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Areas to Improve</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
            <div className="flex justify-center mb-2">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700">{infoInsights.length}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Key Observations</p>
          </div>
        </div>
      )}

      {/* ─── ACTIONABLE INSIGHTS ───────────────────────────────────── */}
      {insightsLoading ? (
        <div className="rounded-xl bg-card p-8 shadow-card">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-sm text-muted-foreground">Generating insights from your data...</span>
          </div>
        </div>
      ) : insights.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-foreground">Actionable Business Insights</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      ) : null}

      {/* ─── STRATEGIC ACTION PLAN ─────────────────────────────────── */}
      {!insightsLoading && actionPlan.length > 0 && (
        <div className="space-y-3 pt-4 print-break-before">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-foreground">Strategic Action Plan</h3>
          </div>
          <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-border">
              {actionPlan.map((action, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-muted/50 transition-colors">
                  <div className="sm:w-1/4">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-bold mb-2">
                      {action.category}
                    </span>
                    <div className="flex gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        action.impact === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {action.impact} Impact
                      </span>
                    </div>
                  </div>
                  <div className="sm:w-3/4 flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {action.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PREDICTION CONTROLS ───────────────────────────────────── */}
      <div className="rounded-xl bg-card p-5 sm:p-6 shadow-card print-hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Forecast Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Next 1 Month</SelectItem>
                <SelectItem value="3">Next 3 Months</SelectItem>
                <SelectItem value="6">Next 6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handlePredict} disabled={loading} className="gradient-primary text-primary-foreground gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {loading ? "Running Model..." : "Run Prediction"}
          </Button>

          {result && (
            <div className="ml-auto flex items-center gap-3 rounded-lg bg-accent px-5 py-3">
              <BrainCircuit className="h-5 w-5 text-accent-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Predicted Sales</p>
                <p className="text-lg font-bold text-accent-foreground">{result}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── PREDICTION CHART ──────────────────────────────────────── */}
      <ChartCard title="Actual vs Predicted Sales" subtitle="Historical data with ML predictions from your data">
        {historyLoading ? (
          <div className="flex items-center justify-center h-[380px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220,10%,50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,10%,50%)" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="hsl(215,90%,50%)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
              <Line type="monotone" dataKey="predicted" name="Predicted Sales" stroke="hsl(265,80%,55%)" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
