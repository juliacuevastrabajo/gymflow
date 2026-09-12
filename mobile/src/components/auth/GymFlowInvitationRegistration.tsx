import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Linking as NativeLinking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  registrarClienteConInvitacionApi,
  validarInvitacionClienteApi,
  type AuthLoginResponse,
  type ClientInvitationValidation,
} from "../../services/gymflowService";
import { gymFlowAccessTheme as theme } from "../../theme/gymflowAccessTheme";
import GymFlowBrand from "./GymFlowBrand";

type InvitationScreen = "ENTRY" | "SCANNER" | "REGISTER";
type FieldName = "name" | "email" | "password" | "confirmation";

type GymFlowInvitationRegistrationProps = {
  initialToken?: string | null;
  onBack: () => void;
  onRegistered: (session: AuthLoginResponse) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function extractInvitationToken(value: string) {
  const candidate = value.trim();
  if (!candidate) {
    return null;
  }

  try {
    const parsed = Linking.parse(candidate);
    const token = parsed.queryParams?.token;
    if (typeof token === "string" && token.trim()) {
      return token.trim();
    }
    if (Array.isArray(token) && typeof token[0] === "string") {
      return token[0].trim() || null;
    }
  } catch {
    // También admitimos el token sin envolver para facilitar las pruebas locales.
  }

  return candidate.includes(".") && !candidate.includes(" ") ? candidate : null;
}

function AccessButton({
  label,
  icon,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
}: {
  label: string;
  icon: "qrcode-scan" | "arrow-right" | "check";
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const unavailable = loading || disabled;
  return (
    <Pressable
      style={[
        styles.accessButton,
        secondary && styles.accessButtonSecondary,
        unavailable && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
    >
      {secondary ? (
        <View style={styles.accessButtonSecondaryContent}>
          <MaterialCommunityIcons name={icon} size={21} color={theme.blue} />
          <Text style={styles.accessButtonSecondaryText}>{label}</Text>
        </View>
      ) : (
        <LinearGradient
          colors={[theme.blue, theme.violet]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.accessButtonGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.accessButtonText}>{label}</Text>
              <MaterialCommunityIcons name={icon} size={21} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}

function PageHeader({
  title,
  onBack,
  inverted = false,
  disabled = false,
}: {
  title: string;
  onBack: () => void;
  inverted?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.pageHeader}>
      <Pressable
        style={[styles.backButton, inverted && styles.backButtonInverted]}
        onPress={onBack}
        disabled={disabled}
        accessibilityLabel="Volver"
        accessibilityState={{ disabled }}
      >
        <MaterialCommunityIcons name="arrow-left" size={23} color={inverted ? "#FFFFFF" : theme.text} />
      </Pressable>
      <Text style={[styles.pageHeaderTitle, inverted && styles.pageHeaderTitleInverted]}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  onFocus,
  onBlur,
  focused,
  error,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoComplete,
  textContentType,
  returnKeyType,
  inputRef,
  onSubmitEditing,
  rightAction,
}: {
  label: string;
  icon: "account-outline" | "email-outline" | "lock-outline";
  value: string;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  focused: boolean;
  error?: string | null;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoComplete?: "name" | "email" | "new-password";
  textContentType?: "name" | "emailAddress" | "newPassword";
  returnKeyType?: "next" | "done";
  inputRef?: RefObject<TextInput | null>;
  onSubmitEditing?: () => void;
  rightAction?: ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputShellFocused, error && styles.inputShellError]}>
        <MaterialCommunityIcons name={icon} size={21} color={focused ? theme.blue : theme.muted} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.subtle}
          style={styles.input}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label}
        />
        {rightAction}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export default function GymFlowInvitationRegistration({
  initialToken,
  onBack,
  onRegistered,
}: GymFlowInvitationRegistrationProps) {
  const navigation = useNavigation();
  const [screen, setScreen] = useState<InvitationScreen>("ENTRY");
  const [manualLink, setManualLink] = useState(initialToken || "");
  const [validation, setValidation] = useState<ClientInvitationValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerLocked, setScannerLocked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const passwordRef = useRef<TextInput | null>(null);
  const confirmationRef = useRef<TextInput | null>(null);
  const initialTokenHandled = useRef<string | null>(null);
  const validationInFlightRef = useRef(false);
  const validationVersionRef = useRef(0);
  const scannerReadRef = useRef(false);
  const registrationInFlightRef = useRef(false);
  const allowNavigationRef = useRef(false);
  const discardAlertOpenRef = useRef(false);

  const normalizedEmail = email.trim().toLowerCase();
  const fieldErrors = {
    name: name.trim().length < 2 ? "Escribe tu nombre completo." : null,
    email: !EMAIL_PATTERN.test(normalizedEmail) ? "Escribe un email válido." : null,
    password:
      password.length < 8 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) || !/\d/.test(password)
        ? "Usa al menos 8 caracteres, con letras y números."
        : null,
    confirmation: confirmation !== password ? "Las contraseñas no coinciden." : null,
  };
  const formValid = Object.values(fieldErrors).every((value) => !value);

  const validateToken = useCallback(async (candidate: string) => {
    if (validationInFlightRef.current) {
      return;
    }

    const token = extractInvitationToken(candidate);
    if (!token) {
      setError("Pega un enlace de invitación válido.");
      return;
    }

    validationInFlightRef.current = true;
    const validationVersion = validationVersionRef.current + 1;
    validationVersionRef.current = validationVersion;
    setValidating(true);
    setError(null);
    try {
      const result = await validarInvitacionClienteApi(token);
      if (validationVersionRef.current !== validationVersion) {
        return;
      }
      setValidation(result);
      if (!result.valida) {
        setError(result.mensaje);
        setScreen("ENTRY");
        return;
      }
      setManualLink(token);
      setScreen("REGISTER");
    } catch (requestError) {
      if (validationVersionRef.current !== validationVersion) {
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "No se pudo comprobar la invitación.");
      setScreen("ENTRY");
    } finally {
      if (validationVersionRef.current === validationVersion) {
        validationInFlightRef.current = false;
        setValidating(false);
      }
    }
  }, []);

  const clearRegistration = useCallback(() => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmation("");
    setPasswordVisible(false);
    setConfirmationVisible(false);
    setFocusedField(null);
    setTouched({});
    setError(null);
  }, []);

  const leaveRoute = useCallback(() => {
    clearRegistration();
    allowNavigationRef.current = true;
    onBack();
  }, [clearRegistration, onBack]);

  const requestBack = useCallback(() => {
    if (registrationInFlightRef.current) {
      return;
    }

    if (screen === "SCANNER") {
      validationVersionRef.current += 1;
      validationInFlightRef.current = false;
      scannerReadRef.current = false;
      setScannerLocked(false);
      setValidating(false);
      setScreen("ENTRY");
      return;
    }

    if (screen === "ENTRY") {
      leaveRoute();
      return;
    }

    const hasRegistrationData = Boolean(
      name.trim() || email.trim() || password || confirmation,
    );
    const discard = () => {
      clearRegistration();
      setScreen("ENTRY");
    };

    if (!hasRegistrationData) {
      discard();
      return;
    }

    if (discardAlertOpenRef.current) {
      return;
    }
    discardAlertOpenRef.current = true;

    Alert.alert(
      "Descartar registro",
      "Los datos introducidos no se guardarán.",
      [
        {
          text: "Permanecer",
          style: "cancel",
          onPress: () => {
            discardAlertOpenRef.current = false;
          },
        },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            discardAlertOpenRef.current = false;
            discard();
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          discardAlertOpenRef.current = false;
        },
      },
    );
  }, [clearRegistration, confirmation, email, leaveRoute, name, password, screen]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      requestBack();
      return true;
    });
    return () => subscription.remove();
  }, [requestBack]);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (allowNavigationRef.current) {
      return;
    }
    event.preventDefault();
    requestBack();
  }), [navigation, requestBack]);

  useEffect(() => {
    if (!initialToken || initialTokenHandled.current === initialToken) {
      return;
    }
    initialTokenHandled.current = initialToken;
    void validateToken(initialToken);
  }, [initialToken, validateToken]);

  const openScanner = async () => {
    setError(null);
    if (permission?.granted) {
      scannerReadRef.current = false;
      setScannerLocked(false);
      setScreen("SCANNER");
      return;
    }
    const result = await requestPermission();
    if (result.granted) {
      scannerReadRef.current = false;
      setScannerLocked(false);
      setScreen("SCANNER");
    } else {
      setError("Necesitamos permiso de cámara para escanear el QR. También puedes pegar el enlace manualmente.");
    }
  };

  const scanBarcode = ({ data }: BarcodeScanningResult) => {
    if (scannerReadRef.current || validationInFlightRef.current) return;
    scannerReadRef.current = true;
    setScannerLocked(true);
    void validateToken(data).finally(() => {
      scannerReadRef.current = false;
      setScannerLocked(false);
    });
  };

  const pasteLink = async () => {
    const value = await Clipboard.getStringAsync();
    setManualLink(value);
    if (value.trim()) {
      void validateToken(value);
    }
  };

  const submitRegistration = async () => {
    if (registrationInFlightRef.current) {
      return;
    }
    setTouched({ name: true, email: true, password: true, confirmation: true });
    const token = extractInvitationToken(manualLink);
    if (!formValid || !token) {
      return;
    }

    registrationInFlightRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const session = await registrarClienteConInvitacionApi({
        token,
        nombre: name.trim(),
        email: normalizedEmail,
        password,
        confirmarPassword: confirmation,
      });
      clearRegistration();
      allowNavigationRef.current = true;
      try {
        onRegistered(session);
      } catch (registrationError) {
        allowNavigationRef.current = false;
        throw registrationError;
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo completar el registro.");
    } finally {
      registrationInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  if (screen === "SCANNER") {
    return (
      <View style={styles.scannerScreen}>
        <StatusBar style="light" backgroundColor="#07101F" />
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          active
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scannerLocked ? undefined : scanBarcode}
        />
        <View style={styles.scannerOverlay}>
          <SafeAreaView style={styles.scannerSafeArea} edges={["top", "bottom", "left", "right"]}>
            <PageHeader title="Escanear invitación" onBack={requestBack} inverted />
            <View style={styles.scannerGuideWrap}>
              <View style={styles.scannerGuide} />
              <Text style={styles.scannerText}>Coloca el código QR dentro del recuadro</Text>
            </View>
            <Pressable style={styles.scannerManualButton} onPress={requestBack}>
              <Text style={styles.scannerManualText}>Pegar enlace manualmente</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" backgroundColor={theme.background} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            <PageHeader
              title={screen === "REGISTER" ? "Crear tu cuenta" : "Usar invitación"}
              onBack={requestBack}
              disabled={submitting}
            />
            <View style={styles.brandWrap}>
              <GymFlowBrand markSize={70} wordmarkSize={21} compact />
            </View>

            {screen === "ENTRY" ? (
              <>
                <View style={styles.heading}>
                  <Text style={styles.eyebrow}>ACCESO SEGURO</Text>
                  <Text style={styles.title}>Únete a tu gimnasio</Text>
                  <Text style={styles.subtitle}>Escanea el QR que te ha facilitado el gimnasio o pega el enlace recibido.</Text>
                </View>

                {!!error && (
                  <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.error} />
                    <View style={styles.errorCopy}>
                      <Text style={styles.errorText}>{error}</Text>
                      {permission?.canAskAgain === false && (
                        <Pressable onPress={() => void NativeLinking.openSettings()}>
                          <Text style={styles.settingsLink}>Abrir ajustes</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                <AccessButton label="Escanear código QR" icon="qrcode-scan" onPress={() => void openScanner()} />

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>o pega el enlace</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.linkField}>
                  <MaterialCommunityIcons name="link-variant" size={21} color={theme.muted} />
                  <TextInput
                    value={manualLink}
                    onChangeText={setManualLink}
                    placeholder="gymflowmobile://invite?..."
                    placeholderTextColor={theme.subtle}
                    style={styles.linkInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    accessibilityLabel="Enlace de invitación"
                  />
                  <Pressable style={styles.pasteButton} onPress={() => void pasteLink()} accessibilityLabel="Pegar enlace">
                    <MaterialCommunityIcons name="content-paste" size={20} color={theme.blue} />
                  </Pressable>
                </View>
                <AccessButton
                  label="Validar invitación"
                  icon="arrow-right"
                  onPress={() => void validateToken(manualLink)}
                  loading={validating}
                  disabled={!manualLink.trim()}
                  secondary
                />
              </>
            ) : (
              <>
                <View style={styles.heading}>
                  <Text style={styles.eyebrow}>INVITACIÓN VERIFICADA</Text>
                  <Text style={styles.title}>{validation?.nombreGimnasio}</Text>
                  <Text style={styles.subtitle}>Crea tu cuenta de cliente para unirte a este gimnasio en GymFlow.</Text>
                </View>

                {!!error && (
                  <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.form}>
                  <Field
                    label="Nombre completo"
                    icon="account-outline"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => { setFocusedField(null); setTouched((current) => ({ ...current, name: true })); }}
                    focused={focusedField === "name"}
                    error={touched.name ? fieldErrors.name : null}
                    placeholder="Tu nombre y apellidos"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                  />
                  <Field
                    label="Correo electrónico"
                    icon="email-outline"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => { setFocusedField(null); setTouched((current) => ({ ...current, email: true })); }}
                    focused={focusedField === "email"}
                    error={touched.email ? fieldErrors.email : null}
                    placeholder="tu@email.com"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                  <Field
                    label="Contraseña"
                    icon="lock-outline"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => { setFocusedField(null); setTouched((current) => ({ ...current, password: true })); }}
                    focused={focusedField === "password"}
                    error={touched.password ? fieldErrors.password : null}
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry={!passwordVisible}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    inputRef={passwordRef}
                    onSubmitEditing={() => confirmationRef.current?.focus()}
                    rightAction={(
                      <Pressable style={styles.eyeButton} onPress={() => { setPasswordVisible((value) => !value); requestAnimationFrame(() => passwordRef.current?.focus()); }} accessibilityLabel={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}>
                        <MaterialCommunityIcons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={21} color={theme.muted} />
                      </Pressable>
                    )}
                  />
                  <Field
                    label="Confirmar contraseña"
                    icon="lock-outline"
                    value={confirmation}
                    onChangeText={setConfirmation}
                    onFocus={() => setFocusedField("confirmation")}
                    onBlur={() => { setFocusedField(null); setTouched((current) => ({ ...current, confirmation: true })); }}
                    focused={focusedField === "confirmation"}
                    error={touched.confirmation ? fieldErrors.confirmation : null}
                    placeholder="Repite tu contraseña"
                    secureTextEntry={!confirmationVisible}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    inputRef={confirmationRef}
                    onSubmitEditing={() => void submitRegistration()}
                    rightAction={(
                      <Pressable style={styles.eyeButton} onPress={() => { setConfirmationVisible((value) => !value); requestAnimationFrame(() => confirmationRef.current?.focus()); }} accessibilityLabel={confirmationVisible ? "Ocultar confirmación" : "Mostrar confirmación"}>
                        <MaterialCommunityIcons name={confirmationVisible ? "eye-off-outline" : "eye-outline"} size={21} color={theme.muted} />
                      </Pressable>
                    )}
                  />
                </View>

                <View style={styles.contextNote}>
                  <MaterialCommunityIcons name="shield-check-outline" size={21} color={theme.blue} />
                  <Text style={styles.contextNoteText}>Tu cuenta se creará como cliente activo de {validation?.nombreGimnasio}. No se solicitará ninguna foto ahora.</Text>
                </View>

                <AccessButton label="Crear cuenta y entrar" icon="check" onPress={() => void submitRegistration()} loading={submitting} disabled={!formValid} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: theme.background },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 30 },
  column: { width: "100%", maxWidth: 440, alignSelf: "center" },
  pageHeader: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
  backButtonInverted: { borderColor: "rgba(255,255,255,0.30)", backgroundColor: "rgba(7,16,31,0.56)" },
  pageHeaderTitle: { color: theme.text, fontFamily: theme.fonts.bold, fontSize: 16 },
  pageHeaderTitleInverted: { color: "#FFFFFF" },
  headerSpacer: { width: 44 },
  brandWrap: { alignItems: "center", marginTop: 12, marginBottom: 25 },
  heading: { alignItems: "center", marginBottom: 24 },
  eyebrow: { color: theme.blue, fontFamily: theme.fonts.extraBold, fontSize: 11, letterSpacing: 0, marginBottom: 7 },
  title: { color: theme.text, fontFamily: theme.fonts.extraBold, fontSize: 28, lineHeight: 34, textAlign: "center" },
  subtitle: { maxWidth: 360, marginTop: 8, color: theme.muted, fontFamily: theme.fonts.regular, fontSize: 14, lineHeight: 21, textAlign: "center" },
  errorBanner: { marginBottom: 16, borderRadius: 13, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: theme.errorBackground },
  errorCopy: { flex: 1 },
  errorText: { flex: 1, color: theme.error, fontFamily: theme.fonts.regular, fontSize: 13, lineHeight: 19 },
  settingsLink: { marginTop: 5, color: theme.blue, fontFamily: theme.fonts.bold, fontSize: 13 },
  accessButton: { width: "100%", minHeight: 54, borderRadius: 13, overflow: "hidden" },
  accessButtonSecondary: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, overflow: "visible" },
  accessButtonGradient: { minHeight: 54, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  accessButtonText: { color: "#FFFFFF", fontFamily: theme.fonts.bold, fontSize: 15 },
  accessButtonSecondaryContent: { minHeight: 52, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  accessButtonSecondaryText: { color: theme.text, fontFamily: theme.fonts.bold, fontSize: 15 },
  buttonDisabled: { opacity: 0.48 },
  dividerRow: { marginVertical: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { color: theme.muted, fontFamily: theme.fonts.medium, fontSize: 12 },
  linkField: { minHeight: 54, marginBottom: 11, borderRadius: 13, borderWidth: 1, borderColor: theme.border, paddingLeft: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: theme.surface },
  linkInput: { flex: 1, minWidth: 0, paddingVertical: 0, color: theme.text, fontFamily: theme.fonts.regular, fontSize: 14 },
  pasteButton: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  form: { gap: 16 },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: theme.text, fontFamily: theme.fonts.semiBold, fontSize: 13 },
  inputShell: { minHeight: 54, borderRadius: 13, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBackground, paddingLeft: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  inputShellFocused: { borderColor: theme.blue, backgroundColor: "#F8FAFF" },
  inputShellError: { borderColor: theme.error },
  input: { flex: 1, minWidth: 0, paddingVertical: 0, color: theme.text, fontFamily: theme.fonts.regular, fontSize: 15 },
  eyeButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  fieldError: { color: theme.error, fontFamily: theme.fonts.regular, fontSize: 12, lineHeight: 17 },
  contextNote: { marginVertical: 18, borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: theme.surfaceSoft },
  contextNoteText: { flex: 1, color: theme.muted, fontFamily: theme.fonts.regular, fontSize: 12, lineHeight: 18 },
  scannerScreen: { flex: 1, backgroundColor: "#07101F" },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4, 10, 24, 0.42)" },
  scannerSafeArea: { flex: 1, paddingHorizontal: 20 },
  scannerGuideWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scannerGuide: { width: 250, height: 250, borderRadius: 28, borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: "transparent" },
  scannerText: { maxWidth: 280, marginTop: 22, color: "#FFFFFF", fontFamily: theme.fonts.semiBold, fontSize: 14, lineHeight: 20, textAlign: "center" },
  scannerManualButton: { minHeight: 52, marginBottom: 14, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  scannerManualText: { color: theme.text, fontFamily: theme.fonts.bold, fontSize: 14 },
});
