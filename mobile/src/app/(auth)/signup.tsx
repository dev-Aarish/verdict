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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlignLeft,
  Sparkles,
  Ticket,
  ArrowRight,
  UserPlus,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { LogoMark } from "../../components/common/Logo";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert(
        "Required Credentials",
        "Please provide a username, email, and password to enroll in the jury."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Security Requirement",
        "Your passkey must be at least 8 characters long."
      );
      return;
    }

    setLoading(true);
    try {
      await signup(
        username.trim(),
        email.trim(),
        password,
        bio.trim() || undefined
      );
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace("/(tabs)");
    } catch (err: any) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert(
        "Registration Failed",
        err.message || "Could not complete membership enrollment."
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
          {/* Header Brand */}
          <View style={styles.brandHeader}>
            <View style={styles.logoContainer}>
              <LogoMark size={36} color={Colors.brass} />
            </View>
            <Text style={styles.brandTitle}>JOIN THE JURY</Text>
            <Text style={styles.brandTagline}>
              Establish your critical dossier and calibrate your cinematic taste
            </Text>
          </View>

          {/* Form Docket */}
          <View style={styles.cardContainer}>
            {/* Docket Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ticket size={13} color={Colors.brass} />
                <Text style={styles.cardHeaderText}>MEMBERSHIP DOSSIER</Text>
              </View>
              <Text style={styles.cardHeaderRight}>NEW CRITIC APPLICATION</Text>
            </View>

            <View style={styles.formBody}>
              <Input
                label="Callsign / Handle"
                placeholder="e.g. godard_enjoyer"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                leftIcon={<User size={16} color={Colors.dust} />}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Email Address"
                placeholder="critic@screeningroom.org"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Mail size={16} color={Colors.dust} />}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Passkey (Min 8 Characters)"
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
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={Colors.brass} />
                    ) : (
                      <Eye size={16} color={Colors.dust} />
                    )}
                  </TouchableOpacity>
                }
              />

              <Input
                label="Critical Statement / Bio (Optional)"
                placeholder="A24 devotee, 70mm purist, French New Wave..."
                value={bio}
                onChangeText={setBio}
                leftIcon={<AlignLeft size={16} color={Colors.dust} />}
                containerStyle={styles.inputContainer}
              />

              <Button
                title="Enroll in Screening Room"
                onPress={handleSignup}
                loading={loading}
                variant="brass"
                size="lg"
                style={styles.submitBtn}
                icon={<UserPlus size={16} color={Colors.inkDark} />}
              />
            </View>
          </View>

          {/* Footer link to sign in */}
          <View style={styles.footer}>
            <Text style={styles.footerPrompt}>Already enrolled in the jury?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                router.push("/(auth)/login");
              }}
              style={styles.footerLinkWrapper}
            >
              <Text style={styles.footerLinkText}>Sign In</Text>
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
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing.xs,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 4,
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

