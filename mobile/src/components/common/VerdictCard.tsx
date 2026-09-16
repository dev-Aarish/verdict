import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Star, MessageSquareQuote } from "lucide-react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { FeedItem } from "../../types";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";

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
          onPress={() => onPressUser?.(item.user.username)}
        >
          <Avatar
            uri={item.user.avatarUrl}
            username={item.user.username}
            size={36}
          />
          <View>
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
          <View style={styles.ratingPill}>
            <Star size={13} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.ratingText}>
              {item.rating > 10 ? item.rating : `${item.rating}/5`}
            </Text>
          </View>
        )}
      </View>

      {/* Comment / Review */}
      {item.comment && (
        <View style={styles.commentContainer}>
          <MessageSquareQuote size={16} color={Colors.textSubtle} style={styles.quoteIcon} />
          <Text style={styles.commentText}>{item.comment}</Text>
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
                  : "https://via.placeholder.com/150x225/18181b/71717a?text=Poster",
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
                Dir: {item.movie.director}
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
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
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  username: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  actionText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  targetUsername: {
    color: Colors.primaryLight,
    fontWeight: "700",
  },
  timeText: {
    color: Colors.textSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.goldSubtle,
    borderColor: "rgba(234, 179, 8, 0.4)",
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    gap: 4,
  },
  ratingText: {
    color: Colors.gold,
    fontWeight: "800",
    fontSize: 12,
  },
  commentContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quoteIcon: {
    marginTop: 2,
  },
  commentText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontStyle: "italic",
  },
  movieAttachment: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  moviePoster: {
    width: 44,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
  },
  movieInfo: {
    flex: 1,
    gap: 2,
  },
  movieTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  movieYear: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  movieDirector: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
