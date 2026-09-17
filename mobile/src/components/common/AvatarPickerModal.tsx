import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { X, Shuffle, RotateCcw, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { dicebearAvatar, avatarUrlFor, AVATAR_PRESET_SEEDS, randomSeeds } from "../../lib/avatar";
import { Button } from "./Button";

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  currentAvatarUrl: string | null;
  onSave: (avatarUrl: string | null) => Promise<void>;
}

interface AvatarGridItemProps {
  seed: string | null;
  username: string;
  isSelected: boolean;
  onSelect: (url: string | null) => void;
}

const AvatarGridItem = React.memo<AvatarGridItemProps>(({ seed, username, isSelected, onSelect }) => {
  const url = seed ? dicebearAvatar(seed) : null;
  const displayUrl = avatarUrlFor(username, url);

  return (
    <TouchableOpacity
      style={[styles.gridItem, isSelected && styles.gridItemSelected]}
      onPress={() => onSelect(url)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: displayUrl }}
        style={styles.gridItemImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={displayUrl}
        transition={60}
      />
      {isSelected && (
        <View style={styles.checkBadge}>
          <Check size={10} color={Colors.inkDark} strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
});

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  username,
  currentAvatarUrl,
  onSave,
}) => {
  const [selected, setSelected] = useState<string | null>(currentAvatarUrl);
  const [gridSeeds, setGridSeeds] = useState<string[]>(AVATAR_PRESET_SEEDS);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelected(currentAvatarUrl);
      setGridSeeds(AVATAR_PRESET_SEEDS);
      setErrorMessage(null);
    }
  }, [visible, currentAvatarUrl]);

  const handleClose = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((url: string | null) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelected(url);
  }, []);

  const handleShuffle = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setGridSeeds(randomSeeds(24));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSave(selected);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to update avatar. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewUrl = avatarUrlFor(username, selected);
  const gridData: (string | null)[] = [null, ...gridSeeds];

  const renderHeaderComponent = () => (
    <View>
      {/* Live Preview Circle */}
      <View style={styles.previewContainer}>
        <View style={styles.previewRing}>
          <Image
            source={{ uri: previewUrl }}
            style={styles.previewImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={60}
          />
        </View>
        <Text style={styles.previewLabel}>
          {selected === null ? "Auto Avatar (Username Seed)" : "Selected Custom Avatar"}
        </Text>
      </View>

      {/* Quick Action Controls */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionPill}
          onPress={handleShuffle}
          activeOpacity={0.7}
        >
          <Shuffle size={14} color={Colors.brass} />
          <Text style={styles.actionPillText}>Shuffle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => handleSelect(null)}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color={Colors.dustLight} />
          <Text style={styles.actionPillText}>Reset Auto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooterComponent = () => (
    <View style={styles.footerContainer}>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <View style={styles.footerRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={handleClose}
          style={styles.footerBtn}
        />
        <Button
          title="Save Avatar"
          variant="primary"
          onPress={handleSave}
          loading={isSaving}
          style={styles.footerBtn}
        />
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: string | null }) => {
      const url = item ? dicebearAvatar(item) : null;
      const isSelected = selected === url;
      return (
        <AvatarGridItem
          seed={item}
          username={username}
          isSelected={isSelected}
          onSelect={handleSelect}
        />
      );
    },
    [selected, username, handleSelect]
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.sheetContainer}>
          <TouchableOpacity
            style={styles.dragHeaderTouch}
            activeOpacity={0.7}
            onPress={handleClose}
          >
            <View style={styles.dragIndicator} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitles}>
              <Text style={styles.headerSubtitle}>AVATAR SELECTION</Text>
              <Text style={styles.headerTitle}>Choose your avatar</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={Colors.dustLight} />
            </TouchableOpacity>
          </View>

          {/* Virtualized 5-Column Grid */}
          <FlatList
            data={gridData}
            numColumns={5}
            keyExtractor={(item, index) => item || `auto_${index}`}
            renderItem={renderItem}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={renderHeaderComponent}
            ListFooterComponent={renderFooterComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            initialNumToRender={25}
            maxToRenderPerBatch={25}
            windowSize={3}
            removeClippedSubviews={Platform.OS === "android"}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(14, 15, 20, 0.85)",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: Colors.velvet,
    borderTopWidth: 2,
    borderColor: Colors.borderBrass,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 36 : Spacing.lg,
    maxHeight: "88%",
  },
  dragHeaderTouch: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  dragIndicator: {
    width: 42,
    height: 4,
    backgroundColor: Colors.borderBrass,
    borderRadius: Radius.full,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitles: {
    gap: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.brassLight,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.paper,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  previewContainer: {
    alignItems: "center",
    marginVertical: Spacing.sm,
    gap: 8,
  },
  previewRing: {
    width: 80,
    height: 80,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.brass,
    backgroundColor: Colors.velvetElevated,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewLabel: {
    fontSize: 11,
    color: Colors.dustLight,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.paper,
  },
  columnWrapper: {
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  gridItem: {
    flex: 1,
    maxWidth: "18.4%",
    aspectRatio: 1,
    overflow: "hidden",
    backgroundColor: Colors.velvetElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    position: "relative",
  },
  gridItemSelected: {
    borderColor: Colors.brass,
    borderWidth: 2,
  },
  gridItemImage: {
    width: "100%",
    height: "100%",
  },
  checkBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: Colors.brass,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: Colors.marqueeRed,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  footerRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  footerBtn: {
    flex: 1,
  },
});
