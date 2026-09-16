import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Flame, X, Film } from "lucide-react-native";
import { moviesApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Input } from "../../components/common/Input";
import { MovieCard } from "../../components/common/MovieCard";
import { LogMovieModal } from "../../components/common/LogMovieModal";
import { Movie } from "../../types";

export default function SearchScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMovieForLog, setSelectedMovieForLog] = useState<Movie | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    data: searchResults = [],
    isLoading: isSearching,
  } = useQuery({
    queryKey: ["movieSearch", debouncedQuery],
    queryFn: () => moviesApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: trendingMovies = [], isLoading: isLoadingTrending } = useQuery({
    queryKey: ["trendingMovies"],
    queryFn: moviesApi.getTrending,
  });

  const logMovieMutation = useMutation({
    mutationFn: moviesApi.logMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myWatched"] });
      queryClient.invalidateQueries({ queryKey: ["tasteScore"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const handleMoviePress = (movie: Movie) => {
    Keyboard.dismiss();
    router.push(`/movie/${movie.imdbId || movie.id}`);
  };

  const handleLogSubmit = async (params: { imdbId: string; rating: number; review?: string }) => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    await logMovieMutation.mutateAsync(params);
  };

  const isQueryActive = debouncedQuery.length >= 2;
  const displayMovies = isQueryActive ? searchResults : trendingMovies;

  const renderEmpty = () => {
    if (isSearching || (isLoadingTrending && !isQueryActive)) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching cinematic archives...</Text>
        </View>
      );
    }

    if (isQueryActive && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Film size={44} color={Colors.textSubtle} />
          <Text style={styles.emptyTitle}>No Movies Found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching for a different title or keyword.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Fixed Search Header */}
      <View style={styles.searchBarContainer}>
        <Input
          placeholder="Search titles, directors, genres..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
          wrapperStyle={styles.inputWrapper}
          leftIcon={<Search size={18} color={Colors.textSubtle} />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      <FlatList
        data={displayMovies}
        keyExtractor={(item) => item.imdbId || item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <MovieCard
              movie={item}
              onPress={() => handleMoviePress(item)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.sectionTitleRow}>
            {isQueryActive ? (
              <>
                <Film size={16} color={Colors.primaryLight} />
                <Text style={styles.sectionTitle}>
                  {searchResults.length} RESULTS FOUND
                </Text>
              </>
            ) : (
              <>
                <Flame size={16} color={Colors.gold} />
                <Text style={styles.sectionTitle}>TRENDING & FEATURED</Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
    gap: 6,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 6,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
});
