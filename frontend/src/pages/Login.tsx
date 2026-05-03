import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, BrainCircuit, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/services/api";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_name", data.user.name || "User");
      localStorage.setItem("user_email", data.user.email);
      toast.success(`Welcome back, ${data.user.name || "User"}!`);
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel — AI Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] items-center justify-center relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <img
            src="/ai-bg.png"
            alt=""
            className="object-cover w-full h-full opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-blue-950/60" />
        </div>

        {/* Floating decorative orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-32 left-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Content */}
        <div className="relative z-20 px-12 xl:px-20 max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 backdrop-blur-sm border border-blue-400/20">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <span className="font-semibold text-blue-300 tracking-wider text-sm uppercase">
              AI Business Intelligence
            </span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Smart Insights,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Smarter Decisions
            </span>
          </h2>

          <p className="text-blue-200/80 text-lg leading-relaxed mb-10">
            Analyze supermarket sales data, uncover trends, and predict future
            revenue with machine learning — all in one dashboard.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {["Pandas Analytics", "ML Prediction", "Real-time Charts"].map((f) => (
              <span key={f} className="px-4 py-2 rounded-full text-xs font-medium bg-white/5 text-blue-200 border border-white/10 backdrop-blur-sm">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">BI Analytics</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access your analytics dashboard
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 sm:p-8 shadow-elevated border border-border">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-background"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-500 font-medium">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-background"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-semibold">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
