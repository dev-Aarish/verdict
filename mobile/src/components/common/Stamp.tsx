import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Radius } from "../../constants/theme";

export interface StampProps {
  children: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "brass" | "red" | "paper" | "subtle";
  rotation?: number;
  label?: string;
  animate?: "slam" | "settle" | "none";
  style?: ViewStyle;
}

export function Stamp({
  children,
  size = "md",
  variant = "brass",
  rotation = -3,
  label,
  animate = "none",
  style,
}: StampProps) {
  const scale = useSharedValue(animate === "slam" ? 1.4 : 1);
  const opacity = useSharedValue(animate === "slam" ? 0.2 : 1);

  useEffect(() => {
    if (animate === "slam") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      scale.value = withSequence(
        withSpring(1.0, { damping: 14, stiffness: 220 }),
        withSpring(1.02, { damping: 12, stiffness: 300 }),
        withSpring(1.0, { damping: 16, stiffness: 200 })
      );
      opacity.value = withSpring(1, { damping: 20 });
    } else if (animate === "settle") {
      scale.value = withSequence(
        withSpring(1.05, { damping: 12, stiffness: 180 }),
        withSpring(1.0, { damping: 14, stiffness: 200 })
      );
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    label: TextStyle;
  } => {
    switch (variant) {
      case "red":
        return {
          container: {
            borderColor: Colors.marqueeRed,
            backgroundColor: Colors.marqueeRedSubtle,
          },
          text: { color: Colors.marqueeRedLight },
          label: { color: Colors.marqueeRed },
        };
      case "paper":
        return {
          container: {
            borderColor: Colors.paper,
            backgroundColor: "rgba(236, 235, 230, 0.08)",
          },
          text: { color: Colors.paper },
          label: { color: Colors.dustLight },
        };
      case "subtle":
        return {
          container: {
            borderColor: Colors.dust,
            backgroundColor: "transparent",
          },
          text: { color: Colors.dustLight },
          label: { color: Colors.dust },
        };
      case "brass":
      default:
        return {
          container: {
            borderColor: Colors.brass,
            backgroundColor: Colors.brassSubtle,
          },
          text: { color: Colors.brassLight },
          label: { color: Colors.brass },
        };
    }
  };

  const getSizeStyles = (): {
    container: ViewStyle;
    fontSize: number;
    labelSize: number;
  } => {
    switch (size) {
      case "xs":
        return {
          container: { paddingVertical: 2, paddingHorizontal: 6, borderWidth: 1 },
          fontSize: 12,
          labelSize: 8,
        };
      case "sm":
        return {
          container: { paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1.5 },
          fontSize: 16,
          labelSize: 9,
        };
      case "lg":
        return {
          container: { paddingVertical: 10, paddingHorizontal: 16, borderWidth: 2.5 },
          fontSize: 34,
          labelSize: 11,
        };
      case "xl":
        return {
          container: { paddingVertical: 14, paddingHorizontal: 22, borderWidth: 3 },
          fontSize: 48,
          labelSize: 12,
        };
      case "md":
      default:
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 2 },
          fontSize: 24,
          labelSize: 10,
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <Animated.View
      style={[
        styles.baseContainer,
        variantStyle.container,
        sizeStyle.container,
        animatedStyle,
        style,
      ]}
    >
      {label && (
        <Text
          style={[
            styles.label,
            variantStyle.label,
            { fontSize: sizeStyle.labelSize },
          ]}
        >
          {label}
        </Text>
      )}
      {typeof children === "string" || typeof children === "number" || Array.isArray(children) || !React.isValidElement(children) ? (
        <Text
          style={[
            styles.valueText,
            variantStyle.text,
            { fontSize: sizeStyle.fontSize },
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.none,
    borderStyle: "solid",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  label: {
    textTransform: "uppercase",
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  valueText: {
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
});
