"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="glass flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-200/80 [.light_&]:hover:text-slate-900 [.light_&]:focus-visible:ring-offset-white"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
