import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "glassy";
const STORAGE_KEY = "hbl-mis-appearance";
const ORDER: Theme[] = ["light", "dark", "glassy"];
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void } | null>(null);

function parse(value: string | null): Theme {
  return value === "dark" || value === "glassy" ? value : "light";
}

/** Glassy builds on the dark palette, so it applies both classes. */
function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme !== "light");
  root.classList.toggle("glassy", theme === "glassy");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const next = parse(localStorage.getItem(STORAGE_KEY));
      apply(next);
      setThemeState(next);
    } catch {
      // Appearance remains usable when browser storage is unavailable.
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = parse(event.newValue);
      apply(next);
      setThemeState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function setTheme(next: Theme) {
    apply(next);
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Switching still works for this visit without persistence.
    }
  }

  function toggleTheme() {
    setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "light");
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
