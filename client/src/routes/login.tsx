import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { loginCustomer, registerCustomer, useCustomerAuth } from "@/lib/customerAuth";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () => ({
    ...seo("Sign In · Customer Account · OFFSCRIPT", "Sign in or register for an OFFSCRIPT customer account to track orders and save favorite pieces."),
  }),
  component: LoginPage,
});

const ADMIN_LOGIN_URL = "https://offscript-admin.vercel.app/login";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useCustomerAuth();

  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginCustomer(email, password);
      navigate({ to: "/profile" });
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Check email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerCustomer({ name, email, password, mobile: mobile || undefined });
      navigate({ to: "/profile" });
    } catch (err: any) {
      setError(err.message || "Failed to register. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 py-24 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-wider">Signed In as {user.name}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{user.email}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            to="/profile"
            className="flex-1 py-2.5 px-4 bg-foreground text-background text-xs font-semibold uppercase tracking-wider rounded text-center hover:opacity-90"
          >
            My Orders & Profile
          </Link>
          <button
            onClick={logout}
            className="flex-1 py-2.5 px-4 border border-border text-xs font-semibold uppercase tracking-wider rounded text-center hover:bg-muted"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-5 py-16">
      {/* Editorial Header */}
      <div className="text-center mb-8">
        <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mb-1">
          OFFSCRIPT ID // CLIENT PROFILE
        </p>
        <h1 className="text-2xl font-bold tracking-tight uppercase">
          {tab === "signin" ? "Sign In to OFFSCRIPT" : "Create Account"}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Track Cash-on-Delivery dispatches, save addresses, and curate your personal wishlist.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border border-border rounded mb-6 p-1 bg-muted/30">
        <button
          type="button"
          onClick={() => {
            setTab("signin");
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
            tab === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("register");
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
            tab === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Register
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sign In Form */}
      {tab === "signin" ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest font-bold rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      ) : (
        /* Register Form */
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Verma"
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Create Password (Min 6 chars) *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-widest font-bold rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {/* Staff Admin Portal Link */}
      <div className="mt-12 pt-6 border-t border-border text-center">
        <p className="text-[11px] text-muted-foreground">
          Brand curator or administrator?{" "}
          <a
            href={ADMIN_LOGIN_URL}
            className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
          >
            Access Admin Console →
          </a>
        </p>
      </div>
    </div>
  );
}
