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
import { User, Mail, Lock, Eye, EyeOff, AlignLeft, Sparkles } from "lucide-react-native";
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
      Alert.alert("Required Credentials", "Please provide a username, email, and password.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Security Requirement", "Your passkey must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await signup(username.trim(), email.trim(), password, bio.trim() || undefined);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      router.replace("/(tabs)");
    } catch (err: any) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert("Registration Failed", err.message || "Could not complete membership enrollment.");
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
              <LogoMark size={34} color={Colors.brass} />
            </View>
            <Text style={styles.brandTitle}>JOIN THE JURY</Text>
            <Text style={styles.brandSubtitle}>
              MEMBERSHIP ENROLLMENT
            </Text>
            <Text style={styles.brandTagline}>
              Establish your critical dossier and calibrate your cinematic taste.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.formAccentBar} />

            <Input
              label="HANDLE / CALLSIGN"
              placeholder="e.g. godard_enjoyer"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              leftIcon={<User size={18} color={Colors.dust} />}
            />

            <Input
              label="EMAIL ADDRESS"
              placeholder="critic@screeningroom.org"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={Colors.dust} />}
            />

            <Input
              label="PASSKEY (MIN 8 CHARACTERS)"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={18} color={Colors.dust} />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setShowPassword((prev) => !prev);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.brass} />
                  ) : (
                    <Eye size={18} color={Colors.dust} />
                  )}
                </TouchableOpacity>
              }
            />

            <Input
              label="CRITICAL STATEMENT / BIO (OPTIONAL)"
              placeholder="A24 aficionado, 70mm purist, French New Wave..."
              value={bio}
              onChangeText={setBio}
              leftIcon={<AlignLeft size={18} color={Colors.dust} />}
            />

            <Button
              title="Enroll in Screening Room"
              onPress={handleSignup}
              loading={loading}
              variant="brass"
              size="lg"
              style={styles.submitBtn}
            />
          </View>

          {/* Footer link to sign in */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already enrolled in the jury?</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                router.push("/(auth)/login");
              }}
            >
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
    width: 60,
    height: 60,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(197, 165, 114, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(197, 165, 114, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.paper,
    letterSpacing: 3,
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
    marginTop: 6,
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
