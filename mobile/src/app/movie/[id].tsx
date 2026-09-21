import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Share,
  Platform,
  Linking,
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
  ArrowLeft,
  Share2,
  Star,
  Globe,
  Quote,
  TrendingUp,
  ExternalLink,
  Disc,
  Building2,
  UserCheck,
  Check,
  Plus,
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
import {
  Movie,
  parseGenres,
  formatRuntime,
  MovieDetailResponse,
  WatchlistEntry,
  WatchedEntry,
  FilmCommunityEntry,
} from "../../types";
import { avatarUrlFor } from "../../lib/avatar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [logModalVisible, setLogModalVisible] = useState(false);

  // 1. Query full movie details including stats and community reviews
  const {
    data: detailData,
    isLoading,
    error,
  } = useQuery<MovieDetailResponse>({
    queryKey: ["movieDetail", id],
    queryFn: () => moviesApi.getDetail(id as string),
    enabled: !!id,
  });

  const movie = detailData?.movie;
  const community = detailData?.community || [];
  const stats = detailData?.stats;

  // 2. Query user's current Watchlist entries if authenticated
  const { data: watchlistEntries } = useQuery<WatchlistEntry[]>({
    queryKey: ["watchlist"],
    queryFn: watchlistApi.getWatchlist,
    enabled: isAuthenticated,
  });

  // 3. Query user's Watched entries if authenticated
  const { data: myWatchedEntries } = useQuery<WatchedEntry[]>({
    queryKey: ["myWatched"],
    queryFn: moviesApi.getMyWatched,
    enabled: isAuthenticated,
  });

  // Determine if this film is in user's watchlist
  const watchlistEntry = watchlistEntries?.find(
    (e) =>
      e.movieId === movie?.id ||
      e.movieId === movie?.imdbId ||
      e.movie?.imdbId === movie?.imdbId ||
      e.movie?.id === movie?.id
  );
  const isInWatchlist = !!watchlistEntry;

  // Determine if this film is already logged in user's vault
  const userLoggedEntry = myWatchedEntries?.find(
    (e) =>
      e.movieId === movie?.id ||
      e.movieId === movie?.imdbId ||
      e.movie?.imdbId === movie?.imdbId ||
      e.movie?.id === movie?.id ||
      e.id === movie?.id ||
      e.id === movie?.imdbId
  );
  const isLoggedByUser = !!userLoggedEntry;

  // Log movie mutation
  const logMovieMutation = useMutation({
    mutationFn: moviesApi.logMovie,
    onSuccess: () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["movieDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["myWatched"] });
      queryClient.invalidateQueries({ queryKey: ["tasteScore"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      Alert.alert("Reel Archived", "Film has been logged to your watched list!");
    },
  });

  // Toggle watchlist mutation
  const toggleWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (isInWatchlist && watchlistEntry) {
        await watchlistApi.removeFromWatchlist(watchlistEntry.id);
      } else {
        await watchlistApi.addToWatchlist(movie?.imdbId || (id as string));
      }
    },
    onSuccess: () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["movieDetail", id] });
      Alert.alert(
        isInWatchlist ? "Removed from Queue" : "Queue Updated",
        isInWatchlist
          ? "Film removed from your screening queue."
          : "Film saved to your screening queue!"
      );
    },
    onError: (err: any) => {
      Alert.alert("Queue Error", err.message || "Could not update queue.");
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
    await toggleWatchlistMutation.mutateAsync();
  };

  const handleSharePress = async () => {
    if (!movie) return;
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      await Share.share({
        title: movie.title,
        message: `Check out "${movie.title}" (${movie.year || "Film"}) on Verdict Archival Screening App!`,
      });
    } catch {}
  };

  const handleOpenWebsite = async (url: string) => {
    try {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      const canOpen = await Linking.canOpenURL(fullUrl);
      if (canOpen) {
        await Linking.openURL(fullUrl);
      }
    } catch {}
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
        <Film size={48} color={Colors.brass} />
        <Text style={styles.errorTitle}>PRINT NOT FOUND IN ARCHIVE</Text>
        <Text style={styles.errorSub}>The requested film reel could not be located.</Text>
        <Button title="Back to Index" variant="secondary" onPress={() => router.back()} size="sm" style={styles.backBtn} />
      </View>
    );
  }

  const posterUrl =
    movie.posterUrl && movie.posterUrl !== "N/A"
      ? movie.posterUrl
      : "https://via.placeholder.com/300x450/14151D/C5A572?text=No+Poster";

  const genresList = parseGenres(movie.genres);

  const actorsList = movie.actors
    ? movie.actors.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  return (
    <View style={styles.container}>
      {/* Floating Top Navigation Header */}
      <View style={styles.topHeaderNav}>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={Colors.paper} />
        </TouchableOpacity>
        <Text style={styles.navHeaderTitle} numberOfLines={1}>
          ARCHIVE ENTRY #{movie.imdbId ? movie.imdbId.replace("tt", "") : "000"}
        </Text>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={handleSharePress}
          activeOpacity={0.7}
        >
          <Share2 size={16} color={Colors.paper} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* CINEMATIC STAGE: Ambient glow backdrop + Unclipped Poster Showcase */}
        <View style={styles.stageSection}>
          {/* Ambient Blurred Background Glow */}
          <Image
            source={{ uri: posterUrl }}
            style={styles.stageAmbientBackdrop}
            contentFit="cover"
            blurRadius={40}
          />
          {/* Gradient Overlay Mask */}
          <View style={styles.stageGradientOverlay} />

          {/* Core Unclipped Poster Frame */}
          <View style={styles.posterStageWrapper}>
            <View style={styles.posterCardFrame}>
              {/* Corner Brass Accent Trims */}
              <View style={[styles.cornerTrim, styles.cornerTL]} />
              <View style={[styles.cornerTrim, styles.cornerTR]} />
              <View style={[styles.cornerTrim, styles.cornerBL]} />
              <View style={[styles.cornerTrim, styles.cornerBR]} />

              <Image
                source={{ uri: posterUrl }}
                style={styles.heroPosterImage}
                contentFit="cover"
                transition={300}
              />

              {/* Top-Right IMDb Rating Stamp Overlay */}
              {movie.imdbRating && (
                <View style={styles.posterStampContainer}>
                  <Stamp size="xs" rotation={-5} variant="brass" animate="none">
                    {`${movie.imdbRating} ★`}
                  </Stamp>
                </View>
              )}
            </View>
          </View>

          {/* Film Title & Header Meta */}
          <View style={styles.heroMetaBlock}>
            <Text style={styles.heroTitle}>{movie.title}</Text>

            {/* Archival Specification Ribbon */}
            <View style={styles.metaRibbon}>
              {movie.year && (
                <View style={styles.ribbonItem}>
                  <Calendar size={12} color={Colors.brassLight} />
                  <Text style={styles.ribbonText}>{movie.year}</Text>
                </View>
              )}
              {formatRuntime(movie.runtime) && (
                <>
                  <Text style={styles.ribbonDot}>•</Text>
                  <View style={styles.ribbonItem}>
                    <Clock size={12} color={Colors.brassLight} />
                    <Text style={styles.ribbonText}>{formatRuntime(movie.runtime)}</Text>
                  </View>
                </>
              )}
              {movie.rated && (
                <>
                  <Text style={styles.ribbonDot}>•</Text>
                  <View style={styles.ratedPill}>
                    <Text style={styles.ratedText}>{movie.rated}</Text>
                  </View>
                </>
              )}
            </View>

            {/* IMDb Global Votes Sub-meta */}
            {movie.imdbVotes && (
              <View style={styles.votesRow}>
                <Star size={12} color={Colors.brass} />
                <Text style={styles.votesText}>
                  {movie.imdbRating} / 10 IMDb score ({movie.imdbVotes} global votes)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ISSUE #1: VERDICT COMMUNITY JURY RATING & STATS */}
        {stats && stats.total > 0 && (
          <View style={styles.juryStatsCard}>
            <View style={styles.juryStampCol}>
              <Stamp
                size="md"
                rotation={-4}
                variant={stats.status === "rotten" ? "red" : "brass"}
              >
                {stats.freshPercent !== null ? `${stats.freshPercent}%` : "—"}
              </Stamp>
            </View>

            <View style={styles.juryDetailsCol}>
              <View style={styles.juryStatusRow}>
                <Text style={styles.juryStatusLabel}>VERDICT JURY RATING</Text>
                <View
                  style={[
                    styles.juryStatusBadge,
                    stats.status === "rotten" ? styles.badgeRotten : styles.badgeFresh,
                  ]}
                >
                  <Text style={styles.juryStatusBadgeText}>
                    {stats.status ? stats.status.toUpperCase() : "VERDICT"}
                  </Text>
                </View>
              </View>

              <Text style={styles.juryMainScore}>
                {stats.average !== null ? stats.average.toFixed(1) : "—"}{" "}
                <Text style={styles.juryScoreDenom}>/ 10 average</Text>
              </Text>

              <Text style={styles.jurySubText}>
                {stats.total} Verdict community {stats.total === 1 ? "log" : "logs"} • {stats.freshCount} fresh ({stats.freshPercent}% ≥ 7)
              </Text>
            </View>
          </View>
        )}

        {/* PRIMARY ACTION DECK */}
        <View style={styles.actionDeck}>
          <Button
            title={isLoggedByUser ? "Edit Vault Log" : "Log to Vault"}
            variant={isLoggedByUser ? "secondary" : "primary"}
            size="md"
            onPress={() => {
              if (!isAuthenticated) {
                router.push("/(auth)/login");
                return;
              }
              setLogModalVisible(true);
            }}
            icon={
              isLoggedByUser ? (
                <UserCheck size={16} color={Colors.brassLight} />
              ) : (
                <CheckCircle2 size={16} color={Colors.inkDark} />
              )
            }
            style={styles.primaryActionBtn}
          />
          <Button
            title={isInWatchlist ? "In Queue (Remove)" : "Add to Queue"}
            variant="secondary"
            size="md"
            onPress={handleWatchlistPress}
            loading={toggleWatchlistMutation.isPending}
            icon={
              isInWatchlist ? (
                <Check size={15} color={Colors.brassLight} />
              ) : (
                <Plus size={15} color={Colors.brassLight} />
              )
            }
            style={styles.secondaryActionBtn}
          />
        </View>

        {/* ISSUE #3: CURRENT USER'S PERSONAL VAULT ENTRY CARD */}
        {isLoggedByUser && userLoggedEntry && (
          <View style={styles.userVaultBanner}>
            <View style={styles.userVaultHeader}>
              <View style={styles.userVaultTagRow}>
                <UserCheck size={14} color={Colors.brassLight} />
                <Text style={styles.userVaultTag}>ARCHIVED IN YOUR VAULT</Text>
              </View>
              <Stamp size="xs" variant="brass" rotation={-3}>
                {`${userLoggedEntry.rating} / 10 ★`}
              </Stamp>
            </View>
            {userLoggedEntry.note && (
              <Text style={styles.userVaultNote}>"{userLoggedEntry.note}"</Text>
            )}
          </View>
        )}

        {/* GENRES SPECIFICATION */}
        {genresList.length > 0 && (
          <View style={styles.genresSection}>
            <Text style={styles.miniLabel}>GENRE CATEGORIZATION</Text>
            <View style={styles.genresRow}>
              {genresList.map((genre, idx) => (
                <Badge key={idx} label={genre} variant="brass" size="md" />
              ))}
            </View>
          </View>
        )}

        {/* SECTION: CANON SYNOPSIS */}
        {movie.plot && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Quote size={14} color={Colors.brass} />
              <Text style={styles.sectionHeader}>CANON SYNOPSIS</Text>
            </View>
            <View style={styles.synopsisContainer}>
              <View style={styles.brassLineIndicator} />
              <Text style={styles.plotText}>{movie.plot}</Text>
            </View>
          </View>
        )}

        {/* ISSUE #2: VERDICT COMMUNITY JURY LOGS ("WHO LOGGED IT") */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Users size={14} color={Colors.brassLight} />
            <Text style={styles.sectionHeader}>
              VERDICT JURY LOGS ({community.length})
            </Text>
          </View>

          {community.length === 0 ? (
            <Text style={styles.emptyCommunityText}>
              Nobody on Verdict has logged this film reel yet. Be the first jury member to add it to your vault.
            </Text>
          ) : (
            <View style={styles.communityList}>
              {community.map((entry, idx) => {
                const username = entry.user?.username || "Anonymous";
                const avatar = avatarUrlFor(username, entry.user?.avatarUrl);
                return (
                  <TouchableOpacity
                    key={entry.user?.id || idx}
                    style={styles.communityRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (entry.user?.username) {
                        router.push(`/user/${entry.user.username}`);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: avatar }}
                      style={styles.communityAvatar}
                      contentFit="cover"
                    />
                    <View style={styles.communityMainInfo}>
                      <View style={styles.communityUserHeader}>
                        <Text style={styles.communityUsername}>{username}</Text>
                        {entry.watchedAt && (
                          <Text style={styles.communityDate}>
                            {new Date(entry.watchedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        )}
                      </View>
                      {entry.note && (
                        <Text style={styles.communityNote} numberOfLines={2}>
                          "{entry.note}"
                        </Text>
                      )}
                    </View>
                    <View style={styles.communityRatingStamp}>
                      <Stamp
                        size="xs"
                        rotation={idx % 2 === 0 ? 3 : -3}
                        variant={entry.rating <= 4 ? "red" : "brass"}
                      >
                        {`${entry.rating} ★`}
                      </Stamp>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* SECTION: DRAMATIS PERSONAE & PRODUCTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>DRAMATIS PERSONAE & PRODUCTION</Text>

          {movie.director && (
            <View style={styles.infoRow}>
              <Clapperboard size={16} color={Colors.brassLight} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Director</Text>
                <Text style={styles.infoValue}>{movie.director}</Text>
              </View>
            </View>
          )}

          {movie.writer && (
            <View style={styles.infoRow}>
              <Film size={16} color={Colors.dustLight} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Screenplay / Writers</Text>
                <Text style={styles.infoValue}>{movie.writer}</Text>
              </View>
            </View>
          )}

          {actorsList.length > 0 && (
            <View style={styles.infoRow}>
              <Users size={16} color={Colors.brass} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Key Cast</Text>
                <View style={styles.castChipsRow}>
                  {actorsList.map((actor, idx) => (
                    <View key={idx} style={styles.actorChip}>
                      <Text style={styles.actorChipText}>{actor}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ISSUE #4: ARCHIVAL RECORD & ENRICHED SPECIFICATIONS */}
        {(movie.awards ||
          movie.boxOffice ||
          movie.country ||
          movie.language ||
          movie.released ||
          movie.production ||
          movie.dvd ||
          movie.website) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>ARCHIVAL RECORD & SPECIFICATIONS</Text>

            {movie.awards && (
              <View style={styles.infoRow}>
                <Award size={16} color={Colors.brassLight} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Accolades & Nominations</Text>
                  <Text style={styles.infoValue}>{movie.awards}</Text>
                </View>
              </View>
            )}

            {movie.boxOffice && (
              <View style={styles.infoRow}>
                <TrendingUp size={16} color={Colors.brass} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Global Box Office</Text>
                  <Text style={styles.infoValue}>{movie.boxOffice}</Text>
                </View>
              </View>
            )}

            {movie.released && (
              <View style={styles.infoRow}>
                <Calendar size={16} color={Colors.brassLight} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Theatrical Release</Text>
                  <Text style={styles.infoValue}>{movie.released}</Text>
                </View>
              </View>
            )}

            {movie.production && (
              <View style={styles.infoRow}>
                <Building2 size={16} color={Colors.dustLight} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Production Studio</Text>
                  <Text style={styles.infoValue}>{movie.production}</Text>
                </View>
              </View>
            )}

            {movie.dvd && (
              <View style={styles.infoRow}>
                <Disc size={16} color={Colors.dustLight} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Home Media / DVD</Text>
                  <Text style={styles.infoValue}>{movie.dvd}</Text>
                </View>
              </View>
            )}

            {(movie.country || movie.language) && (
              <View style={styles.infoRow}>
                <Globe size={16} color={Colors.dustLight} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Origin & Dialect</Text>
                  <Text style={styles.infoValue}>
                    {[movie.country, movie.language].filter(Boolean).join(" • ")}
                  </Text>
                </View>
              </View>
            )}

            {movie.website && movie.website !== "N/A" && (
              <View style={styles.infoRow}>
                <ExternalLink size={16} color={Colors.brass} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Official Website</Text>
                  <TouchableOpacity onPress={() => handleOpenWebsite(movie.website!)}>
                    <Text style={styles.websiteLinkText} numberOfLines={1}>
                      {movie.website.replace(/^https?:\/\//, "")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* BOTTOM ARCHIVAL TICKET FOOTER */}
        <View style={styles.ticketFooter}>
          <View style={styles.ticketPerforation} />
          <View style={styles.footerStubContent}>
            <Text style={styles.footerStubTag}>VERDICT CINEMA ARCHIVE · SLOTS #01-72</Text>
            <Text style={styles.footerStubId}>REF: {movie.imdbId || movie.id}</Text>
          </View>
        </View>
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
    fontSize: 14,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 1.5,
  },
  errorSub: {
    fontSize: 13,
    color: Colors.dust,
    textAlign: "center",
  },
  backBtn: {
    marginTop: Spacing.sm,
  },
  topHeaderNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(20, 21, 29, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(197, 165, 114, 0.15)",
    zIndex: 10,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.none,
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  navHeaderTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl * 2,
  },

  /* CINEMATIC STAGE & HERO SECTION */
  stageSection: {
    position: "relative",
    width: "100%",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: "center",
    backgroundColor: Colors.inkDark,
    overflow: "hidden",
  },
  stageAmbientBackdrop: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.3,
  },
  stageGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(14, 15, 20, 0.72)",
  },

  /* POSTER FRAME */
  posterStageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.md,
    zIndex: 2,
  },
  posterCardFrame: {
    width: 190,
    height: 280,
    backgroundColor: Colors.inkDark,
    borderWidth: 1.5,
    borderColor: Colors.brass,
    position: "relative",
    shadowColor: Colors.brass,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  heroPosterImage: {
    width: "100%",
    height: "100%",
  },
  cornerTrim: {
    position: "absolute",
    width: 10,
    height: 10,
    borderColor: Colors.brassLight,
    zIndex: 4,
  },
  cornerTL: { top: -3, left: -3, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: -3, right: -3, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: -3, left: -3, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -3, right: -3, borderBottomWidth: 2, borderRightWidth: 2 },
  posterStampContainer: {
    position: "absolute",
    top: 10,
    right: -10,
    zIndex: 5,
  },

  /* HERO META BLOCK */
  heroMetaBlock: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.paper,
    textAlign: "center",
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  metaRibbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  ribbonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ribbonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.brassLight,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  ribbonDot: {
    color: Colors.dust,
    fontSize: 12,
  },
  ratedPill: {
    backgroundColor: Colors.brassSubtle,
    borderWidth: 1,
    borderColor: Colors.brass,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  ratedText: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.brassLight,
  },
  votesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  votesText: {
    fontSize: 11,
    color: Colors.dustLight,
    fontWeight: "600",
  },

  /* VERDICT COMMUNITY JURY CARD */
  juryStatsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.brassGlow,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  juryStampCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  juryDetailsCol: {
    flex: 1,
    gap: 4,
  },
  juryStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  juryStatusLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.dustLight,
    letterSpacing: 1.2,
  },
  juryStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
  },
  badgeFresh: {
    backgroundColor: Colors.brassSubtle,
    borderColor: Colors.brass,
  },
  badgeRotten: {
    backgroundColor: Colors.marqueeRedSubtle,
    borderColor: Colors.marqueeRed,
  },
  juryStatusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 1,
  },
  juryMainScore: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.brassLight,
  },
  juryScoreDenom: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dust,
  },
  jurySubText: {
    fontSize: 11,
    color: Colors.dustLight,
    lineHeight: 15,
  },

  /* ACTION DECK */
  actionDeck: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.velvet,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  primaryActionBtn: {
    flex: 1,
  },
  secondaryActionBtn: {
    flex: 1,
  },

  /* USER PERSONAL VAULT BANNER */
  userVaultBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.brassSubtle,
    borderWidth: 1,
    borderColor: Colors.brass,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  userVaultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userVaultTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userVaultTag: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.brassLight,
    letterSpacing: 1,
  },
  userVaultNote: {
    fontSize: 12,
    fontStyle: "italic",
    color: Colors.paper,
    marginTop: 2,
  },

  /* GENRES */
  genresSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.xs,
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.dust,
    letterSpacing: 1.5,
  },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: 4,
  },

  /* SECTION CARDS */
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.velvet,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: Colors.brassLight,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  synopsisContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  brassLineIndicator: {
    width: 3,
    backgroundColor: Colors.brass,
    alignSelf: "stretch",
  },
  plotText: {
    flex: 1,
    color: Colors.paper,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.dust,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.paper,
    fontWeight: "600",
    lineHeight: 18,
  },
  websiteLinkText: {
    fontSize: 13,
    color: Colors.brassLight,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  /* COMMUNITY JURY REVIEWS */
  emptyCommunityText: {
    fontSize: 12,
    color: Colors.dust,
    lineHeight: 18,
    fontStyle: "italic",
  },
  communityList: {
    gap: Spacing.md,
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.velvetElevated,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  communityAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.brass,
  },
  communityMainInfo: {
    flex: 1,
    gap: 2,
  },
  communityUserHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  communityUsername: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.brassLight,
  },
  communityDate: {
    fontSize: 10,
    color: Colors.dust,
  },
  communityNote: {
    fontSize: 12,
    color: Colors.paperDim,
    fontStyle: "italic",
    lineHeight: 16,
  },
  communityRatingStamp: {
    justifyContent: "center",
    alignItems: "center",
  },

  /* ACTOR CHIPS */
  castChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  actorChip: {
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  actorChipText: {
    fontSize: 11,
    color: Colors.paperDim,
    fontWeight: "600",
  },

  /* FOOTER STUB */
  ticketFooter: {
    marginTop: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.inkDark,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  ticketPerforation: {
    height: 1,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderStyle: "dashed",
    marginBottom: Spacing.md,
    opacity: 0.5,
  },
  footerStubContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerStubTag: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.dust,
    letterSpacing: 1,
  },
  footerStubId: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.brassLight,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
