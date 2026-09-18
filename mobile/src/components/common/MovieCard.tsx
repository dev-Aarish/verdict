import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Star, Plus, Check } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Movie, parseGenres } from "../../types";
import { Badge } from "./Badge";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MovieCardProps {
  movie: Movie;
  onPress?: () => void;
  onLogPress?: () => void;
  isLogged?: boolean;
  userRating?: number | null;
  layout?: "grid" | "list";
  size?: "sm" | "md" | "lg" | "xl";
  style?: ViewStyle;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  onLogPress,
  isLogged,
  userRating,
  layout = "list",
  size = "md",
  style,
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

  const handleLogButtonPress = () => {
    if (!onLogPress) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onLogPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const posterUrl =
    movie.posterUrl && movie.posterUrl !== "N/A"
      ? movie.posterUrl
      : "https://via.placeholder.com/300x450/14151D/C5A572?text=The+Print";

  if (layout === "grid") {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.gridContainer, animatedStyle, style]}
      >
        <Image
          source={{ uri: posterUrl }}
          style={styles.gridPoster}
          contentFit="cover"
          transition={250}
        />
        {userRating !== undefined && userRating !== null ? (
          <View style={styles.gridRatingBadge}>
            <Text style={styles.gridRatingText}>{userRating}★</Text>
          </View>
        ) : onLogPress ? (
          <TouchableOpacity
            onPress={handleLogButtonPress}
            style={[styles.gridLogBadge, isLogged && styles.gridLogBadgeLogged]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isLogged ? (
              <Check size={10} color={Colors.inkDark} />
            ) : (
              <Plus size={10} color={Colors.brassLight} />
            )}
          </TouchableOpacity>
        ) : null}
        <View style={styles.gridContent}>
          <Text numberOfLines={1} style={styles.gridTitle}>
            {movie.title}
          </Text>
          {movie.year && (
            <Text style={styles.gridYear}>{movie.year}</Text>
          )}
        </View>
      </AnimatedPressable>
    );
  }

  // Dimensions based on size prop (2:3 cinematic poster ratio)
  const posterDimensions = {
    sm: { width: 68, height: 102 },
    md: { width: 84, height: 126 },
    lg: { width: 98, height: 147 },
    xl: { width: 114, height: 171 },
  }[size];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.listContainer,
        size === "lg" && styles.listContainerLg,
        size === "xl" && styles.listContainerXl,
        animatedStyle,
        style,
      ]}
    >
      <View
        style={[
          styles.posterWrapper,
          { width: posterDimensions.width, height: posterDimensions.height },
        ]}
      >
        <Image
          source={{ uri: posterUrl }}
          style={{ width: "100%", height: "100%", backgroundColor: Colors.inkDark }}
          contentFit="cover"
          transition={250}
        />
      </View>
      <View style={styles.listContent}>
        <View style={styles.listHeaderRow}>
          <Text
            numberOfLines={2}
            style={[
              styles.listTitle,
              (size === "lg" || size === "xl") && styles.listTitleLg,
            ]}
          >
            {movie.title}
          </Text>
        </View>

        <View style={styles.listMetaRow}>
          {movie.year && (
            <Text style={[styles.listMetaText, (size === "lg" || size === "xl") && styles.listMetaTextLg]}>
              {movie.year}
            </Text>
          )}
          {movie.director && (
            <>
              <Text style={styles.bullet}>·</Text>
              <Text
                numberOfLines={1}
                style={[styles.listMetaText, (size === "lg" || size === "xl") && styles.listMetaTextLg]}
              >
                Dir. {movie.director}
              </Text>
            </>
          )}
        </View>

        {parseGenres(movie.genres).length > 0 && (
          <View style={styles.genresRow}>
            {parseGenres(movie.genres)
              .slice(0, size === "lg" || size === "xl" ? 3 : 2)
              .map((genre, idx) => (
                <Badge key={idx} label={genre} variant="outline" size="sm" />
              ))}
          </View>
        )}

        <View style={styles.listActionRow}>
          {userRating !== undefined && userRating !== null ? (
            <View style={styles.userRatingRow}>
              <Star size={12} color={Colors.brass} fill={Colors.brass} />
              <Text style={styles.userRatingLabel}>PERSONAL RATING:</Text>
              <Text style={styles.userRatingText}>{userRating}/10</Text>
            </View>
          ) : onLogPress ? (
            <TouchableOpacity
              onPress={handleLogButtonPress}
              style={[styles.inlineLogButton, isLogged && styles.inlineLogButtonLogged]}
            >
              {isLogged ? (
                <>
                  <Check size={11} color={Colors.brassLight} />
                  <Text style={styles.inlineLogButtonTextLogged}>LOGGED</Text>
                </>
              ) : (
                <>
                  <Plus size={11} color={Colors.inkDark} />
                  <Text style={styles.inlineLogButtonText}>LOG REEL</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: "row",
    backgroundColor: Colors.velvet,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    alignItems: "center",
  },
  listContainerLg: {
    padding: 12,
    gap: 14,
    borderRadius: Radius.sm,
  },
  listContainerXl: {
    padding: 14,
    gap: 16,
    borderRadius: Radius.md,
  },
  posterWrapper: {
    borderWidth: 1.5,
    borderColor: Colors.borderBrass,
    borderRadius: Radius.sm,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  listContent: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.paper,
    letterSpacing: 0.2,
    flex: 1,
  },
  listTitleLg: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  listMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  listMetaText: {
    fontSize: 12,
    color: Colors.dustLight,
  },
  listMetaTextLg: {
    fontSize: 13,
  },
  bullet: {
    color: Colors.dust,
    fontSize: 12,
  },
  genresRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 3,
    flexWrap: "wrap",
  },
  userRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    backgroundColor: Colors.brassSubtle,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.brass,
    borderRadius: Radius.xs || 2,
  },
  userRatingLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 0.8,
  },
  userRatingText: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.brassLight,
  },

  // Grid
  gridContainer: {
    width: "48%",
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  gridPoster: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: Colors.inkDark,
  },
  gridRatingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.inkDark,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.brass,
  },
  gridRatingText: {
    color: Colors.brassLight,
    fontSize: 10,
    fontWeight: "900",
  },
  gridLogBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.inkDark,
    padding: 5,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderRadius: Radius.xs || 2,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLogBadgeLogged: {
    backgroundColor: Colors.brass,
    borderColor: Colors.brassLight,
  },
  gridContent: {
    padding: Spacing.sm,
  },
  gridTitle: {
    color: Colors.paper,
    fontSize: 13,
    fontWeight: "700",
  },
  gridYear: {
    color: Colors.dust,
    fontSize: 11,
    marginTop: 1,
  },
  listActionRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  inlineLogButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.brass,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: Radius.xs || 2,
    alignSelf: "flex-start",
  },
  inlineLogButtonLogged: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.brass,
  },
  inlineLogButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.inkDark,
    letterSpacing: 0.6,
  },
  inlineLogButtonTextLogged: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 0.6,
  },
});
