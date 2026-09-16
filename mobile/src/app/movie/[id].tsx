import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  Star,
  Bookmark,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  Film,
  Users,
  Clapperboard,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { moviesApi, watchlistApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { LogMovieModal } from "../../components/common/LogMovieModal";
import { Movie, parseGenres } from "../../types";

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [logModalVisible, setLogModalVisible] = useState(false);

  const {
    data: movie,
    isLoading,
    error,
  } = useQuery<Movie>({
    queryKey: ["movieDetail", id],
    queryFn: () => moviesApi.getDetail(id as string),
    enabled: !!id,
  });

  const logMovieMutation = useMutation({
    mutationFn: moviesApi.logMovie,
    onSuccess: () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["myWatched"] });
      queryClient.invalidateQueries({ queryKey: ["tasteScore"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      Alert.alert("Film Logged", "Movie added to your watched list!");
    },
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: () => watchlistApi.addToWatchlist(id as string),
    onSuccess: () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      Alert.alert("Watchlist Updated", "Film saved to your watchlist!");
    },
  });

  const handleLogSubmit = async (params: { imdbId: string; rating: number; review?: string }) => {
    await logMovieMutation.mutateAsync(params);
  };

  const handleWatchlistPress = async () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    await addToWatchlistMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.errorContainer}>
        <Film size={44} color={Colors.textSubtle} />
        <Text style={styles.errorTitle}>Movie Not Found</Text>
        <Button title="Go Back" onPress={() => router.back()} size="sm" style={styles.backBtn} />
      </View>
    );
  }

  const posterUrl =
    movie.posterUrl && movie.posterUrl !== "N/A"
      ? movie.posterUrl
      : "https://via.placeholder.com/300x450/18181b/71717a?text=No+Poster";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Backdrop / Poster Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: posterUrl }}
            style={styles.heroPoster}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.title}>{movie.title}</Text>
              <View style={styles.metaRow}>
                {movie.year && (
                  <View style={styles.metaPill}>
                    <Calendar size={12} color={Colors.textMuted} />
                    <Text style={styles.metaPillText}>{movie.year}</Text>
                  </View>
                )}
                {movie.runtime && (
                  <View style={styles.metaPill}>
                    <Clock size={12} color={Colors.textMuted} />
                    <Text style={styles.metaPillText}>{movie.runtime}</Text>
                  </View>
                )}
                {movie.rated && (
                  <Badge label={movie.rated} variant="outline" size="sm" />
                )}
              </View>

              {movie.imdbRating && (
                <View style={styles.imdbRatingBadge}>
                  <Star size={14} color={Colors.gold} fill={Colors.gold} />
                  <Text style={styles.imdbRatingText}>IMDb {movie.imdbRating}/10</Text>
                  {movie.imdbVotes && (
                    <Text style={styles.imdbVotesText}>({movie.imdbVotes} votes)</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons Bar */}
        <View style={styles.actionBar}>
          <Button
            title="Log Film"
            variant="primary"
            size="md"
            onPress={() => {
              if (!isAuthenticated) {
                router.push("/(auth)/login");
                return;
              }
              setLogModalVisible(true);
            }}
            icon={<CheckCircle2 size={16} color="#fff" />}
            style={styles.actionBtn}
          />
          <Button
            title="Watchlist"
            variant="secondary"
            size="md"
            onPress={handleWatchlistPress}
            loading={addToWatchlistMutation.isPending}
            icon={<Bookmark size={16} color={Colors.text} />}
            style={styles.actionBtn}
          />
        </View>

        {/* Genres */}
        {parseGenres(movie.genres).length > 0 && (
          <View style={styles.genresSection}>
            {parseGenres(movie.genres).map((genre, idx) => (
              <Badge key={idx} label={genre} variant="primary" size="md" />
            ))}
          </View>
        )}

        {/* Synopsis / Plot */}
        {movie.plot && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>SYNOPSIS</Text>
            <Text style={styles.plotText}>{movie.plot}</Text>
          </View>
        )}

        {/* Cast & Crew Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>CAST & CREW</Text>

          {movie.director && (
            <View style={styles.infoRow}>
              <Clapperboard size={16} color={Colors.primaryLight} style={styles.infoIcon} />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Director</Text>
                <Text style={styles.infoValue}>{movie.director}</Text>
              </View>
            </View>
          )}

          {movie.writer && (
            <View style={styles.infoRow}>
              <Film size={16} color={Colors.purple} style={styles.infoIcon} />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Writer(s)</Text>
                <Text style={styles.infoValue}>{movie.writer}</Text>
              </View>
            </View>
          )}

          {movie.actors && (
            <View style={styles.infoRow}>
              <Users size={16} color={Colors.emerald} style={styles.infoIcon} />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Starring</Text>
                <Text style={styles.infoValue}>{movie.actors}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Awards & Box Office */}
        {(movie.awards || movie.boxOffice) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>ACCOLADES & RELEASE</Text>
            {movie.awards && (
              <View style={styles.infoRow}>
                <Award size={16} color={Colors.gold} style={styles.infoIcon} />
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Awards</Text>
                  <Text style={styles.infoValue}>{movie.awards}</Text>
                </View>
              </View>
            )}
            {movie.boxOffice && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { marginLeft: 24 }]}>Box Office: </Text>
                <Text style={styles.infoValue}>{movie.boxOffice}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <LogMovieModal
        visible={logModalVisible}
        movie={movie}
        onClose={() => setLogModalVisible(false)}
        onSubmit={handleLogSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  backBtn: {
    marginTop: Spacing.sm,
  },
  heroSection: {
    height: 320,
    width: "100%",
    position: "relative",
  },
  heroPoster: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceElevated,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(9, 9, 11, 0.75)",
    justifyContent: "flex-end",
    padding: Spacing.lg,
  },
  heroContent: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  metaPillText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  imdbRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  imdbRatingText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: "800",
  },
  imdbVotesText: {
    color: Colors.textSubtle,
    fontSize: 11,
  },
  actionBar: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
  },
  genresSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  plotText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoTextWrapper: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSubtle,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
});
