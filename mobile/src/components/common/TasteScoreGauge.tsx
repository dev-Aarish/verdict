import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { TasteScoreBreakdown } from "../../types";
import { Badge } from "./Badge";

interface TasteScoreGaugeProps {
  score?: TasteScoreBreakdown | null;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export const TasteScoreGauge: React.FC<TasteScoreGaugeProps> = ({
  score,
  size = "md",
  style,
}) => {
  const total = score?.total ?? 0;
  const diversity = score?.diversity ?? 0;
  const obscurity = score?.obscurity ?? 0;
  const consistency = score?.consistency ?? 0;

  const getTier = (s: number) => {
    if (s >= 80) return { label: "Cinephile", variant: "purple" as const };
    if (s >= 65) return { label: "Deep Cut", variant: "gold" as const };
    if (s >= 50) return { label: "Curator", variant: "emerald" as const };
    return { label: "Mainstream", variant: "primary" as const };
  };

  const tier = getTier(total);

  if (size === "sm") {
    return (
      <View style={[styles.smContainer, style]}>
        <View style={styles.smScoreCircle}>
          <Text style={styles.smScoreText}>{total}</Text>
        </View>
        <Badge label={tier.label} variant={tier.variant} size="sm" />
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subheading}>CINEMATIC TASTE SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.totalScore}>{total}</Text>
            <Text style={styles.totalDenominator}>/100</Text>
          </View>
        </View>
        <Badge label={tier.label} variant={tier.variant} size="md" />
      </View>

      <View style={styles.divider} />

      <View style={styles.breakdownContainer}>
        {/* Diversity */}
        <View style={styles.metricRow}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Diversity</Text>
            <Text style={styles.metricValue}>{diversity}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, diversity))}%`, backgroundColor: Colors.primaryLight },
              ]}
            />
          </View>
        </View>

        {/* Obscurity */}
        <View style={styles.metricRow}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Obscurity (Gems)</Text>
            <Text style={styles.metricValue}>{obscurity}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, obscurity))}%`, backgroundColor: Colors.gold },
              ]}
            />
          </View>
        </View>

        {/* Consistency */}
        <View style={styles.metricRow}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Consistency</Text>
            <Text style={styles.metricValue}>{consistency}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, consistency))}%`, backgroundColor: Colors.emerald },
              ]}
            />
          </View>
        </View>
      </View>

      {Array.isArray(score?.dominantGenres) && score.dominantGenres.length > 0 && (
        <View style={styles.genreTagsRow}>
          {score.dominantGenres.slice(0, 3).map((g, idx) => (
            <Badge
              key={idx}
              label={`${g.genre} (${g.percentage}%)`}
              variant="outline"
              size="sm"
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  subheading: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: Colors.textMuted,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  totalScore: {
    fontSize: 38,
    fontWeight: "800",
    color: Colors.text,
  },
  totalDenominator: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSubtle,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.md,
  },
  breakdownContainer: {
    gap: Spacing.md,
  },
  metricRow: {
    gap: 6,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  genreTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  smContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  smScoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  smScoreText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
});
