import React, { useEffect } from "react";
import { StyleSheet, RefreshControl, RefreshControlProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { ClapperLoader } from "./ClapperLoader";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export interface ClapperRefreshHeaderProps {
  /** Whether the parent query is actively refetching */
  refreshing: boolean;
  /** Size preset for the clapper */
  size?: "sm" | "md";
}

/**
 * ClapperRefreshHeader — Renders at the top of list content.
 * When `refreshing` is true, it smoothly expands into view with the clapping
 * clapperboard, replacing the circular spinner with Verdict's signature mark.
 */
export function ClapperRefreshHeader({
  refreshing,
  size = "md",
}: ClapperRefreshHeaderProps) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (refreshing) {
      height.value = withTiming(52, { duration: 250, easing: EASE_OUT });
      opacity.value = withTiming(1, { duration: 200, easing: EASE_OUT });
    } else {
      height.value = withTiming(0, { duration: 200, easing: EASE_OUT });
      opacity.value = withTiming(0, { duration: 150, easing: EASE_OUT });
    }
    return () => {
      cancelAnimation(height);
      cancelAnimation(opacity);
    };
  }, [refreshing]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  }));

  return (
    <Animated.View style={animStyle}>
      {refreshing && <ClapperLoader size={size === "sm" ? 22 : 30} />}
    </Animated.View>
  );
}

/**
 * ClapperRefreshControl — Suppresses the native circular spinner on iOS and Android
 * so the ClapperRefreshHeader can serve as the sole loading indicator.
 */
export function ClapperRefreshControl(props: RefreshControlProps) {
  return (
    <RefreshControl
      {...props}
      tintColor="transparent"
      colors={["transparent"]}
      progressBackgroundColor="transparent"
      progressViewOffset={-1000}
      style={styles.refreshControl}
    />
  );
}

const styles = StyleSheet.create({
  refreshControl: {
    backgroundColor: "transparent",
  },
});
