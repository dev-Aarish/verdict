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
import { X, Star } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Movie } from "../../types";
import { Button } from "./Button";
import { Input } from "./Input";

interface LogMovieModalProps {
  visible: boolean;
  movie: Movie | null;
  onClose: () => void;
  onSubmit: (params: { imdbId: string; rating: number; review?: string }) => Promise<void>;
}

export const LogMovieModal: React.FC<LogMovieModalProps> = ({
  visible,
  movie,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(80);
  const [review, setReview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!movie) return null;

  const handleRatingChange = (newRating: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setRating(newRating);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        imdbId: movie.imdbId || movie.id,
        rating,
        review: review.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetScores = [50, 65, 75, 85, 95, 100];

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
            <View style={styles.titleContainer}>
              <Text style={styles.headerSubtitle}>LOG FILM</Text>
              <Text numberOfLines={1} style={styles.movieTitle}>
                {movie.title} {movie.year ? `(${movie.year})` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Rating Selector */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>YOUR RATING</Text>
              <View style={styles.scoreDisplay}>
                <Star size={28} color={Colors.gold} fill={Colors.gold} />
                <Text style={styles.scoreNumber}>{rating}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>

              <View style={styles.presetRow}>
                {presetScores.map((score) => (
                  <TouchableOpacity
                    key={score}
                    onPress={() => handleRatingChange(score)}
                    style={[
                      styles.presetChip,
                      rating === score && styles.presetChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        rating === score && styles.presetChipTextActive,
                      ]}
                    >
                      {score}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Review / Verdict */}
            <View style={styles.reviewSection}>
              <Input
                label="VERDICT / THOUGHTS (OPTIONAL)"
                placeholder="What made this film memorable to you?"
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={3}
                style={styles.reviewInput}
              />
            </View>

            <Button
              title="Save to Watched List"
              onPress={handleSubmit}
              loading={isSubmitting}
              size="lg"
              style={styles.submitBtn}
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
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
  },
  ratingSection: {
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
    marginBottom: Spacing.sm,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginVertical: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 44,
    fontWeight: "900",
    color: Colors.text,
  },
  scoreMax: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textSubtle,
  },
  presetRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  presetChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  presetChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  reviewSection: {
    marginBottom: Spacing.lg,
  },
  reviewInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
});
