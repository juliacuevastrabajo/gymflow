import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  crearUsuarioApi,
  resolverUrlMedia,
  type AdminCreatedUser,
  type AdminUserRole,
  type CreateAdminUserResponse,
} from "../../services/gymflowService";
import {
  Avatar,
  Card,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import { AdminScreenHeader, getInitials, withAlpha } from "./AdminClients";

type FieldErrors = {
  nombre?: string;
  email?: string;
  general?: string;
};

type AdminUserCreateProps = {
  role: AdminUserRole;
  theme: GymFlowTheme;
  gymName: string;
  adminAvatarUri?: string | null;
  adminInitials: string;
  onAdminAvatarPress: () => void;
  onPickPhoto: (currentPhoto?: string | null) => Promise<string | null>;
  onCreated: (user: AdminCreatedUser) => void;
  onOpenProfile: (user: AdminCreatedUser) => void;
  onReturnToList: () => void;
  onBack: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(nombre: string, email: string): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedName = nombre.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName) {
    errors.nombre = "Escribe el nombre completo.";
  } else if (normalizedName.length < 2 || normalizedName.length > 80) {
    errors.nombre = "El nombre debe tener entre 2 y 80 caracteres.";
  }

  if (!normalizedEmail) {
    errors.email = "Escribe el email de acceso.";
  } else if (normalizedEmail.length > 120 || !EMAIL_PATTERN.test(normalizedEmail)) {
    errors.email = "Escribe un email válido.";
  }

  return errors;
}

