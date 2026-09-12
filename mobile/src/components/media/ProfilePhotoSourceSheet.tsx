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
import { SafeAreaView } from "react-native-safe-area-context";

import type { GymFlowTheme } from "@/src/components/GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Props = {
  visible: boolean;
  theme: GymFlowTheme;
  hasPhoto: boolean;
  busy?: boolean;
  cameraAvailable?: boolean;
  onSelect: (source: "CAMERA" | "LIBRARY") => void;
  onRemove: () => void;
  onClose: () => void;
};

function SourceRow({
  icon,
  title,
  description,
  destructive,
  disabled,
  theme,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  destructive?: boolean;
  disabled?: boolean;
  theme: GymFlowTheme;
  onPress: () => void;
}) {
  const color = destructive ? "#C53B45" : theme.text;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && !disabled && styles.pressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconShell, { backgroundColor: theme.surfaceSoft }]}>
        <MaterialCommunityIcons
          name={icon}
          size={23}
          color={destructive ? "#C53B45" : theme.primary}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.muted }]}>{description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
    </Pressable>
  );
}

export function ProfilePhotoSourceSheet({
  visible,
  theme,
  hasPhoto,
  busy = false,
  cameraAvailable = true,
  onSelect,
  onRemove,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => {
            if (!busy) onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector de foto"
        />
        <SafeAreaView
          edges={["bottom", "left", "right"]}
          style={[styles.sheet, { backgroundColor: theme.surface }]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: theme.primary }]}>FOTO DE PERFIL</Text>
              <Text style={[styles.heading, { color: theme.text }]}>Elige una opción</Text>
            </View>
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.surfaceSoft }]}
              onPress={onClose}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={8}
            >
              {busy ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <MaterialCommunityIcons name="close" size={21} color={theme.text} />
              )}
            </Pressable>
          </View>

          {cameraAvailable && (
            <SourceRow
              icon="camera-outline"
              title="Hacer foto"
              description="Usa la cámara de este dispositivo"
              theme={theme}
              disabled={busy}
              onPress={() => onSelect("CAMERA")}
            />
          )}
          <SourceRow
            icon="image-outline"
            title="Elegir de la galería"
            description="Selecciona y recorta una imagen"
            theme={theme}
            disabled={busy}
            onPress={() => onSelect("LIBRARY")}
          />
          {hasPhoto && (
            <SourceRow
              icon="trash-can-outline"
              title="Eliminar foto"
              description="Volver a mostrar tus iniciales"
              destructive
              theme={theme}
              disabled={busy}
              onPress={onRemove}
            />
          )}

          <Pressable
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={onClose}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancelar</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 17,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.6 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 3 },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  pressed: { opacity: 0.72 },
  iconShell: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, minWidth: 0, paddingHorizontal: 14 },
  title: { fontFamily: "Inter_700Bold", fontSize: 15 },
  description: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },
  cancelButton: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  cancelText: { fontFamily: "Inter_700Bold", fontSize: 14 },
});
