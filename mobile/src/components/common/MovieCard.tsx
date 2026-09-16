import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Star } from "lucide-react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Movie, parseGenres } from "../../types";
import { Badge } from "./Badge";

interface MovieCardProps {
  movie: Movie;
  onPress?: () => void;
  userRating?: number | null;
  layout?: "grid" | "list";
  style?: ViewStyle;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPress,
  userRating,
  layout = "list",
  style,
}) => {
  const posterUrl =
    movie.posterUrl && movie.posterUrl !== "N/A"
      ? movie.posterUrl
      : "https://via.placeholder.com/300x450/18181b/71717a?text=No+Poster";

  if (layout === "grid") {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={[styles.gridContainer, style]}
      >
        <Image
          source={{ uri: posterUrl }}
          style={styles.gridPoster}
          contentFit="cover"
          transition={250}
        />
        {userRating !== undefined && userRating !== null && (
          <View style={styles.gridRatingBadge}>
            <Star size={12} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.gridRatingText}>{userRating}</Text>
          </View>
        )}
        <View style={styles.gridContent}>
          <Text numberOfLines={1} style={styles.gridTitle}>
            {movie.title}
          </Text>
          {movie.year && (
            <Text style={styles.gridYear}>{movie.year}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.listContainer, style]}
    >
      <Image
        source={{ uri: posterUrl }}
        style={styles.listPoster}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.listContent}>
        <View style={styles.listHeaderRow}>
          <Text numberOfLines={2} style={styles.listTitle}>
            {movie.title}
          </Text>
        </View>

        <View style={styles.listMetaRow}>
          {movie.year && (
            <Text style={styles.listMetaText}>{movie.year}</Text>
          )}
          {movie.director && (
            <>
              <Text style={styles.bullet}>•</Text>
              <Text numberOfLines={1} style={styles.listMetaText}>
                {movie.director}
              </Text>
            </>
          )}
        </View>

        {parseGenres(movie.genres).length > 0 && (
          <View style={styles.genresRow}>
            {parseGenres(movie.genres)
              .slice(0, 2)
              .map((genre, idx) => (
                <Badge key={idx} label={genre} variant="outline" size="sm" />
              ))}
          </View>
        )}

        {userRating !== undefined && userRating !== null && (
          <View style={styles.userRatingRow}>
            <Star size={14} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.userRatingText}>Your Rating: {userRating}/100</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    alignItems: "center",
  },
  listPoster: {
    width: 68,
    height: 100,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  listMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listMetaText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  bullet: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  genresRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  userRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  userRatingText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Grid
  gridContainer: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  gridPoster: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: Colors.surfaceElevated,
  },
  gridRatingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  gridRatingText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  gridContent: {
    padding: Spacing.sm,
  },
  gridTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  gridYear: {
    color: Colors.textSubtle,
    fontSize: 12,
    marginTop: 2,
  },
});
