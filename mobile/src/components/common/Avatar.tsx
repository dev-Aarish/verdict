import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image, ImageStyle } from "expo-image";
import { Colors, Radius } from "../../constants/theme";

interface AvatarProps {
  uri?: string | null;
  username?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  username = "User",
  size = 40,
  style,
}) => {
  const initial = username ? username.charAt(0).toUpperCase() : "U";

  // Generate deterministic pastel background hue based on username
  const getBackgroundColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      Colors.primary,
      Colors.accent,
      Colors.purple,
      Colors.emerald,
      Colors.cyan,
      "#f97316", // orange
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[containerStyle, styles.image, style as any]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        containerStyle,
        styles.fallback,
        { backgroundColor: getBackgroundColor(username) },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  initial: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
