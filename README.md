# 🧠 AI-Powered Business Intelligence

> A full-stack web application that allows users to **upload their own sales data**, **auto-detects columns**, processes it dynamically, displays personalized business insights, and **predicts future sales** using a **pre-trained Machine Learning model** loaded from a `.pkl` file.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Technologies Used](#-technologies-used)
3. [System Architecture](#-system-architecture)
4. [Dashboard Features](#-dashboard-features)
5. [Machine Learning Model](#-machine-learning-model)
6. [Setup & Installation](#-setup--installation)
7. [Supabase Configuration](#-supabase-configuration-guide)

---

## 📌 Project Overview

**Title:** AI-Powered Business Intelligence (Web Application)

This project is a dynamic analytics platform. Users upload their own CSV files, and the system **automatically detects columns** (Date, Revenue, Quantity, Category, etc.) — no manual mapping needed. The application instantly generates an interactive dashboard with **actionable business insights**. The backend processes the data using **Python and Pandas**, and **predicts future sales** using a **pre-trained ML model** persisted as a `.pkl` file via `joblib`.

### What the Platform Provides

| Feature | Description |
|---------|-------------|
| **Auto Column Detection** | AI-powered detection of date, sales, revenue, category, and city columns |
| **Total Revenue** | Aggregated revenue from all sales transactions |
| **Total Profit** | Gross income / profit analysis |
| **Monthly Sales Trend** | Line chart showing sales performance month-over-month |
| **City-wise Sales** | Bar chart comparing sales across different regions |
| **Category Distribution** | Pie chart showing product category distribution |
| **Actionable Insights** | ML-generated insights: top/worst performers, profit analysis, trend detection |
| **Sales Prediction** | ML-powered forecast for future months using pre-trained model |
| **Top Products** | Ranked list of best-performing product categories |

---

## 🛠 Technologies Used

| Layer | Technology | Purpose |
|-------|-----------|---------| 
| **Frontend** | React 18, TypeScript, Vite | UI framework & build tool |
| **UI Components** | TailwindCSS, shadcn/ui | Styling & component library |
| **Charts** | Recharts | Data visualization (Line, Bar, Pie charts) |
| **Backend** | Python 3.10+, FastAPI | REST API server |
| **Database/Storage** | Supabase (Auth + Storage) | User authentication & secure file storage |
| **Data Processing** | Pandas | CSV data loading, cleaning, aggregation |
| **Machine Learning** | scikit-learn, joblib | Sales prediction / forecasting + model persistence |

---

## 🏗 System Architecture

### How the System Works (Flow)

1. **Authentication:** User logs in securely via Supabase Auth. A secure JWT session is established.
2. **Data Upload:** User uploads their own sales CSV file via the drag-and-drop UI.
3. **Auto-Detection:** The system **automatically detects columns** (Date, Quantity, Revenue, Category, City, etc.) using pattern matching and data type analysis — no manual mapping required.
4. **Storage:** The CSV is securely stored in **Local Storage** (`backend/uploads/` directory) in a unique folder for each user.
5. **Data Processing:** When the dashboard is requested, the backend reads the user's local CSV, processes it in memory using Pandas, and aggregates statistics.
6. **ML Prediction:** The pre-trained ML model (loaded from `data/trained_model.pkl`) is applied to the user's data to predict future sales and generate actionable insights.
7. **Visualization:** JSON results are sent to the React frontend and rendered using Recharts.

### ML Model Architecture

```
First Startup:
  Kaggle CSV → Train LinearRegression → Save to trained_model.pkl

Subsequent Startups:
  trained_model.pkl → joblib.load() → Ready (instant, no retraining)

User Upload:
  User CSV → Auto-detect columns → Apply pre-trained model → Insights + Predictions
```

---

## 📊 Dashboard Features

### 1. Upload Page (Smart Auto-Detection)
- Drag-and-drop CSV upload functionality.
- **Automatic column detection** — no manual mapping needed.
- Shows detected column mapping for transparency.
- Instant redirect to Dashboard after upload.

### 2. Dashboard Page
- **4 KPI Cards**: Total Revenue, Total Profit, Total Sales, Predicted Sales.
- **Monthly Sales Trend**: Interactive line chart.
- **City-wise Sales**: Bar chart comparing sales.
- **Category Distribution**: Pie chart.

### 3. AI Insights & Prediction Page
- **Actionable Business Insights** — color-coded cards showing:
  - 🏆 Top performing categories/products
  - ⚠️ Worst performers and areas needing attention
  - 📈 Sales trend direction with percentages
  - 💰 Profitability analysis by category
  - 🏙️ Regional performance comparison
  - 📊 Average transaction values
  - 🔮 ML-powered sales forecast
- **Insight Summary**: Counts of strengths, improvements needed, and observations.
- **Prediction Controls**: Select forecast period (1, 3, or 6 months).
- **Actual vs Predicted Chart**: Line chart overlaying forecast on historical data.

### 4. Business Reports
- Top Selling Products (sortable, searchable, exportable)
- Sales by City breakdown
- Profit by Category analysis

---

## 🤖 Machine Learning Model

### Pre-Trained Model Persistence

The ML model is trained **once** on the Kaggle `supermarket_sales.csv` reference dataset and saved as a `.pkl` file using `joblib`. On subsequent server startups, the model is loaded directly from disk — **zero retraining overhead**.

```
data/
├── supermarket_sales.csv    # Training data (Kaggle reference)
└── trained_model.pkl        # Persisted model (auto-generated)
```

### How Predictions Work

- **Trend Extrapolation:** The model calculates a **growth rate** from the reference data's monthly sales trend.
- **Dynamic Application:** When a user uploads data, the system uses their actual sales baseline and applies the learned growth rate to project future months.
- **Actionable Insights:** Beyond predictions, the system analyzes the user's data to identify top/worst performers, profit margins, seasonal patterns, and regional comparisons.

---

## 🚀 Setup & Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ai-powered-business-intelligence
```

### Step 2: Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python run.py
```
✅ Backend will be running at: **http://localhost:8000**  
✅ On first run, the ML model will train and save to `data/trained_model.pkl`  
✅ On subsequent runs, it loads from `.pkl` instantly (no retraining)

### Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
✅ Frontend will be running at: **http://localhost:5173**

---

## 🌍 Deployment Guide

### Deploying the Backend to Render

1. Create a new **Web Service** on [Render.com](https://render.com).
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to: `pip install -r requirements.txt`
5. Set the **Start Command** to: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
6. Add your Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_STORAGE_BUCKET`

### Deploying the Frontend to Vercel

1. Create a new **Project** on [Vercel](https://vercel.com).
2. Connect your GitHub repository.
3. Set the **Framework Preset** to `Vite`.
4. Set the **Root Directory** to `frontend`.
5. In **Environment Variables**, add:
   - `VITE_API_BASE_URL` (Set this to your newly created Render backend URL, e.g., `https://your-backend.onrender.com`)
6. Click **Deploy**.

---

## 🔐 Supabase Configuration Guide

The application **requires** Supabase for Authentication. File storage is handled **locally** by the backend.

### Required Supabase Setup:

1. **Create a Project:** Set up a new project on [Supabase](https://supabase.com).
2. **Authentication:** 
   - Ensure the Email provider is enabled.
   - Turn OFF "Confirm email" to allow instant login during testing.
3. **Environment Variables:**
   - Copy your Project URL and anon public key.
   - Update the `backend/.env` file:
     ```env
     SUPABASE_URL=your-project-url
     SUPABASE_KEY=your-anon-key
     ```

You are now fully configured for production-grade user management!
