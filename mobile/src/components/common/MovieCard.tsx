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
import { Star, Plus, Check, Film, ChevronRight } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Movie, parseGenres } from "../../types";

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
    scale.value = withSpring(0.985, { damping: 15, stiffness: 350 });
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

  const hasPoster =
    movie.posterUrl &&
    movie.posterUrl !== "N/A" &&
    !movie.posterUrl.includes("placeholder");
  const posterUrl = hasPoster
    ? movie.posterUrl!
    : "https://via.placeholder.com/300x450/14151D/C5A572?text=Verdict";

  const genres = parseGenres(movie.genres);

  // -------------------------------------------------------------
  // GRID VARIANT
  // -------------------------------------------------------------
  if (layout === "grid") {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.gridContainer, animatedStyle, style]}
      >
        <View style={styles.gridPosterWrapper}>
          <Image
            source={{ uri: posterUrl }}
            style={styles.gridPoster}
            contentFit="cover"
            transition={250}
          />
          {/* Top Rating Badge */}
          {userRating !== undefined && userRating !== null ? (
            <View style={styles.gridRatingBadge}>
              <Star size={9} color={Colors.brassLight} fill={Colors.brassLight} style={{ marginRight: 2 }} />
              <Text style={styles.gridRatingText}>{userRating}</Text>
            </View>
          ) : movie.imdbRating ? (
            <View style={styles.gridScoreBadge}>
              <Star size={9} color={Colors.brassLight} fill={Colors.brassLight} style={{ marginRight: 2 }} />
              <Text style={styles.gridScoreText}>{movie.imdbRating}</Text>
            </View>
          ) : null}

          {/* Quick Log Button */}
          {onLogPress && userRating === undefined && (
            <TouchableOpacity
              onPress={handleLogButtonPress}
              style={[styles.gridLogBadge, isLogged && styles.gridLogBadgeLogged]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isLogged ? (
                <Check size={11} color={Colors.inkDark} />
              ) : (
                <Plus size={11} color={Colors.brassLight} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gridContent}>
          <Text numberOfLines={1} style={styles.gridTitle}>
            {movie.title}
          </Text>
          <View style={styles.gridMetaRow}>
            {movie.year ? (
              <Text style={styles.gridYear}>{movie.year}</Text>
            ) : null}
            {genres.length > 0 ? (
              <>
                <Text style={styles.gridDot}>·</Text>
                <Text numberOfLines={1} style={styles.gridGenre}>
                  {genres[0]}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  // -------------------------------------------------------------
  // LIST VARIANT (High density, refined typography & metadata)
  // -------------------------------------------------------------
  const posterDimensions = {
    sm: { width: 72, height: 108 },
    md: { width: 92, height: 138 },
    lg: { width: 106, height: 159 },
    xl: { width: 118, height: 177 },
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
      {/* Poster with border & shadow */}
      <View
        style={[
          styles.posterWrapper,
          { width: posterDimensions.width, height: posterDimensions.height },
        ]}
      >
        {hasPoster ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.posterImage}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Film size={22} color={Colors.brassDark} />
            <Text style={styles.posterPlaceholderText} numberOfLines={2}>
              {movie.title}
            </Text>
          </View>
        )}
      </View>

      {/* Main Content Area */}
      <View style={styles.listContent}>
        {/* Title & Chevron */}
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
          <ChevronRight size={14} color={Colors.dust} style={styles.chevron} />
        </View>

        {/* Primary Meta Row: Year, Language, Global Score, Director */}
        <View style={styles.listMetaRow}>
          {movie.year ? (
            <Text style={styles.metaYear}>{movie.year}</Text>
          ) : null}

          {movie.language ? (
            <View style={styles.langPill}>
              <Text style={styles.langText}>{movie.language}</Text>
            </View>
          ) : null}

          {movie.imdbRating ? (
            <View style={styles.globalScorePill}>
              <Star size={9.5} color={Colors.brassLight} fill={Colors.brassLight} style={{ marginRight: 2.5 }} />
              <Text style={styles.globalScoreText}>{movie.imdbRating}</Text>
            </View>
          ) : null}

          {movie.director ? (
            <Text numberOfLines={1} style={styles.directorText}>
              Dir. {movie.director}
            </Text>
          ) : null}
        </View>

        {/* Genre Tags Row */}
        {genres.length > 0 && (
          <View style={styles.genresRow}>
            {genres.slice(0, size === "lg" || size === "xl" ? 3 : 2).map((genre, idx) => (
              <View key={idx} style={styles.genrePill}>
                <Text style={styles.genrePillText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Plot / Synopsis Snippet (Eliminates empty white/dead space) */}
        {movie.plot ? (
          <Text numberOfLines={2} style={styles.plotSnippet}>
            {movie.plot}
          </Text>
        ) : movie.actors ? (
          <Text numberOfLines={1} style={styles.castSnippet}>
            Cast: {movie.actors}
          </Text>
        ) : null}

        {/* Action Row: Personal Rating Badge or Quick Log CTA */}
        <View style={styles.listActionRow}>
          {userRating !== undefined && userRating !== null ? (
            <View style={styles.userRatingBadge}>
              <Star size={11} color={Colors.brassLight} fill={Colors.brassLight} />
              <Text style={styles.userRatingLabel}>YOUR VERDICT:</Text>
              <Text style={styles.userRatingValue}>{userRating}/10</Text>
            </View>
          ) : onLogPress ? (
            <TouchableOpacity
              onPress={handleLogButtonPress}
              activeOpacity={0.75}
              style={[
                styles.inlineLogButton,
                isLogged && styles.inlineLogButtonLogged,
              ]}
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
  // -------------------------------------------------------------
  // LIST STYLES
  // -------------------------------------------------------------
  listContainer: {
    flexDirection: "row",
    backgroundColor: Colors.velvet,
    borderRadius: Radius.md,
    padding: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 13,
    alignItems: "flex-start",
  },
  listContainerLg: {
    padding: 13,
    gap: 15,
  },
  listContainerXl: {
    padding: 15,
    gap: 16,
  },
  posterWrapper: {
    borderWidth: 1,
    borderColor: "rgba(197, 165, 114, 0.25)",
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Colors.inkDark,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  posterImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.inkDark,
  },
  posterPlaceholder: {
    flex: 1,
    backgroundColor: Colors.inkDark,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    gap: 6,
  },
  posterPlaceholderText: {
    color: Colors.dust,
    fontSize: 9.5,
    textAlign: "center",
    fontWeight: "700",
  },
  listContent: {
    flex: 1,
    gap: 5,
    justifyContent: "flex-start",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: Colors.paper,
    letterSpacing: -0.2,
    lineHeight: 19.5,
    flex: 1,
    marginRight: 4,
  },
  listTitleLg: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  chevron: {
    marginTop: 2,
    opacity: 0.6,
  },

  // Metadata Row
  listMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaYear: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Colors.paperDim,
    letterSpacing: 0.2,
  },
  langPill: {
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  langText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: Colors.dustLight,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  globalScorePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.brassSubtle,
    borderWidth: 1,
    borderColor: "rgba(197, 165, 114, 0.28)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  globalScoreText: {
    fontSize: 10.5,
    fontWeight: "900",
    color: Colors.brassLight,
  },
  directorText: {
    fontSize: 11.5,
    color: Colors.dustLight,
    fontStyle: "italic",
    flexShrink: 1,
  },

  // Genres Row
  genresRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 1,
    flexWrap: "wrap",
  },
  genrePill: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(197, 165, 114, 0.18)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  genrePillText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: Colors.paperDim,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  // Plot / Details Snippet
  plotSnippet: {
    fontSize: 11.5,
    lineHeight: 15.5,
    color: Colors.dustLight,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  castSnippet: {
    fontSize: 11,
    color: Colors.dust,
    fontStyle: "italic",
    marginTop: 2,
  },

  // Action Row
  listActionRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  userRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    backgroundColor: Colors.brassSubtle,
    paddingVertical: 3.5,
    paddingHorizontal: 7.5,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderRadius: Radius.xs,
  },
  userRatingLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 0.7,
  },
  userRatingValue: {
    fontSize: 11.5,
    fontWeight: "900",
    color: Colors.brassLight,
  },
  inlineLogButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    backgroundColor: Colors.brass,
    paddingVertical: 4.5,
    paddingHorizontal: 9.5,
    borderRadius: Radius.xs,
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
    letterSpacing: 0.7,
  },
  inlineLogButtonTextLogged: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 0.7,
  },

  // -------------------------------------------------------------
  // GRID STYLES
  // -------------------------------------------------------------
  gridContainer: {
    width: "48%",
    backgroundColor: Colors.velvet,
    borderRadius: Radius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  gridPosterWrapper: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: Colors.inkDark,
  },
  gridPoster: {
    width: "100%",
    height: "100%",
  },
  gridRatingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 15, 20, 0.88)",
    paddingVertical: 2.5,
    paddingHorizontal: 5.5,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderRadius: Radius.xs,
  },
  gridRatingText: {
    color: Colors.brassLight,
    fontSize: 9.5,
    fontWeight: "900",
  },
  gridScoreBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 15, 20, 0.88)",
    paddingVertical: 2.5,
    paddingHorizontal: 5.5,
    borderWidth: 1,
    borderColor: "rgba(197, 165, 114, 0.4)",
    borderRadius: Radius.xs,
  },
  gridScoreText: {
    color: Colors.brassLight,
    fontSize: 9.5,
    fontWeight: "900",
  },
  gridLogBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(14, 15, 20, 0.88)",
    padding: 4.5,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderRadius: Radius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLogBadgeLogged: {
    backgroundColor: Colors.brass,
    borderColor: Colors.brassLight,
  },
  gridContent: {
    padding: Spacing.sm,
    gap: 2,
  },
  gridTitle: {
    color: Colors.paper,
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  gridMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridYear: {
    color: Colors.dustLight,
    fontSize: 11,
    fontWeight: "600",
  },
  gridDot: {
    color: Colors.dust,
    fontSize: 10,
  },
  gridGenre: {
    color: Colors.dust,
    fontSize: 10.5,
    flexShrink: 1,
  },
});

