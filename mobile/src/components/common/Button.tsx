import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const handlePress = async () => {
    if (loading || disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore if haptics unavailable
    }
    await onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.md,
      gap: Spacing.sm,
    };

    // Size
    if (size === "sm") {
      base = { ...base, paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.sm };
    } else if (size === "lg") {
      base = { ...base, paddingVertical: 16, paddingHorizontal: 24, borderRadius: Radius.lg };
    } else {
      base = { ...base, paddingVertical: 12, paddingHorizontal: 18 };
    }

    // Variant
    switch (variant) {
      case "primary":
        base.backgroundColor = Colors.primary;
        break;
      case "secondary":
        base.backgroundColor = Colors.surfaceElevated;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderWidth = 1;
        base.borderColor = Colors.border;
        break;
      case "danger":
        base.backgroundColor = Colors.danger;
        break;
      case "gold":
        base.backgroundColor = Colors.gold;
        break;
      case "ghost":
        base.backgroundColor = "transparent";
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.55;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = {
      fontWeight: "600",
    };

    if (size === "sm") {
      base.fontSize = 13;
    } else if (size === "lg") {
      base.fontSize = 16;
    } else {
      base.fontSize = 14;
    }

    switch (variant) {
      case "primary":
      case "danger":
      case "secondary":
        base.color = "#ffffff";
        break;
      case "gold":
        base.color = "#000000";
        break;
      case "outline":
        base.color = Colors.text;
        break;
      case "ghost":
        base.color = Colors.textMuted;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "gold" ? "#000" : "#fff"}
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
