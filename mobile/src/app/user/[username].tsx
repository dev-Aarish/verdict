import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  UserCheck,
  Gavel,
  Film,
  Sparkles,
  HeartHandshake,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { usersApi, followsApi, verdictsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Avatar } from "../../components/common/Avatar";
import { TasteScoreGauge } from "../../components/common/TasteScoreGauge";
import { MovieCard } from "../../components/common/MovieCard";
import { VerdictCard } from "../../components/common/VerdictCard";
import { Button } from "../../components/common/Button";
import { LeaveVerdictModal } from "../../components/common/LeaveVerdictModal";
import { WatchedEntry, Verdict, TasteScoreBreakdown, TasteMatch, User } from "../../types";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<"watched" | "verdicts">("watched");
  const [verdictModalVisible, setVerdictModalVisible] = useState<boolean>(false);

  const isSelf = currentUser?.username?.toLowerCase() === (username as string)?.toLowerCase();

  // Unified Full Profile Query (1 single fast request instead of 6 redundant ones)
  const {
    data: profileData,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ["fullProfile", username],
    queryFn: () => usersApi.getFullProfile(username as string),
    enabled: !!username,
  });

  const profileUser = profileData?.user;
  const tasteScore = profileData?.tasteScore || null;
  const tasteMatch = profileData?.tasteMatch || null;
  const isFollowing = profileData?.isFollowing || false;
  const watchedList = profileData?.entries || [];
  const verdicts = profileData?.verdicts || [];

  // Mutations
  const followMutation = useMutation({
    mutationFn: () =>
      isFollowing
        ? followsApi.unfollow(username as string)
        : followsApi.follow(username as string),
    onSuccess: () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["fullProfile", username] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const verdictMutation = useMutation({
    mutationFn: verdictsApi.leaveVerdict,
    onSuccess: () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["fullProfile", username] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      Alert.alert("Verdict Delivered", "Your rating and critique have been recorded!");
    },
  });

  const handleDeliverVerdict = async (params: {
    toUsername: string;
    rating: number;
    comment?: string;
  }) => {
    await verdictMutation.mutateAsync(params);
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.errorContainer}>
        <Film size={40} color={Colors.textSubtle} />
        <Text style={styles.errorTitle}>User not found</Text>
        <Button title="Go Back" onPress={() => router.back()} size="sm" />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <Avatar
            uri={profileUser.avatarUrl}
            username={profileUser.username}
            size={64}
          />
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>@{profileUser.username}</Text>
            {profileUser.bio && (
              <Text style={styles.profileBio}>{profileUser.bio}</Text>
            )}
          </View>
        </View>

        {/* Action buttons (Follow & Deliver Verdict) */}
        {!isSelf && (
          <View style={styles.profileActions}>
            <Button
              title={isFollowing ? "Following" : "Follow"}
              variant={isFollowing ? "secondary" : "outline"}
              size="sm"
              onPress={() => {
                if (!isAuthenticated) {
                  router.push("/(auth)/login");
                  return;
                }
                followMutation.mutate();
              }}
              loading={followMutation.isPending}
              icon={
                isFollowing ? (
                  <UserCheck size={14} color={Colors.emerald} />
                ) : (
                  <UserPlus size={14} color={Colors.text} />
                )
              }
              style={styles.actionBtn}
            />

            <Button
              title="Deliver Verdict"
              variant="gold"
              size="sm"
              onPress={() => {
                if (!isAuthenticated) {
                  router.push("/(auth)/login");
                  return;
                }
                setVerdictModalVisible(true);
              }}
              icon={<Gavel size={14} color="#000" />}
              style={styles.actionBtn}
            />
          </View>
        )}
      </View>

      {/* Taste Match Box (if logged in and comparing) */}
      {tasteMatch && (
        <View style={styles.tasteMatchCard}>
          <View style={styles.tasteMatchHeader}>
            <HeartHandshake size={18} color={Colors.accent} />
            <Text style={styles.tasteMatchTitle}>TASTE COMPATIBILITY</Text>
          </View>
          <View style={styles.tasteMatchScoreRow}>
            <Text style={styles.tasteMatchScore}>{tasteMatch.score}%</Text>
            <Text style={styles.tasteMatchSummary}>{tasteMatch.summary}</Text>
          </View>
        </View>
      )}

      {/* Taste Score Gauge */}
      <View style={styles.tasteGaugeWrapper}>
        <TasteScoreGauge score={tasteScore} />
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "watched" && styles.tabButtonActive]}
          onPress={() => setActiveTab("watched")}
        >
          <Film
            size={16}
            color={activeTab === "watched" ? Colors.primaryLight : Colors.textSubtle}
          />
          <Text
            style={[styles.tabText, activeTab === "watched" && styles.tabTextActive]}
          >
            Watched ({watchedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "verdicts" && styles.tabButtonActive]}
          onPress={() => setActiveTab("verdicts")}
        >
          <Gavel
            size={16}
            color={activeTab === "verdicts" ? Colors.primaryLight : Colors.textSubtle}
          />
          <Text
            style={[styles.tabText, activeTab === "verdicts" && styles.tabTextActive]}
          >
            Verdicts ({verdicts.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {activeTab === "watched" ? (
        <FlatList
          data={watchedList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (!item.movie) return null;
            return (
              <View style={styles.movieRow}>
                <MovieCard
                  movie={item.movie}
                  userRating={item.rating}
                  onPress={() =>
                    router.push(`/movie/${item.movie?.imdbId || item.movie?.id}`)
                  }
                />
              </View>
            );
          }}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={verdicts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VerdictCard
              item={{
                id: item.id,
                type: "verdict",
                createdAt: item.createdAt,
                user: item.author || { id: "unknown", username: "anonymous" },
                rating: item.rating,
                comment: item.comment,
                targetUser: { id: profileUser.id, username: profileUser.username },
              }}
              onPressUser={(u) => router.push(`/user/${u}`)}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Leave Verdict Modal */}
      <LeaveVerdictModal
        visible={verdictModalVisible}
        targetUser={profileUser}
        onClose={() => setVerdictModalVisible(false)}
        onSubmit={handleDeliverVerdict}
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
    gap: Spacing.md,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  profileDetails: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.text,
  },
  profileBio: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  profileActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  tasteMatchCard: {
    backgroundColor: "rgba(236, 72, 153, 0.08)",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
    marginBottom: Spacing.md,
    gap: 6,
  },
  tasteMatchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tasteMatchTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: 1,
  },
  tasteMatchScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  tasteMatchScore: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
  },
  tasteMatchSummary: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  tasteGaugeWrapper: {
    marginBottom: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.surfaceElevated,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSubtle,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: "700",
  },
  movieRow: {
    marginBottom: Spacing.md,
  },
});
