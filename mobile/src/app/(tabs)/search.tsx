import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Keyboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Search,
  Film,
  X,
  Clock,
  Trash2,
  Sparkles,
  Compass,
  Flame,
  Calendar,
  Glasses,
  Rocket,
  Brain,
  Cpu,
  Skull,
  Palette,
  Moon,
  Siren,
  HelpCircle,
  FileText,
  Heart,
  Smile,
  Wand2,
  Swords,
  LucideIcon,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { moviesApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Input } from "../../components/common/Input";
import { MovieCard } from "../../components/common/MovieCard";
import { LogMovieModal } from "../../components/common/LogMovieModal";
import { ClapperLoader } from "../../components/common/ClapperLoader";
import { Movie } from "../../types";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../../utils/recentSearches";

interface CuratedExploration {
  label: string;
  query: string;
  genreId?: number;
  keywordId?: number;
  icon: LucideIcon;
}

const CURATED_EXPLORATIONS: CuratedExploration[] = [
  { label: "Film Noir", query: "Film Noir", keywordId: 9807, icon: Glasses },
  { label: "Sci-Fi", query: "Sci-Fi", genreId: 878, icon: Rocket },
  { label: "Psychological Thriller", query: "Psychological Thriller", keywordId: 12565, icon: Brain },
  { label: "Cyberpunk", query: "Cyberpunk", keywordId: 12190, icon: Cpu },
  { label: "Horror", query: "Horror", genreId: 27, icon: Skull },
  { label: "Animation", query: "Animation", genreId: 16, icon: Palette },
  { label: "Neo-Noir", query: "Neo-Noir", keywordId: 207268, icon: Moon },
  { label: "Crime", query: "Crime", genreId: 80, icon: Siren },
  { label: "Mystery", query: "Mystery", genreId: 9648, icon: HelpCircle },
  { label: "Documentary", query: "Documentary", genreId: 99, icon: FileText },
  { label: "Action", query: "Action", genreId: 28, icon: Swords },
  { label: "Romance", query: "Romance", genreId: 10749, icon: Heart },
  { label: "Comedy", query: "Comedy", genreId: 35, icon: Smile },
  { label: "Fantasy", query: "Fantasy", genreId: 14, icon: Wand2 },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedExploration, setSelectedExploration] = useState<CuratedExploration | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedMovieForLog, setSelectedMovieForLog] = useState<Movie | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedQuery(trimmed);
      if (trimmed.length >= 2) {
        addRecentSearch(trimmed).then(setRecentSearches);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const activeGenreId = selectedExploration?.genreId;
  const activeKeywordId = selectedExploration?.keywordId;
  const isQueryActive = debouncedQuery.length >= 2 || !!activeGenreId || !!activeKeywordId;

  // Infinite query for paginated search & discovery results
  const {
    data,
    isLoading: isSearching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "movieSearch",
      debouncedQuery,
      activeGenreId ?? null,
      activeKeywordId ?? null,
    ],
    queryFn: ({ pageParam = 1 }) =>
      moviesApi.search({
        query: debouncedQuery,
        genreId: activeGenreId,
        keywordId: activeKeywordId,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: isQueryActive,
  });

  const searchResults = useMemo(() => {
    if (!data?.pages) return [];
    const seen = new Set<string>();
    const list: Movie[] = [];
    for (const page of data.pages) {
      for (const item of page.results) {
        const id = item.imdbId || item.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          list.push(item);
        }
      }
    }
    return list;
  }, [data]);

  const totalResultsCount = data?.pages?.[0]?.totalResults ?? searchResults.length;

  // Fetch trending movies for zero-state
  const { data: trendingMovies = [] } = useQuery({
    queryKey: ["trendingMoviesSearch"],
    queryFn: () => moviesApi.getTrending(),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch upcoming movies for zero-state
  const { data: upcomingMovies = [] } = useQuery({
    queryKey: ["upcomingMoviesSearch"],
    queryFn: () => moviesApi.getUpcoming(),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch current user's watched entries for quick log states
  const { data: myWatched = [] } = useQuery({
    queryKey: ["myWatched"],
    queryFn: () => moviesApi.getMyWatched(),
    enabled: isAuthenticated,
  });

  const watchedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of myWatched) {
      if (entry.movieId) {
        map.set(entry.movieId, entry.rating);
      }
      if (entry.movie?.imdbId) {
        map.set(entry.movie.imdbId, entry.rating);
      }
    }
    return map;
  }, [myWatched]);

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

  const handleQuickLog = (movie: Movie) => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    setSelectedMovieForLog(movie);
  };

  const handleChipPress = (item: CuratedExploration) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (selectedExploration?.label === item.label) {
      setSelectedExploration(null);
      setSearchQuery("");
      setDebouncedQuery("");
    } else {
      setSelectedExploration(item);
      setSearchQuery(item.label);
      setDebouncedQuery(item.label);
    }
  };

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    if (selectedExploration && text.trim().toLowerCase() !== selectedExploration.label.toLowerCase()) {
      setSelectedExploration(null);
    }
  };

  const handleClearQuery = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedExploration(null);
  };

  const handleRecentPress = (query: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSelectedExploration(null);
    setSearchQuery(query);
    setDebouncedQuery(query);
  };

  const handleRemoveRecent = async (query: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const updated = await removeRecentSearch(query);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handleLogSubmit = async (params: { imdbId: string; rating: number; review?: string }) => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    await logMovieMutation.mutateAsync(params);
  };

  const renderZeroState = () => {
    return (
      <View style={styles.zeroStateContainer}>
        {/* Curated Cinematic Discovery */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Compass size={13} color={Colors.brass} />
            <Text style={styles.sectionHeading}>CINEMATIC EXPLORATIONS</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContainer}
          >
            {CURATED_EXPLORATIONS.map((item) => {
              const isSelected = selectedExploration?.label === item.label;
              const ChipIcon = item.icon || Sparkles;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => handleChipPress(item)}
                  style={[
                    styles.genreChip,
                    isSelected && styles.genreChipActive,
                  ]}
                >
                  <ChipIcon
                    size={11}
                    color={isSelected ? Colors.ink : Colors.brass}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.genreChipText,
                      isSelected && styles.genreChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Recent Search History */}
        {recentSearches.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.recentHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Clock size={13} color={Colors.dust} />
                <Text style={styles.sectionHeading}>RECENT INQUIRIES</Text>
              </View>
              <TouchableOpacity
                onPress={handleClearAllRecent}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearAllBtn}
              >
                <Trash2 size={11} color={Colors.dustLight} />
                <Text style={styles.clearAllText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentGrid}>
              {recentSearches.map((item) => (
                <View key={item} style={styles.recentChip}>
                  <TouchableOpacity
                    style={styles.recentChipTouch}
                    onPress={() => handleRecentPress(item)}
                  >
                    <Text numberOfLines={1} style={styles.recentChipText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveRecent(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={styles.recentRemoveBtn}
                  >
                    <X size={12} color={Colors.dust} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Trending in The Vault */}
        {trendingMovies.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Flame size={13} color={Colors.brass} />
              <Text style={styles.sectionHeading}>TRENDING IN THE CANON</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPosterScroll}
            >
              {trendingMovies.slice(0, 10).map((movie) => {
                const id = movie.imdbId || movie.id;
                return (
                  <MovieCard
                    key={id}
                    movie={movie}
                    layout="grid"
                    showRating={false}
                    isLogged={watchedMap.has(id)}
                    onPress={() => handleMoviePress(movie)}
                    onLogPress={() => handleQuickLog(movie)}
                    style={styles.carouselCard}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Anticipated Upcoming Titles */}
        {upcomingMovies.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Calendar size={13} color={Colors.dustLight} />
              <Text style={styles.sectionHeading}>ANTICIPATED RELEASES</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPosterScroll}
            >
              {upcomingMovies.slice(0, 10).map((movie) => {
                const id = movie.imdbId || movie.id;
                return (
                  <MovieCard
                    key={id}
                    movie={movie}
                    layout="grid"
                    showRating={false}
                    onPress={() => handleMoviePress(movie)}
                    style={styles.carouselCard}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Cinematic Vault Hero Intro */}
        <View style={styles.vaultIntroCard}>
          <Film size={30} color={Colors.brass} style={{ opacity: 0.8 }} />
          <Text style={styles.vaultIntroTitle}>The Vault is Open</Text>
          <Text style={styles.vaultIntroSubtitle}>
            Search across millions of classic and contemporary films, directors, and genres to rate and refine your Taste Score.
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ClapperLoader size="lg" />
        </View>
      );
    }

    if (isQueryActive && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Film size={40} color={Colors.dust} />
          <Text style={styles.emptyTitle}>Reel Not Found</Text>
          <Text style={styles.emptySubtitle}>
            No entries matched "{debouncedQuery}". Try refining the title or director name.
          </Text>
        </View>
      );
    }

    if (!isQueryActive) {
      return renderZeroState();
    }

    return null;
  };

  const renderHeader = () => {
    const queryLabel = selectedExploration
      ? `${selectedExploration.label.toUpperCase()} CANON`
      : `"${debouncedQuery}"`;

    return (
      <View style={styles.headerArea}>
        {/* Large Magazine Typography (Natural page flow, no sticky bar) */}
        <View style={[styles.heroTitles, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          <Text style={styles.heroEyebrow}>CANON & DISCOVERY</Text>
          <Text style={styles.heroMainTitle}>The Vault</Text>
        </View>

        {/* Search Header */}
        <View style={styles.searchBarContainer}>
          <Input
            placeholder="Search titles, directors, cinematic canon..."
            value={searchQuery}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            returnKeyType="search"
            wrapperStyle={styles.inputWrapper}
            leftIcon={<Search size={16} color={Colors.brass} />}
            rightIcon={
              searchQuery ? (
                <TouchableOpacity
                  onPress={handleClearQuery}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.dustLight} />
                </TouchableOpacity>
              ) : undefined
            }
          />
        </View>

        {isQueryActive && searchResults.length > 0 && (
          <View style={styles.resultsHeaderRow}>
            <View style={styles.resultsHeaderLeft}>
              <Film size={12} color={Colors.brassLight} />
              <Text style={styles.resultsHeaderText}>
                {totalResultsCount > 0 ? `${totalResultsCount} VAULT ARCHIVES` : "VAULT ARCHIVES"}
              </Text>
            </View>
            <Text style={styles.resultsQueryBadge} numberOfLines={1}>
              {queryLabel}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={isQueryActive ? searchResults : []}
        keyExtractor={(item, index) => `${item.imdbId || item.id}-${index}`}
        renderItem={({ item }) => {
          const id = item.imdbId || item.id;
          const userRating = watchedMap.get(id);
          return (
            <View style={styles.cardWrapper}>
              <MovieCard
                movie={item}
                userRating={userRating}
                isLogged={watchedMap.has(id)}
                onPress={() => handleMoviePress(item)}
                onLogPress={() => handleQuickLog(item)}
              />
            </View>
          );
        }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={() => {
          if (isFetchingNextPage) {
            return (
              <View style={styles.footerLoader}>
                <ClapperLoader size="sm" />
                <Text style={styles.footerLoaderText}>FETCHING MORE FROM THE CANON...</Text>
              </View>
            );
          }
          if (isQueryActive && searchResults.length >= 20 && !hasNextPage) {
            return (
              <View style={styles.endOfResults}>
                <Text style={styles.endOfResultsText}>— END OF VAULT ARCHIVES —</Text>
              </View>
            );
          }
          return null;
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
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
    backgroundColor: Colors.ink,
  },
  headerArea: {
    marginBottom: Spacing.xs,
  },
  heroTitles: {
    gap: 2,
    marginBottom: Spacing.md,
  },
  heroEyebrow: {
    fontSize: 9.5,
    fontWeight: "800",
    color: Colors.brass,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  heroMainTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 0.5,
  },
  searchBarContainer: {
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  resultsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    paddingHorizontal: 2,
  },
  resultsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultsHeaderText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.brassLight,
    letterSpacing: 1.2,
  },
  resultsQueryBadge: {
    fontSize: 11,
    color: Colors.dustLight,
    fontStyle: "italic",
    maxWidth: 140,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: "center",
    gap: Spacing.md,
  },

  // Zero-State styles
  zeroStateContainer: {
    paddingTop: Spacing.md,
    gap: Spacing.xl,
  },
  sectionBlock: {
    gap: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.dustLight,
    letterSpacing: 1.2,
  },
  chipsScrollContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
  },
  genreChipActive: {
    backgroundColor: Colors.brass,
    borderColor: Colors.brassLight,
  },
  genreChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.paperDim,
  },
  genreChipTextActive: {
    color: Colors.inkDark,
    fontWeight: "800",
  },
  recentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.dustLight,
  },
  recentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.velvet,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.sm,
    paddingLeft: Spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    maxWidth: "100%",
  },
  recentChipTouch: {
    marginRight: 6,
    maxWidth: 200,
  },
  recentChipText: {
    fontSize: 12,
    color: Colors.paper,
    fontWeight: "600",
  },
  recentRemoveBtn: {
    padding: 2,
  },

  // Carousel & Posters
  horizontalPosterScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  carouselCard: {
    width: 120,
    marginBottom: 0,
  },

  // Vault Intro Banner
  vaultIntroCard: {
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: Colors.velvet,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  vaultIntroTitle: {
    color: Colors.paper,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 0.2,
  },
  vaultIntroSubtitle: {
    color: Colors.dust,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 290,
  },

  // Empty state when search returns 0 items
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.velvet,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
    gap: 6,
  },
  emptyTitle: {
    color: Colors.paper,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
  emptySubtitle: {
    color: Colors.dust,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 1.2,
  },
  endOfResults: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  endOfResultsText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.dust,
    letterSpacing: 1.5,
  },
});
