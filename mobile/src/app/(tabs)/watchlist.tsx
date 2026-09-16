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
      "Remove from Watchlist",
      `Are you sure you want to remove "${entry.movie?.title || "this film"}"?`,
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
        <Bookmark size={54} color={Colors.textSubtle} />
        <Text style={styles.authGateTitle}>Your Watchlist</Text>
        <Text style={styles.authGateSubtitle}>
          Sign in to curate your cinematic queue and track films you want to see.
        </Text>
        <Button
          title="Sign In"
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
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Bookmark size={48} color={Colors.textSubtle} />
        <Text style={styles.emptyTitle}>Watchlist is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse films and tap "Add to Watchlist" to save them for later.
        </Text>
        <Button
          title="Discover Films"
          onPress={() => router.push("/(tabs)/search")}
          icon={<Plus size={16} color="#fff" />}
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
                  onPress={() => setSelectedMovieForLog(item.movie!)}
                >
                  <Check size={14} color="#fff" />
                  <Text style={styles.logBtnText}>Log Film</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleRemove(item)}
                >
                  <Trash2 size={14} color={Colors.danger} />
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
            tintColor={Colors.primaryLight}
            colors={[Colors.primary]}
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
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  authGateContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  authGateTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  authGateSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
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
    borderRadius: Radius.md,
    gap: 4,
  },
  logBtn: {
    backgroundColor: Colors.primary,
  },
  logBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: Colors.surfaceElevated,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xl,
    gap: 6,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
  },
});
