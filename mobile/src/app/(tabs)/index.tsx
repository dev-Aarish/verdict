import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Film, Trophy, Compass, Plus, Flame, Calendar } from "lucide-react-native";
import { feedApi, usersApi, moviesApi, prewarmBackend } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { VerdictCard } from "../../components/common/VerdictCard";
import { Button } from "../../components/common/Button";
import { Avatar } from "../../components/common/Avatar";
import { ClapperLoader } from "../../components/common/ClapperLoader";
import {
  ClapperFlatList,
  ClapperRefreshHeader,
} from "../../components/common/ClapperRefreshControl";
import { MovieCarouselSection } from "../../components/common/MovieCarousel";
import { FeedItem } from "../../types";

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    prewarmBackend();
  }, []);

  const {
    data: feed = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<FeedItem[]>({
    queryKey: ["feed"],
    queryFn: feedApi.getFeed,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: usersApi.getLeaderboard,
    retry: 3,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15000),
  });

  const { data: latestHits = [] } = useQuery({
    queryKey: ["trendingMovies"],
    queryFn: moviesApi.getTrending,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10000),
  });

  const { data: upcomingMovies = [] } = useQuery({
    queryKey: ["upcomingMovies"],
    queryFn: moviesApi.getUpcoming,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10000),
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
      queryClient.invalidateQueries({ queryKey: ["trendingMovies"] }),
      queryClient.invalidateQueries({ queryKey: ["upcomingMovies"] }),
    ]);
  };

  const handlePressUser = (username: string) => {
    router.push(`/user/${username}`);
  };

  const handlePressMovie = (imdbId: string) => {
    router.push(`/movie/${imdbId}`);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ClapperRefreshHeader refreshing={isRefetching} />

      {/* Large Magazine Typography (Natural page flow, no sticky bar) */}
      <View style={[styles.heroTitles, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <Text style={styles.heroEyebrow}>VERDICT · THE SCREENING ROOM</Text>
        <Text style={styles.heroMainTitle}>The Reel</Text>
      </View>

      {/* Top Welcome / Auth state */}
      {isReady && !isAuthenticated && (
        <View style={styles.authBanner}>
          <View style={styles.authBannerContent}>
            <Text style={styles.authBannerTitle}>THE SCREENING ROOM</Text>
            <Text style={styles.authBannerDesc}>
              Log your filmography and collect verdicts on your taste in cinema.
            </Text>
          </View>
          <Button
            title="Take Seat"
            size="sm"
            variant="primary"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      )}

      {/* Leaderboard Taste Highlights */}
      {leaderboard.length > 0 && (
        <View style={styles.leaderboardSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Trophy size={14} color={Colors.brassLight} />
              <Text style={styles.sectionTitle}>THE JURY · TOP TASTE SCORES</Text>
            </View>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={leaderboard.slice(0, 8)}
            keyExtractor={(item) => item.user.id}
            contentContainerStyle={styles.leaderboardList}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.leaderboardItem}
                activeOpacity={0.75}
                onPress={() => handlePressUser(item.user.username)}
              >
                <View style={styles.avatarRankWrapper}>
                  <Avatar
                    uri={item.user.avatarUrl}
                    username={item.user.username}
                    size={48}
                  />
                  <View
                    style={[
                      styles.rankBadge,
                      index === 0 && { backgroundColor: Colors.brass, borderColor: Colors.brassLight },
                      index === 1 && { backgroundColor: "#94a3b8", borderColor: "#cbd5e1" },
                      index === 2 && { backgroundColor: "#b45309", borderColor: "#d97706" },
                    ]}
                  >
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.leaderboardName}>
                  @{item.user.username}
                </Text>
                <Text style={styles.leaderboardScore}>
                  {item.tasteScore?.total ?? 0} PTS
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View style={styles.feedTitleRow}>
        <Compass size={14} color={Colors.brassLight} />
        <Text style={styles.feedTitle}>THE REEL · LIVE ACTIVITY & VERDICTS</Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ClapperLoader size="lg" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Film size={44} color={Colors.dust} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>The Reel Is Silent</Text>
        <Text style={styles.emptySubtitle}>
          Log your favorite films or browse the vault to start collecting verdicts.
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

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <MovieCarouselSection
        title="Latest Hits"
        subtitle="Now Playing & Popular Canon"
        icon={<Flame size={14} color={Colors.brassLight} />}
        movies={latestHits}
        direction="left"
      />
      <MovieCarouselSection
        title="Upcoming Releases"
        subtitle="Anticipated & Forthcoming Releases"
        icon={<Calendar size={14} color={Colors.brassLight} />}
        movies={upcomingMovies}
        direction="right"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ClapperFlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VerdictCard
            item={item}
            onPressUser={handlePressUser}
            onPressMovie={handlePressMovie}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  heroTitles: {
    gap: 2,
    marginBottom: Spacing.lg,
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
  footerContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  authBanner: {
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderBrass,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  authBannerContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  authBannerTitle: {
    color: Colors.brassLight,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  authBannerDesc: {
    color: Colors.dustLight,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  leaderboardSection: {
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.dustLight,
    letterSpacing: 1.2,
  },
  leaderboardList: {
    gap: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  leaderboardItem: {
    alignItems: "center",
    width: 68,
  },
  avatarRankWrapper: {
    position: "relative",
  },
  rankBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.velvetElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
  },
  leaderboardName: {
    color: Colors.paper,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  leaderboardScore: {
    color: Colors.brassLight,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 1,
    fontFamily: "monospace",
  },
  feedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: Spacing.sm,
  },
  feedTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.dust,
    letterSpacing: 1.2,
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
    marginTop: Spacing.md,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.paper,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    color: Colors.dust,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: Spacing.lg,
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
  },
});
