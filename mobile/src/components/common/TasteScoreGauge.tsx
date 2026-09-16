import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { TasteScoreBreakdown } from "../../types";
import { Badge } from "./Badge";
import { Stamp } from "./Stamp";

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
    if (s >= 80) return { label: "Cinephile God", variant: "brass" as const };
    if (s >= 65) return { label: "Deep Cut Curator", variant: "brass" as const };
    if (s >= 50) return { label: "Commendable", variant: "default" as const };
    return { label: "Mainstream Critic", variant: "outline" as const };
  };

  const tier = getTier(total);

  if (size === "sm") {
    return (
      <View style={[styles.smContainer, style]}>
        <Stamp size="xs" rotation={-2} variant="brass">
          {total}
        </Stamp>
        <Badge label={tier.label} variant={tier.variant} size="sm" />
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.subheading}>CINEMATIC TASTE INDEX</Text>
          <Text style={styles.tierTitle}>{tier.label}</Text>
        </View>
        <Stamp size="lg" rotation={-3} label="Taste Score" variant="brass" animate="settle">
          {total}
        </Stamp>
      </View>

      <View style={styles.divider} />

      <View style={styles.breakdownContainer}>
        {/* Diversity */}
        <View style={styles.metricRow}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Genre Diversity</Text>
            <Text style={styles.metricValue}>{diversity}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, diversity))}%`, backgroundColor: Colors.brass },
              ]}
            />
          </View>
        </View>

        {/* Obscurity */}
        <View style={styles.metricRow}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Obscurity & Deep Cuts</Text>
            <Text style={styles.metricValue}>{obscurity}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, obscurity))}%`, backgroundColor: Colors.brassLight },
              ]}
            />
          </View>
        </View>

        {/* Consistency */}
        <View style={styles.metricRow}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Critical Consistency</Text>
            <Text style={styles.metricValue}>{consistency}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, consistency))}%`, backgroundColor: "#81C784" },
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
              label={`${g.genre} · ${g.percentage}%`}
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
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitles: {
    flex: 1,
    gap: 4,
  },
  subheading: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: Colors.dust,
    textTransform: "uppercase",
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 0.2,
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
    fontSize: 12,
    color: Colors.dustLight,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 12,
    color: Colors.paper,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.velvetElevated,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
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
});

