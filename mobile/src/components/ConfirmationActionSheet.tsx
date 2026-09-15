import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PrimaryButton, type GymFlowTheme } from "./GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export default function ConfirmationActionSheet({
  visible,
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  description,
  primaryLabel,
  dangerLabel,
  theme,
  bottomInset,
  busy = false,
  onDismiss,
  onConfirm,
}: {
  visible: boolean;
  icon: IconName;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  description: string;
  primaryLabel: string;
  dangerLabel: string;
  theme: GymFlowTheme;
  bottomInset: number;
  busy?: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  const requestDismiss = () => {
    if (!busy) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={requestDismiss}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          disabled={busy}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Cerrar confirmación"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              paddingBottom: Math.max(bottomInset, 18) + 8,
            },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: iconBackgroundColor }]}>
            <MaterialCommunityIcons name={icon} size={25} color={iconColor} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.muted }]}>
            {description}
          </Text>

          <PrimaryButton
            label={primaryLabel}
            theme={theme}
            onPress={onDismiss}
            disabled={busy}
            style={styles.primaryButton}
          />
          <Pressable
            style={[styles.dangerButton, busy && styles.disabledButton]}
            disabled={busy}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel={dangerLabel}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.dangerText}>{dangerLabel}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.36)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 22,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -10 },
    elevation: 12,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },
  primaryButton: {
    marginBottom: 10,
  },
  dangerButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  dangerText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "900",
  },
});
