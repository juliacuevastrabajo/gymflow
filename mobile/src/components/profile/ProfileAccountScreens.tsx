import type { ComponentProps, ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colorConAlpha } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  PrimaryButton,
  ScreenContainer,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type ProfileAccountFeedback = {
  tipo: "success" | "error";
  texto: string;
};

type ProfileAccountCommonProps = {
  theme: GymFlowTheme;
  secondaryColor: string;
  profilePhotoUri?: string | null;
  profileInitials: string;
  feedback?: ProfileAccountFeedback | null;
  saving: boolean;
  onBack: () => void;
  onClearError: () => void;
  onSubmit: () => void;
};

export function ProfileDetailsScreen({
  theme,
  secondaryColor,
  profilePhotoUri,
  profileInitials,
  feedback,
  saving,
  name,
  email,
  onBack,
  onClearError,
  onChangeName,
  onChangeEmail,
  onSubmit,
}: ProfileAccountCommonProps & {
  name: string;
  email: string;
  onChangeName: (value: string) => void;
  onChangeEmail: (value: string) => void;
}) {
  return (
    <ScreenContainer theme={theme}>
      <ProfileHeader
        eyebrow="Mi cuenta"
        title="Datos personales"
        subtitle="Actualiza solo los datos visibles de tu cuenta."
        theme={theme}
        secondaryColor={secondaryColor}
        profilePhotoUri={profilePhotoUri}
        profileInitials={profileInitials}
        onBack={onBack}
      />

      <Card theme={theme} style={styles.formCard}>
        <ProfileInput
          label="Nombre"
          icon="account-outline"
          value={name}
          onChangeText={onChangeName}
          placeholder="Tu nombre"
          returnKeyType="next"
          theme={theme}
          secondaryColor={secondaryColor}
          clearError={feedback?.tipo === "error" ? onClearError : undefined}
        />
        <ProfileInput
          label="Email"
          icon="email-outline"
          value={email}
          onChangeText={onChangeEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          theme={theme}
          secondaryColor={secondaryColor}
          clearError={feedback?.tipo === "error" ? onClearError : undefined}
        />

        <ProfileFeedback
          feedback={feedback}
          theme={theme}
          secondaryColor={secondaryColor}
        />

        <PrimaryButton
          label="Guardar cambios"
          icon="content-save-outline"
          theme={theme}
          loading={saving}
          disabled={saving}
          onPress={onSubmit}
        />
      </Card>
    </ScreenContainer>
  );
}

export function ProfilePasswordScreen({
  theme,
  secondaryColor,
  profilePhotoUri,
  profileInitials,
  feedback,
  saving,
  currentPassword,
  newPassword,
  confirmationPassword,
  showCurrentPassword,
  showNewPassword,
  showConfirmationPassword,
  onBack,
  onClearError,
  onChangeCurrentPassword,
  onChangeNewPassword,
  onChangeConfirmationPassword,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmationPassword,
  onSubmit,
}: ProfileAccountCommonProps & {
  currentPassword: string;
  newPassword: string;
  confirmationPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmationPassword: boolean;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeConfirmationPassword: (value: string) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmationPassword: () => void;
}) {
  const clearError = feedback?.tipo === "error" ? onClearError : undefined;

  return (
    <ScreenContainer theme={theme}>
      <ProfileHeader
        eyebrow="Seguridad"
        title="Cambiar contraseña"
        subtitle="Verificamos tu contraseña actual antes de guardar la nueva."
        theme={theme}
        secondaryColor={secondaryColor}
        profilePhotoUri={profilePhotoUri}
        profileInitials={profileInitials}
        onBack={onBack}
      />

      <Card theme={theme} style={styles.formCard}>
        <ProfileInput
          label="Contraseña actual"
          icon="lock-outline"
          value={currentPassword}
          onChangeText={onChangeCurrentPassword}
          placeholder="Tu contraseña actual"
          autoCapitalize="none"
          secureTextEntry={!showCurrentPassword}
          textContentType="password"
          rightElement={
            <PasswordToggle
              visible={showCurrentPassword}
              color={theme.muted}
              onPress={onToggleCurrentPassword}
            />
          }
          theme={theme}
          secondaryColor={secondaryColor}
          clearError={clearError}
        />
        <ProfileInput
          label="Nueva contraseña"
          icon="lock-plus-outline"
          value={newPassword}
          onChangeText={onChangeNewPassword}
          placeholder="Mínimo 6 caracteres"
          autoCapitalize="none"
          secureTextEntry={!showNewPassword}
          textContentType="newPassword"
          rightElement={
            <PasswordToggle
              visible={showNewPassword}
              color={theme.muted}
              onPress={onToggleNewPassword}
            />
          }
          theme={theme}
          secondaryColor={secondaryColor}
          clearError={clearError}
        />
        <ProfileInput
          label="Confirmar nueva contraseña"
          icon="lock-check-outline"
          value={confirmationPassword}
          onChangeText={onChangeConfirmationPassword}
          placeholder="Repite la nueva contraseña"
          autoCapitalize="none"
          secureTextEntry={!showConfirmationPassword}
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          rightElement={
            <PasswordToggle
              visible={showConfirmationPassword}
              color={theme.muted}
              onPress={onToggleConfirmationPassword}
            />
          }
          theme={theme}
          secondaryColor={secondaryColor}
          clearError={clearError}
        />

        <View
          style={[
            styles.hint,
            {
              backgroundColor: colorConAlpha(secondaryColor, "10"),
              borderColor: colorConAlpha(secondaryColor, "20"),
            },
          ]}
        >
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={19}
            color={secondaryColor}
          />
          <Text style={[styles.hintText, { color: theme.muted }]}>
            Usa una contraseña que no hayas utilizado en otros servicios.
          </Text>
        </View>

        <ProfileFeedback
          feedback={feedback}
          theme={theme}
          secondaryColor={secondaryColor}
        />

        <PrimaryButton
          label="Actualizar contraseña"
          icon="shield-key-outline"
          theme={theme}
          loading={saving}
          disabled={saving}
          onPress={onSubmit}
        />
      </Card>
    </ScreenContainer>
  );
}

function ProfileHeader({
  eyebrow,
  title,
  subtitle,
  theme,
  secondaryColor,
  profilePhotoUri,
  profileInitials,
  onBack,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  theme: GymFlowTheme;
  secondaryColor: string;
  profilePhotoUri?: string | null;
  profileInitials: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        style={[
          styles.backButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        onPress={onBack}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={theme.text}
        />
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, { color: secondaryColor }]}>
          {eyebrow}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {subtitle}
        </Text>
      </View>
      <Avatar
        uri={profilePhotoUri}
        initials={profileInitials}
        size={48}
        theme={theme}
      />
    </View>
  );
}

function ProfileInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  secureTextEntry = false,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  rightElement,
  theme,
  secondaryColor,
  clearError,
}: {
  label: string;
  icon: IconName;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
  secureTextEntry?: boolean;
  textContentType?: ComponentProps<typeof TextInput>["textContentType"];
  returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
  onSubmitEditing?: () => void;
  rightElement?: ReactNode;
  theme: GymFlowTheme;
  secondaryColor: string;
  clearError?: () => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: theme.border,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={secondaryColor} />
        <TextInput
          value={value}
          onChangeText={(text) => {
            clearError?.();
            onChangeText(text);
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text }]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {rightElement}
      </View>
    </View>
  );
}

