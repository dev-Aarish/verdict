import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Check, Trash2, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { watchlistApi, moviesApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { MovieCard } from "../../components/common/MovieCard";
import { Button } from "../../components/common/Button";
import { LogMovieModal } from "../../components/common/LogMovieModal";
import { WatchlistEntry, Movie } from "../../types";

export default function WatchlistScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [selectedMovieForLog, setSelectedMovieForLog] = useState<Movie | null>(null);

  const {
    data: watchlist = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<WatchlistEntry[]>({
    queryKey: ["watchlist"],
    queryFn: watchlistApi.getWatchlist,
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (movieId: string) => watchlistApi.removeFromWatchlist(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const logMovieMutation = useMutation({
    mutationFn: moviesApi.logMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["myWatched"] });
      queryClient.invalidateQueries({ queryKey: ["tasteScore"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const handleRemove = (entry: WatchlistEntry) => {
    Alert.alert(
      "Remove Reel",
      `Remove "${entry.movie?.title || "this film"}" from queue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            await removeMutation.mutateAsync(entry.movieId || entry.movie?.id || entry.id);
          },
        },
      ]
    );
  };

  const handleLogSubmit = async (params: { imdbId: string; rating: number; review?: string }) => {
    await logMovieMutation.mutateAsync(params);
    if (selectedMovieForLog) {
      await removeMutation.mutateAsync(selectedMovieForLog.id);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authGateContainer}>
        <Bookmark size={48} color={Colors.dust} />
        <Text style={styles.authGateTitle}>Screening Queue</Text>
        <Text style={styles.authGateSubtitle}>
          Sign in to curate your cinematic queue and save upcoming screenings.
        </Text>
        <Button
          title="Sign In"
          variant="primary"
          onPress={() => router.push("/(auth)/login")}
          size="lg"
          style={styles.authGateBtn}
        />
      </View>
    );
  }

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brass} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Bookmark size={44} color={Colors.dust} />
        <Text style={styles.emptyTitle}>Queue Is Clear</Text>
        <Text style={styles.emptySubtitle}>
          Browse the vault and tap "Save to Queue" to track your pending watches.
        </Text>
        <Button
          title="Browse The Vault"
          variant="primary"
          onPress={() => router.push("/(tabs)/search")}
          icon={<Plus size={14} color={Colors.inkDark} />}
          style={styles.emptyBtn}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (!item.movie) return null;
          return (
            <View style={styles.entryRow}>
              <View style={styles.cardContainer}>
                <MovieCard
                  movie={item.movie}
                  onPress={() => router.push(`/movie/${item.movie?.imdbId || item.movie?.id}`)}
                />
              </View>
              <View style={styles.actionsBar}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.logBtn]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedMovieForLog(item.movie!)}
                >
                  <Check size={13} color={Colors.inkDark} />
                  <Text style={styles.logBtnText}>Log to Vault</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  activeOpacity={0.75}
                  onPress={() => handleRemove(item)}
                >
                  <Trash2 size={13} color={Colors.marqueeRedLight} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.brass}
            colors={[Colors.brass]}
          />
        }
      />

      <LogMovieModal
        visible={!!selectedMovieForLog}
        movie={selectedMovieForLog}
        onClose={() => setSelectedMovieForLog(null)}
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
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  authGateContainer: {
    flex: 1,
    backgroundColor: Colors.ink,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  authGateTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 0.5,
  },
  authGateSubtitle: {
    fontSize: 13,
    color: Colors.dust,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
  authGateBtn: {
    width: 200,
    marginTop: Spacing.md,
  },
  entryRow: {
    marginBottom: Spacing.md,
    gap: 8,
  },
  cardContainer: {
    flex: 1,
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.none,
    gap: 4,
  },
  logBtn: {
    backgroundColor: Colors.brass,
  },
  logBtnText: {
    color: Colors.inkDark,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  deleteBtn: {
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xl,
    gap: 6,
  },
  emptyTitle: {
    color: Colors.paper,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    color: Colors.dust,
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.md,
    maxWidth: 260,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
  },
});

