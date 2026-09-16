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
                size={42}
              />
              <View style={styles.headerTitles}>
                <Text style={styles.headerSubtitle}>DELIVER VERDICT</Text>
                <Text style={styles.headerUsername}>@{targetUser.username}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.dustLight} />
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
                      size={32}
                      color={star <= rating ? Colors.brass : Colors.velvetElevated}
                      fill={star <= rating ? Colors.brass : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.starHelperText}>
                {rating === 5
                  ? "Flawless & exquisite taste"
                  : rating === 4
                  ? "Great cinematic curation"
                  : rating === 3
                  ? "Decent, but mainstream"
                  : rating === 2
                  ? "Needs more range & depth"
                  : "Questionable choices"}
              </Text>
            </View>

            {/* Verdict Comment */}
            <View style={styles.commentSection}>
              <Input
                label="VERDICT CRITIQUE (OPTIONAL)"
                placeholder="What is your analysis of their taste profile?"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                style={styles.commentInput}
              />
            </View>

            <Button
              title="Deliver Official Verdict"
              onPress={handleSubmit}
              loading={isSubmitting}
              size="lg"
              icon={<Gavel size={16} color={Colors.inkDark} />}
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
    backgroundColor: "rgba(14, 15, 20, 0.8)",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: Colors.velvet,
    borderTopWidth: 2,
    borderColor: Colors.borderBrass,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.xl,
    maxHeight: "85%",
  },
  dragIndicator: {
    width: 36,
    height: 3,
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
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 1.2,
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.paper,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: Colors.velvetElevated,
  },
  starsSection: {
    backgroundColor: Colors.velvetElevated,
    borderRadius: Radius.none,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.dustLight,
    letterSpacing: 1.2,
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
    color: Colors.brassLight,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    fontStyle: "italic",
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

