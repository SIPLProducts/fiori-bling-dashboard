import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, HelpCircle, Home, LogOut, Search, Settings, User } from "lucide-react";
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
  launchpad = false,
}: {
  title: string;
  displayName?: string | null | undefined;
  screens?: string[] | undefined;
  launchpad?: boolean;
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
    <header className={`sticky top-0 z-40 flex items-center gap-3 bg-shell px-4 text-shell-foreground ${launchpad ? "h-10" : "h-14"}`}>
      <Link to="/launchpad" className="flex min-w-0 items-center gap-2">
        <span className={`grid shrink-0 place-items-center overflow-hidden bg-shell-foreground/14 ${launchpad ? "h-7 rounded-lg px-1.5" : "h-8 rounded-sm px-2"}`}>
          <img src={hblLogo} alt="HBL" className={launchpad ? "h-4 w-auto object-contain brightness-0 invert" : "h-6 w-auto object-contain"} />
        </span>
        {launchpad ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-semibold tracking-wide">MIS PORTAL</span>
          </span>
        ) : null}
      </Link>
      <span className="flex-1" aria-hidden="true" />


      <div className="flex items-center gap-1">
        <Link
          to="/launchpad"
          aria-label="Home"
          title="Home"
          className={`${launchpad ? "hidden" : ""} rounded-full p-2 transition-colors hover:bg-shell-foreground/10`}
        >
          <Home className="size-[18px]" />
        </Link>
        <button
          type="button"
          aria-label="Search"
          className={`${launchpad ? "hidden" : ""} rounded-full p-2 transition-colors hover:bg-shell-foreground/10`}
        >
          <Search className="size-[18px]" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className={`rounded-full transition-colors hover:bg-shell-foreground/10 ${launchpad ? "inline-flex items-center gap-1 px-2 py-1 text-[10px]" : "hidden p-2 sm:inline-flex"}`}
        >
          <Bell className={launchpad ? "size-3.5" : "size-[18px]"} />
          {launchpad ? <span className="hidden sm:inline">Alerts</span> : null}
        </button>
        {launchpad ? (
          <button type="button" aria-label="Settings" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] transition-colors hover:bg-shell-foreground/10">
            <Settings className="size-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        ) : null}
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
            className="ml-1 flex min-w-0 items-center gap-2 rounded-full p-1 transition-colors hover:bg-shell-foreground/10"
          >
            <span className={`grid shrink-0 place-items-center rounded-full bg-shell-foreground/15 ${launchpad ? "size-6 text-[10px] font-semibold" : "size-8"}`}>
              {launchpad ? "SA" : <User className="size-4" />}
            </span>
            {launchpad ? <span className="hidden max-w-28 truncate pr-1 text-[10px] sm:block">{displayName ?? "Signed in"}</span> : null}
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
    </header>
  );
}
