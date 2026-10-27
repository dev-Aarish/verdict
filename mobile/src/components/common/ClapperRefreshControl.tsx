import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
} from "react";
import {
  FlatList,
  FlatListProps,
  NativeSyntheticEvent,
  NativeScrollEvent,
  PanResponder,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ClapperLoader } from "./ClapperLoader";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export interface ClapperFlatListProps<T>
  extends Omit<FlatListProps<T>, "refreshControl"> {
  refreshing?: boolean;
  onRefresh?: () => any;
  clapperSize?: "sm" | "md";
}

/**
 * ClapperFlatList — Pure custom pull-to-refresh FlatList that completely eliminates
 * the OS native RefreshControl circular spinner on Android & iOS.
 *
 * Uses PanResponder capture to intercept vertical drag down at scrollY <= 0 before
 * Android's native ScrollView steals the touch, providing instant 1:1 finger tracking
 * and tactile haptic feedback.
 */
function ClapperFlatListInner<T>(
  {
    refreshing = false,
    onRefresh,
    clapperSize = "md",
    onScroll: parentOnScroll,
    style,
    ...restProps
  }: ClapperFlatListProps<T>,
  ref: React.ForwardedRef<FlatList<T>>
) {
  const insets = useSafeAreaInsets();
  const targetTop = Math.max(insets.top, 20) + 14;

  const scrollY = useRef(0);
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  // Shared values driving the clapperboard motion
  const pullProgress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-30);

  const isRefreshingActive = refreshing || internalRefreshing;

  const triggerRefresh = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setInternalRefreshing(true);
    pullProgress.value = withTiming(60, { duration: 100 });

    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => {
        setInternalRefreshing(false);
        pullProgress.value = withTiming(0, { duration: 200 });
      }, 600);
    }
  }, [onRefresh, pullProgress]);

  // Sync state changes from parent `refreshing`
  useEffect(() => {
    if (isRefreshingActive) {
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withSpring(targetTop, {
        damping: 16,
        stiffness: 240,
        mass: 0.6,
      });
    } else {
      pullProgress.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(0, { duration: 140, easing: EASE_OUT });
      translateY.value = withTiming(-30, { duration: 180, easing: EASE_OUT });
    }
  }, [isRefreshingActive, targetTop, opacity, translateY, pullProgress]);

  // Keep scroll position tracked
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      scrollY.current = y;

      if (Platform.OS === "ios" && y < 0 && !isRefreshingActive) {
        const dist = Math.min(Math.abs(y), 90);
        pullProgress.value = dist;
      }

      parentOnScroll?.(e);
    },
    [isRefreshingActive, parentOnScroll, pullProgress]
  );

  // PanResponder to intercept drag down on Android before native ScrollView consumes it
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Intercept when at top and pulling downward
        const isDraggingDown = gestureState.dy > 6;
        const isVertical =
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2;
        return (
          scrollY.current <= 1 &&
          isDraggingDown &&
          isVertical &&
          !isRefreshingActive
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isRefreshingActive) {
          const dist = Math.min(Math.max(0, gestureState.dy) * 0.55, 90);
          pullProgress.value = dist;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isRefreshingActive) {
          if (gestureState.dy > 50) {
            triggerRefresh();
          } else {
            pullProgress.value = withTiming(0, {
              duration: 180,
              easing: EASE_OUT,
            });
          }
        }
      },
      onPanResponderTerminate: () => {
        if (!isRefreshingActive) {
          pullProgress.value = withTiming(0, {
            duration: 180,
            easing: EASE_OUT,
          });
        }
      },
    })
  ).current;

  const animStyle = useAnimatedStyle(() => {
    if (isRefreshingActive) {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
      };
    }

    const currentPull = pullProgress.value;
    const currentOpacity = interpolate(
      currentPull,
      [0, 8, 40],
      [0, 0.4, 1],
      Extrapolation.CLAMP
    );
    const currentY = interpolate(
      currentPull,
      [0, 60],
      [-30, targetTop],
      Extrapolation.CLAMP
    );

    return {
      opacity: currentOpacity,
      transform: [{ translateY: currentY }],
    };
  });

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      <FlatList
        ref={ref}
        {...restProps}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={undefined} // Ensures ZERO native circular spinner is mounted
      />

      {/* Signature Clapperboard Floating Content Overlay */}
      <View style={styles.overlayContainer} pointerEvents="none">
        <Animated.View style={[styles.clapperWrapper, animStyle]}>
          <ClapperLoader size={clapperSize === "sm" ? 22 : 30} />
        </Animated.View>
      </View>
    </View>
  );
}

export const ClapperFlatList = forwardRef(ClapperFlatListInner) as <T>(
  props: ClapperFlatListProps<T> & { ref?: React.ForwardedRef<FlatList<T>> }
) => React.ReactElement;

export function ClapperRefreshHeader(_props: any) {
  return null;
}

export function ClapperRefreshControl(_props: any) {
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 20,
    alignItems: "center",
    pointerEvents: "none",
  },
  clapperWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});
