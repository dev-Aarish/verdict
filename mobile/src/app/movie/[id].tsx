import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  Bookmark,
  CheckCircle2,
  Calendar,
  Clock,
  Film,
  Users,
  Clapperboard,
  Award,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { moviesApi, watchlistApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Stamp } from "../../components/common/Stamp";
import { ClapperLoader } from "../../components/common/ClapperLoader";
import { LogMovieModal } from "../../components/common/LogMovieModal";
import { Movie, parseGenres, WatchedEntry } from "../../types";

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
      Alert.alert("Reel Archived", "Film has been logged to your watched list!");
    },
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: () => watchlistApi.addToWatchlist(id as string),
    onSuccess: () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      Alert.alert("Queue Updated", "Film saved to your screening queue!");
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
        <ClapperLoader size="lg" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.errorContainer}>
        <Film size={44} color={Colors.dust} />
        <Text style={styles.errorTitle}>Print Not Found in Archive</Text>
        <Button title="Go Back" variant="secondary" onPress={() => router.back()} size="sm" style={styles.backBtn} />
      </View>
    );
  }

  const posterUrl =
    movie.posterUrl && movie.posterUrl !== "N/A"
      ? movie.posterUrl
      : "https://via.placeholder.com/300x450/14151D/C5A572?text=No+Poster";

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
                    <Calendar size={11} color={Colors.brassLight} />
                    <Text style={styles.metaPillText}>{movie.year}</Text>
                  </View>
                )}
                {movie.runtime && (
                  <View style={styles.metaPill}>
                    <Clock size={11} color={Colors.brassLight} />
                    <Text style={styles.metaPillText}>{movie.runtime}</Text>
                  </View>
                )}
                {movie.rated && (
                  <Badge label={movie.rated} variant="outline" size="sm" />
                )}
              </View>

              {movie.imdbRating && (
                <View style={styles.imdbRatingBadge}>
                  <Stamp size="xs" rotation={-2} variant="brass">
                    {movie.imdbRating}/10
                  </Stamp>
                  {movie.imdbVotes && (
                    <Text style={styles.imdbVotesText}>({movie.imdbVotes} global votes)</Text>
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
            icon={<CheckCircle2 size={16} color={Colors.inkDark} />}
            style={styles.actionBtn}
          />
          <Button
            title="Add to Queue"
            variant="secondary"
            size="md"
            onPress={handleWatchlistPress}
            loading={addToWatchlistMutation.isPending}
            icon={<Bookmark size={15} color={Colors.dustLight} />}
            style={styles.actionBtn}
          />
        </View>

        {/* Genres */}
        {parseGenres(movie.genres).length > 0 && (
          <View style={styles.genresSection}>
            {parseGenres(movie.genres).map((genre, idx) => (
              <Badge key={idx} label={genre} variant="brass" size="md" />
            ))}
          </View>
        )}

        {/* Synopsis / Plot */}
        {movie.plot && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>CANON SYNOPSIS</Text>
            <Text style={styles.plotText}>{movie.plot}</Text>
          </View>
        )}

        {/* Cast & Crew Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>TECHNICAL SPECIFICATIONS & ROLES</Text>

          {movie.director && (
            <View style={styles.infoRow}>
              <Clapperboard size={15} color={Colors.brassLight} style={styles.infoIcon} />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Director</Text>
                <Text style={styles.infoValue}>{movie.director}</Text>
              </View>
            </View>
          )}

          {movie.writer && (
            <View style={styles.infoRow}>
              <Film size={15} color={Colors.dustLight} style={styles.infoIcon} />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Screenplay</Text>
                <Text style={styles.infoValue}>{movie.writer}</Text>
              </View>
            </View>
          )}

          {movie.actors && (
            <View style={styles.infoRow}>
              <Users size={15} color={Colors.brass} style={styles.infoIcon} />
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Key Cast</Text>
                <Text style={styles.infoValue}>{movie.actors}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Awards & Box Office */}
        {(movie.awards || movie.boxOffice) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>ACCOLADES & ARCHIVAL STATS</Text>
            {movie.awards && (
              <View style={styles.infoRow}>
                <Award size={15} color={Colors.brassLight} style={styles.infoIcon} />
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Awards</Text>
                  <Text style={styles.infoValue}>{movie.awards}</Text>
                </View>
              </View>
            )}
            {movie.boxOffice && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { marginLeft: 22 }]}>Box Office: </Text>
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
    backgroundColor: Colors.ink,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.ink,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.ink,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.paper,
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
    backgroundColor: Colors.inkDark,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(14, 15, 20, 0.78)",
    justifyContent: "flex-end",
    padding: Spacing.lg,
  },
  heroContent: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 0.3,
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
    backgroundColor: "rgba(197, 165, 114, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(197, 165, 114, 0.3)",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: Radius.none,
  },
  metaPillText: {
    color: Colors.brassLight,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  imdbRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  imdbVotesText: {
    color: Colors.dust,
    fontSize: 11,
  },
  actionBar: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.velvet,
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
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.dust,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  plotText: {
    color: Colors.paper,
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
    fontSize: 10,
    color: Colors.dust,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.paper,
    fontWeight: "600",
  },
});

