import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ensureDemoUser } from "@/lib/demo.functions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-config";
import hblLogoAsset from "@/assets/hbl-logo.png.asset.json";

const hblLogo = hblLogoAsset.url;
const REMEMBER_KEY = "hbl-remembered-identifier";

export const Route = createFileRoute("/auth")({
  // The auth client uses browser-backed session storage. Keeping this route
  // client-only prevents preview storage timing from breaking the login page.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — HBL MIS Portal" },
      {
        name: "description",
        content: "Sign in to the HBL MIS Portal to view SAP KPI dashboards and analytics reports.",
      },
      { property: "og:title", content: "Sign in — HBL MIS Portal" },
      {
        property: "og:description",
        content: "Access role-based SAP MIS dashboards and analytics reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const provisionDemo = ensureDemoUser;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const rememberedIdentifier = localStorage.getItem(REMEMBER_KEY);

    if (rememberedIdentifier) {
      setIdentifier(rememberedIdentifier);
      setRemember(true);
    }

    // Session restoration is an enhancement, never a prerequisite for showing
    // the form. A storage/network failure must leave the user on this page.
    try {
      void supabase.auth
        .getUser()
        .then(({ data, error }) => {
          if (active && !error && data.user) {
            void navigate({ to: "/launchpad", replace: true });
          }
        })
        .catch((error: unknown) => {
          console.warn("Unable to restore the existing login session", error);
        });
    } catch (error) {
      console.warn("Unable to initialize login session restoration", error);
    }

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      let loginEmail = identifier.trim();
      if (!loginEmail.includes("@")) {
        const { data, error } = await supabase.rpc("resolve_login_email", {
          _identifier: loginEmail,
        });
        if (error || !data) throw new Error("Invalid credentials or the account is inactive");
        loginEmail = data;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) throw new Error(error.message);
      if (remember) localStorage.setItem(REMEMBER_KEY, identifier.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      navigate({ to: "/launchpad" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDemoLogin() {
    setBusy(true);
    try {
      const creds = await provisionDemo();
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) throw error;
      toast.success("Signed in as Demo User");
      navigate({ to: "/launchpad" });
    } catch {
      toast.error("Demo sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="relative hidden flex-col overflow-hidden bg-shell p-10 text-shell-foreground lg:flex">
        {/* centered HBL logo watermark behind the description */}
        <img
          aria-hidden
          src={hblLogo}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 w-[30rem] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.07] invert brightness-0 select-none"
        />
        {/* radial glow behind copy */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative flex flex-1 flex-col items-center justify-center text-center">


          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="h-1 w-12 rounded-full bg-gold" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-shell-muted">
              Management Information System
            </p>
            <span className="h-1 w-12 rounded-full bg-gold" />
          </div>
          <h2 className="mt-5 max-w-md text-3xl leading-tight font-light">
            HBL MIS Portal — SAP reports, KPIs and analytics in one launchpad.
          </h2>
          <p className="mt-4 max-w-md text-sm text-shell-muted">
            Role-based tiles, live KPIs and drill-down analytics across Sales, Finance, Quality,
            Production and more — delivered straight from your SAP landscape.
          </p>
        </div>

        <p className="relative text-center text-xs text-shell-muted">HBL MIS Portal</p>
      </div>

      {/* Right sign-in panel */}
      <div className="relative flex items-center justify-center bg-surface p-6">
        <img
          src={hblLogo}
          alt="HBL logo"
          className="absolute right-6 top-6 h-9 w-auto"
        />
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-card-raised p-9 shadow-[var(--shadow-soft-card)] ring-1 ring-ink/5">
            <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
              Welcome back
            </h1>
            <div className="mt-2 h-0.5 w-10 rounded-full bg-gold" />
            <p className="mt-3 text-sm text-muted-foreground">
              Please sign in to access your dashboard.
            </p>

            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-semibold text-foreground">
                  Email or username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-11 rounded-lg border-transparent bg-muted pl-10 focus-visible:border-gold focus-visible:ring-gold/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg border-transparent bg-muted pl-10 focus-visible:border-gold focus-visible:ring-gold/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-ink hover:underline"
                  onClick={() =>
                    toast.info("Please contact your administrator to reset your password.")
                  }
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-lg bg-ink text-sm font-semibold text-ink-foreground shadow-md shadow-ink/20 hover:bg-ink/90"
                disabled={busy}
              >
                {busy ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </div>

          <div className="mt-6 rounded-md border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">Demo access</p>
            <p className="mt-1 text-xs text-muted-foreground">
              User ID: <span className="font-mono">{DEMO_EMAIL}</span>
              <br />
              Password: <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              disabled={busy}
              onClick={() => void handleDemoLogin()}
              onDoubleClick={() => void handleDemoLogin()}
            >
              {busy ? "Opening demo…" : "Login as Demo User"}
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Portal access is provisioned by your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
