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
import { Film, User, Mail, Lock, AlignLeft } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Required Fields", "Please provide a username, email, and password.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await signup(username.trim(), email.trim(), password, bio.trim() || undefined);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message || "Could not complete registration.");
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
            <Text style={styles.brandTitle}>JOIN VERDICT</Text>
            <Text style={styles.brandSubtitle}>
              Discover where your cinematic taste stands in the community.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Input
              label="USERNAME"
              placeholder="cinephile99"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              leftIcon={<User size={18} color={Colors.textSubtle} />}
            />

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
              label="PASSWORD (MIN 8 CHARS)"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={18} color={Colors.textSubtle} />}
            />

            <Input
              label="BIO / TASTE STATEMENT (OPTIONAL)"
              placeholder="A24 obsessive, neo-noir fanatic..."
              value={bio}
              onChangeText={setBio}
              leftIcon={<AlignLeft size={18} color={Colors.textSubtle} />}
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />
          </View>

          {/* Footer link to sign in */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.footerLink}> Sign In</Text>
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
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
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
