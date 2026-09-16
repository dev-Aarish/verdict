import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Colors, Radius, Spacing } from "../../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  wrapperStyle,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          !!error && styles.containerError,
          containerStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={Colors.dust}
          style={[styles.input, style]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.dustLight,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.none,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  containerFocused: {
    borderColor: Colors.brass,
    backgroundColor: "rgba(37, 39, 51, 0.9)",
  },
  containerError: {
    borderColor: Colors.marqueeRed,
  },
  input: {
    flex: 1,
    color: Colors.paper,
    fontSize: 14,
    height: "100%",
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: Colors.marqueeRed,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});

