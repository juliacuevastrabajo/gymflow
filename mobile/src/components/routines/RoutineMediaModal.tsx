import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { GymFlowTheme } from "../GymFlowDesignSystem";

export type RoutineMediaItem = {
  tipo: "IMAGEN" | "VIDEO";
  uri: string;
  titulo: string;
};

export default function RoutineMediaModal({
  item,
  windowWidth,
  theme,
  onClose,
}: {
  item: RoutineMediaItem | null;
  windowWidth: number;
  theme: GymFlowTheme;
  onClose: () => void;
}) {
  if (!item) {
    return null;
  }

  const isVideo = item.tipo === "VIDEO";
  const mediaHeight = Math.min(Math.max(windowWidth * 1.05, 280), 560);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={styles.backdrop}
      >
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <View style={styles.titleCopy}>
              <Text style={styles.kicker}>{isVideo ? "VÍDEO" : "IMAGEN"}</Text>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                {item.titulo}
              </Text>
            </View>
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.surfaceSoft }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar multimedia"
              hitSlop={8}
            >
              <MaterialCommunityIcons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.mediaStage, { height: mediaHeight }]}>
            {isVideo ? (
              <Video
                source={{ uri: item.uri }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
                isLooping={false}
                onError={() =>
                  Alert.alert(
                    "Vídeo no disponible",
                    "No se pudo reproducir este vídeo ahora mismo.",
                  )
                }
                accessibilityLabel={`Reproductor de vídeo ${item.titulo}`}
              />
            ) : (
              <Image
                source={{ uri: item.uri }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel={`Imagen ampliada de ${item.titulo}`}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.88)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxHeight: "94%",
    borderRadius: 28,
    padding: 12,
    gap: 12,
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaStage: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
