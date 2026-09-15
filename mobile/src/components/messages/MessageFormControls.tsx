import { useRef, type ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  findNodeHandle,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colorConAlpha } from "../../theme/colorUtils";
import type { GymFlowTheme } from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type MessageFeedbackValue = {
  tipo: "success" | "error";
  texto: string;
  reintentar?: boolean;
};

export function MessageFormField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  theme,
  accentColor,
  feedback,
  onClearFeedback,
  onFocusTarget,
  multiline = false,
  returnKeyType,
  textAlignVertical,
}: {
  label: string;
  icon: IconName;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  theme: GymFlowTheme;
  accentColor: string;
  feedback?: MessageFeedbackValue | null;
  onClearFeedback: () => void;
  onFocusTarget?: (target: number) => void;
  multiline?: boolean;
  returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
  textAlignVertical?: ComponentProps<typeof TextInput>["textAlignVertical"];
}) {
  const inputRef = useRef<TextInput | null>(null);

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          multiline && styles.textAreaShell,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.border,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (feedback?.tipo === "error") {
              onClearFeedback();
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[
            styles.input,
            multiline && styles.textArea,
            { color: theme.text },
          ]}
          multiline={multiline}
          textAlignVertical={textAlignVertical}
          autoCorrect
          returnKeyType={returnKeyType}
          onFocus={() => {
            const target = findNodeHandle(inputRef.current);
            if (target !== null) {
              onFocusTarget?.(target);
            }
          }}
        />
      </View>
    </View>
  );
}

export function MessageFeedback({
  feedback,
  accentColor,
  onClose,
  onRetry,
}: {
  feedback: MessageFeedbackValue | null;
  accentColor: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (!feedback) {
    return null;
  }

  const isError = feedback.tipo === "error";
  const color = isError ? "#DC2626" : accentColor;

  return (
    <View
      style={[
        styles.feedback,
        {
          backgroundColor: isError ? "#FEF2F2" : colorConAlpha(accentColor, "10"),
          borderColor: isError ? "#FECACA" : colorConAlpha(accentColor, "24"),
        },
      ]}
    >
      <MaterialCommunityIcons
        name={isError ? "alert-circle-outline" : "check-circle-outline"}
        size={19}
        color={color}
      />
      <Text style={[styles.feedbackText, { color }]}>{feedback.texto}</Text>
      {feedback.reintentar ? (
        <Pressable
          style={[styles.retryButton, { borderColor: colorConAlpha(color, "40") }]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Reintentar carga de mensajes"
        >
          <Text style={[styles.retryText, { color }]}>Reintentar</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar aviso"
        >
          <MaterialCommunityIcons name="close" size={16} color={color} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
  },
  inputShell: {
    minHeight: 58,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textAreaShell: {
    minHeight: 148,
    alignItems: "flex-start",
    paddingTop: 14,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  textArea: {
    minHeight: 120,
    lineHeight: 21,
    paddingTop: Platform.OS === "ios" ? 2 : 0,
  },
  feedback: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },
  feedbackText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "900",
  },
});
