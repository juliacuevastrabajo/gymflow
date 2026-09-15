import type { ComponentProps, ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  findNodeHandle,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Card,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

function RoutineField({
  label,
  icon,
  value,
  placeholder,
  theme,
  secondaryColor,
  multiline = false,
  keyboardType,
  returnKeyType,
  onChangeText,
  onInputFocus,
}: {
  label: string;
  icon: IconName;
  value: string;
  placeholder: string;
  theme: GymFlowTheme;
  secondaryColor: string;
  multiline?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
  onChangeText: (value: string) => void;
  onInputFocus: (node: number | null) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
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
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={secondaryColor}
          style={styles.inputIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[
            styles.input,
            multiline && styles.textArea,
            { color: theme.text },
          ]}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onFocus={(event) =>
            onInputFocus(findNodeHandle(event.target as unknown as number))
          }
        />
      </View>
    </View>
  );
}

export default function TrainerRoutineForm({
  editing,
  theme,
  secondaryColor,
  feedback,
  name,
  description,
  level,
  duration,
  saving,
  onNameChange,
  onDescriptionChange,
  onLevelChange,
  onDurationChange,
  onDismissError,
  onInputFocus,
  onSave,
  onBack,
  onCancel,
}: {
  editing: boolean;
  theme: GymFlowTheme;
  secondaryColor: string;
  feedback?: ReactNode;
  name: string;
  description: string;
  level: string;
  duration: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onDismissError: () => void;
  onInputFocus: (node: number | null) => void;
  onSave: () => void;
  onBack: () => void;
  onCancel: () => void;
}) {
  const changeField = (setter: (value: string) => void, value: string) => {
    setter(value);
    onDismissError();
  };

  return (
    <ScreenContainer theme={theme}>
      <View style={styles.topBar}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={onBack}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.text}
          />
        </Pressable>
        <View style={styles.topCopy}>
          <Text style={[styles.eyebrow, { color: secondaryColor }]}>
            Entrenamiento
          </Text>
          <Text
            style={[styles.topTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {editing ? "Editar rutina" : "Nueva rutina"}
          </Text>
        </View>
      </View>

      {feedback}

      <Card theme={theme} style={styles.formCard}>
        <RoutineField
          label="Nombre"
          icon="arm-flex-outline"
          value={name}
          onChangeText={(value) => changeField(onNameChange, value)}
          placeholder="Ej. Full body principiante"
          returnKeyType="next"
          theme={theme}
          secondaryColor={secondaryColor}
          onInputFocus={onInputFocus}
        />
        <RoutineField
          label="Descripcion"
          icon="text-box-outline"
          value={description}
          onChangeText={(value) => changeField(onDescriptionChange, value)}
          placeholder="Objetivo, enfoque o indicaciones generales"
          multiline
          theme={theme}
          secondaryColor={secondaryColor}
          onInputFocus={onInputFocus}
        />
        <RoutineField
          label="Nivel"
          icon="signal-cellular-2"
          value={level}
          onChangeText={(value) => changeField(onLevelChange, value)}
          placeholder="Principiante, intermedio..."
          returnKeyType="next"
          theme={theme}
          secondaryColor={secondaryColor}
          onInputFocus={onInputFocus}
        />
        <RoutineField
          label="Duración estimada"
          icon="timer-outline"
          value={duration}
          onChangeText={(value) => changeField(onDurationChange, value)}
          placeholder="45"
          keyboardType="number-pad"
          theme={theme}
          secondaryColor={secondaryColor}
          onInputFocus={onInputFocus}
        />

        <PrimaryButton
          label={saving ? "Guardando" : "Guardar rutina"}
          icon="content-save-outline"
          theme={theme}
          onPress={onSave}
          loading={saving}
        />
        <SecondaryButton
          label="Cancelar"
          icon="close"
          theme={theme}
          onPress={onCancel}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  topCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  topTitle: { fontSize: 24, fontWeight: "900", lineHeight: 29 },
  formCard: { padding: 18, gap: 14 },
  inputGroup: { gap: 7 },
  inputLabel: { fontSize: 13, fontWeight: "900" },
  inputShell: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  inputIcon: { flexShrink: 0 },
  textAreaShell: {
    minHeight: 106,
    alignItems: "flex-start",
    paddingTop: 13,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },
  textArea: { minHeight: 76, lineHeight: 21 },
});
