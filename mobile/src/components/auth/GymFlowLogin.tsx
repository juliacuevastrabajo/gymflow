import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  findNodeHandle,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { gymFlowAccessTheme as theme } from "../../theme/gymflowAccessTheme";
import GymFlowBrand from "./GymFlowBrand";

export type GymFlowLoginCredentials = {
  email: string;
  password: string;
};

type GymFlowLoginProps = {
  loading: boolean;
  errorMessage?: string | null;
  onSubmit: (credentials: GymFlowLoginCredentials) => void | Promise<void>;
  onInvitationPress: () => void;
};

type GradientActionButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: "arrow-right" | "refresh";
  onPress: () => void;
  accessibilityLabel: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACTIVE_GRADIENT = [theme.blue, theme.violet] as const;
const DISABLED_GRADIENT = [theme.disabled, theme.disabledEnd] as const;
const DOTS = Array.from({ length: 54 }, (_, index) => index);

function AccessDots() {
  return (
    <View style={styles.dotPattern} pointerEvents="none" accessibilityElementsHidden>
      {DOTS.map((dot) => (
        <View
          key={dot}
          style={[
            styles.dot,
            {
              opacity: 0.06 + ((dot % 9) / 9) * 0.12,
              transform: [{ scale: 0.72 + ((dot * 3) % 7) * 0.05 }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function GradientActionButton({
  label,
  loading = false,
  disabled = false,
  icon = "arrow-right",
  onPress,
  accessibilityLabel,
}: GradientActionButtonProps) {
  const unavailable = disabled || loading;

  return (
    <Pressable
      style={[styles.actionButton, unavailable && styles.actionButtonDisabled]}
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: unavailable, busy: loading }}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={unavailable ? DISABLED_GRADIENT : ACTIVE_GRADIENT}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.actionButtonGradient, pressed && styles.actionButtonPressed]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.actionButtonText}>{label}</Text>
              <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}

export default function GymFlowLogin({
  loading,
  errorMessage,
  onSubmit,
  onInvitationPress,
}: GymFlowLoginProps) {
  const loginScrollRef = useRef<ScrollView | null>(null);
  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const emailFieldRef = useRef<View | null>(null);
  const passwordFieldRef = useRef<View | null>(null);
  const activeFieldRef = useRef<View | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [visibilityFocused, setVisibilityFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(
    null,
  );
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const emailError =
    emailTouched && !normalizedEmail
      ? "Escribe tu email."
      : emailTouched && !EMAIL_PATTERN.test(normalizedEmail)
        ? "Escribe un email válido."
        : null;
  const passwordError =
    passwordTouched && !password ? "Escribe tu contraseña." : null;
  const formValid = EMAIL_PATTERN.test(normalizedEmail) && password.length > 0;

  const scrollActiveFieldIntoView = useCallback(() => {
    if (Platform.OS === "web") return;

    const fieldHandle = findNodeHandle(activeFieldRef.current);
    if (fieldHandle == null) return;

    loginScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
      fieldHandle,
      0,
      true,
    );
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollActiveFieldIntoView]);

  useEffect(() => {
    if (keyboardVisible) {
      scrollActiveFieldIntoView();
    }
  }, [keyboardVisible, scrollActiveFieldIntoView]);

  const focusField = (
    field: "email" | "password",
    fieldRef: View | null,
  ) => {
    activeFieldRef.current = fieldRef;
    setFocusedField(field);
    if (keyboardVisible) {
      scrollActiveFieldIntoView();
    }
  };

  const submit = () => {
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!formValid || loading) {
      return;
    }

    void onSubmit({ email: normalizedEmail, password });
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((visible) => !visible);
    requestAnimationFrame(() => passwordInputRef.current?.focus());
  };

  return (
    <SafeAreaView style={styles.loginSafeArea} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" backgroundColor={theme.background} />
      <AccessDots />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={loginScrollRef}
          contentContainerStyle={[
            styles.loginContent,
            keyboardVisible && styles.loginContentKeyboardVisible,
          ]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginColumn}>
            <View style={styles.loginBrand}>
              <GymFlowBrand markSize={94} wordmarkSize={27} />
            </View>

            <View style={styles.formHeading}>
              <Text style={styles.title}>¡Bienvenido!</Text>
              <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner} accessibilityLiveRegion="polite">
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color={theme.error}
                />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.formFields}>
              <View ref={emailFieldRef} collapsable={false} style={styles.fieldGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View
                  style={[
                    styles.inputShell,
                    focusedField === "email" && styles.inputShellFocused,
                    emailError && styles.inputShellError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={21}
                    color={focusedField === "email" ? theme.blue : theme.muted}
                  />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => focusField("email", emailFieldRef.current)}
                    onBlur={() => {
                      setFocusedField(null);
                      setEmailTouched(true);
                    }}
                    placeholder="tu@email.com"
                    placeholderTextColor={theme.subtle}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="next"
                    textContentType="username"
                    accessibilityLabel="Correo electrónico"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>

              <View ref={passwordFieldRef} collapsable={false} style={styles.fieldGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View
                  style={[
                    styles.inputShell,
                    focusedField === "password" && styles.inputShellFocused,
                    passwordError && styles.inputShellError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={21}
                    color={focusedField === "password" ? theme.blue : theme.muted}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => {
                      focusField("password", passwordFieldRef.current);
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      setPasswordTouched(true);
                    }}
                    placeholder="Tu contraseña"
                    placeholderTextColor={theme.subtle}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    autoCorrect={false}
                    secureTextEntry={!passwordVisible}
                    returnKeyType="done"
                    textContentType="password"
                    accessibilityLabel="Contraseña"
                    onSubmitEditing={submit}
                  />
                  <Pressable
                    style={[
                      styles.visibilityButton,
                      visibilityFocused && styles.visibilityButtonFocused,
                    ]}
                    onPress={togglePasswordVisibility}
                    onFocus={() => setVisibilityFocused(true)}
                    onBlur={() => setVisibilityFocused(false)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    hitSlop={4}
                  >
                    <MaterialCommunityIcons
                      name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                      size={21}
                      color={theme.muted}
                    />
                  </Pressable>
                </View>
                {passwordError ? (
                  <Text style={styles.fieldError}>{passwordError}</Text>
                ) : null}
              </View>
            </View>

            <GradientActionButton
              label="Iniciar sesión"
              loading={loading}
              disabled={!formValid}
              onPress={submit}
              accessibilityLabel="Iniciar sesión"
            />

            <Pressable
              style={styles.invitationButton}
              onPress={onInvitationPress}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Tengo una invitación"
            >
              <MaterialCommunityIcons name="qrcode-scan" size={21} color={theme.blue} />
              <Text style={styles.invitationButtonText}>Tengo una invitación</Text>
              <MaterialCommunityIcons name="chevron-right" size={21} color={theme.blue} />
            </Pressable>

            <Text style={styles.helpText}>
              ¿Aún no tienes acceso? Solicita una invitación a tu gimnasio.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type GymFlowSessionErrorProps = {
  loading?: boolean;
  onRetry: () => void;
};

export function GymFlowSessionError({
  loading = false,
  onRetry,
}: GymFlowSessionErrorProps) {
  return (
    <SafeAreaView style={styles.loginSafeArea} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="dark" backgroundColor={theme.background} />
      <AccessDots />
      <ScrollView contentContainerStyle={styles.sessionErrorContent}>
        <GymFlowBrand markSize={78} wordmarkSize={23} compact />
        <View style={styles.sessionErrorIcon}>
          <MaterialCommunityIcons name="wifi-alert" size={31} color={theme.blue} />
        </View>
        <Text style={styles.sessionErrorTitle}>No podemos conectar ahora</Text>
        <Text style={styles.sessionErrorText}>
          Tu sesión sigue guardada. Comprueba la conexión e inténtalo de nuevo.
        </Text>
        <View style={styles.retryButtonWrapper}>
          <GradientActionButton
            label="Reintentar"
            icon="refresh"
            loading={loading}
            onPress={onRetry}
            accessibilityLabel="Reintentar conexión"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function IndeterminateProgress() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-84, 214],
  });

  return (
    <View
      style={styles.progressTrack}
      accessibilityRole="progressbar"
      accessibilityLabel="Restaurando sesión"
    >
      <Animated.View style={[styles.progressIndicator, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={ACTIVE_GRADIENT}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.flex}
        />
      </Animated.View>
    </View>
  );
}

type GymFlowSessionLoadingProps = {
  onReady?: () => void;
};

export function GymFlowSessionLoading({ onReady }: GymFlowSessionLoadingProps) {
  const [layoutReady, setLayoutReady] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const [markReady, setMarkReady] = useState(false);
  const readyReportedRef = useRef(false);

  useEffect(() => {
    if (
      !layoutReady ||
      !photoReady ||
      !markReady ||
      readyReportedRef.current
    ) {
      return;
    }

    readyReportedRef.current = true;
    onReady?.();
  }, [layoutReady, markReady, onReady, photoReady]);

  return (
    <View style={styles.loadingScreen} onLayout={() => setLayoutReady(true)}>
      <StatusBar style="light" backgroundColor={theme.splashBackground} />
      <Image
        source={require("../../../assets/images/gymflow-session-loading.jpg")}
        resizeMode="cover"
        style={styles.loadingBackgroundImage}
        onLoad={() => setPhotoReady(true)}
        onError={() => setPhotoReady(true)}
        accessible={false}
      />
      <LinearGradient
        colors={[
          "rgba(7, 14, 31, 0.40)",
          "rgba(8, 17, 38, 0.58)",
          "rgba(11, 19, 40, 0.96)",
        ]}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.loadingSafeArea} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.loadingContent} accessibilityLiveRegion="polite">
          <View style={styles.loadingBrandBlock}>
            <GymFlowBrand
              variant="white"
              markSize={126}
              wordmarkSize={30}
              onMarkReady={() => setMarkReady(true)}
            />
            <Text style={styles.loadingClaim}>CONECTA. GESTIONA. HAZ CRECER.</Text>
          </View>

          <View style={styles.loadingFooter}>
            <Text style={styles.loadingSessionText}>CARGANDO TU MEJOR VERSIÓN…</Text>
            <IndeterminateProgress />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loginSafeArea: {
    flex: 1,
    backgroundColor: theme.background,
    overflow: "hidden",
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  loginContentKeyboardVisible: {
    justifyContent: "flex-start",
  },
  loginColumn: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  loginBrand: {
    alignItems: "center",
    marginBottom: 34,
  },
  formHeading: {
    alignItems: "center",
    gap: 7,
    marginBottom: 30,
  },
  title: {
    color: theme.text,
    fontFamily: theme.fonts.extraBold,
    fontSize: 30,
    lineHeight: 37,
    textAlign: "center",
  },
  subtitle: {
    color: theme.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: theme.errorBackground,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  errorBannerText: {
    flex: 1,
    color: theme.error,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  formFields: {
    gap: 18,
    marginBottom: 24,
  },
  fieldGroup: { gap: 7 },
  label: {
    color: theme.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    lineHeight: 19,
  },
  inputShell: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBackground,
  },
  inputShellError: { borderColor: theme.error },
  inputShellFocused: {
    borderColor: theme.blue,
    backgroundColor: "#F8FAFF",
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: theme.text,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  visibilityButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    outlineWidth: 0,
  },
  visibilityButtonFocused: {
    borderWidth: 1,
    borderColor: theme.blue,
  },
  fieldError: {
    color: theme.error,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: theme.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  actionButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonGradient: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
    paddingHorizontal: 20,
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  invitationButton: {
    width: "100%",
    minHeight: 52,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  invitationButtonText: {
    flex: 1,
    color: theme.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    textAlign: "center",
  },
  helpText: {
    maxWidth: 360,
    alignSelf: "center",
    color: theme.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 25,
  },
  dotPattern: {
    position: "absolute",
    right: -30,
    bottom: -18,
    width: 210,
    height: 160,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    transform: [{ rotate: "-9deg" }],
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.blue,
  },
  sessionErrorContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 42,
  },
  sessionErrorIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 34,
    marginBottom: 18,
  },
  sessionErrorTitle: {
    color: theme.text,
    fontFamily: theme.fonts.extraBold,
    fontSize: 25,
    lineHeight: 31,
    textAlign: "center",
  },
  sessionErrorText: {
    maxWidth: 360,
    color: theme.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 9,
  },
  retryButtonWrapper: {
    width: "100%",
    maxWidth: 260,
    marginTop: 26,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.splashBackground,
    overflow: "hidden",
  },
  loadingBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    backgroundColor: theme.splashBackground,
  },
  loadingSafeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 42,
  },
  loadingBrandBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 88,
  },
  loadingClaim: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.45,
    marginTop: 14,
    textAlign: "center",
  },
  loadingFooter: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  loadingSessionText: {
    color: "rgba(255,255,255,0.86)",
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.9,
    textAlign: "center",
  },
  progressTrack: {
    width: 214,
    height: 3,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressIndicator: {
    width: 84,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
});
