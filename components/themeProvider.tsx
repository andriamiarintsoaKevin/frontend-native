import React, { createContext, useContext, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

export const stitchColors = {
  primary: "#06B6D4",
  primaryLight: "#4CD7F6",
  primaryDark: "#003640",
  secondary: "#8B5CF6",
  tertiary: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  bgDark: "#0B0F17",
  surface: "#0F131C",
  card: "#131B2A",
  cardElevated: "#1C2028",
  cardHigh: "#262A33",
  border: "#1E293B",
  borderLight: "#334155",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
} as const;

export const themeColors = {
  light: {
    background: "#F5F7FB",
    surface: "#FFFFFF",
    surfaceMuted: "#F3F4F6",
    primary: "#06B6D4",
    primarySoft: "#E0F2FE",
    text: "#0F172A",
    textMuted: "#64748B",
    border: "#E2E8F0",
    line: "#E2E8F0",
    inputBg: "#F8FAFC",
    inputBorder: "#CBD5E1",
    onPrimary: "#FFFFFF",
    stitchPrimary: stitchColors.primary,
    stitchSecondary: stitchColors.secondary,
    stitchTertiary: stitchColors.tertiary,
    stitchWarning: stitchColors.warning,
    stitchError: stitchColors.error,
    stitchCard: "#FFFFFF",
    stitchCardElevated: "#F8FAFC",
    stitchBorder: "#E2E8F0",
    stitchDarkBg: stitchColors.bgDark,
  },
  dark: {
    background: stitchColors.bgDark,
    surface: "#131B2A",
    surfaceMuted: "#1C2028",
    primary: "#06B6D4",
    primarySoft: "#003640",
    text: "#F8FAFC",
    textMuted: "#94A3B8",
    border: "#1E293B",
    line: "#334155",
    inputBg: "#0B0F17",
    inputBorder: "#1E293B",
    onPrimary: "#0B0F17",
    stitchPrimary: stitchColors.primary,
    stitchSecondary: stitchColors.secondary,
    stitchTertiary: stitchColors.tertiary,
    stitchWarning: stitchColors.warning,
    stitchError: stitchColors.error,
    stitchCard: stitchColors.card,
    stitchCardElevated: stitchColors.cardElevated,
    stitchBorder: stitchColors.border,
    stitchDarkBg: stitchColors.bgDark,
  },
} as const;

type ThemeContextType = {
  theme: ThemeMode;
  colors: (typeof themeColors)[ThemeMode];
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  const value = useMemo(
    () => ({
      theme,
      colors: themeColors[theme],
      toggleTheme: () =>
        setThemeState((current) => (current === "light" ? "dark" : "light")),
      setTheme: (nextTheme: ThemeMode) => setThemeState(nextTheme),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};
