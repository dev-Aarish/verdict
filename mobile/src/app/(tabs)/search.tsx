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
import { Search, Film, X } from "lucide-react-native";
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
    }, 350);
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

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brass} />
          <Text style={styles.loadingText}>Searching the vaults...</Text>
        </View>
      );
    }

    if (isQueryActive && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Film size={44} color={Colors.dust} />
          <Text style={styles.emptyTitle}>Reel Not Found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching for a different title, director, or keyword.
          </Text>
        </View>
      );
    }

    if (!isQueryActive) {
      return (
        <View style={styles.emptyContainer}>
          <Film size={44} color={Colors.brass} style={{ opacity: 0.6 }} />
          <Text style={styles.emptyTitle}>The Film Vault</Text>
          <Text style={styles.emptySubtitle}>
            Type at least 2 characters to search through cinema history and log your experience.
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => {
    if (!isQueryActive || searchResults.length === 0) return null;

    return (
      <View style={styles.sectionTitleRow}>
        <Film size={14} color={Colors.brassLight} />
        <Text style={styles.sectionTitle}>
          {searchResults.length} VAULT ARCHIVES FOUND
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Fixed Search Header */}
      <View style={styles.searchBarContainer}>
        <Input
          placeholder="Search titles, directors, cinematic canon..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
          wrapperStyle={styles.inputWrapper}
          leftIcon={<Search size={16} color={Colors.dust} />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={Colors.dustLight} />
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      <FlatList
        data={isQueryActive ? searchResults : []}
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
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.ink,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.dust,
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
    color: Colors.dustLight,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
    gap: 6,
  },
  emptyTitle: {
    color: Colors.paper,
    fontSize: 17,
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
});
