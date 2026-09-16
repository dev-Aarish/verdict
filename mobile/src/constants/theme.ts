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
  // Backgrounds
  background: "#09090b", // zinc-950
  surface: "#18181b", // zinc-900
  surfaceElevated: "#27272a", // zinc-800
  surfaceSubtle: "#121215",
  border: "#27272a",
  borderSubtle: "#1f1f23",

  // Text
  text: "#fafafa", // zinc-50
  textMuted: "#a1a1aa", // zinc-400
  textSubtle: "#71717a", // zinc-500

  // Brand / Accents
  primary: "#6366f1", // Indigo 500
  primaryHover: "#4f46e5",
  primaryLight: "#818cf8",
  accent: "#ec4899", // Pink 500
  
  // Taste Score & Status Colors
  gold: "#eab308", // Amber 500
  goldSubtle: "rgba(234, 179, 8, 0.15)",
  emerald: "#10b981", // Emerald 500
  emeraldSubtle: "rgba(16, 185, 129, 0.15)",
  cyan: "#06b6d4",
  rose: "#f43f5e",
  roseSubtle: "rgba(244, 63, 94, 0.15)",
  purple: "#a855f7",
  purpleSubtle: "rgba(168, 85, 247, 0.15)",

  // UI state
  danger: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};
