import { Platform } from "react-native";
import Constants from "expo-constants";

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Production Render Backend fallback
  return "https://verdict-api-cgu6.onrender.com/api";
}

export const API_BASE_URL = getApiBaseUrl();

export const Colors = {
  // Screening Room at Dusk Palette
  ink: "#14151D",
  inkDark: "#0E0F14",
  inkElevated: "#1A1C27",
  velvet: "#1C1D26",
  velvetElevated: "#252733",
  velvetSubtle: "#161720",

  // Backgrounds & Surfaces mapped
  background: "#14151D",
  surface: "#1C1D26",
  surfaceElevated: "#252733",
  surfaceSubtle: "#161720",

  // Borders & Accents
  hairline: "rgba(197, 165, 114, 0.2)",
  border: "rgba(197, 165, 114, 0.2)",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  borderBrass: "#C5A572",
  borderLight: "rgba(255, 255, 255, 0.15)",

  // Typography
  paper: "#ECEBE6",
  paperDim: "#D5D4CE",
  dust: "#7A7875",
  dustLight: "#9E9C96",
  dustDark: "#4A4947",

  // Text aliases
  text: "#ECEBE6",
  textMuted: "#9E9C96",
  textSubtle: "#7A7875",

  // Brand Accents
  brass: "#C5A572",
  brassLight: "#D9BE8E",
  brassDark: "#9E7F4C",
  brassSubtle: "rgba(197, 165, 114, 0.15)",
  brassGlow: "rgba(197, 165, 114, 0.3)",

  marqueeRed: "#A93226",
  marqueeRedLight: "#C0392B",
  marqueeRedSubtle: "rgba(169, 50, 38, 0.2)",

  // Aliases for compatibility
  primary: "#C5A572",
  primaryHover: "#D9BE8E",
  primaryLight: "#D9BE8E",
  accent: "#A93226",

  // Status & Score Colors
  gold: "#C5A572",
  goldSubtle: "rgba(197, 165, 114, 0.15)",
  emerald: "#2E7D32",
  emeraldSubtle: "rgba(46, 125, 50, 0.2)",
  cyan: "#4A90E2",
  rose: "#A93226",
  roseSubtle: "rgba(169, 50, 38, 0.2)",
  purple: "#8E44AD",
  purpleSubtle: "rgba(142, 68, 173, 0.2)",

  // UI state
  danger: "#A93226",
  success: "#2E7D32",
  warning: "#D4AC0D",
  info: "#3498DB",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Typography = {
  titleHero: { fontSize: 28, fontWeight: "900" as const, letterSpacing: -0.5 },
  titleSection: { fontSize: 18, fontWeight: "800" as const, letterSpacing: 0.5 },
  titleCard: { fontSize: 15, fontWeight: "700" as const },
  body: { fontSize: 14, color: Colors.paper, lineHeight: 20 },
  bodySubtle: { fontSize: 13, color: Colors.dust, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1 },
  mono: { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
};
