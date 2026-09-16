import React from "react";
import {
  Text,
  ActivityIndicator,
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
    let base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.none,
      gap: Spacing.sm,
      minHeight: 44, // 44pt minimum touch target
    };

    // Size
    if (size === "sm") {
      base = {
        ...base,
        paddingVertical: 8,
        paddingHorizontal: 14,
        minHeight: 38,
      };
    } else if (size === "lg") {
      base = {
        ...base,
        paddingVertical: 14,
        paddingHorizontal: 24,
        minHeight: 52,
      };
    } else {
      base = {
        ...base,
        paddingVertical: 11,
        paddingHorizontal: 18,
        minHeight: 46,
      };
    }

    // Variant
    switch (variant) {
      case "primary":
      case "gold":
      case "brass":
        base.backgroundColor = Colors.brass;
        base.borderWidth = 1.5;
        base.borderColor = Colors.brassLight;
        break;
      case "secondary":
        base.backgroundColor = Colors.velvetElevated;
        base.borderWidth = 1;
        base.borderColor = Colors.border;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderWidth = 1.5;
        base.borderColor = Colors.borderBrass;
        break;
      case "danger":
        base.backgroundColor = Colors.marqueeRed;
        base.borderWidth = 1;
        base.borderColor = Colors.marqueeRedLight;
        break;
      case "ghost":
        base.backgroundColor = "transparent";
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.5;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = {
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    };

    if (size === "sm") {
      base.fontSize = 11;
    } else if (size === "lg") {
      base.fontSize = 14;
    } else {
      base.fontSize = 12;
    }

    switch (variant) {
      case "primary":
      case "gold":
      case "brass":
        base.color = Colors.inkDark;
        break;
      case "danger":
        base.color = Colors.paper;
        break;
      case "secondary":
        base.color = Colors.paper;
        break;
      case "outline":
        base.color = Colors.brass;
        break;
      case "ghost":
        base.color = Colors.dust;
        break;
    }

    return base;
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
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "gold" || variant === "brass" ? Colors.inkDark : Colors.paper}
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
