import React from "react";
import { View, StyleSheet, ViewStyle, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "glass" | "subtle" | "brass";
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = "default",
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const handlePress = () => {
    if (!onPress) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      borderRadius: Radius.none,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.velvet,
    };

    switch (variant) {
      case "elevated":
        base.backgroundColor = Colors.velvetElevated;
        base.borderColor = "rgba(197, 165, 114, 0.3)";
        break;
      case "brass":
        base.backgroundColor = Colors.velvetElevated;
        base.borderColor = Colors.brass;
        base.borderWidth = 1.5;
        break;
      case "glass":
        base.backgroundColor = "rgba(28, 29, 38, 0.85)";
        base.borderColor = "rgba(197, 165, 114, 0.25)";
        break;
      case "subtle":
        base.backgroundColor = Colors.velvetSubtle;
        base.borderColor = Colors.borderSubtle;
        break;
      default:
        base.backgroundColor = Colors.velvet;
        base.borderColor = Colors.border;
        break;
    }

    return base;
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[getContainerStyle(), animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[getContainerStyle(), style]}>{children}</View>;
};
