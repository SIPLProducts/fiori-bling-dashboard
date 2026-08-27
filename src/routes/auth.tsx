import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ensureDemoUser } from "@/lib/demo.functions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-config";


export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/launchpad" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Nexus Procurement Analytics" },
      {
        name: "description",
        content: "Sign in to the Nexus procurement analytics portal to view SAP spend, order and supplier reports.",
      },
      { property: "og:title", content: "Sign in — Nexus Procurement Analytics" },
      {
        property: "og:description",
        content: "Access role-based SAP procurement dashboards and analytics reports.",
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
  const [busy, setBusy] = useState(false);

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
      <div className="hidden flex-col justify-between bg-shell p-10 text-shell-foreground lg:flex">
        <span className="rounded-sm bg-primary px-2 py-1 text-[13px] font-bold tracking-[0.18em] text-primary-foreground self-start">
          NEXUS
        </span>
        <div>
          <h2 className="max-w-md text-3xl leading-tight font-light">
            Your SAP procurement data, in a launchpad your team already knows how to use.
          </h2>
          <p className="mt-4 max-w-md text-sm text-shell-muted">
            Role-based tile groups, live KPIs and drill-down analytics for purchase orders, suppliers
            and contracts.
          </p>
        </div>
        <p className="text-xs text-shell-muted">Nexus Analytics Portal</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-light text-foreground">Sign in to the portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your work account to access procurement analytics.
          </p>

          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

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

          <p className="mt-6 text-xs text-muted-foreground">
            Portal access is provisioned by your administrator.
          </p>

        </div>
      </div>
    </div>
  );
}

