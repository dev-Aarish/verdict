import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Flame, Calendar, X, Film } from "lucide-react-native";
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
  const [activeCategory, setActiveCategory] = useState<"hits" | "upcoming">("hits");
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

  const {
    data: latestHits = [],
    isLoading: isLoadingHits,
    isRefetching: isRefetchingHits,
    refetch: refetchHits,
  } = useQuery({
    queryKey: ["trendingMovies"],
    queryFn: moviesApi.getTrending,
  });

  const {
    data: upcomingMovies = [],
    isLoading: isLoadingUpcoming,
    isRefetching: isRefetchingUpcoming,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ["upcomingMovies"],
    queryFn: moviesApi.getUpcoming,
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

  const segregatedHits = React.useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return latestHits.filter((m) => {
      if (m.released && /^\d{4}-\d{2}-\d{2}$/.test(m.released)) {
        return m.released <= today;
      }
      return true;
    });
  }, [latestHits]);

  const segregatedUpcoming = React.useMemo(() => {
    const hitsImdbSet = new Set(segregatedHits.map((m) => m.imdbId || m.id));
    const today = new Date().toISOString().slice(0, 10);
    return upcomingMovies.filter((m) => {
      const id = m.imdbId || m.id;
      if (id && hitsImdbSet.has(id)) return false;
      if (m.released && /^\d{4}-\d{2}-\d{2}$/.test(m.released)) {
        return m.released > today;
      }
      return true;
    });
  }, [upcomingMovies, segregatedHits]);

  const isQueryActive = debouncedQuery.length >= 2;
  const currentCategoryMovies = activeCategory === "hits" ? segregatedHits : segregatedUpcoming;
  const displayMovies = isQueryActive ? searchResults : currentCategoryMovies;
  const isLoadingCategory = activeCategory === "hits" ? isLoadingHits : isLoadingUpcoming;

  const renderEmpty = () => {
    if (isSearching || (isLoadingCategory && !isQueryActive)) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>
            {isQueryActive ? "Searching cinematic archives..." : "Fetching movies..."}
          </Text>
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

  const renderHeader = () => {
    if (isQueryActive) {
      return (
        <View style={styles.sectionTitleRow}>
          <Film size={16} color={Colors.primaryLight} />
          <Text style={styles.sectionTitle}>
            {searchResults.length} RESULTS FOUND
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.discoveryHeader}>
        {/* Category Filter Pills */}
        <View style={styles.categoryPillRow}>
          <TouchableOpacity
            style={[
              styles.categoryPill,
              activeCategory === "hits" && styles.categoryPillActive,
            ]}
            onPress={() => setActiveCategory("hits")}
            activeOpacity={0.8}
          >
            <Flame
              size={15}
              color={activeCategory === "hits" ? "#C9A03C" : Colors.textMuted}
            />
            <Text
              style={[
                styles.categoryPillText,
                activeCategory === "hits" && styles.categoryPillTextActive,
              ]}
            >
              Latest Hits
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryPill,
              activeCategory === "upcoming" && styles.categoryPillActive,
            ]}
            onPress={() => setActiveCategory("upcoming")}
            activeOpacity={0.8}
          >
            <Calendar
              size={15}
              color={activeCategory === "upcoming" ? "#C9A03C" : Colors.textMuted}
            />
            <Text
              style={[
                styles.categoryPillText,
                activeCategory === "upcoming" && styles.categoryPillTextActive,
              ]}
            >
              Upcoming Movies
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTitleRow}>
          {activeCategory === "hits" ? (
            <>
              <Flame size={15} color="#C9A03C" />
              <Text style={styles.sectionTitle}>NOW PLAYING & POPULAR HITS</Text>
            </>
          ) : (
            <>
              <Calendar size={15} color="#C9A03C" />
              <Text style={styles.sectionTitle}>ANTICIPATED & UPCOMING RELEASES</Text>
            </>
          )}
        </View>
      </View>
    );
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
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          !isQueryActive ? (
            <RefreshControl
              refreshing={activeCategory === "hits" ? isRefetchingHits : isRefetchingUpcoming}
              onRefresh={activeCategory === "hits" ? refetchHits : refetchUpcoming}
              tintColor="#C9A03C"
              colors={["#C9A03C"]}
            />
          ) : undefined
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
  discoveryHeader: {
    marginTop: Spacing.sm,
  },
  categoryPillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: "rgba(201, 160, 60, 0.15)",
    borderColor: "#C9A03C",
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  categoryPillTextActive: {
    color: "#C9A03C",
    fontWeight: "700",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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

