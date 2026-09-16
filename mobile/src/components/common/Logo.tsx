import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Svg, { Rect, Circle, G, Mask, Defs } from "react-native-svg";
import { Colors } from "../../constants/theme";

interface LogoMarkProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function LogoMark({ size = 32, color = "#C9A03C", style }: LogoMarkProps) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <Mask id="clap-stripes-rn" maskUnits="userSpaceOnUse">
            <Rect x="12" y="26" width="40" height="30" fill="#ffffff" />
            <Rect x="8.5" y="-4" width="7" height="60" fill="#000000" transform="rotate(45 12 26)" />
            <Rect x="18.5" y="3.5" width="7" height="60" fill="#000000" transform="rotate(45 22 33.5)" />
            <Rect x="28.5" y="11" width="7" height="60" fill="#000000" transform="rotate(45 32 41)" />
            <Rect x="38.5" y="18.5" width="7" height="60" fill="#000000" transform="rotate(45 42 48.5)" />
            <Rect x="48.5" y="26" width="7" height="60" fill="#000000" transform="rotate(45 52 56)" />
          </Mask>
        </Defs>
        <G transform="rotate(-3 32 32)" fill={color} stroke="none">
          <Rect x="12" y="16" width="40" height="7" rx={1.5} />
          <Circle cx="13" cy="19.5" r={2.5} />
          <Rect x="12" y="26" width="40" height="30" rx={2} mask="url(#clap-stripes-rn)" />
        </G>
      </Svg>
    </View>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  markOnly?: boolean;
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { mark: 20, font: 15, letterSpacing: 2 },
  md: { mark: 26, font: 18, letterSpacing: 2.5 },
  lg: { mark: 36, font: 26, letterSpacing: 3 },
  xl: { mark: 48, font: 32, letterSpacing: 3.5 },
};

export function Logo({
  size = "md",
  color = "#C9A03C",
  markOnly = false,
  style,
}: LogoProps) {
  const config = sizeConfig[size];

  return (
    <View style={[styles.container, style]}>
      <LogoMark size={config.mark} color={color} />
      {!markOnly && (
        <Text
          style={[
            styles.wordmark,
            {
              fontSize: config.font,
              letterSpacing: config.letterSpacing,
            },
          ]}
        >
          VERDICT
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wordmark: {
    color: Colors.text,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
