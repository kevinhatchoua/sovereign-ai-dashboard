"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeId =
  | "light"
  | "dark"
  | "high-contrast-light"
  | "high-contrast-dark";

const THEME_IDS: ThemeId[] = [
  "light",
  "dark",
  "high-contrast-light",
  "high-contrast-dark",
];

function isValidTheme(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

const STORAGE_KEY_THEME = "sovereign-theme";
const STORAGE_KEY_GLASS = "sovereign-glass";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  glassMode: boolean;
  setGlassMode: (on: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("light");
  const [glassMode, setGlassModeState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    const storedGlass = localStorage.getItem(STORAGE_KEY_GLASS);
    if (storedTheme && isValidTheme(storedTheme)) {
      setThemeState(storedTheme);
    }
    if (storedGlass !== null) {
      setGlassModeState(storedGlass === "true");
    }
  }, []);

  const setTheme = useCallback(
    (next: ThemeId) => {
      setThemeState(next);
      if (mounted) {
        localStorage.setItem(STORAGE_KEY_THEME, next);
        applyThemeToDocument(next, glassMode);
      }
    },
    [mounted, glassMode]
  );

  const setGlassMode = useCallback(
    (on: boolean) => {
      setGlassModeState(on);
      if (mounted) {
        localStorage.setItem(STORAGE_KEY_GLASS, on ? "true" : "false");
        applyThemeToDocument(theme, on);
      }
    },
    [mounted, theme]
  );

  useEffect(() => {
    if (!mounted) return;
    applyThemeToDocument(theme, glassMode);
  }, [mounted, theme, glassMode]);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, glassMode, setGlassMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

function applyThemeToDocument(theme: ThemeId, glassMode: boolean) {
  const root = document.documentElement;
  root.classList.remove(
    "light",
    "dark",
    "high-contrast",
    "solid-ui"
  );
  const isHighContrast =
    theme === "high-contrast-light" || theme === "high-contrast-dark";
  const base = theme.startsWith("high-contrast-light")
    ? "light"
    : theme.startsWith("high-contrast-dark")
      ? "dark"
      : theme;
  root.classList.add(base);
  if (isHighContrast) root.classList.add("high-contrast");
  if (!glassMode) root.classList.add("solid-ui");
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
