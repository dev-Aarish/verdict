import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { X } from "lucide-react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Movie } from "../../types";
import { Button } from "./Button";
import { Input } from "./Input";
import { Stamp } from "./Stamp";

interface LogMovieModalProps {
  visible: boolean;
  movie: Movie | null;
  initialRating?: number;
  onClose: () => void;
  onSubmit: (params: { imdbId: string; rating: number; review?: string }) => Promise<void>;
}

export const LogMovieModal: React.FC<LogMovieModalProps> = ({
  visible,
  movie,
  initialRating = 7,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [review, setReview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setReview("");
    }
  }, [visible, initialRating]);

  if (!movie) return null;

  const handleRatingChange = (newRating: number) => {
    const intRating = Math.round(newRating);
    if (intRating !== rating) {
      try {
        Haptics.selectionAsync();
      } catch {}
      setRating(intRating);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        imdbId: movie.imdbId || movie.id,
        rating,
        review: review.trim() || undefined,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
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
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color={Colors.dustLight} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Rating Selector */}
            <View
              style={styles.ratingSection}
              onStartShouldSetResponder={() => {
                Keyboard.dismiss();
                return false;
              }}
            >
              <Text style={styles.sectionLabel}>YOUR CRITICAL RATING</Text>
              <View style={styles.scoreDisplay}>
                <Stamp size="md" rotation={-2} variant={rating <= 4 ? "red" : "brass"} animate="settle">
                  {rating}
                </Stamp>
              </View>

              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  value={rating}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  minimumTrackTintColor={Colors.brass}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.brass}
                  onSlidingStart={() => Keyboard.dismiss()}
                  onValueChange={handleRatingChange}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>1 · Miss</Text>
                  <Text style={styles.sliderLabelText}>10 · Masterpiece</Text>
                </View>
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
  sliderContainer: {
    width: "100%",
    marginTop: Spacing.xs,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  sliderLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.dustLight,
    letterSpacing: 0.5,
  },
  reviewSection: {
    marginBottom: Spacing.lg,
  },
  reviewInput: {
    height: 80,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
});
