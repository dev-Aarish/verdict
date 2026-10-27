# 001 — Polish pull-to-refresh header expansion and loading animation

- **Status**: DONE
- **Commit**: 8d9b486
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 1 file (`mobile/src/components/common/ClapperRefreshControl.tsx`)

## Problem

When performing pull-to-refresh on the homepage (`mobile/src/app/(tabs)/index.tsx`) or other screens (`watchlist.tsx`, `profile.tsx`, `user/[username].tsx`), the refresh indicator animation feels late, sluggish, and slightly laggy.

There are three primary causes in `mobile/src/components/common/ClapperRefreshControl.tsx`:

1. **Lazy component mounting delay (`{refreshing && <ClapperLoader />}`)**: `ClapperLoader` is only conditionally rendered when `refreshing` is `true` (`mobile/src/components/common/ClapperRefreshControl.tsx:57`). When the query state flips to `refreshing = true`, React must mount `ClapperLoader`, set up SVG elements, and launch shared value animation loops on the JS thread simultaneously while the container height is expanding. This causes a frame drop / layout tick right at the moment refresh triggers.

2. **Excessive entrance duration (250ms with cubic-bezier(0.23, 1, 0.32, 1))**: The container height animates from 0 to 52px over 250ms (`mobile/src/components/common/ClapperRefreshControl.tsx:35`). A 250ms expansion curve causes the indicator to appear noticeably late after the user releases the pull gesture.

3. **Staggered opacity fade (200ms)**: Opacity fades in over 200ms (`mobile/src/components/common/ClapperRefreshControl.tsx:36`), delaying visual feedback further.

```tsx
/* mobile/src/components/common/ClapperRefreshControl.tsx:30-59 — current */
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
```

## Target

1. Always render `<ClapperLoader />` inside `ClapperRefreshHeader` to eliminate runtime mount overhead, using opacity and height clipping to hide it when dormant.
2. Speed up entrance height expansion from `250ms` down to a snappy `140ms` using high initial velocity `Easing.out(Easing.quad)`, making the indicator instantly pop down when refresh is triggered.
3. Synchronize opacity fade to `100ms` on enter and `140ms` on exit, making the clapper immediately visible without lag.

```tsx
/* mobile/src/components/common/ClapperRefreshControl.tsx — target */
const FAST_EASE_OUT = Easing.out(Easing.quad);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export function ClapperRefreshHeader({
  refreshing,
  size = "md",
}: ClapperRefreshHeaderProps) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (refreshing) {
      height.value = withTiming(52, { duration: 140, easing: FAST_EASE_OUT });
      opacity.value = withTiming(1, { duration: 100, easing: FAST_EASE_OUT });
    } else {
      height.value = withTiming(0, { duration: 160, easing: EASE_OUT });
      opacity.value = withTiming(0, { duration: 140, easing: EASE_OUT });
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
      <ClapperLoader size={size === "sm" ? 22 : 30} />
    </Animated.View>
  );
}
```

## Repo conventions to follow

- Reanimated shared values and `withTiming` with custom Easing curves in `mobile/src/components/common/ClapperRefreshControl.tsx`.
- Timing curve conventions matching `mobile/src/components/common/ClapperLoader.tsx`.

## Steps

1. Edit `mobile/src/components/common/ClapperRefreshControl.tsx`:
   - Define `FAST_EASE_OUT = Easing.out(Easing.quad)`.
   - Update `useEffect` in `ClapperRefreshHeader` to set `height.value` with duration `140ms` and `FAST_EASE_OUT` when `refreshing` is true, and `opacity.value` with duration `100ms`.
   - Update exit timing for `height.value` to duration `160ms` and `opacity.value` to duration `140ms` when `refreshing` is false.
   - Remove the conditional `{refreshing && ...}` guard so `<ClapperLoader>` remains mounted in the tree inside `ClapperRefreshHeader`.

## Boundaries

- Do NOT touch `ClapperLoader.tsx` internal animation math.
- Do NOT alter screen components (`index.tsx`, `watchlist.tsx`, `profile.tsx`, `user/[username].tsx`).
- Do NOT add new dependencies or native packages.

## Verification

- **Mechanical**:
  - Run `cd mobile && npx tsc --noEmit` to verify type checking passes cleanly.
- **Feel check**:
  - Open the mobile app on iOS simulator or Android emulator/device.
  - Pull down from top on Homepage ("The Reel"), Watchlist, Profile, or User Profile.
  - Verify that the clapperboard indicator appears instantly upon releasing the pull gesture without any frame skip or delay.
  - Verify that when data finishes loading, the header collapses smoothly in 160ms without visual snapping or residual artifacting.
- **Done when**: Pull-to-refresh header expands in <=140ms without React mount lag, displaying the clapper loader immediately upon refresh trigger.
