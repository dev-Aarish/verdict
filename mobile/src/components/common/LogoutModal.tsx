import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { X, LogOut } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { Button } from "./Button";

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoggingOut?: boolean;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoggingOut = false,
}) => {
  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onClose();
  };

  const handleConfirm = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    await onConfirm();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.content}>
          {/* Top Bar / Eyebrow */}
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>SCREENING ROOM EXIT</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={18} color={Colors.dustLight} />
            </TouchableOpacity>
          </View>

          {/* Icon Badge */}
          <View style={styles.badgeWrapper}>
            <View style={styles.iconBadge}>
              <LogOut size={24} color={Colors.marqueeRedLight} />
            </View>
          </View>

          {/* Text Content */}
          <Text style={styles.title}>Log Out of Verdict?</Text>
          <Text style={styles.message}>
            Are you sure you want to end your session? You will need to sign back in to access your taste score, vault, and verdicts.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Cancel"
              variant="secondary"
              size="sm"
              onPress={handleClose}
              style={styles.actionBtn}
              disabled={isLoggingOut}
            />
            <Button
              title="Log Out"
              variant="danger"
              size="sm"
              onPress={handleConfirm}
              loading={isLoggingOut}
              icon={<LogOut size={13} color={Colors.paper} />}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(14, 15, 20, 0.88)",
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.velvet,
    borderRadius: Radius.none,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: Colors.brassLight,
    textTransform: "uppercase",
  },
  closeBtn: {
    padding: 4,
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  badgeWrapper: {
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  iconBadge: {
    width: 52,
    height: 52,
    backgroundColor: Colors.marqueeRedSubtle,
    borderWidth: 1,
    borderColor: Colors.marqueeRed,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.paper,
    textAlign: "center",
    marginBottom: Spacing.xs,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 13,
    color: Colors.dustLight,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
