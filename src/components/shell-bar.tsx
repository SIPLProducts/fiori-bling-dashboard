import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Search, User } from "lucide-react";
import { navForRoles } from "@/lib/nav";
import { MODULES } from "@/lib/sap-modules";
import { supabase } from "@/integrations/supabase/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShellBar({
  title,
  displayName,
  roles,
}: {
  title: string;
  displayName?: string | null | undefined;
  roles?: string[] | undefined;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-shell px-4 text-shell-foreground">
      <Link to="/launchpad" className="flex items-center gap-2">
        <span className="rounded-sm bg-primary px-2 py-1 text-[13px] font-bold tracking-[0.18em] text-primary-foreground">
          NEXUS
        </span>
      </Link>
      <span className="hidden text-xs text-shell-muted sm:inline">Procurement Analytics</span>

      <nav className="mx-auto hidden items-center gap-1 md:flex">
        {navForRoles(roles).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "bg-shell-foreground/15 text-shell-foreground" }}
            className="rounded-sm px-3 py-1.5 text-[13px] text-shell-muted transition-colors hover:bg-shell-foreground/10 hover:text-shell-foreground"
          >
            {item.label}
          </Link>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 rounded-sm px-3 py-1.5 text-[13px] text-shell-muted transition-colors hover:bg-shell-foreground/10 hover:text-shell-foreground">
            Modules <ChevronDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64">
            <DropdownMenuLabel>SAP business areas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MODULES.map((mod) => (
              <DropdownMenuItem key={mod.key} asChild>
                <Link to="/reports/module/$module" params={{ module: mod.key }}>
                  <span className="mr-2 w-6 text-xs font-semibold text-primary">{mod.code}</span>
                  {mod.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <span className="mx-auto text-sm font-medium md:hidden">{title}</span>


      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Search"
          className="rounded-full p-2 transition-colors hover:bg-shell-foreground/10"
        >
          <Search className="size-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="hidden rounded-full p-2 transition-colors hover:bg-shell-foreground/10 sm:block"
        >
          <Bell className="size-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="hidden rounded-full p-2 transition-colors hover:bg-shell-foreground/10 sm:block"
        >
          <HelpCircle className="size-[18px]" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="ml-1 flex size-9 items-center justify-center rounded-full bg-shell-foreground/15 transition-colors hover:bg-shell-foreground/25"
          >
            <User className="size-[18px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{displayName ?? "Signed in"}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {roles?.length ? roles.join(", ") : "no role assigned"}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/launchpad">
                <Menu className="mr-2 size-4" /> Launchpad
              </Link>
            </DropdownMenuItem>
            {roles?.includes("admin") ? (
              <DropdownMenuItem asChild>
                <Link to="/admin/users">
                  <User className="mr-2 size-4" /> Users &amp; roles
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void handleSignOut()}>
              <LogOut className="mr-2 size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