function PasswordToggle({
  visible,
  color,
  onPress,
}: {
  visible: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.inputAction} onPress={onPress}>
      <MaterialCommunityIcons
        name={visible ? "eye-off-outline" : "eye-outline"}
        size={21}
        color={color}
      />
    </Pressable>
  );
}

function ProfileFeedback({
  feedback,
  theme,
  secondaryColor,
}: {
  feedback?: ProfileAccountFeedback | null;
  theme: GymFlowTheme;
  secondaryColor: string;
}) {
  if (!feedback) {
    return null;
  }

  const isError = feedback.tipo === "error";
  const color = isError ? "#DC2626" : secondaryColor;

  return (
    <View
      style={[
        styles.feedback,
        {
          backgroundColor: isError
            ? "#FEF2F2"
            : colorConAlpha(secondaryColor, "10"),
          borderColor: isError
            ? "#FECACA"
            : colorConAlpha(secondaryColor, "24"),
        },
      ]}
    >
      <MaterialCommunityIcons
        name={isError ? "alert-circle-outline" : "check-circle-outline"}
        size={20}
        color={color}
      />
      <Text style={[styles.feedbackText, { color }]}>{feedback.texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 18,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 4,
  },
  formCard: {
    padding: 16,
    gap: 15,
  },
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
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  inputAction: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  hintText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  feedback: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  feedbackText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
});
