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
    let base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      borderRadius: Radius.none,
      gap: 4,
    };

    if (size === "sm") {
      base.paddingVertical = 2;
      base.paddingHorizontal = 6;
      base.borderWidth = 1;
    } else {
      base.paddingVertical = 4;
      base.paddingHorizontal = 9;
      base.borderWidth = 1;
    }

    switch (variant) {
      case "brass":
      case "gold":
        base.backgroundColor = Colors.brassSubtle;
        base.borderColor = Colors.brass;
        break;
      case "red":
      case "rose":
        base.backgroundColor = Colors.marqueeRedSubtle;
        base.borderColor = Colors.marqueeRed;
        break;
      case "emerald":
        base.backgroundColor = Colors.emeraldSubtle;
        base.borderColor = Colors.emerald;
        break;
      case "purple":
        base.backgroundColor = Colors.purpleSubtle;
        base.borderColor = Colors.purple;
        break;
      case "primary":
        base.backgroundColor = Colors.brassSubtle;
        base.borderColor = Colors.brass;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderColor = Colors.border;
        break;
      default:
        base.backgroundColor = Colors.velvetElevated;
        base.borderColor = Colors.borderSubtle;
        break;
    }

    return base;
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
