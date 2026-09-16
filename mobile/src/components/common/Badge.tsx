import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface BadgeProps {
  label: string;
  variant?: "default" | "gold" | "emerald" | "rose" | "purple" | "primary" | "outline";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "default",
  size = "md",
  icon,
  style,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      borderRadius: Radius.full,
      gap: 4,
    };

    if (size === "sm") {
      base.paddingVertical = 2;
      base.paddingHorizontal = 8;
    } else {
      base.paddingVertical = 4;
      base.paddingHorizontal = 10;
    }

    switch (variant) {
      case "gold":
        base.backgroundColor = Colors.goldSubtle;
        base.borderColor = "rgba(234, 179, 8, 0.4)";
        base.borderWidth = 1;
        break;
      case "emerald":
        base.backgroundColor = Colors.emeraldSubtle;
        base.borderColor = "rgba(16, 185, 129, 0.4)";
        base.borderWidth = 1;
        break;
      case "rose":
        base.backgroundColor = Colors.roseSubtle;
        base.borderColor = "rgba(244, 63, 94, 0.4)";
        base.borderWidth = 1;
        break;
      case "purple":
        base.backgroundColor = Colors.purpleSubtle;
        base.borderColor = "rgba(168, 85, 247, 0.4)";
        base.borderWidth = 1;
        break;
      case "primary":
        base.backgroundColor = "rgba(99, 102, 241, 0.15)";
        base.borderColor = "rgba(99, 102, 241, 0.4)";
        base.borderWidth = 1;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderColor = Colors.border;
        base.borderWidth = 1;
        break;
      default:
        base.backgroundColor = Colors.surfaceElevated;
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let color = Colors.textMuted;
    switch (variant) {
      case "gold":
        color = Colors.gold;
        break;
      case "emerald":
        color = Colors.emerald;
        break;
      case "rose":
        color = Colors.rose;
        break;
      case "purple":
        color = Colors.purple;
        break;
      case "primary":
        color = Colors.primaryLight;
        break;
      case "outline":
        color = Colors.textSubtle;
        break;
      default:
        color = Colors.text;
        break;
    }

    return {
      color,
      fontSize: size === "sm" ? 11 : 12,
      fontWeight: "600",
    };
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {icon}
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};
