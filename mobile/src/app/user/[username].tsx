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
  Award,
  Clapperboard,
  ShieldAlert,
  Pencil,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { usersApi, followsApi, verdictsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";
import { Avatar } from "../../components/common/Avatar";
import { TasteScoreGauge } from "../../components/common/TasteScoreGauge";
import { MovieCard } from "../../components/common/MovieCard";
import { VerdictCard } from "../../components/common/VerdictCard";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { LeaveVerdictModal } from "../../components/common/LeaveVerdictModal";
import { AvatarPickerModal } from "../../components/common/AvatarPickerModal";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"watched" | "verdicts">("watched");
  const [verdictModalVisible, setVerdictModalVisible] = useState<boolean>(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState<boolean>(false);

  const isSelf = currentUser?.username?.toLowerCase() === (username as string)?.toLowerCase();

  // Unified Full Profile Query
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch,
    isRefetching,
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
      Alert.alert("Verdict Delivered", "Your rating and critique have been recorded in the register.");
    },
  });

  const handleDeliverVerdict = async (params: {
    toUsername: string;
    rating: number;
    comment?: string;
  }) => {
    await verdictMutation.mutateAsync(params);
  };

  const handleSaveAvatar = async (avatarUrl: string | null) => {
    await usersApi.updateProfile({ avatarUrl });
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: ["fullProfile", username] });
  };

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brass} />
        <Text style={styles.loadingText}>Retrieving taste dossier...</Text>
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconBox}>
          <ShieldAlert size={36} color={Colors.marqueeRed} />
        </View>
        <Text style={styles.errorTitle}>DOSSIER NOT FOUND</Text>
        <Text style={styles.errorSubtitle}>
          The member record for @{username} could not be located in the register.
        </Text>
        <Button title="Return to Screening Room" onPress={() => router.back()} size="md" variant="brass" />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.cardHeaderAccent} />
        
        <View style={styles.profileTopRow}>
          {isSelf ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAvatarModalVisible(true)}
              style={styles.avatarEditContainer}
            >
              <Avatar
                uri={profileUser.avatarUrl}
                username={profileUser.username}
                size={72}
              />
              <View style={styles.pencilBadge}>
                <Pencil size={12} color={Colors.brass} />
              </View>
            </TouchableOpacity>
          ) : (
            <Avatar
              uri={profileUser.avatarUrl}
              username={profileUser.username}
              size={72}
            />
          )}
          <View style={styles.profileDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.profileName}>@{profileUser.username}</Text>
              <Badge label="MEMBER" variant="brass" size="sm" />
            </View>
            {profileUser.bio ? (
              <Text style={styles.profileBio} numberOfLines={3}>{profileUser.bio}</Text>
            ) : (
              <Text style={styles.profileBioEmpty}>No statement on record.</Text>
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
                  <UserCheck size={14} color={Colors.brass} />
                ) : (
                  <UserPlus size={14} color={Colors.paper} />
                )
              }
              style={styles.actionBtn}
            />

            <Button
              title="Deliver Verdict"
              variant="brass"
              size="sm"
              onPress={() => {
                if (!isAuthenticated) {
                  router.push("/(auth)/login");
                  return;
                }
                setVerdictModalVisible(true);
              }}
              icon={<Gavel size={14} color={Colors.ink} />}
              style={styles.actionBtn}
            />
          </View>
        )}
      </View>

      {/* Taste Match Box (if logged in and comparing) */}
      {tasteMatch && (
        <View style={styles.tasteMatchCard}>
          <View style={styles.tasteMatchHeader}>
            <HeartHandshake size={16} color={Colors.brass} />
            <Text style={styles.tasteMatchTitle}>TASTE COMPATIBILITY INDEX</Text>
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
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === "watched" && styles.tabButtonActive]}
          onPress={() => {
            try { Haptics.selectionAsync(); } catch {}
            setActiveTab("watched");
          }}
        >
          <Film
            size={15}
            color={activeTab === "watched" ? Colors.brass : Colors.dust}
          />
          <Text
            style={[styles.tabText, activeTab === "watched" && styles.tabTextActive]}
          >
            Vault Archive ({watchedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === "verdicts" && styles.tabButtonActive]}
          onPress={() => {
            try { Haptics.selectionAsync(); } catch {}
            setActiveTab("verdicts");
          }}
        >
          <Gavel
            size={15}
            color={activeTab === "verdicts" ? Colors.brass : Colors.dust}
          />
          <Text
            style={[styles.tabText, activeTab === "verdicts" && styles.tabTextActive]}
          >
            Verdicts Received ({verdicts.length})
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
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brass}
            />
          }
          renderItem={({ item }) => {
            if (!item.movie) return null;
            return (
              <View style={styles.movieRow}>
                <MovieCard
                  movie={item.movie}
                  userRating={item.rating}
                  size="lg"
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
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Clapperboard size={32} color={Colors.dust} />
              <Text style={styles.emptyListText}>No titles registered in this vault yet.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={verdicts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.brass}
            />
          }
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
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Gavel size={32} color={Colors.dust} />
              <Text style={styles.emptyListText}>No verdicts delivered on this profile yet.</Text>
            </View>
          }
        />
      )}

      {/* Leave Verdict Modal */}
      <LeaveVerdictModal
        visible={verdictModalVisible}
        targetUser={profileUser}
        onClose={() => setVerdictModalVisible(false)}
        onSubmit={handleDeliverVerdict}
      />

      {/* Avatar Picker Modal */}
      {isSelf && currentUser && (
        <AvatarPickerModal
          visible={avatarModalVisible}
          onClose={() => setAvatarModalVisible(false)}
          username={currentUser.username}
          currentAvatarUrl={currentUser.avatarUrl || null}
          onSave={handleSaveAvatar}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.ink,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.dust,
    letterSpacing: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.ink,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorIconBox: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: "rgba(169, 50, 38, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(169, 50, 38, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    color: Colors.paper,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2,
  },
  errorSubtitle: {
    color: Colors.dust,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  profileCard: {
    backgroundColor: Colors.velvet,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    overflow: "hidden",
  },
  cardHeaderAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.brass,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  avatarEditContainer: {
    position: "relative",
  },
  pencilBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.velvet,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderRadius: Radius.full,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  profileDetails: {
    flex: 1,
    gap: 4,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: -0.3,
  },
  profileBio: {
    fontSize: 13,
    color: Colors.dust,
    lineHeight: 18,
  },
  profileBioEmpty: {
    fontSize: 12,
    fontStyle: "italic",
    color: Colors.dust,
    opacity: 0.6,
  },
  profileActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  tasteMatchCard: {
    backgroundColor: "rgba(197, 165, 114, 0.08)",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(197, 165, 114, 0.25)",
    marginBottom: Spacing.md,
    gap: 6,
  },
  tasteMatchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tasteMatchTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.brass,
    letterSpacing: 1.2,
  },
  tasteMatchScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  tasteMatchScore: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: -0.5,
  },
  tasteMatchSummary: {
    flex: 1,
    fontSize: 12,
    color: Colors.dust,
    lineHeight: 16,
  },
  tasteGaugeWrapper: {
    marginBottom: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.velvet,
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.hairline,
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
    backgroundColor: Colors.inkElevated,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dust,
  },
  tabTextActive: {
    color: Colors.paper,
    fontWeight: "800",
  },
  movieRow: {
    marginBottom: Spacing.md,
  },
  emptyList: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyListText: {
    fontSize: 13,
    color: Colors.dust,
    textAlign: "center",
  },
});
