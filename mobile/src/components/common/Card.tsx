import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "glass" | "subtle";
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = "default",
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
    };

    switch (variant) {
      case "elevated":
        base.backgroundColor = Colors.surfaceElevated;
        base.borderColor = "#3f3f46";
        break;
      case "glass":
        base.backgroundColor = "rgba(24, 24, 27, 0.75)";
        base.borderColor = "rgba(255, 255, 255, 0.08)";
        break;
      case "subtle":
        base.backgroundColor = Colors.surfaceSubtle;
        base.borderColor = Colors.borderSubtle;
        break;
      default:
        base.backgroundColor = Colors.surface;
        break;
    }

    return base;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[getContainerStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getContainerStyle(), style]}>{children}</View>;
};
