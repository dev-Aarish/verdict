import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Movie } from "../../types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MovieCarouselProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  movies: Movie[];
  badgeLabel?: string;
  direction?: "left" | "right";
}

const CarouselCard: React.FC<{ movie: Movie; badgeLabel?: string; onPress: () => void }> = ({
  movie,
  badgeLabel,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const posterUrl =
    movie.posterUrl && movie.posterUrl !== "N/A"
      ? movie.posterUrl
      : "https://via.placeholder.com/300x450/14151D/C5A572?text=Poster";

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.card, animatedStyle]}
    >
      <View style={styles.posterWrapper}>
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
          transition={250}
        />
        {badgeLabel && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={styles.movieTitle}>
        {movie.title}
      </Text>
      <Text style={styles.movieYear}>{movie.year || movie.released || ""}</Text>
    </AnimatedPressable>
  );
};

export const MovieCarouselSection: React.FC<MovieCarouselProps> = ({
  title,
  subtitle,
  icon,
  movies,
  badgeLabel,
  direction = "left",
}) => {
  const router = useRouter();

  if (movies.length === 0) return null;

  // Duplicate items for continuous seamless loop
  const displayMovies = [...movies, ...movies, ...movies];
  const CARD_FULL_WIDTH = 138; // 124 width + 14 gap
  const singleLoopWidth = movies.length * CARD_FULL_WIDTH;
  const translateX = useSharedValue(direction === "left" ? 0 : -singleLoopWidth);

  useEffect(() => {
    if (singleLoopWidth === 0) return;
    const duration = Math.max(18000, movies.length * 3200);

    if (direction === "left") {
      translateX.value = 0;
      translateX.value = withRepeat(
        withTiming(-singleLoopWidth, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      translateX.value = -singleLoopWidth;
      translateX.value = withRepeat(
        withTiming(0, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(translateX);
    };
  }, [singleLoopWidth, direction, movies.length]);

  const animatedTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {icon}
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.trackOverflow}>
        <Animated.View style={[styles.marqueeTrack, animatedTrackStyle]}>
          {displayMovies.map((item, index) => (
            <CarouselCard
              key={`${item.imdbId || item.id}-${index}`}
              movie={item}
              badgeLabel={badgeLabel}
              onPress={() => router.push(`/movie/${item.imdbId || item.id}`)}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  headerRow: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.brassLight,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 0.3,
  },
  trackOverflow: {
    overflow: "hidden",
    paddingVertical: 4,
  },
  marqueeTrack: {
    flexDirection: "row",
    gap: 14,
  },
  card: {
    width: 124,
  },
  posterWrapper: {
    width: 124,
    height: 186,
    borderRadius: Radius.sm,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.borderBrass,
    backgroundColor: Colors.inkDark,
    position: "relative",
    marginBottom: 6,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(20, 21, 29, 0.9)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.borderBrass,
  },
  badgeText: {
    color: Colors.brassLight,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  movieTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.paper,
  },
  movieYear: {
    fontSize: 10,
    color: Colors.dustLight,
    marginTop: 1,
    fontFamily: "monospace",
  },
});
