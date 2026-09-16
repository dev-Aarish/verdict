import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X, Star, Gavel } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { User } from "../../types";
import { Button } from "./Button";
import { Input } from "./Input";
import { Avatar } from "./Avatar";

interface LeaveVerdictModalProps {
  visible: boolean;
  targetUser: User | null;
  onClose: () => void;
  onSubmit: (params: { toUsername: string; targetUserId?: string; rating: number; comment?: string }) => Promise<void>;
}

export const LeaveVerdictModal: React.FC<LeaveVerdictModalProps> = ({
  visible,
  targetUser,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(4);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!targetUser) return null;

  const handleStarSelect = (stars: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setRating(stars);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        toUsername: targetUser.username,
        targetUserId: targetUser.id,
        rating,
        comment: comment.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Avatar
                uri={targetUser.avatarUrl}
                username={targetUser.username}
                size={40}
              />
              <View style={styles.headerTitles}>
                <Text style={styles.headerSubtitle}>DELIVER VERDICT</Text>
                <Text style={styles.headerUsername}>@{targetUser.username}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Star Rating Section */}
            <View style={styles.starsSection}>
              <Text style={styles.sectionLabel}>JUDGE THEIR TASTE</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => handleStarSelect(star)}
                    style={styles.starBtn}
                  >
                    <Star
                      size={36}
                      color={star <= rating ? Colors.gold : Colors.surfaceElevated}
                      fill={star <= rating ? Colors.gold : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.starHelperText}>
                {rating === 5
                  ? "Flawless & exquisite taste"
                  : rating === 4
                  ? "Great selection of films"
                  : rating === 3
                  ? "Decent, but mainstream"
                  : rating === 2
                  ? "Needs more range"
                  : "Questionable choices"}
              </Text>
            </View>

            {/* Verdict Comment */}
            <View style={styles.commentSection}>
              <Input
                label="VERDICT COMMENT (OPTIONAL)"
                placeholder="What is your analysis of their taste profile?"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                style={styles.commentInput}
              />
            </View>

            <Button
              title="Deliver Verdict"
              onPress={handleSubmit}
              loading={isSubmitting}
              size="lg"
              icon={<Gavel size={18} color="#fff" />}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.xl,
    maxHeight: "85%",
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerTitles: {
    gap: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  headerUsername: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
  },
  starsSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  starsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  starBtn: {
    padding: 4,
  },
  starHelperText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  commentSection: {
    marginBottom: Spacing.lg,
  },
  commentInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
});
