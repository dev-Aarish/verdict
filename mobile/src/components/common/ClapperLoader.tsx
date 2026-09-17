import React, { useEffect, useId } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import Svg, { Rect, Circle, Mask, Defs } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  interpolate,
  Extrapolation,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { Colors } from "../../constants/theme";

// Standardized easing curves from design system (Emil Kowalski / Apple UI)
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export interface ClapperLoaderProps {
  /** Preset size or custom pixel size */
  size?: "sm" | "md" | "lg" | "xl" | number;
  /** Color hex code or theme override */
  color?: string;
  /** Theme variant */
  variant?: "brass" | "paper" | "dust";
  /** Optional status text rendered alongside the clapper */
  label?: string;
  /** Horizontal inline layout (ideal for buttons, search rows) */
  inline?: boolean;
  /** Expand to fill screen/container and center */
  fullScreen?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const sizePresetMap: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 20,
  md: 36,
  lg: 52,
  xl: 68,
};

const labelSizeMap: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 10,
  md: 11,
  lg: 13,
  xl: 14,
};

/**
 * ClapperLoader — Verdict's signature cinematic loading animation.
 * Replaces generic ActivityIndicator spinners with a tactile, off-axis clapperboard
 * that repeatedly opens, holds anticipation, snaps shut, and absorbs recoil shock.
 * Runs 100% on the Reanimated UI thread runtime for stutter-free 120fps motion.
 */
