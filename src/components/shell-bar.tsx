import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { adminNavForScreens } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import hblLogo from "@/assets/hbl-logo.png";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShellBar({
  displayName,
  screens,
}: {
  title: string;
  displayName?: string | null | undefined;
  screens?: string[] | undefined;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const adminItems = adminNavForScreens(screens);


  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 bg-shell text-shell-foreground shadow-sm">
      <div className="mx-auto grid h-12 max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
        <Link to="/launchpad" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-shell-foreground/14">
            <img src={hblLogo} alt="HBL" className="h-4 w-auto object-contain brightness-0 invert" />
          </span>
          <span className="truncate text-[12px] font-semibold tracking-wide uppercase sm:text-sm">SAP Enterprise Portal</span>
          <span className="hidden h-4 w-px bg-shell-foreground/25 sm:block" aria-hidden="true" />
          <span className="hidden truncate text-[11px] text-shell-muted md:block">Connected to PRD-01 (S/4HANA)</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
            aria-label="Alerts"
            title="Alerts"
            className="hidden min-w-12 flex-col items-center rounded-md px-2 py-1 text-[9px] font-medium transition-colors hover:bg-shell-foreground/10 sm:inline-flex"
        >
            <Bell className="size-3.5" />
            <span>Alerts</span>
        </button>
        <button
          type="button"
            aria-label="Settings"
            title="Settings"
            className="hidden min-w-12 flex-col items-center rounded-md px-2 py-1 text-[9px] font-medium transition-colors hover:bg-shell-foreground/10 sm:inline-flex"
        >
            <Settings className="size-3.5" />
            <span>Settings</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account"
            className="ml-1 flex max-w-40 items-center gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-shell-foreground/10"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-shell-foreground/15 text-[10px] font-semibold">
              {displayName ? displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : <User className="size-3.5" />}
            </span>
            <span className="hidden min-w-0 text-left text-[10px] leading-tight sm:block">
              <span className="block truncate font-semibold">{displayName ?? "Signed in"}</span>
              <span className="block text-shell-muted">Account</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{displayName ?? "Signed in"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {adminItems.length ? (
              <>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Administration
                </DropdownMenuLabel>
                {adminItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : null}

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  );
}
