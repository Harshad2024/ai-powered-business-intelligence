// API Service — Connects React frontend to FastAPI backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─── Generic Fetch Helpers ───────────────────────────────────────────────────

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {
    ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Something went wrong" }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }
  return res.json();
}

function get<T>(endpoint: string) {
  return request<T>(endpoint, { method: "GET" });
}

function post<T>(endpoint: string, data: unknown) {
  return request<T>(endpoint, { method: "POST", body: JSON.stringify(data) });
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: { id: string; email: string; name: string };
}

export const authApi = {
  login: (data: LoginPayload) => post<AuthResponse>("/api/auth/login", data),
  signup: (data: SignupPayload) => post<AuthResponse>("/api/auth/signup", data),
  logout: () => {
    localStorage.removeItem("access_token");
  },
};

// ─── Upload API ──────────────────────────────────────────────────────────────

export interface UploadResponse {
  file_key: string;
  original_name: string;
  row_count: number;
  columns: string[];
  col_map: Record<string, string>;
  mapping_done: boolean;
}

export interface UploadStatus {
  has_file: boolean;
  file_key?: string;
  original_name?: string;
  row_count?: number;
  columns?: string[];
  mapping_done: boolean;
  col_map?: Record<string, string>;
}

export const uploadApi = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || `Upload Error: ${res.status}`);
    }
    return res.json();
  },

  getStatus: () => get<UploadStatus>("/api/upload/status"),
};

// ─── Dashboard API ───────────────────────────────────────────────────────────

export interface KPIStats {
  total_revenue: number;
  total_profit: number;
  total_sales: number;
  predicted_sales: number;
  revenue_trend: string;
  profit_trend: string;
  sales_trend: string;
  predicted_trend: string;
}

export interface MonthlySale {
  month: string;
  sales?: number;
  revenue?: number;
}

export interface CitySale {
  city: string;
  sales: number;
}

export interface CategoryData {
  name: string;
  value: number;
  fill: string;
}

export interface TopProduct {
  rank: number;
  name: string;
  category: string;
  sales: number;
  revenue: string;
  growth: string;
}

export const dashboardApi = {
  getStats: () => get<KPIStats>("/api/dashboard/stats"),
  getMonthlyTrend: () => get<MonthlySale[]>("/api/dashboard/monthly-trend"),
  getCitySales: () => get<CitySale[]>("/api/sales/by-city"),
  getCategoryData: () => get<CategoryData[]>("/api/sales/by-category"),
  getTopProducts: () => get<TopProduct[]>("/api/sales/top-products"),
};

// ─── Prediction API ──────────────────────────────────────────────────────────

export interface PredictionRequest {
  months: number;
}

export interface PredictionResponse {
  predicted_sales: string;
  months: number;
  breakdown: number[];
  chart_data: Array<{ month: string; actual: number | null; predicted: number | null }>;
}

export interface PredictionHistoryItem {
  month: string;
  actual: number | null;
  predicted: number | null;
}

export interface InsightItem {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  metric: string;
}

export interface ActionItem {
  category: string;
  action: string;
  impact: string;
  effort: string;
}

export interface InsightsResponse {
  insights: InsightItem[];
  action_plan: ActionItem[];
}

export const predictionApi = {
  predict: (data: PredictionRequest) => post<PredictionResponse>("/api/predict", data),
  getHistory: () => get<PredictionHistoryItem[]>("/api/predict/history"),
  getInsights: () => get<InsightsResponse>("/api/predict/insights"),
};

// ─── Reports API ─────────────────────────────────────────────────────────────

export interface CityReport {
  city: string;
  totalSales: number;
  revenue: string;
  avgOrder: string;
  topCategory: string;
}

export interface ProfitReport {
  category: string;
  revenue: string;
  cost: string;
  profit: string;
  margin: string;
}

export const reportsApi = {
  getTopProducts: () => get<TopProduct[]>("/api/sales/top-products"),
  getSalesByCity: () => get<CityReport[]>("/api/reports/sales-by-city"),
  getProfitByCategory: () => get<ProfitReport[]>("/api/reports/profit-by-category"),
};
