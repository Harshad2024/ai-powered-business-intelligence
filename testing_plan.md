# 🧪 AI-Powered Business Intelligence — Manual Testing Plan

This document outlines the step-by-step flow to manually test the entire application from end to end. 
It covers starting the servers, authentication, uploading data, and verifying the dashboard analytics.

---

## Phase 1: Environment Setup & Bootstrapping

### 1. Start the Backend (Python/FastAPI)
1. Open a terminal and navigate to the `backend` folder.
2. Activate the virtual environment: `.\venv\Scripts\activate` (Windows)
3. Start the server: `python run.py`
4. **Verification:** 
   - You should see Uvicorn running on `http://localhost:8000`.
   - **First run**: Terminal logs should show the ML model training and saving to `data/trained_model.pkl`.
   - **Subsequent runs**: Terminal logs should show "Loading pre-trained model from: data/trained_model.pkl" — no retraining.

### 2. Start the Frontend (React/Vite)
1. Open a new terminal and navigate to the `frontend` folder.
2. Start the development server: `npm run dev`
3. **Verification:** 
   - The app should be accessible at `http://localhost:5173`.

---

## Phase 2: Authentication Flow (Supabase + JWT)

1. **Sign Up:**
   - Go to `http://localhost:5173/signup`.
   - Enter a name, valid email, and password.
   - Click "Create Account".
   - **Verification:** You should see a success toast notification ("Account created successfully!"). You should be instantly redirected to the Dashboard. In your Supabase dashboard (Authentication -> Users), you should see the new user created.
   - **Verification:** Look at the Top Navbar in the top right corner. Your name should be displayed next to the user icon instead of just a generic icon.

2. **Log Out & Log In:**
   - Click the "Log Out" button in the sidebar.
   - Go to `http://localhost:5173/login`.
   - Log back in with the credentials you just created.
   - **Verification:** You should see a "Welcome back, [Name]!" success toast and be redirected back to the Dashboard. Your name should be correctly displayed in the top right corner.

---

## Phase 3: Data Upload (Auto-Detection)

*Note: For testing, you can use the `supermarket_sales.csv` located in `backend/data/` as your "user uploaded" dataset.*

1. **Upload Guard Check:**
   - Try navigating to the Dashboard, Prediction, or Reports pages from the sidebar.
   - **Verification:** The app should display an "Upload Required" or "No Data" screen, forcing you to upload a CSV first.

2. **File Upload with Auto-Detection:**
   - Navigate to the **Upload Data** page.
   - Drag and drop your test CSV file (e.g., `supermarket_sales.csv`).
   - **Verification:** 
     - The file should upload successfully.
     - The system should **automatically detect columns** (Date, Quantity, Total, City, Category, etc.).
     - A success screen shows the auto-detected column mapping.
     - You are automatically redirected to the Dashboard.
   - **Note:** There is NO manual column mapping step anymore — it's fully automatic.

---

## Phase 4: Dashboard & Analytics Verification

1. **KPI Cards:**
   - Go to the **Dashboard**.
   - **Verification:** Ensure "Total Revenue", "Total Profit", and "Total Sales" cards display numeric values (not zeros or NaNs) matching the uploaded dataset.

2. **Charts & Graphs:**
   - Check the **Monthly Sales Trend** (Line Chart). It should show data points for each month present in the CSV.
   - Check **Sales by City** (Bar Chart). It should list the cities from the CSV.
   - Check **Category Distribution** (Pie Chart). Hover over slices to ensure tooltips work.

---

## Phase 5: AI Insights & Sales Prediction

1. **Actionable Insights:**
   - Navigate to the **Prediction** (AI Insights) page.
   - **Verification:**
     - At the top, you should see 3 summary cards showing counts of: Strengths Found, Areas to Improve, Key Observations.
     - Below, a grid of color-coded insight cards should appear:
       - ✅ **Green (Success):** Top performing categories, sales growth, highest margins
       - ⚠️ **Amber (Warning):** Lowest categories, weakest months/regions
       - 🔴 **Red (Danger):** Declining sales, low-margin categories
       - 🔵 **Blue (Info):** Best months, average transaction values, ML forecasts
     - Each insight card should have a **title**, **description** with actionable advice, and a **metric** badge.

2. **Run Prediction:**
   - Select a forecast period (e.g., "3 Months").
   - Click **"Run Prediction"**.
   - **Verification:** The backend should process the request and return a predicted sales number. The Line Chart should overlay the predicted trajectory on top of the historical actuals.

---

## Phase 6: Business Reports

1. **Data Tables:**
   - Navigate to the **Reports** page.
   - **Verification:** You should see detailed data tables for:
     - Top Selling Products (Sortable and Searchable)
     - Sales by City
     - Profit by Category
   - Try using the search bar on the Top Selling Products table to ensure local filtering works.

2. **Export to CSV:**
   - Click the **"Export CSV"** button located on the top right of any data table.
   - **Verification:** A `.csv` file should be instantly downloaded to your computer containing the exact data currently visible in the table (respecting any active search filters).

---

## Phase 7: ML Model Persistence Verification

1. **First Run:**
   - Delete `backend/data/trained_model.pkl` if it exists.
   - Start the backend server.
   - **Verification:** Terminal logs show model training and saving to `.pkl`.

2. **Subsequent Runs:**
   - Stop and restart the backend server.
   - **Verification:** Terminal logs show "Loading pre-trained model" — no retraining occurs. Startup should be noticeably faster.

---

🎉 **If all phases pass successfully, the application is fully production-ready!**
