import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  Platform,
  Pressable,
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
  const inputRef = useRef<TextInput>(null);
  const isMultiline = props.multiline;

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const customHeight = flattenedStyle.height;

  // For multiline input, strip height from input style so container owns the height
  const inputStyle = isMultiline
    ? { ...flattenedStyle, height: undefined, paddingTop: 0, paddingBottom: 0 }
    : style;

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.container,
          isMultiline && styles.containerMultiline,
          isMultiline && customHeight ? { height: customHeight as any } : null,
          isFocused && styles.containerFocused,
          !!error && styles.containerError,
          containerStyle,
        ]}
      >
        {leftIcon && (
          <View pointerEvents="none" style={[styles.leftIcon, isMultiline && styles.iconMultiline]}>
            {leftIcon}
          </View>
        )}
        <TextInput
          ref={inputRef}
          placeholderTextColor={Colors.dust}
          style={[styles.input, isMultiline && styles.inputMultiline, inputStyle]}
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
        {rightIcon && (
          <View pointerEvents="none" style={[styles.rightIcon, isMultiline && styles.iconMultiline]}>
            {rightIcon}
          </View>
        )}
      </Pressable>
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
  containerMultiline: {
    height: undefined,
    minHeight: 80,
    alignItems: "flex-start",
    paddingVertical: 10,
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
  inputMultiline: {
    height: "100%",
    textAlignVertical: "top",
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  iconMultiline: {
    marginTop: Platform.OS === "ios" ? 2 : 0,
  },
  errorText: {
    color: Colors.marqueeRed,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
