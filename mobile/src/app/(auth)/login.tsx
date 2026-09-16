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
import { Film, Mail, Lock, Sparkles, ArrowRight } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required Fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials.");
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
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Demo Login Failed", err.message || "Failed to log in with demo account.");
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
              <Film size={28} color={Colors.primaryLight} />
            </View>
            <Text style={styles.brandTitle}>VERDICT</Text>
            <Text style={styles.brandSubtitle}>
              Rate films. Calculate your Taste Score. Deliver your verdict.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Input
              label="EMAIL ADDRESS"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={Colors.textSubtle} />}
            />

            <Input
              label="PASSWORD"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={18} color={Colors.textSubtle} />}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            {/* Quick Demo Login Option */}
            <View style={styles.demoSection}>
              <View style={styles.demoDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>QUICK DEMO ACCOUNTS</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.demoButtonsRow}>
                <Button
                  title="Demo (Alice)"
                  variant="secondary"
                  size="sm"
                  onPress={() => handleDemoLogin("alice@example.com", "password123")}
                  style={styles.demoBtn}
                  icon={<Sparkles size={14} color={Colors.primaryLight} />}
                />
                <Button
                  title="Demo (Bob)"
                  variant="secondary"
                  size="sm"
                  onPress={() => handleDemoLogin("bob@example.com", "password123")}
                  style={styles.demoBtn}
                  icon={<Sparkles size={14} color={Colors.gold} />}
                />
              </View>
            </View>
          </View>

          {/* Footer link to sign up */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}> Create one</Text>
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
    backgroundColor: Colors.background,
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
    marginBottom: Spacing.xxl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.borderSubtle,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSubtle,
    letterSpacing: 1,
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
    marginTop: Spacing.xxl,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primaryLight,
    fontWeight: "700",
    fontSize: 14,
  },
});
