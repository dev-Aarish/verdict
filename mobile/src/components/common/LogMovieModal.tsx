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
import { Stamp } from "./Stamp";

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
  const [rating, setRating] = useState<number>(85);
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
              <Text style={styles.headerSubtitle}>ARCHIVE TO VAULT</Text>
              <Text numberOfLines={1} style={styles.movieTitle}>
                {movie.title} {movie.year ? `(${movie.year})` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.dustLight} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Rating Selector */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>YOUR CRITICAL RATING</Text>
              <View style={styles.scoreDisplay}>
                <Stamp size="md" rotation={-2} variant="brass" animate="settle">
                  {rating}
                </Stamp>
              </View>

              <View style={styles.presetRow}>
                {presetScores.map((score) => (
                  <TouchableOpacity
                    key={score}
                    activeOpacity={0.75}
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
                label="PERSONAL NOTE (OPTIONAL)"
                placeholder="A line on why it struck or missed you…"
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={3}
                style={styles.reviewInput}
              />
            </View>

            <Button
              title="Save to Watched Archive"
              onPress={handleSubmit}
              loading={isSubmitting}
              size="lg"
              variant="primary"
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
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 1.2,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.paper,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: Colors.velvetElevated,
  },
  ratingSection: {
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
    marginBottom: Spacing.sm,
  },
  scoreDisplay: {
    marginVertical: Spacing.sm,
  },
  presetRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.none,
    backgroundColor: Colors.velvet,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.brassSubtle,
    borderColor: Colors.brass,
  },
  presetChipText: {
    color: Colors.dustLight,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  presetChipTextActive: {
    color: Colors.brassLight,
    fontWeight: "900",
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