function FormField({
  label,
  value,
  placeholder,
  error,
  focused,
  theme,
  email,
  onChangeText,
  onFocus,
  onBlur,
  onSubmitEditing,
  inputRef,
}: {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  focused: boolean;
  theme: GymFlowTheme;
  email?: boolean;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmitEditing?: () => void;
  inputRef?: RefObject<TextInput | null>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: focused ? theme.surfaceSoft : theme.surface,
            borderColor: error ? "#DC2626" : focused ? theme.primary : theme.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={email ? "email-outline" : "account-outline"}
          size={21}
          color={focused ? theme.primary : theme.muted}
        />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          keyboardType={email ? "email-address" : "default"}
          autoCapitalize={email ? "none" : "words"}
          autoCorrect={!email}
          autoComplete={email ? "email" : "name"}
          textContentType={email ? "emailAddress" : "name"}
          returnKeyType={email ? "done" : "next"}
          accessibilityLabel={label}
        />
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export default function AdminUserCreate({
  role,
  theme,
  gymName,
  adminAvatarUri,
  adminInitials,
  onAdminAvatarPress,
  onPickPhoto,
  onCreated,
  onOpenProfile,
  onReturnToList,
  onBack,
}: AdminUserCreateProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<"nombre" | "email" | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const pickingPhotoRef = useRef(false);
  const [result, setResult] = useState<CreateAdminUserResponse | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [credentialsSecured, setCredentialsSecured] = useState(false);
  const emailRef = useRef<TextInput | null>(null);

  const roleLabel = role === "CLIENTE" ? "Cliente" : "Entrenador";
  const copy =
    role === "CLIENTE"
      ? {
          eyebrow: "PERSONAS",
          title: "Nuevo cliente",
          subtitle: "Crea una cuenta manual para un nuevo miembro del gimnasio.",
          button: "Crear cliente",
          list: "Volver a clientes",
          icon: "account-plus-outline" as const,
        }
      : {
          eyebrow: "EQUIPO",
          title: "Nuevo entrenador",
          subtitle: "Incorpora a un profesional al equipo del gimnasio.",
          button: "Crear entrenador",
          list: "Volver a entrenadores",
          icon: "account-tie-hat-outline" as const,
        };
  const dirty = Boolean(nombre.trim() || email.trim() || photoUrl);
  const currentValidation = validate(nombre, email);
  const canSubmit =
    !saving && !pickingPhoto && !currentValidation.nombre && !currentValidation.email;

  const clearSensitiveResult = useCallback(() => {
    setResult(null);
    setPasswordVisible(false);
    setCredentialsSecured(false);
  }, []);

  const requestExit = useCallback((action: () => void) => {
    if (savingRef.current || pickingPhotoRef.current) {
      return;
    }

    const exit = () => {
      clearSensitiveResult();
      action();
    };

    if (result && !credentialsSecured) {
      Alert.alert(
        "Guarda las credenciales",
        "Esta contraseña solo se muestra una vez. Si sales ahora no podrás recuperarla.",
        [
          { text: "Permanecer", style: "cancel" },
          {
            text: "Continuar y perderla",
            style: "destructive",
            onPress: exit,
          },
        ],
      );
      return;
    }

    if (!result && dirty) {
      Alert.alert(
        "Descartar cambios",
        "Los datos introducidos no se guardarán.",
        [
          { text: "Seguir editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: exit,
          },
        ],
      );
      return;
    }

    exit();
  }, [clearSensitiveResult, credentialsSecured, dirty, result]);

  const leaveForm = useCallback(() => {
    requestExit(result ? onReturnToList : onBack);
  }, [onBack, onReturnToList, requestExit, result]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      leaveForm();
      return true;
    });
    return () => subscription.remove();
  }, [leaveForm]);

  const updateName = (value: string) => {
    setNombre(value);
    setErrors((current) => ({ ...current, nombre: undefined, general: undefined }));
  };

  const updateEmail = (value: string) => {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined, general: undefined }));
  };

  const pickPhoto = async () => {
    if (savingRef.current || pickingPhotoRef.current) return;
    pickingPhotoRef.current = true;
    setPickingPhoto(true);
    try {
      const url = await onPickPhoto(photoUrl);
      if (url !== null) setPhotoUrl(url || null);
    } finally {
      pickingPhotoRef.current = false;
      setPickingPhoto(false);
    }
  };

  const submit = async () => {
    if (savingRef.current || !canSubmit) {
      setErrors(currentValidation);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setErrors({});
    try {
      const created = await crearUsuarioApi({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        fotoPerfilUrl: photoUrl,
        rol: role,
      });
      setResult(created);
      setPasswordVisible(false);
      onCreated(created.usuario);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear la cuenta.";
      const normalized = message.toLowerCase();
      if (normalized.includes("email")) {
        setErrors({ email: message });
      } else if (normalized.includes("nombre")) {
        setErrors({ nombre: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const copyPassword = async () => {
    if (!result) return;
    try {
      await Clipboard.setStringAsync(result.passwordInicial);
      setCredentialsSecured(true);
      Alert.alert("Contraseña copiada", "Ya puedes compartirla de forma segura.");
    } catch {
      Alert.alert("No se pudo copiar", "Inténtalo de nuevo antes de salir de esta pantalla.");
    }
  };

  const shareCredentials = async () => {
    if (!result) return;
    try {
      const shareResult = await Share.share({
        title: `Acceso a GymFlow · ${result.usuario.nombre}`,
        message: [
          `Acceso a GymFlow para ${result.usuario.nombre}`,
          `Email: ${result.usuario.email}`,
          `Contraseña inicial: ${result.passwordInicial}`,
          "Podrás cambiarla posteriormente desde tu perfil.",
        ].join("\n"),
      });
      if (shareResult.action === Share.sharedAction) {
        setCredentialsSecured(true);
      }
    } catch {
      Alert.alert("No se pudo compartir", "Inténtalo de nuevo antes de salir de esta pantalla.");
    }
  };

  const resetForAnother = () => {
    setNombre("");
    setEmail("");
    setPhotoUrl(null);
    setErrors({});
  };

  if (result) {
    const user = result.usuario;
    return (
      <ScreenContainer theme={theme} style={styles.screen}>
        <AdminScreenHeader
          theme={theme}
          adminAvatarUri={adminAvatarUri}
          adminInitials={adminInitials}
          onAdminAvatarPress={() => requestExit(onAdminAvatarPress)}
          onBack={leaveForm}
          eyebrow="CUENTA CREADA"
          title={`${roleLabel} listo`}
          subtitle="Guarda y comparte los datos de acceso antes de salir."
        />

        <Card theme={theme} style={styles.successCard}>
          <View style={[styles.successIcon, { backgroundColor: withAlpha(theme.secondary, "16") }]}>
            <MaterialCommunityIcons name="check" size={32} color={theme.secondary} />
          </View>
          <Avatar
            uri={resolverUrlMedia(user.fotoPerfilUrl)}
            initials={getInitials(user.nombre, roleLabel)}
            size={74}
            theme={theme}
          />
          <Text style={[styles.successName, { color: theme.text }]}>{user.nombre}</Text>
          <Text style={[styles.successEmail, { color: theme.muted }]}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: withAlpha(theme.primary, "12") }]}>
            <Text style={[styles.roleBadgeText, { color: theme.primary }]}>{roleLabel}</Text>
          </View>
          <Text style={[styles.gymText, { color: theme.muted }]}>{gymName}</Text>
        </Card>

        <Card theme={theme} style={styles.passwordCard}>
          <Text style={[styles.passwordEyebrow, { color: theme.secondary }]}>CONTRASEÑA INICIAL</Text>
          <View style={[styles.passwordRow, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
            <Text style={[styles.passwordValue, { color: theme.text }]} selectable={passwordVisible}>
              {passwordVisible ? result.passwordInicial : "••••••••••••••"}
            </Text>
            <Pressable
              style={styles.iconButton}
              onPress={() => setPasswordVisible((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <MaterialCommunityIcons
                name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={theme.primary}
              />
            </Pressable>
          </View>
          <Text style={[styles.passwordHelp, { color: theme.muted }]}>
            Comparte estos datos de acceso de forma segura. Esta contraseña no volverá a mostrarse.
          </Text>
          <Text style={[styles.passwordHelp, { color: theme.muted }]}>
            Podrá cambiarla posteriormente desde su perfil. También encontrará un mensaje de bienvenida dentro de GymFlow.
          </Text>
          <View style={styles.passwordActions}>
            <SecondaryButton label="Copiar" icon="content-copy" theme={theme} onPress={copyPassword} style={styles.flexButton} />
            <SecondaryButton label="Compartir" icon="share-variant-outline" theme={theme} onPress={shareCredentials} style={styles.flexButton} />
          </View>
        </Card>

        <PrimaryButton
          label="Abrir ficha"
          icon="account-arrow-right-outline"
          theme={theme}
          onPress={() => requestExit(() => onOpenProfile(user))}
          style={styles.primaryAction}
        />
        <SecondaryButton
          label={copy.list}
          icon="format-list-bulleted"
          theme={theme}
          onPress={() => requestExit(onReturnToList)}
          style={styles.secondaryAction}
        />
        <Pressable
          style={styles.createAnother}
          onPress={() => requestExit(resetForAnother)}
        >
          <MaterialCommunityIcons name="plus" size={19} color={theme.primary} />
          <Text style={[styles.createAnotherText, { color: theme.primary }]}>Crear otro</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={adminAvatarUri}
        adminInitials={adminInitials}
        onAdminAvatarPress={() => requestExit(onAdminAvatarPress)}
        onBack={leaveForm}
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      />

      <Card theme={theme} style={styles.photoCard}>
        <View style={styles.photoRow}>
          <View style={styles.avatarWrap}>
            <Avatar
              uri={resolverUrlMedia(photoUrl)}
              initials={getInitials(nombre, roleLabel)}
              size={82}
              theme={theme}
            />
            <Pressable
              style={[styles.cameraButton, { backgroundColor: theme.primary }]}
              onPress={pickPhoto}
              disabled={pickingPhoto || saving}
              accessibilityRole="button"
              accessibilityLabel={photoUrl ? "Cambiar foto de perfil" : "Añadir foto de perfil"}
            >
              {pickingPhoto ? (
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
              ) : (
                <MaterialCommunityIcons name="camera-outline" size={18} color={theme.textOnPrimary} />
              )}
            </Pressable>
          </View>
          <View style={styles.photoCopy}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Foto de perfil</Text>
            <Text style={[styles.cardText, { color: theme.muted }]}>Opcional. Puedes añadirla ahora o más adelante.</Text>
            <View style={styles.photoActions}>
              <Pressable onPress={pickPhoto} disabled={pickingPhoto || saving}>
                <Text style={[styles.inlineAction, { color: theme.primary }]}>{photoUrl ? "Cambiar" : "Añadir foto"}</Text>
              </Pressable>
              {!!photoUrl && (
                <Pressable onPress={() => setPhotoUrl(null)} disabled={saving}>
                  <Text style={styles.removeAction}>Retirar</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Datos personales</Text>
        <FormField
          label="Nombre completo"
          value={nombre}
          placeholder="Ej. Laura García"
          error={errors.nombre}
          focused={focusedField === "nombre"}
          theme={theme}
          onChangeText={updateName}
          onFocus={() => setFocusedField("nombre")}
          onBlur={() => setFocusedField(null)}
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <FormField
          label="Email"
          value={email}
          placeholder="laura@gymflow.com"
          error={errors.email}
          focused={focusedField === "email"}
          theme={theme}
          email
          inputRef={emailRef}
          onChangeText={updateEmail}
          onFocus={() => setFocusedField("email")}
          onBlur={() => {
            setFocusedField(null);
            setEmail((current) => current.trim().toLowerCase());
          }}
        />
      </View>

      <Card theme={theme} style={[styles.infoCard, { backgroundColor: theme.surfaceSoft }]}>
        <View style={[styles.infoIcon, { backgroundColor: withAlpha(theme.primary, "14") }]}>
          <MaterialCommunityIcons name="shield-key-outline" size={23} color={theme.primary} />
        </View>
        <View style={styles.infoCopy}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Acceso a GymFlow</Text>
          <Text style={[styles.cardText, { color: theme.muted }]}>GymFlow generará una contraseña inicial segura. Se mostrará una sola vez después de crear la cuenta.</Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Resumen</Text>
        <Card theme={theme} style={styles.summaryCard}>
          <Avatar
            uri={resolverUrlMedia(photoUrl)}
            initials={getInitials(nombre, roleLabel)}
            size={52}
            theme={theme}
          />
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryName, { color: theme.text }]} numberOfLines={1}>{nombre.trim() || `Nuevo ${roleLabel.toLowerCase()}`}</Text>
            <Text style={[styles.summaryMeta, { color: theme.muted }]} numberOfLines={1}>{email.trim().toLowerCase() || "Email pendiente"}</Text>
            <Text style={[styles.summaryMeta, { color: theme.muted }]} numberOfLines={1}>{roleLabel} · {gymName}</Text>
          </View>
          <MaterialCommunityIcons name={copy.icon} size={25} color={theme.secondary} />
        </Card>
      </View>

      {!!errors.general && (
        <View style={styles.generalError}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#B91C1C" />
          <Text style={styles.generalErrorText}>{errors.general}</Text>
        </View>
      )}

      <PrimaryButton
        label={copy.button}
        icon={copy.icon}
        theme={theme}
        onPress={submit}
        disabled={!canSubmit}
        loading={saving}
        style={styles.submitButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1 },
  photoCard: { marginTop: 18, padding: 18, borderRadius: 24 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  avatarWrap: { position: "relative" },
  cameraButton: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCopy: { flex: 1, minWidth: 0 },
  photoActions: { marginTop: 9, flexDirection: "row", alignItems: "center", gap: 18 },
  inlineAction: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  removeAction: { color: "#B91C1C", fontSize: 13, lineHeight: 18, fontWeight: "900" },
  section: { marginTop: 24 },
  sectionTitle: { marginBottom: 11, fontSize: 18, lineHeight: 23, fontWeight: "900" },
  fieldGroup: { marginBottom: 15 },
  fieldLabel: { marginBottom: 7, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  inputShell: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  input: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  fieldError: { marginTop: 6, color: "#B91C1C", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  infoCard: { marginTop: 7, padding: 17, borderRadius: 22, flexDirection: "row", gap: 13 },
  infoIcon: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  infoCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  cardText: { marginTop: 3, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  summaryCard: { padding: 16, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 13 },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryName: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  summaryMeta: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  generalError: { marginTop: 17, borderRadius: 16, backgroundColor: "#FEF2F2", padding: 13, flexDirection: "row", gap: 9 },
  generalErrorText: { flex: 1, color: "#991B1B", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  submitButton: { minHeight: 52, marginTop: 22 },
  successCard: { marginTop: 18, padding: 22, borderRadius: 24, alignItems: "center" },
  successIcon: { width: 54, height: 54, marginBottom: 15, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  successName: { marginTop: 13, fontSize: 22, lineHeight: 27, fontWeight: "900", textAlign: "center" },
  successEmail: { marginTop: 3, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
  roleBadge: { marginTop: 10, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  roleBadgeText: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
  gymText: { marginTop: 8, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  passwordCard: { marginTop: 14, padding: 18, borderRadius: 24 },
  passwordEyebrow: { fontSize: 11, lineHeight: 15, fontWeight: "900" },
  passwordRow: { minHeight: 58, marginTop: 9, borderRadius: 18, borderWidth: 1, paddingLeft: 16, paddingRight: 7, flexDirection: "row", alignItems: "center" },
  passwordValue: { flex: 1, minWidth: 0, fontSize: 18, lineHeight: 23, fontWeight: "900", letterSpacing: 1 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  passwordHelp: { marginTop: 10, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  passwordActions: { marginTop: 16, flexDirection: "row", gap: 10 },
  flexButton: { flex: 1, minWidth: 0 },
  primaryAction: { minHeight: 52, marginTop: 18 },
  secondaryAction: { minHeight: 50, marginTop: 10 },
  createAnother: { minHeight: 46, marginTop: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  createAnotherText: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
});
