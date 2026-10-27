import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface BadgeProps {
  label: string;
  variant?: "default" | "gold" | "brass" | "emerald" | "rose" | "purple" | "primary" | "outline" | "red";
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
    const sizeStyle: ViewStyle =
      size === "sm"
        ? { paddingVertical: 2, paddingHorizontal: 6, borderWidth: 1 }
        : { paddingVertical: 4, paddingHorizontal: 9, borderWidth: 1 };

    let variantStyle: ViewStyle;
    switch (variant) {
      case "brass":
      case "gold":
      case "primary":
        variantStyle = { backgroundColor: Colors.brassSubtle, borderColor: Colors.brass };
        break;
      case "red":
      case "rose":
        variantStyle = { backgroundColor: Colors.marqueeRedSubtle, borderColor: Colors.marqueeRed };
        break;
      case "emerald":
        variantStyle = { backgroundColor: Colors.emeraldSubtle, borderColor: Colors.emerald };
        break;
      case "purple":
        variantStyle = { backgroundColor: Colors.purpleSubtle, borderColor: Colors.purple };
        break;
      case "outline":
        variantStyle = { backgroundColor: "transparent", borderColor: Colors.border };
        break;
      default:
        variantStyle = { backgroundColor: Colors.velvetElevated, borderColor: Colors.borderSubtle };
        break;
    }

    return {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      borderRadius: Radius.none,
      gap: 4,
      ...sizeStyle,
      ...variantStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color = Colors.dustLight;
    switch (variant) {
      case "brass":
      case "gold":
      case "primary":
        color = Colors.brassLight;
        break;
      case "red":
      case "rose":
        color = Colors.marqueeRedLight;
        break;
      case "emerald":
        color = "#81C784";
        break;
      case "purple":
        color = "#BA68C8";
        break;
      case "outline":
        color = Colors.dust;
        break;
      default:
        color = Colors.paper;
        break;
    }

    return {
      color,
      fontSize: size === "sm" ? 10 : 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    };
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {icon}
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};
