import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { dataApi } from "../lib/dataApi";

const ThemeContext = createContext(null);
const STORAGE_KEY = "bible-plan-theme"; // "dark" | "light" | "device"

function resolveMode(mode) {
  if (mode === "device") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return mode;
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState(() => localStorage.getItem(STORAGE_KEY) || "dark");

  useEffect(() => {
    const resolved = resolveMode(mode);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Follow the OS if the user picked "device".
  useEffect(() => {
    if (mode !== "device") return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => document.documentElement.setAttribute("data-theme", resolveMode("device"));
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  // Pull the saved theme preference once a user signs in.
  useEffect(() => {
    if (!user) return;
    dataApi.getSettings().then(({ data }) => {
      if (data?.theme) setModeState(data.theme);
    });
  }, [user]);

  const setMode = (next) => {
    setModeState(next);
    if (user) dataApi.saveSettings({ theme: next });
  };

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
