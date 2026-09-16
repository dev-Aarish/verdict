import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { X, Share2, Sparkles } from "lucide-react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { User, TasteScoreBreakdown } from "../../types";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { Stamp } from "./Stamp";

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
            <Text style={styles.modalTitle}>OFFICIAL VERDICT TICKET</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.dustLight} />
            </TouchableOpacity>
          </View>

          {/* Captured Ticket Stub Container */}
          <View style={styles.cardWrapper}>
            <View ref={cardRef} collapsable={false} style={styles.ticketStub}>
              {/* TOP PANEL - 72% */}
              <View style={styles.topPanel}>
                <View style={styles.cardHeader}>
                  <Logo size="sm" color={Colors.brass} />
                  <View style={styles.reelMeta}>
                    <Text style={styles.reelLabel}>REEL ID</Text>
                    <Text style={styles.reelNumber}>#{String(totalScore).padStart(3, "0")}</Text>
                  </View>
                </View>

                <View style={styles.centerTaste}>
                  <Text style={styles.tasteOfText}>THE TASTE OF</Text>
                  <Text style={styles.usernameText}>@{user.username}</Text>
                  <View style={styles.stampHolder}>
                    <Stamp size="lg" rotation={-3} label="Taste Score" variant="brass">
                      {totalScore}
                    </Stamp>
                  </View>
                </View>

                {/* Metrics Breakdown */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricVal}>{diversity}%</Text>
                    <Text style={styles.metricName}>Diversity</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={[styles.metricVal, { color: Colors.brassLight }]}>{obscurity}%</Text>
                    <Text style={styles.metricName}>Obscurity</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={[styles.metricVal, { color: "#81C784" }]}>{consistency}%</Text>
                    <Text style={styles.metricName}>Consistency</Text>
                  </View>
                </View>
              </View>

              {/* PERFORATION SEAM WITH NOTCHES */}
              <View style={styles.perforationSeam}>
                <View style={styles.leftNotch} />
                <View style={styles.dashedLine} />
                <View style={styles.rightNotch} />
              </View>

              {/* BOTTOM STUB - 28% */}
              <View style={styles.bottomStub}>
                <View style={styles.stubMeta}>
                  <Text style={styles.stubLabel}>AUD. A · 20:00</Text>
                  <Text style={styles.stubUrl}>verdict.app/@{user.username}</Text>
                </View>
                <Text style={styles.stubQuote}>"A room. A projector. A verdict about to be read."</Text>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <Button
            title="Export Ticket Stub"
            onPress={handleShare}
            loading={isSharing}
            variant="primary"
            icon={<Share2 size={16} color={Colors.inkDark} />}
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
    backgroundColor: "rgba(14, 15, 20, 0.9)",
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderBrass,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: Colors.brassLight,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: Colors.velvetElevated,
  },
  cardWrapper: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  ticketStub: {
    width: "100%",
    backgroundColor: Colors.inkDark,
    borderRadius: Radius.none,
    borderWidth: 2,
    borderColor: Colors.brass,
    overflow: "hidden",
  },
  topPanel: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reelMeta: {
    alignItems: "flex-end",
  },
  reelLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.dust,
    letterSpacing: 1,
  },
  reelNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.paper,
    fontFamily: "monospace",
  },
  centerTaste: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  tasteOfText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.dustLight,
    letterSpacing: 1.5,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.paper,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  stampHolder: {
    marginVertical: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.md,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.velvetElevated,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.paper,
    fontFamily: "monospace",
  },
  metricName: {
    fontSize: 9,
    color: Colors.dust,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  perforationSeam: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    height: 16,
    backgroundColor: Colors.inkDark,
  },
  leftNotch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.velvet,
    marginLeft: -7,
  },
  rightNotch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.velvet,
    marginRight: -7,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderStyle: "dashed",
    marginHorizontal: 4,
  },
  bottomStub: {
    backgroundColor: Colors.velvet,
    padding: Spacing.md,
    gap: 4,
  },
  stubMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stubLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 1,
  },
  stubUrl: {
    fontSize: 10,
    color: Colors.dust,
    fontFamily: "monospace",
  },
  stubQuote: {
    fontSize: 10,
    fontStyle: "italic",
    color: Colors.dustLight,
    marginTop: 2,
  },
  shareBtn: {
    width: "100%",
  },
});

