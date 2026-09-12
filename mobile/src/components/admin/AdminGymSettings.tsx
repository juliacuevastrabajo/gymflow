import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { resolverUrlMedia } from "../../services/gymflowService";
import {
  Avatar,
  Card,
  PrimaryButton,
  ScreenContainer,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import { AdminScreenHeader, PersonDetailHeader } from "./AdminClients";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type SettingsView =
  | "RESUMEN"
  | "IDENTIDAD"
  | "PERMISOS"
  | "PERFIL"
  | "DATOS_PERSONALES"
  | "PASSWORD";
type PreviewRole = "ADMIN" | "ENTRENADOR" | "CLIENTE";
export type GymPermissionKey =
  | "mensajesUsuariosPermitidos"
  | "clientesPuedenCambiarFotoPerfil"
  | "entrenadoresPuedenCambiarFotoPerfil";

export type GymSettingsData = {
  id: number;
  nombre?: string | null;
  textoBienvenida?: string | null;
  imagenFondoUrl?: string | null;
  colorPrimario?: string | null;
  colorSecundario?: string | null;
  mensajesUsuariosPermitidos?: boolean;
  clientesPuedenCambiarFotoPerfil?: boolean;
  entrenadoresPuedenCambiarFotoPerfil?: boolean;
};

export type IdentityDraft = {
  nombre: string;
  textoBienvenida: string;
  imagenFondoUrl: string;
  colorPrimario: string;
  colorSecundario: string;
};

export type AdminProfileData = {
  id?: number;
  nombre?: string | null;
  email?: string | null;
  fotoPerfilUrl?: string | null;
};

export type GymPreviewContext = {
  role: PreviewRole;
  draft: IdentityDraft;
  theme: GymFlowTheme;
};

type Props = {
  theme: GymFlowTheme;
  gym: GymSettingsData | null;
  adminName: string;
  adminEmail?: string | null;
  adminAvatarUri?: string | null;
  adminInitials: string;
  uploadingImageKey?: string | null;
  bottomPadding: number;
  onPickImage: (key: "fondo", aspect: [number, number]) => Promise<string | null>;
  onAdminPhotoPress: () => void;
  onAdminPhotoRemove?: () => Promise<void>;
  onUpdateAdminProfile: (data: { nombre: string; email: string }) => Promise<AdminProfileData>;
  onChangeAdminPassword: (data: {
    passwordActual: string;
    passwordNueva: string;
  }) => Promise<AdminProfileData>;
  renderDashboardPreview: (context: GymPreviewContext) => ReactNode;
  onUpdateGym: (updates: Partial<GymSettingsData>) => Promise<GymSettingsData>;
  onBusyChange?: (busy: boolean) => void;
  onRegisterExitGuard?: (guard: ((onConfirm: () => void) => void) | null) => void;
  onRootBack?: () => void;
  onLogout: () => void;
};

const COLOR_HUES = [0, 25, 45, 75, 120, 165, 200, 230, 265, 295, 325, 345];
const COLOR_SATURATION_STEPS = [35, 48, 60, 72, 84, 96];
const COLOR_LIGHTNESS_STEPS = [32, 42, 52, 62, 72];
const COLOR_NEUTRALS = ["#FFFFFF", "#E5E7EB", "#9CA3AF", "#4B5563", "#111827", "#000000"];
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function normalizeHex(value?: string | null, fallback = "#64748B") {
  return value && HEX_COLOR.test(value) ? value.toUpperCase() : fallback;
}

function hexToRgb(hex: string) {
  const safe = normalizeHex(hex).slice(1);
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    if (max === red) h = 60 * (((green - blue) / delta) % 6);
    else if (max === green) h = 60 * ((blue - red) / delta + 2);
    else h = 60 * ((red - green) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: { h: number; s: number; l: number }) {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const m = lightness - chroma / 2;
  let channels = [0, 0, 0];

  if (section < 1) channels = [chroma, x, 0];
  else if (section < 2) channels = [x, chroma, 0];
  else if (section < 3) channels = [0, chroma, x];
  else if (section < 4) channels = [0, x, chroma];
  else if (section < 5) channels = [x, 0, chroma];
  else channels = [chroma, 0, x];

  return rgbToHex(...(channels.map((channel) => (channel + m) * 255) as [number, number, number]));
}

function contrastText(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58 ? "#0F172A" : "#FFFFFF";
}

function mixWithWhite(hex: string, weight = 0.9) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r * (1 - weight) + 255 * weight,
    g * (1 - weight) + 255 * weight,
    b * (1 - weight) + 255 * weight,
  );
}

function createIdentityDraft(gym: GymSettingsData | null): IdentityDraft {
  return {
    nombre: gym?.nombre || "",
    textoBienvenida: gym?.textoBienvenida || "",
    imagenFondoUrl: gym?.imagenFondoUrl || "",
    colorPrimario: normalizeHex(gym?.colorPrimario, "#E33B3B"),
    colorSecundario: normalizeHex(gym?.colorSecundario, "#0B6DAE"),
  };
}

function identitySnapshot(draft: IdentityDraft) {
  return JSON.stringify({
    ...draft,
    nombre: draft.nombre.trim(),
    textoBienvenida: draft.textoBienvenida.trim(),
    colorPrimario: normalizeHex(draft.colorPrimario),
    colorSecundario: normalizeHex(draft.colorSecundario),
  });
}

