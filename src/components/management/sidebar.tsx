import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "performance", label: "Performance", Icon: TrendingUp },
  { id: "customers", label: "Customers", Icon: Users },
  { id: "products", label: "Products", Icon: Package },
  { id: "sales-team", label: "Sales Team", Icon: UserRound },
  { id: "reports", label: "Reports", Icon: FileText },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"] | "settings";

type Props = {
  active: NavId;
  onSelect: (id: NavId) => void;
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ active, onSelect, open, onClose }: Props) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[116px] flex-col bg-[#052B55] py-4",
          "transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-center pb-4">
          <BarChart3 className="h-7 w-7 text-white" strokeWidth={2} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-2 top-3 text-white/70 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={[
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-[#0969E8] text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                <span className="text-center leading-tight">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-2">
          <button
            type="button"
            onClick={() => onSelect("settings")}
            className={[
              "flex w-full flex-col items-center gap-1 rounded-lg px-2 py-3 text-[11px] font-medium transition-colors",
              active === "settings"
                ? "bg-[#0969E8] text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.9} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
