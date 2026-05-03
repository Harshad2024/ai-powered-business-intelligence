import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Loader2, BrainCircuit, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/services/api";
import { toast } from "sonner";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.signup({ name, email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_name", data.user.name || name);
      localStorage.setItem("user_email", data.user.email);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Signup failed";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel — Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] items-center justify-center relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/ai-bg.png" alt="" className="object-cover w-full h-full opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-indigo-950/60" />
        </div>

        <div className="absolute top-24 left-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-16 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-20 px-12 xl:px-20 max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/20">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="font-semibold text-indigo-300 tracking-wider text-sm uppercase">
              Get Started
            </span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Join the Future
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
              of Analytics
            </span>
          </h2>

          <p className="text-indigo-200/80 text-lg leading-relaxed">
            Create your account and start leveraging AI-powered insights
            to drive smarter business strategies.
          </p>
        </div>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile-only branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">BI Analytics</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Create an Account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill in your details to get started
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 sm:p-8 shadow-elevated border border-border">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-11 bg-background" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 bg-background" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11 bg-background" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-11 bg-background" required />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm mt-1">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/" className="text-blue-600 hover:text-blue-500 font-semibold">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
