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
  Plus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { usersApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Avatar } from "../../components/common/Avatar";
import { TasteScoreGauge } from "../../components/common/TasteScoreGauge";
import { MovieCard } from "../../components/common/MovieCard";
import { VerdictCard } from "../../components/common/VerdictCard";
import { Button } from "../../components/common/Button";
import { ShareCardModal } from "../../components/common/ShareCardModal";

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
        <Film size={48} color={Colors.dust} />
        <Text style={styles.authGateTitle}>Taste Profile</Text>
        <Text style={styles.authGateSubtitle}>
          Sign in to view your Taste Score, analyze your cinematic habits, and share your card.
        </Text>
        <Button
          title="Sign In"
          variant="primary"
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
          <Avatar uri={user.avatarUrl} username={user.username} size={60} />
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>@{user.username}</Text>
            {user.bio ? (
              <Text style={styles.profileBio}>{user.bio}</Text>
            ) : (
              <Text style={styles.profileBioPlaceholder}>No taste bio registered yet</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.profileActions}>
          <Button
            title="Export Card"
            variant="primary"
            size="sm"
            onPress={() => setShareModalVisible(true)}
            icon={<Share2 size={13} color={Colors.inkDark} />}
            style={styles.profileActionBtn}
          />
          <Button
            title="Log Out"
            variant="secondary"
            size="sm"
            onPress={handleLogout}
            icon={<LogOut size={13} color={Colors.dustLight} />}
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
          activeOpacity={0.75}
          onPress={() => setActiveTab("watched")}
        >
          <Film
            size={14}
            color={activeTab === "watched" ? Colors.inkDark : Colors.dustLight}
          />
          <Text
            style={[styles.tabText, activeTab === "watched" && styles.tabTextActive]}
          >
            Vault Archive ({watchedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "verdicts" && styles.tabButtonActive]}
          activeOpacity={0.75}
          onPress={() => setActiveTab("verdicts")}
        >
          <Gavel
            size={14}
            color={activeTab === "verdicts" ? Colors.inkDark : Colors.dustLight}
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

  const renderEmpty = () => {
    if (activeTab === "watched") {
      return (
        <View style={styles.emptyContainer}>
          <Film size={40} color={Colors.dust} />
          <Text style={styles.emptyTitle}>Vault Is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Log at least 3 films to compute your full Taste Index and breakdown!
          </Text>
          <Button
            title="Browse & Log Films"
            variant="primary"
            onPress={() => router.push("/(tabs)/search")}
            size="sm"
            icon={<Plus size={14} color={Colors.inkDark} />}
            style={styles.emptyBtn}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Gavel size={40} color={Colors.dust} />
        <Text style={styles.emptyTitle}>No Verdicts Received</Text>
        <Text style={styles.emptySubtitle}>
          Export your Taste Ticket to let friends analyze and rate your taste.
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
              tintColor={Colors.brass}
              colors={[Colors.brass]}
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
              tintColor={Colors.brass}
              colors={[Colors.brass]}
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
    backgroundColor: Colors.ink,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  authGateContainer: {
    flex: 1,
    backgroundColor: Colors.ink,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  authGateTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 0.5,
  },
  authGateSubtitle: {
    fontSize: 13,
    color: Colors.dust,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
  authGateBtn: {
    width: 200,
    marginTop: Spacing.md,
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  profileCard: {
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
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
    gap: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 0.2,
  },
  profileBio: {
    fontSize: 12,
    color: Colors.dustLight,
    lineHeight: 17,
  },
  profileBioPlaceholder: {
    fontSize: 11,
    color: Colors.dust,
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
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: Radius.none,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.brass,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.dustLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: Colors.inkDark,
    fontWeight: "900",
  },
  movieRow: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    padding: Spacing.xxxl,
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
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
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: Spacing.md,
  },
});