export default function AdminGymSettings({
  theme,
  gym,
  adminName,
  adminEmail,
  adminAvatarUri,
  adminInitials,
  uploadingImageKey,
  bottomPadding,
  onPickImage,
  onAdminPhotoPress,
  onAdminPhotoRemove,
  onUpdateAdminProfile,
  onChangeAdminPassword,
  renderDashboardPreview,
  onUpdateGym,
  onBusyChange,
  onRegisterExitGuard,
  onRootBack,
  onLogout,
}: Props) {
  const [view, setView] = useState<SettingsView>("RESUMEN");
  const [draft, setDraft] = useState<IdentityDraft>(() => createIdentityDraft(gym));
  const [savedSnapshot, setSavedSnapshot] = useState(() => identitySnapshot(createIdentityDraft(gym)));
  const [identityErrors, setIdentityErrors] = useState<Record<string, string>>({});
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPermission, setSavingPermission] = useState<GymPermissionKey | null>(null);
  const [permissions, setPermissions] = useState(() => ({
    mensajesUsuariosPermitidos: Boolean(gym?.mensajesUsuariosPermitidos),
    clientesPuedenCambiarFotoPerfil: gym?.clientesPuedenCambiarFotoPerfil !== false,
    entrenadoresPuedenCambiarFotoPerfil: gym?.entrenadoresPuedenCambiarFotoPerfil !== false,
  }));
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewRole, setPreviewRole] = useState<PreviewRole>("ADMIN");
  const [profileName, setProfileName] = useState(adminName);
  const [profileEmail, setProfileEmail] = useState(adminEmail || "");
  const [profileSnapshot, setProfileSnapshot] = useState(() =>
    JSON.stringify({ nombre: adminName.trim(), email: (adminEmail || "").trim().toLowerCase() }),
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const backHandlerRef = useRef<() => boolean>(() => false);

  useEffect(() => {
    const nextDraft: IdentityDraft = {
      nombre: gym?.nombre?.trim() || "",
      textoBienvenida: gym?.textoBienvenida || "",
      imagenFondoUrl: gym?.imagenFondoUrl || "",
      colorPrimario: normalizeHex(gym?.colorPrimario, "#E33B3B"),
      colorSecundario: normalizeHex(gym?.colorSecundario, "#0B6DAE"),
    };
    setDraft(nextDraft);
    setSavedSnapshot(identitySnapshot(nextDraft));
    setIdentityErrors({});
  }, [
    gym?.nombre,
    gym?.textoBienvenida,
    gym?.imagenFondoUrl,
    gym?.colorPrimario,
    gym?.colorSecundario,
  ]);

  useEffect(() => {
    const nextName = adminName.trim();
    const nextEmail = (adminEmail || "").trim().toLowerCase();
    setProfileName(nextName);
    setProfileEmail(nextEmail);
    setProfileSnapshot(JSON.stringify({ nombre: nextName, email: nextEmail }));
  }, [adminEmail, adminName]);

  useEffect(() => {
    setPermissions({
      mensajesUsuariosPermitidos: Boolean(gym?.mensajesUsuariosPermitidos),
      clientesPuedenCambiarFotoPerfil: gym?.clientesPuedenCambiarFotoPerfil !== false,
      entrenadoresPuedenCambiarFotoPerfil: gym?.entrenadoresPuedenCambiarFotoPerfil !== false,
    });
  }, [
    gym?.mensajesUsuariosPermitidos,
    gym?.clientesPuedenCambiarFotoPerfil,
    gym?.entrenadoresPuedenCambiarFotoPerfil,
  ]);

  const hasIdentityChanges = identitySnapshot(draft) !== savedSnapshot;
  const hasProfileChanges =
    JSON.stringify({
      nombre: profileName.trim(),
      email: profileEmail.trim().toLowerCase(),
    }) !== profileSnapshot;
  const hasPasswordChanges = Boolean(currentPassword || newPassword || confirmPassword);

  const leaveIdentity = () => {
    if (savingIdentity || uploadingImageKey === "fondo") return;
    if (!hasIdentityChanges) {
      setFeedback(null);
      setView("RESUMEN");
      return;
    }
    Alert.alert("Descartar cambios", "Los cambios de identidad no se guardarán.", [
      { text: "Seguir editando", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: () => {
          const nextDraft = createIdentityDraft(gym);
          setDraft(nextDraft);
          setSavedSnapshot(identitySnapshot(nextDraft));
          setIdentityErrors({});
          setFeedback(null);
          setView("RESUMEN");
        },
      },
    ]);
  };

  const leaveProfileForm = (target: "PERFIL" | "RESUMEN" = "PERFIL") => {
    if (savingProfile || savingPassword) return;
    const dirty = view === "DATOS_PERSONALES" ? hasProfileChanges : hasPasswordChanges;
    if (!dirty) {
      setFeedback(null);
      setProfileErrors({});
      setView(target);
      return;
    }
    Alert.alert("Descartar cambios", "Los cambios de tu cuenta no se guardarán.", [
      { text: "Seguir editando", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: () => {
          setProfileName(adminName.trim());
          setProfileEmail((adminEmail || "").trim().toLowerCase());
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setProfileErrors({});
          setFeedback(null);
          setView(target);
        },
      },
    ]);
  };

  const goBack = () => {
    if (view === "IDENTIDAD") {
      leaveIdentity();
      return;
    }
    if (view === "PERMISOS") {
      if (savingPermission) return;
      setFeedback(null);
      setView("RESUMEN");
      return;
    }
    if (view === "PERFIL") {
      setFeedback(null);
      setView("RESUMEN");
      return;
    }
    if (view === "DATOS_PERSONALES" || view === "PASSWORD") {
      leaveProfileForm();
    }
  };

  const requestExternalExit = useCallback((onConfirm: () => void) => {
    const busy =
      savingIdentity ||
      savingPermission !== null ||
      savingProfile ||
      savingPassword ||
      removingPhoto ||
      uploadingImageKey === "fondo" ||
      uploadingImageKey === "perfil";
    if (busy) return;
    if (previewVisible) {
      setPreviewVisible(false);
      return;
    }
    if (view === "IDENTIDAD" && hasIdentityChanges) {
      Alert.alert("Descartar cambios", "Los cambios de identidad no se guardarán.", [
        { text: "Seguir editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            const nextDraft = createIdentityDraft(gym);
            setDraft(nextDraft);
            setSavedSnapshot(identitySnapshot(nextDraft));
            setIdentityErrors({});
            setFeedback(null);
            onConfirm();
          },
        },
      ]);
      return;
    }
    if (
      (view === "DATOS_PERSONALES" && hasProfileChanges) ||
      (view === "PASSWORD" && hasPasswordChanges)
    ) {
      Alert.alert("Descartar cambios", "Los cambios de tu cuenta no se guardarán.", [
        { text: "Seguir editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            setProfileName(adminName.trim());
            setProfileEmail((adminEmail || "").trim().toLowerCase());
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setProfileErrors({});
            setFeedback(null);
            onConfirm();
          },
        },
      ]);
      return;
    }
    onConfirm();
  }, [
    adminEmail,
    adminName,
    gym,
    hasIdentityChanges,
    hasPasswordChanges,
    hasProfileChanges,
    previewVisible,
    removingPhoto,
    savingIdentity,
    savingPassword,
    savingPermission,
    savingProfile,
    uploadingImageKey,
    view,
  ]);

  useEffect(() => {
    onRegisterExitGuard?.(requestExternalExit);
    return () => onRegisterExitGuard?.(null);
  }, [onRegisterExitGuard, requestExternalExit]);

  useEffect(() => {
    backHandlerRef.current = () => {
      if (previewVisible) {
        setPreviewVisible(false);
        return true;
      }
      if (view === "RESUMEN") {
        if (!onRootBack) return false;
        onRootBack();
        return true;
      }
      goBack();
      return true;
    };
  });

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => backHandlerRef.current());
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    onBusyChange?.(
      savingIdentity ||
        savingPermission !== null ||
        savingProfile ||
        savingPassword ||
        removingPhoto ||
        uploadingImageKey === "fondo" ||
        uploadingImageKey === "perfil",
    );
  }, [
    onBusyChange,
    savingIdentity,
    savingPassword,
    savingPermission,
    savingProfile,
    removingPhoto,
    uploadingImageKey,
  ]);

  useEffect(
    () => () => {
      onBusyChange?.(false);
    },
    [onBusyChange],
  );

  const validateIdentity = () => {
    const errors: Record<string, string> = {};
    const name = draft.nombre.trim();
    if (name.length < 2 || name.length > 100) {
      errors.nombre = "El nombre debe tener entre 2 y 100 caracteres.";
    }
    if (draft.textoBienvenida.trim().length > 500) {
      errors.textoBienvenida = "El texto de bienvenida admite hasta 500 caracteres.";
    }
    if (!HEX_COLOR.test(draft.colorPrimario)) {
      errors.colorPrimario = "Selecciona un color principal válido.";
    }
    if (!HEX_COLOR.test(draft.colorSecundario)) {
      errors.colorSecundario = "Selecciona un color secundario válido.";
    }
    setIdentityErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveIdentity = async () => {
    if (!gym || savingIdentity || !hasIdentityChanges || !validateIdentity()) return;
    setSavingIdentity(true);
    setFeedback(null);
    try {
      const updated = await onUpdateGym({
        nombre: draft.nombre.trim(),
        textoBienvenida: draft.textoBienvenida.trim(),
        imagenFondoUrl: draft.imagenFondoUrl.trim(),
        colorPrimario: normalizeHex(draft.colorPrimario),
        colorSecundario: normalizeHex(draft.colorSecundario),
      });
      const nextDraft = createIdentityDraft(updated);
      setDraft(nextDraft);
      setSavedSnapshot(identitySnapshot(nextDraft));
      setFeedback({ type: "success", text: "La identidad del gimnasio se ha guardado." });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar la configuración.",
      });
    } finally {
      setSavingIdentity(false);
    }
  };

  const togglePermission = async (key: GymPermissionKey) => {
    if (!gym || savingPermission) return;
    const previous = permissions[key];
    const next = !previous;
    setPermissions((current) => ({ ...current, [key]: next }));
    setSavingPermission(key);
    setFeedback(null);
    try {
      await onUpdateGym({ [key]: next });
      setFeedback({ type: "success", text: "El permiso se ha actualizado." });
    } catch (error) {
      setPermissions((current) => ({ ...current, [key]: previous }));
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo actualizar el permiso.",
      });
    } finally {
      setSavingPermission(null);
    }
  };

  const selectBackgroundImage = async () => {
    const url = await onPickImage("fondo", [16, 9]);
    if (url) {
      setDraft((current) => ({
        ...current,
        imagenFondoUrl: url,
      }));
      setFeedback(null);
    }
  };

  const saveProfile = async () => {
    if (savingProfile || !hasProfileChanges) return;
    const nombre = profileName.trim();
    const email = profileEmail.trim().toLowerCase();
    const errors: Record<string, string> = {};
    if (nombre.length < 2 || nombre.length > 80) {
      errors.nombre = "El nombre debe tener entre 2 y 80 caracteres.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Escribe un email válido.";
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    setFeedback(null);
    try {
      const updated = await onUpdateAdminProfile({ nombre, email });
      const nextName = updated.nombre?.trim() || nombre;
      const nextEmail = updated.email?.trim().toLowerCase() || email;
      setProfileName(nextName);
      setProfileEmail(nextEmail);
      setProfileSnapshot(JSON.stringify({ nombre: nextName, email: nextEmail }));
      setFeedback({ type: "success", text: "Datos personales actualizados." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron guardar los datos.";
      if (/email|correo|uso|existe|duplicad/i.test(message)) {
        setProfileErrors((current) => ({ ...current, email: message }));
      }
      setFeedback({
        type: "error",
        text: message,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const removeAdminPhoto = () => {
    if (!onAdminPhotoRemove || removingPhoto || uploadingImageKey === "perfil") return;
    Alert.alert(
      "Retirar foto",
      "Tu perfil volverá a mostrar las iniciales.",
      [
        { text: "Mantener foto", style: "cancel" },
        {
          text: "Retirar",
          style: "destructive",
          onPress: async () => {
            setRemovingPhoto(true);
            setFeedback(null);
            try {
              await onAdminPhotoRemove();
              setFeedback({ type: "success", text: "La foto de perfil se ha retirado." });
            } catch (error) {
              setFeedback({
                type: "error",
                text: error instanceof Error ? error.message : "No se pudo retirar la foto.",
              });
            } finally {
              setRemovingPhoto(false);
            }
          },
        },
      ],
    );
  };

  const savePassword = async () => {
    if (savingPassword) return;
    const errors: Record<string, string> = {};
    if (!currentPassword.trim()) errors.passwordActual = "Escribe tu contraseña actual.";
    if (newPassword.length < 6 || newPassword.length > 72) {
      errors.passwordNueva = "La nueva contraseña debe tener entre 6 y 72 caracteres.";
    }
    if (newPassword !== confirmPassword) {
      errors.passwordConfirmacion = "Las contraseñas no coinciden.";
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    setFeedback(null);
    try {
      await onChangeAdminPassword({
        passwordActual: currentPassword,
        passwordNueva: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setFeedback({ type: "success", text: "Contraseña actualizada correctamente." });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const previewTheme: GymFlowTheme = {
    ...theme,
    primary: normalizeHex(draft.colorPrimario, theme.primary),
    secondary: normalizeHex(draft.colorSecundario, theme.secondary),
    textOnPrimary: contrastText(draft.colorPrimario),
    background: mixWithWhite(draft.colorSecundario, 0.94),
    surfaceSoft: mixWithWhite(draft.colorPrimario, 0.92),
    border: `${normalizeHex(draft.colorSecundario, theme.secondary)}22`,
  };

  const previewModal = (
    <Modal
      visible={previewVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setPreviewVisible(false)}
    >
      <SafeAreaView style={[styles.previewScreen, { backgroundColor: previewTheme.background }]}>
        <View style={[styles.previewTopBar, { backgroundColor: previewTheme.surface, borderBottomColor: previewTheme.border }]}>
          <View style={styles.previewTopCopy}>
            <Text style={[styles.previewTopEyebrow, { color: previewTheme.secondary }]}>SOLO LECTURA</Text>
            <Text style={[styles.previewTopTitle, { color: previewTheme.text }]}>Vista previa</Text>
          </View>
          <Pressable
            style={[styles.previewClose, { backgroundColor: previewTheme.surfaceSoft }]}
            onPress={() => setPreviewVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar vista previa"
          >
            <MaterialCommunityIcons name="close" size={24} color={previewTheme.text} />
          </Pressable>
        </View>

        <View style={[styles.previewControls, { backgroundColor: previewTheme.background }]}>
          <PreviewRoleSelector
            value={previewRole}
            onChange={setPreviewRole}
            theme={previewTheme}
          />
          <View
            style={[
              styles.previewSampleBadge,
              { backgroundColor: previewTheme.surfaceSoft, borderColor: previewTheme.border },
            ]}
          >
            <MaterialCommunityIcons name="eye-outline" size={15} color={previewTheme.secondary} />
            <Text style={[styles.previewSampleBadgeText, { color: previewTheme.secondary }]}>DATOS DE EJEMPLO</Text>
          </View>
        </View>

        <View style={styles.previewDashboardFrame}>
          {renderDashboardPreview({
            role: previewRole,
            draft,
            theme: previewTheme,
          })}
        </View>
      </SafeAreaView>
    </Modal>
  );

  const scroll = (content: ReactNode) => (
    <ScrollView
      key={view}
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenContainer theme={theme} style={styles.screen}>
        {content}
      </ScreenContainer>
    </ScrollView>
  );

  if (view === "IDENTIDAD") {
    return scroll(
      <>
        <PersonDetailHeader
          eyebrow="IDENTIDAD"
          title="Identidad y apariencia"
          theme={theme}
          onBack={leaveIdentity}
          backAccessibilityLabel="Volver a configuración"
        />

        <SectionTitle title="Datos del gimnasio" text="La información principal que verán tus usuarios." theme={theme} />
        <Card theme={theme} style={styles.formCard}>
          <SettingsInput
            label="Nombre"
            value={draft.nombre}
            onChangeText={(value) => {
              setDraft((current) => ({ ...current, nombre: value }));
              setIdentityErrors((current) => ({ ...current, nombre: "" }));
            }}
            placeholder="Nombre del gimnasio"
            error={identityErrors.nombre}
            theme={theme}
            maxLength={100}
          />
          <SettingsInput
            label="Texto de bienvenida"
            value={draft.textoBienvenida}
            onChangeText={(value) => {
              setDraft((current) => ({ ...current, textoBienvenida: value }));
              setIdentityErrors((current) => ({ ...current, textoBienvenida: "" }));
            }}
            placeholder="Un saludo breve para tus usuarios"
            error={identityErrors.textoBienvenida}
            theme={theme}
            maxLength={500}
            multiline
          />
        </Card>

        <SectionTitle
          title="Fondo de Inicio"
          text="Se muestra de forma sutil detrás del saludo en los paneles de Inicio. GymFlow ajusta automáticamente el encuadre y el contraste."
          theme={theme}
        />
        <BackgroundImageField
          value={draft.imagenFondoUrl}
          theme={theme}
          loading={uploadingImageKey === "fondo"}
          onPress={selectBackgroundImage}
          onRemove={() => {
            setDraft((current) => ({ ...current, imagenFondoUrl: "" }));
            setFeedback(null);
          }}
        />

        <SectionTitle title="Colores corporativos" text="Se aplicarán al guardar; esta pantalla conserva el tema actual mientras editas." theme={theme} />
        <ColorWheel title="Color principal" value={draft.colorPrimario} onChange={(value) => setDraft((current) => ({ ...current, colorPrimario: value }))} theme={theme} />
        {!!identityErrors.colorPrimario && <Text style={styles.errorText}>{identityErrors.colorPrimario}</Text>}
        <ColorWheel title="Color secundario" value={draft.colorSecundario} onChange={(value) => setDraft((current) => ({ ...current, colorSecundario: value }))} theme={theme} />
        {!!identityErrors.colorSecundario && <Text style={styles.errorText}>{identityErrors.colorSecundario}</Text>}

        <SectionTitle
          title="Vista previa"
          text="Comprueba los tres paneles con datos de ejemplo. Los accesos quedan bloqueados durante la previsualización."
          theme={theme}
        />
        <Pressable
          style={[styles.previewLauncher, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setPreviewVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir vista previa completa"
        >
          <View style={[styles.previewLauncherIcon, { backgroundColor: theme.surfaceSoft }]}>
            <MaterialCommunityIcons name="cellphone-screenshot" size={24} color={theme.primary} />
          </View>
          <View style={styles.previewLauncherCopy}>
            <Text style={[styles.previewLauncherTitle, { color: theme.text }]}>Vista previa completa</Text>
            <Text style={[styles.previewLauncherText, { color: theme.muted }]}>Administrador, entrenador y cliente</Text>
          </View>
          <MaterialCommunityIcons name="arrow-expand" size={22} color={theme.muted} />
        </Pressable>

        <Feedback feedback={feedback} theme={theme} />
        <PrimaryButton
          label="Guardar cambios"
          icon="content-save-outline"
          theme={{ ...theme, primary: normalizeHex(draft.colorPrimario), textOnPrimary: contrastText(draft.colorPrimario) }}
          onPress={saveIdentity}
          loading={savingIdentity}
          disabled={!hasIdentityChanges || savingIdentity}
          style={styles.saveButton}
        />
        {previewModal}
      </>,
    );
  }

  if (view === "DATOS_PERSONALES") {
    return scroll(
      <>
        <PersonDetailHeader
          eyebrow="MI CUENTA"
          title="Datos personales"
          theme={theme}
          onBack={() => leaveProfileForm()}
          backAccessibilityLabel="Volver al perfil"
        />
        <SectionTitle title="Información de acceso" text="Actualiza únicamente tu nombre y email de acceso." theme={theme} />
        <Card theme={theme} style={styles.formCard}>
          <SettingsInput
            label="Nombre"
            value={profileName}
            onChangeText={(value) => {
              setProfileName(value);
              setProfileErrors((current) => ({ ...current, nombre: "" }));
            }}
            placeholder="Tu nombre"
            error={profileErrors.nombre}
            theme={theme}
            maxLength={80}
          />
          <SettingsInput
            label="Email"
            value={profileEmail}
            onChangeText={(value) => {
              setProfileEmail(value);
              setProfileErrors((current) => ({ ...current, email: "" }));
            }}
            placeholder="tu@email.com"
            error={profileErrors.email}
            theme={theme}
            maxLength={160}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Card>
        <Feedback feedback={feedback} theme={theme} />
        <PrimaryButton
          label="Guardar cambios"
          icon="content-save-outline"
          theme={theme}
          onPress={saveProfile}
          loading={savingProfile}
          disabled={!hasProfileChanges || savingProfile}
          style={styles.saveButton}
        />
      </>,
    );
  }

  if (view === "PASSWORD") {
    return scroll(
      <>
        <PersonDetailHeader
          eyebrow="SEGURIDAD"
          title="Cambiar contraseña"
          theme={theme}
          onBack={() => leaveProfileForm()}
          backAccessibilityLabel="Volver al perfil"
        />
        <SectionTitle title="Nueva contraseña" text="Verifica tu contraseña actual antes de actualizar el acceso." theme={theme} />
        <Card theme={theme} style={styles.formCard}>
          <PasswordField
            label="Contraseña actual"
            value={currentPassword}
            visible={showCurrentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              setProfileErrors((current) => ({ ...current, passwordActual: "" }));
            }}
            onToggle={() => setShowCurrentPassword((current) => !current)}
            error={profileErrors.passwordActual}
            theme={theme}
          />
          <PasswordField
            label="Nueva contraseña"
            value={newPassword}
            visible={showNewPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              setProfileErrors((current) => ({ ...current, passwordNueva: "" }));
            }}
            onToggle={() => setShowNewPassword((current) => !current)}
            error={profileErrors.passwordNueva}
            theme={theme}
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            visible={showConfirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setProfileErrors((current) => ({ ...current, passwordConfirmacion: "" }));
            }}
            onToggle={() => setShowConfirmPassword((current) => !current)}
            error={profileErrors.passwordConfirmacion}
            theme={theme}
          />
        </Card>
        <Feedback feedback={feedback} theme={theme} />
        <PrimaryButton
          label="Actualizar contraseña"
          icon="lock-reset"
          theme={theme}
          onPress={savePassword}
          loading={savingPassword}
          disabled={savingPassword || !hasPasswordChanges}
          style={styles.saveButton}
        />
      </>,
    );
  }

  if (view === "PERFIL") {
    return scroll(
      <>
        <PersonDetailHeader
          eyebrow="PERFIL"
          title="Tu perfil"
          theme={theme}
          onBack={goBack}
          backAccessibilityLabel="Volver a configuración"
        />
        <Card theme={theme} style={styles.profileIdentityCard}>
          <View style={styles.profileAvatarWrap}>
            <Avatar uri={resolverUrlMedia(adminAvatarUri)} initials={adminInitials} size={76} theme={theme} />
            <Pressable
              style={[styles.profileCamera, { backgroundColor: theme.primary }]}
              onPress={onAdminPhotoPress}
              disabled={uploadingImageKey === "perfil"}
              accessibilityLabel="Cambiar foto de perfil"
            >
              {uploadingImageKey === "perfil" ? (
                <ActivityIndicator size="small" color={theme.textOnPrimary} />
              ) : (
                <MaterialCommunityIcons name="camera-outline" size={18} color={theme.textOnPrimary} />
              )}
            </Pressable>
          </View>
          <View style={styles.profileIdentityCopy}>
            <Text style={[styles.profileName, { color: theme.text }]}>{adminName}</Text>
            <Text style={[styles.profileRole, { color: theme.secondary }]}>Administrador</Text>
            {!!adminEmail && <Text style={[styles.profileEmail, { color: theme.muted }]}>{adminEmail}</Text>}
            {!!adminAvatarUri && !!onAdminPhotoRemove && (
              <Pressable
                style={styles.profileRemovePhoto}
                onPress={removeAdminPhoto}
                disabled={removingPhoto || uploadingImageKey === "perfil"}
                accessibilityRole="button"
                accessibilityLabel="Retirar foto de perfil"
              >
                {removingPhoto ? (
                  <ActivityIndicator size="small" color="#B91C1C" />
                ) : (
                  <MaterialCommunityIcons name="image-remove-outline" size={16} color="#B91C1C" />
                )}
                <Text style={styles.profileRemovePhotoText}>Retirar foto</Text>
              </Pressable>
            )}
          </View>
        </Card>

        <SectionTitle title="Mi cuenta" text="Gestiona tus datos y la seguridad de acceso." theme={theme} />
        <Card theme={theme} style={styles.profileRowsCard}>
          <ProfileActionRow
            icon="account-edit-outline"
            title="Datos personales"
            description="Nombre y email de acceso"
            theme={theme}
            onPress={() => {
              setProfileName(adminName.trim());
              setProfileEmail((adminEmail || "").trim().toLowerCase());
              setProfileSnapshot(JSON.stringify({ nombre: adminName.trim(), email: (adminEmail || "").trim().toLowerCase() }));
              setProfileErrors({});
              setFeedback(null);
              setView("DATOS_PERSONALES");
            }}
          />
          <ProfileActionRow
            icon="lock-reset"
            title="Cambiar contraseña"
            description="Actualiza tu acceso de forma segura"
            theme={theme}
            onPress={() => {
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setProfileErrors({});
              setFeedback(null);
              setView("PASSWORD");
            }}
          />
          <ProfileActionRow
            icon="camera-outline"
            title="Foto de perfil"
            description="Actualiza tu imagen con la cámara o la galería"
            theme={theme}
            onPress={onAdminPhotoPress}
            last
          />
        </Card>

        <SectionTitle title="Mi gimnasio" text="Cuenta administrativa asociada." theme={theme} />
        <Card theme={theme} style={styles.profileRowsCard}>
          <ProfileActionRow
            icon="dumbbell"
            title={gym?.nombre || "Gimnasio"}
            description="Gimnasio asociado a tu cuenta"
            theme={theme}
            onPress={() => undefined}
            last
            staticRow
          />
        </Card>
      </>,
    );
  }

  if (view === "PERMISOS") {
    return scroll(
      <>
        <PersonDetailHeader
          eyebrow="FUNCIONES"
          title="Permisos y funciones"
          theme={theme}
          onBack={goBack}
          backAccessibilityLabel="Volver a configuración"
        />
        <Text style={[styles.permissionsIntro, { color: theme.muted }]}>Controla qué acciones pueden realizar clientes y entrenadores en su propia cuenta.</Text>
        <Card theme={theme} style={styles.permissionsCard}>
          <PermissionRow
            icon="message-text-outline"
            title="Mensajes de clientes y entrenadores"
            description="Permite iniciar consultas y responder mensajes directos. Los comunicados siguen siendo de solo lectura."
            value={permissions.mensajesUsuariosPermitidos}
            loading={savingPermission === "mensajesUsuariosPermitidos"}
            disabled={savingPermission !== null}
            onChange={() => togglePermission("mensajesUsuariosPermitidos")}
            theme={theme}
          />
          <PermissionRow
            icon="account-edit-outline"
            title="Clientes pueden cambiar su foto"
            description="Controla la edición de la foto desde el perfil del cliente."
            value={permissions.clientesPuedenCambiarFotoPerfil}
            loading={savingPermission === "clientesPuedenCambiarFotoPerfil"}
            disabled={savingPermission !== null}
            onChange={() => togglePermission("clientesPuedenCambiarFotoPerfil")}
            theme={theme}
          />
          <PermissionRow
            icon="account-tie-outline"
            title="Entrenadores pueden cambiar su foto"
            description="Controla la edición de la foto desde el perfil del entrenador."
            value={permissions.entrenadoresPuedenCambiarFotoPerfil}
            loading={savingPermission === "entrenadoresPuedenCambiarFotoPerfil"}
            disabled={savingPermission !== null}
            onChange={() => togglePermission("entrenadoresPuedenCambiarFotoPerfil")}
            theme={theme}
            last
          />
        </Card>
        <Feedback feedback={feedback} theme={theme} />
      </>,
    );
  }

  const activePermissions = Object.values(permissions).filter(Boolean).length;
  return scroll(
    <>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={resolverUrlMedia(adminAvatarUri)}
        adminInitials={adminInitials}
        onAdminAvatarPress={onAdminPhotoPress}
        eyebrow="AJUSTES"
        title="Configuración del gimnasio"
        subtitle="Gestiona la identidad, la apariencia y los permisos de tu gimnasio."
      />

      <View style={styles.summaryList}>
        <SettingsCard
          icon="palette-outline"
          title="Identidad y apariencia"
          description={gym?.nombre || "Gimnasio sin nombre"}
          theme={theme}
          onPress={() => {
            setFeedback(null);
            setView("IDENTIDAD");
          }}
          accessory={
            <View style={styles.brandSummary}>
              <View style={[styles.colorSwatch, { backgroundColor: normalizeHex(gym?.colorPrimario, theme.primary) }]} />
              <View style={[styles.colorSwatch, { backgroundColor: normalizeHex(gym?.colorSecundario, theme.secondary) }]} />
            </View>
          }
          meta={gym?.imagenFondoUrl ? "Fondo de Inicio personalizado" : "Sin imagen · Fondo claro corporativo"}
        />
        <SettingsCard
          icon="shield-check-outline"
          title="Permisos y funciones"
          description={`${activePermissions} de 3 permisos activos`}
          theme={theme}
          onPress={() => {
            setFeedback(null);
            setView("PERMISOS");
          }}
        />
        <SettingsCard
          icon="account-circle-outline"
          title="Tu perfil"
          description={adminName}
          meta={adminEmail || "Administrador"}
          theme={theme}
          onPress={() => {
            setFeedback(null);
            setView("PERFIL");
          }}
          accessory={<Avatar uri={resolverUrlMedia(adminAvatarUri)} initials={adminInitials} size={48} theme={theme} />}
        />
      </View>

      <Pressable
        style={[styles.logoutRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => Alert.alert("Cerrar sesión", "¿Quieres salir de este dispositivo?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Cerrar sesión", style: "destructive", onPress: onLogout },
        ])}
      >
        <MaterialCommunityIcons name="logout" size={21} color="#B91C1C" />
        <View style={styles.logoutCopy}>
          <Text style={styles.logoutTitle}>Cerrar sesión</Text>
          <Text style={[styles.logoutDescription, { color: theme.muted }]}>Salir de este dispositivo</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
      </Pressable>
    </>,
  );
}

function SectionTitle({ title, text, theme }: { title: string; text: string; theme: GymFlowTheme }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionHeading, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.sectionDescription, { color: theme.muted }]}>{text}</Text>
    </View>
  );
}

function SettingsInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  theme,
  maxLength,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  theme: GymFlowTheme;
  maxLength: number;
  multiline?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputLabelRow}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.inputCounter, { color: theme.muted }]}>{value.length}/{maxLength}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={keyboardType !== "email-address"}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && styles.textArea,
          { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: error ? "#DC2626" : theme.border },
        ]}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function BackgroundImageField({ value, theme, loading, onPress, onRemove }: {
  value: string;
  theme: GymFlowTheme;
  loading: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const uri = resolverUrlMedia(value);
  return (
    <View style={styles.backgroundFieldWrapper}>
      <Pressable
        style={[styles.backgroundField, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={onPress}
        disabled={loading}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.backgroundPreview} resizeMode="cover" />
        ) : (
          <View style={[styles.backgroundEmpty, { backgroundColor: theme.surfaceSoft }]}>
            <MaterialCommunityIcons name="image-plus-outline" size={32} color={theme.secondary} />
            <Text style={[styles.backgroundEmptyTitle, { color: theme.text }]}>Sin imagen · Fondo claro corporativo</Text>
            <Text style={[styles.backgroundEmptyText, { color: theme.muted }]}>Opción recomendada · Formato panorámico opcional 16:9</Text>
          </View>
        )}
        <View style={styles.backgroundCaption}>
          {loading ? <ActivityIndicator size="small" color={theme.primary} /> : <MaterialCommunityIcons name={uri ? "pencil-outline" : "plus"} size={18} color={theme.primary} />}
          <Text style={[styles.backgroundCaptionTitle, { color: theme.text }]} numberOfLines={1}>{loading ? "Subiendo imagen..." : uri ? "Sustituir fondo" : "Seleccionar imagen"}</Text>
        </View>
      </Pressable>
      {!!uri && !loading && (
        <Pressable style={[styles.removeImage, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={onRemove} accessibilityLabel="Retirar imagen de fondo">
          <MaterialCommunityIcons name="close" size={18} color="#B91C1C" />
        </Pressable>
      )}
    </View>
  );
}

function ColorWheel({ title, value, onChange, theme }: { title: string; value: string; onChange: (value: string) => void; theme: GymFlowTheme }) {
  const safe = normalizeHex(value);
  const hsl = hexToHsl(safe);
  const update = (changes: Partial<typeof hsl>) => onChange(hslToHex({ ...hsl, ...changes }));
  return (
    <Card theme={theme} style={styles.colorCard}>
      <View style={styles.colorHeader}>
        <View style={[styles.currentColor, { backgroundColor: safe, borderColor: theme.border }]} />
        <View style={styles.colorHeaderCopy}>
          <Text style={[styles.colorTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.colorHint, { color: theme.muted }]}>Selecciona tono, intensidad y luminosidad</Text>
        </View>
      </View>
      <Text style={[styles.controlLabel, { color: theme.muted }]}>Neutros</Text>
      <View style={styles.colorRow}>
        {COLOR_NEUTRALS.map((color) => (
          <ColorDot key={color} color={color} active={safe === color} onPress={() => onChange(color)} />
        ))}
      </View>
      <Text style={[styles.controlLabel, { color: theme.muted }]}>Tono</Text>
      <View style={styles.colorWrap}>
        {COLOR_HUES.map((hue) => {
          const color = hslToHex({ h: hue, s: 88, l: 56 });
          const distance = Math.abs(((hsl.h - hue + 540) % 360) - 180);
          return <ColorDot key={hue} color={color} active={distance <= 15} onPress={() => update({ h: hue })} />;
        })}
      </View>
      <Text style={[styles.controlLabel, { color: theme.muted }]}>Intensidad</Text>
      <View style={styles.colorRow}>
        {COLOR_SATURATION_STEPS.map((s) => (
          <ColorDot key={s} color={hslToHex({ h: hsl.h, s, l: hsl.l })} active={Math.abs(hsl.s - s) <= 6} onPress={() => update({ s })} />
        ))}
      </View>
      <Text style={[styles.controlLabel, { color: theme.muted }]}>Luminosidad</Text>
      <View style={styles.colorRow}>
        {COLOR_LIGHTNESS_STEPS.map((l) => (
          <ColorDot key={l} color={hslToHex({ h: hsl.h, s: hsl.s, l })} active={Math.abs(hsl.l - l) <= 6} onPress={() => update({ l })} />
        ))}
      </View>
    </Card>
  );
}

function ColorDot({ color, active, onPress }: { color: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.colorDot, { backgroundColor: color, borderColor: active ? "#0F172A" : "#CBD5E1" }]} onPress={onPress} accessibilityLabel={`Seleccionar color ${color}`}>
      {active && <MaterialCommunityIcons name="check" size={16} color={contrastText(color)} />}
    </Pressable>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChangeText,
  onToggle,
  error,
  theme,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggle: () => void;
  error?: string;
  theme: GymFlowTheme;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.passwordShell, { backgroundColor: theme.surfaceSoft, borderColor: error ? "#DC2626" : theme.border }]}>
        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.muted} />
        <TextInput
          style={[styles.passwordInput, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder="••••••••"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={styles.passwordToggle} onPress={onToggle} accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
          <MaterialCommunityIcons name={visible ? "eye-off-outline" : "eye-outline"} size={21} color={theme.muted} />
        </Pressable>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function ProfileActionRow({
  icon,
  title,
  description,
  theme,
  onPress,
  last = false,
  staticRow = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  theme: GymFlowTheme;
  onPress: () => void;
  last?: boolean;
  staticRow?: boolean;
}) {
  return (
    <Pressable
      style={[styles.profileActionRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={staticRow}
      accessibilityRole={staticRow ? undefined : "button"}
    >
      <View style={[styles.profileActionIcon, { backgroundColor: theme.surfaceSoft }]}>
        <MaterialCommunityIcons name={icon} size={21} color={theme.primary} />
      </View>
      <View style={styles.profileActionCopy}>
        <Text style={[styles.profileActionTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.profileActionDescription, { color: theme.muted }]} numberOfLines={2}>{description}</Text>
      </View>
      {!staticRow && <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />}
    </Pressable>
  );
}

function PreviewRoleSelector({ value, onChange, theme }: { value: "ADMIN" | "ENTRENADOR" | "CLIENTE"; onChange: (value: "ADMIN" | "ENTRENADOR" | "CLIENTE") => void; theme: GymFlowTheme }) {
  return (
    <View style={[styles.previewSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {(["ADMIN", "ENTRENADOR", "CLIENTE"] as const).map((role) => (
        <Pressable key={role} style={[styles.previewOption, value === role && { backgroundColor: theme.surfaceSoft }]} onPress={() => onChange(role)}>
          <Text style={[styles.previewOptionText, { color: value === role ? theme.primary : theme.muted }]}>{role === "ADMIN" ? "Administrador" : role === "ENTRENADOR" ? "Entrenador" : "Cliente"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PermissionRow({ icon, title, description, value, loading, disabled, onChange, theme, last = false }: { icon: IconName; title: string; description: string; value: boolean; loading: boolean; disabled: boolean; onChange: () => void; theme: GymFlowTheme; last?: boolean }) {
  return (
    <View style={[styles.permissionRow, !last && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
      <View style={[styles.permissionIcon, { backgroundColor: theme.surfaceSoft }]}>
        <MaterialCommunityIcons name={icon} size={21} color={theme.primary} />
      </View>
      <View style={styles.permissionCopy}>
        <Text style={[styles.permissionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.permissionDescription, { color: theme.muted }]}>{description}</Text>
      </View>
      {loading ? (
        <View style={styles.switchLoading}><ActivityIndicator size="small" color={theme.primary} /></View>
      ) : (
        <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ false: "#CBD5E1", true: mixWithWhite(theme.primary, 0.4) }} thumbColor={value ? theme.primary : "#FFFFFF"} accessibilityLabel={title} />
      )}
    </View>
  );
}

function SettingsCard({ icon, title, description, meta, accessory, theme, onPress }: { icon: IconName; title: string; description: string; meta?: string; accessory?: ReactNode; theme: GymFlowTheme; onPress: () => void }) {
  return (
    <Pressable style={[styles.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={onPress}>
      <View style={[styles.settingsIcon, { backgroundColor: theme.surfaceSoft }]}><MaterialCommunityIcons name={icon} size={23} color={theme.primary} /></View>
      <View style={styles.settingsCopy}>
        <Text style={[styles.settingsTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingsDescription, { color: theme.muted }]} numberOfLines={2}>{description}</Text>
        {!!meta && <Text style={[styles.settingsMeta, { color: theme.secondary }]} numberOfLines={1}>{meta}</Text>}
      </View>
      {accessory}
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
    </Pressable>
  );
}

function Feedback({ feedback, theme }: { feedback: { type: "success" | "error"; text: string } | null; theme: GymFlowTheme }) {
  if (!feedback) return null;
  const error = feedback.type === "error";
  return (
    <View style={[styles.feedback, { backgroundColor: error ? "#FEF2F2" : mixWithWhite(theme.secondary, 0.9), borderColor: error ? "#FECACA" : mixWithWhite(theme.secondary, 0.66) }]}>
      <MaterialCommunityIcons name={error ? "alert-circle-outline" : "check-circle-outline"} size={20} color={error ? "#B91C1C" : theme.secondary} />
      <Text style={[styles.feedbackText, { color: error ? "#B91C1C" : theme.text }]}>{feedback.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 16 },
  screen: { flexGrow: 1 },
  summaryList: { gap: 11, marginTop: 20 },
  settingsCard: { minHeight: 108, borderWidth: 1, borderRadius: 22, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  settingsIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  settingsCopy: { flex: 1, minWidth: 0 },
  settingsTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  settingsDescription: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  settingsMeta: { marginTop: 5, fontSize: 11, lineHeight: 15, fontWeight: "900" },
  brandSummary: { alignItems: "center", gap: 7 },
  colorSwatch: { width: 26, height: 7, borderRadius: 999 },
  logoutRow: { minHeight: 70, marginTop: 24, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  logoutCopy: { flex: 1 },
  logoutTitle: { color: "#B91C1C", fontSize: 14, fontWeight: "900" },
  logoutDescription: { marginTop: 2, fontSize: 12, fontWeight: "700" },
  sectionTitle: { marginTop: 22, marginBottom: 10 },
  sectionHeading: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  sectionDescription: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  formCard: { padding: 16, gap: 16, borderRadius: 22 },
  inputGroup: { gap: 7 },
  inputLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  inputLabel: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  inputCounter: { fontSize: 11, fontWeight: "700" },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  textArea: { minHeight: 116 },
  errorText: { color: "#DC2626", fontSize: 12, lineHeight: 16, fontWeight: "700" },
  backgroundFieldWrapper: { position: "relative", alignItems: "center" },
  backgroundField: { width: "100%", maxWidth: 520, aspectRatio: 16 / 9, borderWidth: 1, borderRadius: 24, overflow: "hidden" },
  backgroundPreview: { width: "100%", flex: 1 },
  backgroundEmpty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  backgroundEmptyTitle: { marginTop: 12, fontSize: 14, lineHeight: 19, fontWeight: "900", textAlign: "center" },
  backgroundEmptyText: { marginTop: 4, fontSize: 11, lineHeight: 16, fontWeight: "700", textAlign: "center" },
  backgroundCaption: { minHeight: 50, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  backgroundCaptionTitle: { flex: 1, fontSize: 13, fontWeight: "900" },
  removeImage: { position: "absolute", top: 10, right: 10, width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  colorCard: { padding: 16, marginBottom: 11, borderRadius: 22 },
  colorHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  currentColor: { width: 52, height: 52, borderRadius: 18, borderWidth: 1 },
  colorHeaderCopy: { flex: 1 },
  colorTitle: { fontSize: 16, fontWeight: "900" },
  colorHint: { marginTop: 3, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  controlLabel: { marginTop: 15, marginBottom: 8, fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  colorRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  colorWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorDot: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  previewSelector: { minHeight: 52, borderWidth: 1, borderRadius: 17, padding: 4, flexDirection: "row", gap: 4 },
  previewOption: { flex: 1, minWidth: 0, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  previewOptionText: { fontSize: 11, fontWeight: "900", textAlign: "center" },
  previewLauncher: { minHeight: 82, borderWidth: 1, borderRadius: 22, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  previewLauncherIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  previewLauncherCopy: { flex: 1, minWidth: 0 },
  previewLauncherTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  previewLauncherText: { marginTop: 3, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  previewScreen: { flex: 1 },
  previewTopBar: { minHeight: 68, borderBottomWidth: 1, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  previewTopCopy: { flex: 1 },
  previewTopEyebrow: { fontSize: 10, lineHeight: 14, fontWeight: "900" },
  previewTopTitle: { marginTop: 1, fontSize: 22, lineHeight: 27, fontWeight: "900" },
  previewClose: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  previewControls: { paddingHorizontal: 14, paddingVertical: 10, gap: 9 },
  previewSampleBadge: { alignSelf: "flex-start", minHeight: 30, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  previewSampleBadgeText: { fontSize: 10, lineHeight: 14, fontWeight: "900" },
  previewDashboardFrame: { flex: 1, minHeight: 0 },
  profileIdentityCard: { padding: 17, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 16 },
  profileAvatarWrap: { position: "relative" },
  profileCamera: { position: "absolute", right: -4, bottom: -4, width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  profileIdentityCopy: { flex: 1, minWidth: 0 },
  profileRemovePhoto: { alignSelf: "flex-start", minHeight: 38, marginTop: 5, flexDirection: "row", alignItems: "center", gap: 6 },
  profileRemovePhotoText: { color: "#B91C1C", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  profileName: { fontSize: 20, lineHeight: 25, fontWeight: "900" },
  profileRole: { marginTop: 3, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  profileEmail: { marginTop: 3, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  profileRowsCard: { paddingHorizontal: 15, borderRadius: 22 },
  profileActionRow: { minHeight: 76, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 11 },
  profileActionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  profileActionCopy: { flex: 1, minWidth: 0 },
  profileActionTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  profileActionDescription: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  passwordShell: { minHeight: 54, borderWidth: 1, borderRadius: 17, paddingLeft: 13, flexDirection: "row", alignItems: "center", gap: 9 },
  passwordInput: { flex: 1, minWidth: 0, alignSelf: "stretch", fontSize: 15, fontWeight: "700" },
  passwordToggle: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  saveButton: { marginTop: 14 },
  permissionsIntro: { marginBottom: 15, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  permissionsCard: { paddingHorizontal: 15, borderRadius: 22 },
  permissionRow: { minHeight: 116, paddingVertical: 15, flexDirection: "row", alignItems: "center", gap: 11 },
  permissionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  permissionCopy: { flex: 1, minWidth: 0 },
  permissionTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  permissionDescription: { marginTop: 4, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  switchLoading: { width: 51, height: 32, alignItems: "center", justifyContent: "center" },
  feedback: { minHeight: 54, marginTop: 14, borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  feedbackText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "800" },
});
