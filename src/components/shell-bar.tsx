import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, HelpCircle, LogOut, Search, User } from "lucide-react";
import { adminNavForScreens } from "@/lib/nav";
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
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-shell px-4 text-shell-foreground">
      <Link to="/launchpad" className="flex items-center gap-2">
        <span className="rounded-sm bg-primary px-2 py-1 text-[13px] font-bold tracking-[0.18em] text-primary-foreground">
          NEXUS
        </span>
      </Link>
      <span className="hidden text-xs text-shell-muted sm:inline">Procurement Analytics</span>

      <span className="mx-auto text-sm font-medium">{title}</span>


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
          className="hidden rounded-full p-2 transition-colors hover:bg-shell-foreground/10 sm:inline-flex"
        >
          <Bell className="size-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="hidden rounded-full p-2 transition-colors hover:bg-shell-foreground/10 sm:inline-flex"
        >
          <HelpCircle className="size-[18px]" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account"
            className="ml-1 flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-shell-foreground/10"
          >
            <span className="grid size-8 place-items-center rounded-full bg-shell-foreground/15">
              <User className="size-4" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{displayName ?? "Signed in"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
