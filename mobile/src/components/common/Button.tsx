import React from "react";
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { ClapperLoader } from "./ClapperLoader";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "gold" | "brass";
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
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const handlePress = async () => {
    if (loading || disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = (): ViewStyle => {
    let sizeStyle: ViewStyle;
    if (size === "sm") {
      sizeStyle = { paddingVertical: 8, paddingHorizontal: 14, minHeight: 38 };
    } else if (size === "lg") {
      sizeStyle = { paddingVertical: 14, paddingHorizontal: 24, minHeight: 52 };
    } else {
      sizeStyle = { paddingVertical: 11, paddingHorizontal: 18, minHeight: 46 };
    }

    let variantStyle: ViewStyle = {};
    switch (variant) {
      case "primary":
      case "gold":
      case "brass":
        variantStyle = {
          backgroundColor: Colors.brass,
          borderWidth: 1.5,
          borderColor: Colors.brassLight,
        };
        break;
      case "secondary":
        variantStyle = {
          backgroundColor: Colors.velvetElevated,
          borderWidth: 1,
          borderColor: Colors.border,
        };
        break;
      case "outline":
        variantStyle = {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: Colors.borderBrass,
        };
        break;
      case "danger":
        variantStyle = {
          backgroundColor: Colors.marqueeRed,
          borderWidth: 1,
          borderColor: Colors.marqueeRedLight,
        };
        break;
      case "ghost":
        variantStyle = {
          backgroundColor: "transparent",
        };
        break;
    }

    return {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.none,
      gap: Spacing.sm,
      minHeight: 44, // 44pt minimum touch target
      ...sizeStyle,
      ...variantStyle,
      ...(disabled || loading ? { opacity: 0.5 } : {}),
    };
  };

  const getTextStyle = (): TextStyle => {
    const fontSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;

    let color = Colors.paper;
    switch (variant) {
      case "primary":
      case "gold":
      case "brass":
        color = Colors.inkDark;
        break;
      case "danger":
      case "secondary":
        color = Colors.paper;
        break;
      case "outline":
        color = Colors.brass;
        break;
      case "ghost":
        color = Colors.dust;
        break;
    }

    return {
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      fontSize,
      color,
    };
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), animatedStyle, style]}
    >
      {loading ? (
        <ClapperLoader
          size={size === "sm" ? 18 : 22}
          color={
            variant === "primary" || variant === "gold" || variant === "brass"
              ? Colors.inkDark
              : Colors.paper
          }
          inline
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
};
