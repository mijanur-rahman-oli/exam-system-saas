// Shared theme utility — import in all teacher pages
// Usage: const { dark, toggle, vars } = useTheme()
// Apply: <div style={vars}>...</div>

import { useState, useEffect } from "react";

export function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const s = localStorage.getItem("portal-theme");
    if (s) setDark(s === "dark");
  }, []);
  const toggle = () =>
    setDark((v) => {
      localStorage.setItem("portal-theme", !v ? "dark" : "light");
      return !v;
    });
  return { dark, toggle, vars: themeVars(dark) };
}

export function themeVars(dark: boolean): React.CSSProperties {
  return (
    dark
      ? {
          "--bg":          "#0b0e15",
          "--surface":     "#111520",
          "--surface2":    "#181d2a",
          "--surface3":    "#1e2536",
          "--border":      "#232c40",
          "--border2":     "#2c3650",
          "--text":        "#e2e8f4",
          "--text2":       "#7d8fac",
          "--text3":       "#3e4f6a",
          "--accent":      "#4f8ef7",
          "--accent-bg":   "#0c1e3d",
          "--accent-dim":  "#172d56",
          "--blue":        "#4f8ef7",
          "--blue-bg":     "#0c1e3d",
          "--green":       "#34d399",
          "--green-bg":    "#042b1a",
          "--amber":       "#fbbf24",
          "--amber-bg":    "#1f1200",
          "--red":         "#f87171",
          "--red-bg":      "#1f0808",
          "--input-bg":    "#090c13",
          "--shadow":      "0 4px 24px rgba(0,0,0,0.5)",
          "--radius":      "0.75rem",
        }
      : {
          "--bg":          "#eef1f8",
          "--surface":     "#ffffff",
          "--surface2":    "#f4f6fc",
          "--surface3":    "#eaecf5",
          "--border":      "#dce1ef",
          "--border2":     "#c8d0e4",
          "--text":        "#1a2035",
          "--text2":       "#52637d",
          "--text3":       "#a0aec0",
          "--accent":      "#2563eb",
          "--accent-bg":   "#eff4ff",
          "--accent-dim":  "#dbeafe",
          "--blue":        "#2563eb",
          "--blue-bg":     "#eff4ff",
          "--green":       "#059669",
          "--green-bg":    "#ecfdf5",
          "--amber":       "#d97706",
          "--amber-bg":    "#fffbeb",
          "--red":         "#dc2626",
          "--red-bg":      "#fef2f2",
          "--input-bg":    "#f8f9fd",
          "--shadow":      "0 4px 24px rgba(0,0,0,0.07)",
          "--radius":      "0.75rem",
        }
  ) as React.CSSProperties;
}

// ── Shared sidebar layout ─────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { href: "/teacher",                label: "Dashboard",       icon: "⬡" },
  { href: "/teacher/exams/create",   label: "Create Exam",     icon: "＋" },
  { href: "/teacher/exams",          label: "Manage Exams",    icon: "☰" },
  { href: "/teacher/questions/create", label: "Add Question",  icon: "✎" },
  { href: "/teacher/results",        label: "View Results",    icon: "◈" },
];