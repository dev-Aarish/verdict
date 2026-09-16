import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { X, Share2, Film, Sparkles } from "lucide-react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { User, TasteScoreBreakdown } from "../../types";
import { Button } from "./Button";
import { Avatar } from "./Avatar";

interface ShareCardModalProps {
  visible: boolean;
  user: User | null;
  score: TasteScoreBreakdown | null;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  visible,
  user,
  score,
  onClose,
}) => {
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  if (!user) return null;

  const totalScore = score?.total ?? 0;
  const diversity = score?.diversity ?? 0;
  const obscurity = score?.obscurity ?? 0;
  const consistency = score?.consistency ?? 0;

  const getTier = (s: number) => {
    if (s >= 80) return "CINEPHILE TASTE";
    if (s >= 65) return "DEEP CUT CURATOR";
    if (s >= 50) return "ECLECTIC VIEWER";
    return "MAINSTREAM CRITIC";
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1.0,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Share Card", "Sharing is not supported on this platform.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Share @${user.username}'s Verdict Taste Card`,
        UTI: "public.png",
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate shareable card.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.content}>
          <View style={styles.topActions}>
            <Text style={styles.modalTitle}>Share Taste Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Captured Card Container */}
          <View style={styles.cardWrapper}>
            <View ref={cardRef} collapsable={false} style={styles.captureCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.brandRow}>
                  <Film size={18} color={Colors.primaryLight} />
                  <Text style={styles.brandName}>VERDICT</Text>
                </View>
                <Text style={styles.cardDate}>
                  {new Date().toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>

              {/* User Profile */}
              <View style={styles.userSection}>
                <Avatar
                  uri={user.avatarUrl}
                  username={user.username}
                  size={52}
                />
                <View style={styles.userMeta}>
                  <Text style={styles.username}>@{user.username}</Text>
                  <Text style={styles.tierText}>{getTier(totalScore)}</Text>
                </View>
              </View>

              {/* Main Score Hero */}
              <View style={styles.heroScoreContainer}>
                <View style={styles.heroScoreRow}>
                  <Text style={styles.heroScoreNumber}>{totalScore}</Text>
                  <Text style={styles.heroScoreMax}>/100</Text>
                </View>
                <Text style={styles.heroScoreLabel}>CINEMATIC TASTE INDEX</Text>
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>{diversity}%</Text>
                  <Text style={styles.metricName}>Diversity</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricVal, { color: Colors.gold }]}>{obscurity}%</Text>
                  <Text style={styles.metricName}>Obscurity</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricVal, { color: Colors.emerald }]}>{consistency}%</Text>
                  <Text style={styles.metricName}>Consistency</Text>
                </View>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Sparkles size={14} color={Colors.primaryLight} />
                <Text style={styles.cardFooterText}>verdict.app/@{user.username}</Text>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <Button
            title="Share to Instagram / Stories"
            onPress={handleShare}
            loading={isSharing}
            icon={<Share2 size={18} color="#fff" />}
            size="lg"
            style={styles.shareBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
  },
  cardWrapper: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  captureCard: {
    width: "100%",
    backgroundColor: "#0d0e15",
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.4)",
    gap: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 2,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.textSubtle,
    fontWeight: "600",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  userMeta: {
    gap: 2,
  },
  username: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryLight,
    letterSpacing: 0.8,
  },
  heroScoreContainer: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  heroScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  heroScoreNumber: {
    fontSize: 56,
    fontWeight: "900",
    color: "#ffffff",
  },
  heroScoreMax: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textSubtle,
  },
  heroScoreLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 2,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primaryLight,
  },
  metricName: {
    fontSize: 11,
    color: Colors.textSubtle,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: Spacing.md,
  },
  cardFooterText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSubtle,
    letterSpacing: 0.5,
  },
  shareBtn: {
    width: "100%",
  },
});
