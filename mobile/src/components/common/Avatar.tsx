import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Colors, Radius } from "../../constants/theme";

interface AvatarProps {
  uri?: string | null;
  username?: string;
  size?: number;
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  username = "User",
  size = 40,
  ring = true,
  style,
}) => {
  const initial = username ? username.charAt(0).toUpperCase() : "U";

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: Radius.none, // sharp square film ticket look or slight radius
  };

  const imageUri =
    uri && uri !== ""
      ? uri
      : `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(username || "verdict")}`;

  return (
    <View
      style={[
        containerStyle,
        styles.avatarWrapper,
        ring && styles.ringBorder,
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri: imageUri }}
          style={[containerStyle, styles.image]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[containerStyle, styles.fallback]}>
          <Text style={[styles.initial, { fontSize: size * 0.44 }]}>{initial}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    overflow: "hidden",
    backgroundColor: Colors.velvetElevated,
  },
  ringBorder: {
    borderWidth: 1.5,
    borderColor: Colors.borderBrass,
  },
  image: {
    backgroundColor: Colors.velvetElevated,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.velvetElevated,
  },
  initial: {
    color: Colors.brassLight,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

