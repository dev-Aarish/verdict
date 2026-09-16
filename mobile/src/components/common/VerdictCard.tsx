import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { MessageSquareQuote } from "lucide-react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { FeedItem } from "../../types";
import { Avatar } from "./Avatar";
import { Stamp } from "./Stamp";

interface VerdictCardProps {
  item: FeedItem;
  onPressUser?: (username: string) => void;
  onPressMovie?: (imdbId: string) => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  item,
  onPressUser,
  onPressMovie,
}) => {
  const isVerdictOnUser = !!item.targetUser;

  return (
    <View style={styles.card}>
      {/* Author & Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          activeOpacity={0.75}
          onPress={() => onPressUser?.(item.user.username)}
        >
          <Avatar
            uri={item.user.avatarUrl}
            username={item.user.username}
            size={38}
          />
          <View style={styles.authorMeta}>
            <View style={styles.authorNameRow}>
              <Text style={styles.username}>@{item.user.username}</Text>
              {isVerdictOnUser ? (
                <Text style={styles.actionText}>
                  {" "}judged{" "}
                  <Text
                    style={styles.targetUsername}
                    onPress={() => onPressUser?.(item.targetUser!.username)}
                  >
                    @{item.targetUser!.username}
                  </Text>
                </Text>
              ) : (
                <Text style={styles.actionText}> logged a film</Text>
              )}
            </View>
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Rating or Score */}
        {item.rating !== undefined && (
          <Stamp size="xs" rotation={-2} variant="brass">
            {item.rating > 10 ? `${item.rating}` : `${item.rating}/5★`}
          </Stamp>
        )}
      </View>

      {/* Comment / Review */}
      {item.comment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentText}>"{item.comment}"</Text>
        </View>
      )}

      {/* Attached Movie if present */}
      {item.movie && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onPressMovie?.(item.movie!.imdbId || item.movie!.id)}
          style={styles.movieAttachment}
        >
          <Image
            source={{
              uri:
                item.movie.posterUrl && item.movie.posterUrl !== "N/A"
                  ? item.movie.posterUrl
                  : "https://via.placeholder.com/150x225/14151D/C5A572?text=Poster",
            }}
            style={styles.moviePoster}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.movieInfo}>
            <Text numberOfLines={1} style={styles.movieTitle}>
              {item.movie.title}
            </Text>
            {item.movie.year && (
              <Text style={styles.movieYear}>{item.movie.year}</Text>
            )}
            {item.movie.director && (
              <Text numberOfLines={1} style={styles.movieDirector}>
                Dir. {item.movie.director}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  authorMeta: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  username: {
    color: Colors.paper,
    fontWeight: "800",
    fontSize: 14,
  },
  actionText: {
    color: Colors.dust,
    fontSize: 12,
  },
  targetUsername: {
    color: Colors.brassLight,
    fontWeight: "700",
  },
  timeText: {
    color: Colors.dust,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  commentContainer: {
    backgroundColor: Colors.velvetElevated,
    borderRadius: Radius.none,
    padding: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.brass,
  },
  commentText: {
    color: Colors.paper,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  movieAttachment: {
    flexDirection: "row",
    backgroundColor: Colors.velvetElevated,
    borderRadius: Radius.none,
    padding: Spacing.sm,
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  moviePoster: {
    width: 44,
    height: 64,
    backgroundColor: Colors.inkDark,
    borderWidth: 1,
    borderColor: Colors.borderBrass,
  },
  movieInfo: {
    flex: 1,
    gap: 2,
  },
  movieTitle: {
    color: Colors.paper,
    fontSize: 14,
    fontWeight: "800",
  },
  movieYear: {
    color: Colors.dustLight,
    fontSize: 11,
  },
  movieDirector: {
    color: Colors.dust,
    fontSize: 11,
  },
});