export function ClapperLoader({
  size = "md",
  color,
  variant = "brass",
  label,
  inline = false,
  fullScreen = false,
  style,
  labelStyle,
}: ClapperLoaderProps) {
  const rawId = useId();
  const maskId = `clapper-stripes-mobile-${rawId.replace(/[^a-zA-Z0-9-_]/g, "")}`;

  const resolvedWidth = typeof size === "number" ? size : sizePresetMap[size] ?? 36;
  // Aspect ratio accommodates the stick swinging wide up to the top without clipping
  const resolvedHeight = Math.round(resolvedWidth * (78 / 64));
  const resolvedLabelSize =
    typeof size === "string" ? labelSizeMap[size] ?? 11 : 11;

  const resolvedColor =
    color ??
    (variant === "paper"
      ? Colors.paper
      : variant === "dust"
      ? Colors.dustLight
      : Colors.brass);

  // Base grid scale (64x78 viewBox with headroom for the clapper arm swinging up)
  const scale = resolvedWidth / 64;
  // Hinge pin position on the 64x78 coordinate grid:
  // x=13, y=21.5 (in viewBox starting at y=-14, relative y is 21.5 - (-14) = 35.5)
  const pinLeft = 13 * scale;
  const pinTop = 35.5 * scale;
  const stickWidth = 40 * scale;
  const stickHeight = 7 * scale;
  // Stick rect starts at x=12, y=18 -> relative to pin: left=-1, top=-3.5
  const stickOffsetLeft = -1 * scale;
  const stickOffsetTop = -3.5 * scale;
  const pinRadius = 2.5 * scale;

  const shouldReduceMotion = useReducedMotion();

  // Continuous normalized progress driver (0 -> 1 over 560ms)
  const progress = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (shouldReduceMotion) {
      progress.value = 0;
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 900, easing: EASE_IN_OUT }),
          withTiming(1.0, { duration: 900, easing: EASE_IN_OUT })
        ),
        -1,
        true
      );
      return () => {
        cancelAnimation(pulseOpacity);
      };
    }

    pulseOpacity.value = 1;
    progress.value = 0;
    // Snappy continuous loop: withSequence resets to 0 instantly, avoiding Reanimated timing cache reuse
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 560, easing: Easing.linear }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(progress);
      cancelAnimation(pulseOpacity);
    };
  }, [shouldReduceMotion]);

  // Derived rotations & recoils calculated frame-by-frame on the UI thread (Zero dead-time)
  const stickAnimatedStyle = useAnimatedStyle(() => {
    // 0.00 -> 0.44 (246ms): Swing up from 0° to -36°
    // 0.44 -> 0.68 (134ms): Snap slam down to 0°
    // 0.68 -> 0.76 (45ms): Micro-rebound to -2.5°
    // 0.76 -> 0.84 (45ms): Settle to 0.5°
    // 0.84 -> 1.00 (90ms): Immediate transition to 0° and next clap
    const rot = interpolate(
      progress.value,
      [0, 0.44, 0.68, 0.76, 0.84, 1.0],
      [0, -36, 0, -2.5, 0.5, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ rotate: `${rot}deg` }],
    };
  });

  const boardAnimatedStyle = useAnimatedStyle(() => {
    // Impact recoil dip on the exact slam frame (0.68)
    const recoilY = interpolate(
      progress.value,
      [0, 0.68, 0.74, 0.82, 0.90, 1.0],
      [0, 0, 1.8, -0.8, 0.3, 0],
      Extrapolation.CLAMP
    );
    // Rotational shudder on impact
    const shakeRot = interpolate(
      progress.value,
      [0, 0.68, 0.74, 0.82, 0.90, 1.0],
      [0, 0, 1.3, -1.0, 0.4, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { rotate: `${-3 + shakeRot}deg` },
        { translateY: recoilY },
      ],
      opacity: pulseOpacity.value,
    };
  });

  const markElement = (
    <Animated.View
      style={[
        { width: resolvedWidth, height: resolvedHeight },
        boardAnimatedStyle,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={label || "Loading"}
    >
      {/* Layer 1: Slate with diagonal stripes + permanent hinge rivet */}
      <Svg
        width={resolvedWidth}
        height={resolvedHeight}
        viewBox="0 -14 64 78"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <Mask id={maskId} maskUnits="userSpaceOnUse">
            <Rect x="12" y="26" width="40" height="30" fill="#ffffff" />
            <Rect x="8.5" y="-4" width="7" height="60" fill="#000000" transform="rotate(45 12 26)" />
            <Rect x="18.5" y="3.5" width="7" height="60" fill="#000000" transform="rotate(45 22 33.5)" />
            <Rect x="28.5" y="11" width="7" height="60" fill="#000000" transform="rotate(45 32 41)" />
            <Rect x="38.5" y="18.5" width="7" height="60" fill="#000000" transform="rotate(45 42 48.5)" />
            <Rect x="48.5" y="26" width="7" height="60" fill="#000000" transform="rotate(45 52 56)" />
          </Mask>
        </Defs>
        <Rect
          x="12"
          y="26"
          width="40"
          height="30"
          rx={2}
          fill={resolvedColor}
          mask={`url(#${maskId})`}
        />
        {/* Stationary hinge pin rivet on the slate */}
        <Circle cx="13" cy="21.5" r={2.5} fill={resolvedColor} />
      </Svg>

      {/* Layer 2: Hinged clapper stick (anchored strictly at the top-left hinge pin) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: pinLeft,
            top: pinTop,
            width: 0,
            height: 0,
          },
          stickAnimatedStyle,
        ]}
      >
        {/* Stick arm extending from x=-1 to x=+39 relative to pin */}
        <Svg
          width={stickWidth}
          height={stickHeight}
          viewBox="0 0 40 7"
          style={{
            position: "absolute",
            left: stickOffsetLeft,
            top: stickOffsetTop,
            width: stickWidth,
            height: stickHeight,
          }}
        >
          <Rect x="0" y="0" width="40" height="7" rx="1.5" fill={resolvedColor} />
        </Svg>
        {/* Hinge cap on the moving arm */}
        <View
          style={{
            position: "absolute",
            left: -pinRadius,
            top: -pinRadius,
            width: pinRadius * 2,
            height: pinRadius * 2,
            borderRadius: pinRadius,
            backgroundColor: resolvedColor,
          }}
        />
      </Animated.View>
    </Animated.View>
  );

  const labelElement = label ? (
    <Text
      style={[
        styles.label,
        {
          fontSize: resolvedLabelSize,
          color: variant === "paper" ? Colors.paper : Colors.dustLight,
        },
        labelStyle,
      ]}
    >
      {label}
    </Text>
  ) : null;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, style]}>
        {markElement}
        {labelElement}
      </View>
    );
  }

  if (inline) {
    return (
      <View style={[styles.inlineContainer, style]}>
        {markElement}
        {labelElement}
      </View>
    );
  }

  return (
    <View style={[styles.blockContainer, style]}>
      {markElement}
      {labelElement}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 14,
    backgroundColor: Colors.background,
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  blockContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  label: {
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 1.6,
    textAlign: "center",
  },
});
