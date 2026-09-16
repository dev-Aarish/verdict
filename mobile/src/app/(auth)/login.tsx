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
import { Mail, Lock, Sparkles, Clapperboard, Award } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { LogoMark } from "../../components/common/Logo";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Credentials Required", "Please provide both an email and password to enter the screening room.");
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
      Alert.alert("Demo Access Failed", err.message || "Failed to log in with demo account.");
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
        >
          {/* Header Brand */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <LogoMark size={36} color={Colors.brass} />
            </View>
            <Text style={styles.brandTitle}>VERDICT</Text>
            <Text style={styles.brandSubtitle}>
              THE SCREENING ROOM FOR CINEPHILES
            </Text>
            <Text style={styles.brandTagline}>
              Log films. Compute your Taste Score. Deliver your critical verdict.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.formAccentBar} />
            
            <Input
              label="MEMBER EMAIL"
              placeholder="critic@screeningroom.org"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={Colors.dust} />}
            />

            <Input
              label="PASSKEY"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={18} color={Colors.dust} />}
            />

            <Button
              title="Enter Screening Room"
              onPress={handleLogin}
              loading={loading}
              variant="brass"
              size="lg"
              style={styles.submitBtn}
            />

            {/* Quick Demo Login Option */}
            <View style={styles.demoSection}>
              <View style={styles.demoDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>JURY GUEST PASSES</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.demoButtonsRow}>
                <Button
                  title="Alice (Critic)"
                  variant="secondary"
                  size="sm"
                  onPress={() => handleDemoLogin("alice@example.com", "password123")}
                  style={styles.demoBtn}
                  icon={<Sparkles size={13} color={Colors.brass} />}
                />
                <Button
                  title="Bob (Auteur)"
                  variant="secondary"
                  size="sm"
                  onPress={() => handleDemoLogin("bob@example.com", "password123")}
                  style={styles.demoBtn}
                  icon={<Sparkles size={13} color={Colors.brass} />}
                />
              </View>
            </View>
          </View>

          {/* Footer link to sign up */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to the screening room?</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                router.push("/(auth)/signup");
              }}
            >
              <Text style={styles.footerLink}> Request Credentials</Text>
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
    padding: Spacing.xl,
    justifyContent: "center",
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(197, 165, 114, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(197, 165, 114, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brass,
    letterSpacing: 2,
    marginTop: 4,
  },
  brandTagline: {
    fontSize: 13,
    color: Colors.dust,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 290,
    lineHeight: 18,
  },
  formContainer: {
    backgroundColor: Colors.velvet,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: "hidden",
  },
  formAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.brass,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  demoSection: {
    marginTop: Spacing.xl,
  },
  demoDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.hairline,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.dust,
    letterSpacing: 1.5,
    marginHorizontal: Spacing.sm,
  },
  demoButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  demoBtn: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  footerText: {
    color: Colors.dust,
    fontSize: 13,
  },
  footerLink: {
    color: Colors.brass,
    fontWeight: "700",
    fontSize: 13,
  },
});
