import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { dataApi } from "../lib/dataApi";

const ThemeContext = createContext(null);
const STORAGE_KEY = "bible-plan-theme";

// Ordered from the original defaults, through color palettes, to accessibility.
export const THEMES = [
  { id: "dark", label: "Original", swatches: ["#1e303c", "#b3862e"] },
  { id: "light", label: "Original (Light)", swatches: ["#f1e7d2", "#96690b"] },
  { id: "full-dark", label: "Full Dark", swatches: ["#000000", "#171717"] },
  { id: "full-light", label: "Full Light", swatches: ["#ffffff", "#f5f5f5"] },
  { id: "cream-paper", label: "Cream Paper", swatches: ["#f7efd9", "#e8d9b5"] },
  { id: "green-outline", label: "Green Outline", swatches: ["#ffffff", "#23834a"] },
  { id: "orange-white", label: "Orange & White", swatches: ["#ffffff", "#f07822"] },
  { id: "yellow-brown", label: "Yellow & Brown", swatches: ["#d5a900", "#4a2c18"] },
  { id: "red-white", label: "Red & White", swatches: ["#fffafa", "#c62828"] },
  { id: "sky-yellow", label: "Light Blue & Light Yellow", swatches: ["#dff3ff", "#fff2b2"] },
  { id: "navy-black", label: "Dark Blue & Black", swatches: ["#071426", "#102f55"] },
  { id: "gray", label: "Gray", swatches: ["#303238", "#aeb3bc"] },
  { id: "neon-yellow", label: "Neon Yellow", swatches: ["#101010", "#faff00"] },
  { id: "neon-green", label: "Neon Green", swatches: ["#08130d", "#39ff14"] },
  { id: "neon-purple", label: "Neon Purple", swatches: ["#10081c", "#c34dff"] },
  { id: "high-contrast", label: "High Contrast", swatches: ["#000000", "#ffff00"] },
  { id: "neon", label: "Neon (Classic)", swatches: ["#101020", "#39ffb6"] },
  { id: "device", label: "Device", swatches: ["#1e303c", "#f1e7d2"] },
];

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState(() => localStorage.getItem(STORAGE_KEY) || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!user) return;
    dataApi.getSettings().then(({ data }) => {
      if (data?.theme && THEMES.some((theme) => theme.id === data.theme)) setModeState(data.theme);
    }).catch(() => {});
  }, [user]);

  const setMode = (next) => {
    if (!THEMES.some((theme) => theme.id === next)) return;
    setModeState(next);
    if (user) dataApi.saveSettings({ theme: next });
  };

  const value = useMemo(() => ({ mode, setMode, themes: THEMES }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
