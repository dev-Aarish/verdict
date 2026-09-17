import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Film,
  Ticket,
  ArrowRight,
  ShieldCheck,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { LogoMark } from "../../components/common/Logo";

interface GuestPassCardProps {
  name: string;
  role: string;
  email: string;
  pass: string;
  onSelect: (email: string, pass: string) => void;
  disabled?: boolean;
}

function GuestPassCard({
  name,
  role,
  email,
  pass,
  onSelect,
  disabled,
}: GuestPassCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const handlePress = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSelect(email, pass);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={styles.guestPassCard}
      >
        <View style={styles.guestPassTopRow}>
          <View style={styles.guestPassBadge}>
            <Text style={styles.guestPassBadgeText}>PASS</Text>
          </View>
          <Sparkles size={12} color={Colors.brass} />
        </View>
        <Text style={styles.guestPassName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.guestPassRole} numberOfLines={1}>
          {role}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Credentials Required",
        "Please provide both your email or username and passkey to enter the screening room."
      );
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace("/(tabs)");
    } catch (err: any) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert("Access Denied", err.message || "Invalid credentials provided.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace("/(tabs)");
    } catch (err: any) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert(
        "Demo Access Failed",
        err.message || "Failed to log in with guest jury pass."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Presentation */}
          <View style={styles.brandHeader}>
            <View style={styles.logoContainer}>
              <LogoMark size={40} color={Colors.brass} />
            </View>
            <Text style={styles.brandTitle}>VERDICT</Text>
            <Text style={styles.brandTagline}>
              The screening room for cinema verdicts & taste calibration
            </Text>
          </View>

          {/* Main Admission Card */}
          <View style={styles.cardContainer}>
            {/* Card Header Notch / Meta info */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ticket size={13} color={Colors.brass} />
                <Text style={styles.cardHeaderText}>MEMBER ADMISSION</Text>
              </View>
              <Text style={styles.cardHeaderRight}>AUTHENTICATED ACCESS</Text>
            </View>

            <View style={styles.formBody}>
              <Input
                label="Member Identifier"
                placeholder="Email or Username"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Mail size={16} color={Colors.dust} />}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Passkey"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={16} color={Colors.dust} />}
                containerStyle={styles.inputContainer}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setShowPassword((prev) => !prev);
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={Colors.brass} />
                    ) : (
                      <Eye size={16} color={Colors.dust} />
                    )}
                  </TouchableOpacity>
                }
              />

              <Button
                title="Take Your Seat"
                onPress={handleLogin}
                loading={loading}
                variant="brass"
                size="lg"
                style={styles.submitBtn}
                icon={<Film size={16} color={Colors.inkDark} />}
              />

              {/* Guest Jury Passes */}
              <View style={styles.guestPassSection}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerHairline} />
                  <Text style={styles.dividerLabel}>GUEST JURY PASSES</Text>
                  <View style={styles.dividerHairline} />
                </View>

                <View style={styles.guestPassRow}>
                  <GuestPassCard
                    name="Alice"
                    role="Lead Critic"
                    email="alice@example.com"
                    pass="password123"
                    onSelect={handleDemoLogin}
                    disabled={loading}
                  />
                  <GuestPassCard
                    name="Bob"
                    role="Film Auteur"
                    email="bob@example.com"
                    pass="password123"
                    onSelect={handleDemoLogin}
                    disabled={loading}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Footer - Membership Enrollment Link */}
          <View style={styles.footer}>
            <Text style={styles.footerPrompt}>No ticket yet?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                router.push("/(auth)/signup");
              }}
              style={styles.footerLinkWrapper}
            >
              <Text style={styles.footerLinkText}>Get on the jury list</Text>
              <ArrowRight size={13} color={Colors.brass} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    justifyContent: "center",
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 5,
  },
  brandTagline: {
    fontSize: 13,
    color: Colors.dustLight,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  cardContainer: {
    backgroundColor: Colors.velvet,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: "rgba(20, 21, 29, 0.6)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brass,
    letterSpacing: 1.5,
  },
  cardHeaderRight: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 9,
    color: Colors.dust,
    letterSpacing: 1,
  },
  formBody: {
    padding: Spacing.xl,
  },
  inputContainer: {
    backgroundColor: Colors.velvetElevated,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  guestPassSection: {
    marginTop: Spacing.xxl,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  dividerHairline: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerLabel: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 9,
    fontWeight: "700",
    color: Colors.dust,
    letterSpacing: 1.5,
    marginHorizontal: Spacing.md,
  },
  guestPassRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  guestPassCard: {
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: "rgba(197, 165, 114, 0.2)",
    borderRadius: Radius.none,
    padding: Spacing.md,
  },
  guestPassTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  guestPassBadge: {
    backgroundColor: "rgba(197, 165, 114, 0.12)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: Colors.brass,
  },
  guestPassBadgeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 8,
    fontWeight: "800",
    color: Colors.brass,
    letterSpacing: 1,
  },
  guestPassName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.paper,
    letterSpacing: 0.5,
  },
  guestPassRole: {
    fontSize: 11,
    color: Colors.dust,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xxl,
    gap: Spacing.xs,
  },
  footerPrompt: {
    color: Colors.dust,
    fontSize: 13,
  },
  footerLinkWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerLinkText: {
    color: Colors.brass,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});

