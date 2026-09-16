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
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Share2,
  LogOut,
  Film,
  Gavel,
  SlidersHorizontal,
  Plus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { usersApi, moviesApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Avatar } from "../../components/common/Avatar";
import { TasteScoreGauge } from "../../components/common/TasteScoreGauge";
import { MovieCard } from "../../components/common/MovieCard";
import { VerdictCard } from "../../components/common/VerdictCard";
import { Button } from "../../components/common/Button";
import { ShareCardModal } from "../../components/common/ShareCardModal";
import { WatchedEntry, Verdict, TasteScoreBreakdown } from "../../types";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"watched" | "verdicts">("watched");
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);

  const username = user?.username || "";

  // Unified Full Profile Query (1 single fast request instead of 3 redundant ones)
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["fullProfile", username],
    queryFn: () => usersApi.getFullProfile(username),
    enabled: !!username,
  });

  const tasteScore = profileData?.tasteScore || null;
  const watchedList = profileData?.entries || [];
  const verdicts = profileData?.verdicts || [];

  const handleRefresh = async () => {
    await refetch();
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of Verdict?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {}
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.authGateContainer}>
        <Film size={54} color={Colors.textSubtle} />
        <Text style={styles.authGateTitle}>Taste Profile</Text>
        <Text style={styles.authGateSubtitle}>
          Sign in to view your Taste Score, analyze your cinematic habits, and share your card.
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Profile Info Bar */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <Avatar uri={user.avatarUrl} username={user.username} size={64} />
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>@{user.username}</Text>
            {user.bio ? (
              <Text style={styles.profileBio}>{user.bio}</Text>
            ) : (
              <Text style={styles.profileBioPlaceholder}>No taste bio added yet</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.profileActions}>
          <Button
            title="Share Card"
            variant="primary"
            size="sm"
            onPress={() => setShareModalVisible(true)}
            icon={<Share2 size={14} color="#fff" />}
            style={styles.profileActionBtn}
          />
          <Button
            title="Log Out"
            variant="secondary"
            size="sm"
            onPress={handleLogout}
            icon={<LogOut size={14} color={Colors.textMuted} />}
          />
        </View>
      </View>

      {/* Taste Score Hero Gauge */}
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
            Verdicts Received ({verdicts.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (activeTab === "watched") {
      return (
        <View style={styles.emptyContainer}>
          <Film size={40} color={Colors.textSubtle} />
          <Text style={styles.emptyTitle}>No Movies Logged</Text>
          <Text style={styles.emptySubtitle}>
            Log at least 3 films to unlock your deep Cinematic Taste Score!
          </Text>
          <Button
            title="Search & Log Movies"
            onPress={() => router.push("/(tabs)/search")}
            size="sm"
            icon={<Plus size={14} color="#fff" />}
            style={styles.emptyBtn}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Gavel size={40} color={Colors.textSubtle} />
        <Text style={styles.emptyTitle}>No Verdicts Yet</Text>
        <Text style={styles.emptySubtitle}>
          Share your profile link or Taste Card with friends so they can judge your taste.
        </Text>
      </View>
    );
  };

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
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isLoadingProfile}
              onRefresh={handleRefresh}
              tintColor={Colors.primaryLight}
              colors={[Colors.primary]}
            />
          }
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
                targetUser: { id: user.id, username: user.username },
              }}
              onPressUser={(u) => router.push(`/user/${u}`)}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isLoadingProfile}
              onRefresh={handleRefresh}
              tintColor={Colors.primaryLight}
              colors={[Colors.primary]}
            />
          }
        />
      )}

      {/* Share Card Modal */}
      <ShareCardModal
        visible={shareModalVisible}
        user={user}
        score={tasteScore || null}
        onClose={() => setShareModalVisible(false)}
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
  headerContainer: {
    marginBottom: Spacing.md,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
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
  profileBioPlaceholder: {
    fontSize: 12,
    color: Colors.textSubtle,
    fontStyle: "italic",
  },
  profileActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.md,
  },
  profileActionBtn: {
    flex: 1,
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
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
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
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: Spacing.md,
  },
});
