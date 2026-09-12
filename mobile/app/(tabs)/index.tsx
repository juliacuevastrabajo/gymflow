import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { setStatusBarStyle } from "expo-status-bar";
import * as VideoThumbnails from "expo-video-thumbnails";

import {
  actualizarClaseApi,
  actualizarProgramacionClaseApi,
  actualizarEjercicioApi,
  actualizarEjercicioDeRutinaApi,
  actualizarFotoPerfilApi,
  actualizarGimnasioApi,
  actualizarMiPerfilApi,
  listarPagosApi,
  listarMisPagosApi,
  actualizarRutinaApi,
  agregarEjercicioARutinaApi,
  asignarRutinaApi,
  cancelarReservaApi,
  cambiarOrdenEjerciciosRutinaApi,
  cambiarMiPasswordApi,
  consultarRutinaApi,
  crearEjercicioApi,
  crearProgramacionClaseApi,
  crearMensajeApi,
  crearReservaApi,
  crearRutinaApi,
  desactivarClaseApi,
  desactivarProgramacionClaseApi,
  desactivarRutinaApi,
  desactivarUsuarioApi,
  eliminarMensajeApi,
  eliminarEjercicioDeRutinaApi,
  listarAsignacionesRutinaApi,
  listarEjerciciosApi,
  listarMisRutinasAsignadasApi,
  listarRutinasApi,
  loginApi,
  marcarMensajeLeidoApi,
  obtenerDashboardData,
  obtenerSesionActualApi,
  pausarMensajeApi,
  reanudarMensajeApi,
  resolverUrlMedia,
  retirarAsignacionRutinaApi,
  setAuthToken,
  subirImagenApi,
  subirMultimediaApi,
  GymFlowApiError,
  type AdminCreatedUser,
  type AuthLoginResponse,
  type AuthSessionUser,
  type FinalidadArchivo,
  type MessageApiResponse,
  type RutinaEjercicioRequest,
  type TipoMultimediaEjercicio,
  type Pago,
} from "../../src/services/gymflowService";
import {
  eliminarTokenSesion,
  guardarTokenSesion,
  obtenerTokenSesion,
} from "../../src/services/authSessionStorage";
import {
  subscribeAuthenticatedSession,
  subscribeSessionExpired,
} from "../../src/services/authSessionCoordinator";

import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  findNodeHandle,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import AdminClasses from "../../src/components/admin/AdminClasses";
import AdminClientInvitations from "../../src/components/admin/AdminClientInvitations";
import AdminClients from "../../src/components/admin/AdminClients";
import AdminDashboard from "../../src/components/admin/AdminDashboard";
import AdminManagement from "../../src/components/admin/AdminManagement";
import AdminGymSettings, {
  type GymPreviewContext,
  type GymSettingsData,
} from "../../src/components/admin/AdminGymSettings";
import AdminPayments from "../../src/components/admin/AdminPayments";
import AdminReservations, {
  type AdminReservationFilter,
} from "../../src/components/admin/AdminReservations";
import AdminRoutines, {
  type AdminRoutineFilter,
} from "../../src/components/admin/AdminRoutines";
import AdminTrainers, {
  type AdminTrainerFilter,
} from "../../src/components/admin/AdminTrainers";
import AdminUserCreate from "../../src/components/admin/AdminUserCreate";
import ClientPayments from "../../src/components/client/ClientPayments";
import { ProfilePhotoSourceSheet } from "../../src/components/media/ProfilePhotoSourceSheet";
import OneRepMaxCalculator, {
  OneRepMaxAccessCard,
} from "../../src/components/routines/OneRepMaxCalculator";
import GymFlowLogin, {
  GymFlowSessionError,
  GymFlowSessionLoading,
  type GymFlowLoginCredentials,
} from "../../src/components/auth/GymFlowLogin";
import {
  Avatar as PremiumAvatar,
  Card as PremiumCard,
  ClassCard as PremiumClassCard,
  ClassMediaPlaceholder,
  DaySelector as PremiumDaySelector,
  DashboardBackdrop,
  DashboardHeroBackground,
  EmptyState as PremiumEmptyState,
  FilterChip as PremiumFilterChip,
  MetricCard as PremiumMetricCard,
  PrimaryButton as PremiumPrimaryButton,
  ScreenContainer as PremiumScreenContainer,
  SecondaryButton as PremiumSecondaryButton,
  SectionHeader as PremiumSectionHeader,
  type GymFlowTheme,
} from "../../src/components/GymFlowDesignSystem";
import type {
  EjercicioApp,
  RutinaApp,
  RutinaAsignadaApp,
  RutinaEjercicioApp,
} from "../../src/features/routines/types";
import {
  calculateOneRepMax,
  sanitizeOneRepMaxRepetitionInput,
  sanitizeOneRepMaxWeightInput,
  validateOneRepMaxInputs,
  type OneRepMaxResult,
} from "../../src/features/routines/oneRepMax";
import {
  isClassCalendarDayDisabled,
  resolveClassCalendarSelectionAfterDayChange,
} from "../../src/features/classes/classCalendar";

type RolApp = "SELECTOR" | "ADMIN" | "ENTRENADOR" | "CLIENTE";
type ProfilePhotoSelection =
  | { type: "ASSET"; asset: ImagePicker.ImagePickerAsset }
  | { type: "REMOVE" }
  | null;
type EstadoArranqueApp =
  | "RESTORING_SESSION"
  | "UNAUTHENTICATED"
  | "AUTHENTICATED"
  | "TEMPORARY_ERROR";
type EstadoArranqueResuelto = Exclude<EstadoArranqueApp, "RESTORING_SESSION">;
const COLD_START_LOADING_MIN_MS = 1000;
type RolNuevoUsuario = "CLIENTE" | "ENTRENADOR";
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type SeccionAdmin =
  | "INICIO"
  | "GESTION"
  | "CLIENTES"
  | "INVITACIONES_CLIENTES"
  | "ENTRENADORES"
  | "CLASES"
  | "RESERVAS"
  | "PAGOS"
  | "MENSAJES"
  | "PERSONALIZAR"
  | "CREAR_USUARIO"
  | "RUTINAS";
type SeccionCliente =
  | "PANEL"
  | "CLASES"
  | "RESERVAS"
  | "MENSAJES"
  | "PAGOS"
  | "PERFIL"
  | "RUTINAS";
type SeccionEntrenador =
  | "PANEL"
  | "CLASES"
  | "MENSAJES"
  | "PERFIL"
  | "RUTINAS";
type AdminSectionExitGuard = (onConfirm: () => void) => void;
const SECCIONES_ADMIN_VALIDAS = new Set<SeccionAdmin>([
  "INICIO",
  "GESTION",
  "CLIENTES",
  "INVITACIONES_CLIENTES",
  "ENTRENADORES",
  "CLASES",
  "RESERVAS",
  "PAGOS",
  "MENSAJES",
  "PERSONALIZAR",
  "CREAR_USUARIO",
  "RUTINAS",
]);
const SECCIONES_ADMIN_GESTION = new Set<SeccionAdmin>([
  "GESTION",
  "CLIENTES",
  "INVITACIONES_CLIENTES",
  "ENTRENADORES",
  "CLASES",
  "RESERVAS",
  "RUTINAS",
  "PAGOS",
  "CREAR_USUARIO",
]);
const SECCIONES_CLIENTE_VALIDAS = new Set<SeccionCliente>([
  "PANEL",
  "CLASES",
  "RESERVAS",
  "MENSAJES",
  "PAGOS",
  "PERFIL",
  "RUTINAS",
]);
const SECCIONES_ENTRENADOR_VALIDAS = new Set<SeccionEntrenador>([
  "PANEL",
  "CLASES",
  "MENSAJES",
  "PERFIL",
  "RUTINAS",
]);
type ModoClasesAdmin = "CREADAS" | "DESACTIVADAS" | "CREAR" | "EDITAR";
type FiltroClientes = "TODOS" | "ACTIVOS" | "PENDIENTES" | "CANCELADOS";
type FiltroMensajes = "TODOS" | "NO_LEIDOS" | "PRIORITARIOS" | "AUTOMATICOS";
type ModoMensajesAdmin = "BANDEJA" | "NUEVO" | "AUTOMATIZACIONES";
type ModoMensajesUsuario = "BANDEJA" | "NUEVO";
type RolMensajesVista = "CLIENTE" | "ENTRENADOR" | "ADMIN";
type ModoReservasCliente = "PROXIMAS" | "HISTORIAL";
type BuzonMensajes = "RECIBIDOS" | "ENVIADOS" | "TODOS";
type AudienciaMensaje = "TODOS" | "CLIENTES" | "ENTRENADORES" | "INDIVIDUAL";
type TipoProgramacionMensajeApp = "AHORA" | "FECHA" | "RECURRENTE";
type FrecuenciaMensajeApp = "NINGUNA" | "DIARIA" | "SEMANAL" | "MENSUAL";
type EstadoMensajeApp = "ENVIADO" | "PROGRAMADO" | "ACTIVO" | "PAUSADO";
type PrioridadMensajeApp = "NORMAL" | "IMPORTANTE" | "URGENTE";
type FeedbackMensajesCliente = {
  tipo: "success" | "error";
  texto: string;
  reintentar?: boolean;
};
type ModoPerfilCliente = "RESUMEN" | "DATOS_PERSONALES" | "PASSWORD";
type OrigenNuevoMensajeAdmin = {
  tipo: "FICHA_CLIENTE";
  clienteId: number;
} | {
  tipo: "FICHA_ENTRENADOR";
  entrenadorId: number;
} | null;

function limpiarAsuntoConversacion(asunto?: string | null) {
  return (asunto || "Mensaje").replace(/^(re:\s*)+/i, "").trim() || "Mensaje";
}

function pluralizar(cantidad: number, singular: string, plural: string) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

type MensajeApp = {
  id: string;
  asunto: string;
  texto: string;
  automatico: boolean;
  conversacionId?: string;
  mensajePadreId?: number;
  audiencia: AudienciaMensaje;
  fecha: string;
  fechaOrden: number;
  fechaProgramada?: string;
  frecuencia?: FrecuenciaMensajeApp;
  prioridad?: PrioridadMensajeApp;
  tipoProgramacion?: TipoProgramacionMensajeApp;
  estado?: EstadoMensajeApp;
  leido: boolean;
  remitente: string;
  remitenteId?: number;
  destinatarioIds?: number[];
  leidoPorUsuarioIds?: number[];
  destinatariosCount?: number;
  segmentoLabel?: string;
};
type ConversacionMensaje = {
  id: string;
  mensaje: MensajeApp;
  mensajes: MensajeApp[];
  total: number;
  noLeidos: number;
};
type GrupoClase = {
  key: string;
  programacionId?: number;
  programacionActiva?: boolean;
  programacionFechaInicio?: string;
  nombre: string;
  descripcion: string;
  nombreEntrenador?: string;
  entrenadorId?: number;
  duracionMinutos?: number;
  capacidadMaxima?: number;
  imagenUrl?: string;
  reglas: { diaSemana: number; hora: string }[];
  sesiones: any[];
};
type ModoRutinasEntrenador =
  | "LISTA"
  | "DETALLE"
  | "FORMULARIO"
  | "EJERCICIOS"
  | "ASIGNAR"
  | "CALCULADORA_1RM";
type ModoRutinasCliente =
  | "LISTA"
  | "DETALLE"
  | "ENTRENAMIENTO"
  | "COMPLETADA"
  | "CALCULADORA_1RM";
type EjercicioRutinaFormSnapshot = {
  nombre: string;
  descripcion: string;
  tipoMultimedia: TipoMultimediaEjercicio;
  multimediaUrl: string;
  series: string;
  repeticiones: string;
  descanso: string;
  peso: string;
  notas: string;
};
type ErroresEjercicioRutina = Partial<
  Record<
    | "nombre"
    | "series"
    | "repeticiones"
    | "descanso"
    | "peso"
    | "multimedia",
    string
  >
>;
type RutinaMultimediaActiva = {
  tipo: "IMAGEN" | "VIDEO";
  uri: string;
  titulo: string;
};
type HslColor = {
  h: number;
  s: number;
  l: number;
};

const DIAS_CLASE = [
  { id: 1, corto: "L", nombre: "Lunes" },
  { id: 2, corto: "M", nombre: "Martes" },
  { id: 3, corto: "X", nombre: "Miércoles" },
  { id: 4, corto: "J", nombre: "Jueves" },
  { id: 5, corto: "V", nombre: "Viernes" },
  { id: 6, corto: "S", nombre: "Sábado" },
  { id: 0, corto: "D", nombre: "Domingo" },
];
function normalizarHex(hex: string, fallback = "#000000") {
  const limpio = hex.trim().replace("#", "");

  if (/^[0-9a-fA-F]{6}$/.test(limpio)) {
    return `#${limpio.toUpperCase()}`;
  }

  return fallback;
}

function limitarNumero(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo);
}

function hexToHsl(hex: string): HslColor {
  const normalizado = normalizarHex(hex);
  const numero = parseInt(normalizado.replace("#", ""), 16);
  const r = ((numero >> 16) & 255) / 255;
  const g = ((numero >> 8) & 255) / 255;
  const b = (numero & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h = 0;

  if (max === r) {
    h = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  return {
    h: Math.round(h * 60),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function obtenerColorContraste(hex: string) {
  const normalizado = normalizarHex(hex);
  const numero = parseInt(normalizado.replace("#", ""), 16);
  const r = (numero >> 16) & 255;
  const g = (numero >> 8) & 255;
  const b = numero & 255;
  const luminosidad = (r * 299 + g * 587 + b * 114) / 1000;

  return luminosidad > 150 ? "#0F172A" : "#FFFFFF";
}

function colorConAlpha(hex: string, alphaHex: string) {
  return `${normalizarHex(hex)}${alphaHex}`;
}

function mezclarColores(color: string, destino: string, pesoDestino: number) {
  const origenSeguro = normalizarHex(color);
  const destinoSeguro = normalizarHex(destino);
  const peso = limitarNumero(pesoDestino, 0, 1);
  const origenNumero = parseInt(origenSeguro.replace("#", ""), 16);
  const destinoNumero = parseInt(destinoSeguro.replace("#", ""), 16);
  const origen = [
    (origenNumero >> 16) & 255,
    (origenNumero >> 8) & 255,
    origenNumero & 255,
  ];
  const objetivo = [
    (destinoNumero >> 16) & 255,
    (destinoNumero >> 8) & 255,
    destinoNumero & 255,
  ];

  return `#${origen
    .map((canal, index) =>
      Math.round(canal * (1 - peso) + objetivo[index] * peso)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

function crearFechaLocalDesdeKey(fechaKey: string) {
  return new Date(`${fechaKey}T00:00:00`);
}

function crearFechaKeyLocal(fecha: Date) {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizarFechaLocal(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function sumarDiasFechaLocal(fecha: Date, dias: number) {
  const nuevaFecha = normalizarFechaLocal(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  return nuevaFecha;
}

function obtenerLunesSemanaLocal(fecha: Date) {
  const fechaNormalizada = normalizarFechaLocal(fecha);
  const desplazamiento = (fechaNormalizada.getDay() + 6) % 7;
  return sumarDiasFechaLocal(fechaNormalizada, -desplazamiento);
}

function crearSnapshotEjercicioRutinaVacio(): EjercicioRutinaFormSnapshot {
  return {
    nombre: "",
    descripcion: "",
    tipoMultimedia: "NINGUNO",
    multimediaUrl: "",
    series: "",
    repeticiones: "",
    descanso: "",
    peso: "",
    notas: "",
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const authenticatedScrollRef = useRef<ScrollView | null>(null);
  const keyboardScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const authenticatedScreenKeyRef = useRef("");
  const adminPaymentsExitGuardRef = useRef<AdminSectionExitGuard | null>(null);
  const adminSettingsExitGuardRef = useRef<AdminSectionExitGuard | null>(null);
  const sesionVersionRef = useRef(0);
  const cerrarSesionRef = useRef<() => void>(() => undefined);
  const reservaEnProcesoRef = useRef(false);
  const cancelacionesReservaEnProcesoRef = useRef(new Set<number>());
  const cargaSesionReactListaRef = useRef(false);
  const inicioCargaSesionVisibleRef = useRef<number | null>(null);
  const esPrimerArranqueRef = useRef(true);
  const chatMessagesListRef = useRef<FlatList<MensajeApp> | null>(null);
  const chatDebeIrAlFinalRef = useRef(false);
  const chatScrollAnimadoRef = useRef(false);
  const chatCercaDelFinalRef = useRef(true);
  const chatConversacionActualRef = useRef<string | null>(null);
  const chatMensajesCountRef = useRef(0);
  const desplazarChatAlFinal = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      chatMessagesListRef.current?.scrollToEnd({ animated });
    });
  }, []);
  const solicitarScrollChatAlFinal = useCallback((animated = false) => {
    chatDebeIrAlFinalRef.current = true;
    chatScrollAnimadoRef.current = chatScrollAnimadoRef.current || animated;
  }, []);
  const manejarContenidoChatDimensionado = useCallback(() => {
    if (!chatDebeIrAlFinalRef.current && !chatCercaDelFinalRef.current) {
      return;
    }

    const animated = chatScrollAnimadoRef.current;
    chatDebeIrAlFinalRef.current = false;
    chatScrollAnimadoRef.current = false;
    desplazarChatAlFinal(animated);
  }, [desplazarChatAlFinal]);
  const manejarScrollChat = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanciaAlFinal =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    chatCercaDelFinalRef.current = distanciaAlFinal < 96;
  }, []);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolApp>("SELECTOR");
  const [seccionAdmin, setSeccionAdmin] = useState<SeccionAdmin>("INICIO");
  const [seccionCliente, setSeccionCliente] = useState<SeccionCliente>("PANEL");
  const [seccionEntrenador, setSeccionEntrenador] =
    useState<SeccionEntrenador>("PANEL");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");
  const [busquedaMensajes, setBusquedaMensajes] = useState("");
  const [filtroClientes, setFiltroClientes] =
    useState<FiltroClientes>("TODOS");
  const [filtroEntrenadores, setFiltroEntrenadores] =
    useState<AdminTrainerFilter>("TODOS");
  const [busquedaRutinasAdmin, setBusquedaRutinasAdmin] = useState("");
  const [filtroRutinasAdmin, setFiltroRutinasAdmin] =
    useState<AdminRoutineFilter>("TODAS");
  const [filtroMensajes, setFiltroMensajes] =
    useState<FiltroMensajes>("TODOS");
  const [modoMensajesAdmin, setModoMensajesAdmin] =
    useState<ModoMensajesAdmin>("BANDEJA");
  const [origenNuevoMensajeAdmin, setOrigenNuevoMensajeAdmin] =
    useState<OrigenNuevoMensajeAdmin>(null);
  const [modoMensajesUsuario, setModoMensajesUsuario] =
    useState<ModoMensajesUsuario>("BANDEJA");
  const [buzonMensajes, setBuzonMensajes] =
    useState<BuzonMensajes>("RECIBIDOS");
  const [asuntoMensaje, setAsuntoMensaje] = useState("");
  const [textoMensaje, setTextoMensaje] = useState("");
  const [fechaMensaje, setFechaMensaje] = useState("");
  const [selectorFechaMensajeVisible, setSelectorFechaMensajeVisible] =
    useState(false);
  const [fechaMensajeTemporal, setFechaMensajeTemporal] = useState("");
  const [horaMensajeTemporal, setHoraMensajeTemporal] = useState("");
  const [errorFechaMensajeTemporal, setErrorFechaMensajeTemporal] =
    useState<string | null>(null);
  const [audienciaMensaje, setAudienciaMensaje] =
    useState<AudienciaMensaje>("CLIENTES");
  const [tipoProgramacionMensaje, setTipoProgramacionMensaje] =
    useState<TipoProgramacionMensajeApp>("AHORA");
  const [frecuenciaMensaje, setFrecuenciaMensaje] =
    useState<FrecuenciaMensajeApp>("NINGUNA");
  const [prioridadMensaje, setPrioridadMensaje] =
    useState<PrioridadMensajeApp>("NORMAL");
  const [destinatariosMensajeIds, setDestinatariosMensajeIds] = useState<
    number[]
  >([]);
  const [busquedaDestinatariosMensaje, setBusquedaDestinatariosMensaje] =
    useState("");
  const [selectorPersonaMensajeVisible, setSelectorPersonaMensajeVisible] =
    useState(false);
  const [filtroSelectorPersonasMensaje, setFiltroSelectorPersonasMensaje] =
    useState<"TODOS" | "CLIENTES" | "ENTRENADORES">("TODOS");
  const [guardandoMensaje, setGuardandoMensaje] = useState(false);
  const [respuestaMensaje, setRespuestaMensaje] = useState("");
  const [guardandoRespuestaMensaje, setGuardandoRespuestaMensaje] =
    useState(false);
  const [guardandoLecturasMensajes, setGuardandoLecturasMensajes] =
    useState(false);
  const [mensajesCreados, setMensajesCreados] = useState<MensajeApp[]>([]);
  const [mensajeSeleccionadoId, setMensajeSeleccionadoId] = useState<
    string | null
  >(null);
  const [mensajesLeidosIds, setMensajesLeidosIds] = useState<string[]>([]);
  const [feedbackMensajesCliente, setFeedbackMensajesCliente] =
    useState<FeedbackMensajesCliente | null>(null);
  const [errorCargaMensajes, setErrorCargaMensajes] = useState("");
  const [usuarioLogueado, setUsuarioLogueado] = useState<any>(null);
  const [estadoArranque, setEstadoArranque] =
    useState<EstadoArranqueApp>("RESTORING_SESSION");
  const [restauracionIntento, setRestauracionIntento] = useState(0);
  const [splashListoParaOcultar, setSplashListoParaOcultar] = useState(false);
  const [cargaSesionReactLista, setCargaSesionReactLista] = useState(false);
  const [resultadoArranquePendiente, setResultadoArranquePendiente] =
    useState<EstadoArranqueResuelto | null>(null);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  const [actividadSeleccionada, setActividadSeleccionada] = useState<
    string | null
  >(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [semanaClasesOffset, setSemanaClasesOffset] = useState(0);
  const [hoyCalendarioClasesKey, setHoyCalendarioClasesKey] = useState(() =>
    crearFechaKeyLocal(normalizarFechaLocal(new Date())),
  );
  const [diaAgendaEntrenadorSeleccionado, setDiaAgendaEntrenadorSeleccionado] =
    useState<string | null>(null);
  const [semanaAgendaEntrenadorOffset, setSemanaAgendaEntrenadorOffset] =
    useState(0);
  const [claseEntrenadorSeleccionadaId, setClaseEntrenadorSeleccionadaId] =
    useState<number | null>(null);
  const [busquedaReservasAdmin, setBusquedaReservasAdmin] = useState("");
  const [filtroReservasAdmin, setFiltroReservasAdmin] =
    useState<AdminReservationFilter>("ACTIVAS");
  const [sesionReservaAdminSeleccionadaId, setSesionReservaAdminSeleccionadaId] =
    useState<number | null>(null);
  const [reservaConfirmada, setReservaConfirmada] = useState<any>(null);
  const [claseClienteSeleccionadaId, setClaseClienteSeleccionadaId] = useState<
    number | null
  >(null);
  const [modoReservasCliente, setModoReservasCliente] =
    useState<ModoReservasCliente>("PROXIMAS");
  const [reservaCancelacionPendiente, setReservaCancelacionPendiente] =
    useState<any | null>(null);
  const [reservaCanceladaFeedback, setReservaCanceladaFeedback] =
    useState<any | null>(null);
  const [confirmarLogoutCliente, setConfirmarLogoutCliente] = useState(false);
  const [modoPerfilCliente, setModoPerfilCliente] =
    useState<ModoPerfilCliente>("RESUMEN");
  const [perfilNombreForm, setPerfilNombreForm] = useState("");
  const [perfilEmailForm, setPerfilEmailForm] = useState("");
  const [passwordActualCuenta, setPasswordActualCuenta] = useState("");
  const [passwordNuevaCuenta, setPasswordNuevaCuenta] = useState("");
  const [passwordConfirmacionCuenta, setPasswordConfirmacionCuenta] =
    useState("");
  const [mostrarPasswordActualCuenta, setMostrarPasswordActualCuenta] =
    useState(false);
  const [mostrarPasswordNuevaCuenta, setMostrarPasswordNuevaCuenta] =
    useState(false);
  const [
    mostrarPasswordConfirmacionCuenta,
    setMostrarPasswordConfirmacionCuenta,
  ] = useState(false);
  const [guardandoPerfilCliente, setGuardandoPerfilCliente] = useState(false);
  const [guardandoPasswordCliente, setGuardandoPasswordCliente] =
    useState(false);
  const [feedbackCuentaCliente, setFeedbackCuentaCliente] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);
  const [reservaEnProcesoId, setReservaEnProcesoId] = useState<number | null>(
    null,
  );
  const [cancelandoReservaId, setCancelandoReservaId] = useState<number | null>(
    null,
  );
  const [errorReservaCliente, setErrorReservaCliente] = useState("");

  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<
    number | null
  >(null);
  const [clienteAdminSeleccionadoId, setClienteAdminSeleccionadoId] = useState<
    number | null
  >(null);
  const [entrenadorAdminSeleccionadoId, setEntrenadorAdminSeleccionadoId] =
    useState<number | null>(null);
  const [entrenadorSeleccionadoId, setEntrenadorSeleccionadoId] = useState<
    number | null
  >(null);

  const [gimnasios, setGimnasios] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [errorPagos, setErrorPagos] = useState("");

  const [, setNombreGimnasio] = useState("");
  const [, setTextoBienvenidaGimnasio] = useState("");
  const [, setColorPrimarioGimnasio] = useState("#E33B3B");
  const [, setColorSecundarioGimnasio] =
    useState("#0B6DAE");
  const [guardandoConfiguracionGimnasio, setGuardandoConfiguracionGimnasio] =
    useState(false);

  const [nombreClase, setNombreClase] = useState("");
  const [descripcionClase, setDescripcionClase] = useState("");
  const [imagenClaseUrl, setImagenClaseUrl] = useState("");
  const [modoClasesAdmin, setModoClasesAdmin] =
    useState<ModoClasesAdmin>("CREADAS");
  const [grupoClaseEditandoKey, setGrupoClaseEditandoKey] = useState<
    string | null
  >(null);
  const [grupoClaseAdminSeleccionado, setGrupoClaseAdminSeleccionado] =
    useState<string | null>(null);
  const [diasClaseSeleccionados, setDiasClaseSeleccionados] = useState<number[]>([
    1,
  ]);
  const [horaClaseNueva, setHoraClaseNueva] = useState("18:00");
  const [horasClase, setHorasClase] = useState(["18:00"]);
  const [duracionClase, setDuracionClase] = useState("45");
  const [capacidadClase, setCapacidadClase] = useState("20");
  const [entrenadorClaseId, setEntrenadorClaseId] = useState<number | null>(
    null,
  );
  const [busquedaClasesAdmin, setBusquedaClasesAdmin] = useState("");
  const [guardandoClaseAdmin, setGuardandoClaseAdmin] = useState(false);

  const [rolUsuario, setRolUsuario] = useState<RolNuevoUsuario>("CLIENTE");
  const [origenAltaUsuario, setOrigenAltaUsuario] = useState<
    Exclude<SeccionAdmin, "CREAR_USUARIO">
  >("INICIO");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState<string | null>(null);
  const [selectorFotoPerfilVisible, setSelectorFotoPerfilVisible] = useState(false);
  const [selectorFotoPerfilTieneFoto, setSelectorFotoPerfilTieneFoto] = useState(false);
  const [selectorFotoPerfilOcupado, setSelectorFotoPerfilOcupado] = useState(false);
  const selectorFotoPerfilResolverRef = useRef<
    ((selection: ProfilePhotoSelection) => void) | null
  >(null);
  const selectorFotoPerfilAccionRef = useRef(false);
  const [rutinasEntrenador, setRutinasEntrenador] = useState<RutinaApp[]>([]);
  const [ejerciciosDisponiblesRutina, setEjerciciosDisponiblesRutina] =
    useState<EjercicioApp[]>([]);
  const [asignacionesRutinaEntrenador, setAsignacionesRutinaEntrenador] =
    useState<RutinaAsignadaApp[]>([]);
  const [rutinasClienteAsignadas, setRutinasClienteAsignadas] = useState<
    RutinaAsignadaApp[]
  >([]);
  const [modoRutinasEntrenador, setModoRutinasEntrenador] =
    useState<ModoRutinasEntrenador>("LISTA");
  const [rutinasGestionRol, setRutinasGestionRol] = useState<
    "ADMIN" | "ENTRENADOR" | null
  >(null);
  const [modoRutinasCliente, setModoRutinasCliente] =
    useState<ModoRutinasCliente>("LISTA");
  const [oneRmPesoInput, setOneRmPesoInput] = useState("");
  const [oneRmRepeticionesInput, setOneRmRepeticionesInput] = useState("");
  const [oneRmMostrarErrores, setOneRmMostrarErrores] = useState(false);
  const [oneRmResultado, setOneRmResultado] =
    useState<OneRepMaxResult | null>(null);
  const [rutinaEntrenadorSeleccionadaId, setRutinaEntrenadorSeleccionadaId] =
    useState<number | null>(null);
  const [rutinaClienteSeleccionadaId, setRutinaClienteSeleccionadaId] =
    useState<number | null>(null);
  const [busquedaRutinasEntrenador, setBusquedaRutinasEntrenador] =
    useState("");
  const [filtroNivelRutinasEntrenador, setFiltroNivelRutinasEntrenador] =
    useState("TODAS");
  const [busquedaAlumnosRutina, setBusquedaAlumnosRutina] = useState("");
  const [alumnosRutinaSeleccionadosIds, setAlumnosRutinaSeleccionadosIds] =
    useState<number[]>([]);
  const [cargandoRutinasEntrenador, setCargandoRutinasEntrenador] =
    useState(false);
  const [cargandoRutinasCliente, setCargandoRutinasCliente] = useState(false);
  const [guardandoRutinaEntrenador, setGuardandoRutinaEntrenador] =
    useState(false);
  const [errorRutinasEntrenador, setErrorRutinasEntrenador] = useState("");
  const [errorRutinasCliente, setErrorRutinasCliente] = useState("");
  const [feedbackRutinasEntrenador, setFeedbackRutinasEntrenador] =
    useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [rutinaFormNombre, setRutinaFormNombre] = useState("");
  const [rutinaFormDescripcion, setRutinaFormDescripcion] = useState("");
  const [rutinaFormNivel, setRutinaFormNivel] = useState("");
  const [rutinaFormDuracion, setRutinaFormDuracion] = useState("");
  const [ejercicioRutinaEditandoId, setEjercicioRutinaEditandoId] =
    useState<number | null>(null);
  const [ejercicioFormNombre, setEjercicioFormNombre] = useState("");
  const [ejercicioFormDescripcion, setEjercicioFormDescripcion] = useState("");
  const [ejercicioFormTipoMultimedia, setEjercicioFormTipoMultimedia] =
    useState<TipoMultimediaEjercicio>("NINGUNO");
  const [ejercicioFormMultimediaUrl, setEjercicioFormMultimediaUrl] =
    useState("");
  const [ejercicioFormMultimediaLocalUri, setEjercicioFormMultimediaLocalUri] =
    useState("");
  const [ejercicioFormMultimediaNombre, setEjercicioFormMultimediaNombre] =
    useState("");
  const [ejercicioFormSeries, setEjercicioFormSeries] = useState("");
  const [ejercicioFormRepeticiones, setEjercicioFormRepeticiones] =
    useState("");
  const [ejercicioFormDescanso, setEjercicioFormDescanso] = useState("");
  const [ejercicioFormPeso, setEjercicioFormPeso] = useState("");
  const [ejercicioFormNotas, setEjercicioFormNotas] = useState("");
  const [mostrarFormularioEjercicioRutina, setMostrarFormularioEjercicioRutina] =
    useState(false);
  const [ejercicioFormSnapshot, setEjercicioFormSnapshot] =
    useState<EjercicioRutinaFormSnapshot>(crearSnapshotEjercicioRutinaVacio);
  const [mostrarErroresEjercicioRutina, setMostrarErroresEjercicioRutina] =
    useState(false);
  const [multimediaRutinaActiva, setMultimediaRutinaActiva] =
    useState<RutinaMultimediaActiva | null>(null);
  const [thumbnailsVideoRutina, setThumbnailsVideoRutina] = useState<
    Record<string, string>
  >({});
  const [thumbnailsVideoRutinaFallidos, setThumbnailsVideoRutinaFallidos] =
    useState<Record<string, boolean>>({});
  const [entrenamientoClienteIndice, setEntrenamientoClienteIndice] =
    useState(0);
  const [entrenamientoClienteCompletadosIds, setEntrenamientoClienteCompletadosIds] =
    useState<number[]>([]);
  const [tecladoVisible, setTecladoVisible] = useState(false);

  useEffect(() => {
    if (estadoArranque !== "AUTHENTICATED") {
      setTecladoVisible(false);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setTecladoVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setTecladoVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [estadoArranque]);

  useEffect(() => {
    const conservaConversacionSolicitada =
      rolSeleccionado === "ADMIN" &&
      seccionAdmin === "MENSAJES" &&
      mensajeSeleccionadoId !== null;

    if (!conservaConversacionSolicitada) {
      setMensajeSeleccionadoId(null);
    }
    setModoMensajesUsuario("BANDEJA");
    setRespuestaMensaje("");
    // La selección se evalúa solo al cambiar de área, no al abrir/cerrar un hilo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolSeleccionado, seccionAdmin, seccionCliente, seccionEntrenador]);

  useEffect(() => {
    if (rolSeleccionado === "ADMIN" && seccionAdmin === "MENSAJES") {
      setBuzonMensajes("ENVIADOS");
      return;
    }

    if (
      (rolSeleccionado === "CLIENTE" && seccionCliente === "MENSAJES") ||
      (rolSeleccionado === "ENTRENADOR" && seccionEntrenador === "MENSAJES")
    ) {
      setBuzonMensajes("RECIBIDOS");
    }
  }, [rolSeleccionado, seccionAdmin, seccionCliente, seccionEntrenador]);

  useEffect(() => {
    if (rolSeleccionado === "CLIENTE" && seccionCliente === "MENSAJES") {
      setBuzonMensajes("TODOS");
    }
  }, [rolSeleccionado, seccionCliente]);

  const obtenerTimestampMensaje = useCallback((fecha?: string | null) => {
    if (!fecha) {
      return Date.now();
    }

    const fechaParseada = new Date(fecha.includes("T") ? fecha : fecha.replace(" ", "T"));

    return Number.isNaN(fechaParseada.getTime())
      ? Date.now()
      : fechaParseada.getTime();
  }, []);

  const formatearFechaMensaje = useCallback((fecha?: string | null) => {
    if (!fecha) {
      return "Hoy";
    }

    const fechaParseada = new Date(fecha);

    if (Number.isNaN(fechaParseada.getTime())) {
      return fecha;
    }

    return fechaParseada.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const obtenerEtiquetaAudiencia = useCallback((
    audiencia: AudienciaMensaje,
    destinatariosCount = 0,
  ) => {
    if (audiencia === "CLIENTES") {
      return "Clientes";
    }

    if (audiencia === "ENTRENADORES") {
      return "Entrenadores";
    }

    if (audiencia === "INDIVIDUAL") {
      return destinatariosCount === 1
        ? "1 destinatario"
        : `${destinatariosCount} destinatarios`;
    }

    return "Todos";
  }, []);

  const obtenerConfigPrioridadMensaje = useCallback((
    prioridad?: PrioridadMensajeApp,
  ) => {
    if (prioridad === "URGENTE") {
      return {
        label: "Urgente",
        icon: "alert-octagon-outline" as IconName,
        color: "#EF4444",
        background: "#FEF2F2",
      };
    }

    if (prioridad === "IMPORTANTE") {
      return {
        label: "Importante",
        icon: "alert-circle-outline" as IconName,
        color: "#D9E1EA",
        background: "#111722",
      };
    }

    return {
      label: "Normal",
      icon: "check-circle-outline" as IconName,
      color: "#64748B",
      background: "#F8FAFC",
    };
  }, []);
  const obtenerPesoPrioridadMensaje = useCallback((
    prioridad?: PrioridadMensajeApp,
  ) => {
    if (prioridad === "URGENTE") {
      return 2;
    }

    if (prioridad === "IMPORTANTE") {
      return 1;
    }

    return 0;
  }, []);

  const mapearMensajeBackend = useCallback((mensaje: MessageApiResponse): MensajeApp => {
    const tipoProgramacion = (mensaje.tipoProgramacion ||
      "AHORA") as TipoProgramacionMensajeApp;
    const estado = (mensaje.estado || "ENVIADO") as EstadoMensajeApp;
    const fechaBase =
      mensaje.fechaProgramada || mensaje.fechaEnvio || mensaje.fechaCreacion;

    return {
      id: String(mensaje.id),
      asunto: limpiarAsuntoConversacion(mensaje.asunto),
      texto: mensaje.texto || "",
      automatico: Boolean(mensaje.automatico),
      conversacionId: mensaje.conversacionId ?? undefined,
      mensajePadreId: mensaje.mensajePadreId ?? undefined,
      audiencia: (mensaje.audiencia || "TODOS") as AudienciaMensaje,
      fecha: formatearFechaMensaje(fechaBase),
      fechaOrden: obtenerTimestampMensaje(fechaBase),
      fechaProgramada: mensaje.fechaProgramada ?? undefined,
      frecuencia: (mensaje.frecuencia || "NINGUNA") as FrecuenciaMensajeApp,
      prioridad: (mensaje.prioridad || "NORMAL") as PrioridadMensajeApp,
      tipoProgramacion,
      estado,
      leido: estado !== "ENVIADO" || Boolean(mensaje.leidoPorMi),
      remitente:
        mensaje.nombreRemitente || mensaje.nombreGimnasio || "Administración",
      remitenteId: mensaje.remitenteId ?? undefined,
      destinatarioIds: mensaje.destinatarioIds || mensaje.interlocutorIds || [],
      leidoPorUsuarioIds: mensaje.leidoPorUsuarioIds || [],
      destinatariosCount: mensaje.destinatariosCount || 0,
      segmentoLabel: obtenerEtiquetaAudiencia(
        (mensaje.audiencia || "TODOS") as AudienciaMensaje,
        mensaje.destinatariosCount || 0,
      ),
    };
  }, [formatearFechaMensaje, obtenerEtiquetaAudiencia, obtenerTimestampMensaje]);

  const aplicarUsuarioAutenticado = useCallback((usuario: AuthSessionUser) => {
    setUsuarioLogueado(usuario);
    setUsuarios((usuariosActuales) => {
      const usuarioExistente = usuariosActuales.some(
        (usuarioActual) => usuarioActual.id === usuario.id,
      );

      if (!usuarioExistente) {
        return [...usuariosActuales, usuario];
      }

      return usuariosActuales.map((usuarioActual) =>
        usuarioActual.id === usuario.id
          ? { ...usuarioActual, ...usuario }
          : usuarioActual,
      );
    });
    setRolSeleccionado(usuario.rol);

    if (usuario.rol === "CLIENTE") {
      setClienteSeleccionadoId(usuario.id);
      setSeccionCliente("PANEL");
    } else if (usuario.rol === "ENTRENADOR") {
      setEntrenadorSeleccionadoId(usuario.id);
      setSeccionEntrenador("PANEL");
    } else {
      setSeccionAdmin("INICIO");
    }
  }, []);

  useEffect(() => {
    if (!SECCIONES_ADMIN_VALIDAS.has(seccionAdmin)) {
      setSeccionAdmin("INICIO");
    }
    if (!SECCIONES_CLIENTE_VALIDAS.has(seccionCliente)) {
      setSeccionCliente("PANEL");
    }
    if (!SECCIONES_ENTRENADOR_VALIDAS.has(seccionEntrenador)) {
      setSeccionEntrenador("PANEL");
    }
  }, [seccionAdmin, seccionCliente, seccionEntrenador]);

  const cargarDatos = useCallback(async (
    mostrarPantallaCarga = true,
    propagarError = false,
  ) => {
    const sesionVersion = sesionVersionRef.current;

    try {
      if (mostrarPantallaCarga) {
        setCargando(true);
      }
      setError("");

      const datos = await obtenerDashboardData();

      if (sesionVersion !== sesionVersionRef.current) {
        return false;
      }

      setGimnasios(datos.gimnasios);
      setUsuarios(datos.usuarios);
      setClases(datos.clases);
      setReservas(datos.reservas);
      setMensajesCreados(
        (datos.mensajes || []).map((mensaje: MessageApiResponse) =>
          mapearMensajeBackend(mensaje),
        ),
      );
      setErrorCargaMensajes("");
      setFeedbackMensajesCliente((feedbackActual) =>
        feedbackActual?.reintentar ? null : feedbackActual,
      );

      const gimnasioPrincipal = datos.gimnasios[0];

      if (gimnasioPrincipal) {
        setNombreGimnasio(gimnasioPrincipal.nombre || "");
        setTextoBienvenidaGimnasio(gimnasioPrincipal.textoBienvenida || "");
        setColorPrimarioGimnasio(gimnasioPrincipal.colorPrimario || "#E33B3B");
        setColorSecundarioGimnasio(
          gimnasioPrincipal.colorSecundario || "#0B6DAE",
        );
      }
      return true;
    } catch (dataError) {
      if (sesionVersion !== sesionVersionRef.current) {
        return false;
      }

      if (propagarError) {
        throw dataError;
      }

      if (dataError instanceof GymFlowApiError && dataError.status === 401) {
        cerrarSesionRef.current();
        setErrorLogin("Tu sesión ha caducado. Inicia sesión de nuevo.");
        return false;
      }

      if (
        dataError instanceof GymFlowApiError &&
        dataError.scope === "MESSAGES"
      ) {
        const mensaje = "No se pudieron cargar los mensajes.";
        setErrorCargaMensajes(mensaje);
        setFeedbackMensajesCliente({
          tipo: "error",
          texto: mensaje,
          reintentar: true,
        });
        return false;
      }

      console.error(dataError);
      setError("No se pudo conectar con el backend.");
      setErrorCargaMensajes("No se pudieron cargar los mensajes.");
      setFeedbackMensajesCliente({
        tipo: "error",
        texto: "No se pudieron cargar los mensajes.",
        reintentar: true,
      });
      return false;
    } finally {
      if (
        mostrarPantallaCarga &&
        sesionVersion === sesionVersionRef.current
      ) {
        setCargando(false);
      }
    }
  }, [mapearMensajeBackend]);

  const cargarPagosRol = useCallback(async () => {
    const sesionVersion = sesionVersionRef.current;

    if (
      !usuarioLogueado?.id ||
      (rolSeleccionado !== "ADMIN" && rolSeleccionado !== "CLIENTE")
    ) {
      setPagos([]);
      setErrorPagos("");
      setCargandoPagos(false);
      return;
    }

    setCargandoPagos(true);
    setErrorPagos("");

    try {
      const respuesta =
        rolSeleccionado === "ADMIN"
          ? await listarPagosApi()
          : await listarMisPagosApi();

      if (sesionVersion !== sesionVersionRef.current) {
        return;
      }

      setPagos(respuesta || []);
    } catch (paymentError) {
      if (sesionVersion !== sesionVersionRef.current) {
        return;
      }

      console.error(paymentError);
      setErrorPagos(
        paymentError instanceof Error
          ? paymentError.message
          : "No se pudieron cargar los pagos.",
      );
    } finally {
      if (sesionVersion === sesionVersionRef.current) {
        setCargandoPagos(false);
      }
    }
  }, [rolSeleccionado, usuarioLogueado?.id]);

  const cargarRutinasEntrenador = useCallback(async () => {
    const sesionVersion = sesionVersionRef.current;

    try {
      setCargandoRutinasEntrenador(true);
      setErrorRutinasEntrenador("");

      const [rutinasRespuesta, ejerciciosRespuesta] = await Promise.all([
        listarRutinasApi(),
        listarEjerciciosApi(),
      ]);

      if (sesionVersion !== sesionVersionRef.current) {
        return;
      }

      setRutinasEntrenador(rutinasRespuesta || []);
      setEjerciciosDisponiblesRutina(ejerciciosRespuesta || []);
    } catch (error) {
      if (sesionVersion !== sesionVersionRef.current) {
        return;
      }

      console.error(error);
      setErrorRutinasEntrenador(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las rutinas.",
      );
    } finally {
      if (sesionVersion === sesionVersionRef.current) {
        setCargandoRutinasEntrenador(false);
      }
    }
  }, []);

  const cargarRutinasCliente = useCallback(async () => {
    const sesionVersion = sesionVersionRef.current;

    try {
      setCargandoRutinasCliente(true);
      setErrorRutinasCliente("");

      const asignacionesRespuesta = await listarMisRutinasAsignadasApi();

      if (sesionVersion !== sesionVersionRef.current) {
        return;
      }

      setRutinasClienteAsignadas(asignacionesRespuesta || []);
    } catch (error) {
      if (sesionVersion !== sesionVersionRef.current) {
        return;
      }

      console.error(error);
      setErrorRutinasCliente(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar tus rutinas.",
      );
    } finally {
      if (sesionVersion === sesionVersionRef.current) {
        setCargandoRutinasCliente(false);
      }
    }
  }, []);

  const cargarDetalleRutinaEntrenador = useCallback(
    async (rutinaId: number, modo: ModoRutinasEntrenador = "DETALLE") => {
      const sesionVersion = sesionVersionRef.current;

      try {
        setCargandoRutinasEntrenador(true);
        setErrorRutinasEntrenador("");

        const [rutinaRespuesta, asignacionesRespuesta] = await Promise.all([
          consultarRutinaApi(rutinaId),
          listarAsignacionesRutinaApi(rutinaId),
        ]);

        if (sesionVersion !== sesionVersionRef.current) {
          return;
        }

        setRutinasEntrenador((rutinasActuales) => {
          const existe = rutinasActuales.some(
            (rutinaActual) => rutinaActual.id === rutinaRespuesta.id,
          );

          if (!existe) {
            return [rutinaRespuesta, ...rutinasActuales];
          }

          return rutinasActuales.map((rutinaActual) =>
            rutinaActual.id === rutinaRespuesta.id ? rutinaRespuesta : rutinaActual,
          );
        });
        setAsignacionesRutinaEntrenador(asignacionesRespuesta || []);
        setRutinaEntrenadorSeleccionadaId(rutinaRespuesta.id);
        setModoRutinasEntrenador(modo);
      } catch (error) {
        if (sesionVersion !== sesionVersionRef.current) {
          return;
        }

        console.error(error);
        setErrorRutinasEntrenador(
          error instanceof Error
            ? error.message
            : "No se pudo abrir la rutina.",
        );
      } finally {
        if (sesionVersion === sesionVersionRef.current) {
          setCargandoRutinasEntrenador(false);
        }
      }
    },
    [],
  );

  const manejarCargaSesionLista = useCallback(() => {
    if (cargaSesionReactListaRef.current) {
      return;
    }

    cargaSesionReactListaRef.current = true;
    inicioCargaSesionVisibleRef.current = Date.now();
    setCargaSesionReactLista(true);
    setSplashListoParaOcultar(true);
  }, []);

  useEffect(() => {
    let cancelada = false;
    const sesionVersion = sesionVersionRef.current + 1;
    sesionVersionRef.current = sesionVersion;

    const restaurarSesion = async () => {
      setEstadoArranque("RESTORING_SESSION");
      setResultadoArranquePendiente(null);
      setErrorLogin(null);
      setError("");

      try {
        const token = await obtenerTokenSesion();

        if (cancelada || sesionVersion !== sesionVersionRef.current) {
          return;
        }

        if (!token) {
          setAuthToken(null);
          setResultadoArranquePendiente("UNAUTHENTICATED");
          return;
        }

        setAuthToken(token);
        const usuario = await obtenerSesionActualApi();
        await cargarDatos(false, true);

        if (cancelada || sesionVersion !== sesionVersionRef.current) {
          return;
        }

        aplicarUsuarioAutenticado(usuario);
        setResultadoArranquePendiente("AUTHENTICATED");
      } catch (sessionError) {
        if (cancelada || sesionVersion !== sesionVersionRef.current) {
          return;
        }

        if (
          sessionError instanceof GymFlowApiError &&
          sessionError.status === 401
        ) {
          setAuthToken(null);
          await eliminarTokenSesion().catch(() => undefined);
          setResultadoArranquePendiente("UNAUTHENTICATED");
          return;
        }

        setResultadoArranquePendiente("TEMPORARY_ERROR");
      }
    };

    void restaurarSesion();

    return () => {
      cancelada = true;
    };
  }, [aplicarUsuarioAutenticado, cargarDatos, restauracionIntento]);

  useEffect(() => {
    if (splashListoParaOcultar) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [splashListoParaOcultar]);

  useEffect(() => {
    if (!cargaSesionReactLista || !resultadoArranquePendiente) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const completarRestauracion = () => {
      setEstadoArranque(resultadoArranquePendiente);
      setResultadoArranquePendiente(null);
      esPrimerArranqueRef.current = false;
    };

    if (!esPrimerArranqueRef.current) {
      completarRestauracion();
      return;
    }

    const inicioVisible = inicioCargaSesionVisibleRef.current ?? Date.now();
    const tiempoVisible = Date.now() - inicioVisible;
    const esperaRestante = Math.max(0, COLD_START_LOADING_MIN_MS - tiempoVisible);

    if (esperaRestante === 0) {
      completarRestauracion();
      return;
    }

    timeout = setTimeout(completarRestauracion, esperaRestante);
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [cargaSesionReactLista, resultadoArranquePendiente]);

  useEffect(() => {
    cargarPagosRol();
  }, [cargarPagosRol]);

  useEffect(() => {
    const contextoRutinas =
      rolSeleccionado === "ENTRENADOR" && seccionEntrenador === "RUTINAS"
        ? "ENTRENADOR"
        : rolSeleccionado === "ADMIN" &&
            (seccionAdmin === "INICIO" ||
              seccionAdmin === "ENTRENADORES" ||
              seccionAdmin === "RUTINAS")
          ? "ADMIN"
          : null;

    if (!contextoRutinas) {
      return;
    }

    if (rutinasGestionRol !== contextoRutinas) {
      setRutinasEntrenador([]);
      setEjerciciosDisponiblesRutina([]);
      setAsignacionesRutinaEntrenador([]);
      setRutinaEntrenadorSeleccionadaId(null);
      setModoRutinasEntrenador("LISTA");
      setRutinasGestionRol(contextoRutinas);
      return;
    }

    cargarRutinasEntrenador();
  }, [
    cargarRutinasEntrenador,
    rolSeleccionado,
    rutinasGestionRol,
    seccionAdmin,
    seccionEntrenador,
  ]);

  useEffect(() => {
    if (
      rolSeleccionado !== "CLIENTE" ||
      (seccionCliente !== "PANEL" && seccionCliente !== "RUTINAS")
    ) {
      return;
    }

    cargarRutinasCliente();
  }, [cargarRutinasCliente, rolSeleccionado, seccionCliente]);

  useEffect(() => {
    if (seccionCliente === "CLASES") {
      setSemanaClasesOffset(0);
      setDiaSeleccionado(crearFechaKeyLocal(normalizarFechaLocal(new Date())));
    }
  }, [seccionCliente]);

  useEffect(() => {
    let cambioDiaTimeout: ReturnType<typeof setTimeout> | null = null;

    const sincronizarHoy = () => {
      const siguienteHoy = crearFechaKeyLocal(normalizarFechaLocal(new Date()));
      setHoyCalendarioClasesKey((actual) =>
        actual === siguienteHoy ? actual : siguienteHoy,
      );
    };

    const programarCambioDeDia = () => {
      if (cambioDiaTimeout) {
        clearTimeout(cambioDiaTimeout);
      }
      const ahora = new Date();
      const siguienteMedianoche = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() + 1,
        0,
        0,
        0,
        50,
      );
      cambioDiaTimeout = setTimeout(() => {
        sincronizarHoy();
        programarCambioDeDia();
      }, Math.max(1000, siguienteMedianoche.getTime() - ahora.getTime()));
    };

    const appStateSubscription = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        sincronizarHoy();
        programarCambioDeDia();
      }
    });
    programarCambioDeDia();

    return () => {
      appStateSubscription.remove();
      if (cambioDiaTimeout) {
        clearTimeout(cambioDiaTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const correccion = resolveClassCalendarSelectionAfterDayChange({
      role: "CLIENTE",
      selectedDay: diaSeleccionado,
      todayKey: hoyCalendarioClasesKey,
    });
    if (!correccion) {
      return;
    }
    setSemanaClasesOffset(correccion.weekOffset);
    setDiaSeleccionado(correccion.selectedDay);
  }, [diaSeleccionado, hoyCalendarioClasesKey]);

  useEffect(() => {
    const correccion = resolveClassCalendarSelectionAfterDayChange({
      role: "ENTRENADOR",
      selectedDay: diaAgendaEntrenadorSeleccionado,
      todayKey: hoyCalendarioClasesKey,
    });
    if (!correccion) {
      return;
    }
    setSemanaAgendaEntrenadorOffset(correccion.weekOffset);
    setDiaAgendaEntrenadorSeleccionado(correccion.selectedDay);
  }, [diaAgendaEntrenadorSeleccionado, hoyCalendarioClasesKey]);

  useEffect(() => {
    if (seccionEntrenador === "CLASES") {
      setSemanaAgendaEntrenadorOffset(0);
      setDiaAgendaEntrenadorSeleccionado(
        crearFechaKeyLocal(normalizarFechaLocal(new Date())),
      );
      setClaseEntrenadorSeleccionadaId(null);
    }
  }, [seccionEntrenador]);

  useEffect(() => {
    const gestionRutinasActiva =
      (rolSeleccionado === "ENTRENADOR" && seccionEntrenador === "RUTINAS") ||
      (rolSeleccionado === "ADMIN" && seccionAdmin === "RUTINAS");

    if (!gestionRutinasActiva) {
      setModoRutinasEntrenador("LISTA");
      setRutinaEntrenadorSeleccionadaId(null);
      setAsignacionesRutinaEntrenador([]);
      setFeedbackRutinasEntrenador(null);
      setMostrarFormularioEjercicioRutina(false);
      setEjercicioRutinaEditandoId(null);
      setAlumnosRutinaSeleccionadosIds([]);
      setBusquedaAlumnosRutina("");
      setBusquedaRutinasAdmin("");
      setFiltroRutinasAdmin("TODAS");
      setRutinaFormNombre("");
      setRutinaFormDescripcion("");
      setRutinaFormNivel("");
      setRutinaFormDuracion("");
      setEjercicioFormNombre("");
      setEjercicioFormDescripcion("");
      setEjercicioFormTipoMultimedia("NINGUNO");
      setEjercicioFormMultimediaUrl("");
      setEjercicioFormMultimediaLocalUri("");
      setEjercicioFormMultimediaNombre("");
      setEjercicioFormSeries("");
      setEjercicioFormRepeticiones("");
      setEjercicioFormDescanso("");
      setEjercicioFormPeso("");
      setEjercicioFormNotas("");
      setOneRmPesoInput("");
      setOneRmRepeticionesInput("");
      setOneRmMostrarErrores(false);
      setOneRmResultado(null);
    }
  }, [rolSeleccionado, seccionAdmin, seccionEntrenador]);

  useEffect(() => {
    if (rutinasGestionRol && rolSeleccionado !== rutinasGestionRol) {
      setRutinasGestionRol(null);
      setRutinasEntrenador([]);
      setEjerciciosDisponiblesRutina([]);
      setAsignacionesRutinaEntrenador([]);
    }
  }, [rolSeleccionado, rutinasGestionRol]);

  useEffect(() => {
    if (seccionCliente !== "PERFIL" && seccionEntrenador !== "PERFIL") {
      setModoPerfilCliente("RESUMEN");
      setFeedbackCuentaCliente(null);
    }
  }, [seccionCliente, seccionEntrenador]);

  useEffect(() => {
    if (seccionCliente !== "RUTINAS") {
      setModoRutinasCliente("LISTA");
      setRutinaClienteSeleccionadaId(null);
      setEntrenamientoClienteIndice(0);
      setEntrenamientoClienteCompletadosIds([]);
    }
  }, [seccionCliente]);

  useEffect(() => {
    const videoUris = rutinasClienteAsignadas
      .flatMap((asignacion) => asignacion.rutina?.ejercicios || [])
      .filter((item) => item.ejercicio?.tipoMultimedia === "VIDEO")
      .map((item) => resolverUrlMedia(item.ejercicio?.multimediaUrl))
      .filter(Boolean) as string[];

    const urisPendientes = Array.from(new Set(videoUris)).filter(
      (uri) => !thumbnailsVideoRutina[uri] && !thumbnailsVideoRutinaFallidos[uri],
    );

    if (urisPendientes.length === 0) {
      return;
    }

    let cancelado = false;

    urisPendientes.forEach(async (uri) => {
      try {
        const thumbnail = await VideoThumbnails.getThumbnailAsync(uri, {
          time: 1000,
        });

        if (!cancelado && thumbnail.uri) {
          setThumbnailsVideoRutina((actuales) => ({
            ...actuales,
            [uri]: thumbnail.uri,
          }));
        }
      } catch (error) {
        console.warn("No se pudo generar thumbnail de video", error);
        if (!cancelado) {
          setThumbnailsVideoRutinaFallidos((actuales) => ({
            ...actuales,
            [uri]: true,
          }));
        }
      }
    });

    return () => {
      cancelado = true;
    };
  }, [
    rutinasClienteAsignadas,
    thumbnailsVideoRutina,
    thumbnailsVideoRutinaFallidos,
  ]);

  useEffect(() => {
    if (
      rolSeleccionado !== "CLIENTE" ||
      seccionCliente !== "RUTINAS" ||
      modoRutinasCliente !== "ENTRENAMIENTO"
    ) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmarSalidaEntrenamientoCliente();
      return true;
    });

    return () => subscription.remove();
  }, [
    entrenamientoClienteCompletadosIds.length,
    modoRutinasCliente,
    rolSeleccionado,
    seccionCliente,
  ]);

  const obtenerGimnasioActivo = () => {
    if (usuarioLogueado?.gimnasioId) {
      return (
        gimnasios.find(
          (gimnasio) => gimnasio.id === usuarioLogueado.gimnasioId,
        ) || gimnasios[0]
      );
    }

    return gimnasios[0];
  };

  const usuarioActivo = usuarioLogueado
    ? {
        ...usuarioLogueado,
        ...(usuarios.find((usuario) => usuario.id === usuarioLogueado.id) ||
          {}),
      }
    : null;

  const activarSesionAutenticada = useCallback(async (usuario: AuthLoginResponse) => {
    await guardarTokenSesion(usuario.token);
    setAuthToken(usuario.token);
    const sesionVersion = sesionVersionRef.current + 1;
    sesionVersionRef.current = sesionVersion;
    await cargarDatos(false, true);

    if (sesionVersion !== sesionVersionRef.current) {
      return;
    }

    aplicarUsuarioAutenticado(usuario);
    setEstadoArranque("AUTHENTICATED");
  }, [aplicarUsuarioAutenticado, cargarDatos]);

  useEffect(() => subscribeAuthenticatedSession(async (usuario) => {
    setIniciandoSesion(true);
    setErrorLogin(null);
    try {
      await activarSesionAutenticada(usuario);
    } catch {
      setEstadoArranque("TEMPORARY_ERROR");
    } finally {
      setIniciandoSesion(false);
    }
  }), [activarSesionAutenticada]);

  const iniciarSesion = async ({
    email,
    password,
  }: GymFlowLoginCredentials) => {
    if (iniciandoSesion) {
      return;
    }

    setIniciandoSesion(true);
    setErrorLogin(null);
    let tokenPersistido = false;

    try {
      const usuario = await loginApi({
        email,
        password,
      });

      tokenPersistido = true;
      await activarSesionAutenticada(usuario);
    } catch (loginError) {
      if (tokenPersistido) {
        setEstadoArranque("TEMPORARY_ERROR");
        return;
      }

      if (loginError instanceof GymFlowApiError && loginError.status === 401) {
        setErrorLogin("El email o la contraseña no son correctos.");
      } else if (
        loginError instanceof GymFlowApiError &&
        (loginError.kind === "NETWORK" ||
          loginError.kind === "TIMEOUT" ||
          (loginError.status !== undefined && loginError.status >= 500))
      ) {
        setErrorLogin("No podemos conectar con GymFlow. Revisa tu conexión e inténtalo de nuevo.");
      } else {
        setErrorLogin("No se pudo iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      setIniciandoSesion(false);
    }
  };

  const cerrarSesion = useCallback(() => {
    sesionVersionRef.current += 1;
    setAuthToken(null);
    setUsuarioLogueado(null);
    setEstadoArranque("UNAUTHENTICATED");
    setErrorLogin(null);
    void eliminarTokenSesion().catch(() => undefined);
    setModoPerfilCliente("RESUMEN");
    setFeedbackCuentaCliente(null);
    setPerfilNombreForm("");
    setPerfilEmailForm("");
    setPasswordActualCuenta("");
    setPasswordNuevaCuenta("");
    setPasswordConfirmacionCuenta("");
    setPagos([]);
    setErrorPagos("");
    setCargandoPagos(false);
    setCargando(false);
    setErrorCargaMensajes("");
    setRolSeleccionado("SELECTOR");
    setClienteSeleccionadoId(null);
    setEntrenadorSeleccionadoId(null);
    setGimnasios([]);
    setUsuarios([]);
    setClases([]);
    setReservas([]);
    setMensajesCreados([]);
    setMensajesLeidosIds([]);
    setMensajeSeleccionadoId(null);
    setRutinasEntrenador([]);
    setEjerciciosDisponiblesRutina([]);
    setAsignacionesRutinaEntrenador([]);
    setRutinasClienteAsignadas([]);
    setClienteAdminSeleccionadoId(null);
    setEntrenadorAdminSeleccionadoId(null);
    setClaseEntrenadorSeleccionadaId(null);
    setRutinaEntrenadorSeleccionadaId(null);
    setRutinaClienteSeleccionadaId(null);
    setSeccionAdmin("INICIO");
    setSeccionCliente("PANEL");
    setSeccionEntrenador("PANEL");
  }, []);

  useEffect(() => {
    cerrarSesionRef.current = cerrarSesion;
  }, [cerrarSesion]);

  useEffect(
    () =>
      subscribeSessionExpired(() => {
        cerrarSesionRef.current();
        setErrorLogin("Tu sesión ha caducado. Inicia sesión de nuevo.");
      }),
    [],
  );

  const seleccionarYSubirImagen = async (
    clave: string,
    aspect: [number, number],
    finalidad: FinalidadArchivo,
  ) => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso necesario",
          "Permite el acceso a tus fotos para elegir una imagen.",
        );
        return null;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect,
        quality: 0.82,
      });

      if (resultado.canceled || !resultado.assets[0]) {
        return null;
      }

      const imagen = resultado.assets[0];
      setSubiendoImagen(clave);

      const subida = await subirImagenApi(
        imagen.uri,
        finalidad,
        imagen.mimeType || "image/jpeg",
        imagen.fileName || `gymflow-${Date.now()}.jpg`,
      );

      return subida.url;
    } catch (error) {
      console.error(error);
      Alert.alert(
        "No se pudo subir la imagen",
        "Prueba con una imagen JPG, PNG o WebP de menos de 8 MB.",
      );
      return null;
    } finally {
      setSubiendoImagen(null);
    }
  };

  const solicitarFotoPerfil = (tieneFoto: boolean) =>
    new Promise<ProfilePhotoSelection>((resolve) => {
      selectorFotoPerfilResolverRef.current?.(null);
      selectorFotoPerfilResolverRef.current = resolve;
      selectorFotoPerfilAccionRef.current = false;
      setSelectorFotoPerfilTieneFoto(tieneFoto);
      setSelectorFotoPerfilOcupado(false);
      Keyboard.dismiss();
      setSelectorFotoPerfilVisible(true);
    });

  const resolverSelectorFotoPerfil = (selection: ProfilePhotoSelection) => {
    const resolve = selectorFotoPerfilResolverRef.current;
    selectorFotoPerfilResolverRef.current = null;
    selectorFotoPerfilAccionRef.current = false;
    setSelectorFotoPerfilOcupado(false);
    setSelectorFotoPerfilVisible(false);
    resolve?.(selection);
  };

  const abrirAjustesPermiso = () => {
    void Linking.openSettings().catch(() => {
      Alert.alert("No se pudieron abrir los ajustes", "Abre los ajustes del dispositivo para conceder el permiso.");
    });
  };

  const manejarOrigenFotoPerfil = async (source: "CAMERA" | "LIBRARY") => {
    if (selectorFotoPerfilAccionRef.current) return;
    selectorFotoPerfilAccionRef.current = true;
    setSelectorFotoPerfilOcupado(true);
    Keyboard.dismiss();

    try {
      const permiso =
        source === "CAMERA"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso necesario",
          source === "CAMERA"
            ? "Permite el acceso a la cámara para hacer una foto de perfil."
            : "Permite el acceso a tus fotos para elegir una imagen de perfil.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir ajustes", onPress: abrirAjustesPermiso },
          ],
        );
        return;
      }

      const resultado =
        source === "CAMERA"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.82,
              exif: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.82,
              exif: false,
            });

      if (!resultado.canceled && resultado.assets[0]) {
        resolverSelectorFotoPerfil({ type: "ASSET", asset: resultado.assets[0] });
      }
    } catch {
      Alert.alert("No se pudo abrir", "Inténtalo de nuevo o elige la otra opción.");
    } finally {
      selectorFotoPerfilAccionRef.current = false;
      setSelectorFotoPerfilOcupado(false);
    }
  };

  const seleccionarYSubirFotoPerfil = async (
    clave: string,
    tieneFoto: boolean,
    objetivoUsuarioId?: number,
  ): Promise<string | null> => {
    const seleccion = await solicitarFotoPerfil(tieneFoto);
    if (!seleccion) return null;
    if (seleccion.type === "REMOVE") return "";

    const imagen = seleccion.asset;
    setSubiendoImagen(clave);
    try {
      const subida = await subirImagenApi(
        imagen.uri,
        "FOTO_PERFIL",
        imagen.mimeType || "image/jpeg",
        imagen.fileName || `gymflow-perfil-${Date.now()}.jpg`,
        objetivoUsuarioId,
      );
      return subida.url;
    } catch (error) {
      Alert.alert(
        "No se pudo subir la foto",
        error instanceof Error ? error.message : "Prueba con otra imagen.",
      );
      return null;
    } finally {
      setSubiendoImagen(null);
    }
  };

  const seleccionarYSubirMultimediaRutina = async (
    origen: "galeria" | "camara",
  ) => {
    try {
      const permiso =
        origen === "camara"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso necesario",
          origen === "camara"
            ? "Permite el acceso a la cámara para capturar una foto o vídeo."
            : "Permite el acceso a tus archivos para elegir una foto o vídeo.",
        );
        return;
      }

      const resultado =
        origen === "camara"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images", "videos"],
              quality: 0.82,
              videoMaxDuration: 180,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images", "videos"],
              quality: 0.82,
              videoMaxDuration: 180,
            });

      if (resultado.canceled || !resultado.assets[0]) {
        return;
      }

      const archivo = resultado.assets[0];
      const tipoMultimedia: TipoMultimediaEjercicio =
        archivo.type === "video" ? "VIDEO" : "IMAGEN";
      const nombreArchivo =
        archivo.fileName ||
        `gymflow-ejercicio-${Date.now()}.${
          tipoMultimedia === "VIDEO" ? "mp4" : "jpg"
        }`;
      const mimeType =
        archivo.mimeType ||
        (tipoMultimedia === "VIDEO" ? "video/mp4" : "image/jpeg");

      setSubiendoImagen("rutina-ejercicio");
      setEjercicioFormMultimediaLocalUri(archivo.uri);
      setEjercicioFormMultimediaNombre(nombreArchivo);

      const subida = await subirMultimediaApi(
        archivo.uri,
        mimeType,
        nombreArchivo,
      );

      setEjercicioFormTipoMultimedia(subida.tipoMultimedia || tipoMultimedia);
      setEjercicioFormMultimediaUrl(subida.url);
      setEjercicioFormMultimediaNombre(nombreArchivo);
      setMostrarErroresEjercicioRutina(false);
      setFeedbackRutinasEntrenador({
        tipo: "success",
        texto:
          subida.tipoMultimedia === "VIDEO"
            ? "Vídeo añadido al ejercicio."
            : "Imagen añadida al ejercicio.",
      });
    } catch (error) {
      console.error(error);
      setEjercicioFormMultimediaLocalUri("");
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo subir la multimedia.",
      });
    } finally {
      setSubiendoImagen(null);
    }
  };

  const abrirSelectorMultimediaRutina = () => {
    Alert.alert("Añadir foto o vídeo", "Elige de dónde quieres tomar el archivo.", [
      {
        text: "Galería",
        onPress: () => seleccionarYSubirMultimediaRutina("galeria"),
      },
      {
        text: "Camara",
        onPress: () => seleccionarYSubirMultimediaRutina("camara"),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const eliminarMultimediaEjercicioRutina = () => {
    setEjercicioFormTipoMultimedia("NINGUNO");
    setEjercicioFormMultimediaUrl("");
    setEjercicioFormMultimediaLocalUri("");
    setEjercicioFormMultimediaNombre("");
    setMostrarErroresEjercicioRutina(false);
  };

  const cambiarFotoPerfil = async (usuarioObjetivo?: any) => {
    const usuarioDestino = usuarioObjetivo?.id ? usuarioObjetivo : usuarioActivo;

    if (!usuarioDestino?.id) {
      return;
    }
    if (
      (rolSeleccionado === "CLIENTE" && !clientesPuedenCambiarFotoPerfilApp) ||
      (rolSeleccionado === "ENTRENADOR" && !entrenadoresPuedenCambiarFotoPerfilApp)
    ) {
      Alert.alert(
        "Foto gestionada por el gimnasio",
        "La administración ha desactivado el cambio de foto para tu perfil.",
      );
      return;
    }

    const loadingKey =
      usuarioDestino.id === usuarioActivo?.id
        ? "perfil"
        : `perfil-${usuarioDestino.id}`;
    const url = await seleccionarYSubirFotoPerfil(
      loadingKey,
      Boolean(usuarioDestino.fotoPerfilUrl),
      usuarioDestino.id,
    );
    if (url === null) {
      return;
    }

    if (url === "") {
      const confirmado = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Eliminar foto",
          "El perfil volverá a mostrar las iniciales de la cuenta.",
          [
            { text: "Conservar foto", style: "cancel", onPress: () => resolve(false) },
            { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
          ],
        );
      });
      if (!confirmado) return;
    }

    setSubiendoImagen(loadingKey);
    try {
      const usuarioActualizado = await actualizarFotoPerfilApi(
        usuarioDestino.id,
        url,
      );

      if (usuarioLogueado?.id === usuarioActualizado.id) {
        setUsuarioLogueado((usuarioActual: any) => ({
          ...usuarioActual,
          ...usuarioActualizado,
        }));
      }

      setUsuarios((usuariosActuales) =>
        usuariosActuales.map((usuario) =>
          usuario.id === usuarioActualizado.id
            ? { ...usuario, ...usuarioActualizado }
            : usuario,
        ),
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        "No se pudo guardar la foto",
        "La imagen se subió, pero no se pudo asociar al perfil.",
      );
    } finally {
      setSubiendoImagen(null);
    }
  };

  const guardarConfiguracionGimnasio = async (
    updates: Partial<GymSettingsData>,
  ): Promise<GymSettingsData> => {
    const gimnasio = obtenerGimnasioActivo();

    if (!gimnasio) {
      throw new Error("No hay un gimnasio asociado a esta cuenta.");
    }

    const gimnasioActualizado = (await actualizarGimnasioApi(
      gimnasio.id,
      updates,
    )) as GymSettingsData;

    setGimnasios((gimnasiosActuales) =>
      gimnasiosActuales.map((gimnasioItem) =>
        gimnasioItem.id === gimnasioActualizado.id
          ? { ...gimnasioItem, ...gimnasioActualizado }
          : gimnasioItem,
      ),
    );
    setNombreGimnasio(gimnasioActualizado.nombre || "");
    setTextoBienvenidaGimnasio(gimnasioActualizado.textoBienvenida || "");
    setColorPrimarioGimnasio(gimnasioActualizado.colorPrimario || "#E33B3B");
    setColorSecundarioGimnasio(gimnasioActualizado.colorSecundario || "#0B6DAE");
    return gimnasioActualizado;
  };

  const actualizarPerfilAdministrador = async (datos: {
    nombre: string;
    email: string;
  }) => {
    const usuarioActualizado = await actualizarMiPerfilApi(datos);
    actualizarUsuarioEnEstado(usuarioActualizado);
    return usuarioActualizado;
  };

  const cambiarPasswordAdministrador = async (datos: {
    passwordActual: string;
    passwordNueva: string;
  }) => {
    const usuarioActualizado = await cambiarMiPasswordApi(datos);
    actualizarUsuarioEnEstado(usuarioActualizado);
    return usuarioActualizado;
  };

  const retirarFotoPerfilAdministrador = async () => {
    if (!usuarioActivo?.id) {
      throw new Error("No hay una cuenta administradora activa.");
    }
    const usuarioActualizado = await actualizarFotoPerfilApi(usuarioActivo.id, "");
    actualizarUsuarioEnEstado(usuarioActualizado);
  };

  const alternarDiaClase = (diaId: number) => {
    setDiasClaseSeleccionados((diasActuales) => {
      if (diasActuales.includes(diaId)) {
        return diasActuales.filter((dia) => dia !== diaId);
      }

      return [...diasActuales, diaId].sort((a, b) => a - b);
    });
  };

  const normalizarHoraClase = (hora: string) => {
    const limpia = hora.trim();

    if (!/^\d{1,2}:\d{2}$/.test(limpia)) {
      return null;
    }

    const [horas, minutos] = limpia.split(":").map(Number);

    if (horas > 23 || minutos > 59) {
      return null;
    }

    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
      2,
      "0",
    )}`;
  };

  const agregarHoraClase = () => {
    const hora = normalizarHoraClase(horaClaseNueva);

    if (!hora) {
      Alert.alert("Hora no válida", "Usa el formato HH:mm, por ejemplo 12:45.");
      return;
    }

    if (horasClase.includes(hora)) {
      Alert.alert("Hora duplicada", "Esa hora ya está añadida a la clase.");
      return;
    }

    setHorasClase((horasActuales) =>
      Array.from(new Set([...horasActuales, hora])).sort(),
    );
    setHoraClaseNueva(hora);
  };

  const quitarHoraClase = (hora: string) => {
    setHorasClase((horasActuales) =>
      horasActuales.filter((horaActual) => horaActual !== hora),
    );
  };

  const resetearFormularioClase = () => {
    setNombreClase("");
    setDescripcionClase("");
    setImagenClaseUrl("");
    setDiasClaseSeleccionados([1]);
    setHoraClaseNueva("18:00");
    setHorasClase(["18:00"]);
    setDuracionClase("45");
    setCapacidadClase("20");
    setGrupoClaseEditandoKey(null);
  };

  const prepararNuevaClase = () => {
    resetearFormularioClase();
    setEntrenadorClaseId(null);
    setGrupoClaseAdminSeleccionado(null);
    setModoClasesAdmin("CREAR");
  };

  const iniciarEdicionGrupoClase = (grupo: GrupoClase) => {
    const dias = Array.from(
      new Set(
        grupo.reglas.map((regla) => convertirDiaIsoAJs(regla.diaSemana)),
      ),
    ).sort((a, b) => convertirDiaJsAIso(a) - convertirDiaJsAIso(b));
    const horas = Array.from(
      new Set(
        grupo.reglas.map((regla) => regla.hora).filter(Boolean),
      ),
    ).sort();

    setNombreClase(grupo.nombre || "");
    setDescripcionClase(grupo.descripcion || "");
    setImagenClaseUrl(grupo.imagenUrl || "");
    setDiasClaseSeleccionados(dias.length > 0 ? dias : [1]);
    setHorasClase(horas.length > 0 ? horas : ["18:00"]);
    setHoraClaseNueva(horas[0] || "18:00");
    setDuracionClase(String(grupo.duracionMinutos || 45));
    setCapacidadClase(String(grupo.capacidadMaxima || 20));
    const entrenadorActivoSeleccionado =
      entrenadoresActivos.find((usuario) => usuario.id === grupo.entrenadorId) ||
      null;

    setEntrenadorClaseId(entrenadorActivoSeleccionado?.id || null);
    setGrupoClaseEditandoKey(grupo.key);
    setGrupoClaseAdminSeleccionado(null);
    setModoClasesAdmin("EDITAR");
  };

  const guardarCambiosClase = async () => {
    if (guardandoClaseAdmin) {
      return;
    }

    const gimnasio = obtenerGimnasioActivo();
    const grupo =
      gruposClasesActivas.find(
        (grupoClase) => grupoClase.key === grupoClaseEditandoKey,
      ) ||
      gruposClasesDesactivadas.find(
        (grupoClase) => grupoClase.key === grupoClaseEditandoKey,
      );
    const entrenador = entrenadoresActivos.find(
      (usuario) => usuario.id === entrenadorClaseId,
    );

    if (!gimnasio || !grupo) {
      Alert.alert("Clase no encontrada", "Vuelve al listado y abre la clase otra vez.");
      return;
    }

    if (!entrenador) {
      Alert.alert("Falta entrenador", "Selecciona el entrenador de la clase.");
      return;
    }

    if (!nombreClase.trim()) {
      Alert.alert("Nombre obligatorio", "Escribe el nombre de la clase.");
      return;
    }

    const duracion = Number(duracionClase);
    const capacidad = Number(capacidadClase);

    if (!Number.isFinite(duracion) || duracion <= 0) {
      Alert.alert(
        "Duración no válida",
        "Introduce una duración mayor que 0 minutos.",
      );
      return;
    }

    if (!Number.isFinite(capacidad) || capacidad <= 0) {
      Alert.alert(
        "Capacidad no válida",
        "Introduce una capacidad mayor que 0.",
      );
      return;
    }

    setGuardandoClaseAdmin(true);
    try {
      if (grupo.programacionId) {
        await actualizarProgramacionClaseApi(grupo.programacionId, {
          nombre: nombreClase.trim(),
          descripcion: descripcionClase,
          imagenUrl: imagenClaseUrl,
          duracionMinutos: duracion,
          capacidadMaxima: capacidad,
          entrenadorId: entrenador.id,
        });
        await cargarDatos(false);
        resetearFormularioClase();
        setGrupoClaseAdminSeleccionado(`programacion:${grupo.programacionId}`);
        setModoClasesAdmin("CREADAS");
        Alert.alert(
          "Clase actualizada",
          "Los cambios se aplicaron a las sesiones futuras sin alterar el historial.",
        );
        return;
      }

      const sesionesActualizadas = await Promise.all(
        grupo.sesiones.map((clase) =>
          actualizarClaseApi(clase.id, {
            nombre: nombreClase.trim(),
            descripcion: descripcionClase,
            imagenUrl: imagenClaseUrl,
            fechaHora: clase.fechaHora,
            duracionMinutos: duracion,
            capacidadMaxima: capacidad,
            gimnasioId: clase.gimnasioId || gimnasio.id,
            entrenadorId: entrenador.id,
          }),
        ),
      );
      const actualizadasPorId = new Map(
        sesionesActualizadas.map((clase) => [clase.id, clase]),
      );

      setClases((clasesActuales) =>
        clasesActuales.map(
          (clase) => actualizadasPorId.get(clase.id) || clase,
        ),
      );

      Alert.alert(
        "Clase actualizada",
        `${grupo.sesiones.length} horario(s) actualizados con ${entrenador.nombre}.`,
      );

      const grupoActualizadoKey = sesionesActualizadas[0]
        ? crearClaveGrupoClase(sesionesActualizadas[0])
        : null;
      resetearFormularioClase();
      setGrupoClaseAdminSeleccionado(grupoActualizadoKey);
      setModoClasesAdmin("CREADAS");
    } catch (error) {
      console.error(error);
      Alert.alert(
        "No se pudo actualizar",
        error instanceof GymFlowApiError && error.status === 409
          ? error.message
          : "Revisa los datos de la clase.",
      );
    } finally {
      setGuardandoClaseAdmin(false);
    }
  };

  const existeHoraEnGrupo = (
    grupo: GrupoClase,
    fechaKey: string,
    hora: string,
    claseIgnoradaId?: number,
  ) => {
    if (grupo.programacionId) {
      const diaIso = /^\d$/.test(fechaKey)
        ? Number(fechaKey)
        : convertirDiaJsAIso(new Date(`${fechaKey}T12:00:00`).getDay());
      return grupo.reglas.some(
        (regla) => regla.diaSemana === diaIso && regla.hora === hora,
      );
    }
    return grupo.sesiones.some(
      (clase) =>
        clase.id !== claseIgnoradaId &&
        obtenerFechaKey(clase.fechaHora) === fechaKey &&
        obtenerHora(clase.fechaHora) === hora,
    );
  };

  const agregarHoraAGrupoClase = async (
    grupo: GrupoClase,
    fechaKey: string | null,
    horaNueva: string,
  ) => {
    const hora = normalizarHoraClase(horaNueva);
    const gimnasio = obtenerGimnasioActivo();
    const sesionBase = grupo.sesiones[0];
    const entrenadorId = grupo.entrenadorId || sesionBase?.entrenadorId;

    if (!fechaKey) {
      Alert.alert("Día no seleccionado", "Selecciona un día para añadir la hora.");
      return false;
    }

    if (!hora) {
      Alert.alert("Hora no válida", "Usa el formato HH:mm, por ejemplo 12:45.");
      return false;
    }

    if (!gimnasio || !entrenadorId) {
      Alert.alert(
        "Faltan datos",
        "La clase necesita gimnasio y entrenador para añadir una hora.",
      );
      return false;
    }

    if (existeHoraEnGrupo(grupo, fechaKey, hora)) {
      Alert.alert("Hora duplicada", "Esa hora ya existe para el día seleccionado.");
      return false;
    }

    if (!grupo.programacionId) {
      Alert.alert(
        "Horario legacy",
        "Esta clase se conserva como sesión histórica. Crea una nueva programación semanal para añadir horarios recurrentes.",
      );
      return false;
    }

    try {
      const diaIso = /^\d$/.test(fechaKey)
        ? Number(fechaKey)
        : convertirDiaJsAIso(new Date(`${fechaKey}T12:00:00`).getDay());
      await actualizarProgramacionClaseApi(grupo.programacionId, {
        reglas: [...grupo.reglas, { diaSemana: diaIso, hora }],
      });
      await cargarDatos(false);
      Alert.alert("Hora añadida", `${hora} se repetirá semanalmente.`);
      return true;
    } catch (error) {
      console.error(error);
      Alert.alert("No se pudo añadir", "Revisa la hora de la clase.");
      return false;
    }
  };

  const actualizarHoraSesionClase = async (
    grupo: GrupoClase,
    regla: { diaSemana: number; hora: string },
    horaEditada: string,
  ) => {
    const hora = normalizarHoraClase(horaEditada);

    if (!hora) {
      Alert.alert("Hora no válida", "Usa el formato HH:mm, por ejemplo 12:45.");
      return false;
    }

    if (regla.hora === hora) {
      return true;
    }

    if (existeHoraEnGrupo(grupo, String(regla.diaSemana), hora)) {
      Alert.alert("Hora duplicada", "Esa hora ya existe para este día.");
      return false;
    }

    if (!grupo.programacionId) {
      Alert.alert(
        "Horario legacy",
        "Esta sesión histórica no tiene una programación semanal editable.",
      );
      return false;
    }

    try {
      const reglasActualizadas = grupo.reglas.map((reglaActual) =>
        reglaActual.diaSemana === regla.diaSemana &&
        reglaActual.hora === regla.hora
          ? { ...reglaActual, hora }
          : reglaActual,
      );
      await actualizarProgramacionClaseApi(grupo.programacionId, {
        reglas: reglasActualizadas,
      });
      await cargarDatos(false);
      Alert.alert("Hora actualizada", `La clase se repetirá a las ${hora}.`);
      return true;
    } catch (error) {
      console.error(error);
      Alert.alert("No se pudo actualizar", "Revisa la hora de la clase.");
      return false;
    }
  };

  const obtenerHorasBaseParaNuevoDia = (
    grupo: GrupoClase,
    horasReferenciaEntrada: string[],
    horaFallback: string,
  ) => {
    const horasReferencia = horasReferenciaEntrada
      .map(normalizarHoraClase)
      .filter((hora): hora is string => Boolean(hora));
    const horasGrupo = grupo.reglas.map((regla) => regla.hora).filter(Boolean);
    const horaNormalizada = normalizarHoraClase(horaFallback);

    return Array.from(
      new Set([
        ...horasReferencia,
        ...(horasReferencia.length === 0 ? horasGrupo : []),
        ...(horaNormalizada ? [horaNormalizada] : []),
      ]),
    ).sort();
  };

  const agregarDiaAGrupoClase = async (
    grupo: GrupoClase,
    diaSemana: number,
    horasReferencia: string[],
    horaFallback: string,
  ) => {
    const gimnasio = obtenerGimnasioActivo();
    const sesionBase = grupo.sesiones[0];
    const entrenadorId = grupo.entrenadorId || sesionBase?.entrenadorId;
    const horasNuevoDia = obtenerHorasBaseParaNuevoDia(
      grupo,
      horasReferencia,
      horaFallback,
    );
    const dia = DIAS_CLASE.find((item) => item.id === diaSemana);

    const diaIso = convertirDiaJsAIso(diaSemana);
    if (grupo.reglas.some((regla) => regla.diaSemana === diaIso)) {
      Alert.alert("Día duplicado", "Ese día ya forma parte del horario.");
      return false;
    }

    if (!gimnasio || !entrenadorId || !sesionBase) {
      Alert.alert(
        "Faltan datos",
        "La clase necesita gimnasio y entrenador para añadir un día.",
      );
      return false;
    }

    if (horasNuevoDia.length === 0) {
      Alert.alert("Falta hora", "Añade al menos una hora para crear el día.");
      return false;
    }

    if (!grupo.programacionId) {
      Alert.alert(
        "Horario legacy",
        "Esta clase se conserva como sesión histórica. Crea una nueva programación semanal para añadir días recurrentes.",
      );
      return false;
    }

    try {
      await actualizarProgramacionClaseApi(grupo.programacionId, {
        reglas: [
          ...grupo.reglas,
          ...horasNuevoDia.map((hora) => ({ diaSemana: diaIso, hora })),
        ],
      });
      await cargarDatos(false);
      Alert.alert(
        "Día añadido",
        `${dia?.nombre || "El día"} se repetirá cada semana con ${horasNuevoDia.length} hora(s).`,
      );
      return true;
    } catch (error) {
      console.error(error);
      Alert.alert("No se pudo añadir", "Revisa el día y las horas de la clase.");
      return false;
    }
  };

  const eliminarDiaGrupoClase = async (grupo: GrupoClase, fechaKey: string) => {
    if (!grupo.programacionId) {
      Alert.alert(
        "Horario legacy",
        "Esta sesión histórica no tiene una programación semanal editable.",
      );
      return;
    }

    if (grupo.programacionId) {
      const diaIso = /^\d$/.test(fechaKey)
        ? Number(fechaKey)
        : convertirDiaJsAIso(new Date(`${fechaKey}T12:00:00`).getDay());
      const nuevasReglas = grupo.reglas.filter(
        (regla) => regla.diaSemana !== diaIso,
      );
      if (nuevasReglas.length === 0) {
        Alert.alert(
          "Horario obligatorio",
          "Una programación activa debe conservar al menos un día y una hora.",
        );
        return;
      }
      Alert.alert(
        "Eliminar día semanal",
        "Las sesiones futuras sin reservas se desactivarán. Si hay reservas activas, la operación se bloqueará.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar día",
            style: "destructive",
            onPress: async () => {
              try {
                await actualizarProgramacionClaseApi(grupo.programacionId!, {
                  reglas: nuevasReglas,
                });
                await cargarDatos(false);
                Alert.alert("Día eliminado", "El horario semanal se ha actualizado.");
              } catch (error) {
                Alert.alert(
                  "No se pudo eliminar",
                  error instanceof Error
                    ? error.message
                    : "Revisa las reservas futuras de este horario.",
                );
              }
            },
          },
        ],
      );
      return;
    }

    const sesionesDelDia = obtenerSesionesDeDia(grupo.sesiones, fechaKey);

    if (sesionesDelDia.length === 0) {
      return;
    }

    Alert.alert(
      "Eliminar día",
      "Se desactivarán todas las horas de este día, pero se conservará el historial.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar día",
          style: "destructive",
          onPress: async () => {
            try {
              const sesionesActualizadas = await Promise.all(
                sesionesDelDia.map((clase) => desactivarClaseApi(clase.id)),
              );
              const actualizadasPorId = new Map(
                sesionesActualizadas.map((clase) => [clase.id, clase]),
              );

              setClases((clasesActuales) =>
                clasesActuales.map((clase) =>
                  actualizadasPorId.has(clase.id)
                    ? { ...clase, ...actualizadasPorId.get(clase.id), activa: false }
                    : clase,
                ),
              );

              Alert.alert("Día eliminado", "Las horas de ese día se han ocultado.");

              if (sesionesDelDia.length >= grupo.sesiones.length) {
                setGrupoClaseAdminSeleccionado(null);
                setModoClasesAdmin("DESACTIVADAS");
              }
            } catch (error) {
              console.error(error);
              Alert.alert(
                "No se pudo eliminar",
                "Ha ocurrido un error al eliminar el día.",
              );
            }
          },
        },
      ],
    );
  };

  const crearClase = async () => {
    if (guardandoClaseAdmin) {
      return;
    }

    const gimnasio = obtenerGimnasioActivo();

    const entrenadoresDisponibles = usuarioActivo?.gimnasioId
      ? usuarios.filter(
          (usuario) =>
            usuario.rol === "ENTRENADOR" &&
            usuario.gimnasioId === usuarioActivo.gimnasioId &&
            usuario.activo !== false,
        )
      : usuarios.filter(
          (usuario) => usuario.rol === "ENTRENADOR" && usuario.activo !== false,
        );

    const entrenador =
      entrenadoresDisponibles.find(
        (usuario) => usuario.id === entrenadorClaseId,
      ) || null;

    if (!gimnasio) {
      Alert.alert("Falta gimnasio", "Primero debe existir un gimnasio.");
      return;
    }

    if (!entrenador) {
      Alert.alert(
        "Falta entrenador",
        "Primero crea un usuario con rol ENTRENADOR.",
      );
      return;
    }

    if (!nombreClase.trim()) {
      Alert.alert("Nombre obligatorio", "Escribe el nombre de la clase.");
      return;
    }

    if (diasClaseSeleccionados.length === 0) {
      Alert.alert("Días obligatorios", "Selecciona al menos un día.");
      return;
    }

    if (horasClase.length === 0) {
      Alert.alert("Horas obligatorias", "Añade al menos una hora.");
      return;
    }

    const duracion = Number(duracionClase);
    const capacidad = Number(capacidadClase);

    if (!Number.isFinite(duracion) || duracion <= 0) {
      Alert.alert(
        "Duración no válida",
        "Introduce una duración mayor que 0 minutos.",
      );
      return;
    }

    if (!Number.isFinite(capacidad) || capacidad <= 0) {
      Alert.alert(
        "Capacidad no válida",
        "Introduce una capacidad mayor que 0.",
      );
      return;
    }

    setGuardandoClaseAdmin(true);
    try {
      const reglas = diasClaseSeleccionados.flatMap((dia) =>
        horasClase.map((hora) => ({
          diaSemana: convertirDiaJsAIso(dia),
          hora,
        })),
      );

      await crearProgramacionClaseApi({
        nombre: nombreClase,
        descripcion: descripcionClase,
        imagenUrl: imagenClaseUrl,
        duracionMinutos: duracion,
        capacidadMaxima: capacidad,
        entrenadorId: entrenador.id,
        fechaInicio: crearFechaKeyLocal(new Date()),
        reglas,
      });

      Alert.alert(
        "Programación creada",
        `El horario semanal continuará automáticamente con ${entrenador.nombre}.`,
      );

      resetearFormularioClase();
      setModoClasesAdmin("CREADAS");

      await cargarDatos(false);
    } catch (error) {
      console.error(error);
      Alert.alert("No se pudo crear", "Revisa los datos de la clase.");
    } finally {
      setGuardandoClaseAdmin(false);
    }
  };

  const cambiarImagenGrupoClase = async (grupo: GrupoClase) => {
    const url = await seleccionarYSubirImagen(
      "clase-existente",
      [16, 9],
      "PORTADA_CLASE",
    );
    if (!url) {
      return;
    }

    try {
      if (grupo.programacionId) {
        await actualizarProgramacionClaseApi(grupo.programacionId, {
          imagenUrl: url,
        });
        await cargarDatos(false);
        setGrupoClaseAdminSeleccionado(`programacion:${grupo.programacionId}`);
        Alert.alert("Imagen actualizada", "La portada de la clase se ha guardado.");
        return;
      }

      const sesionesActualizadas = await Promise.all(
        grupo.sesiones.map((clase) =>
          actualizarClaseApi(clase.id, {
            nombre: clase.nombre,
            descripcion: clase.descripcion,
            imagenUrl: url,
            fechaHora: clase.fechaHora,
            duracionMinutos: clase.duracionMinutos,
            capacidadMaxima: clase.capacidadMaxima,
            gimnasioId: clase.gimnasioId,
            entrenadorId: clase.entrenadorId,
          }),
        ),
      );
      const actualizadasPorId = new Map(
        sesionesActualizadas.map((clase) => [clase.id, clase]),
      );

      setClases((clasesActuales) =>
        clasesActuales.map(
          (clase) => actualizadasPorId.get(clase.id) || clase,
        ),
      );
      if (sesionesActualizadas[0]) {
        setGrupoClaseAdminSeleccionado(
          crearClaveGrupoClase(sesionesActualizadas[0]),
        );
      }
      Alert.alert("Imagen actualizada", "La portada de la clase se ha guardado.");
    } catch (error) {
      console.error(error);
      Alert.alert(
        "No se pudo actualizar",
        "La imagen se subió, pero no se pudo asociar a la clase.",
      );
    }
  };

  const desactivarUsuario = async (usuarioObjetivo: any) => {
    if (!usuarioObjetivo?.id) {
      return;
    }

    Alert.alert(
      "Desactivar usuario",
      "El usuario no podrá iniciar sesión, pero se mantiene su historial.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              const usuarioActualizado = await desactivarUsuarioApi(
                usuarioObjetivo.id,
              );

              setUsuarios((usuariosActuales) =>
                usuariosActuales.map((usuario) =>
                  usuario.id === usuarioActualizado.id
                    ? { ...usuario, ...usuarioActualizado, activo: false }
                    : usuario,
                ),
              );

              Alert.alert("Usuario desactivado", "El acceso se ha bloqueado.");
            } catch (error) {
              console.error(error);
              Alert.alert(
                "No se pudo desactivar",
                "Ha ocurrido un error al desactivar el usuario.",
              );
            }
          },
        },
      ],
    );
  };

  const eliminarHorarioGrupoClase = (
    grupo: GrupoClase,
    regla: { diaSemana: number; hora: string },
  ) => {
    if (!grupo.programacionId) {
      Alert.alert(
        "Horario legacy",
        "Esta sesión histórica no tiene una programación semanal editable.",
      );
      return;
    }

    const reglas = grupo.reglas.filter(
      (actual) =>
        actual.diaSemana !== regla.diaSemana || actual.hora !== regla.hora,
    );
    if (reglas.length === 0) {
      Alert.alert(
        "Horario obligatorio",
        "Desactiva la programación si ya no debe generar sesiones.",
      );
      return;
    }

    Alert.alert(
      "Eliminar horario",
      "Las sesiones futuras sin reservas se desactivarán. Las reservas activas bloquearán el cambio.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await actualizarProgramacionClaseApi(grupo.programacionId!, {
                reglas,
              });
              await cargarDatos(false);
              Alert.alert("Horario eliminado", "La programación semanal se ha actualizado.");
            } catch (error) {
              Alert.alert(
                "No se pudo eliminar",
                error instanceof Error
                  ? error.message
                  : "Revisa las reservas futuras de este horario.",
              );
            }
          },
        },
      ],
    );
  };

  const desactivarProgramacionGrupoClase = (grupo: GrupoClase) => {
    if (!grupo.programacionId) {
      return;
    }
    Alert.alert(
      "Desactivar programación",
      "Dejarán de generarse sesiones nuevas. El historial se conservará y las reservas futuras bloquearán la operación.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              await desactivarProgramacionClaseApi(grupo.programacionId!);
              await cargarDatos(false);
              setGrupoClaseAdminSeleccionado(null);
              setModoClasesAdmin("DESACTIVADAS");
              Alert.alert("Programación desactivada", "No se crearán nuevas sesiones.");
            } catch (error) {
              Alert.alert(
                "No se pudo desactivar",
                error instanceof Error
                  ? error.message
                  : "Revisa las reservas futuras antes de continuar.",
              );
            }
          },
        },
      ],
    );
  };

  const reservarClase = async (claseId: number) => {
    if (reservaEnProcesoRef.current || reservaEnProcesoId) {
      return;
    }

    const cliente =
      usuarioActivo?.rol === "CLIENTE"
        ? usuarioActivo
        : clientes.find((usuario) => usuario.id === clienteSeleccionadoId) ||
          clientes[0];

    const claseReservada = clasesActivasGimnasio.find(
      (clase) => clase.id === claseId,
    );

    if (!cliente) {
      Alert.alert("Falta cliente", "Primero debe existir un cliente.");
      return;
    }

    if (!claseReservada) {
      Alert.alert("Clase no encontrada", "No se ha encontrado esta clase.");
      return;
    }

    const huecosDisponibles = obtenerHuecosDisponibles(claseReservada);

    if (huecosDisponibles <= 0) {
      Alert.alert("Clase completa", "No quedan huecos disponibles.");
      return;
    }

    reservaEnProcesoRef.current = true;
    setReservaEnProcesoId(claseId);
    setErrorReservaCliente("");

    try {
      await crearReservaApi(
        usuarioActivo?.rol === "ADMIN"
          ? { claseId, clienteId: cliente.id }
          : { claseId },
      );

      setReservaConfirmada({
        nombreClase: claseReservada.nombre,
        fechaHora: claseReservada.fechaHora,
        nombreEntrenador: claseReservada.nombreEntrenador,
      });

      cargarDatos();
    } catch (error) {
      console.error(error);
      const mensaje =
        error instanceof GymFlowApiError
          ? error.message
          : "No se pudo completar la reserva.";
      setErrorReservaCliente(mensaje);
      Alert.alert("No se pudo reservar", mensaje);
    } finally {
      reservaEnProcesoRef.current = false;
      setReservaEnProcesoId(null);
    }
  };
  const cancelarReserva = async (
    reservaId: number,
    opciones: { mostrarAlert?: boolean } = {},
  ) => {
    if (cancelacionesReservaEnProcesoRef.current.has(reservaId)) {
      return false;
    }
    cancelacionesReservaEnProcesoRef.current.add(reservaId);
    const mostrarAlert = opciones.mostrarAlert !== false;
    setCancelandoReservaId(reservaId);
    setErrorReservaCliente("");

    try {
      await cancelarReservaApi(reservaId);

      if (mostrarAlert) {
        Alert.alert(
          "Reserva cancelada",
          "La reserva se ha cancelado correctamente.",
        );
      }

      await cargarDatos(mostrarAlert);
      return true;
    } catch (error) {
      console.error(error);
      const mensaje =
        error instanceof GymFlowApiError
          ? error.message
          : "No se pudo cancelar la reserva. Inténtalo de nuevo en unos segundos.";
      setErrorReservaCliente(mensaje);
      if (mostrarAlert) {
        Alert.alert("No se pudo cancelar", mensaje);
      }
      return false;
    } finally {
      cancelacionesReservaEnProcesoRef.current.delete(reservaId);
      setCancelandoReservaId(null);
    }
  };

  const gimnasioActual =
    gimnasios.find((gimnasio) => gimnasio.id === usuarioActivo?.gimnasioId) ||
    gimnasios[0];
  const mensajesUsuariosPermitidosApp = Boolean(
    gimnasioActual?.mensajesUsuariosPermitidos,
  );
  const clientesPuedenCambiarFotoPerfilApp =
    gimnasioActual?.clientesPuedenCambiarFotoPerfil !== false;
  const entrenadoresPuedenCambiarFotoPerfilApp =
    gimnasioActual?.entrenadoresPuedenCambiarFotoPerfil !== false;

  const usuariosGimnasio = usuarioActivo
    ? usuarios.filter(
        (usuario) => usuario.gimnasioId === usuarioActivo.gimnasioId,
      )
    : usuarios;

  const clasesGimnasio = usuarioActivo
    ? clases.filter((clase) => clase.gimnasioId === usuarioActivo.gimnasioId)
    : clases;

  const clasesActivasGimnasio = clasesGimnasio.filter(
    (clase) => clase.activa !== false,
  );

  const reservasGimnasio = usuarioActivo
    ? reservas.filter(
        (reserva) => reserva.gimnasioId === usuarioActivo.gimnasioId,
      )
    : reservas;

  const clientes = usuariosGimnasio.filter(
    (usuario) => usuario.rol === "CLIENTE",
  );

  const adminsGimnasio = usuariosGimnasio.filter(
    (usuario) => usuario.rol === "ADMIN" && usuario.activo !== false,
  );

  const entrenadores = usuariosGimnasio.filter(
    (usuario) => usuario.rol === "ENTRENADOR",
  );
  const entrenadoresActivos = entrenadores.filter(
    (usuario) => usuario.activo !== false,
  );
  const clientesActivos = clientes.filter((usuario) => usuario.activo !== false);
  const destinatariosMensajeDisponibles = [
    ...clientesActivos,
    ...entrenadoresActivos,
  ];
  const busquedaDestinatariosNormalizada = busquedaDestinatariosMensaje
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const destinatariosMensajeFiltrados = destinatariosMensajeDisponibles.filter(
    (usuario) => {
      if (!busquedaDestinatariosNormalizada) {
        return true;
      }

      return `${usuario.nombre} ${usuario.email} ${usuario.rol}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(busquedaDestinatariosNormalizada);
    },
  );
  const destinatariosSelectorPersonaFiltrados = destinatariosMensajeFiltrados.filter(
    (usuario) => {
      if (filtroSelectorPersonasMensaje === "CLIENTES") {
        return usuario.rol === "CLIENTE";
      }

      if (filtroSelectorPersonasMensaje === "ENTRENADORES") {
        return usuario.rol === "ENTRENADOR";
      }

      return true;
    },
  );
  const destinatariosSelectorPersonaVisibles =
    destinatariosSelectorPersonaFiltrados.slice(0, 40);
  const destinatariosSeleccionadosMensaje = destinatariosMensajeDisponibles.filter(
    (usuario) => destinatariosMensajeIds.includes(usuario.id),
  );
  const destinatarioIndividualSeleccionado =
    destinatariosSeleccionadosMensaje[0] || null;

  const obtenerEstadoCliente = (cliente: any): Exclude<FiltroClientes, "TODOS"> => {
    if (cliente.activo === false) {
      return "CANCELADOS";
    }

    const tieneReservas = reservasGimnasio.some(
      (reserva) =>
        reserva.clienteId === cliente.id && reserva.estado === "RESERVADA",
    );

    return tieneReservas ? "ACTIVOS" : "PENDIENTES";
  };

  const colorPrimarioApp = gimnasioActual?.colorPrimario || "#E33B3B";
  const colorSecundarioApp = gimnasioActual?.colorSecundario || "#0B6DAE";
  const colorTextoSobrePrimarioApp =
    obtenerColorContraste(colorPrimarioApp);
  const colorPrimarioVisibleApp =
    hexToHsl(colorPrimarioApp).l >= 88 ? "#64748B" : colorPrimarioApp;
  const colorSecundarioVisibleApp =
    hexToHsl(colorSecundarioApp).l >= 88 ? "#64748B" : colorSecundarioApp;
  const appBackgroundColor = mezclarColores(
    colorSecundarioVisibleApp,
    "#05070A",
    0.9,
  );
  const appSecondarySurfaceColor = mezclarColores(
    colorSecundarioVisibleApp,
    "#10151D",
    0.78,
  );
  const appBorderColor = colorConAlpha(colorSecundarioVisibleApp, "42");
  const bottomDockBottomInset = Math.max(insets.bottom, 10);
  const bottomDockHeight = 66 + bottomDockBottomInset;
  const esFlujoAltaUsuario =
    rolSeleccionado === "ADMIN" && seccionAdmin === "CREAR_USUARIO";
  const scrollContentBottomPadding = bottomDockHeight + 36;
  const scrollContentKeyboardBottomPadding = Math.max(insets.bottom, 18) + 28;
  const authenticatedScrollBottomPadding = tecladoVisible
    ? scrollContentKeyboardBottomPadding
    : esFlujoAltaUsuario
      ? Math.max(insets.bottom, 16) + 24
      : scrollContentBottomPadding;
  const authenticatedScreenKey =
    rolSeleccionado === "ADMIN"
      ? `ADMIN:${seccionAdmin}:${
          seccionAdmin === "CLIENTES"
            ? clienteAdminSeleccionadoId ?? "LISTA"
            : seccionAdmin === "ENTRENADORES"
              ? entrenadorAdminSeleccionadoId ?? "LISTA"
              : seccionAdmin === "CLASES"
                ? `${modoClasesAdmin}:${
                    grupoClaseAdminSeleccionado ??
                    grupoClaseEditandoKey ??
                    "LISTA"
                  }`
              : seccionAdmin === "RESERVAS"
                ? sesionReservaAdminSeleccionadaId ?? "LISTA"
              : seccionAdmin === "RUTINAS"
                ? `${modoRutinasEntrenador}:${
                    rutinaEntrenadorSeleccionadaId ?? "LISTA"
                  }`
              : seccionAdmin === "MENSAJES"
                ? modoMensajesAdmin
              : seccionAdmin === "CREAR_USUARIO"
                ? rolUsuario
                : "PANTALLA"
        }`
      : rolSeleccionado === "CLIENTE"
        ? `CLIENTE:${seccionCliente}`
        : rolSeleccionado === "ENTRENADOR"
          ? `ENTRENADOR:${seccionEntrenador}`
          : "SELECTOR";

  useEffect(() => {
    authenticatedScreenKeyRef.current = authenticatedScreenKey;

    if (keyboardScrollTimeoutRef.current) {
      clearTimeout(keyboardScrollTimeoutRef.current);
      keyboardScrollTimeoutRef.current = null;
    }

    return () => {
      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
        keyboardScrollTimeoutRef.current = null;
      }
    };
  }, [authenticatedScreenKey]);

  const trainerQuickActionWidth = Math.min(
    176,
    Math.max(146, Math.round((windowWidth - 92) / 2)),
  );
  const clienteHomeTheme: GymFlowTheme = {
    primary: colorPrimarioVisibleApp,
    secondary: colorSecundarioVisibleApp,
    textOnPrimary: obtenerColorContraste(colorPrimarioVisibleApp),
    background: mezclarColores(colorSecundarioVisibleApp, "#F8FAFC", 0.94),
    surface: "#FFFFFF",
    surfaceSoft: mezclarColores(colorPrimarioVisibleApp, "#F8FAFC", 0.92),
    text: "#182033",
    muted: "#6B7280",
    border: colorConAlpha(colorSecundarioVisibleApp, "22"),
  };
  const oneRepMaxColors = {
    primary: colorPrimarioVisibleApp,
    secondary: colorSecundarioVisibleApp,
    accessIconBackground: mezclarColores(
      colorSecundarioVisibleApp,
      clienteHomeTheme.surface,
      0.88,
    ),
    resultBackground: mezclarColores(
      colorPrimarioVisibleApp,
      clienteHomeTheme.surface,
      0.9,
    ),
    resultBorder: mezclarColores(
      colorPrimarioVisibleApp,
      clienteHomeTheme.surface,
      0.72,
    ),
    resultNoticeBackground: mezclarColores(
      colorPrimarioVisibleApp,
      clienteHomeTheme.surface,
      0.82,
    ),
    percentagePillBackground: mezclarColores(
      colorSecundarioVisibleApp,
      clienteHomeTheme.surface,
      0.9,
    ),
  };
  const esPantallaClientePremium =
    usuarioLogueado &&
    rolSeleccionado === "CLIENTE" &&
    (seccionCliente === "PANEL" ||
      seccionCliente === "CLASES" ||
      seccionCliente === "RESERVAS" ||
      seccionCliente === "MENSAJES" ||
      seccionCliente === "RUTINAS" ||
      seccionCliente === "PAGOS" ||
      seccionCliente === "PERFIL");
  const esPantallaAdminPremium =
    usuarioLogueado &&
    rolSeleccionado === "ADMIN" &&
    (seccionAdmin === "INICIO" ||
      seccionAdmin === "GESTION" ||
      seccionAdmin === "CLIENTES" ||
      seccionAdmin === "INVITACIONES_CLIENTES" ||
      seccionAdmin === "ENTRENADORES" ||
      seccionAdmin === "CLASES" ||
      seccionAdmin === "RESERVAS" ||
      seccionAdmin === "RUTINAS" ||
      seccionAdmin === "PAGOS" ||
      seccionAdmin === "MENSAJES" ||
      seccionAdmin === "CREAR_USUARIO" ||
      seccionAdmin === "PERSONALIZAR");
  const esPantallaEntrenadorPremium =
    usuarioLogueado &&
    rolSeleccionado === "ENTRENADOR" &&
    (seccionEntrenador === "PANEL" ||
      seccionEntrenador === "CLASES" ||
      seccionEntrenador === "MENSAJES" ||
      seccionEntrenador === "RUTINAS" ||
      seccionEntrenador === "PERFIL");
  const authenticatedScreenBackgroundColor =
    esPantallaClientePremium || esPantallaEntrenadorPremium || esPantallaAdminPremium
      ? clienteHomeTheme.background
      : appBackgroundColor;
  const esDashboardActivo =
    (rolSeleccionado === "ADMIN" && seccionAdmin === "INICIO") ||
    (rolSeleccionado === "ENTRENADOR" && seccionEntrenador === "PANEL") ||
    (rolSeleccionado === "CLIENTE" && seccionCliente === "PANEL");
  const dashboardBackgroundUri = esDashboardActivo
    ? resolverUrlMedia(gimnasioActual?.imagenFondoUrl)
    : null;
  const authenticatedContentBackgroundColor = authenticatedScreenBackgroundColor;
  const nombreGimnasioApp = gimnasioActual?.nombre || "GymFlow";
  const bienvenidaGimnasioApp =
    gimnasioActual?.textoBienvenida || "Gestiona tu gimnasio desde el móvil.";

  const reservasActivas = reservasGimnasio.filter(
    (reserva) => reserva.estado === "RESERVADA",
  );

  const obtenerClaseDeReserva = (reserva: any) => {
    return clasesGimnasio.find((clase) => clase.id === reserva.claseId);
  };

  const obtenerReservasActivasDeClase = (claseId: number) => {
    return reservasGimnasio.filter(
      (reserva) =>
        reserva.claseId === claseId && reserva.estado === "RESERVADA",
    );
  };

  const entrenadorDemo =
    usuarioActivo?.rol === "ENTRENADOR"
      ? usuarioActivo
      : entrenadores.find(
          (entrenador) => entrenador.id === entrenadorSeleccionadoId,
        ) || entrenadores[0];

  const clienteDemo =
    usuarioActivo?.rol === "CLIENTE"
      ? usuarioActivo
      : clientes.find((cliente) => cliente.id === clienteSeleccionadoId) ||
        clientes[0];

  const clasesEntrenador = entrenadorDemo
    ? clasesActivasGimnasio.filter(
        (clase) => clase.entrenadorId === entrenadorDemo.id,
      )
    : [];

  const reservasCliente = clienteDemo
    ? reservasGimnasio.filter((reserva) => reserva.clienteId === clienteDemo.id)
    : [];

  const rutinaEntrenadorSeleccionada =
    rutinaEntrenadorSeleccionadaId == null
      ? null
      : rutinasEntrenador.find(
          (rutina) => rutina.id === rutinaEntrenadorSeleccionadaId,
        ) || null;
  const rutinasClienteActivas = rutinasClienteAsignadas.filter(
    (asignacion) =>
      asignacion.activa !== false &&
      asignacion.rutina &&
      asignacion.rutina.activa !== false,
  );
  const asignacionRutinaClienteSeleccionada =
    rutinaClienteSeleccionadaId == null
      ? null
      : rutinasClienteActivas.find(
          (asignacion) =>
            (asignacion.rutina?.id || asignacion.rutinaId) ===
            rutinaClienteSeleccionadaId,
        ) || null;
  const rutinaClienteSeleccionada =
    asignacionRutinaClienteSeleccionada?.rutina || null;
  const ejerciciosRutinaClienteSeleccionada = rutinaClienteSeleccionada
    ? obtenerEjerciciosRutinaOrdenados(rutinaClienteSeleccionada)
    : [];
  const ejercicioEntrenamientoCliente =
    ejerciciosRutinaClienteSeleccionada[entrenamientoClienteIndice] || null;
  const totalEjerciciosEntrenamientoCliente =
    ejerciciosRutinaClienteSeleccionada.length;
  const totalCompletadosEntrenamientoCliente =
    entrenamientoClienteCompletadosIds.length;
  const busquedaRutinasNormalizada = busquedaRutinasEntrenador
    .trim()
    .toLowerCase();
  const nivelesRutinasEntrenador = Array.from(
    new Set(
      rutinasEntrenador
        .map((rutina) => rutina.nivel?.trim())
        .filter(Boolean) as string[],
    ),
  );
  const rutinasEntrenadorFiltradas = rutinasEntrenador.filter((rutina) => {
    const coincideBusqueda =
      !busquedaRutinasNormalizada ||
      `${rutina.nombre} ${rutina.descripcion || ""} ${rutina.nivel || ""}`
        .toLowerCase()
        .includes(busquedaRutinasNormalizada);
    const coincideNivel =
      filtroNivelRutinasEntrenador === "TODAS" ||
      rutina.nivel === filtroNivelRutinasEntrenador;

    return coincideBusqueda && coincideNivel;
  });
  const asignacionesClienteIdsRutina = new Set(
    asignacionesRutinaEntrenador.map((asignacion) => asignacion.clienteId),
  );
  const alumnosAsignadosRutina = asignacionesRutinaEntrenador
    .map((asignacion) => {
      const cliente = clientesActivos.find(
        (clienteActivo) => clienteActivo.id === asignacion.clienteId,
      );

      return {
        asignacion,
        cliente,
        nombre: asignacion.nombreCliente || cliente?.nombre || "Cliente",
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const busquedaAlumnosRutinaNormalizada = busquedaAlumnosRutina
    .trim()
    .toLowerCase();
  const alumnosDisponiblesRutina = clientesActivos
    .filter((cliente) => {
      if (!busquedaAlumnosRutinaNormalizada) {
        return true;
      }

      return `${cliente.nombre} ${cliente.email || ""}`
        .toLowerCase()
        .includes(busquedaAlumnosRutinaNormalizada);
    })
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  const ejercicioFormActualSnapshot = obtenerSnapshotActualEjercicioRutina();
  const ejercicioFormTieneCambios =
    JSON.stringify(ejercicioFormActualSnapshot) !==
    JSON.stringify(ejercicioFormSnapshot);
  const erroresEjercicioRutina = obtenerErroresEjercicioRutina(
    mostrarErroresEjercicioRutina,
  );
  const ejercicioRutinaPuedeGuardar =
    Object.keys(obtenerErroresEjercicioRutina(true)).length === 0 &&
    !guardandoRutinaEntrenador &&
    subiendoImagen !== "rutina-ejercicio";

  const reservasClienteOrdenadas = [...reservasCliente].sort((a, b) => {
    const claseA = obtenerClaseDeReserva(a);
    const claseB = obtenerClaseDeReserva(b);

    return (
      new Date(claseA?.fechaHora || 0).getTime() -
      new Date(claseB?.fechaHora || 0).getTime()
    );
  });

  const obtenerDestinatariosPorAudiencia = (audiencia: AudienciaMensaje) => {
    if (audiencia === "CLIENTES") {
      return clientesActivos;
    }

    if (audiencia === "ENTRENADORES") {
      return entrenadoresActivos;
    }

    if (audiencia === "INDIVIDUAL") {
      return destinatariosSeleccionadosMensaje;
    }

    return destinatariosMensajeDisponibles;
  };

  const destinatariosObjetivoMensaje =
    obtenerDestinatariosPorAudiencia(audienciaMensaje);
  const totalDestinatariosMensaje = destinatariosObjetivoMensaje.length;

  const mensajesSistema: MensajeApp[] = false ? [
    {
      id: "pago",
      asunto: "Aviso de pago",
      texto: "Recordatorio de suscripción pendiente.",
      automatico: true,
      audiencia: "CLIENTES",
      fecha: "Hoy",
      fechaOrden: Date.now(),
      tipoProgramacion: "RECURRENTE",
      frecuencia: "MENSUAL",
      prioridad: "IMPORTANTE",
      estado: "ACTIVO",
      leido: false,
      remitente: nombreGimnasioApp,
      destinatariosCount: clientesActivos.length,
      segmentoLabel: "Clientes",
    },
    {
      id: "festivos",
      asunto: "Aviso días festivos",
      texto: "Horario especial del gimnasio.",
      automatico: true,
      audiencia: "TODOS",
      fecha: "Mañana",
      fechaOrden: Date.now() + 86400000,
      tipoProgramacion: "FECHA",
      frecuencia: "NINGUNA",
      prioridad: "NORMAL",
      estado: "PROGRAMADO",
      leido: true,
      remitente: nombreGimnasioApp,
      destinatariosCount: destinatariosMensajeDisponibles.length,
      segmentoLabel: "Todos",
    },
    {
      id: "general",
      asunto: "Mensaje general",
      texto: "Comunicación para clientes y entrenadores.",
      automatico: false,
      audiencia: "TODOS",
      fecha: "Esta semana",
      fechaOrden: Date.now(),
      tipoProgramacion: "AHORA",
      frecuencia: "NINGUNA",
      prioridad: "NORMAL",
      estado: "ENVIADO",
      leido: true,
      remitente: "Administración",
      destinatariosCount: destinatariosMensajeDisponibles.length,
      segmentoLabel: "Todos",
    },
  ] : [];

  const mensajesBase = [...mensajesCreados, ...mensajesSistema].map(
    (mensaje) => ({
      ...mensaje,
      leido:
        mensaje.leido ||
        mensajesLeidosIds.includes(mensaje.id) ||
        Boolean(
          usuarioActivo?.id &&
            mensaje.leidoPorUsuarioIds?.includes(usuarioActivo.id),
        ),
    }),
  );
  const mensajeSeleccionado =
    mensajesBase.find((mensaje) => mensaje.id === mensajeSeleccionadoId) || null;
  const rolConversacionMensajesActiva: RolMensajesVista | null =
    mensajeSeleccionado &&
    rolSeleccionado === "ADMIN" &&
    seccionAdmin === "MENSAJES"
      ? "ADMIN"
      : mensajeSeleccionado &&
          rolSeleccionado === "ENTRENADOR" &&
          seccionEntrenador === "MENSAJES"
        ? "ENTRENADOR"
        : mensajeSeleccionado &&
            rolSeleccionado === "CLIENTE" &&
            seccionCliente === "MENSAJES"
          ? "CLIENTE"
          : null;
  const esReglaAutomatizacionMensaje = (mensaje: MensajeApp) =>
    mensaje.estado !== "ENVIADO" &&
    (mensaje.tipoProgramacion === "FECHA" ||
      mensaje.tipoProgramacion === "RECURRENTE" ||
      mensaje.automatico);
  const filtrarMensajesPorRol = (mensaje: MensajeApp) => {
    if (rolSeleccionado !== "ADMIN") {
      return mensaje.estado === "ENVIADO";
    }

    return true;
  };
  const mensajeEnviadoPorUsuarioActual = (mensaje: MensajeApp) => {
    const loEnviaUsuarioActivo = Boolean(
      usuarioActivo?.id && mensaje.remitenteId === usuarioActivo.id,
    );
    const loGestionaAdmin =
      rolSeleccionado === "ADMIN" && (mensaje.automatico || !mensaje.remitenteId);

    return loEnviaUsuarioActivo || loGestionaAdmin;
  };
  const obtenerFechaOrdenMensaje = (mensaje: MensajeApp) =>
    mensaje.fechaOrden || 0;
  const ordenarMensajesRecientes = (listaMensajes: MensajeApp[]) =>
    [...listaMensajes].sort((mensajeA, mensajeB) => {
      const prioridadDiferencia =
        obtenerPesoPrioridadMensaje(mensajeB.prioridad) -
        obtenerPesoPrioridadMensaje(mensajeA.prioridad);

      if (prioridadDiferencia !== 0) {
        return prioridadDiferencia;
      }

      return (
        obtenerFechaOrdenMensaje(mensajeB) - obtenerFechaOrdenMensaje(mensajeA)
      );
    });
  const busquedaMensajesNormalizada = busquedaMensajes.trim().toLowerCase();
  const mensajesVisiblesRol = mensajesBase.filter(filtrarMensajesPorRol);
  const automatizacionesMensajes = ordenarMensajesRecientes(
    mensajesVisiblesRol.filter(esReglaAutomatizacionMensaje),
  );
  const mensajesBandejaBase = ordenarMensajesRecientes(
    mensajesVisiblesRol.filter(
      (mensaje) => !esReglaAutomatizacionMensaje(mensaje),
    ),
  );
  const mensajesBuzon = mensajesBandejaBase.filter((mensaje) => {
    if (buzonMensajes === "ENVIADOS") {
      return mensajeEnviadoPorUsuarioActual(mensaje);
    }

    if (buzonMensajes === "RECIBIDOS") {
      return !mensajeEnviadoPorUsuarioActual(mensaje);
    }

    return true;
  });
  const mensajesRol = mensajesBuzon.filter((mensaje) => {
    if (!busquedaMensajesNormalizada) {
      return true;
    }

    const destinatariosBusqueda = (mensaje.destinatarioIds || [])
      .map(
        (destinatarioId) =>
          usuariosGimnasio.find((usuario) => usuario.id === destinatarioId)
            ?.nombre || "",
      )
      .join(" ");

    return `${mensaje.asunto} ${mensaje.texto} ${mensaje.remitente} ${destinatariosBusqueda} ${mensaje.segmentoLabel || ""} ${mensaje.estado || ""}`
      .toLowerCase()
      .includes(busquedaMensajesNormalizada);
  });
  const mensajesFiltrados = mensajesRol.filter((mensaje) => {
    if (filtroMensajes === "NO_LEIDOS") {
      return !mensaje.leido && !mensajeEnviadoPorUsuarioActual(mensaje);
    }

    if (filtroMensajes === "PRIORITARIOS") {
      return mensaje.prioridad === "IMPORTANTE" || mensaje.prioridad === "URGENTE";
    }

    if (filtroMensajes === "AUTOMATICOS") {
      return mensaje.automatico;
    }

    return true;
  });
  const mensajesNoLeidosVista = mensajesFiltrados.filter(
    (mensaje) => !mensaje.leido && !mensajeEnviadoPorUsuarioActual(mensaje),
  );
  const resumenGlobalMensajes = {
    TODOS: mensajesBandejaBase.length,
    NO_LEIDOS: mensajesBandejaBase.filter(
      (mensaje) => !mensaje.leido && !mensajeEnviadoPorUsuarioActual(mensaje),
    ).length,
    ENVIADOS: mensajesBandejaBase.filter(mensajeEnviadoPorUsuarioActual).length,
    RECIBIDOS: mensajesBandejaBase.filter(
      (mensaje) => !mensajeEnviadoPorUsuarioActual(mensaje),
    ).length,
    PRIORITARIOS: mensajesBandejaBase.filter(
      (mensaje) =>
        mensaje.prioridad === "IMPORTANTE" || mensaje.prioridad === "URGENTE",
    ).length,
    PROGRAMADOS: automatizacionesMensajes.filter(
      (mensaje) => mensaje.estado === "PROGRAMADO",
    ).length,
    ACTIVOS: automatizacionesMensajes.filter((mensaje) => mensaje.estado === "ACTIVO")
      .length,
  };
  const obtenerClaveConversacion = (mensaje: MensajeApp) =>
    mensaje.conversacionId || `mensaje-${mensaje.mensajePadreId || mensaje.id}`;
  const obtenerAsuntoMensaje = (mensaje: MensajeApp) =>
    limpiarAsuntoConversacion(mensaje.asunto);
  const obtenerEtiquetaDestinoMensaje = (mensaje: MensajeApp) => {
    if (
      mensaje.audiencia === "INDIVIDUAL" &&
      mensaje.remitenteId === usuarioActivo?.id &&
      adminsGimnasio.some((admin) => mensaje.destinatarioIds?.includes(admin.id))
    ) {
      return "Administración";
    }

    if (mensaje.audiencia === "TODOS") {
      return "Todos";
    }

    if (mensaje.audiencia === "CLIENTES") {
      return "Clientes";
    }

    if (mensaje.audiencia === "ENTRENADORES") {
      return "Entrenadores";
    }

    return mensaje.segmentoLabel || "Individual";
  };
  const obtenerIdsDestinatariosMensaje = (mensaje: MensajeApp) => {
    if (mensaje.destinatarioIds?.length) {
      return mensaje.destinatarioIds;
    }

    if (rolSeleccionado !== "ADMIN") {
      return [];
    }

    if (mensaje.audiencia === "CLIENTES") {
      return clientesActivos.map((cliente) => cliente.id);
    }

    if (mensaje.audiencia === "ENTRENADORES") {
      return entrenadoresActivos.map((entrenador) => entrenador.id);
    }

    if (mensaje.audiencia === "TODOS") {
      return destinatariosMensajeDisponibles.map((usuario) => usuario.id);
    }

    return [];
  };
  const obtenerUsuariosDestinatariosMensaje = (mensaje: MensajeApp) => {
    const destinatarios = new Set(obtenerIdsDestinatariosMensaje(mensaje));

    return usuariosGimnasio.filter(
      (usuario) => usuario.activo !== false && destinatarios.has(usuario.id),
    );
  };
  const obtenerTextoBusquedaMensaje = (mensaje: MensajeApp) => {
    const destinatarios = obtenerUsuariosDestinatariosMensaje(mensaje)
      .map((usuario) => usuario.nombre)
      .join(" ");

    return `${mensaje.asunto} ${mensaje.texto} ${mensaje.remitente} ${mensaje.segmentoLabel || ""} ${destinatarios}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };
  const obtenerResumenDestinatariosMensaje = (
    mensaje: MensajeApp,
    limite = 2,
  ) => {
    const usuariosDestino = obtenerUsuariosDestinatariosMensaje(mensaje);

    if (usuariosDestino.length > 0) {
      const nombres = usuariosDestino
        .slice(0, limite)
        .map((usuario) => usuario.nombre)
        .join(", ");
      const restantes = usuariosDestino.length - limite;

      return restantes > 0 ? `${nombres} +${restantes}` : nombres;
    }

    return obtenerEtiquetaDestinoMensaje(mensaje);
  };
  const obtenerEstadoDestinatariosMensaje = (mensaje: MensajeApp) => {
    const leidos = new Set(mensaje.leidoPorUsuarioIds || []);

    return obtenerUsuariosDestinatariosMensaje(mensaje).map((usuario) => ({
      usuario,
      leido: leidos.has(usuario.id),
    }));
  };
  const obtenerLecturasMensaje = (mensaje: MensajeApp) => {
    const destinatarios = obtenerIdsDestinatariosMensaje(mensaje);
    const destinatariosSet = new Set(destinatarios);
    const leidos = (mensaje.leidoPorUsuarioIds || []).filter((usuarioId) =>
      destinatariosSet.size > 0
        ? destinatariosSet.has(usuarioId)
        : usuarioId !== mensaje.remitenteId,
    );
    const total =
      destinatarios.length || mensaje.destinatariosCount || leidos.length || 0;

    return {
      leidos: new Set(leidos).size,
      total,
      porcentaje:
        total > 0 ? `${Math.min((new Set(leidos).size / total) * 100, 100)}%` : "0%",
    };
  };
  const obtenerMensajesDeConversacion = (mensajeReferencia: MensajeApp) => {
    const claveSeleccionada = obtenerClaveConversacion(mensajeReferencia);
    const mensajeSeleccionadoIdNumerico = Number(mensajeReferencia.id);

    return mensajesVisiblesRol
      .filter(
        (mensaje) =>
          obtenerClaveConversacion(mensaje) === claveSeleccionada ||
          mensaje.id === mensajeReferencia.id ||
          (Number.isFinite(mensajeSeleccionadoIdNumerico) &&
            mensaje.mensajePadreId === mensajeSeleccionadoIdNumerico),
      )
      .sort(
        (mensajeA, mensajeB) =>
          obtenerFechaOrdenMensaje(mensajeA) - obtenerFechaOrdenMensaje(mensajeB),
      );
  };
  const crearConversacionesMensajes = (listaMensajes: MensajeApp[]) =>
    Array.from(
      listaMensajes
      .reduce((conversaciones, mensaje) => {
        const conversacionId = obtenerClaveConversacion(mensaje);

        if (!conversaciones.has(conversacionId)) {
          const mensajesConversacion = obtenerMensajesDeConversacion(mensaje);
          const mensajePrincipal =
            mensajesConversacion[mensajesConversacion.length - 1] || mensaje;
          const noLeidos = mensajesConversacion.filter(
            (mensajeConversacion) =>
              !mensajeConversacion.leido &&
              !mensajeEnviadoPorUsuarioActual(mensajeConversacion),
          ).length;

          conversaciones.set(conversacionId, {
            id: conversacionId,
            mensaje: mensajePrincipal,
            mensajes: mensajesConversacion,
            total: mensajesConversacion.length,
            noLeidos,
          });
        }

        return conversaciones;
      }, new Map<string, ConversacionMensaje>())
      .values(),
    ).sort((conversacionA, conversacionB) => {
      if (conversacionA.noLeidos !== conversacionB.noLeidos) {
        return conversacionB.noLeidos - conversacionA.noLeidos;
      }

      const prioridadDiferencia =
        obtenerPesoPrioridadMensaje(conversacionB.mensaje.prioridad) -
        obtenerPesoPrioridadMensaje(conversacionA.mensaje.prioridad);

      if (prioridadDiferencia !== 0) {
        return prioridadDiferencia;
      }

      return (
        obtenerFechaOrdenMensaje(conversacionB.mensaje) -
        obtenerFechaOrdenMensaje(conversacionA.mensaje)
      );
    });
  const conversacionesMensajesBaseFiltro =
    crearConversacionesMensajes(mensajesRol);
  const conversacionesMensajes = crearConversacionesMensajes(mensajesFiltrados);
  const resumenConversacionesMensajes = {
    TODOS: conversacionesMensajesBaseFiltro.length,
    NO_LEIDOS: conversacionesMensajesBaseFiltro.filter(
      (conversacion) => conversacion.noLeidos > 0,
    ).length,
    PRIORITARIOS: conversacionesMensajesBaseFiltro.filter((conversacion) =>
      conversacion.mensajes.some(
        (mensaje) =>
          mensaje.prioridad === "IMPORTANTE" || mensaje.prioridad === "URGENTE",
      ),
    ).length,
    AUTOMATICOS: conversacionesMensajesBaseFiltro.filter((conversacion) =>
      conversacion.mensajes.some((mensaje) => mensaje.automatico),
    ).length,
  };
  const mensajesClienteBandeja = mensajesBandejaBase.filter((mensaje) => {
    if (!busquedaMensajesNormalizada) {
      return true;
    }

    return `${mensaje.asunto} ${mensaje.texto} ${mensaje.remitente} ${mensaje.segmentoLabel || ""}`
      .toLowerCase()
      .includes(busquedaMensajesNormalizada);
  });
  const conversacionesClienteBase =
    crearConversacionesMensajes(mensajesClienteBandeja);
  const conversacionesCliente = conversacionesClienteBase.filter((conversacion) => {
    if (filtroMensajes === "NO_LEIDOS") {
      return conversacion.noLeidos > 0;
    }

    return true;
  });
  const resumenConversacionesCliente = {
    TODOS: conversacionesClienteBase.length,
    NO_LEIDOS: conversacionesClienteBase.filter(
      (conversacion) => conversacion.noLeidos > 0,
    ).length,
  };
  const busquedaMensajesUnificada = busquedaMensajesNormalizada
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const conversacionesUnificadasBase = crearConversacionesMensajes(
    mensajesBandejaBase,
  ).filter((conversacion) => {
    if (!busquedaMensajesUnificada) {
      return true;
    }

    return conversacion.mensajes.some((mensaje) =>
      obtenerTextoBusquedaMensaje(mensaje).includes(busquedaMensajesUnificada),
    );
  });
  const conversacionesUnificadas = conversacionesUnificadasBase.filter(
    (conversacion) => {
      if (filtroMensajes === "NO_LEIDOS") {
        return conversacion.noLeidos > 0;
      }

      if (filtroMensajes === "PRIORITARIOS") {
        return conversacion.mensajes.some(
          (mensaje) =>
            mensaje.prioridad === "IMPORTANTE" ||
            mensaje.prioridad === "URGENTE",
        );
      }

      if (filtroMensajes === "AUTOMATICOS") {
        return conversacion.mensajes.some((mensaje) => mensaje.automatico);
      }

      return true;
    },
  );
  const resumenConversacionesUnificadas = {
    TODOS: conversacionesUnificadasBase.length,
    NO_LEIDOS: conversacionesUnificadasBase.filter(
      (conversacion) => conversacion.noLeidos > 0,
    ).length,
    PRIORITARIOS: conversacionesUnificadasBase.filter((conversacion) =>
      conversacion.mensajes.some(
        (mensaje) =>
          mensaje.prioridad === "IMPORTANTE" ||
          mensaje.prioridad === "URGENTE",
      ),
    ).length,
    AUTOMATICOS: conversacionesUnificadasBase.filter((conversacion) =>
      conversacion.mensajes.some((mensaje) => mensaje.automatico),
    ).length,
  };
  const mensajesNoLeidosUnificados = conversacionesUnificadas
    .flatMap((conversacion) => conversacion.mensajes)
    .filter(
      (mensaje) => !mensaje.leido && !mensajeEnviadoPorUsuarioActual(mensaje),
    );
  const mensajesNoLeidosBadge = resumenGlobalMensajes.NO_LEIDOS;
  const mensajesConversacionSeleccionada = mensajeSeleccionado
    ? obtenerMensajesDeConversacion(mensajeSeleccionado)
    : [];
  const obtenerDestinatariosRespuesta = (mensaje: MensajeApp) => {
    if (!usuarioActivo?.id) {
      return [];
    }

    if (rolSeleccionado === "ADMIN") {
      if (mensaje.remitenteId && mensaje.remitenteId !== usuarioActivo.id) {
        return [mensaje.remitenteId];
      }

      return (mensaje.destinatarioIds || []).filter(
        (destinatarioId) => destinatarioId !== usuarioActivo.id,
      );
    }

    if (!mensajesUsuariosPermitidosApp) {
      return [];
    }

    if (mensaje.remitenteId && mensaje.remitenteId !== usuarioActivo.id) {
      return [mensaje.remitenteId];
    }

    return adminsGimnasio.map((admin) => admin.id);
  };
  const destinatariosRespuestaMensaje = mensajeSeleccionado
    ? obtenerDestinatariosRespuesta(mensajeSeleccionado)
    : [];
  const mensajeSeleccionadoEsComunicado = Boolean(
    mensajeSeleccionado &&
      (mensajeSeleccionado.automatico ||
        mensajeSeleccionado.audiencia !== "INDIVIDUAL" ||
        (mensajeSeleccionado.destinatariosCount ||
          mensajeSeleccionado.destinatarioIds?.length ||
          0) > 1),
  );
  const puedeResponderMensaje = Boolean(
    mensajeSeleccionado &&
      !mensajeSeleccionado.automatico &&
      !mensajeSeleccionadoEsComunicado &&
      destinatariosRespuestaMensaje.length > 0 &&
      (rolSeleccionado === "ADMIN" || mensajesUsuariosPermitidosApp),
  );

  useEffect(() => {
    if (!mensajeSeleccionado) {
      chatConversacionActualRef.current = null;
      chatMensajesCountRef.current = 0;
      chatCercaDelFinalRef.current = true;
      return;
    }

    const claveConversacion = obtenerClaveConversacion(mensajeSeleccionado);
    const cantidadMensajes = Math.max(mensajesConversacionSeleccionada.length, 1);
    const cambioConversacion =
      chatConversacionActualRef.current !== claveConversacion;
    const aumentoMensajes = cantidadMensajes > chatMensajesCountRef.current;

    if (cambioConversacion) {
      chatCercaDelFinalRef.current = true;
      solicitarScrollChatAlFinal(false);
    } else if (aumentoMensajes && chatCercaDelFinalRef.current) {
      solicitarScrollChatAlFinal(true);
    }

    chatConversacionActualRef.current = claveConversacion;
    chatMensajesCountRef.current = cantidadMensajes;
    if (chatDebeIrAlFinalRef.current) {
      manejarContenidoChatDimensionado();
    }
  }, [
    manejarContenidoChatDimensionado,
    mensajeSeleccionado,
    mensajesConversacionSeleccionada.length,
    solicitarScrollChatAlFinal,
  ]);

  useEffect(() => {
    if (!rolConversacionMensajesActiva) {
      setStatusBarStyle("auto", true);
      return;
    }

    const contrasteCabecera = obtenerColorContraste(colorSecundarioVisibleApp);
    setStatusBarStyle(contrasteCabecera === "#FFFFFF" ? "light" : "dark", true);

    return () => setStatusBarStyle("auto", true);
  }, [colorSecundarioVisibleApp, rolConversacionMensajesActiva]);

  const marcarMensajeComoLeido = async (mensaje: MensajeApp) => {
    const mensajeId = mensaje.id;

    setMensajesLeidosIds((idsActuales) =>
      idsActuales.includes(mensajeId)
        ? idsActuales
        : [...idsActuales, mensajeId],
    );
    setMensajesCreados((mensajesActuales) =>
      mensajesActuales.map((mensaje) =>
        mensaje.id === mensajeId ? { ...mensaje, leido: true } : mensaje,
      ),
    );

    const mensajeIdNumerico = Number(mensajeId);

    if (
      !usuarioActivo?.id ||
      !Number.isFinite(mensajeIdNumerico) ||
      mensaje.leidoPorUsuarioIds?.includes(usuarioActivo.id)
    ) {
      return;
    }

    try {
      const mensajeActualizado = await marcarMensajeLeidoApi(mensajeIdNumerico);
      const mensajeMapeado = mapearMensajeBackend(mensajeActualizado);

      setMensajesCreados((mensajesActuales) =>
        mensajesActuales.map((mensajeActual) =>
          mensajeActual.id === mensajeId
            ? { ...mensajeMapeado, leido: true }
            : mensajeActual,
        ),
      );
    } catch (errorLectura) {
      console.warn("No se pudo guardar el mensaje como leido", errorLectura);
    }
  };

  const marcarVistaMensajesComoLeida = async () => {
    if (guardandoLecturasMensajes || mensajesNoLeidosVista.length === 0) {
      return;
    }

    setGuardandoLecturasMensajes(true);

    try {
      await Promise.all(
        mensajesNoLeidosVista.map((mensaje) => marcarMensajeComoLeido(mensaje)),
      );
    } finally {
      setGuardandoLecturasMensajes(false);
    }
  };
  const marcarConversacionesUnificadasComoLeidas = async () => {
    if (
      guardandoLecturasMensajes ||
      mensajesNoLeidosUnificados.length === 0
    ) {
      return;
    }

    setGuardandoLecturasMensajes(true);

    try {
      await Promise.all(
        mensajesNoLeidosUnificados.map((mensaje) =>
          marcarMensajeComoLeido(mensaje),
        ),
      );
    } finally {
      setGuardandoLecturasMensajes(false);
    }
  };

  const abrirConversacionMensaje = (conversacion: ConversacionMensaje) => {
    setFeedbackMensajesCliente(null);
    setMensajeSeleccionadoId(conversacion.mensaje.id);
    void Promise.all(
      conversacion.mensajes
        .filter(
          (mensaje) =>
            !mensaje.leido && !mensajeEnviadoPorUsuarioActual(mensaje),
        )
        .map((mensaje) => marcarMensajeComoLeido(mensaje)),
    );
  };

  const seleccionarAudienciaMensaje = (audiencia: AudienciaMensaje) => {
    setAudienciaMensaje(audiencia);

    if (audiencia !== "INDIVIDUAL") {
      setDestinatariosMensajeIds([]);
      setBusquedaDestinatariosMensaje("");
      setSelectorPersonaMensajeVisible(false);
    }
  };

  const seleccionarDestinatarioIndividualMensaje = (usuarioId: number) => {
    setDestinatariosMensajeIds([usuarioId]);
    setSelectorPersonaMensajeVisible(false);
  };
  const quitarDestinatarioIndividualMensaje = () => {
    setDestinatariosMensajeIds([]);
  };

  function limpiarFormularioMensaje() {
    setAsuntoMensaje("");
    setTextoMensaje("");
    setFechaMensaje("");
    setAudienciaMensaje("CLIENTES");
    setTipoProgramacionMensaje("AHORA");
    setFrecuenciaMensaje("NINGUNA");
    setPrioridadMensaje("NORMAL");
    setDestinatariosMensajeIds([]);
    setBusquedaDestinatariosMensaje("");
    setFiltroSelectorPersonasMensaje("TODOS");
    setSelectorPersonaMensajeVisible(false);
    setSelectorFechaMensajeVisible(false);
    setFechaMensajeTemporal("");
    setHoraMensajeTemporal("");
    setErrorFechaMensajeTemporal(null);
  }

  const volverDesdeNuevoMensajeAdmin = () => {
    const origen = origenNuevoMensajeAdmin;

    limpiarFormularioMensaje();
    setModoMensajesAdmin("BANDEJA");
    setFeedbackMensajesCliente(null);
    setOrigenNuevoMensajeAdmin(null);

    if (origen?.tipo === "FICHA_CLIENTE") {
      setSeccionAdmin("CLIENTES");
      setClienteAdminSeleccionadoId(origen.clienteId);
      return;
    }

    if (origen?.tipo === "FICHA_ENTRENADOR") {
      setSeccionAdmin("ENTRENADORES");
      setEntrenadorAdminSeleccionadoId(origen.entrenadorId);
    }
  };

  useEffect(() => {
    const volverAFichaDesdeAndroid =
      rolSeleccionado === "ADMIN" &&
      seccionAdmin === "MENSAJES" &&
      modoMensajesAdmin === "NUEVO" &&
      (origenNuevoMensajeAdmin?.tipo === "FICHA_CLIENTE" ||
        origenNuevoMensajeAdmin?.tipo === "FICHA_ENTRENADOR");

    if (!volverAFichaDesdeAndroid) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      volverDesdeNuevoMensajeAdmin();
      return true;
    });

    return () => subscription.remove();
    // El manejador lee el origen vigente de este render y solo se registra en este flujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modoMensajesAdmin,
    origenNuevoMensajeAdmin,
    rolSeleccionado,
    seccionAdmin,
  ]);

  const normalizarFechaProgramadaMensaje = () => {
    if (tipoProgramacionMensaje === "AHORA") {
      return null;
    }
    const formatearLocal = (fecha: Date) => {
      const pad = (valor: number) => String(valor).padStart(2, "0");

      return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(
        fecha.getDate(),
      )}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(
        fecha.getSeconds(),
      )}`;
    };

    const valor = fechaMensaje.trim();

    if (!valor) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1);
      fecha.setHours(9, 0, 0, 0);
      return formatearLocal(fecha);
    }

    const normalizado = valor.replace(" ", "T");
    const conSegundos =
      normalizado.length === 10
        ? `${normalizado}T09:00:00`
        : normalizado.length === 16
          ? `${normalizado}:00`
          : normalizado;
    const fecha = new Date(conSegundos);

    if (Number.isNaN(fecha.getTime())) {
      return null;
    }

    return conSegundos;
  };

  const crearFechaMensajeRapida = (diasAdelante: number, hora: number) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasAdelante);
    fecha.setHours(hora, 0, 0, 0);

    const pad = (valor: number) => String(valor).padStart(2, "0");

    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(
      fecha.getDate(),
    )} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
  };
  const formatearFechaMensajeTecnica = (fecha: Date) => {
    const pad = (valor: number) => String(valor).padStart(2, "0");

    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(
      fecha.getDate(),
    )} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
  };
  const obtenerFechaMensajeDesdeTexto = (valor?: string | null) => {
    const texto = valor?.trim();

    if (!texto) {
      return null;
    }

    const fecha = new Date(texto.includes("T") ? texto : texto.replace(" ", "T"));

    return Number.isNaN(fecha.getTime()) ? null : fecha;
  };
  const obtenerFechaProgramadaMensajeActual = () => {
    const fechaExistente = obtenerFechaMensajeDesdeTexto(fechaMensaje);

    if (fechaExistente) {
      return fechaExistente;
    }

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    fecha.setHours(9, 0, 0, 0);

    return fecha;
  };
  const formatearDiaMensajeUsuario = (fecha: Date) =>
    fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const formatearHoraMensajeUsuario = (fecha: Date) =>
    fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const convertirFechaMensajeUsuario = (dia: string, hora: string) => {
    const diaNormalizado = dia.trim();
    const horaNormalizada = hora.trim();
    const coincidenciaDia = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(diaNormalizado);
    const coincidenciaHora = /^(\d{1,2}):(\d{2})$/.exec(horaNormalizada);

    if (!coincidenciaDia || !coincidenciaHora) {
      return null;
    }

    const [, diaTexto, mesTexto, anyoTexto] = coincidenciaDia;
    const [, horasTexto, minutosTexto] = coincidenciaHora;
    const diaNumero = Number(diaTexto);
    const mesNumero = Number(mesTexto);
    const anyoNumero = Number(anyoTexto);
    const horasNumero = Number(horasTexto);
    const minutosNumero = Number(minutosTexto);

    if (
      mesNumero < 1 ||
      mesNumero > 12 ||
      diaNumero < 1 ||
      diaNumero > 31 ||
      horasNumero < 0 ||
      horasNumero > 23 ||
      minutosNumero < 0 ||
      minutosNumero > 59
    ) {
      return null;
    }

    const fecha = new Date(
      anyoNumero,
      mesNumero - 1,
      diaNumero,
      horasNumero,
      minutosNumero,
      0,
      0,
    );

    if (
      fecha.getFullYear() !== anyoNumero ||
      fecha.getMonth() !== mesNumero - 1 ||
      fecha.getDate() !== diaNumero
    ) {
      return null;
    }

    return fecha;
  };
  const asegurarFechaProgramadaMensaje = () => {
    setFechaMensaje((fechaActual) =>
      fechaActual.trim() ? fechaActual : crearFechaMensajeRapida(1, 9),
    );
  };
  const formatearFechaProgramadaMensaje = (fecha?: string | null) => {
    if (!fecha) {
      return "fecha pendiente";
    }

    const fechaParseada = new Date(fecha.includes("T") ? fecha : fecha.replace(" ", "T"));

    if (Number.isNaN(fechaParseada.getTime())) {
      return fecha.replace("T", " ");
    }

    const fechaTexto = fechaParseada
      .toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .replace(".", "");
    const horaTexto = fechaParseada.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${fechaTexto} · ${horaTexto}`;
  };
  const abrirSelectorFechaMensaje = () => {
    const fechaBase = obtenerFechaProgramadaMensajeActual();

    setFechaMensajeTemporal(formatearDiaMensajeUsuario(fechaBase));
    setHoraMensajeTemporal(formatearHoraMensajeUsuario(fechaBase));
    setErrorFechaMensajeTemporal(null);
    setSelectorFechaMensajeVisible(true);
  };
  const cancelarSelectorFechaMensaje = () => {
    setSelectorFechaMensajeVisible(false);
    setErrorFechaMensajeTemporal(null);
  };
  const confirmarSelectorFechaMensaje = () => {
    const fechaSeleccionada = convertirFechaMensajeUsuario(
      fechaMensajeTemporal,
      horaMensajeTemporal,
    );

    if (!fechaSeleccionada) {
      setErrorFechaMensajeTemporal("Introduce una fecha válida en formato DD/MM/AAAA y una hora HH:mm.");
      return;
    }

    if (fechaSeleccionada.getTime() < Date.now() - 60_000) {
      setErrorFechaMensajeTemporal("Elige una fecha y hora futuras.");
      return;
    }

    setFechaMensaje(formatearFechaMensajeTecnica(fechaSeleccionada));
    setSelectorFechaMensajeVisible(false);
    setErrorFechaMensajeTemporal(null);
  };

  const enviarMensaje = async () => {
    if (guardandoMensaje) {
      return;
    }

    if (!asuntoMensaje.trim()) {
      Alert.alert("Asunto obligatorio", "Escribe el asunto del mensaje.");
      return;
    }

    if (!textoMensaje.trim()) {
      Alert.alert("Texto obligatorio", "Escribe el contenido del mensaje.");
      return;
    }

    if (audienciaMensaje === "INDIVIDUAL" && totalDestinatariosMensaje === 0) {
      Alert.alert(
        "Destinatario obligatorio",
        "Selecciona al menos una persona para enviar un mensaje individual.",
      );
      return;
    }

    const fechaProgramada = normalizarFechaProgramadaMensaje();

    if (tipoProgramacionMensaje !== "AHORA" && !fechaProgramada) {
      Alert.alert(
        "Fecha no válida",
        "Selecciona una fecha y hora válidas para programar el envío.",
      );
      return;
    }

    const fechaProgramadaDate =
      tipoProgramacionMensaje !== "AHORA" && fechaProgramada
        ? new Date(fechaProgramada)
        : null;

    if (
      fechaProgramadaDate &&
      fechaProgramadaDate.getTime() < Date.now() - 60_000
    ) {
      Alert.alert("Fecha pasada", "Elige una fecha y hora futuras.");
      return;
    }

    const frecuenciaEnvio =
      tipoProgramacionMensaje === "RECURRENTE" ? frecuenciaMensaje : "NINGUNA";

    if (
      tipoProgramacionMensaje === "RECURRENTE" &&
      frecuenciaEnvio === "NINGUNA"
    ) {
      Alert.alert(
        "Frecuencia obligatoria",
        "Elige cada cuánto se enviará esta automatización.",
      );
      return;
    }

    const automatico = tipoProgramacionMensaje !== "AHORA";
    const estado: EstadoMensajeApp =
      tipoProgramacionMensaje === "RECURRENTE"
        ? "ACTIVO"
        : tipoProgramacionMensaje === "FECHA"
          ? "PROGRAMADO"
          : "ENVIADO";
    const destinatarioIds =
      audienciaMensaje === "INDIVIDUAL"
        ? destinatariosSeleccionadosMensaje.map((usuario) => usuario.id)
        : [];
    const segmentoLabel = obtenerEtiquetaAudiencia(
      audienciaMensaje,
      totalDestinatariosMensaje,
    );
    const ahoraMensaje = Date.now();
    const mensajeTemporalId = `manual-${ahoraMensaje}`;

    const nuevoMensaje: MensajeApp = {
      id: mensajeTemporalId,
      asunto: limpiarAsuntoConversacion(asuntoMensaje),
      texto: textoMensaje.trim(),
      automatico,
      conversacionId: mensajeTemporalId,
      audiencia: audienciaMensaje,
      fecha:
        tipoProgramacionMensaje === "AHORA"
          ? "Ahora"
          : formatearFechaMensaje(fechaProgramada),
      fechaOrden: fechaProgramada
        ? obtenerTimestampMensaje(fechaProgramada)
        : ahoraMensaje,
      fechaProgramada: fechaProgramada || undefined,
      frecuencia: frecuenciaEnvio,
      prioridad: prioridadMensaje,
      tipoProgramacion: tipoProgramacionMensaje,
      estado,
      leido: false,
      remitente: usuarioActivo?.nombre || "Administración",
      remitenteId: usuarioActivo?.id,
      destinatarioIds,
      destinatariosCount: totalDestinatariosMensaje,
      segmentoLabel,
    };

    setGuardandoMensaje(true);

    try {
      const mensajeBackend = await crearMensajeApi({
        asunto: nuevoMensaje.asunto,
        texto: nuevoMensaje.texto,
        automatico,
        audiencia: audienciaMensaje,
        tipoProgramacion: tipoProgramacionMensaje,
        frecuencia: frecuenciaEnvio,
        prioridad: prioridadMensaje,
        fechaProgramada,
        destinatarioIds,
      });
      const mensajeFinal = mapearMensajeBackend(mensajeBackend);

      setMensajesCreados((mensajesActuales) => [
        mensajeFinal,
        ...mensajesActuales,
      ]);
      limpiarFormularioMensaje();
      setFiltroMensajes("TODOS");
      setModoMensajesAdmin(automatico ? "AUTOMATIZACIONES" : "BANDEJA");
      setOrigenNuevoMensajeAdmin(null);

      Alert.alert(
        automatico ? "Automatización creada" : "Mensaje enviado",
        automatico
          ? "El mensaje queda preparado en el calendario de comunicaciones."
          : "El mensaje aparece ya en la bandeja de sus destinatarios.",
      );
    } catch {
      Alert.alert(
        automatico ? "No se pudo crear" : "No se pudo enviar",
        "No se pudo completar la operación. Revisa la conexión y vuelve a intentarlo.",
      );
    } finally {
      setGuardandoMensaje(false);
    }
  };

  const abrirCompositorMensajeUsuario = () => {
    if (!mensajesUsuariosPermitidosApp) {
      Alert.alert(
        "Mensajes desactivados",
        "Administración todavía no ha abierto el canal de mensajes.",
      );
      return;
    }

    limpiarFormularioMensaje();
    setFeedbackMensajesCliente(null);
    setModoMensajesUsuario("NUEVO");
  };

  const enviarMensajeUsuarioAdmin = async () => {
    if (guardandoMensaje) {
      return;
    }

    if (!mensajesUsuariosPermitidosApp) {
      Alert.alert(
        "Mensajes desactivados",
        "Administración todavía no permite enviar mensajes desde tu perfil.",
      );
      return;
    }

    if (!asuntoMensaje.trim()) {
      Alert.alert("Asunto obligatorio", "Escribe el asunto del mensaje.");
      return;
    }

    if (!textoMensaje.trim()) {
      Alert.alert("Mensaje obligatorio", "Escribe el contenido del mensaje.");
      return;
    }

    if (!usuarioActivo?.id || !gimnasioActual?.id) {
      Alert.alert("Sesión no disponible", "Vuelve a iniciar sesión.");
      return;
    }

    const destinatarioIds = adminsGimnasio.map((admin) => admin.id);

    if (destinatarioIds.length === 0) {
      Alert.alert(
        "Sin administradores",
        "No hay un administrador activo al que enviar este mensaje.",
      );
      return;
    }

    const ahoraMensaje = Date.now();
    const mensajeTemporalId = `usuario-${ahoraMensaje}`;

    const nuevoMensaje: MensajeApp = {
      id: mensajeTemporalId,
      asunto: limpiarAsuntoConversacion(asuntoMensaje),
      texto: textoMensaje.trim(),
      automatico: false,
      conversacionId: mensajeTemporalId,
      audiencia: "INDIVIDUAL",
      fecha: "Ahora",
      fechaOrden: ahoraMensaje,
      frecuencia: "NINGUNA",
      prioridad: "NORMAL",
      tipoProgramacion: "AHORA",
      estado: "ENVIADO",
      leido: true,
      remitente: usuarioActivo.nombre || "Usuario",
      remitenteId: usuarioActivo.id,
      destinatarioIds,
      destinatariosCount: destinatarioIds.length,
      segmentoLabel: "Administración",
    };

    setGuardandoMensaje(true);

    try {
      let mensajeFinal = nuevoMensaje;

      const mensajeBackend = await crearMensajeApi({
        asunto: nuevoMensaje.asunto,
        texto: nuevoMensaje.texto,
        automatico: false,
        audiencia: "INDIVIDUAL",
        tipoProgramacion: "AHORA",
        frecuencia: "NINGUNA",
        prioridad: "NORMAL",
        fechaProgramada: null,
        destinatarioIds,
      });

      mensajeFinal = { ...mapearMensajeBackend(mensajeBackend), leido: true };

      setMensajesCreados((mensajesActuales) => [
        mensajeFinal,
        ...mensajesActuales,
      ]);
      limpiarFormularioMensaje();
      setModoMensajesUsuario("BANDEJA");
      setBuzonMensajes("ENVIADOS");
      setFiltroMensajes("TODOS");
      setFeedbackMensajesCliente({
        tipo: "success",
        texto: "Mensaje enviado. Administración lo verá en su bandeja.",
      });
    } catch (error) {
      console.error(error);
      setFeedbackMensajesCliente({
        tipo: "error",
        texto: "No se pudo enviar. Revisa tu conexión o vuelve a intentarlo.",
      });
    } finally {
      setGuardandoMensaje(false);
    }
  };

  const enviarRespuestaMensaje = async () => {
    if (guardandoRespuestaMensaje || !mensajeSeleccionado) {
      return;
    }

    if (!puedeResponderMensaje) {
      Alert.alert(
        "Respuesta no disponible",
        "Este mensaje no admite respuesta desde tu perfil.",
      );
      return;
    }

    if (!respuestaMensaje.trim()) {
      Alert.alert("Mensaje obligatorio", "Escribe una respuesta.");
      return;
    }

    if (!usuarioActivo?.id || !gimnasioActual?.id) {
      Alert.alert("Sesión no disponible", "Vuelve a iniciar sesión.");
      return;
    }

    const mensajeSeleccionadoIdNumerico = Number(mensajeSeleccionado.id);
    const asuntoRespuesta = limpiarAsuntoConversacion(mensajeSeleccionado.asunto);
    const conversacionId = obtenerClaveConversacion(mensajeSeleccionado);
    const ahoraMensaje = Date.now();
    const nuevoMensaje: MensajeApp = {
      id: `respuesta-${ahoraMensaje}`,
      asunto: asuntoRespuesta,
      texto: respuestaMensaje.trim(),
      automatico: false,
      conversacionId,
      mensajePadreId: Number.isFinite(mensajeSeleccionadoIdNumerico)
        ? mensajeSeleccionadoIdNumerico
        : undefined,
      audiencia: "INDIVIDUAL",
      fecha: "Ahora",
      fechaOrden: ahoraMensaje,
      frecuencia: "NINGUNA",
      prioridad: "NORMAL",
      tipoProgramacion: "AHORA",
      estado: "ENVIADO",
      leido: true,
      remitente: usuarioActivo.nombre || "Usuario",
      remitenteId: usuarioActivo.id,
      destinatarioIds: destinatariosRespuestaMensaje,
      destinatariosCount: destinatariosRespuestaMensaje.length,
      segmentoLabel:
        destinatariosRespuestaMensaje.length === 1
          ? "1 destinatario"
          : `${destinatariosRespuestaMensaje.length} destinatarios`,
    };

    setGuardandoRespuestaMensaje(true);

    try {
      const mensajeBackend = await crearMensajeApi({
        asunto: nuevoMensaje.asunto,
        texto: nuevoMensaje.texto,
        automatico: false,
        conversacionId,
        mensajePadreId: nuevoMensaje.mensajePadreId,
        audiencia: "INDIVIDUAL",
        tipoProgramacion: "AHORA",
        frecuencia: "NINGUNA",
        prioridad: "NORMAL",
        fechaProgramada: null,
        destinatarioIds: destinatariosRespuestaMensaje,
      });

      const mensajeFinal = { ...mapearMensajeBackend(mensajeBackend), leido: true };

      solicitarScrollChatAlFinal(true);
      setMensajesCreados((mensajesActuales) => [
        mensajeFinal,
        ...mensajesActuales,
      ]);
      setRespuestaMensaje("");
      setBuzonMensajes("TODOS");
      setFeedbackMensajesCliente({
        tipo: "success",
        texto: "Respuesta enviada. La conversación se ha actualizado.",
      });
    } catch (error) {
      console.error(error);
      setFeedbackMensajesCliente({
        tipo: "error",
        texto: "No se pudo responder. Revisa tu conexión o los permisos.",
      });
    } finally {
      setGuardandoRespuestaMensaje(false);
    }
  };

  const pausarAutomatizacionMensaje = async (mensaje: MensajeApp) => {
    setMensajesCreados((mensajesActuales) =>
      mensajesActuales.map((mensajeActual) =>
        mensajeActual.id === mensaje.id
          ? { ...mensajeActual, estado: "PAUSADO" }
          : mensajeActual,
      ),
    );

    const mensajeId = Number(mensaje.id);

    if (!Number.isNaN(mensajeId)) {
      try {
        await pausarMensajeApi(mensajeId);
      } catch (error) {
        console.warn("Automatización pausada solo en la sesión local.", error);
      }
    }
  };

  const reanudarAutomatizacionMensaje = async (mensaje: MensajeApp) => {
    const estadoReanudado: EstadoMensajeApp =
      mensaje.tipoProgramacion === "RECURRENTE" ? "ACTIVO" : "PROGRAMADO";

    setMensajesCreados((mensajesActuales) =>
      mensajesActuales.map((mensajeActual) =>
        mensajeActual.id === mensaje.id
          ? { ...mensajeActual, estado: estadoReanudado }
          : mensajeActual,
      ),
    );

    const mensajeId = Number(mensaje.id);

    if (!Number.isNaN(mensajeId)) {
      try {
        const mensajeActualizado = await reanudarMensajeApi(mensajeId);
        const mensajeMapeado = mapearMensajeBackend(mensajeActualizado);

        setMensajesCreados((mensajesActuales) =>
          mensajesActuales.map((mensajeActual) =>
            mensajeActual.id === mensaje.id ? mensajeMapeado : mensajeActual,
          ),
        );
      } catch (error) {
        console.warn("Automatizacion reanudada solo en la sesion local.", error);
      }
    }
  };

  const eliminarAutomatizacionMensaje = (mensaje: MensajeApp) => {
    Alert.alert(
      "Eliminar automatizacion",
      "Esta regla dejara de ejecutarse y desaparecera del panel.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setMensajesCreados((mensajesActuales) =>
              mensajesActuales.filter(
                (mensajeActual) => mensajeActual.id !== mensaje.id,
              ),
            );

            const mensajeId = Number(mensaje.id);

            if (!Number.isNaN(mensajeId)) {
              try {
                await eliminarMensajeApi(mensajeId);
              } catch (error) {
                console.warn(
                  "Automatizacion eliminada solo en la sesion local.",
                  error,
                );
              }
            }
          },
        },
      ],
    );
  };

  const abrirSeccionAdmin = (seccion: SeccionAdmin) => {
    if (guardandoConfiguracionGimnasio) {
      return;
    }
    if (origenNuevoMensajeAdmin && seccion !== "MENSAJES") {
      limpiarFormularioMensaje();
      setModoMensajesAdmin("BANDEJA");
      setOrigenNuevoMensajeAdmin(null);
    }
    setSeccionAdmin(seccion);
    setBusquedaUsuarios("");
    if (seccion !== "CLIENTES") {
      setFiltroClientes("TODOS");
      setClienteAdminSeleccionadoId(null);
    }
    if (seccion !== "ENTRENADORES") {
      setFiltroEntrenadores("TODOS");
      setEntrenadorAdminSeleccionadoId(null);
    }
    if (seccion !== "CLASES") {
      setBusquedaClasesAdmin("");
      setGrupoClaseAdminSeleccionado(null);
      setGrupoClaseEditandoKey(null);
      setModoClasesAdmin("CREADAS");
    }
    if (seccion !== "RESERVAS") {
      setBusquedaReservasAdmin("");
      setFiltroReservasAdmin("ACTIVAS");
      setSesionReservaAdminSeleccionadaId(null);
    }
  };

  const confirmarSalidaFormularioClase = (onConfirm: () => void) => {
    if (guardandoClaseAdmin || subiendoImagen === "clase") {
      return;
    }

    Alert.alert(
      "Descartar cambios",
      "Los datos introducidos en la clase no se guardarán.",
      [
        { text: "Seguir editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: onConfirm,
        },
      ],
    );
  };

  const solicitarAbrirSeccionAdmin = (seccion: SeccionAdmin) => {
    const continuar = () => abrirSeccionAdmin(seccion);

    if (seccionAdmin === "CLASES" && seccion !== "CLASES") {
      if (modoClasesAdmin === "CREAR" || modoClasesAdmin === "EDITAR") {
        confirmarSalidaFormularioClase(continuar);
        return;
      }
      if (guardandoClaseAdmin) {
        return;
      }
    }

    if (seccionAdmin === "RUTINAS" && seccion !== "RUTINAS") {
      if (guardandoRutinaEntrenador) {
        return;
      }
      if (modoRutinasEntrenador === "FORMULARIO") {
        confirmarDescartarFormularioRutina(continuar);
        return;
      }
      if (modoRutinasEntrenador === "EJERCICIOS") {
        confirmarDescartarEjercicioRutina(continuar);
        return;
      }
    }

    if (seccionAdmin === "PAGOS" && seccion !== "PAGOS") {
      const guard = adminPaymentsExitGuardRef.current;
      if (guard) {
        guard(continuar);
        return;
      }
    }

    if (seccionAdmin === "PERSONALIZAR" && seccion !== "PERSONALIZAR") {
      const guard = adminSettingsExitGuardRef.current;
      if (guard) {
        guard(continuar);
        return;
      }
    }

    continuar();
  };

  const abrirAltaUsuario = (
    role: RolNuevoUsuario,
    origin: Exclude<SeccionAdmin, "CREAR_USUARIO">,
  ) => {
    setRolUsuario(role);
    setOrigenAltaUsuario(origin);
    abrirSeccionAdmin("CREAR_USUARIO");
  };

  const actualizarUsuarioCreado = (usuarioCreado: AdminCreatedUser) => {
    setUsuarios((usuariosActuales) =>
      usuariosActuales.some((usuario) => usuario.id === usuarioCreado.id)
        ? usuariosActuales.map((usuario) =>
            usuario.id === usuarioCreado.id
              ? { ...usuario, ...usuarioCreado }
              : usuario,
          )
        : [...usuariosActuales, usuarioCreado],
    );
  };

  const abrirFichaUsuarioCreado = (usuarioCreado: AdminCreatedUser) => {
    if (usuarioCreado.rol === "CLIENTE") {
      abrirSeccionAdmin("CLIENTES");
      setClienteAdminSeleccionadoId(usuarioCreado.id);
      return;
    }
    abrirSeccionAdmin("ENTRENADORES");
    setEntrenadorAdminSeleccionadoId(usuarioCreado.id);
  };

  const volverAlListadoUsuarioCreado = () => {
    abrirSeccionAdmin(rolUsuario === "CLIENTE" ? "CLIENTES" : "ENTRENADORES");
  };

  const obtenerIniciales = (nombre?: string) => {
    const iniciales = (nombre || "GymFlow")
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join("")
      .toUpperCase();

    return iniciales || "GF";
  };

  const obtenerTextoErrorApi = (error: unknown, fallback: string) => {
    if (!(error instanceof Error) || !error.message) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(error.message);
      return parsed.message || parsed.detail || parsed.error || fallback;
    } catch {
      return error.message || fallback;
    }
  };

  const actualizarUsuarioEnEstado = (usuarioActualizado: any) => {
    setUsuarioLogueado((usuarioActual: any) => ({
      ...usuarioActual,
      ...usuarioActualizado,
      token: usuarioActual?.token,
    }));

    setUsuarios((usuariosActuales) =>
      usuariosActuales.some((usuario) => usuario.id === usuarioActualizado.id)
        ? usuariosActuales.map((usuario) =>
            usuario.id === usuarioActualizado.id
              ? { ...usuario, ...usuarioActualizado }
              : usuario,
          )
        : [...usuariosActuales, usuarioActualizado],
    );
  };

  const abrirDatosPersonalesPerfil = () => {
    setPerfilNombreForm(usuarioActivo?.nombre || "");
    setPerfilEmailForm(usuarioActivo?.email || "");
    setFeedbackCuentaCliente(null);
    setModoPerfilCliente("DATOS_PERSONALES");
  };

  const abrirPasswordPerfil = () => {
    setPasswordActualCuenta("");
    setPasswordNuevaCuenta("");
    setPasswordConfirmacionCuenta("");
    setMostrarPasswordActualCuenta(false);
    setMostrarPasswordNuevaCuenta(false);
    setMostrarPasswordConfirmacionCuenta(false);
    setFeedbackCuentaCliente(null);
    setModoPerfilCliente("PASSWORD");
  };

  const volverResumenPerfil = () => {
    setFeedbackCuentaCliente(null);
    setModoPerfilCliente("RESUMEN");
  };

  const guardarDatosPersonalesPerfil = async () => {
    const nombre = perfilNombreForm.trim();
    const email = perfilEmailForm.trim().toLowerCase();

    if (nombre.length < 2) {
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: "El nombre debe tener al menos 2 caracteres.",
      });
      return;
    }

    if (nombre.length > 80) {
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: "El nombre no puede superar 80 caracteres.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: "Escribe un email válido.",
      });
      return;
    }

    setGuardandoPerfilCliente(true);
    setFeedbackCuentaCliente(null);

    try {
      const usuarioActualizado = await actualizarMiPerfilApi({ nombre, email });
      actualizarUsuarioEnEstado(usuarioActualizado);
      setPerfilNombreForm(usuarioActualizado.nombre || nombre);
      setPerfilEmailForm(usuarioActualizado.email || email);
      setFeedbackCuentaCliente({
        tipo: "success",
        texto: "Datos personales actualizados.",
      });
    } catch (error) {
      console.error(error);
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: obtenerTextoErrorApi(
          error,
          "No se pudieron guardar los datos personales.",
        ),
      });
    } finally {
      setGuardandoPerfilCliente(false);
    }
  };

  const guardarPasswordPerfil = async () => {
    if (!passwordActualCuenta.trim()) {
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: "Escribe tu contraseña actual.",
      });
      return;
    }

    if (passwordNuevaCuenta.length < 6) {
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    if (passwordNuevaCuenta.length > 72) {
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: "La nueva contraseña no puede superar 72 caracteres.",
      });
      return;
    }

    if (passwordNuevaCuenta !== passwordConfirmacionCuenta) {
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: "La nueva contraseña y la confirmación no coinciden.",
      });
      return;
    }

    setGuardandoPasswordCliente(true);
    setFeedbackCuentaCliente(null);

    try {
      const usuarioActualizado = await cambiarMiPasswordApi({
        passwordActual: passwordActualCuenta,
        passwordNueva: passwordNuevaCuenta,
      });
      actualizarUsuarioEnEstado(usuarioActualizado);
      setPasswordActualCuenta("");
      setPasswordNuevaCuenta("");
      setPasswordConfirmacionCuenta("");
      setFeedbackCuentaCliente({
        tipo: "success",
        texto: "Contraseña actualizada correctamente.",
      });
    } catch (error) {
      console.error(error);
      setFeedbackCuentaCliente({
        tipo: "error",
        texto: obtenerTextoErrorApi(
          error,
          "No se pudo cambiar la contraseña.",
        ),
      });
    } finally {
      setGuardandoPasswordCliente(false);
    }
  };

  const limpiarFormularioRutinaEntrenador = () => {
    setRutinaFormNombre("");
    setRutinaFormDescripcion("");
    setRutinaFormNivel("");
    setRutinaFormDuracion("");
  };

  const prepararNuevaRutinaEntrenador = () => {
    limpiarFormularioRutinaEntrenador();
    setRutinaEntrenadorSeleccionadaId(null);
    setAsignacionesRutinaEntrenador([]);
    setFeedbackRutinasEntrenador(null);
    setModoRutinasEntrenador("FORMULARIO");
  };

  const prepararEditarRutinaEntrenador = () => {
    if (!rutinaEntrenadorSeleccionada) {
      return;
    }

    setRutinaFormNombre(rutinaEntrenadorSeleccionada.nombre || "");
    setRutinaFormDescripcion(rutinaEntrenadorSeleccionada.descripcion || "");
    setRutinaFormNivel(rutinaEntrenadorSeleccionada.nivel || "");
    setRutinaFormDuracion(
      rutinaEntrenadorSeleccionada.duracionEstimadaMinutos
        ? String(rutinaEntrenadorSeleccionada.duracionEstimadaMinutos)
        : "",
    );
    setFeedbackRutinasEntrenador(null);
    setModoRutinasEntrenador("FORMULARIO");
  };

  const tieneCambiosFormularioRutina = () => {
    const rutinaBase = rutinaEntrenadorSeleccionadaId
      ? rutinasEntrenador.find(
          (rutina) => rutina.id === rutinaEntrenadorSeleccionadaId,
        )
      : null;

    return (
      rutinaFormNombre.trim() !== (rutinaBase?.nombre || "").trim() ||
      rutinaFormDescripcion.trim() !==
        (rutinaBase?.descripcion || "").trim() ||
      rutinaFormNivel.trim() !== (rutinaBase?.nivel || "").trim() ||
      rutinaFormDuracion.trim() !==
        (rutinaBase?.duracionEstimadaMinutos
          ? String(rutinaBase.duracionEstimadaMinutos)
          : "")
    );
  };

  const confirmarDescartarFormularioRutina = (onConfirm: () => void) => {
    if (!tieneCambiosFormularioRutina()) {
      onConfirm();
      return;
    }

    Alert.alert(
      "Descartar cambios",
      "Hay cambios sin guardar en la rutina. ¿Quieres salir sin guardarlos?",
      [
        { text: "Seguir editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: onConfirm },
      ],
    );
  };

  const guardarRutinaEntrenador = async () => {
    if (guardandoRutinaEntrenador) {
      return;
    }

    const nombre = rutinaFormNombre.trim();
    const descripcion = rutinaFormDescripcion.trim();
    const nivel = rutinaFormNivel.trim();
    const duracion = rutinaFormDuracion.trim();
    const duracionNumero = duracion ? Number(duracion) : null;

    if (!nombre) {
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto: "El nombre de la rutina es obligatorio.",
      });
      return;
    }

    if (
      duracion &&
      (duracionNumero == null ||
        Number.isNaN(duracionNumero) ||
        duracionNumero <= 0)
    ) {
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto: "La duración estimada debe ser un número mayor que cero.",
      });
      return;
    }

    setGuardandoRutinaEntrenador(true);
    setFeedbackRutinasEntrenador(null);

    try {
      const datosRutina = {
        nombre,
        descripcion: descripcion || null,
        nivel: nivel || null,
        duracionEstimadaMinutos: duracionNumero,
      };
      const rutinaGuardada = rutinaEntrenadorSeleccionadaId
        ? await actualizarRutinaApi(rutinaEntrenadorSeleccionadaId, datosRutina)
        : await crearRutinaApi(datosRutina);

      setRutinasEntrenador((rutinasActuales) => {
        const existe = rutinasActuales.some(
          (rutina) => rutina.id === rutinaGuardada.id,
        );

        if (!existe) {
          return [rutinaGuardada, ...rutinasActuales];
        }

        return rutinasActuales.map((rutina) =>
          rutina.id === rutinaGuardada.id ? rutinaGuardada : rutina,
        );
      });
      setRutinaEntrenadorSeleccionadaId(rutinaGuardada.id);
      setFeedbackRutinasEntrenador({
        tipo: "success",
        texto: rutinaEntrenadorSeleccionadaId
          ? "Rutina actualizada."
          : "Rutina creada. Ahora puedes añadir ejercicios.",
      });
      setModoRutinasEntrenador(
        rutinaEntrenadorSeleccionadaId ? "DETALLE" : "EJERCICIOS",
      );
      if (!rutinaEntrenadorSeleccionadaId) {
        setMostrarFormularioEjercicioRutina(true);
      }
    } catch (error) {
      console.error(error);
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la rutina.",
      });
    } finally {
      setGuardandoRutinaEntrenador(false);
    }
  };

  const desactivarRutinaEntrenador = () => {
    if (!rutinaEntrenadorSeleccionada) {
      return;
    }

    const creador =
      rutinaEntrenadorSeleccionada.nombreCreador?.trim() ||
      usuariosGimnasio.find(
        (usuario) => usuario.id === rutinaEntrenadorSeleccionada.creadorId,
      )?.nombre ||
      "Creador no disponible";
    const clientesAfectados =
      rutinaEntrenadorSeleccionada.totalAsignacionesActivas ??
      asignacionesRutinaEntrenador.filter(
        (asignacion) => asignacion.activa !== false,
      ).length;
    const mensajeDesactivacion =
      rolSeleccionado === "ADMIN" && seccionAdmin === "RUTINAS"
        ? `Se desactivará "${rutinaEntrenadorSeleccionada.nombre}", creada por ${creador}. ${pluralizar(
            clientesAfectados,
            "cliente afectado",
            "clientes afectados",
          )} ${clientesAfectados === 1 ? "perderá" : "perderán"} el acceso a esta rutina.`
        : `Se desactivará "${rutinaEntrenadorSeleccionada.nombre}" y sus asignaciones activas.`;

    Alert.alert(
      "Desactivar rutina",
      mensajeDesactivacion,
      [
        { text: "Mantener", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            setGuardandoRutinaEntrenador(true);
            try {
              await desactivarRutinaApi(rutinaEntrenadorSeleccionada.id);
              setRutinasEntrenador((rutinasActuales) =>
                rutinasActuales.filter(
                  (rutina) => rutina.id !== rutinaEntrenadorSeleccionada.id,
                ),
              );
              setRutinaEntrenadorSeleccionadaId(null);
              setAsignacionesRutinaEntrenador([]);
              setModoRutinasEntrenador("LISTA");
              setFeedbackRutinasEntrenador({
                tipo: "success",
                texto: "Rutina desactivada.",
              });
            } catch (error) {
              console.error(error);
              setFeedbackRutinasEntrenador({
                tipo: "error",
                texto:
                  error instanceof Error
                    ? error.message
                    : "No se pudo desactivar la rutina.",
              });
            } finally {
              setGuardandoRutinaEntrenador(false);
            }
          },
        },
      ],
    );
  };

  const duplicarRutinaEntrenador = () => {
    if (!rutinaEntrenadorSeleccionada) {
      return;
    }

    Alert.alert(
      "Duplicar rutina",
      `Se creará una copia independiente de "${rutinaEntrenadorSeleccionada.nombre}" sin alumnos asignados.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Duplicar",
          onPress: async () => {
            setGuardandoRutinaEntrenador(true);
            setFeedbackRutinasEntrenador(null);

            try {
              const ejerciciosOriginales = obtenerEjerciciosRutinaOrdenados(
                rutinaEntrenadorSeleccionada,
              );
              let rutinaDuplicada = await crearRutinaApi({
                nombre: `${rutinaEntrenadorSeleccionada.nombre} (copia)`.slice(0, 110),
                descripcion: rutinaEntrenadorSeleccionada.descripcion || null,
                nivel: rutinaEntrenadorSeleccionada.nivel || null,
                duracionEstimadaMinutos:
                  rutinaEntrenadorSeleccionada.duracionEstimadaMinutos || null,
              });
              for (const [index, item] of ejerciciosOriginales.entries()) {
                const ejercicioOriginal = item.ejercicio;

                if (!ejercicioOriginal?.id) {
                  throw new Error(
                    `No se pudo reutilizar el ejercicio ${index + 1} de la rutina original.`,
                  );
                }

                rutinaDuplicada = await agregarEjercicioARutinaApi(
                  rutinaDuplicada.id,
                  {
                    ejercicioId: ejercicioOriginal.id,
                    orden: index + 1,
                    series: item.series ?? null,
                    repeticiones: item.repeticiones || null,
                    descansoSegundos: item.descansoSegundos ?? null,
                    peso: item.peso != null && item.peso > 0 ? item.peso : null,
                    notas: item.notas || null,
                  },
                );
              }

              setRutinasEntrenador((rutinasActuales) => [
                rutinaDuplicada,
                ...rutinasActuales.filter(
                  (rutinaActual) => rutinaActual.id !== rutinaDuplicada.id,
                ),
              ]);
              setRutinaEntrenadorSeleccionadaId(rutinaDuplicada.id);
              setAsignacionesRutinaEntrenador([]);
              setModoRutinasEntrenador("DETALLE");
              setFeedbackRutinasEntrenador({
                tipo: "success",
                texto: "Rutina duplicada sin alumnos asignados.",
              });
            } catch (error) {
              console.error(error);
              setFeedbackRutinasEntrenador({
                tipo: "error",
                texto:
                  error instanceof Error
                    ? error.message
                    : "No se pudo duplicar la rutina.",
              });
            } finally {
              setGuardandoRutinaEntrenador(false);
            }
          },
        },
      ],
    );
  };

  function obtenerSnapshotActualEjercicioRutina(): EjercicioRutinaFormSnapshot {
    return {
      nombre: ejercicioFormNombre.trim(),
      descripcion: ejercicioFormDescripcion.trim(),
      tipoMultimedia: ejercicioFormTipoMultimedia,
      multimediaUrl: ejercicioFormMultimediaUrl.trim(),
      series: ejercicioFormSeries.trim(),
      repeticiones: ejercicioFormRepeticiones.trim(),
      descanso: ejercicioFormDescanso.trim(),
      peso: ejercicioFormPeso.trim(),
      notas: ejercicioFormNotas.trim(),
    };
  }

  function normalizarNumeroFormulario(valor: string) {
    return Number(valor.trim().replace(",", "."));
  }

  function esEnteroPositivo(valor: string) {
    const numero = normalizarNumeroFormulario(valor);
    return Number.isInteger(numero) && numero > 0;
  }

  function esEnteroNoNegativo(valor: string) {
    const numero = normalizarNumeroFormulario(valor);
    return Number.isInteger(numero) && numero >= 0;
  }

  function obtenerErroresEjercicioRutina(
    mostrarObligatorios: boolean,
  ): ErroresEjercicioRutina {
    const errores: ErroresEjercicioRutina = {};
    const nombre = ejercicioFormNombre.trim();
    const series = ejercicioFormSeries.trim();
    const repeticiones = ejercicioFormRepeticiones.trim();
    const descanso = ejercicioFormDescanso.trim();
    const peso = ejercicioFormPeso.trim();

    if (!nombre && mostrarObligatorios) {
      errores.nombre = "El nombre del ejercicio es obligatorio.";
    }

    if (!series && mostrarObligatorios) {
      errores.series = "Añade las series.";
    } else if (series && !esEnteroPositivo(series)) {
      errores.series = "Usa un número entero mayor que 0.";
    }

    if (!repeticiones && mostrarObligatorios) {
      errores.repeticiones = "Añade las repeticiones.";
    } else if (repeticiones && !esEnteroPositivo(repeticiones)) {
      errores.repeticiones = "Usa un número entero mayor que 0.";
    }

    if (descanso && !esEnteroNoNegativo(descanso)) {
      errores.descanso = "Usa segundos completos, 0 o más.";
    }

    if (peso) {
      const pesoNumero = normalizarNumeroFormulario(peso);
      if (Number.isNaN(pesoNumero) || pesoNumero <= 0) {
        errores.peso = "Déjalo vacío o usa kg mayores que 0.";
      }
    }

    if (
      ejercicioFormTipoMultimedia !== "NINGUNO" &&
      !ejercicioFormMultimediaUrl.trim() &&
      mostrarObligatorios
    ) {
      errores.multimedia = "Selecciona y sube un archivo o elimina la multimedia.";
    }

    return errores;
  }

  const limpiarFormularioEjercicioRutina = () => {
    const snapshotVacio = crearSnapshotEjercicioRutinaVacio();
    setEjercicioRutinaEditandoId(null);
    setEjercicioFormNombre(snapshotVacio.nombre);
    setEjercicioFormDescripcion(snapshotVacio.descripcion);
    setEjercicioFormTipoMultimedia(snapshotVacio.tipoMultimedia);
    setEjercicioFormMultimediaUrl(snapshotVacio.multimediaUrl);
    setEjercicioFormMultimediaLocalUri("");
    setEjercicioFormMultimediaNombre("");
    setEjercicioFormSeries(snapshotVacio.series);
    setEjercicioFormRepeticiones(snapshotVacio.repeticiones);
    setEjercicioFormDescanso(snapshotVacio.descanso);
    setEjercicioFormPeso(snapshotVacio.peso);
    setEjercicioFormNotas(snapshotVacio.notas);
    setEjercicioFormSnapshot(snapshotVacio);
    setMostrarErroresEjercicioRutina(false);
  };

  const prepararNuevoEjercicioRutina = () => {
    const snapshotVacio = crearSnapshotEjercicioRutinaVacio();
    setEjercicioRutinaEditandoId(null);
    setEjercicioFormNombre(snapshotVacio.nombre);
    setEjercicioFormDescripcion(snapshotVacio.descripcion);
    setEjercicioFormTipoMultimedia(snapshotVacio.tipoMultimedia);
    setEjercicioFormMultimediaUrl(snapshotVacio.multimediaUrl);
    setEjercicioFormMultimediaLocalUri("");
    setEjercicioFormMultimediaNombre("");
    setEjercicioFormSeries(snapshotVacio.series);
    setEjercicioFormRepeticiones(snapshotVacio.repeticiones);
    setEjercicioFormDescanso(snapshotVacio.descanso);
    setEjercicioFormPeso(snapshotVacio.peso);
    setEjercicioFormNotas(snapshotVacio.notas);
    setEjercicioFormSnapshot(snapshotVacio);
    setMostrarErroresEjercicioRutina(false);
    setFeedbackRutinasEntrenador(null);
    setMostrarFormularioEjercicioRutina(true);
  };

  const prepararEditarEjercicioRutina = (item: RutinaEjercicioApp) => {
    const snapshot: EjercicioRutinaFormSnapshot = {
      nombre: item.ejercicio?.nombre || "",
      descripcion: item.ejercicio?.descripcion || "",
      tipoMultimedia: item.ejercicio?.tipoMultimedia || "NINGUNO",
      multimediaUrl: item.ejercicio?.multimediaUrl || "",
      series: item.series != null ? String(item.series) : "",
      repeticiones: item.repeticiones || "",
      descanso:
        item.descansoSegundos != null ? String(item.descansoSegundos) : "",
      peso: item.peso != null && item.peso > 0 ? String(item.peso) : "",
      notas: item.notas || "",
    };

    setEjercicioRutinaEditandoId(item.id);
    setEjercicioFormNombre(snapshot.nombre);
    setEjercicioFormDescripcion(snapshot.descripcion);
    setEjercicioFormTipoMultimedia(snapshot.tipoMultimedia);
    setEjercicioFormMultimediaUrl(snapshot.multimediaUrl);
    setEjercicioFormMultimediaLocalUri("");
    setEjercicioFormMultimediaNombre("");
    setEjercicioFormSeries(snapshot.series);
    setEjercicioFormRepeticiones(snapshot.repeticiones);
    setEjercicioFormDescanso(snapshot.descanso);
    setEjercicioFormPeso(snapshot.peso);
    setEjercicioFormNotas(snapshot.notas);
    setEjercicioFormSnapshot(snapshot);
    setMostrarErroresEjercicioRutina(false);
    setFeedbackRutinasEntrenador(null);
    setMostrarFormularioEjercicioRutina(true);
  };

  const cerrarFormularioEjercicioRutina = () => {
    limpiarFormularioEjercicioRutina();
    setMostrarFormularioEjercicioRutina(false);
  };

  const confirmarDescartarEjercicioRutina = (onConfirm?: () => void) => {
    const descartar = () => {
      cerrarFormularioEjercicioRutina();
      onConfirm?.();
    };

    if (!mostrarFormularioEjercicioRutina || !ejercicioFormTieneCambios) {
      descartar();
      return;
    }

    Alert.alert(
      "Descartar cambios",
      "Hay cambios sin guardar en el ejercicio. ¿Quieres salir igualmente?",
      [
        { text: "Seguir editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: descartar,
        },
      ],
    );
  };

  const abrirEditorEjercicioRutina = (item: RutinaEjercicioApp) => {
    const abrir = () => prepararEditarEjercicioRutina(item);

    if (mostrarFormularioEjercicioRutina && ejercicioFormTieneCambios) {
      confirmarDescartarEjercicioRutina(abrir);
      return;
    }

    abrir();
  };

  const construirDatosEjercicioRutina = (ejercicioId?: number | null) => {
    const series = ejercicioFormSeries.trim();
    const descanso = ejercicioFormDescanso.trim();
    const peso = ejercicioFormPeso.trim();
    const datos: RutinaEjercicioRequest = {
      ejercicioId,
      series: series ? normalizarNumeroFormulario(series) : null,
      repeticiones: ejercicioFormRepeticiones.trim() || null,
      descansoSegundos: descanso ? normalizarNumeroFormulario(descanso) : null,
      peso: peso ? normalizarNumeroFormulario(peso) : null,
      notas: ejercicioFormNotas.trim() || null,
    };

    if (
      [datos.series, datos.descansoSegundos, datos.peso].some(
        (valor) => valor != null && Number.isNaN(valor),
      )
    ) {
      throw new Error("Series, descanso y peso deben ser números válidos.");
    }

    return datos;
  };

  const guardarEjercicioRutinaEntrenador = async () => {
    if (!rutinaEntrenadorSeleccionada) {
      return;
    }

    const nombre = ejercicioFormNombre.trim();
    const descripcion = ejercicioFormDescripcion.trim();
    const multimediaUrl = ejercicioFormMultimediaUrl.trim();

    if (!nombre) {
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto: "El nombre del ejercicio es obligatorio.",
      });
      return;
    }

    if (ejercicioFormTipoMultimedia !== "NINGUNO" && !multimediaUrl) {
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto: "Selecciona un archivo o elimina la multimedia.",
      });
      return;
    }

    setGuardandoRutinaEntrenador(true);
    setFeedbackRutinasEntrenador(null);

    try {
      const itemEditando = rutinaEntrenadorSeleccionada.ejercicios?.find(
        (item) => item.id === ejercicioRutinaEditandoId,
      );
      let ejercicioId = itemEditando?.ejercicio?.id || null;
      const datosEjercicio = {
        nombre,
        descripcion: descripcion || null,
        tipoMultimedia: ejercicioFormTipoMultimedia,
        multimediaUrl:
          ejercicioFormTipoMultimedia === "NINGUNO" ? null : multimediaUrl,
      };

      if (ejercicioId) {
        await actualizarEjercicioApi(ejercicioId, datosEjercicio);
      } else {
        const ejercicioCreado = await crearEjercicioApi(datosEjercicio);
        ejercicioId = ejercicioCreado.id;
        setEjerciciosDisponiblesRutina((ejerciciosActuales) => [
          ejercicioCreado,
          ...ejerciciosActuales,
        ]);
      }

      const datosRutinaEjercicio = construirDatosEjercicioRutina(ejercicioId);
      const rutinaActualizada = ejercicioRutinaEditandoId
        ? await actualizarEjercicioDeRutinaApi(
            rutinaEntrenadorSeleccionada.id,
            ejercicioRutinaEditandoId,
            datosRutinaEjercicio,
          )
        : await agregarEjercicioARutinaApi(
            rutinaEntrenadorSeleccionada.id,
            datosRutinaEjercicio,
          );

      setRutinasEntrenador((rutinasActuales) =>
        rutinasActuales.map((rutina) =>
          rutina.id === rutinaActualizada.id ? rutinaActualizada : rutina,
        ),
      );
      setRutinaEntrenadorSeleccionadaId(rutinaActualizada.id);
      setFeedbackRutinasEntrenador({
        tipo: "success",
        texto: ejercicioRutinaEditandoId
          ? "Ejercicio actualizado."
          : "Ejercicio añadido a la rutina.",
      });
      limpiarFormularioEjercicioRutina();
      setMostrarFormularioEjercicioRutina(false);
    } catch (error) {
      console.error(error);
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el ejercicio.",
      });
    } finally {
      setGuardandoRutinaEntrenador(false);
    }
  };

  const eliminarEjercicioRutinaEntrenador = (item: RutinaEjercicioApp) => {
    if (!rutinaEntrenadorSeleccionada) {
      return;
    }

    Alert.alert(
      "Eliminar ejercicio",
      `Se quitará "${item.ejercicio?.nombre || "este ejercicio"}" de la rutina.`,
      [
        { text: "Mantener", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setGuardandoRutinaEntrenador(true);
            try {
              const rutinaActualizada = await eliminarEjercicioDeRutinaApi(
                rutinaEntrenadorSeleccionada.id,
                item.id,
              );
              setRutinasEntrenador((rutinasActuales) =>
                rutinasActuales.map((rutina) =>
                  rutina.id === rutinaActualizada.id ? rutinaActualizada : rutina,
                ),
              );
              setFeedbackRutinasEntrenador({
                tipo: "success",
                texto: "Ejercicio eliminado.",
              });
            } catch (error) {
              console.error(error);
              setFeedbackRutinasEntrenador({
                tipo: "error",
                texto:
                  error instanceof Error
                    ? error.message
                    : "No se pudo eliminar el ejercicio.",
              });
            } finally {
              setGuardandoRutinaEntrenador(false);
            }
          },
        },
      ],
    );
  };

  const moverEjercicioRutinaEntrenador = async (
    item: RutinaEjercicioApp,
    direccion: "ARRIBA" | "ABAJO",
  ) => {
    if (!rutinaEntrenadorSeleccionada?.ejercicios?.length) {
      return;
    }

    const ejerciciosOrdenados = [...rutinaEntrenadorSeleccionada.ejercicios].sort(
      (a, b) => (a.orden || 0) - (b.orden || 0),
    );
    const indice = ejerciciosOrdenados.findIndex(
      (ejercicio) => ejercicio.id === item.id,
    );
    const indiceDestino = direccion === "ARRIBA" ? indice - 1 : indice + 1;

    if (indice < 0 || indiceDestino < 0 || indiceDestino >= ejerciciosOrdenados.length) {
      return;
    }

    const idsOrdenados = ejerciciosOrdenados.map((ejercicio) => ejercicio.id);
    [idsOrdenados[indice], idsOrdenados[indiceDestino]] = [
      idsOrdenados[indiceDestino],
      idsOrdenados[indice],
    ];

    setGuardandoRutinaEntrenador(true);
    try {
      const rutinaActualizada = await cambiarOrdenEjerciciosRutinaApi(
        rutinaEntrenadorSeleccionada.id,
        idsOrdenados,
      );
      setRutinasEntrenador((rutinasActuales) =>
        rutinasActuales.map((rutina) =>
          rutina.id === rutinaActualizada.id ? rutinaActualizada : rutina,
        ),
      );
    } catch (error) {
      console.error(error);
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar el orden.",
      });
    } finally {
      setGuardandoRutinaEntrenador(false);
    }
  };

  const abrirAsignacionRutinaEntrenador = async () => {
    if (!rutinaEntrenadorSeleccionada) {
      return;
    }

    await cargarDetalleRutinaEntrenador(rutinaEntrenadorSeleccionada.id, "ASIGNAR");
    setAlumnosRutinaSeleccionadosIds([]);
    setBusquedaAlumnosRutina("");
  };

  const guardarAsignacionRutinaEntrenador = async () => {
    if (guardandoRutinaEntrenador) {
      return;
    }

    if (!rutinaEntrenadorSeleccionada || alumnosRutinaSeleccionadosIds.length === 0) {
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto: "Selecciona al menos un alumno disponible.",
      });
      return;
    }

    setGuardandoRutinaEntrenador(true);
    setFeedbackRutinasEntrenador(null);

    try {
      await asignarRutinaApi(
        rutinaEntrenadorSeleccionada.id,
        alumnosRutinaSeleccionadosIds,
      );
      await cargarDetalleRutinaEntrenador(rutinaEntrenadorSeleccionada.id, "ASIGNAR");
      setAlumnosRutinaSeleccionadosIds([]);
      setFeedbackRutinasEntrenador({
        tipo: "success",
        texto: "Rutina asignada.",
      });
    } catch (error) {
      console.error(error);
      setFeedbackRutinasEntrenador({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo asignar la rutina.",
      });
    } finally {
      setGuardandoRutinaEntrenador(false);
    }
  };

  const retirarAsignacionRutinaEntrenador = (asignacion: RutinaAsignadaApp) => {
    Alert.alert(
      "Retirar asignación",
      `La rutina dejará de estar asignada a ${asignacion.nombreCliente || "este alumno"}.`,
      [
        { text: "Mantener", style: "cancel" },
        {
          text: "Retirar",
          style: "destructive",
          onPress: async () => {
            if (!rutinaEntrenadorSeleccionada) {
              return;
            }

            setGuardandoRutinaEntrenador(true);
            try {
              await retirarAsignacionRutinaApi(asignacion.id);
              await cargarDetalleRutinaEntrenador(
                rutinaEntrenadorSeleccionada.id,
                "ASIGNAR",
              );
              setFeedbackRutinasEntrenador({
                tipo: "success",
                texto: "Asignación retirada.",
              });
            } catch (error) {
              console.error(error);
              setFeedbackRutinasEntrenador({
                tipo: "error",
                texto:
                  error instanceof Error
                    ? error.message
                    : "No se pudo retirar la asignación.",
              });
            } finally {
              setGuardandoRutinaEntrenador(false);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    const gestionRutinasActiva =
      (rolSeleccionado === "ENTRENADOR" && seccionEntrenador === "RUTINAS") ||
      (rolSeleccionado === "ADMIN" && seccionAdmin === "RUTINAS");

    if (!gestionRutinasActiva || modoRutinasEntrenador === "LISTA") {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (modoRutinasEntrenador === "FORMULARIO") {
        confirmarDescartarFormularioRutina(() => {
          setModoRutinasEntrenador(
            rutinaEntrenadorSeleccionadaId ? "DETALLE" : "LISTA",
          );
        });
        return true;
      }

      if (modoRutinasEntrenador === "EJERCICIOS") {
        confirmarDescartarEjercicioRutina(() =>
          setModoRutinasEntrenador("DETALLE"),
        );
        return true;
      }

      if (modoRutinasEntrenador === "ASIGNAR") {
        setAlumnosRutinaSeleccionadosIds([]);
        setBusquedaAlumnosRutina("");
        setModoRutinasEntrenador("DETALLE");
        return true;
      }

      if (modoRutinasEntrenador === "CALCULADORA_1RM") {
        Keyboard.dismiss();
        setModoRutinasEntrenador("LISTA");
        return true;
      }

      setModoRutinasEntrenador("LISTA");
      setRutinaEntrenadorSeleccionadaId(null);
      return true;
    });

    return () => subscription.remove();
    // El handler se registra de nuevo con el estado actual del formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ejercicioFormTieneCambios,
    modoRutinasEntrenador,
    rolSeleccionado,
    rutinaEntrenadorSeleccionadaId,
    rutinaFormDescripcion,
    rutinaFormDuracion,
    rutinaFormNivel,
    rutinaFormNombre,
    seccionAdmin,
    seccionEntrenador,
  ]);

  useEffect(() => {
    if (Platform.OS !== "android" || rolSeleccionado !== "ADMIN") {
      return undefined;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (seccionAdmin === "GESTION") {
        abrirSeccionAdmin("INICIO");
        return true;
      }
      if (seccionAdmin === "CLIENTES") {
        if (clienteAdminSeleccionadoId != null) {
          setClienteAdminSeleccionadoId(null);
        } else {
          abrirSeccionAdmin("GESTION");
        }
        return true;
      }
      if (seccionAdmin === "INVITACIONES_CLIENTES") {
        abrirSeccionAdmin("CLIENTES");
        return true;
      }
      if (seccionAdmin === "ENTRENADORES") {
        if (entrenadorAdminSeleccionadoId != null) {
          setEntrenadorAdminSeleccionadoId(null);
        } else {
          abrirSeccionAdmin("GESTION");
        }
        return true;
      }
      if (seccionAdmin === "CLASES") {
        if (modoClasesAdmin === "CREAR" || modoClasesAdmin === "EDITAR") {
          confirmarSalidaFormularioClase(() => {
            const grupoKey = grupoClaseEditandoKey;
            resetearFormularioClase();
            setModoClasesAdmin("CREADAS");
            setGrupoClaseAdminSeleccionado(grupoKey);
          });
        } else if (grupoClaseAdminSeleccionado) {
          setGrupoClaseAdminSeleccionado(null);
        } else {
          abrirSeccionAdmin("GESTION");
        }
        return true;
      }
      if (seccionAdmin === "RESERVAS") {
        if (sesionReservaAdminSeleccionadaId != null) {
          setSesionReservaAdminSeleccionadaId(null);
        } else {
          abrirSeccionAdmin("GESTION");
        }
        return true;
      }
      if (seccionAdmin === "RUTINAS") {
        if (modoRutinasEntrenador !== "LISTA") {
          return false;
        }
        abrirSeccionAdmin("GESTION");
        return true;
      }
      if (seccionAdmin === "MENSAJES") {
        if (mensajeSeleccionadoId != null) {
          setMensajeSeleccionadoId(null);
          setFeedbackMensajesCliente(null);
        } else if (modoMensajesAdmin === "NUEVO") {
          volverDesdeNuevoMensajeAdmin();
        } else if (modoMensajesAdmin === "AUTOMATIZACIONES") {
          setModoMensajesAdmin("BANDEJA");
        } else {
          abrirSeccionAdmin("INICIO");
        }
        return true;
      }

      return false;
    });

    return () => subscription.remove();
    // El handler solo representa la jerarquía de navegación del rol ADMIN.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    clienteAdminSeleccionadoId,
    entrenadorAdminSeleccionadoId,
    grupoClaseAdminSeleccionado,
    grupoClaseEditandoKey,
    mensajeSeleccionadoId,
    modoClasesAdmin,
    modoMensajesAdmin,
    modoRutinasEntrenador,
    rolSeleccionado,
    seccionAdmin,
    sesionReservaAdminSeleccionadaId,
  ]);

  const abrirRutinaCliente = (asignacion: RutinaAsignadaApp) => {
    const rutinaId = asignacion.rutina?.id || asignacion.rutinaId;

    if (!rutinaId) {
      return;
    }

    setSeccionCliente("RUTINAS");
    setRutinaClienteSeleccionadaId(rutinaId);
    setModoRutinasCliente("DETALLE");
    setEntrenamientoClienteIndice(0);
    setEntrenamientoClienteCompletadosIds([]);
  };

  const empezarEntrenamientoCliente = (rutina: RutinaApp) => {
    const ejercicios = obtenerEjerciciosRutinaOrdenados(rutina);

    if (ejercicios.length === 0) {
      return;
    }

    setRutinaClienteSeleccionadaId(rutina.id);
    setEntrenamientoClienteIndice(0);
    setEntrenamientoClienteCompletadosIds([]);
    setModoRutinasCliente("ENTRENAMIENTO");
  };

  const toggleEjercicioEntrenamientoCliente = (ejercicioId: number) => {
    setEntrenamientoClienteCompletadosIds((idsActuales) =>
      idsActuales.includes(ejercicioId)
        ? idsActuales.filter((id) => id !== ejercicioId)
        : [...idsActuales, ejercicioId],
    );
  };

  const finalizarEntrenamientoCliente = () => {
    const hayPendientes =
      totalCompletadosEntrenamientoCliente < totalEjerciciosEntrenamientoCliente;

    if (!hayPendientes) {
      setModoRutinasCliente("COMPLETADA");
      return;
    }

    Alert.alert(
      "Aún quedan ejercicios sin completar",
      "¿Quieres finalizar la rutina?",
      [
        { text: "Continuar entrenando", style: "cancel" },
        {
          text: "Finalizar",
          onPress: () => setModoRutinasCliente("COMPLETADA"),
        },
      ],
    );
  };

  const confirmarSalidaEntrenamientoCliente = () => {
    Alert.alert(
      "¿Salir del entrenamiento?",
      "El progreso de esta sesión no se guardará todavía.",
      [
        { text: "Seguir entrenando", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => {
            setModoRutinasCliente("DETALLE");
            setEntrenamientoClienteIndice(0);
            setEntrenamientoClienteCompletadosIds([]);
          },
        },
      ],
    );
  };

  const renderBarraInferior = (enFlujo = false) => {
    if (tecladoVisible || esFlujoAltaUsuario) {
      return null;
    }

    if (rolSeleccionado === "ADMIN") {
      return (
        <View
          style={[
            styles.bottomDock,
            enFlujo && styles.bottomDockInFlow,
            {
              backgroundColor: appSecondarySurfaceColor,
              borderTopColor: appBorderColor,
              minHeight: bottomDockHeight,
              paddingBottom: bottomDockBottomInset,
            },
          ]}
        >
          <BottomDockButton
            icon="home-outline"
            label="Inicio"
            active={seccionAdmin === "INICIO"}
            onPress={() => solicitarAbrirSeccionAdmin("INICIO")}
          />
          <BottomDockButton
            icon="view-grid-outline"
            label="Gestión"
            active={SECCIONES_ADMIN_GESTION.has(seccionAdmin)}
            onPress={() => solicitarAbrirSeccionAdmin("GESTION")}
          />
          <BottomDockButton
            icon="message-text-outline"
            label="Mensajes"
            active={seccionAdmin === "MENSAJES"}
            badgeCount={mensajesNoLeidosBadge}
            onPress={() => solicitarAbrirSeccionAdmin("MENSAJES")}
          />
          <BottomDockButton
            icon="cog-outline"
            label="Ajustes"
            active={seccionAdmin === "PERSONALIZAR"}
            onPress={() => solicitarAbrirSeccionAdmin("PERSONALIZAR")}
          />
        </View>
      );
    }

    if (rolSeleccionado === "CLIENTE") {
      return (
        <View
          style={[
            styles.bottomDock,
            enFlujo && styles.bottomDockInFlow,
            {
              backgroundColor: appSecondarySurfaceColor,
              borderTopColor: appBorderColor,
              minHeight: bottomDockHeight,
              paddingBottom: bottomDockBottomInset,
            },
          ]}
        >
          <BottomDockButton
            icon="home-outline"
            label="Inicio"
            active={seccionCliente === "PANEL"}
            onPress={() => setSeccionCliente("PANEL")}
          />
          <BottomDockButton
            icon="calendar-star"
            label="Clases"
            active={seccionCliente === "CLASES"}
            onPress={() => setSeccionCliente("CLASES")}
          />
          <BottomDockButton
            icon="clipboard-check-outline"
            label="Reservas"
            active={seccionCliente === "RESERVAS"}
            onPress={() => setSeccionCliente("RESERVAS")}
          />
          <BottomDockButton
            icon="message-text-outline"
            label="Mensajes"
            active={seccionCliente === "MENSAJES"}
            badgeCount={mensajesNoLeidosBadge}
            onPress={() => setSeccionCliente("MENSAJES")}
          />
          <BottomDockButton
            icon="account-circle-outline"
            label="Perfil"
            active={seccionCliente === "PERFIL"}
            onPress={() => setSeccionCliente("PERFIL")}
          />
        </View>
      );
    }

    if (rolSeleccionado === "ENTRENADOR") {
      return (
        <View
          style={[
            styles.bottomDock,
            enFlujo && styles.bottomDockInFlow,
            {
              backgroundColor: appSecondarySurfaceColor,
              borderTopColor: appBorderColor,
              minHeight: bottomDockHeight,
              paddingBottom: bottomDockBottomInset,
            },
          ]}
        >
          <BottomDockButton
            icon="home-outline"
            label="Inicio"
            active={seccionEntrenador === "PANEL"}
            onPress={() => setSeccionEntrenador("PANEL")}
          />
          <BottomDockButton
            icon="calendar-clock"
            label="Clases"
            active={seccionEntrenador === "CLASES"}
            onPress={() => setSeccionEntrenador("CLASES")}
          />
          <BottomDockButton
            icon="arm-flex-outline"
            label="Rutinas"
            active={seccionEntrenador === "RUTINAS"}
            onPress={() => setSeccionEntrenador("RUTINAS")}
          />
          <BottomDockButton
            icon="message-text-outline"
            label="Mensajes"
            active={seccionEntrenador === "MENSAJES"}
            badgeCount={mensajesNoLeidosBadge}
            onPress={() => setSeccionEntrenador("MENSAJES")}
          />
          <BottomDockButton
            icon="account-circle-outline"
            label="Perfil"
            active={seccionEntrenador === "PERFIL"}
            onPress={() => setSeccionEntrenador("PERFIL")}
          />
        </View>
      );
    }

    return null;
  };

  function renderPreviewBottomBar(
    role: "ADMIN" | "ENTRENADOR" | "CLIENTE",
    theme: GymFlowTheme,
  ) {
    const tabs =
      role === "ADMIN"
        ? [
            ["home-outline", "Inicio"],
            ["view-grid-outline", "Gestión"],
            ["message-text-outline", "Mensajes"],
            ["cog-outline", "Ajustes"],
          ]
        : role === "ENTRENADOR"
          ? [
              ["home-outline", "Inicio"],
              ["calendar-clock", "Clases"],
              ["arm-flex-outline", "Rutinas"],
              ["message-text-outline", "Mensajes"],
              ["account-circle-outline", "Perfil"],
            ]
          : [
              ["home-outline", "Inicio"],
              ["calendar-star", "Clases"],
              ["clipboard-check-outline", "Reservas"],
              ["message-text-outline", "Mensajes"],
              ["account-circle-outline", "Perfil"],
            ];
    const dockColor = mezclarColores(theme.secondary, "#10151D", 0.78);

    return (
      <View
        style={[
          styles.bottomDock,
          {
            backgroundColor: dockColor,
            borderTopColor: colorConAlpha(theme.secondary, "42"),
            minHeight: bottomDockHeight,
            paddingBottom: bottomDockBottomInset,
          },
        ]}
      >
        {tabs.map(([icon, label], index) => (
          <BottomDockButton
            key={label}
            icon={icon as IconName}
            label={label}
            active={index === 0}
            primaryColor={theme.primary}
            textOnPrimary={theme.textOnPrimary}
            onPress={() => undefined}
          />
        ))}
      </View>
    );
  }

  function renderDashboardPreview({
    role,
    draft,
    theme,
  }: GymPreviewContext) {
    const backgroundUri = resolverUrlMedia(draft.imagenFondoUrl);
    const previewGymName = draft.nombre.trim() || nombreGimnasioApp;
    const previewWelcome =
      draft.textoBienvenida.trim() || "Gestiona tu gimnasio desde el móvil.";
    const previewClassImageUri = [...clasesActivasGimnasio]
      .sort((a, b) =>
        String(a.id).localeCompare(String(b.id), "es", { numeric: true }),
      )
      .map((clase) => resolverUrlMedia(clase.imagenUrl))
      .find((uri): uri is string => Boolean(uri)) ?? null;

    const previewContent =
      role === "ADMIN" ? (
        <AdminDashboard
          theme={theme}
          heroImageUri={backgroundUri}
          greeting="Buenos días"
          administratorName="Administrador"
          gymName={previewGymName}
          avatarUri={null}
          initials="AD"
          onAvatarPress={() => undefined}
          metrics={[
            { key: "classes", label: "Clases de hoy", value: 4, icon: "calendar-clock-outline", accent: "primary" },
            { key: "bookings", label: "Reservas de hoy", value: 8, icon: "bookmark-check-outline", accent: "secondary" },
            { key: "messages", label: "Mensajes sin leer", value: 2, icon: "message-badge-outline", accent: "primary" },
            { key: "payments", label: "Pagos pendientes", value: 3, icon: "receipt-clock-outline", accent: "secondary" },
          ]}
          quickActions={[
            { key: "create-class", title: "Crear clase", description: "Añade una clase y sus horarios", icon: "calendar-plus", accent: "primary", onPress: () => undefined },
            { key: "new-client", title: "Nuevo cliente", description: "Crea un acceso para un cliente", icon: "account-plus-outline", accent: "secondary", onPress: () => undefined },
            { key: "new-trainer", title: "Nuevo entrenador", description: "Incorpora a tu equipo", icon: "account-tie-hat-outline", accent: "primary", onPress: () => undefined },
            { key: "new-message", title: "Enviar comunicado", description: "Inicia un mensaje para tu comunidad", icon: "message-plus-outline", accent: "secondary", onPress: () => undefined },
          ]}
          priorities={[
            {
              key: "messages",
              title: "Mensajes sin leer",
              description: "2 mensajes requieren atención",
              icon: "message-badge-outline",
              onPress: () => undefined,
            },
            {
              key: "payments",
              title: "Pagos por revisar",
              description: "3 cobros pendientes o vencidos",
              icon: "receipt-clock-outline",
              onPress: () => undefined,
            },
          ]}
        />
      ) : role === "ENTRENADOR" ? (
        <PremiumScreenContainer theme={theme}>
          <DashboardHeroBackground imageUri={backgroundUri} theme={theme}>
            <View style={styles.trainerHomeHeader}>
              <View style={styles.trainerHomeHeaderCopy}>
                <Text style={[styles.clientHomeEyebrow, { color: theme.secondary }]}>{previewGymName}</Text>
                <Text style={[styles.clientHomeTitle, { color: theme.text }]}>Hola, Entrenador</Text>
                <Text style={[styles.clientHomeSubtitle, { color: theme.muted }]}>Revisa tu agenda y prepara la siguiente clase.</Text>
              </View>
              <PremiumAvatar initials="EN" size={52} theme={theme} />
            </View>
          </DashboardHeroBackground>
          <PremiumClassCard
            title="Movilidad y fuerza"
            subtitle="Sesión de ejemplo para comprobar la apariencia del panel."
            imageUri={previewClassImageUri}
            eyebrow="Próxima clase"
            statusLabel="8 alumnos"
            meta={[
              { icon: "calendar-month-outline", label: "Hoy" },
              { icon: "clock-outline", label: "18:00" },
              { icon: "timer-outline", label: "45 min" },
            ]}
            actionLabel="Ver clase"
            onAction={() => undefined}
            theme={theme}
          />
          <View style={styles.trainerHomeMetricsRow}>
            <PremiumMetricCard icon="calendar-today-outline" label="Clases hoy" value={3} theme={theme} />
            <PremiumMetricCard icon="arm-flex-outline" label="Rutinas" value={6} theme={theme} accent="secondary" />
            <PremiumMetricCard icon="message-text-outline" label="Mensajes nuevos" value={2} theme={theme} />
          </View>
          <PremiumSectionHeader title="Agenda de hoy" theme={theme} />
          <View style={styles.trainerTodayAgendaList}>
            {[
              ["09:00", "Pilates", "6 alumnos · 45 min"],
              ["18:00", "Movilidad y fuerza", "8 alumnos · 45 min"],
            ].map(([time, title, meta]) => (
              <PremiumCard key={`${time}-${title}`} theme={theme} style={styles.previewAgendaRow}>
                <Text style={[styles.previewAgendaTime, { color: theme.primary }]}>{time}</Text>
                <View style={styles.previewAgendaCopy}>
                  <Text style={[styles.previewAgendaTitle, { color: theme.text }]}>{title}</Text>
                  <Text style={[styles.previewAgendaMeta, { color: theme.muted }]}>{meta}</Text>
                </View>
              </PremiumCard>
            ))}
          </View>
        </PremiumScreenContainer>
      ) : (
        <PremiumScreenContainer theme={theme}>
          <DashboardHeroBackground imageUri={backgroundUri} theme={theme}>
            <View style={styles.clientHomeHeader}>
              <View style={styles.clientHomeHeaderCopy}>
                <Text style={[styles.clientHomeEyebrow, { color: theme.secondary }]}>{previewGymName}</Text>
                <Text style={[styles.clientHomeTitle, { color: theme.text }]}>Hola, Cliente</Text>
                <Text style={[styles.clientHomeSubtitle, { color: theme.muted }]}>{previewWelcome}</Text>
              </View>
              <PremiumAvatar initials="CL" size={52} theme={theme} />
            </View>
          </DashboardHeroBackground>
          <PremiumClassCard
            title="Pilates"
            subtitle="Una sesión de ejemplo para mejorar movilidad, fuerza y bienestar."
            imageUri={previewClassImageUri}
            eyebrow="Tu próxima reserva"
            statusLabel="Próxima clase"
            meta={[
              { icon: "calendar-month-outline", label: "Martes, 6 de agosto" },
              { icon: "clock-outline", label: "18:00" },
              { icon: "account-tie-outline", label: "Entrenador" },
            ]}
            actionLabel="Ver mi reserva"
            onAction={() => undefined}
            theme={theme}
          />
          <View style={styles.clientHomeMetricsRow}>
            <PremiumMetricCard icon="bookmark-check-outline" label="Reservas activas" value={2} theme={theme} />
            <PremiumMetricCard icon="message-text-outline" label="Mensajes nuevos" value={1} theme={theme} accent="secondary" />
          </View>
          <View style={styles.clientHomeMetricsRow}>
            <PremiumMetricCard icon="arm-flex-outline" label="Rutinas" value={2} theme={theme} />
            <PremiumMetricCard icon="receipt-text-outline" label="Pagos pendientes" value={0} theme={theme} accent="secondary" />
          </View>
          <PremiumSectionHeader title="Entrenamiento" theme={theme} />
          <PremiumCard theme={theme} style={styles.clientRoutineCard}>
            <View style={[styles.clientRoutineIcon, { backgroundColor: colorConAlpha(theme.primary, "14") }]}>
              <MaterialCommunityIcons name="arm-flex-outline" size={28} color={theme.primary} />
            </View>
            <View style={styles.clientRoutineCopy}>
              <Text style={[styles.clientRoutineTitle, { color: theme.text }]}>Rutina de ejemplo</Text>
              <Text style={[styles.clientRoutineText, { color: theme.muted }]}>Entrenamiento preparado para comprobar el estilo del panel.</Text>
            </View>
          </PremiumCard>
        </PremiumScreenContainer>
      );

    return (
      <View style={[styles.previewDashboardRoot, { backgroundColor: theme.background }]}>
        <ScrollView
          key={role}
          style={styles.previewDashboardScroll}
          contentContainerStyle={[
            styles.previewDashboardContent,
            { paddingBottom: bottomDockHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {previewContent}
        </ScrollView>
        {renderPreviewBottomBar(role, theme)}
      </View>
    );
  }

  function abrirMultimediaRutina(
    tipo: RutinaMultimediaActiva["tipo"],
    uri: string,
    titulo?: string | null,
  ) {
    const uriLimpia = uri.trim();

    if (!uriLimpia) {
      return;
    }

    setMultimediaRutinaActiva({
      tipo,
      uri: uriLimpia,
      titulo: titulo?.trim() || (tipo === "VIDEO" ? "Vídeo del ejercicio" : "Imagen del ejercicio"),
    });
  }

  function renderRutinaMultimediaModal() {
    if (!multimediaRutinaActiva) {
      return null;
    }

    const esVideo = multimediaRutinaActiva.tipo === "VIDEO";
    const mediaHeight = Math.min(Math.max(windowWidth * 1.05, 280), 560);

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMultimediaRutinaActiva(null)}
      >
        <SafeAreaView
          edges={["top", "bottom", "left", "right"]}
          style={styles.trainerMediaModalBackdrop}
        >
          <View
            style={[
              styles.trainerMediaModalCard,
              { backgroundColor: clienteHomeTheme.surface },
            ]}
          >
            <View style={styles.trainerMediaModalHeader}>
              <View style={styles.trainerMediaModalTitleCopy}>
                <Text style={styles.trainerMediaModalKicker}>
                  {esVideo ? "VÍDEO" : "IMAGEN"}
                </Text>
                <Text
                  style={[styles.trainerMediaModalTitle, { color: clienteHomeTheme.text }]}
                  numberOfLines={2}
                >
                  {multimediaRutinaActiva.titulo}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.trainerMediaModalClose,
                  { backgroundColor: clienteHomeTheme.surfaceSoft },
                ]}
                onPress={() => setMultimediaRutinaActiva(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar multimedia"
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={clienteHomeTheme.text}
                />
              </Pressable>
            </View>

            <View style={[styles.trainerMediaStage, { height: mediaHeight }]}>
              {esVideo ? (
                <Video
                  source={{ uri: multimediaRutinaActiva.uri }}
                  style={styles.trainerMediaVideo}
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
                  accessibilityLabel={`Reproductor de vídeo ${multimediaRutinaActiva.titulo}`}
                />
              ) : (
                <Image
                  source={{ uri: multimediaRutinaActiva.uri }}
                  style={styles.trainerMediaImageFull}
                  resizeMode="contain"
                  accessibilityLabel={`Imagen ampliada de ${multimediaRutinaActiva.titulo}`}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  function obtenerFechaKey(fechaHora?: string | null) {
    if (!fechaHora) {
      return "";
    }

    return fechaHora.split("T")[0];
  }

  function obtenerHora(fechaHora?: string | null) {
    if (!fechaHora) {
      return "--:--";
    }

    return fechaHora.split("T")[1]?.slice(0, 5) || "";
  }

  function formatearDia(fechaHora?: string | null) {
    if (!fechaHora) {
      return "Sin fecha";
    }

    const fecha = new Date(fechaHora);

    if (Number.isNaN(fecha.getTime())) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(fecha);
  }

  function formatearFechaCompleta(fechaHora?: string | null) {
    if (!fechaHora) {
      return "Sin fecha";
    }

    const fecha = new Date(fechaHora);

    if (Number.isNaN(fecha.getTime())) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(fecha);
  }

  const contarReservasActivasDeClase = (claseId: number) => {
    return obtenerReservasActivasDeClase(claseId).length;
  };

  const obtenerHuecosDisponibles = (clase: any) => {
    return clase.capacidadMaxima - contarReservasActivasDeClase(clase.id);
  };

  const crearClaveGrupoClase = (clase: any) => {
    if (clase.programacionId) {
      return `programacion:${clase.programacionId}`;
    }
    return [
      String(clase.nombre || "").trim().toLowerCase(),
      String(clase.descripcion || "").trim().toLowerCase(),
      clase.entrenadorId || "",
      clase.duracionMinutos || "",
      clase.capacidadMaxima || "",
      clase.imagenUrl || "",
    ].join("|");
  };

  const convertirDiaJsAIso = (diaSemana: number) =>
    diaSemana === 0 ? 7 : diaSemana;

  const convertirDiaIsoAJs = (diaSemana: number) =>
    diaSemana === 7 ? 0 : diaSemana;

  const obtenerReglasDeClase = (clase: any) => {
    if (Array.isArray(clase.reglasProgramacion)) {
      return clase.reglasProgramacion
        .map((regla: any) => ({
          diaSemana: Number(regla.diaSemana),
          hora: String(regla.hora || "").slice(0, 5),
        }))
        .filter(
          (regla: { diaSemana: number; hora: string }) =>
            regla.diaSemana >= 1 && regla.diaSemana <= 7 && !!regla.hora,
        );
    }
    const fecha = new Date(clase.fechaHora);
    if (Number.isNaN(fecha.getTime())) {
      return [];
    }
    return [
      {
        diaSemana: convertirDiaJsAIso(fecha.getDay()),
        hora: obtenerHora(clase.fechaHora),
      },
    ];
  };

  const ordenarSesiones = (sesiones: any[]) => {
    return [...sesiones].sort(
      (a, b) =>
        new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
    );
  };

  const agruparClases = (listaClases: any[]) => {
    const grupos = new Map<string, GrupoClase>();

    ordenarSesiones(listaClases).forEach((clase) => {
      const key = crearClaveGrupoClase(clase);
      const grupoExistente = grupos.get(key);

      if (grupoExistente) {
        grupoExistente.sesiones.push(clase);
        obtenerReglasDeClase(clase).forEach(
          (regla: { diaSemana: number; hora: string }) => {
          if (
            !grupoExistente.reglas.some(
              (actual) =>
                actual.diaSemana === regla.diaSemana &&
                actual.hora === regla.hora,
            )
          ) {
            grupoExistente.reglas.push(regla);
          }
          },
        );
        return;
      }

      grupos.set(key, {
        key,
        programacionId: clase.programacionId || undefined,
        programacionActiva:
          clase.programacionId != null
            ? clase.programacionActiva !== false
            : undefined,
        programacionFechaInicio:
          clase.programacionFechaInicio || undefined,
        nombre: clase.nombre,
        descripcion: clase.descripcion || "",
        nombreEntrenador: clase.nombreEntrenador,
        entrenadorId: clase.entrenadorId,
        duracionMinutos: clase.duracionMinutos,
        capacidadMaxima: clase.capacidadMaxima,
        imagenUrl: clase.imagenUrl,
        reglas: obtenerReglasDeClase(clase),
        sesiones: [clase],
      });
    });

    return Array.from(grupos.values()).map((grupo) => ({
      ...grupo,
      reglas: [...grupo.reglas].sort(
        (a, b) => a.diaSemana - b.diaSemana || a.hora.localeCompare(b.hora),
      ),
    }));
  };

  const obtenerSesionesDeDia = (sesiones: any[], dia: string) => {
    return ordenarSesiones(
      sesiones.filter((clase) => obtenerFechaKey(clase.fechaHora) === dia),
    );
  };

  const gruposClasesGimnasio = agruparClases(clasesGimnasio);
  const gruposClasesActivas = gruposClasesGimnasio.filter((grupo) =>
    grupo.programacionId
      ? grupo.programacionActiva !== false
      : grupo.sesiones.some((clase) => clase.activa !== false),
  );
  const gruposClasesDesactivadas = gruposClasesGimnasio.filter((grupo) =>
    grupo.programacionId
      ? grupo.programacionActiva === false
      : grupo.sesiones.every((clase) => clase.activa === false),
  );
  const gruposClasesEntrenador = agruparClases(clasesEntrenador);

  const ahora = new Date();
  const actividadesCliente = Array.from(
    new Set(clasesActivasGimnasio.map((clase) => clase.nombre)),
  ).map((nombreActividad) => {
    const sesiones = clasesActivasGimnasio.filter(
      (clase) => clase.nombre === nombreActividad,
    );

    return {
      nombre: nombreActividad,
      descripcion: sesiones[0]?.descripcion || "",
      sesiones,
    };
  });

  const hoyClasesCliente = crearFechaLocalDesdeKey(hoyCalendarioClasesKey);
  const hoyClasesClienteKey = hoyCalendarioClasesKey;
  const lunesSemanaActual = obtenerLunesSemanaLocal(hoyClasesCliente);
  const inicioSemanaClasesCliente = sumarDiasFechaLocal(
    lunesSemanaActual,
    semanaClasesOffset * 7,
  );
  const diasClasesClienteItems = Array.from({ length: 7 }, (_, index) => {
    const fecha = sumarDiasFechaLocal(inicioSemanaClasesCliente, index);
    const key = crearFechaKeyLocal(fecha);
    const diaSemana = DIAS_CLASE.find((dia) => dia.id === fecha.getDay());
    const esHoy = key === hoyClasesClienteKey;

    return {
      key,
      label: esHoy ? "Hoy" : diaSemana?.corto || key.slice(0, 1),
      meta: String(fecha.getDate()),
      disabled: isClassCalendarDayDisabled({
        role: "CLIENTE",
        weekOffset: semanaClasesOffset,
        dayKey: key,
        todayKey: hoyClasesClienteKey,
      }),
    };
  });
  const diaClasesClienteActivo =
    diaSeleccionado &&
    diasClasesClienteItems.some(
      (dia) => dia.key === diaSeleccionado && !dia.disabled,
    )
      ? diaSeleccionado
      : semanaClasesOffset === 0
        ? hoyClasesClienteKey
        : diasClasesClienteItems[0]?.key || hoyClasesClienteKey;
  const fechaInicioSemanaClases = diasClasesClienteItems[0]
    ? crearFechaLocalDesdeKey(diasClasesClienteItems[0].key)
    : hoyClasesCliente;
  const fechaFinSemanaClases = diasClasesClienteItems[
    diasClasesClienteItems.length - 1
  ]
    ? crearFechaLocalDesdeKey(diasClasesClienteItems[diasClasesClienteItems.length - 1].key)
    : hoyClasesCliente;
  const mesInicioSemanaClases = new Intl.DateTimeFormat("es-ES", {
    month: "long",
  }).format(fechaInicioSemanaClases);
  const mesFinSemanaClases = new Intl.DateTimeFormat("es-ES", {
    month: "long",
  }).format(fechaFinSemanaClases);
  const rangoSemanaClases =
    mesInicioSemanaClases === mesFinSemanaClases
      ? `${fechaInicioSemanaClases.getDate()}–${fechaFinSemanaClases.getDate()} ${mesFinSemanaClases}`
      : `${fechaInicioSemanaClases.getDate()} ${mesInicioSemanaClases} – ${fechaFinSemanaClases.getDate()} ${mesFinSemanaClases}`;
  const tiposClasesCliente = actividadesCliente.map((actividad) => actividad.nombre);
  const clasesClienteDelDia = ordenarSesiones(
    clasesActivasGimnasio.filter((clase) => {
      const coincideDia =
        !diaClasesClienteActivo ||
        obtenerFechaKey(clase.fechaHora) === diaClasesClienteActivo;
      const coincideTipo =
        !actividadSeleccionada || clase.nombre === actividadSeleccionada;

      return coincideDia && coincideTipo;
    }),
  );
  const fechasClasesClienteSemana = new Set(
    diasClasesClienteItems.map((dia) => dia.key),
  );
  const clasesClienteDeLaSemana = ordenarSesiones(
    clasesActivasGimnasio.filter((clase) =>
      fechasClasesClienteSemana.has(obtenerFechaKey(clase.fechaHora)),
    ),
  );
  const inicioSemanaAgendaEntrenador = sumarDiasFechaLocal(
    lunesSemanaActual,
    semanaAgendaEntrenadorOffset * 7,
  );
  const diasAgendaEntrenadorItems = Array.from({ length: 7 }, (_, index) => {
    const fecha = sumarDiasFechaLocal(inicioSemanaAgendaEntrenador, index);
    const key = crearFechaKeyLocal(fecha);
    const diaSemana = DIAS_CLASE.find((dia) => dia.id === fecha.getDay());
    const esHoy = key === hoyClasesClienteKey;

    return {
      key,
      label: esHoy ? "Hoy" : diaSemana?.corto || key.slice(0, 1),
      meta: String(fecha.getDate()),
      disabled: isClassCalendarDayDisabled({
        role: "ENTRENADOR",
        weekOffset: semanaAgendaEntrenadorOffset,
        dayKey: key,
        todayKey: hoyClasesClienteKey,
      }),
    };
  });
  const diaAgendaEntrenadorActivo =
    diaAgendaEntrenadorSeleccionado &&
    diasAgendaEntrenadorItems.some(
      (dia) => dia.key === diaAgendaEntrenadorSeleccionado && !dia.disabled,
    )
      ? diaAgendaEntrenadorSeleccionado
      : semanaAgendaEntrenadorOffset === 0
        ? hoyClasesClienteKey
        : diasAgendaEntrenadorItems[0]?.key || hoyClasesClienteKey;
  const fechasAgendaEntrenadorSemana = new Set(
    diasAgendaEntrenadorItems.map((dia) => dia.key),
  );
  const clasesAgendaEntrenadorSemana = ordenarSesiones(
    clasesEntrenador.filter((clase) =>
      fechasAgendaEntrenadorSemana.has(obtenerFechaKey(clase.fechaHora)),
    ),
  );
  const clasesAgendaEntrenadorDia = ordenarSesiones(
    clasesEntrenador.filter(
      (clase) => obtenerFechaKey(clase.fechaHora) === diaAgendaEntrenadorActivo,
    ),
  );
  const fechaInicioAgendaEntrenador = diasAgendaEntrenadorItems[0]
    ? crearFechaLocalDesdeKey(diasAgendaEntrenadorItems[0].key)
    : hoyClasesCliente;
  const fechaFinAgendaEntrenador = diasAgendaEntrenadorItems[
    diasAgendaEntrenadorItems.length - 1
  ]
    ? crearFechaLocalDesdeKey(
        diasAgendaEntrenadorItems[diasAgendaEntrenadorItems.length - 1].key,
      )
    : hoyClasesCliente;
  const mesInicioAgendaEntrenador = new Intl.DateTimeFormat("es-ES", {
    month: "long",
  }).format(fechaInicioAgendaEntrenador);
  const mesFinAgendaEntrenador = new Intl.DateTimeFormat("es-ES", {
    month: "long",
  }).format(fechaFinAgendaEntrenador);
  const rangoSemanaAgendaEntrenador =
    mesInicioAgendaEntrenador === mesFinAgendaEntrenador
      ? `${fechaInicioAgendaEntrenador.getDate()}-${fechaFinAgendaEntrenador.getDate()} ${mesFinAgendaEntrenador}`
      : `${fechaInicioAgendaEntrenador.getDate()} ${mesInicioAgendaEntrenador} - ${fechaFinAgendaEntrenador.getDate()} ${mesFinAgendaEntrenador}`;
  const fechaAgendaEntrenadorTexto = diaAgendaEntrenadorActivo
    ? formatearFechaCompleta(`${diaAgendaEntrenadorActivo}T00:00:00`)
    : "Sin fecha";
  const claseEntrenadorSeleccionada =
    claseEntrenadorSeleccionadaId == null
      ? null
      : clasesEntrenador.find(
          (clase) => clase.id === claseEntrenadorSeleccionadaId,
        ) || null;
  const claseClienteSeleccionada =
    claseClienteSeleccionadaId == null
      ? null
      : clasesActivasGimnasio.find(
          (clase) => clase.id === claseClienteSeleccionadaId,
        ) || null;
  const obtenerReservaClienteActivaDeClase = (claseId: number) =>
    reservasCliente.find(
      (reserva) => reserva.claseId === claseId && reserva.estado === "RESERVADA",
    );

  const obtenerTimestampReservaCliente = (reserva: any) => {
    const clase = obtenerClaseDeReserva(reserva);
    return new Date(clase?.fechaHora || 0).getTime();
  };
  const esReservaProximaCliente = (reserva: any) => {
    const clase = obtenerClaseDeReserva(reserva);
    const timestamp = new Date(clase?.fechaHora || 0).getTime();

    return (
      reserva.estado === "RESERVADA" &&
      clase &&
      !Number.isNaN(timestamp) &&
      timestamp >= ahora.getTime()
    );
  };
  const reservasProximasClienteTodas =
    reservasClienteOrdenadas.filter(esReservaProximaCliente);
  const reservasHistorialCliente = [...reservasClienteOrdenadas]
    .filter((reserva) => !esReservaProximaCliente(reserva))
    .sort(
      (a, b) =>
        obtenerTimestampReservaCliente(b) - obtenerTimestampReservaCliente(a),
    );
  const clasesProximasEntrenador = ordenarSesiones(clasesEntrenador)
    .filter((clase) => new Date(clase.fechaHora).getTime() >= ahora.getTime())
    .slice(0, 3);
  const reservasProximasCliente = reservasProximasClienteTodas.slice(0, 3);

  const agendaInicioCliente = reservasProximasCliente.map((reserva) => {
    const clase = obtenerClaseDeReserva(reserva);

    return {
      id: String(reserva.id),
      title: reserva.nombreClase || clase?.nombre || "Clase",
      time: clase
        ? `${formatearDia(clase.fechaHora)} · ${obtenerHora(clase.fechaHora)}`
        : "Sin fecha",
      meta: clase?.nombreEntrenador
        ? `Con ${clase.nombreEntrenador}`
        : "Entrenador por asignar",
      imagenUrl: clase?.imagenUrl,
    };
  });

  const proximaClaseEntrenador = clasesProximasEntrenador[0];
  const clasesHoyAdmin = clasesActivasGimnasio.filter(
    (clase) => obtenerFechaKey(clase.fechaHora) === hoyClasesClienteKey,
  );
  const clasesHoyAdminIds = new Set(clasesHoyAdmin.map((clase) => clase.id));
  const reservasHoyAdmin = reservasActivas.filter((reserva) =>
    clasesHoyAdminIds.has(reserva.claseId),
  );
  const pagosPendientesAdmin = pagos.filter(
    (pago) => pago.estado === "PENDIENTE" || pago.estado === "VENCIDO",
  ).length;
  const rutinasActivasAdmin = rutinasEntrenador.filter(
    (rutina) => rutina.activa !== false,
  ).length;
  const nombreAdminCompleto = obtenerNombreChatSinRol(
    usuarioActivo?.nombre || "Administrador",
  );
  const nombreAdmin = nombreAdminCompleto.split(" ")[0] || "Administrador";
  const horaActualAdmin = ahora.getHours();
  const saludoAdmin =
    horaActualAdmin < 12
      ? "Buenos días"
      : horaActualAdmin < 20
        ? "Buenas tardes"
        : "Buenas noches";
  const clasesHoyEntrenador = ordenarSesiones(
    clasesEntrenador.filter(
      (clase) => obtenerFechaKey(clase.fechaHora) === hoyClasesClienteKey,
    ),
  );
  const clasesPendientesHoyEntrenador = clasesHoyEntrenador.filter((clase) => {
    const inicioClase = new Date(clase.fechaHora).getTime();
    const duracion = Number(clase.duracionMinutos) || 45;
    const finClase = inicioClase + duracion * 60 * 1000;

    return !Number.isNaN(finClase) && finClase >= ahora.getTime();
  });
  const proximaClaseHoyEntrenador =
    clasesPendientesHoyEntrenador[0] || null;
  const jornadaTerminadaEntrenador =
    clasesHoyEntrenador.length > 0 && !proximaClaseHoyEntrenador;
  const alumnosPrevistosHoyEntrenador = clasesHoyEntrenador.reduce(
    (total, clase) => total + contarReservasActivasDeClase(clase.id),
    0,
  );
  const proximaReservaCliente = reservasProximasCliente[0];
  const claseProximaReservaCliente = proximaReservaCliente
    ? obtenerClaseDeReserva(proximaReservaCliente)
    : null;

  const titulosAdmin: Record<SeccionAdmin, { title: string; subtitle: string }> =
    {
      INICIO: {
        title: "Inicio",
        subtitle: "Panel de administración",
      },
      GESTION: {
        title: "Gestión",
        subtitle: "Áreas principales del gimnasio",
      },
      CLIENTES: {
        title: "Clientes",
        subtitle: "Gestiona clientes y sus suscripciones",
      },
      INVITACIONES_CLIENTES: {
        title: "Invitar clientes",
        subtitle: "Altas mediante QR y enlace seguro",
      },
      ENTRENADORES: {
        title: "Entrenadores",
        subtitle: "Administra entrenadores y horarios",
      },
      CLASES: {
        title: "Clases",
        subtitle: "Crea, edita y organiza horarios",
      },
      RESERVAS: {
        title: "Reservas activas",
        subtitle: "Gestiona las reservas del día seleccionado",
      },
      PAGOS: {
        title: "Pagos",
        subtitle: "Controla los cobros y vencimientos del gimnasio",
      },
      MENSAJES: {
        title: "Mensajes",
        subtitle: "Comunicación con clientes y entrenadores",
      },
      PERSONALIZAR: {
        title: "Personalizar",
        subtitle: "Configura la identidad de tu gimnasio",
      },
      CREAR_USUARIO: {
        title: "Añadir usuario",
        subtitle: "Crea clientes y entrenadores",
      },
      RUTINAS: {
        title: "Rutinas",
        subtitle: "Planes y ejercicios del gimnasio",
      },
    };

  const titulosEntrenador: Record<
    SeccionEntrenador,
    { title: string; subtitle: string }
  > = {
    PANEL: {
      title: "Inicio",
      subtitle: "Panel de entrenador",
    },
    CLASES: {
      title: "Horario",
      subtitle: "Tus próximas clases y alumnos",
    },
    MENSAJES: {
      title: "Mensajes",
      subtitle: "Comunícate con tus alumnos",
    },
    PERFIL: {
      title: "Perfil",
      subtitle: "Foto, accesos y sesión",
    },
    RUTINAS: {
      title: "Rutinas",
      subtitle: "Prepara entrenamientos",
    },
  };

  const titulosCliente: Record<SeccionCliente, { title: string; subtitle: string }> =
    {
      PANEL: {
        title: "Inicio",
        subtitle: "Panel de cliente",
      },
      CLASES: {
        title: actividadSeleccionada || "Clases",
        subtitle: actividadSeleccionada
          ? "Elige día y reserva tu hora"
          : "Explora y reserva tus clases",
      },
      RESERVAS: {
        title: "Reservas activas",
        subtitle: "Tu agenda organizada por día",
      },
      MENSAJES: {
        title: "Mensajes",
        subtitle: "Avisos recibidos del gimnasio",
      },
      PAGOS: {
        title: "Pagos",
        subtitle: "Consulta tus cobros y pagos realizados",
      },
      PERFIL: {
        title: "Perfil",
        subtitle: "Tus reservas, mensajes y cuenta",
      },
      RUTINAS: {
        title: "Rutinas",
        subtitle: "Entrena a tu ritmo",
      },
    };

  const tituloAdminActual = titulosAdmin[seccionAdmin] ?? titulosAdmin.INICIO;
  const tituloEntrenadorActual =
    titulosEntrenador[seccionEntrenador] ?? titulosEntrenador.PANEL;
  const tituloClienteActual =
    titulosCliente[seccionCliente] ?? titulosCliente.PANEL;

  if (estadoArranque === "RESTORING_SESSION") {
    return <GymFlowSessionLoading onReady={manejarCargaSesionLista} />;
  }

  if (estadoArranque === "TEMPORARY_ERROR") {
    return (
      <GymFlowSessionError
        onRetry={() => {
          setEstadoArranque("RESTORING_SESSION");
          setRestauracionIntento((intento) => intento + 1);
        }}
      />
    );
  }

  if (estadoArranque === "UNAUTHENTICATED") {
    return (
      <GymFlowLogin
        loading={iniciandoSesion}
        errorMessage={errorLogin}
        onSubmit={iniciarSesion}
        onInvitationPress={() => router.push("/invite")}
      />
    );
  }

  if (!usuarioLogueado) {
    return null;
  }

  if (cargando) {
    return (
      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando GymFlow...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.center}>
        <Text style={styles.errorTitle}>Ups</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Revisa MySQL, Spring Boot, la IP y que el móvil esté en la misma WiFi.
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => cargarDatos()}>
          <Text style={styles.primaryButtonText}>Reintentar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (rolSeleccionado === "ADMIN" && seccionAdmin === "PAGOS") {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safe, { backgroundColor: authenticatedScreenBackgroundColor }]}
      >
        <ThemedBackdrop />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <AdminPayments
            theme={clienteHomeTheme}
            adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
            adminInitials={obtenerIniciales(nombreAdminCompleto)}
            clients={clientesActivos}
            payments={pagos}
            loading={cargandoPagos}
            error={errorPagos}
            bottomPadding={authenticatedScrollBottomPadding}
            onAdminAvatarPress={() => solicitarAbrirSeccionAdmin("PERSONALIZAR")}
            onReload={cargarPagosRol}
            onPaymentsChange={setPagos}
            onRegisterExitGuard={(guard) => {
              adminPaymentsExitGuardRef.current = guard;
            }}
            onRootBack={() => abrirSeccionAdmin("GESTION")}
          />
        </KeyboardAvoidingView>
        {renderBarraInferior()}
      </SafeAreaView>
    );
  }

  if (rolSeleccionado === "CLIENTE" && seccionCliente === "PAGOS") {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safe, { backgroundColor: authenticatedScreenBackgroundColor }]}
      >
        <ThemedBackdrop />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ClientPayments
            theme={clienteHomeTheme}
            avatarUri={usuarioActivo?.fotoPerfilUrl}
            initials={obtenerIniciales(usuarioActivo?.nombre || "Cliente")}
            payments={pagos}
            loading={cargandoPagos}
            error={errorPagos}
            bottomPadding={authenticatedScrollBottomPadding}
            onAvatarPress={() => setSeccionCliente("PERFIL")}
            onReload={cargarPagosRol}
          />
        </KeyboardAvoidingView>
        {renderBarraInferior()}
      </SafeAreaView>
    );
  }

  if (rolSeleccionado === "ADMIN" && seccionAdmin === "PERSONALIZAR") {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safe, { backgroundColor: authenticatedScreenBackgroundColor }]}
      >
        <ThemedBackdrop />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <AdminGymSettings
            key={`${usuarioActivo?.id || "admin"}:${gimnasioActual?.id || "gym"}`}
            theme={clienteHomeTheme}
            gym={(gimnasioActual as GymSettingsData | null) || null}
            adminName={nombreAdminCompleto}
            adminEmail={usuarioActivo?.email}
            adminAvatarUri={usuarioActivo?.fotoPerfilUrl}
            adminInitials={obtenerIniciales(nombreAdminCompleto)}
            uploadingImageKey={subiendoImagen}
            bottomPadding={authenticatedScrollBottomPadding}
            onPickImage={(key, aspect) =>
              seleccionarYSubirImagen(key, aspect, "FONDO_GIMNASIO")
            }
            onAdminPhotoPress={() => cambiarFotoPerfil()}
            onAdminPhotoRemove={retirarFotoPerfilAdministrador}
            onUpdateAdminProfile={actualizarPerfilAdministrador}
            onChangeAdminPassword={cambiarPasswordAdministrador}
            renderDashboardPreview={renderDashboardPreview}
            onUpdateGym={guardarConfiguracionGimnasio}
            onBusyChange={setGuardandoConfiguracionGimnasio}
            onRegisterExitGuard={(guard) => {
              adminSettingsExitGuardRef.current = guard;
            }}
            onRootBack={() => abrirSeccionAdmin("INICIO")}
            onLogout={cerrarSesion}
          />
        </KeyboardAvoidingView>
        {renderBarraInferior()}
        {renderProfilePhotoSourceSheet()}
      </SafeAreaView>
    );
  }

  if (rolConversacionMensajesActiva) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.safe, { backgroundColor: colorSecundarioVisibleApp }]}
      >
        <ThemedBackdrop backgroundColor={colorSecundarioVisibleApp} />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {renderMensajesUnificados(rolConversacionMensajesActiva)}
        </KeyboardAvoidingView>
        {renderBarraInferior(true)}
        {renderRutinaMultimediaModal()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: authenticatedScreenBackgroundColor }]}
    >
      <ThemedBackdrop />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          key={authenticatedScreenKey}
          ref={authenticatedScrollRef}
          style={{ backgroundColor: authenticatedContentBackgroundColor }}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={[
            styles.container,
            {
              backgroundColor: authenticatedContentBackgroundColor,
              paddingBottom: authenticatedScrollBottomPadding,
              flexGrow:
                rolSeleccionado === "ADMIN" &&
                (seccionAdmin === "GESTION" ||
                  seccionAdmin === "CLIENTES" ||
                  seccionAdmin === "INVITACIONES_CLIENTES" ||
                  seccionAdmin === "ENTRENADORES" ||
                  seccionAdmin === "CLASES" ||
                  seccionAdmin === "RESERVAS" ||
                  seccionAdmin === "RUTINAS" ||
                  seccionAdmin === "PAGOS" ||
                  seccionAdmin === "CREAR_USUARIO")
                  ? 1
                  : rolSeleccionado === "CLIENTE" && seccionCliente === "PAGOS"
                  ? 1
                  : undefined,
            },
          ]}
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : seccionAdmin === "CREAR_USUARIO"
                ? "none"
                : "on-drag"
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {rolSeleccionado === "ADMIN" && (
          <>
            {seccionAdmin !== "INICIO" &&
              seccionAdmin !== "GESTION" &&
              seccionAdmin !== "MENSAJES" &&
              seccionAdmin !== "CLIENTES" &&
              seccionAdmin !== "INVITACIONES_CLIENTES" &&
              seccionAdmin !== "ENTRENADORES" &&
              seccionAdmin !== "CLASES" &&
              seccionAdmin !== "RESERVAS" &&
              seccionAdmin !== "RUTINAS" &&
              seccionAdmin !== "PAGOS" &&
              seccionAdmin !== "CREAR_USUARIO" &&
              seccionAdmin !== "PERSONALIZAR" && (
              <ScreenHeader
                title={tituloAdminActual.title}
                subtitle={tituloAdminActual.subtitle}
                onPress={() => abrirSeccionAdmin("INICIO")}
                onProfile={() => abrirSeccionAdmin("PERSONALIZAR")}
              />
            )}

            {seccionAdmin === "INICIO" && (
              <AdminDashboard
                theme={clienteHomeTheme}
                heroImageUri={dashboardBackgroundUri}
                greeting={saludoAdmin}
                administratorName={nombreAdmin}
                gymName={nombreGimnasioApp}
                avatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                initials={obtenerIniciales(nombreAdminCompleto)}
                onAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                metrics={[
                  {
                    key: "classes-today",
                    label: "Clases de hoy",
                    value: clasesHoyAdmin.length,
                    icon: "calendar-clock-outline",
                    accent: "primary",
                  },
                  {
                    key: "bookings-today",
                    label: "Reservas de hoy",
                    value: reservasHoyAdmin.length,
                    icon: "bookmark-check-outline",
                    accent: "secondary",
                  },
                  {
                    key: "unread-messages",
                    label: "Mensajes sin leer",
                    value: mensajesNoLeidosBadge,
                    icon: "message-badge-outline",
                    accent: "primary",
                  },
                  {
                    key: "pending-payments",
                    label: "Pagos pendientes",
                    value: pagosPendientesAdmin,
                    icon: "receipt-clock-outline",
                    accent: "secondary",
                  },
                ]}
                quickActions={[
                  {
                    key: "create-class",
                    title: "Crear clase",
                    description: "Añade una clase y sus horarios",
                    icon: "calendar-plus",
                    accent: "primary",
                    onPress: () => {
                      prepararNuevaClase();
                      abrirSeccionAdmin("CLASES");
                    },
                  },
                  {
                    key: "new-client",
                    title: "Nuevo cliente",
                    description: "Crea un acceso para un cliente",
                    icon: "account-plus-outline",
                    accent: "secondary",
                    onPress: () => abrirAltaUsuario("CLIENTE", "INICIO"),
                  },
                  {
                    key: "new-trainer",
                    title: "Nuevo entrenador",
                    description: "Incorpora a tu equipo",
                    icon: "account-tie-hat-outline",
                    accent: "primary",
                    onPress: () => abrirAltaUsuario("ENTRENADOR", "INICIO"),
                  },
                  {
                    key: "new-message",
                    title: "Enviar comunicado",
                    description: "Inicia un mensaje para tu comunidad",
                    icon: "message-plus-outline",
                    accent: "secondary",
                    onPress: () => {
                      setModoMensajesAdmin("NUEVO");
                      abrirSeccionAdmin("MENSAJES");
                    },
                  },
                ]}
                priorities={[
                  ...(mensajesNoLeidosBadge > 0
                    ? [
                        {
                          key: "messages",
                          title: "Mensajes sin leer",
                          description: pluralizar(
                            mensajesNoLeidosBadge,
                            "mensaje requiere atención",
                            "mensajes requieren atención",
                          ),
                          icon: "message-badge-outline" as const,
                          onPress: () => abrirSeccionAdmin("MENSAJES"),
                        },
                      ]
                    : []),
                  ...(pagosPendientesAdmin > 0
                    ? [
                        {
                          key: "payments",
                          title: "Pagos por revisar",
                          description: pluralizar(
                            pagosPendientesAdmin,
                            "cobro pendiente o vencido",
                            "cobros pendientes o vencidos",
                          ),
                          icon: "receipt-clock-outline" as const,
                          onPress: () => abrirSeccionAdmin("PAGOS"),
                        },
                      ]
                    : []),
                ]}
              />
            )}

            {seccionAdmin === "GESTION" && (
              <AdminManagement
                theme={clienteHomeTheme}
                adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                adminInitials={obtenerIniciales(nombreAdminCompleto)}
                onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                groups={[
                  {
                    key: "people",
                    title: "PERSONAS",
                    items: [
                      {
                        key: "clients",
                        title: "Clientes",
                        description: "Cuentas y estado de clientes",
                        count: clientes.length,
                        countLabel: pluralizar(clientes.length, "cliente", "clientes"),
                        icon: "account-group-outline",
                        onPress: () => abrirSeccionAdmin("CLIENTES"),
                      },
                      {
                        key: "trainers",
                        title: "Entrenadores",
                        description: "Equipo de profesionales del gimnasio",
                        count: entrenadores.length,
                        countLabel: pluralizar(
                          entrenadores.length,
                          "entrenador",
                          "entrenadores",
                        ),
                        icon: "account-tie-outline",
                        onPress: () => abrirSeccionAdmin("ENTRENADORES"),
                      },
                    ],
                  },
                  {
                    key: "activity",
                    title: "ACTIVIDAD",
                    items: [
                      {
                        key: "classes",
                        title: "Clases",
                        description: "Programación y sesiones activas",
                        count: gruposClasesActivas.length,
                        countLabel: pluralizar(
                          gruposClasesActivas.length,
                          "clase activa",
                          "clases activas",
                        ),
                        icon: "calendar-clock-outline",
                        onPress: () => abrirSeccionAdmin("CLASES"),
                      },
                      {
                        key: "reservations",
                        title: "Reservas",
                        description: "Ocupación y reservas del gimnasio",
                        count: reservasActivas.length,
                        countLabel: pluralizar(
                          reservasActivas.length,
                          "reserva activa",
                          "reservas activas",
                        ),
                        icon: "clipboard-check-outline",
                        onPress: () => abrirSeccionAdmin("RESERVAS"),
                      },
                    ],
                  },
                  {
                    key: "training",
                    title: "ENTRENAMIENTO",
                    items: [
                      {
                        key: "routines",
                        title: "Rutinas",
                        description: "Planes creados y asignaciones",
                        count: rutinasActivasAdmin,
                        countLabel: pluralizar(
                          rutinasActivasAdmin,
                          "rutina activa",
                          "rutinas activas",
                        ),
                        icon: "arm-flex-outline",
                        onPress: () => abrirSeccionAdmin("RUTINAS"),
                      },
                    ],
                  },
                  {
                    key: "finance",
                    title: "FINANZAS",
                    items: [
                      {
                        key: "payments",
                        title: "Pagos",
                        description: "Cobros pendientes y vencidos",
                        count: pagosPendientesAdmin,
                        countLabel: pluralizar(
                          pagosPendientesAdmin,
                          "pago por revisar",
                          "pagos por revisar",
                        ),
                        icon: "receipt-text-outline",
                        onPress: () => abrirSeccionAdmin("PAGOS"),
                      },
                    ],
                  },
                ]}
              />
            )}

            {seccionAdmin === "CREAR_USUARIO" && (
              <AdminUserCreate
                role={rolUsuario}
                theme={clienteHomeTheme}
                gymName={nombreGimnasioApp}
                adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                adminInitials={obtenerIniciales(nombreAdminCompleto)}
                onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                onPickPhoto={(currentPhoto) =>
                  seleccionarYSubirFotoPerfil(
                    "nuevo-usuario",
                    Boolean(currentPhoto),
                  )
                }
                onCreated={actualizarUsuarioCreado}
                onOpenProfile={abrirFichaUsuarioCreado}
                onReturnToList={volverAlListadoUsuarioCreado}
                onBack={() => abrirSeccionAdmin(origenAltaUsuario)}
              />
            )}

            {seccionAdmin === "CLIENTES" && (
              <AdminClients
                theme={clienteHomeTheme}
                adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                adminInitials={obtenerIniciales(nombreAdminCompleto)}
                clients={clientes}
                reservations={reservasGimnasio}
                classes={clasesGimnasio}
                search={busquedaUsuarios}
                activeFilter={filtroClientes}
                selectedClientId={clienteAdminSeleccionadoId}
                updatingPhoto={
                  clienteAdminSeleccionadoId != null &&
                  subiendoImagen === `perfil-${clienteAdminSeleccionadoId}`
                }
                getClientStatus={obtenerEstadoCliente}
                onSearchChange={setBusquedaUsuarios}
                onFilterChange={setFiltroClientes}
                onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                onNewClient={() => abrirAltaUsuario("CLIENTE", "CLIENTES")}
                onInviteClients={() => abrirSeccionAdmin("INVITACIONES_CLIENTES")}
                onOpenClient={setClienteAdminSeleccionadoId}
                onBackToList={() => setClienteAdminSeleccionadoId(null)}
                onChangePhoto={cambiarFotoPerfil}
                onDeactivate={desactivarUsuario}
                onSendMessage={(cliente) => {
                  limpiarFormularioMensaje();
                  setFeedbackMensajesCliente(null);
                  setClienteAdminSeleccionadoId(null);
                  setMensajeSeleccionadoId(null);
                  setOrigenNuevoMensajeAdmin({
                    tipo: "FICHA_CLIENTE",
                    clienteId: cliente.id,
                  });
                  setAudienciaMensaje("INDIVIDUAL");
                  setDestinatariosMensajeIds([cliente.id]);
                  setModoMensajesAdmin("NUEVO");
                  setSeccionAdmin("MENSAJES");
                }}
              />
            )}

            {seccionAdmin === "INVITACIONES_CLIENTES" && (
              <AdminClientInvitations
                theme={clienteHomeTheme}
                adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                adminInitials={obtenerIniciales(nombreAdminCompleto)}
                onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                onBack={() => abrirSeccionAdmin("CLIENTES")}
              />
            )}

            {seccionAdmin === "ENTRENADORES" && (
              <AdminTrainers
                theme={clienteHomeTheme}
                adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                adminInitials={obtenerIniciales(nombreAdminCompleto)}
                trainers={entrenadores}
                classes={clasesGimnasio}
                routines={rutinasEntrenador}
                routinesLoading={cargandoRutinasEntrenador}
                routinesError={errorRutinasEntrenador}
                search={busquedaUsuarios}
                activeFilter={filtroEntrenadores}
                selectedTrainerId={entrenadorAdminSeleccionadoId}
                updatingPhoto={
                  entrenadorAdminSeleccionadoId != null &&
                  subiendoImagen === `perfil-${entrenadorAdminSeleccionadoId}`
                }
                userMessagesAllowed={mensajesUsuariosPermitidosApp}
                canManagePhoto
                loading={cargando}
                error={error}
                onSearchChange={setBusquedaUsuarios}
                onFilterChange={setFiltroEntrenadores}
                onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                onNewTrainer={() =>
                  abrirAltaUsuario("ENTRENADOR", "ENTRENADORES")
                }
                onOpenTrainer={setEntrenadorAdminSeleccionadoId}
                onBackToList={() => setEntrenadorAdminSeleccionadoId(null)}
                onChangePhoto={cambiarFotoPerfil}
                onDeactivate={desactivarUsuario}
                onSendMessage={(entrenador) => {
                  limpiarFormularioMensaje();
                  setFeedbackMensajesCliente(null);
                  setEntrenadorAdminSeleccionadoId(null);
                  setMensajeSeleccionadoId(null);
                  setOrigenNuevoMensajeAdmin({
                    tipo: "FICHA_ENTRENADOR",
                    entrenadorId: entrenador.id,
                  });
                  setAudienciaMensaje("INDIVIDUAL");
                  setDestinatariosMensajeIds([entrenador.id]);
                  setModoMensajesAdmin("NUEVO");
                  setSeccionAdmin("MENSAJES");
                }}
              />
            )}
            {seccionAdmin === "CLASES" && (
              <AdminClasses
                theme={clienteHomeTheme}
                adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                adminInitials={obtenerIniciales(nombreAdminCompleto)}
                mode={modoClasesAdmin}
                selectedGroupKey={grupoClaseAdminSeleccionado}
                activeGroups={gruposClasesActivas}
                inactiveGroups={gruposClasesDesactivadas}
                trainers={entrenadoresActivos}
                days={DIAS_CLASE}
                search={busquedaClasesAdmin}
                loading={false}
                error={error}
                form={{
                  nombre: nombreClase,
                  descripcion: descripcionClase,
                  imagenUrl: imagenClaseUrl,
                  entrenadorId: entrenadorClaseId,
                  dias: diasClaseSeleccionados,
                  horas: horasClase,
                  horaNueva: horaClaseNueva,
                  duracion: duracionClase,
                  capacidad: capacidadClase,
                }}
                uploadingFormImage={subiendoImagen === "clase"}
                uploadingExistingImage={subiendoImagen === "clase-existente"}
                saving={guardandoClaseAdmin}
                onSearchChange={setBusquedaClasesAdmin}
                onModeChange={(mode) => {
                  setModoClasesAdmin(mode);
                  setGrupoClaseEditandoKey(null);
                  setGrupoClaseAdminSeleccionado(null);
                }}
                onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                onNewClass={prepararNuevaClase}
                onOpenGroup={setGrupoClaseAdminSeleccionado}
                onBackToList={() => setGrupoClaseAdminSeleccionado(null)}
                onEditGroup={iniciarEdicionGrupoClase}
                onChangeCover={cambiarImagenGrupoClase}
                onCreateTrainer={() => {
                  abrirAltaUsuario("ENTRENADOR", "CLASES");
                }}
                onFormNameChange={setNombreClase}
                onFormDescriptionChange={setDescripcionClase}
                onFormTrainerChange={setEntrenadorClaseId}
                onFormDurationChange={setDuracionClase}
                onFormCapacityChange={setCapacidadClase}
                onToggleFormDay={alternarDiaClase}
                onFormNewTimeChange={setHoraClaseNueva}
                onAddFormTime={agregarHoraClase}
                onRemoveFormTime={quitarHoraClase}
                onPickFormImage={async () => {
                  const url = await seleccionarYSubirImagen(
                    "clase",
                    [16, 9],
                    "PORTADA_CLASE",
                  );
                  if (url) {
                    setImagenClaseUrl(url);
                  }
                }}
                onSubmitForm={
                  modoClasesAdmin === "EDITAR"
                    ? guardarCambiosClase
                    : crearClase
                }
                onCancelForm={() => {
                  confirmarSalidaFormularioClase(() => {
                    const grupoKey = grupoClaseEditandoKey;
                    resetearFormularioClase();
                    setModoClasesAdmin("CREADAS");
                    setGrupoClaseAdminSeleccionado(grupoKey);
                  });
                }}
                onManageScheduleFromEdit={() => {
                  const grupoKey = grupoClaseEditandoKey;
                  setModoClasesAdmin("CREADAS");
                  setGrupoClaseAdminSeleccionado(grupoKey);
                  setGrupoClaseEditandoKey(null);
                }}
                getReservationsCount={contarReservasActivasDeClase}
                onAddDay={agregarDiaAGrupoClase}
                onRemoveDay={eliminarDiaGrupoClase}
                onAddTime={agregarHoraAGrupoClase}
                onUpdateTime={actualizarHoraSesionClase}
                onRemoveTime={eliminarHorarioGrupoClase}
                onDeactivateProgram={desactivarProgramacionGrupoClase}
              />
            )}
            {seccionAdmin === "RESERVAS" && (
              <AdminReservations
                theme={clienteHomeTheme}
                adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
                adminInitials={obtenerIniciales(nombreAdminCompleto)}
                reservations={reservasGimnasio}
                classes={clasesGimnasio}
                clients={clientes}
                search={busquedaReservasAdmin}
                activeFilter={filtroReservasAdmin}
                selectedSessionId={sesionReservaAdminSeleccionadaId}
                loading={cargando}
                error={error}
                cancellingReservationId={cancelandoReservaId}
                onSearchChange={setBusquedaReservasAdmin}
                onFilterChange={setFiltroReservasAdmin}
                onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
                onOpenSession={setSesionReservaAdminSeleccionadaId}
                onBackToList={() => setSesionReservaAdminSeleccionadaId(null)}
                onCancelReservation={(reservationId) =>
                  cancelarReserva(reservationId, { mostrarAlert: false })
                }
              />
            )}

            {seccionAdmin === "MENSAJES" && renderMensajesUnificados("ADMIN")}

            {seccionAdmin === "RUTINAS" && renderAdminRutinasPremium()}
          </>
        )}

        {rolSeleccionado === "ENTRENADOR" && (
          <>
            {seccionEntrenador !== "PANEL" &&
              seccionEntrenador !== "CLASES" &&
              seccionEntrenador !== "MENSAJES" &&
              seccionEntrenador !== "RUTINAS" &&
              seccionEntrenador !== "PERFIL" && (
              <ScreenHeader
                title={tituloEntrenadorActual.title}
                subtitle={tituloEntrenadorActual.subtitle}
                onPress={() => setSeccionEntrenador("PANEL")}
                onProfile={() => setSeccionEntrenador("PERFIL")}
              />
            )}

            {seccionEntrenador === "PANEL" && <InicioEntrenadorPremium />}

            {seccionEntrenador === "CLASES" && <EntrenadorClasesPremium />}

            {seccionEntrenador === "MENSAJES" && renderMensajesUnificados("ENTRENADOR")}

            {seccionEntrenador === "PERFIL" && renderEntrenadorPerfilPremium()}

            {seccionEntrenador === "RUTINAS" && (
              renderEntrenadorRutinasPremium()
            )}
          </>
        )}

        {rolSeleccionado === "CLIENTE" && (
          <>
            {seccionCliente !== "PANEL" &&
              seccionCliente !== "CLASES" &&
              seccionCliente !== "RESERVAS" &&
              seccionCliente !== "MENSAJES" &&
              seccionCliente !== "RUTINAS" &&
              seccionCliente !== "PERFIL" &&
              seccionCliente !== "PAGOS" && (
              <ScreenHeader
                title={tituloClienteActual.title}
                subtitle={tituloClienteActual.subtitle}
                onPress={() => {
                  setSeccionCliente("PANEL");
                }}
                onProfile={() => setSeccionCliente("PERFIL")}
              />
            )}

            {seccionCliente === "PANEL" && (
              <>
                <InicioClientePremium />
              </>
            )}
            {seccionCliente === "CLASES" && (
              <ClienteClasesPremium />
            )}

            {seccionCliente === "RESERVAS" && (
              <ClienteReservasPremium />
            )}

            {seccionCliente === "MENSAJES" && renderMensajesUnificados("CLIENTE")}

            {seccionCliente === "PERFIL" && renderClientePerfilPremium()}

            {seccionCliente === "RUTINAS" && (
              renderClienteRutinasPremium()
            )}
          </>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
      {renderBarraInferior()}
      {renderRutinaMultimediaModal()}
      {renderProfilePhotoSourceSheet()}
    </SafeAreaView>
  );

  function renderProfilePhotoSourceSheet() {
    return (
      <ProfilePhotoSourceSheet
        visible={selectorFotoPerfilVisible}
        theme={clienteHomeTheme}
        hasPhoto={selectorFotoPerfilTieneFoto}
        busy={selectorFotoPerfilOcupado}
        cameraAvailable={Platform.OS !== "web"}
        onSelect={(source) => void manejarOrigenFotoPerfil(source)}
        onRemove={() => resolverSelectorFotoPerfil({ type: "REMOVE" })}
        onClose={() => {
          if (!selectorFotoPerfilOcupado) resolverSelectorFotoPerfil(null);
        }}
      />
    );
  }

  function ThemedBackdrop({
    backgroundColor = authenticatedScreenBackgroundColor,
  }: {
    backgroundColor?: string;
  } = {}) {
    return <DashboardBackdrop backgroundColor={backgroundColor} />;
  }

  function ScreenHeader({
    title,
    subtitle,
    onPress,
    onProfile,
  }: {
    title: string;
    subtitle: string;
    onPress: () => void;
    onProfile: () => void;
  }) {
    return (
      <View style={styles.screenHeader}>
        <Pressable style={styles.screenBackButton} onPress={onPress}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={30}
            color="#F8FAFC"
          />
        </Pressable>

        <View style={styles.screenHeaderCopy}>
          <Text
            style={styles.screenHeaderTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          <Text style={styles.screenHeaderSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        <Pressable style={styles.screenProfileButton} onPress={onProfile}>
          {resolverUrlMedia(usuarioActivo?.fotoPerfilUrl) ? (
            <Image
              source={{
                uri: resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)!,
              }}
              style={styles.headerProfileImage}
            />
          ) : (
            <MaterialCommunityIcons
              name="account"
              size={27}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </View>
    );
  }

  function BottomDockButton({
    icon,
    label,
    active = false,
    disabled = false,
    badgeCount = 0,
    primaryColor = colorPrimarioVisibleApp,
    textOnPrimary = colorTextoSobrePrimarioApp,
    onPress,
  }: {
    icon: IconName;
    label: string;
    active?: boolean;
    disabled?: boolean;
    badgeCount?: number;
    primaryColor?: string;
    textOnPrimary?: string;
    onPress: () => void;
  }) {
    const mostrarBadge = badgeCount > 0;

    return (
      <Pressable
        style={[
          styles.bottomDockButton,
          active && [
            styles.bottomDockButtonActive,
            {
              backgroundColor: colorConAlpha(primaryColor, "22"),
              borderTopColor: primaryColor,
            },
          ],
          disabled && styles.bottomDockButtonDisabled,
        ]}
        disabled={disabled}
        onPress={onPress}
      >
        <View style={styles.bottomDockIconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={24}
            color={active ? primaryColor : "#94A3B8"}
          />
          {mostrarBadge && (
            <View
              style={[
                styles.notificationBadge,
                { backgroundColor: primaryColor },
              ]}
            >
              <Text
                style={[
                  styles.notificationBadgeText,
                  { color: textOnPrimary },
                ]}
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.bottomDockText,
            active && { color: primaryColor },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  function renderMensajesUnificados(rolVista: RolMensajesVista) {
    if (mensajeSeleccionado) {
      return renderConversacionMensajeUnificada(mensajeSeleccionado, rolVista);
    }

    if (rolVista === "ADMIN") {
      if (modoMensajesAdmin === "NUEVO") {
        return renderAdminNuevoMensajeUnificado();
      }

      if (modoMensajesAdmin === "AUTOMATIZACIONES") {
        return renderAdminAutomatizacionesUnificadas();
      }
    }

    if (rolVista !== "ADMIN" && modoMensajesUsuario === "NUEVO") {
      return renderUsuarioNuevoMensajeUnificado(rolVista);
    }

    return renderBandejaMensajesUnificada(rolVista);
  }

  function obtenerConfigVistaMensajes(rolVista: RolMensajesVista) {
    if (rolVista === "ADMIN") {
      return {
        eyebrow: "Mensajes",
        subtitle: "Comunicación con clientes y entrenadores.",
        avatarUri: resolverUrlMedia(usuarioActivo?.fotoPerfilUrl),
        initials: obtenerIniciales(usuarioActivo?.nombre || "Admin"),
        onAvatarPress: () => abrirSeccionAdmin("PERSONALIZAR"),
      };
    }

    if (rolVista === "ENTRENADOR") {
      return {
        eyebrow: "Comunicación",
        subtitle: "Comunicación con tus alumnos.",
        avatarUri: resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl),
        initials: obtenerIniciales(entrenadorDemo?.nombre),
        onAvatarPress: () => setSeccionEntrenador("PERFIL"),
      };
    }

    return {
      eyebrow: "Mensajes",
      subtitle: `Tus conversaciones con ${nombreGimnasioApp}.`,
      avatarUri: resolverUrlMedia(clienteDemo?.fotoPerfilUrl),
      initials: obtenerIniciales(clienteDemo?.nombre),
      onAvatarPress: () => setSeccionCliente("PERFIL"),
    };
  }

  function renderHeaderMensajesUnificado({
    rolVista,
    title = "Mensajes",
    subtitle,
    onBack,
    compact = false,
  }: {
    rolVista: RolMensajesVista;
    title?: string;
    subtitle?: string;
    onBack?: () => void;
    compact?: boolean;
  }) {
    const config = obtenerConfigVistaMensajes(rolVista);

    if (onBack) {
      return (
        <View
          style={[
            styles.unifiedMessagesSubHeader,
            compact && styles.chatMessagesSubHeader,
          ]}
        >
          <View
            style={[
              styles.unifiedMessagesSubHeaderTop,
              compact && styles.chatMessagesSubHeaderTop,
            ]}
          >
            <Pressable
              style={[
                styles.clientAccountBackButton,
                {
                  backgroundColor: clienteHomeTheme.surface,
                  borderColor: clienteHomeTheme.border,
                },
              ]}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={clienteHomeTheme.text}
              />
            </Pressable>
            <PremiumAvatar
              uri={config.avatarUri}
              initials={config.initials}
              size={48}
              theme={clienteHomeTheme}
              onPress={config.onAvatarPress}
            />
          </View>
          <View
            style={[
              styles.unifiedMessagesSubHeaderCopy,
              compact && styles.chatMessagesSubHeaderCopy,
            ]}
          >
            <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
              {config.eyebrow}
            </Text>
            <Text
              style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            <Text
              style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}
              numberOfLines={3}
            >
              {subtitle || config.subtitle}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.clientMessagesHeader}>
        <View style={styles.clientMessagesHeaderCopy}>
          <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
            {config.eyebrow}
          </Text>
          <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
            {subtitle || config.subtitle}
          </Text>
        </View>
        <PremiumAvatar
          uri={config.avatarUri}
          initials={config.initials}
          size={52}
          theme={clienteHomeTheme}
          onPress={config.onAvatarPress}
        />
      </View>
    );
  }

  function renderAccionesAdminMensajes() {
    return (
      <View style={styles.unifiedMessagesAdminActions}>
        <Pressable
          style={[
            styles.unifiedMessagesAdminAction,
            { backgroundColor: colorPrimarioVisibleApp },
          ]}
          onPress={() => {
            setMensajeSeleccionadoId(null);
            setModoMensajesAdmin("NUEVO");
          }}
          accessibilityRole="button"
          accessibilityLabel="Nuevo mensaje"
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={colorTextoSobrePrimarioApp}
          />
          <Text
            style={[
              styles.unifiedMessagesAdminActionText,
              { color: colorTextoSobrePrimarioApp },
            ]}
            numberOfLines={1}
          >
            Nuevo mensaje
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.unifiedMessagesAdminAction,
            styles.unifiedMessagesAdminSecondaryAction,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
          onPress={() => {
            setMensajeSeleccionadoId(null);
            setModoMensajesAdmin("AUTOMATIZACIONES");
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver automatizaciones"
        >
          <MaterialCommunityIcons
            name="calendar-sync-outline"
            size={18}
            color={colorPrimarioVisibleApp}
          />
          <Text
            style={[
              styles.unifiedMessagesAdminActionText,
              { color: clienteHomeTheme.text },
            ]}
            numberOfLines={1}
          >
            Automatizaciones
          </Text>
        </Pressable>
      </View>
    );
  }

  function renderUsuarioAccesoMensajes(rolVista: RolMensajesVista) {
    if (rolVista === "ADMIN") {
      return null;
    }

    const activo = mensajesUsuariosPermitidosApp;

    return (
      <PremiumCard
        theme={clienteHomeTheme}
        style={[
          styles.unifiedMessagesAccessCard,
          {
            backgroundColor: mezclarColores(
              activo ? colorPrimarioVisibleApp : clienteHomeTheme.muted,
              clienteHomeTheme.surface,
              0.94,
            ),
          },
        ]}
      >
        <View
          style={[
            styles.unifiedMessagesAccessIcon,
            {
              backgroundColor: mezclarColores(
                activo ? colorPrimarioVisibleApp : clienteHomeTheme.muted,
                clienteHomeTheme.surface,
                0.86,
              ),
            },
          ]}
        >
          <MaterialCommunityIcons
            name={activo ? "message-plus-outline" : "message-lock-outline"}
            size={22}
            color={activo ? colorPrimarioVisibleApp : clienteHomeTheme.muted}
          />
        </View>
        <View style={styles.unifiedMessagesAccessCopy}>
          <Text style={[styles.unifiedMessagesAccessTitle, { color: clienteHomeTheme.text }]}>
            {activo ? "Canal abierto" : "Solo lectura"}
          </Text>
          <Text style={[styles.unifiedMessagesAccessText, { color: clienteHomeTheme.muted }]}>
            {activo
              ? "Puedes escribir directamente al equipo de administración."
              : "Puedes leer comunicados. Administración activa las respuestas."}
          </Text>
        </View>
        <Pressable
          style={[
            styles.unifiedMessagesAccessButton,
            { backgroundColor: activo ? colorPrimarioVisibleApp : clienteHomeTheme.surface },
            !activo && { borderColor: clienteHomeTheme.border, borderWidth: 1 },
          ]}
          onPress={abrirCompositorMensajeUsuario}
          disabled={!activo}
          accessibilityRole="button"
          accessibilityLabel="Nuevo mensaje"
        >
          <MaterialCommunityIcons
            name={activo ? "plus" : "lock-outline"}
            size={18}
            color={activo ? colorTextoSobrePrimarioApp : clienteHomeTheme.muted}
          />
        </Pressable>
      </PremiumCard>
    );
  }

  function renderBandejaMensajesUnificada(rolVista: RolMensajesVista) {
    const hayBusqueda = busquedaMensajesUnificada.length > 0;
    const hayFiltro = filtroMensajes !== "TODOS";
    const sinResultados = conversacionesUnificadas.length === 0;
    const tituloVacio = hayBusqueda
      ? "Sin resultados"
      : filtroMensajes === "NO_LEIDOS"
        ? "No hay conversaciones sin leer"
        : filtroMensajes === "PRIORITARIOS"
          ? "No hay conversaciones prioritarias"
          : filtroMensajes === "AUTOMATICOS"
            ? "No hay mensajes automáticos"
            : "No tienes conversaciones todavía";
    const textoVacio = hayBusqueda
      ? "Prueba con otro nombre, asunto, destinatario o palabra del mensaje."
      : filtroMensajes === "NO_LEIDOS"
        ? "Cuando llegue algo nuevo aparecerá aquí."
        : "Las conversaciones aparecerán aquí ordenadas por actividad.";
    const filtros = [
      { value: "TODOS", label: `Todos ${resumenConversacionesUnificadas.TODOS}` },
      {
        value: "NO_LEIDOS",
        label: `Sin leer ${resumenConversacionesUnificadas.NO_LEIDOS}`,
      },
      {
        value: "PRIORITARIOS",
        label: `Prioritarios ${resumenConversacionesUnificadas.PRIORITARIOS}`,
      },
      {
        value: "AUTOMATICOS",
        label: `Automáticos ${resumenConversacionesUnificadas.AUTOMATICOS}`,
      },
    ] as const;

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderHeaderMensajesUnificado({ rolVista })}

        {rolVista === "ADMIN" ? renderAccionesAdminMensajes() : renderUsuarioAccesoMensajes(rolVista)}

        {renderClienteMensajesFeedback()}

        <View
          style={[
            styles.clientMessagesSearchBox,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={clienteHomeTheme.muted} />
          <TextInput
            value={busquedaMensajes}
            onChangeText={(texto) => {
              setBusquedaMensajes(texto);
              if (feedbackMensajesCliente) {
                setFeedbackMensajesCliente(null);
              }
            }}
            placeholder="Buscar mensajes..."
            placeholderTextColor={clienteHomeTheme.muted}
            style={[styles.clientMessagesSearchInput, { color: clienteHomeTheme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {hayBusqueda && (
            <Pressable
              style={styles.clientMessagesSearchClear}
              onPress={() => setBusquedaMensajes("")}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <MaterialCommunityIcons name="close" size={18} color={clienteHomeTheme.muted} />
            </Pressable>
          )}
        </View>

        <View style={styles.unifiedMessagesFilterRow}>
          {filtros.map((filtro) => (
            <PremiumFilterChip
              key={filtro.value}
              label={filtro.label}
              active={filtroMensajes === filtro.value}
              theme={clienteHomeTheme}
              onPress={() => setFiltroMensajes(filtro.value)}
            />
          ))}
          {hayFiltro && (
            <PremiumFilterChip
              label="Quitar filtro"
              active={false}
              theme={clienteHomeTheme}
              onPress={() => setFiltroMensajes("TODOS")}
            />
          )}
        </View>

        <PremiumSectionHeader
          title="Conversaciones"
          actionLabel={
            mensajesNoLeidosUnificados.length > 0
              ? `Marcar como leídas (${mensajesNoLeidosUnificados.length})`
              : undefined
          }
          onAction={
            mensajesNoLeidosUnificados.length > 0
              ? marcarConversacionesUnificadasComoLeidas
              : undefined
          }
          theme={clienteHomeTheme}
        />

        {cargando ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.clientMessagesLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando conversaciones...
            </Text>
          </PremiumCard>
        ) : errorCargaMensajes && conversacionesUnificadasBase.length === 0 ? (
          <PremiumEmptyState
            icon="wifi-alert"
            title="No se pudieron cargar"
            text="Revisa la conexión con el backend y vuelve a intentarlo."
            actionLabel="Reintentar"
            onAction={() => cargarDatos(false)}
            theme={clienteHomeTheme}
          />
        ) : sinResultados ? (
          <PremiumEmptyState
            icon={hayBusqueda ? "magnify" : "message-text-outline"}
            title={tituloVacio}
            text={textoVacio}
            actionLabel={
              hayBusqueda
                ? "Limpiar búsqueda"
                : rolVista !== "ADMIN" && mensajesUsuariosPermitidosApp
                  ? "Nuevo mensaje"
                  : undefined
            }
            onAction={
              hayBusqueda
                ? () => setBusquedaMensajes("")
                : rolVista !== "ADMIN" && mensajesUsuariosPermitidosApp
                  ? abrirCompositorMensajeUsuario
                  : undefined
            }
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.unifiedMessagesList}>
            {conversacionesUnificadas.map((conversacion) =>
              renderTarjetaConversacionUnificada(conversacion, rolVista),
            )}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function obtenerParticipanteConversacion(
    conversacion: ConversacionMensaje,
    rolVista: RolMensajesVista,
  ) {
    const mensaje = conversacion.mensaje;
    const esPropio = mensajeEnviadoPorUsuarioActual(mensaje);
    const destinatarios = obtenerUsuariosDestinatariosMensaje(mensaje);
    const remitenteUsuario = usuariosGimnasio.find(
      (usuario) => usuario.id === mensaje.remitenteId,
    );
    const esComunicado =
      mensaje.automatico ||
      mensaje.audiencia !== "INDIVIDUAL" ||
      (mensaje.destinatariosCount || destinatarios.length) > 1;

    if (esComunicado) {
      const totalDestinatarios =
        mensaje.destinatariosCount || destinatarios.length || 0;
      const audiencia = obtenerEtiquetaDestinoMensaje(mensaje);

      return {
        titulo:
          rolVista === "ADMIN"
            ? `${audiencia} · ${pluralizar(totalDestinatarios, "destinatario", "destinatarios")}`
            : mensaje.automatico
              ? `Aviso de ${nombreGimnasioApp}`
              : nombreGimnasioApp,
        subtitulo: mensaje.automatico ? "Automático" : "Comunicado",
        avatarUri: null,
        initials: "GF",
        icon: (mensaje.automatico ? "bell-ring-outline" : "bullhorn-outline") as IconName,
        esComunicado,
      };
    }

    const usuarioObjetivo = esPropio ? destinatarios[0] : remitenteUsuario;
    const nombre = esPropio
      ? usuarioObjetivo?.nombre || obtenerResumenDestinatariosMensaje(mensaje)
      : mensaje.remitente || "Administración";
    const rol = usuarioObjetivo?.rol || (esPropio ? undefined : remitenteUsuario?.rol);
    const subtitulo =
      rol === "CLIENTE"
        ? "Cliente"
        : rol === "ENTRENADOR"
          ? "Entrenador"
          : rol === "ADMIN"
            ? "Administración"
            : esPropio
              ? "Destinatario"
              : "Administración";

    return {
      titulo: nombre,
      subtitulo,
      avatarUri: resolverUrlMedia(usuarioObjetivo?.fotoPerfilUrl),
      initials: obtenerIniciales(nombre),
      icon: "message-text-outline" as IconName,
      esComunicado,
    };
  }

  function obtenerNombreChatSinRol(nombre: string) {
    const nombreLimpio = nombre
      .replace(
        /\s*(?:[·|-]\s*)?\(?(?:administraci[oó]n|administrador(?:a)?|admin|entrenador(?:a)?|cliente)\)?$/i,
        "",
      )
      .trim();

    return nombreLimpio || nombre.trim();
  }

  function renderCabeceraChatCompacta({
    participante,
    asunto,
    onBack,
  }: {
    participante: ReturnType<typeof obtenerParticipanteConversacion>;
    asunto: string;
    onBack: () => void;
  }) {
    const colorTexto = obtenerColorContraste(colorSecundarioVisibleApp);
    const nombreSinRol = obtenerNombreChatSinRol(participante.titulo);
    const rolSeparado =
      nombreSinRol && nombreSinRol !== participante.titulo.trim()
        ? participante.subtitulo
        : null;
    const contexto = rolSeparado ? `${rolSeparado} · ${asunto}` : asunto;
    const colorTextoSecundario = mezclarColores(
      colorTexto,
      colorSecundarioVisibleApp,
      0.2,
    );
    const colorSuperficieControl = mezclarColores(
      colorTexto,
      colorSecundarioVisibleApp,
      0.82,
    );
    const temaAvatar: GymFlowTheme = {
      ...clienteHomeTheme,
      primary: colorTexto,
      textOnPrimary: colorSecundarioVisibleApp,
    };

    return (
      <View
        style={[
          styles.chatCompactHeader,
          {
            backgroundColor: colorSecundarioVisibleApp,
            borderBottomColor: mezclarColores(
              colorTexto,
              colorSecundarioVisibleApp,
              0.78,
            ),
          },
        ]}
      >
        <Pressable
          style={[
            styles.chatCompactBackButton,
            { backgroundColor: colorSuperficieControl },
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver a mensajes"
          hitSlop={7}
        >
          <MaterialCommunityIcons name="arrow-left" size={23} color={colorTexto} />
        </Pressable>

        <PremiumAvatar
          uri={participante.avatarUri}
          initials={participante.initials}
          size={44}
          theme={temaAvatar}
        />

        <View style={styles.chatCompactHeaderCopy}>
          <Text
            style={[styles.chatCompactHeaderName, { color: colorTexto }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {nombreSinRol || participante.titulo}
          </Text>
          <Text
            style={[styles.chatCompactHeaderSubject, { color: colorTextoSecundario }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {contexto}
          </Text>
        </View>
      </View>
    );
  }

  function renderTarjetaConversacionUnificada(
    conversacion: ConversacionMensaje,
    rolVista: RolMensajesVista,
  ) {
    const mensaje = conversacion.mensaje;
    const participante = obtenerParticipanteConversacion(conversacion, rolVista);
    const esPropio = mensajeEnviadoPorUsuarioActual(mensaje);
    const tieneNoLeidos = conversacion.noLeidos > 0;
    const prioridad = conversacion.mensajes.find(
      (mensajeHilo) =>
        mensajeHilo.prioridad === "IMPORTANTE" ||
        mensajeHilo.prioridad === "URGENTE",
    )?.prioridad;
    const prioridadConfig = obtenerConfigPrioridadMensaje(prioridad);
    const lecturas = obtenerLecturasMensaje(mensaje);
    const mostrarLecturasTarjeta =
      rolVista === "ADMIN" &&
      esPropio &&
      lecturas.total > 1 &&
      participante.esComunicado;
    const preview = `${esPropio ? "Tú: " : ""}${mensaje.texto}`
      .replace(/\s+/g, " ")
      .trim();
    const colorAcento = participante.esComunicado
      ? colorSecundarioVisibleApp
      : colorPrimarioVisibleApp;

    return (
      <PremiumCard
        key={conversacion.id}
        theme={clienteHomeTheme}
        style={[
          styles.unifiedConversationCard,
          tieneNoLeidos && {
            borderColor: mezclarColores(
              colorPrimarioVisibleApp,
              clienteHomeTheme.surface,
              0.48,
            ),
          },
        ]}
        onPress={() => abrirConversacionMensaje(conversacion)}
      >
        <View style={styles.unifiedConversationAvatarWrap}>
          {participante.avatarUri ? (
            <PremiumAvatar
              uri={participante.avatarUri}
              initials={participante.initials}
              size={48}
              theme={clienteHomeTheme}
            />
          ) : (
            <View
              style={[
                styles.unifiedConversationIcon,
                {
                  backgroundColor: mezclarColores(
                    colorAcento,
                    clienteHomeTheme.surface,
                    0.88,
                  ),
                },
              ]}
            >
              <MaterialCommunityIcons
                name={participante.icon}
                size={23}
                color={colorAcento}
              />
            </View>
          )}
          {tieneNoLeidos && (
            <View
              style={[
                styles.unifiedUnreadDot,
                { backgroundColor: colorPrimarioVisibleApp },
              ]}
            />
          )}
        </View>

        <View style={styles.unifiedConversationCopy}>
          <View style={styles.unifiedConversationTop}>
            <Text
              style={[
                styles.unifiedConversationName,
                { color: clienteHomeTheme.text },
                tieneNoLeidos && styles.unifiedConversationNameUnread,
              ]}
              numberOfLines={1}
            >
              {participante.titulo}
            </Text>
            <Text
              style={[styles.unifiedConversationDate, { color: clienteHomeTheme.muted }]}
              numberOfLines={1}
            >
              {mensaje.fecha}
            </Text>
          </View>
          <Text
            style={[styles.unifiedConversationSubject, { color: clienteHomeTheme.text }]}
            numberOfLines={1}
          >
            {obtenerAsuntoMensaje(mensaje)}
          </Text>
          <Text
            style={[styles.unifiedConversationPreview, { color: clienteHomeTheme.muted }]}
            numberOfLines={2}
          >
            {preview || "Sin contenido"}
          </Text>

          <View style={styles.unifiedConversationMetaRow}>
            <View
              style={[
                styles.unifiedMessageBadge,
                {
                  backgroundColor: mezclarColores(
                    colorAcento,
                    clienteHomeTheme.surface,
                    0.9,
                  ),
                },
              ]}
            >
              <Text style={[styles.unifiedMessageBadgeText, { color: colorAcento }]}>
                {participante.subtitulo}
              </Text>
            </View>
            {conversacion.total > 1 && (
              <Text style={[styles.unifiedConversationCount, { color: clienteHomeTheme.muted }]}>
                {pluralizar(conversacion.total, "mensaje", "mensajes")}
              </Text>
            )}
            {!!prioridad && (
              <View
                style={[
                  styles.unifiedMessageBadge,
                  { backgroundColor: prioridadConfig.background },
                ]}
              >
                <MaterialCommunityIcons
                  name={prioridadConfig.icon}
                  size={12}
                  color={prioridadConfig.color}
                />
                <Text
                  style={[
                    styles.unifiedMessageBadgeText,
                    { color: prioridadConfig.color },
                  ]}
                >
                  {prioridadConfig.label}
                </Text>
              </View>
            )}
            {mostrarLecturasTarjeta && (
              <View style={styles.unifiedReadMini}>
                <MaterialCommunityIcons
                  name="eye-check-outline"
                  size={13}
                  color={colorSecundarioVisibleApp}
                />
                <Text style={[styles.unifiedReadMiniText, { color: colorSecundarioVisibleApp }]}>
                {lecturas.leidos}/{lecturas.total}{" "}
                {lecturas.leidos === 1 ? "leído" : "leídos"}
                </Text>
              </View>
            )}
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={21} color={clienteHomeTheme.muted} />
      </PremiumCard>
    );
  }

  function renderConversacionMensajeUnificada(
    mensaje: MensajeApp,
    rolVista: RolMensajesVista,
  ) {
    const mensajesHilo =
      mensajesConversacionSeleccionada.length > 0
        ? mensajesConversacionSeleccionada
        : [mensaje];
    const conversacion: ConversacionMensaje = {
      id: obtenerClaveConversacion(mensaje),
      mensaje,
      mensajes: mensajesHilo,
      total: mensajesHilo.length,
      noLeidos: mensajesHilo.filter(
        (mensajeHilo) =>
          !mensajeHilo.leido && !mensajeEnviadoPorUsuarioActual(mensajeHilo),
      ).length,
    };
    const participante = obtenerParticipanteConversacion(conversacion, rolVista);
    const lecturas = obtenerLecturasMensaje(mensaje);
    const mostrarLecturas =
      rolVista === "ADMIN" &&
      mensajeEnviadoPorUsuarioActual(mensaje) &&
      lecturas.total > 1 &&
      participante.esComunicado;
    const destinatariosLectura = obtenerEstadoDestinatariosMensaje(mensaje);
    const renderFilaLectura = ({
      usuario,
      leido,
    }: (typeof destinatariosLectura)[number]) => (
      <View style={styles.unifiedReadRow}>
        <PremiumAvatar
          uri={resolverUrlMedia(usuario.fotoPerfilUrl)}
          initials={obtenerIniciales(usuario.nombre)}
          size={36}
          theme={clienteHomeTheme}
        />
        <View style={styles.unifiedReadUserCopy}>
          <Text
            style={[styles.unifiedReadUserName, { color: clienteHomeTheme.text }]}
            numberOfLines={1}
          >
            {usuario.nombre}
          </Text>
          <Text style={[styles.unifiedReadUserRole, { color: clienteHomeTheme.muted }]}>
            {usuario.rol === "CLIENTE"
              ? "Cliente"
              : usuario.rol === "ENTRENADOR"
                ? "Entrenador"
                : "Administración"}
          </Text>
        </View>
        <View
          style={[
            styles.unifiedReadStatus,
            {
              backgroundColor: leido
                ? mezclarColores(
                    colorSecundarioVisibleApp,
                    clienteHomeTheme.surface,
                    0.88,
                  )
                : mezclarColores(
                    clienteHomeTheme.muted,
                    clienteHomeTheme.surface,
                    0.9,
                  ),
            },
          ]}
        >
          <Text
            style={[
              styles.unifiedReadStatusText,
              { color: leido ? colorSecundarioVisibleApp : clienteHomeTheme.muted },
            ]}
          >
            {leido ? "Visto" : "Pendiente"}
          </Text>
        </View>
      </View>
    );
    const renderPanelLecturas = () => (
      <PremiumCard theme={clienteHomeTheme} style={styles.unifiedReadCard}>
        <View style={styles.unifiedReadHeader}>
          <View>
            <Text style={[styles.unifiedReadTitle, { color: clienteHomeTheme.text }]}>
              Lecturas
            </Text>
            <Text style={[styles.unifiedReadSubtitle, { color: clienteHomeTheme.muted }]}>
              {lecturas.leidos} de {lecturas.total}
            </Text>
          </View>
          <View
            style={[
              styles.unifiedMessageBadge,
              {
                backgroundColor: mezclarColores(
                  colorSecundarioVisibleApp,
                  clienteHomeTheme.surface,
                  0.88,
                ),
              },
            ]}
          >
            <Text
              style={[
                styles.unifiedMessageBadgeText,
                { color: colorSecundarioVisibleApp },
              ]}
            >
              {Math.round(
                lecturas.total > 0 ? (lecturas.leidos / lecturas.total) * 100 : 0,
              )}
              %
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.unifiedReadTrack,
            { backgroundColor: clienteHomeTheme.surfaceSoft },
          ]}
        >
          <View
            style={[
              styles.unifiedReadFill,
              {
                width: lecturas.porcentaje as `${number}%`,
                backgroundColor: colorSecundarioVisibleApp,
              },
            ]}
          />
        </View>
        <View style={styles.unifiedReadList}>
          {destinatariosLectura.map((item) => (
            <View key={item.usuario.id}>{renderFilaLectura(item)}</View>
          ))}
        </View>
      </PremiumCard>
    );
    const renderMensajeHilo = ({ item: mensajeHilo }: { item: MensajeApp }) => {
      const esPropio = mensajeEnviadoPorUsuarioActual(mensajeHilo);
      const autor = esPropio
        ? "Tú"
        : mensajeHilo.automatico
          ? "Sistema"
          : obtenerNombreChatSinRol(mensajeHilo.remitente || nombreGimnasioApp);

      return (
        <View
          style={[
            styles.unifiedMessageBubbleWrap,
            esPropio && styles.unifiedMessageBubbleWrapOwn,
          ]}
        >
          <View
            style={[
              styles.unifiedMessageBubble,
              esPropio && styles.unifiedMessageBubbleOwn,
              {
                backgroundColor: esPropio
                  ? colorPrimarioVisibleApp
                  : clienteHomeTheme.surface,
                borderColor: esPropio
                  ? colorPrimarioVisibleApp
                  : clienteHomeTheme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.unifiedMessageBubbleAuthor,
                { color: esPropio ? colorTextoSobrePrimarioApp : clienteHomeTheme.text },
              ]}
              numberOfLines={1}
            >
              {autor}
            </Text>
            <Text
              style={[
                styles.unifiedMessageBubbleText,
                { color: esPropio ? colorTextoSobrePrimarioApp : clienteHomeTheme.text },
              ]}
            >
              {mensajeHilo.texto}
            </Text>
            <Text
              style={[
                styles.unifiedMessageBubbleDate,
                { color: esPropio ? colorTextoSobrePrimarioApp : clienteHomeTheme.muted },
              ]}
            >
              {mensajeHilo.fecha}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <PremiumScreenContainer
        theme={clienteHomeTheme}
        style={styles.chatScreenContainer}
      >
        <View style={styles.chatFixedHeader}>
          {renderCabeceraChatCompacta({
            participante,
            asunto: obtenerAsuntoMensaje(mensaje),
            onBack: () => {
              setMensajeSeleccionadoId(null);
              setFeedbackMensajesCliente(null);
            },
          })}

          {renderClienteMensajesFeedback()}
        </View>

        {mostrarLecturas ? (
          <ScrollView
            style={styles.chatMessagesList}
            contentContainerStyle={[
              styles.chatReadScrollContent,
              { backgroundColor: clienteHomeTheme.background },
            ]}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mensajesHilo.map((mensajeHilo, index) => (
              <View key={mensajeHilo.id}>
                {renderMensajeHilo({ item: mensajeHilo })}
                {index < mensajesHilo.length - 1 && (
                  <View style={styles.chatMessageSeparator} />
                )}
              </View>
            ))}
            {renderPanelLecturas()}
          </ScrollView>
        ) : (
          <FlatList
            ref={chatMessagesListRef}
            data={mensajesHilo}
            keyExtractor={(mensajeHilo) => String(mensajeHilo.id)}
            renderItem={renderMensajeHilo}
            style={styles.chatMessagesList}
            contentContainerStyle={[
              styles.chatMessagesListContent,
              styles.chatMessagesListContentRegular,
              { backgroundColor: clienteHomeTheme.background },
            ]}
            ItemSeparatorComponent={() => <View style={styles.chatMessageSeparator} />}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={manejarContenidoChatDimensionado}
            onLayout={() => manejarContenidoChatDimensionado()}
            onScroll={manejarScrollChat}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.chatComposerFixed}>
          {puedeResponderMensaje ? (
            <View
              style={[
                styles.clientMessagesReplyBox,
                styles.chatMessagesReplyBox,
                {
                  backgroundColor: clienteHomeTheme.surface,
                  borderColor: clienteHomeTheme.border,
                },
              ]}
            >
              <TextInput
                value={respuestaMensaje}
                onChangeText={(texto) => {
                  setRespuestaMensaje(texto);
                  if (feedbackMensajesCliente?.tipo === "error") {
                    setFeedbackMensajesCliente(null);
                  }
                }}
                placeholder="Escribe una respuesta..."
                placeholderTextColor={clienteHomeTheme.muted}
                style={[
                  styles.clientMessagesReplyInput,
                  styles.chatMessagesReplyInput,
                  { color: clienteHomeTheme.text },
                ]}
                multiline
                textAlignVertical="top"
                autoCorrect
                blurOnSubmit={false}
              />
              <Pressable
                style={[
                  styles.clientMessagesSendButton,
                  { backgroundColor: colorPrimarioVisibleApp },
                  (!respuestaMensaje.trim() || guardandoRespuestaMensaje) &&
                    styles.clientMessagesSendButtonDisabled,
                  (!respuestaMensaje.trim() || guardandoRespuestaMensaje) &&
                    styles.chatMessagesSendButtonDisabled,
                ]}
                disabled={!respuestaMensaje.trim() || guardandoRespuestaMensaje}
                onPress={enviarRespuestaMensaje}
                accessibilityRole="button"
                accessibilityLabel="Enviar respuesta"
              >
                {guardandoRespuestaMensaje ? (
                  <ActivityIndicator size="small" color={colorTextoSobrePrimarioApp} />
                ) : (
                  <MaterialCommunityIcons
                    name="send"
                    size={20}
                    color={colorTextoSobrePrimarioApp}
                  />
                )}
              </Pressable>
            </View>
          ) : (
            <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesReplyDisabledCard}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={clienteHomeTheme.muted} />
              <Text style={[styles.clientMessagesReplyDisabledText, { color: clienteHomeTheme.muted }]}>
                Este comunicado no admite respuesta directa.
              </Text>
            </PremiumCard>
          )}
        </View>
      </PremiumScreenContainer>
    );
  }

  function renderUsuarioNuevoMensajeUnificado(rolVista: RolMensajesVista) {
    const puedeEnviar =
      mensajesUsuariosPermitidosApp &&
      asuntoMensaje.trim().length > 0 &&
      textoMensaje.trim().length > 0 &&
      adminsGimnasio.length > 0 &&
      !guardandoMensaje;

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderHeaderMensajesUnificado({
          rolVista,
          title: "Nueva consulta",
          subtitle: `Escribe al equipo de ${nombreGimnasioApp}.`,
          onBack: () => {
            limpiarFormularioMensaje();
            setModoMensajesUsuario("BANDEJA");
            setFeedbackMensajesCliente(null);
          },
        })}

        {renderClienteMensajesFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.unifiedComposerCard}>
          <View
            style={[
              styles.unifiedComposerNotice,
              {
                backgroundColor: mezclarColores(
                  colorSecundarioVisibleApp,
                  clienteHomeTheme.surface,
                  0.91,
                ),
                borderColor: clienteHomeTheme.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={20}
              color={colorSecundarioVisibleApp}
            />
            <Text style={[styles.unifiedComposerNoticeText, { color: clienteHomeTheme.muted }]}>
              Se enviará a {pluralizar(adminsGimnasio.length, "administrador activo", "administradores activos")}.
            </Text>
          </View>

          {renderClienteMensajeInput({
            label: "Asunto",
            icon: "email-outline",
            value: asuntoMensaje,
            onChangeText: setAsuntoMensaje,
            placeholder: "Ej. Duda sobre mi reserva",
            returnKeyType: "next",
          })}

          {renderClienteMensajeInput({
            label: "Mensaje",
            icon: "message-text-outline",
            value: textoMensaje,
            onChangeText: setTextoMensaje,
            placeholder: "Cuéntanos qué necesitas...",
            multiline: true,
            textAlignVertical: "top",
          })}

          <PremiumPrimaryButton
            label={guardandoMensaje ? "Enviando" : "Enviar consulta"}
            icon="send-outline"
            theme={clienteHomeTheme}
            loading={guardandoMensaje}
            disabled={!puedeEnviar}
            onPress={enviarMensajeUsuarioAdmin}
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function renderAdminNuevoMensajeUnificado() {
    const audiencias = [
      {
        value: "TODOS",
        label: "Todos",
        icon: "account-group-outline",
        count: destinatariosMensajeDisponibles.length,
      },
      {
        value: "CLIENTES",
        label: "Clientes",
        icon: "account-outline",
        count: clientesActivos.length,
      },
      {
        value: "ENTRENADORES",
        label: "Entrenadores",
        icon: "account-tie-outline",
        count: entrenadoresActivos.length,
      },
      {
        value: "INDIVIDUAL",
        label: "Persona",
        icon: "account-check-outline",
        count: destinatariosSeleccionadosMensaje.length,
      },
    ] as const;
    const programaciones = [
      { value: "AHORA", label: "Ahora", icon: "send-outline" },
      { value: "FECHA", label: "Fecha", icon: "calendar-clock-outline" },
      { value: "RECURRENTE", label: "Recurrente", icon: "autorenew" },
    ] as const;
    const frecuencias = [
      { value: "DIARIA", label: "Diaria" },
      { value: "SEMANAL", label: "Semanal" },
      { value: "MENSUAL", label: "Mensual" },
    ] as const;
    const prioridades = [
      { value: "NORMAL", label: "Normal", icon: "message-outline" },
      { value: "IMPORTANTE", label: "Importante", icon: "alert-circle-outline" },
      { value: "URGENTE", label: "Urgente", icon: "alert-octagon-outline" },
    ] as const;
    const puedeEnviar =
      asuntoMensaje.trim().length > 0 &&
      textoMensaje.trim().length > 0 &&
      totalDestinatariosMensaje > 0 &&
      !guardandoMensaje;
    const fechaProgramadaVista =
      tipoProgramacionMensaje === "AHORA"
        ? null
        : normalizarFechaProgramadaMensaje();
    const fechaEntregaTexto = formatearFechaProgramadaMensaje(fechaProgramadaVista);
    const entregaTexto =
      tipoProgramacionMensaje === "AHORA"
        ? "Se enviará ahora dentro de la app."
        : tipoProgramacionMensaje === "FECHA"
          ? `Quedará programado para ${
              fechaProgramadaVista
                ? formatearFechaProgramadaMensaje(fechaProgramadaVista)
                : "la fecha indicada"
            }.`
          : `Se repetirá de forma ${frecuenciaMensaje.toLowerCase()} desde ${
              fechaProgramadaVista
                ? formatearFechaProgramadaMensaje(fechaProgramadaVista)
                : "la fecha indicada"
            }.`;

    return (
      <>
        <PremiumScreenContainer theme={clienteHomeTheme}>
          {renderHeaderMensajesUnificado({
            rolVista: "ADMIN",
          title: "Nuevo mensaje",
          subtitle: "Envía una conversación o comunicado sin llenar la bandeja de controles.",
          onBack: volverDesdeNuevoMensajeAdmin,
        })}

        {renderClienteMensajesFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.unifiedComposerCard}>
          <View style={styles.unifiedComposerSectionHeader}>
            <Text style={[styles.unifiedComposerSectionTitle, { color: clienteHomeTheme.text }]}>
              Destinatarios
            </Text>
            <Text style={[styles.unifiedRecipientsCount, { color: clienteHomeTheme.muted }]}>
              {pluralizar(totalDestinatariosMensaje, "destinatario", "destinatarios")}
            </Text>
          </View>

          <View style={styles.unifiedOptionGrid}>
            {audiencias.map((audiencia) => {
              const activo = audienciaMensaje === audiencia.value;

              return (
                <Pressable
                  key={audiencia.value}
                  style={[
                    styles.unifiedOptionButton,
                    {
                      backgroundColor: activo
                        ? mezclarColores(
                            colorPrimarioVisibleApp,
                            clienteHomeTheme.surface,
                            0.9,
                          )
                        : clienteHomeTheme.surfaceSoft,
                      borderColor: activo
                        ? colorPrimarioVisibleApp
                        : clienteHomeTheme.border,
                    },
                  ]}
                  onPress={() => seleccionarAudienciaMensaje(audiencia.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                >
                  <MaterialCommunityIcons
                    name={audiencia.icon}
                    size={20}
                    color={activo ? colorPrimarioVisibleApp : clienteHomeTheme.muted}
                  />
                  <View style={styles.unifiedOptionCopy}>
                    <Text
                      style={[
                        styles.unifiedOptionTitle,
                        { color: activo ? colorPrimarioVisibleApp : clienteHomeTheme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {audiencia.label}
                    </Text>
                    <Text style={[styles.unifiedOptionMeta, { color: clienteHomeTheme.muted }]}>
                      {audiencia.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {audienciaMensaje === "INDIVIDUAL" && (
            <View style={styles.unifiedRecipientsBlock}>
              <Text style={[styles.unifiedComposerSectionTitle, { color: clienteHomeTheme.text }]}>
                Destinatario
              </Text>
              {destinatarioIndividualSeleccionado ? (
                <View
                  style={[
                    styles.unifiedSelectedPersonCard,
                    {
                      backgroundColor: mezclarColores(
                        colorPrimarioVisibleApp,
                        clienteHomeTheme.surface,
                        0.93,
                      ),
                      borderColor: colorConAlpha(colorPrimarioVisibleApp, "30"),
                    },
                  ]}
                >
                  <PremiumAvatar
                    uri={resolverUrlMedia(destinatarioIndividualSeleccionado.fotoPerfilUrl)}
                    initials={obtenerIniciales(destinatarioIndividualSeleccionado.nombre)}
                    size={42}
                    theme={clienteHomeTheme}
                  />
                  <View style={styles.unifiedRecipientCopy}>
                    <Text
                      style={[styles.unifiedRecipientName, { color: clienteHomeTheme.text }]}
                      numberOfLines={1}
                    >
                      {destinatarioIndividualSeleccionado.nombre}
                    </Text>
                    <Text style={[styles.unifiedRecipientRole, { color: clienteHomeTheme.muted }]}>
                      {destinatarioIndividualSeleccionado.rol === "CLIENTE"
                        ? "Cliente"
                        : "Entrenador"}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.unifiedSelectedPersonSmallAction}
                    onPress={() => setSelectorPersonaMensajeVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Cambiar persona"
                  >
                    <MaterialCommunityIcons
                      name="swap-horizontal"
                      size={18}
                      color={colorPrimarioVisibleApp}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.unifiedSelectedPersonSmallAction}
                    onPress={quitarDestinatarioIndividualMensaje}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar persona"
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={18}
                      color={clienteHomeTheme.muted}
                    />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[
                    styles.unifiedPersonPickerButton,
                    {
                      backgroundColor: clienteHomeTheme.surfaceSoft,
                      borderColor: clienteHomeTheme.border,
                    },
                  ]}
                  onPress={() => setSelectorPersonaMensajeVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Seleccionar persona"
                >
                  <View
                    style={[
                      styles.unifiedPersonPickerIcon,
                      {
                        backgroundColor: mezclarColores(
                          colorPrimarioVisibleApp,
                          clienteHomeTheme.surface,
                          0.88,
                        ),
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-search-outline"
                      size={21}
                      color={colorPrimarioVisibleApp}
                    />
                  </View>
                  <View style={styles.unifiedRecipientCopy}>
                    <Text style={[styles.unifiedRecipientName, { color: clienteHomeTheme.text }]}>
                      Seleccionar persona
                    </Text>
                    <Text style={[styles.unifiedRecipientRole, { color: clienteHomeTheme.muted }]}>
                      Busca por nombre o email
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={clienteHomeTheme.muted}
                  />
                </Pressable>
              )}
            </View>
          )}

          {renderClienteMensajeInput({
            label: "Asunto",
            icon: "email-outline",
            value: asuntoMensaje,
            onChangeText: setAsuntoMensaje,
            placeholder: "Ej. Cambio en el horario de una clase",
            returnKeyType: "next",
          })}

          {renderClienteMensajeInput({
            label: "Mensaje",
            icon: "message-text-outline",
            value: textoMensaje,
            onChangeText: setTextoMensaje,
            placeholder: "Escribe el mensaje...",
            multiline: true,
            textAlignVertical: "top",
          })}

          <Text style={[styles.unifiedComposerSectionTitle, { color: clienteHomeTheme.text }]}>
            Prioridad
          </Text>
          <View style={styles.unifiedDeliveryRow}>
            {prioridades.map((prioridad) => {
              const activo = prioridadMensaje === prioridad.value;
              return (
                <PremiumFilterChip
                  key={prioridad.value}
                  label={prioridad.label}
                  active={activo}
                  theme={clienteHomeTheme}
                  onPress={() => setPrioridadMensaje(prioridad.value)}
                />
              );
            })}
          </View>

          <Text style={[styles.unifiedComposerSectionTitle, { color: clienteHomeTheme.text }]}>
            Entrega
          </Text>
          <View style={styles.unifiedDeliveryRow}>
            {programaciones.map((programacion) => {
              const activo = tipoProgramacionMensaje === programacion.value;

              return (
                <PremiumFilterChip
                  key={programacion.value}
                  label={programacion.label}
                  active={activo}
                  theme={clienteHomeTheme}
                  onPress={() => {
                    setTipoProgramacionMensaje(programacion.value);
                    if (programacion.value === "RECURRENTE") {
                      asegurarFechaProgramadaMensaje();
                      setFrecuenciaMensaje((frecuenciaActual) =>
                        frecuenciaActual === "NINGUNA" ? "SEMANAL" : frecuenciaActual,
                      );
                    } else if (programacion.value === "FECHA") {
                      asegurarFechaProgramadaMensaje();
                    } else {
                      setFrecuenciaMensaje("NINGUNA");
                    }
                  }}
                />
              );
            })}
          </View>

          {tipoProgramacionMensaje !== "AHORA" && (
            <View style={styles.unifiedDateTimeBlock}>
              <Text style={[styles.unifiedComposerSectionTitle, { color: clienteHomeTheme.text }]}>
                {tipoProgramacionMensaje === "RECURRENTE"
                  ? "Fecha y hora inicial"
                  : "Fecha y hora"}
              </Text>
              <Pressable
                style={[
                  styles.unifiedDateTimeButton,
                  {
                    backgroundColor: clienteHomeTheme.surfaceSoft,
                    borderColor: clienteHomeTheme.border,
                  },
                ]}
                onPress={abrirSelectorFechaMensaje}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar fecha y hora"
              >
                <View
                  style={[
                    styles.unifiedDateTimeIcon,
                    {
                      backgroundColor: mezclarColores(
                        colorSecundarioVisibleApp,
                        clienteHomeTheme.surface,
                        0.88,
                      ),
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-clock-outline"
                    size={22}
                    color={colorSecundarioVisibleApp}
                  />
                </View>
                <View style={styles.unifiedDateTimeCopy}>
                  <Text style={[styles.unifiedDateTimeValue, { color: clienteHomeTheme.text }]}>
                    {fechaEntregaTexto}
                  </Text>
                  <Text style={[styles.unifiedDateTimeHint, { color: clienteHomeTheme.muted }]}>
                    Toca para cambiar día y hora.
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={clienteHomeTheme.muted}
                />
              </Pressable>
            </View>
          )}

          {tipoProgramacionMensaje === "RECURRENTE" && (
            <View style={styles.unifiedDateTimeBlock}>
              <Text style={[styles.unifiedComposerSectionTitle, { color: clienteHomeTheme.text }]}>
                Frecuencia
              </Text>
              <View style={styles.unifiedDeliveryRow}>
                {frecuencias.map((frecuencia) => (
                  <PremiumFilterChip
                    key={frecuencia.value}
                    label={frecuencia.label}
                    active={frecuenciaMensaje === frecuencia.value}
                    theme={clienteHomeTheme}
                    onPress={() => setFrecuenciaMensaje(frecuencia.value)}
                  />
                ))}
              </View>
            </View>
          )}

          <View
            style={[
              styles.unifiedComposerPreview,
              {
                backgroundColor: mezclarColores(
                  colorPrimarioVisibleApp,
                  clienteHomeTheme.surface,
                  0.93,
                ),
                borderColor: clienteHomeTheme.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                tipoProgramacionMensaje === "AHORA"
                  ? "send-outline"
                  : tipoProgramacionMensaje === "FECHA"
                    ? "calendar-clock-outline"
                    : "autorenew"
              }
              size={22}
              color={colorPrimarioVisibleApp}
            />
            <View style={styles.unifiedComposerPreviewCopy}>
              <Text style={[styles.unifiedComposerPreviewTitle, { color: clienteHomeTheme.text }]}>
                {obtenerEtiquetaAudiencia(audienciaMensaje, totalDestinatariosMensaje)}
              </Text>
              <Text style={[styles.unifiedComposerPreviewText, { color: clienteHomeTheme.muted }]}>
                {entregaTexto}
              </Text>
            </View>
          </View>

          <PremiumPrimaryButton
            label={
              guardandoMensaje
                ? "Guardando"
                : tipoProgramacionMensaje === "AHORA"
                  ? "Enviar mensaje"
                  : "Guardar automatización"
            }
            icon={tipoProgramacionMensaje === "AHORA" ? "send-outline" : "calendar-plus-outline"}
            theme={clienteHomeTheme}
            loading={guardandoMensaje}
            disabled={!puedeEnviar}
            onPress={enviarMensaje}
          />
        </PremiumCard>
        </PremiumScreenContainer>
        {renderSelectorPersonaMensajeModal()}
        {renderSelectorFechaMensajeModal()}
      </>
    );
  }

  function renderSelectorPersonaMensajeModal() {
    const hayBusqueda = busquedaDestinatariosNormalizada.length > 0;
    const hayResultadosRecortados =
      destinatariosSelectorPersonaFiltrados.length >
      destinatariosSelectorPersonaVisibles.length;
    const resultadoMeta = hayResultadosRecortados
      ? `Mostrando ${destinatariosSelectorPersonaVisibles.length} de ${destinatariosSelectorPersonaFiltrados.length}`
      : pluralizar(
          destinatariosSelectorPersonaFiltrados.length,
          "persona encontrada",
          "personas encontradas",
        );

    return (
      <Modal
        visible={selectorPersonaMensajeVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelectorPersonaMensajeVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.unifiedPersonModalRoot}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.unifiedPersonModalBackdrop}
            onPress={() => setSelectorPersonaMensajeVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar selector"
          />
          <View
            style={[
              styles.unifiedPersonSheet,
              {
                backgroundColor: clienteHomeTheme.surface,
                borderColor: clienteHomeTheme.border,
                paddingBottom: tecladoVisible
                  ? 12
                  : Math.max(Math.min(insets.bottom, 18), 12),
                maxHeight: Math.min(
                  windowHeight - Math.max(insets.top, 18) - (tecladoVisible ? 16 : 28),
                  tecladoVisible ? 560 : 660,
                ),
              },
            ]}
          >
            <View style={styles.unifiedPersonSheetHeader}>
              <View style={styles.unifiedPersonSheetCopy}>
                <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
                  Destinatario
                </Text>
                <Text style={[styles.unifiedPersonSheetTitle, { color: clienteHomeTheme.text }]}>
                  Seleccionar persona
                </Text>
                <Text
                  style={[styles.unifiedPersonSheetSubtitle, { color: clienteHomeTheme.muted }]}
                >
                  Busca por nombre o email sin perder el mensaje que ya estabas preparando.
                </Text>
              </View>
              <Pressable
                style={[
                  styles.unifiedPersonSheetClose,
                  {
                    backgroundColor: clienteHomeTheme.surfaceSoft,
                    borderColor: clienteHomeTheme.border,
                  },
                ]}
                onPress={() => setSelectorPersonaMensajeVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <MaterialCommunityIcons name="close" size={21} color={clienteHomeTheme.text} />
              </Pressable>
            </View>

            <View
              style={[
                styles.clientMessagesSearchBox,
                {
                  backgroundColor: clienteHomeTheme.surfaceSoft,
                  borderColor: clienteHomeTheme.border,
                },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={22} color={clienteHomeTheme.muted} />
              <TextInput
                value={busquedaDestinatariosMensaje}
                onChangeText={setBusquedaDestinatariosMensaje}
                placeholder="Buscar persona..."
                placeholderTextColor={clienteHomeTheme.muted}
                style={[styles.clientMessagesSearchInput, { color: clienteHomeTheme.text }]}
                returnKeyType="search"
              />
              {hayBusqueda && (
                <Pressable
                  style={styles.clientMessagesSearchClear}
                  onPress={() => setBusquedaDestinatariosMensaje("")}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                >
                  <MaterialCommunityIcons name="close" size={18} color={clienteHomeTheme.muted} />
                </Pressable>
              )}
            </View>

            <View style={styles.unifiedPersonFilterRow}>
              {([
                { value: "TODOS", label: "Todos" },
                { value: "CLIENTES", label: "Clientes" },
                { value: "ENTRENADORES", label: "Entrenadores" },
              ] as const).map((filtro) => (
                <PremiumFilterChip
                  key={filtro.value}
                  label={filtro.label}
                  active={filtroSelectorPersonasMensaje === filtro.value}
                  theme={clienteHomeTheme}
                  onPress={() => setFiltroSelectorPersonasMensaje(filtro.value)}
                />
              ))}
            </View>

            <Text style={[styles.unifiedPersonResultsMeta, { color: clienteHomeTheme.muted }]}>
              {resultadoMeta}
            </Text>

            {destinatariosSelectorPersonaFiltrados.length === 0 ? (
              <View
                style={[
                  styles.unifiedPersonEmpty,
                  {
                    backgroundColor: clienteHomeTheme.surfaceSoft,
                    borderColor: clienteHomeTheme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-search-outline"
                  size={26}
                  color={clienteHomeTheme.muted}
                />
                <Text style={[styles.unifiedPersonEmptyTitle, { color: clienteHomeTheme.text }]}>
                  Sin resultados
                </Text>
                <Text style={[styles.unifiedPersonEmptyText, { color: clienteHomeTheme.muted }]}>
                  Prueba con otro nombre, email o filtro.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={[
                  styles.unifiedPersonResultList,
                  {
                    maxHeight: tecladoVisible
                      ? Math.min(windowHeight * 0.24, 220)
                      : Math.min(windowHeight * 0.38, 340),
                  },
                ]}
                contentContainerStyle={styles.unifiedPersonResultListContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {destinatariosSelectorPersonaVisibles.map((usuario) => {
                  const seleccionado = usuario.id === destinatarioIndividualSeleccionado?.id;
                  const rolTexto = usuario.rol === "CLIENTE" ? "Cliente" : "Entrenador";

                  return (
                    <Pressable
                      key={`${usuario.rol}-${usuario.id}`}
                      style={[
                        styles.unifiedPersonRow,
                        {
                          backgroundColor: seleccionado
                            ? mezclarColores(
                                colorPrimarioVisibleApp,
                                clienteHomeTheme.surface,
                                0.92,
                              )
                            : clienteHomeTheme.surface,
                          borderColor: seleccionado
                            ? colorConAlpha(colorPrimarioVisibleApp, "42")
                            : clienteHomeTheme.border,
                        },
                      ]}
                      onPress={() => seleccionarDestinatarioIndividualMensaje(usuario.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar ${usuario.nombre}`}
                    >
                      <PremiumAvatar
                        uri={resolverUrlMedia(usuario.fotoPerfilUrl)}
                        initials={obtenerIniciales(usuario.nombre)}
                        size={42}
                        theme={clienteHomeTheme}
                      />
                      <View style={styles.unifiedPersonRowCopy}>
                        <Text
                          style={[styles.unifiedRecipientName, { color: clienteHomeTheme.text }]}
                          numberOfLines={1}
                        >
                          {usuario.nombre}
                        </Text>
                        <Text
                          style={[
                            styles.unifiedRecipientRole,
                            { color: colorSecundarioVisibleApp },
                          ]}
                          numberOfLines={1}
                        >
                          {rolTexto}
                        </Text>
                        {!!usuario.email && (
                          <Text
                            style={[
                              styles.unifiedPersonRowEmail,
                              { color: clienteHomeTheme.muted },
                            ]}
                            numberOfLines={1}
                          >
                            {usuario.email}
                          </Text>
                        )}
                      </View>
                      <MaterialCommunityIcons
                        name={seleccionado ? "check-circle" : "chevron-right"}
                        size={22}
                        color={seleccionado ? colorPrimarioVisibleApp : clienteHomeTheme.muted}
                      />
                    </Pressable>
                  );
                })}
                {hayResultadosRecortados && (
                  <Text style={[styles.unifiedPersonMoreHint, { color: clienteHomeTheme.muted }]}>
                    Hay más resultados. Usa la búsqueda para afinar.
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  function renderSelectorFechaMensajeModal() {
    return (
      <Modal
        visible={selectorFechaMensajeVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={cancelarSelectorFechaMensaje}
      >
        <KeyboardAvoidingView
          style={styles.unifiedPersonModalRoot}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.unifiedPersonModalBackdrop}
            onPress={cancelarSelectorFechaMensaje}
            accessibilityRole="button"
            accessibilityLabel="Cancelar selección de fecha"
          />
          <View
            style={[
              styles.unifiedDateSheet,
              {
                backgroundColor: clienteHomeTheme.surface,
                borderColor: clienteHomeTheme.border,
                paddingBottom: tecladoVisible
                  ? 12
                  : Math.max(Math.min(insets.bottom, 18), 12),
              },
            ]}
          >
            <View style={styles.unifiedPersonSheetHeader}>
              <View style={styles.unifiedPersonSheetCopy}>
                <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
                  Entrega
                </Text>
                <Text style={[styles.unifiedPersonSheetTitle, { color: clienteHomeTheme.text }]}>
                  Fecha y hora
                </Text>
                <Text
                  style={[styles.unifiedPersonSheetSubtitle, { color: clienteHomeTheme.muted }]}
                >
                  Elige cuándo se enviará el mensaje.
                </Text>
              </View>
              <Pressable
                style={[
                  styles.unifiedPersonSheetClose,
                  {
                    backgroundColor: clienteHomeTheme.surfaceSoft,
                    borderColor: clienteHomeTheme.border,
                  },
                ]}
                onPress={cancelarSelectorFechaMensaje}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <MaterialCommunityIcons name="close" size={21} color={clienteHomeTheme.text} />
              </Pressable>
            </View>

            <View style={styles.unifiedDateInputsRow}>
              <View style={styles.unifiedDateInputGroup}>
                <Text style={[styles.unifiedDateInputLabel, { color: clienteHomeTheme.muted }]}>
                  Día
                </Text>
                <View
                  style={[
                    styles.unifiedDateInputShell,
                    {
                      backgroundColor: clienteHomeTheme.surfaceSoft,
                      borderColor: clienteHomeTheme.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={19}
                    color={colorSecundarioVisibleApp}
                  />
                  <TextInput
                    value={fechaMensajeTemporal}
                    onChangeText={(texto) => {
                      setFechaMensajeTemporal(texto);
                      setErrorFechaMensajeTemporal(null);
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={clienteHomeTheme.muted}
                    style={[styles.unifiedDateTextInput, { color: clienteHomeTheme.text }]}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.unifiedDateInputGroup}>
                <Text style={[styles.unifiedDateInputLabel, { color: clienteHomeTheme.muted }]}>
                  Hora
                </Text>
                <View
                  style={[
                    styles.unifiedDateInputShell,
                    {
                      backgroundColor: clienteHomeTheme.surfaceSoft,
                      borderColor: clienteHomeTheme.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={19}
                    color={colorSecundarioVisibleApp}
                  />
                  <TextInput
                    value={horaMensajeTemporal}
                    onChangeText={(texto) => {
                      setHoraMensajeTemporal(texto);
                      setErrorFechaMensajeTemporal(null);
                    }}
                    placeholder="HH:mm"
                    placeholderTextColor={clienteHomeTheme.muted}
                    style={[styles.unifiedDateTextInput, { color: clienteHomeTheme.text }]}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="done"
                    onSubmitEditing={confirmarSelectorFechaMensaje}
                  />
                </View>
              </View>
            </View>

            {!!errorFechaMensajeTemporal && (
              <View
                style={[
                  styles.unifiedDateError,
                  {
                    backgroundColor: "#FEF2F2",
                    borderColor: "#FECACA",
                  },
                ]}
              >
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={[styles.unifiedDateErrorText, { color: "#DC2626" }]}>
                  {errorFechaMensajeTemporal}
                </Text>
              </View>
            )}

            <View style={styles.unifiedDateModalActions}>
              <PremiumSecondaryButton
                label="Cancelar"
                theme={clienteHomeTheme}
                onPress={cancelarSelectorFechaMensaje}
                style={styles.unifiedDateModalButton}
              />
              <PremiumPrimaryButton
                label="Confirmar"
                icon="check"
                theme={clienteHomeTheme}
                onPress={confirmarSelectorFechaMensaje}
                style={styles.unifiedDateModalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  function renderAdminAutomatizacionesUnificadas() {
    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderHeaderMensajesUnificado({
          rolVista: "ADMIN",
          title: "Automatizaciones",
          subtitle: "Gestiona avisos programados y reglas recurrentes.",
          onBack: () => {
            setModoMensajesAdmin("BANDEJA");
            setFeedbackMensajesCliente(null);
          },
        })}

        {renderClienteMensajesFeedback()}

        <Pressable
          style={[
            styles.unifiedMessagesAutomationAction,
            { backgroundColor: colorPrimarioVisibleApp },
          ]}
          onPress={() => {
            setTipoProgramacionMensaje("RECURRENTE");
            setFrecuenciaMensaje("MENSUAL");
            asegurarFechaProgramadaMensaje();
            setModoMensajesAdmin("NUEVO");
          }}
          accessibilityRole="button"
          accessibilityLabel="Crear automatización"
        >
          <MaterialCommunityIcons
            name="plus"
            size={19}
            color={colorTextoSobrePrimarioApp}
          />
          <Text style={[styles.unifiedMessagesAdminActionText, { color: colorTextoSobrePrimarioApp }]}>
            Nueva automatización
          </Text>
        </Pressable>

        <PremiumCard
          theme={clienteHomeTheme}
          style={[styles.unifiedAutomationCard, styles.unifiedAutomationSystemCard]}
        >
          <View
            style={[
              styles.unifiedMessagesAccessIcon,
              {
                backgroundColor: mezclarColores(
                  colorSecundarioVisibleApp,
                  clienteHomeTheme.surface,
                  0.88,
                ),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={22}
              color={colorSecundarioVisibleApp}
            />
          </View>
          <View style={styles.unifiedAutomationCopy}>
            <Text style={[styles.unifiedAutomationTitle, { color: clienteHomeTheme.text }]}>
              Bienvenida automática
            </Text>
            <Text style={[styles.unifiedAutomationText, { color: clienteHomeTheme.muted }]}>
              Cada usuario nuevo recibe su bienvenida al crear la cuenta.
            </Text>
            <Text style={[styles.unifiedAutomationMeta, { color: colorSecundarioVisibleApp }]}>
              Sistema · nuevos usuarios
            </Text>
          </View>
        </PremiumCard>

        {automatizacionesMensajes.length === 0 ? (
          <PremiumEmptyState
            icon="calendar-sync-outline"
            title="Sin automatizaciones"
            text="Crea avisos recurrentes o programados cuando quieras automatizar una comunicación."
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.unifiedMessagesList}>
            {automatizacionesMensajes.map((mensaje) => (
              <PremiumCard key={mensaje.id} theme={clienteHomeTheme} style={styles.unifiedAutomationCard}>
                <View
                  style={[
                    styles.unifiedMessagesAccessIcon,
                    {
                      backgroundColor: mezclarColores(
                        colorPrimarioVisibleApp,
                        clienteHomeTheme.surface,
                        0.88,
                      ),
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      mensaje.tipoProgramacion === "RECURRENTE"
                        ? "autorenew"
                        : "calendar-clock-outline"
                    }
                    size={22}
                    color={colorPrimarioVisibleApp}
                  />
                </View>
                <View style={styles.unifiedAutomationCopy}>
                  <Text style={[styles.unifiedAutomationTitle, { color: clienteHomeTheme.text }]} numberOfLines={1}>
                    {obtenerAsuntoMensaje(mensaje)}
                  </Text>
                  <Text style={[styles.unifiedAutomationText, { color: clienteHomeTheme.muted }]} numberOfLines={2}>
                    {mensaje.texto}
                  </Text>
                  <Text style={[styles.unifiedAutomationMeta, { color: clienteHomeTheme.muted }]}>
                    {mensaje.segmentoLabel || obtenerEtiquetaDestinoMensaje(mensaje)} · {formatearFechaProgramadaMensaje(mensaje.fecha)}
                  </Text>
                  <View style={styles.unifiedAutomationActions}>
                    <Pressable
                      style={[
                        styles.unifiedAutomationSmallButton,
                        {
                          backgroundColor: clienteHomeTheme.surfaceSoft,
                          borderColor: clienteHomeTheme.border,
                        },
                      ]}
                      onPress={() =>
                        mensaje.estado === "PAUSADO"
                          ? reanudarAutomatizacionMensaje(mensaje)
                          : pausarAutomatizacionMensaje(mensaje)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        mensaje.estado === "PAUSADO"
                          ? "Reanudar automatización"
                          : "Pausar automatización"
                      }
                    >
                      <MaterialCommunityIcons
                        name={mensaje.estado === "PAUSADO" ? "play-circle-outline" : "pause-circle-outline"}
                        size={16}
                        color={clienteHomeTheme.muted}
                      />
                      <Text style={[styles.unifiedAutomationSmallText, { color: clienteHomeTheme.text }]}>
                        {mensaje.estado === "PAUSADO" ? "Reanudar" : "Pausar"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.unifiedAutomationSmallButton,
                        {
                          backgroundColor: "#FEF2F2",
                          borderColor: "#FECACA",
                        },
                      ]}
                      onPress={() => eliminarAutomatizacionMensaje(mensaje)}
                      accessibilityRole="button"
                      accessibilityLabel="Eliminar automatización"
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={16}
                        color="#DC2626"
                      />
                      <Text style={[styles.unifiedAutomationSmallText, { color: "#DC2626" }]}>
                        Eliminar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </PremiumCard>
            ))}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function renderEntrenadorMensajesPremium() {
    if (mensajeSeleccionado) {
      return renderEntrenadorConversacionPremium(mensajeSeleccionado);
    }

    if (modoMensajesUsuario === "NUEVO") {
      return renderEntrenadorNuevoMensajePremium();
    }

    return renderEntrenadorBandejaMensajesPremium();
  }

  function renderEntrenadorMensajesHeader({
    title = "Mensajes",
    subtitle = "Comunícate con tus alumnos",
    eyebrow = "Comunicación",
    onBack,
    showNewAction = true,
  }: {
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    onBack?: () => void;
    showNewAction?: boolean;
  } = {}) {
    return (
      <View style={styles.clientMessagesHeader}>
        {!!onBack && (
          <Pressable
            style={[
              styles.clientAccountBackButton,
              {
                backgroundColor: clienteHomeTheme.surface,
                borderColor: clienteHomeTheme.border,
              },
            ]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={clienteHomeTheme.text}
            />
          </Pressable>
        )}
        <View style={styles.clientMessagesHeaderCopy}>
          <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.clientMessagesHeaderActions}>
          {showNewAction && (
            <Pressable
              style={[
                styles.clientMessagesNewIconButton,
                { backgroundColor: colorPrimarioVisibleApp },
                !mensajesUsuariosPermitidosApp &&
                  styles.clientMessagesNewIconButtonDisabled,
              ]}
              onPress={abrirCompositorMensajeUsuario}
              disabled={!mensajesUsuariosPermitidosApp}
              accessibilityRole="button"
              accessibilityLabel="Crear nuevo mensaje"
            >
              <MaterialCommunityIcons
                name={mensajesUsuariosPermitidosApp ? "plus" : "lock-outline"}
                size={22}
                color={colorTextoSobrePrimarioApp}
              />
            </Pressable>
          )}
          <PremiumAvatar
            uri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
            initials={obtenerIniciales(entrenadorDemo?.nombre)}
            size={52}
            theme={clienteHomeTheme}
            onPress={() => setSeccionEntrenador("PERFIL")}
          />
        </View>
      </View>
    );
  }

  function renderEntrenadorBandejaMensajesPremium() {
    const hayBusqueda = busquedaMensajesNormalizada.length > 0;
    const hayFiltroSecundario = filtroMensajes !== "TODOS";
    const sinResultados = conversacionesMensajes.length === 0;
    const emptyTitle = hayBusqueda
      ? "Sin resultados"
      : filtroMensajes === "NO_LEIDOS"
        ? "No tienes mensajes sin leer"
        : filtroMensajes === "PRIORITARIOS"
          ? "Sin mensajes prioritarios"
          : filtroMensajes === "AUTOMATICOS"
            ? "Sin mensajes automáticos"
            : buzonMensajes === "ENVIADOS"
              ? "Sin mensajes enviados"
              : buzonMensajes === "RECIBIDOS"
                ? "Sin mensajes recibidos"
                : "No tienes mensajes";
    const emptyText = hayBusqueda
      ? "Prueba con otro nombre, asunto o palabra del mensaje."
      : filtroMensajes === "NO_LEIDOS"
        ? "Cuando haya algo nuevo de tus alumnos o del gimnasio aparecerá aquí."
        : filtroMensajes === "PRIORITARIOS"
          ? "Los mensajes importantes y urgentes aparecerán en este filtro."
          : filtroMensajes === "AUTOMATICOS"
            ? "Los avisos automáticos del gimnasio aparecerán aquí."
            : "Cuando recibas mensajes de tus alumnos o del gimnasio aparecerán aquí.";

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderEntrenadorMensajesHeader()}

        {renderEntrenadorAdministracionCard()}
        {renderEntrenadorMailboxTabs()}

        <View
          style={[
            styles.clientMessagesSearchBox,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={clienteHomeTheme.muted} />
          <TextInput
            value={busquedaMensajes}
            onChangeText={(texto) => {
              setBusquedaMensajes(texto);
              if (feedbackMensajesCliente) {
                setFeedbackMensajesCliente(null);
              }
            }}
            placeholder="Buscar mensajes..."
            placeholderTextColor={clienteHomeTheme.muted}
            style={[styles.clientMessagesSearchInput, { color: clienteHomeTheme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {hayBusqueda && (
            <Pressable
              style={styles.clientMessagesSearchClear}
              onPress={() => setBusquedaMensajes("")}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <MaterialCommunityIcons name="close" size={18} color={clienteHomeTheme.muted} />
            </Pressable>
          )}
        </View>

        <View style={styles.trainerMessagesFilterRow}>
          {hayFiltroSecundario && (
            <PremiumFilterChip
              label="Quitar filtro"
              active={false}
              theme={clienteHomeTheme}
              onPress={() => setFiltroMensajes("TODOS")}
            />
          )}
          {([
            {
              value: "NO_LEIDOS",
              label: `Sin leer${resumenConversacionesMensajes.NO_LEIDOS > 0 ? ` ${resumenConversacionesMensajes.NO_LEIDOS}` : ""}`,
            },
            {
              value: "PRIORITARIOS",
              label: `Prioritarios${resumenConversacionesMensajes.PRIORITARIOS > 0 ? ` ${resumenConversacionesMensajes.PRIORITARIOS}` : ""}`,
            },
            {
              value: "AUTOMATICOS",
              label: `Automáticos${resumenConversacionesMensajes.AUTOMATICOS > 0 ? ` ${resumenConversacionesMensajes.AUTOMATICOS}` : ""}`,
            },
          ] as const).map((filtro) => (
            <PremiumFilterChip
              key={filtro.value}
              label={filtro.label}
              active={filtroMensajes === filtro.value}
              theme={clienteHomeTheme}
              onPress={() => setFiltroMensajes(filtro.value)}
            />
          ))}
        </View>

        {renderClienteMensajesFeedback()}

        <PremiumSectionHeader
          title="Conversaciones"
          actionLabel={
            mensajesNoLeidosVista.length > 0
              ? `Marcar como leídas (${mensajesNoLeidosVista.length})`
              : undefined
          }
          onAction={
            mensajesNoLeidosVista.length > 0
              ? marcarVistaMensajesComoLeida
              : undefined
          }
          theme={clienteHomeTheme}
        />

        {cargando ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.clientMessagesLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando mensajes...
            </Text>
          </PremiumCard>
        ) : errorCargaMensajes && mensajesBandejaBase.length === 0 ? (
          <PremiumEmptyState
            icon="wifi-alert"
            title="No se pudieron cargar"
            text="Revisa la conexión con el backend y vuelve a intentarlo."
            actionLabel="Reintentar"
            onAction={() => cargarDatos(false)}
            theme={clienteHomeTheme}
          />
        ) : sinResultados ? (
          <PremiumEmptyState
            icon={hayBusqueda ? "magnify" : "message-text-outline"}
            title={emptyTitle}
            text={emptyText}
            actionLabel={
              hayBusqueda
                ? "Limpiar búsqueda"
                : mensajesUsuariosPermitidosApp
                  ? "Nuevo mensaje"
                  : undefined
            }
            onAction={
              hayBusqueda
                ? () => setBusquedaMensajes("")
                : mensajesUsuariosPermitidosApp
                  ? abrirCompositorMensajeUsuario
                  : undefined
            }
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerMessagesList}>
            {conversacionesMensajes.map((conversacion) =>
              renderEntrenadorConversacionCard(conversacion),
            )}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorAdministracionCard() {
    const activo = mensajesUsuariosPermitidosApp;
    const adminIds = new Set(adminsGimnasio.map((admin) => admin.id));
    const conversacionAdministracion = conversacionesMensajesBaseFiltro.find(
      (conversacion) =>
        conversacion.mensajes.some(
          (mensaje) =>
            !mensaje.remitenteId ||
            adminIds.has(mensaje.remitenteId) ||
            mensaje.destinatarioIds?.some((id) => adminIds.has(id)),
        ),
    );
    const cardBackground = mezclarColores(
      colorPrimarioVisibleApp,
      clienteHomeTheme.surface,
      0.94,
    );
    const iconBackground = mezclarColores(
      colorPrimarioVisibleApp,
      clienteHomeTheme.surface,
      0.86,
    );

    return (
      <PremiumCard
        theme={clienteHomeTheme}
        style={[
          styles.trainerMessagesAdminCard,
          {
            backgroundColor: cardBackground,
            borderColor: clienteHomeTheme.border,
          },
        ]}
      >
        <View style={[styles.trainerMessagesAdminIcon, { backgroundColor: iconBackground }]}>
          <MaterialCommunityIcons
            name={activo ? "shield-account-outline" : "message-lock-outline"}
            size={24}
            color={colorPrimarioVisibleApp}
          />
        </View>
        <View style={styles.trainerMessagesAdminCopy}>
          <Text style={[styles.trainerMessagesAdminTitle, { color: clienteHomeTheme.text }]}>
            Administración
          </Text>
          <Text style={[styles.trainerMessagesAdminText, { color: clienteHomeTheme.muted }]}>
            {activo
              ? "Contacta con el equipo del gimnasio."
              : "El canal de respuesta está en solo lectura."}
          </Text>
        </View>
        <View style={styles.trainerMessagesAdminActions}>
          {!!conversacionAdministracion && (
            <Pressable
              style={[
                styles.trainerMessagesSmallAction,
                {
                  backgroundColor: clienteHomeTheme.surface,
                  borderColor: clienteHomeTheme.border,
                },
              ]}
              onPress={() => abrirConversacionMensaje(conversacionAdministracion)}
              accessibilityRole="button"
              accessibilityLabel="Abrir conversación con administración"
            >
              <Text style={[styles.trainerMessagesSmallActionText, { color: clienteHomeTheme.text }]}>
                Ver
              </Text>
            </Pressable>
          )}
          <Pressable
            style={[
              styles.trainerMessagesPrimarySmallAction,
              { backgroundColor: colorPrimarioVisibleApp },
              !activo && styles.clientMessagesNewIconButtonDisabled,
            ]}
            onPress={abrirCompositorMensajeUsuario}
            disabled={!activo}
            accessibilityRole="button"
            accessibilityLabel="Nuevo mensaje a administración"
          >
            <MaterialCommunityIcons
              name={activo ? "plus" : "lock-outline"}
              size={17}
              color={colorTextoSobrePrimarioApp}
            />
          </Pressable>
        </View>
      </PremiumCard>
    );
  }

  function renderEntrenadorMailboxTabs() {
    const tabs = [
      { value: "TODOS", label: "Todos", count: resumenGlobalMensajes.TODOS },
      { value: "RECIBIDOS", label: "Recibidos", count: resumenGlobalMensajes.RECIBIDOS },
      { value: "ENVIADOS", label: "Enviados", count: resumenGlobalMensajes.ENVIADOS },
    ] as const;

    return (
      <View
        style={[
          styles.trainerMessagesMailboxTabs,
          {
            backgroundColor: clienteHomeTheme.surface,
            borderColor: clienteHomeTheme.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const activo = buzonMensajes === tab.value;

          return (
            <Pressable
              key={tab.value}
              style={[
                styles.trainerMessagesMailboxTab,
                activo && {
                  backgroundColor: colorPrimarioVisibleApp,
                },
              ]}
              onPress={() => setBuzonMensajes(tab.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
            >
              <Text
                style={[
                  styles.trainerMessagesMailboxText,
                  { color: activo ? colorTextoSobrePrimarioApp : clienteHomeTheme.muted },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  style={[
                    styles.trainerMessagesMailboxBadge,
                    {
                      backgroundColor: activo
                        ? colorTextoSobrePrimarioApp
                        : mezclarColores(
                            colorSecundarioVisibleApp,
                            clienteHomeTheme.surface,
                            0.88,
                          ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.trainerMessagesMailboxBadgeText,
                      {
                        color: activo
                          ? colorPrimarioVisibleApp
                          : colorSecundarioVisibleApp,
                      },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  }

  function renderEntrenadorConversacionCard(conversacion: ConversacionMensaje) {
    const mensaje = conversacion.mensaje;
    const esEnviado = mensajeEnviadoPorUsuarioActual(mensaje);
    const tieneNoLeidos = conversacion.noLeidos > 0;
    const esAutomatico = conversacion.mensajes.some(
      (mensajeHilo) => mensajeHilo.automatico,
    );
    const mensajePrioritario = conversacion.mensajes.find(
      (mensajeHilo) =>
        mensajeHilo.prioridad === "IMPORTANTE" ||
        mensajeHilo.prioridad === "URGENTE",
    );
    const prioridadConfig = obtenerConfigPrioridadMensaje(
      mensajePrioritario?.prioridad,
    );
    const remitenteUsuario = usuariosGimnasio.find(
      (usuario) => usuario.id === mensaje.remitenteId,
    );
    const primerDestinatario = obtenerUsuariosDestinatariosMensaje(mensaje)[0];
    const avatarUsuario = esEnviado ? primerDestinatario : remitenteUsuario;
    const titulo = esEnviado
      ? obtenerResumenDestinatariosMensaje(mensaje)
      : esAutomatico
        ? "Sistema del gimnasio"
        : mensaje.remitente || "Administración";
    const asunto = obtenerAsuntoMensaje(mensaje);
    const preview = `${esEnviado ? "Tú: " : ""}${mensaje.texto}`
      .replace(/\s+/g, " ")
      .trim();
    const directionLabel = esEnviado ? "Enviado" : "Recibido";
    const accentColor = esAutomatico ? colorSecundarioVisibleApp : colorPrimarioVisibleApp;

    return (
      <PremiumCard
        key={conversacion.id}
        theme={clienteHomeTheme}
        style={[
          styles.trainerMessagesConversationCard,
          tieneNoLeidos && {
            borderColor: mezclarColores(
              colorPrimarioVisibleApp,
              clienteHomeTheme.surface,
              0.54,
            ),
          },
        ]}
        onPress={() => abrirConversacionMensaje(conversacion)}
      >
        <View style={styles.trainerMessagesUnreadRailWrap}>
          {tieneNoLeidos && (
            <View
              style={[
                styles.trainerMessagesUnreadRail,
                { backgroundColor: colorPrimarioVisibleApp },
              ]}
            />
          )}
        </View>
        <PremiumAvatar
          uri={resolverUrlMedia(avatarUsuario?.fotoPerfilUrl)}
          initials={obtenerIniciales(titulo)}
          size={46}
          theme={clienteHomeTheme}
        />
        <View style={styles.trainerMessagesConversationCopy}>
          <View style={styles.trainerMessagesConversationTop}>
            <Text
              style={[
                styles.trainerMessagesConversationTitle,
                { color: clienteHomeTheme.text },
                tieneNoLeidos && styles.trainerMessagesConversationTitleUnread,
              ]}
              numberOfLines={1}
            >
              {titulo}
            </Text>
            <Text
              style={[styles.trainerMessagesConversationDate, { color: clienteHomeTheme.muted }]}
              numberOfLines={1}
            >
              {mensaje.fecha}
            </Text>
          </View>
          <Text
            style={[styles.trainerMessagesConversationSubject, { color: clienteHomeTheme.text }]}
            numberOfLines={1}
          >
            {asunto || "Mensaje"}
          </Text>
          <Text
            style={[styles.trainerMessagesConversationPreview, { color: clienteHomeTheme.muted }]}
            numberOfLines={2}
          >
            {preview || "Sin contenido"}
          </Text>
          <View style={styles.trainerMessagesTags}>
            <View
              style={[
                styles.trainerMessagesTag,
                {
                  backgroundColor: mezclarColores(
                    accentColor,
                    clienteHomeTheme.surface,
                    0.9,
                  ),
                },
              ]}
            >
              <Text style={[styles.trainerMessagesTagText, { color: accentColor }]}>
                {directionLabel}
              </Text>
            </View>
            {tieneNoLeidos && (
              <View
                style={[
                  styles.trainerMessagesTag,
                  {
                    backgroundColor: mezclarColores(
                      colorPrimarioVisibleApp,
                      clienteHomeTheme.surface,
                      0.88,
                    ),
                  },
                ]}
              >
                <Text style={[styles.trainerMessagesTagText, { color: colorPrimarioVisibleApp }]}>
                  {conversacion.noLeidos === 1
                    ? "Nuevo"
                    : `${conversacion.noLeidos} nuevos`}
                </Text>
              </View>
            )}
            {esAutomatico && (
              <View style={[styles.trainerMessagesTag, { backgroundColor: "#F8FAFC" }]}>
                <MaterialCommunityIcons
                  name="autorenew"
                  size={12}
                  color={colorSecundarioVisibleApp}
                />
                <Text style={[styles.trainerMessagesTagText, { color: colorSecundarioVisibleApp }]}>
                  Automático
                </Text>
              </View>
            )}
            {!!mensajePrioritario && (
              <View
                style={[
                  styles.trainerMessagesTag,
                  { backgroundColor: prioridadConfig.background },
                ]}
              >
                <MaterialCommunityIcons
                  name={prioridadConfig.icon}
                  size={12}
                  color={prioridadConfig.color}
                />
                <Text style={[styles.trainerMessagesTagText, { color: prioridadConfig.color }]}>
                  {prioridadConfig.label}
                </Text>
              </View>
            )}
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={21} color={clienteHomeTheme.muted} />
      </PremiumCard>
    );
  }

  function renderEntrenadorConversacionPremium(mensaje: MensajeApp) {
    const mensajesHilo =
      mensajesConversacionSeleccionada.length > 0
        ? mensajesConversacionSeleccionada
        : [mensaje];
    const esEnviado = mensajeEnviadoPorUsuarioActual(mensaje);
    const asunto = obtenerAsuntoMensaje(mensaje);
    const destinatariosResumen = obtenerResumenDestinatariosMensaje(mensaje, 3);
    const interlocutor = esEnviado
      ? destinatariosResumen
      : mensaje.automatico
        ? "Sistema del gimnasio"
        : mensaje.remitente || "Administración";
    const prioridadConfig = obtenerConfigPrioridadMensaje(mensaje.prioridad);
    const estadoLabel =
      mensaje.estado === "PROGRAMADO"
        ? "Programado"
        : mensaje.estado === "ACTIVO"
          ? "Activo"
          : mensaje.estado === "PAUSADO"
            ? "Pausado"
            : "Enviado";
    const entregaLabel =
      mensaje.tipoProgramacion === "RECURRENTE"
        ? mensaje.frecuencia === "DIARIA"
          ? "Cada día"
          : mensaje.frecuencia === "SEMANAL"
            ? "Cada semana"
            : mensaje.frecuencia === "MENSUAL"
              ? "Cada mes"
              : "Recurrente"
        : mensaje.tipoProgramacion === "FECHA"
          ? "Programado"
          : "Inmediato";

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderEntrenadorMensajesHeader({
          title: interlocutor,
          subtitle: asunto || "Conversación",
          eyebrow: "Comunicación",
          onBack: () => {
            setMensajeSeleccionadoId(null);
            setFeedbackMensajesCliente(null);
          },
          showNewAction: false,
        })}

        {renderClienteMensajesFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.trainerMessagesDetailSummary}>
          <View
            style={[
              styles.trainerMessagesDetailIcon,
              {
                backgroundColor: mezclarColores(
                  colorPrimarioVisibleApp,
                  clienteHomeTheme.surface,
                  0.88,
                ),
              },
            ]}
          >
            <MaterialCommunityIcons
              name={mensaje.automatico ? "bell-ring-outline" : "message-text-outline"}
              size={24}
              color={colorPrimarioVisibleApp}
            />
          </View>
          <View style={styles.trainerMessagesDetailCopy}>
            <Text style={[styles.trainerMessagesDetailTitle, { color: clienteHomeTheme.text }]}>
              {mensaje.asunto}
            </Text>
            <Text style={[styles.trainerMessagesDetailMeta, { color: clienteHomeTheme.muted }]}>
              {esEnviado ? `Para ${destinatariosResumen}` : `De ${mensaje.remitente}`} · {mensaje.fecha}
            </Text>
          </View>
        </PremiumCard>

        <View style={styles.trainerMessagesDetailChips}>
          {renderEntrenadorMessageInfoChip(
            esEnviado ? "Enviado" : "Recibido",
            esEnviado ? "tray-arrow-up" : "tray-arrow-down",
            colorPrimarioVisibleApp,
          )}
          {renderEntrenadorMessageInfoChip(
            prioridadConfig.label,
            prioridadConfig.icon,
            prioridadConfig.color,
          )}
          {mensaje.automatico &&
            renderEntrenadorMessageInfoChip(
              "Automático",
              "autorenew",
              colorSecundarioVisibleApp,
            )}
          {renderEntrenadorMessageInfoChip(estadoLabel, "check-circle-outline", colorSecundarioVisibleApp)}
          {renderEntrenadorMessageInfoChip(entregaLabel, "calendar-clock-outline", clienteHomeTheme.muted)}
        </View>

        <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesThreadCard}>
          {mensajesHilo.map((mensajeHilo) => {
            const esMio = mensajeEnviadoPorUsuarioActual(mensajeHilo);
            const autor = esMio
              ? "Tú"
              : mensajeHilo.automatico
                ? "Sistema"
                : mensajeHilo.remitente || nombreGimnasioApp;

            return (
              <View
                key={mensajeHilo.id}
                style={[
                  styles.clientMessagesBubbleWrap,
                  esMio && styles.clientMessagesBubbleWrapOwn,
                ]}
              >
                <View
                  style={[
                    styles.clientMessagesBubble,
                    {
                      backgroundColor: esMio
                        ? colorPrimarioVisibleApp
                        : clienteHomeTheme.surfaceSoft,
                      borderColor: esMio
                        ? colorPrimarioVisibleApp
                        : clienteHomeTheme.border,
                    },
                  ]}
                >
                  <View style={styles.clientMessagesBubbleHeader}>
                    <Text
                      style={[
                        styles.clientMessagesBubbleAuthor,
                        { color: esMio ? colorTextoSobrePrimarioApp : clienteHomeTheme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {autor}
                    </Text>
                    {mensajeHilo.automatico && (
                      <View
                        style={[
                          styles.clientMessagesBubbleAutoTag,
                          {
                            backgroundColor: esMio
                              ? mezclarColores(
                                  colorTextoSobrePrimarioApp,
                                  colorPrimarioVisibleApp,
                                  0.82,
                                )
                              : mezclarColores(
                                  colorSecundarioVisibleApp,
                                  clienteHomeTheme.surface,
                                  0.88,
                                ),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.clientMessagesBubbleAutoText,
                            {
                              color: esMio
                                ? colorTextoSobrePrimarioApp
                                : colorSecundarioVisibleApp,
                            },
                          ]}
                        >
                          Auto
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.clientMessagesBubbleText,
                      { color: esMio ? colorTextoSobrePrimarioApp : clienteHomeTheme.text },
                    ]}
                  >
                    {mensajeHilo.texto}
                  </Text>
                  <Text
                    style={[
                      styles.clientMessagesBubbleDate,
                      {
                        color: esMio
                          ? colorTextoSobrePrimarioApp
                          : clienteHomeTheme.muted,
                      },
                    ]}
                  >
                    {mensajeHilo.fecha}
                  </Text>
                </View>
              </View>
            );
          })}
        </PremiumCard>

        {puedeResponderMensaje ? (
          <View
            style={[
              styles.clientMessagesReplyBox,
              {
                backgroundColor: clienteHomeTheme.surface,
                borderColor: clienteHomeTheme.border,
              },
            ]}
          >
            <TextInput
              value={respuestaMensaje}
              onChangeText={(texto) => {
                setRespuestaMensaje(texto);
                if (feedbackMensajesCliente?.tipo === "error") {
                  setFeedbackMensajesCliente(null);
                }
              }}
              placeholder="Escribe una respuesta..."
              placeholderTextColor={clienteHomeTheme.muted}
              style={[styles.clientMessagesReplyInput, { color: clienteHomeTheme.text }]}
              multiline
              textAlignVertical="top"
              autoCorrect
              blurOnSubmit={false}
              onFocus={(event) =>
                enfocarCampoRutina(findNodeHandle(event.target as any))
              }
            />
            <Pressable
              style={[
                styles.clientMessagesSendButton,
                { backgroundColor: colorPrimarioVisibleApp },
                (!respuestaMensaje.trim() || guardandoRespuestaMensaje) &&
                  styles.clientMessagesSendButtonDisabled,
              ]}
              disabled={!respuestaMensaje.trim() || guardandoRespuestaMensaje}
              onPress={enviarRespuestaMensaje}
              accessibilityRole="button"
              accessibilityLabel="Enviar respuesta"
            >
              {guardandoRespuestaMensaje ? (
                <ActivityIndicator size="small" color={colorTextoSobrePrimarioApp} />
              ) : (
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={colorTextoSobrePrimarioApp}
                />
              )}
            </Pressable>
          </View>
        ) : (
          <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesReplyDisabledCard}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={clienteHomeTheme.muted} />
            <Text style={[styles.clientMessagesReplyDisabledText, { color: clienteHomeTheme.muted }]}>
              Este mensaje no admite respuesta directa.
            </Text>
          </PremiumCard>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorMessageInfoChip(
    label: string,
    icon: IconName,
    color: string,
  ) {
    return (
      <View
        style={[
          styles.trainerMessagesDetailChip,
          {
            backgroundColor: mezclarColores(color, clienteHomeTheme.surface, 0.9),
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={14} color={color} />
        <Text style={[styles.trainerMessagesDetailChipText, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }

  function renderEntrenadorNuevoMensajePremium() {
    const puedeEnviar =
      mensajesUsuariosPermitidosApp &&
      asuntoMensaje.trim().length > 0 &&
      textoMensaje.trim().length > 0 &&
      adminsGimnasio.length > 0 &&
      !guardandoMensaje;

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderEntrenadorMensajesHeader({
          title: "Nuevo mensaje",
          subtitle: "Escribe al equipo de administración.",
          eyebrow: "Comunicación",
          onBack: () => {
            limpiarFormularioMensaje();
            setModoMensajesUsuario("BANDEJA");
            setFeedbackMensajesCliente(null);
          },
          showNewAction: false,
        })}

        {renderClienteMensajesFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesComposerCard}>
          <View
            style={[
              styles.clientMessagesComposerNotice,
              {
                backgroundColor: mezclarColores(
                  colorSecundarioVisibleApp,
                  clienteHomeTheme.surface,
                  0.9,
                ),
                borderColor: mezclarColores(
                  colorSecundarioVisibleApp,
                  clienteHomeTheme.surface,
                  0.72,
                ),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={19}
              color={colorSecundarioVisibleApp}
            />
            <Text style={[styles.clientMessagesComposerNoticeText, { color: clienteHomeTheme.muted }]}>
              Se enviará a {pluralizar(adminsGimnasio.length, "administrador activo", "administradores activos")}.
            </Text>
          </View>

          {renderEntrenadorMensajeInput({
            label: "Asunto",
            icon: "email-outline",
            value: asuntoMensaje,
            onChangeText: setAsuntoMensaje,
            placeholder: "Ej. Duda sobre un alumno",
            returnKeyType: "next",
          })}

          {renderEntrenadorMensajeInput({
            label: "Mensaje",
            icon: "message-text-outline",
            value: textoMensaje,
            onChangeText: setTextoMensaje,
            placeholder: "Cuéntanos qué necesitas...",
            multiline: true,
            textAlignVertical: "top",
          })}

          <PremiumPrimaryButton
            label={guardandoMensaje ? "Enviando" : "Enviar mensaje"}
            icon="send-outline"
            theme={clienteHomeTheme}
            loading={guardandoMensaje}
            disabled={!puedeEnviar}
            onPress={enviarMensajeUsuarioAdmin}
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorMensajeInput({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    returnKeyType,
    textAlignVertical,
  }: {
    label: string;
    icon: IconName;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
    textAlignVertical?: ComponentProps<typeof TextInput>["textAlignVertical"];
  }) {
    return (
      <View style={styles.clientAccountInputGroup}>
        <Text style={[styles.clientAccountLabel, { color: clienteHomeTheme.text }]}>
          {label}
        </Text>
        <View
          style={[
            styles.clientMessagesInputShell,
            multiline && styles.clientMessagesTextAreaShell,
            {
              backgroundColor: clienteHomeTheme.surfaceSoft,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={20} color={colorSecundarioVisibleApp} />
          <TextInput
            value={value}
            onChangeText={(texto) => {
              onChangeText(texto);
              if (feedbackMensajesCliente?.tipo === "error") {
                setFeedbackMensajesCliente(null);
              }
            }}
            placeholder={placeholder}
            placeholderTextColor={clienteHomeTheme.muted}
            style={[
              styles.clientMessagesInput,
              multiline && styles.clientMessagesTextArea,
              { color: clienteHomeTheme.text },
            ]}
            multiline={multiline}
            textAlignVertical={textAlignVertical}
            autoCorrect
            returnKeyType={returnKeyType}
            onFocus={(event) =>
              enfocarCampoRutina(findNodeHandle(event.target as any))
            }
          />
        </View>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function renderClienteMensajesPremium() {
    if (mensajeSeleccionado) {
      return renderClienteConversacionPremium(mensajeSeleccionado);
    }

    if (modoMensajesUsuario === "NUEVO") {
      return renderClienteNuevoMensajePremium();
    }

    return renderClienteBandejaMensajesPremium();
  }

  function renderClienteMensajesHeader({
    title = "Mensajes",
    subtitle = `Tus conversaciones con ${nombreGimnasioApp}.`,
    eyebrow = "Mensajes",
    onBack,
    showNewAction = true,
  }: {
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    onBack?: () => void;
    showNewAction?: boolean;
  } = {}) {
    return (
      <View style={styles.clientMessagesHeader}>
        {!!onBack && (
          <Pressable
            style={[
              styles.clientAccountBackButton,
              {
                backgroundColor: clienteHomeTheme.surface,
                borderColor: clienteHomeTheme.border,
              },
            ]}
            onPress={onBack}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={clienteHomeTheme.text}
            />
          </Pressable>
        )}
        <View style={styles.clientMessagesHeaderCopy}>
          <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.clientMessagesHeaderActions}>
          {showNewAction && (
            <Pressable
              style={[
                styles.clientMessagesNewIconButton,
                { backgroundColor: colorPrimarioVisibleApp },
                !mensajesUsuariosPermitidosApp &&
                  styles.clientMessagesNewIconButtonDisabled,
              ]}
              onPress={abrirCompositorMensajeUsuario}
              disabled={!mensajesUsuariosPermitidosApp}
              accessibilityRole="button"
              accessibilityLabel="Crear nueva consulta"
            >
              <MaterialCommunityIcons
                name={mensajesUsuariosPermitidosApp ? "plus" : "lock-outline"}
                size={22}
                color={colorTextoSobrePrimarioApp}
              />
            </Pressable>
          )}
          <PremiumAvatar
            uri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
            initials={obtenerIniciales(clienteDemo?.nombre)}
            size={52}
            theme={clienteHomeTheme}
            onPress={() => setSeccionCliente("PERFIL")}
          />
        </View>
      </View>
    );
  }

  function renderClienteBandejaMensajesPremium() {
    const hayBusqueda = busquedaMensajesNormalizada.length > 0;
    const soloNoLeidos = filtroMensajes === "NO_LEIDOS";
    const sinResultados = conversacionesCliente.length === 0;
    const emptyTitle = hayBusqueda
      ? "Sin resultados"
      : soloNoLeidos
        ? "Todo leído"
        : "Sin conversaciones";
    const emptyText = hayBusqueda
      ? "Prueba con otro asunto, remitente o palabra del mensaje."
      : soloNoLeidos
        ? "Cuando llegue algo nuevo, aparecera aqui."
        : "Cuando el gimnasio te escriba, o envies una consulta, aparecera aqui.";

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderClienteMensajesHeader()}

        <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesOverviewCard}>
          <View
            style={[
              styles.clientMessagesOverviewIcon,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <MaterialCommunityIcons
              name="message-text-outline"
              size={24}
              color={colorPrimarioVisibleApp}
            />
          </View>
          <View style={styles.clientMessagesOverviewCopy}>
            <Text style={[styles.clientMessagesOverviewTitle, { color: clienteHomeTheme.text }]}>
              {resumenConversacionesCliente.NO_LEIDOS > 0
                ? `${resumenConversacionesCliente.NO_LEIDOS} sin leer`
                : "Bandeja al dia"}
            </Text>
            <Text style={[styles.clientMessagesOverviewText, { color: clienteHomeTheme.muted }]}>
              {pluralizar(resumenConversacionesCliente.TODOS, "conversación", "conversaciones")} con el gimnasio.
            </Text>
          </View>
          <Pressable
            style={[
              styles.clientMessagesOverviewAction,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
              !mensajesUsuariosPermitidosApp &&
                styles.clientMessagesNewIconButtonDisabled,
            ]}
            onPress={abrirCompositorMensajeUsuario}
            disabled={!mensajesUsuariosPermitidosApp}
          >
            <MaterialCommunityIcons
              name={mensajesUsuariosPermitidosApp ? "message-plus-outline" : "lock-outline"}
              size={20}
              color={colorPrimarioVisibleApp}
            />
          </Pressable>
        </PremiumCard>

        {!mensajesUsuariosPermitidosApp && (
          <View
            style={[
              styles.clientMessagesPermissionNote,
              {
                backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10"),
                borderColor: colorConAlpha(colorSecundarioVisibleApp, "22"),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={18}
              color={colorSecundarioVisibleApp}
            />
            <Text style={[styles.clientMessagesPermissionText, { color: clienteHomeTheme.muted }]}>
              Puedes leer comunicados. El envio de consultas lo activa administracion.
            </Text>
          </View>
        )}

        {renderClienteMensajesFeedback()}

        <View
          style={[
            styles.clientMessagesSearchBox,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={clienteHomeTheme.muted} />
          <TextInput
            value={busquedaMensajes}
            onChangeText={(texto) => {
              setBusquedaMensajes(texto);
              if (feedbackMensajesCliente) {
                setFeedbackMensajesCliente(null);
              }
            }}
            placeholder="Buscar mensaje..."
            placeholderTextColor={clienteHomeTheme.muted}
            style={[styles.clientMessagesSearchInput, { color: clienteHomeTheme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {hayBusqueda && (
            <Pressable
              style={styles.clientMessagesSearchClear}
              onPress={() => setBusquedaMensajes("")}
            >
              <MaterialCommunityIcons name="close" size={18} color={clienteHomeTheme.muted} />
            </Pressable>
          )}
        </View>

        <View style={styles.clientMessagesFilterRow}>
          {([
            {
              value: "TODOS",
              label: `Todos ${resumenConversacionesCliente.TODOS}`,
            },
            {
              value: "NO_LEIDOS",
              label: `Sin leer ${resumenConversacionesCliente.NO_LEIDOS}`,
            },
          ] as const).map((filtro) => (
            <PremiumFilterChip
              key={filtro.value}
              label={filtro.label}
              active={filtroMensajes === filtro.value}
              theme={clienteHomeTheme}
              onPress={() => setFiltroMensajes(filtro.value)}
            />
          ))}
        </View>

        <PremiumSectionHeader
          title="Conversaciones"
          actionLabel={
            resumenConversacionesCliente.NO_LEIDOS > 0 ? "Marcar leidas" : undefined
          }
          onAction={
            resumenConversacionesCliente.NO_LEIDOS > 0
              ? marcarVistaMensajesComoLeida
              : undefined
          }
          theme={clienteHomeTheme}
        />

        {cargando ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.clientMessagesLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando mensajes...
            </Text>
          </PremiumCard>
        ) : errorCargaMensajes && mensajesClienteBandeja.length === 0 ? (
          <PremiumEmptyState
            icon="wifi-alert"
            title="No se pudieron cargar"
            text={errorCargaMensajes}
            actionLabel="Reintentar"
            onAction={() => cargarDatos(false)}
            theme={clienteHomeTheme}
          />
        ) : sinResultados ? (
          <PremiumEmptyState
            icon={hayBusqueda ? "magnify" : "message-text-outline"}
            title={emptyTitle}
            text={emptyText}
            actionLabel={
              hayBusqueda
                ? "Limpiar búsqueda"
                : mensajesUsuariosPermitidosApp
                  ? "Nueva consulta"
                  : undefined
            }
            onAction={
              hayBusqueda
                ? () => setBusquedaMensajes("")
                : mensajesUsuariosPermitidosApp
                  ? abrirCompositorMensajeUsuario
                  : undefined
            }
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.clientMessagesConversationList}>
            {conversacionesCliente.map((conversacion) =>
              renderClienteConversacionCard(conversacion),
            )}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderClienteConversacionCard(conversacion: ConversacionMensaje) {
    const mensaje = conversacion.mensaje;
    const esPropio = mensajeEnviadoPorUsuarioActual(mensaje);
    const tieneNoLeidos = conversacion.noLeidos > 0;
    const esAutomatico = conversacion.mensajes.some(
      (mensajeHilo) => mensajeHilo.automatico,
    );
    const mensajePrioritario = conversacion.mensajes.find(
      (mensajeHilo) =>
        mensajeHilo.prioridad === "IMPORTANTE" ||
        mensajeHilo.prioridad === "URGENTE",
    );
    const prioridadConfig = obtenerConfigPrioridadMensaje(
      mensajePrioritario?.prioridad,
    );
    const titulo = esAutomatico
      ? `Aviso de ${nombreGimnasioApp}`
      : esPropio
        ? nombreGimnasioApp
        : mensaje.remitente || nombreGimnasioApp;
    const asunto = obtenerAsuntoMensaje(mensaje);
    const preview = `${esPropio ? "Tu: " : ""}${mensaje.texto}`
      .replace(/\s+/g, " ")
      .trim();

    return (
      <PremiumCard
        key={conversacion.id}
        theme={clienteHomeTheme}
        style={[
          styles.clientMessagesConversationCard,
          tieneNoLeidos && {
            borderColor: colorConAlpha(colorPrimarioVisibleApp, "42"),
          },
        ]}
        onPress={() => abrirConversacionMensaje(conversacion)}
      >
        <View
          style={[
            styles.clientMessagesConversationAvatar,
            {
              backgroundColor: colorConAlpha(
                esAutomatico ? colorSecundarioVisibleApp : colorPrimarioVisibleApp,
                "12",
              ),
            },
          ]}
        >
          <MaterialCommunityIcons
            name={esAutomatico ? "bell-ring-outline" : "message-text-outline"}
            size={22}
            color={esAutomatico ? colorSecundarioVisibleApp : colorPrimarioVisibleApp}
          />
        </View>
        <View style={styles.clientMessagesConversationCopy}>
          <View style={styles.clientMessagesConversationTop}>
            <Text
              style={[
                styles.clientMessagesConversationTitle,
                { color: clienteHomeTheme.text },
                tieneNoLeidos && styles.clientMessagesConversationTitleUnread,
              ]}
              numberOfLines={1}
            >
              {titulo}
            </Text>
            <View style={styles.clientMessagesConversationDateWrap}>
              {tieneNoLeidos && (
                <View
                  style={[
                    styles.clientMessagesUnreadDot,
                    { backgroundColor: colorPrimarioVisibleApp },
                  ]}
                />
              )}
              <Text
                style={[styles.clientMessagesConversationDate, { color: clienteHomeTheme.muted }]}
                numberOfLines={1}
              >
                {mensaje.fecha}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.clientMessagesConversationSubject,
              { color: clienteHomeTheme.text },
            ]}
            numberOfLines={1}
          >
            {asunto || "Consulta"}
          </Text>
          <Text
            style={[styles.clientMessagesConversationPreview, { color: clienteHomeTheme.muted }]}
            numberOfLines={2}
          >
            {preview || "Sin contenido"}
          </Text>
          <View style={styles.clientMessagesConversationTags}>
            {tieneNoLeidos && (
              <View
                style={[
                  styles.clientMessagesMiniTag,
                  { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
                ]}
              >
                <Text style={[styles.clientMessagesMiniTagText, { color: colorPrimarioVisibleApp }]}>
                  {conversacion.noLeidos === 1
                    ? "Nuevo"
                    : `${conversacion.noLeidos} nuevos`}
                </Text>
              </View>
            )}
            {esAutomatico && (
              <View
                style={[
                  styles.clientMessagesMiniTag,
                  { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
                ]}
              >
                <MaterialCommunityIcons
                  name="autorenew"
                  size={12}
                  color={colorSecundarioVisibleApp}
                />
                <Text style={[styles.clientMessagesMiniTagText, { color: colorSecundarioVisibleApp }]}>
                  Automático
                </Text>
              </View>
            )}
            {!!mensajePrioritario && (
              <View
                style={[
                  styles.clientMessagesMiniTag,
                  { backgroundColor: prioridadConfig.background },
                ]}
              >
                <MaterialCommunityIcons
                  name={prioridadConfig.icon}
                  size={12}
                  color={prioridadConfig.color}
                />
                <Text style={[styles.clientMessagesMiniTagText, { color: prioridadConfig.color }]}>
                  {prioridadConfig.label}
                </Text>
              </View>
            )}
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={clienteHomeTheme.muted} />
      </PremiumCard>
    );
  }

  function renderClienteConversacionPremium(mensaje: MensajeApp) {
    const mensajesHilo =
      mensajesConversacionSeleccionada.length > 0
        ? mensajesConversacionSeleccionada
        : [mensaje];
    const asunto = obtenerAsuntoMensaje(mensaje);

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderClienteMensajesHeader({
          title: nombreGimnasioApp,
          subtitle: asunto || "Conversacion",
          eyebrow: "Conversacion",
          onBack: () => {
            setMensajeSeleccionadoId(null);
            setFeedbackMensajesCliente(null);
          },
          showNewAction: false,
        })}

        {renderClienteMensajesFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesThreadCard}>
          {mensajesHilo.map((mensajeHilo) => {
            const esMio = mensajeEnviadoPorUsuarioActual(mensajeHilo);
            const autor = esMio
              ? "Tu"
              : mensajeHilo.automatico
                ? "Sistema"
                : mensajeHilo.remitente || nombreGimnasioApp;

            return (
              <View
                key={mensajeHilo.id}
                style={[
                  styles.clientMessagesBubbleWrap,
                  esMio && styles.clientMessagesBubbleWrapOwn,
                ]}
              >
                <View
                  style={[
                    styles.clientMessagesBubble,
                    {
                      backgroundColor: esMio
                        ? colorPrimarioVisibleApp
                        : clienteHomeTheme.surfaceSoft,
                      borderColor: esMio
                        ? colorPrimarioVisibleApp
                        : clienteHomeTheme.border,
                    },
                  ]}
                >
                  <View style={styles.clientMessagesBubbleHeader}>
                    <Text
                      style={[
                        styles.clientMessagesBubbleAuthor,
                        { color: esMio ? colorTextoSobrePrimarioApp : clienteHomeTheme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {autor}
                    </Text>
                    {mensajeHilo.automatico && (
                      <View
                        style={[
                          styles.clientMessagesBubbleAutoTag,
                          {
                            backgroundColor: esMio
                              ? colorConAlpha(colorTextoSobrePrimarioApp, "18")
                              : colorConAlpha(colorSecundarioVisibleApp, "12"),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.clientMessagesBubbleAutoText,
                            {
                              color: esMio
                                ? colorTextoSobrePrimarioApp
                                : colorSecundarioVisibleApp,
                            },
                          ]}
                        >
                          Auto
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.clientMessagesBubbleText,
                      { color: esMio ? colorTextoSobrePrimarioApp : clienteHomeTheme.text },
                    ]}
                  >
                    {mensajeHilo.texto}
                  </Text>
                  <Text
                    style={[
                      styles.clientMessagesBubbleDate,
                      { color: esMio ? colorConAlpha(colorTextoSobrePrimarioApp, "CC") : clienteHomeTheme.muted },
                    ]}
                  >
                    {mensajeHilo.fecha}
                  </Text>
                </View>
              </View>
            );
          })}
        </PremiumCard>

        {puedeResponderMensaje ? (
          <View
            style={[
              styles.clientMessagesReplyBox,
              {
                backgroundColor: clienteHomeTheme.surface,
                borderColor: clienteHomeTheme.border,
              },
            ]}
          >
            <TextInput
              value={respuestaMensaje}
              onChangeText={(texto) => {
                setRespuestaMensaje(texto);
                if (feedbackMensajesCliente?.tipo === "error") {
                  setFeedbackMensajesCliente(null);
                }
              }}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={clienteHomeTheme.muted}
              style={[styles.clientMessagesReplyInput, { color: clienteHomeTheme.text }]}
              multiline
              textAlignVertical="top"
              autoCorrect
              blurOnSubmit={false}
            />
            <Pressable
              style={[
                styles.clientMessagesSendButton,
                { backgroundColor: colorPrimarioVisibleApp },
                (!respuestaMensaje.trim() || guardandoRespuestaMensaje) &&
                  styles.clientMessagesSendButtonDisabled,
              ]}
              disabled={!respuestaMensaje.trim() || guardandoRespuestaMensaje}
              onPress={enviarRespuestaMensaje}
            >
              {guardandoRespuestaMensaje ? (
                <ActivityIndicator size="small" color={colorTextoSobrePrimarioApp} />
              ) : (
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={colorTextoSobrePrimarioApp}
                />
              )}
            </Pressable>
          </View>
        ) : (
          <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesReplyDisabledCard}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={clienteHomeTheme.muted} />
            <Text style={[styles.clientMessagesReplyDisabledText, { color: clienteHomeTheme.muted }]}>
              {mensajesUsuariosPermitidosApp
                ? "Este mensaje no admite respuesta directa."
                : "Administración aún no ha abierto las respuestas de clientes."}
            </Text>
          </PremiumCard>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderClienteNuevoMensajePremium() {
    const puedeEnviar =
      mensajesUsuariosPermitidosApp &&
      asuntoMensaje.trim().length > 0 &&
      textoMensaje.trim().length > 0 &&
      adminsGimnasio.length > 0 &&
      !guardandoMensaje;

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderClienteMensajesHeader({
          title: "Nueva consulta",
          subtitle: `Escribe directamente a ${nombreGimnasioApp}.`,
          eyebrow: "Mensajes",
          onBack: () => {
            limpiarFormularioMensaje();
            setModoMensajesUsuario("BANDEJA");
            setFeedbackMensajesCliente(null);
          },
          showNewAction: false,
        })}

        {renderClienteMensajesFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.clientMessagesComposerCard}>
          <View
            style={[
              styles.clientMessagesComposerNotice,
              {
                backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10"),
                borderColor: colorConAlpha(colorSecundarioVisibleApp, "22"),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={19}
              color={colorSecundarioVisibleApp}
            />
            <Text style={[styles.clientMessagesComposerNoticeText, { color: clienteHomeTheme.muted }]}>
              Se enviará a {pluralizar(adminsGimnasio.length, "administrador activo", "administradores activos")}.
            </Text>
          </View>

          {renderClienteMensajeInput({
            label: "Asunto",
            icon: "email-outline",
            value: asuntoMensaje,
            onChangeText: setAsuntoMensaje,
            placeholder: "Ej. Duda sobre mi reserva",
            returnKeyType: "next",
          })}

          {renderClienteMensajeInput({
            label: "Mensaje",
            icon: "message-text-outline",
            value: textoMensaje,
            onChangeText: setTextoMensaje,
            placeholder: "Cuéntanos que necesitas...",
            multiline: true,
            textAlignVertical: "top",
          })}

          <PremiumPrimaryButton
            label={guardandoMensaje ? "Enviando" : "Enviar consulta"}
            icon="send-outline"
            theme={clienteHomeTheme}
            loading={guardandoMensaje}
            disabled={!puedeEnviar}
            onPress={enviarMensajeUsuarioAdmin}
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function renderClienteMensajeInput({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    returnKeyType,
    textAlignVertical,
  }: {
    label: string;
    icon: IconName;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
    textAlignVertical?: ComponentProps<typeof TextInput>["textAlignVertical"];
  }) {
    return (
      <View style={styles.clientAccountInputGroup}>
        <Text style={[styles.clientAccountLabel, { color: clienteHomeTheme.text }]}>
          {label}
        </Text>
        <View
          style={[
            styles.clientMessagesInputShell,
            multiline && styles.clientMessagesTextAreaShell,
            {
              backgroundColor: clienteHomeTheme.surfaceSoft,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={20} color={colorSecundarioVisibleApp} />
          <TextInput
            value={value}
            onChangeText={(texto) => {
              onChangeText(texto);
              if (feedbackMensajesCliente?.tipo === "error") {
                setFeedbackMensajesCliente(null);
              }
            }}
            placeholder={placeholder}
            placeholderTextColor={clienteHomeTheme.muted}
            style={[
              styles.clientMessagesInput,
              multiline && styles.clientMessagesTextArea,
              { color: clienteHomeTheme.text },
            ]}
            multiline={multiline}
            textAlignVertical={textAlignVertical}
            autoCorrect
            returnKeyType={returnKeyType}
            onFocus={(event) =>
              enfocarCampoRutina(findNodeHandle(event.target as any))
            }
          />
        </View>
      </View>
    );
  }

  function renderClienteMensajesFeedback() {
    if (!feedbackMensajesCliente) {
      return null;
    }

    const esError = feedbackMensajesCliente.tipo === "error";
    const color = esError ? "#DC2626" : colorSecundarioVisibleApp;

    return (
      <View
        style={[
          styles.clientMessagesFeedback,
          {
            backgroundColor: esError
              ? "#FEF2F2"
              : colorConAlpha(colorSecundarioVisibleApp, "10"),
            borderColor: esError
              ? "#FECACA"
              : colorConAlpha(colorSecundarioVisibleApp, "24"),
          },
        ]}
      >
        <MaterialCommunityIcons
          name={esError ? "alert-circle-outline" : "check-circle-outline"}
          size={19}
          color={color}
        />
        <Text style={[styles.clientMessagesFeedbackText, { color }]}>
          {feedbackMensajesCliente.texto}
        </Text>
        {feedbackMensajesCliente.reintentar ? (
          <Pressable
            style={[
              styles.clientMessagesFeedbackRetry,
              { borderColor: colorConAlpha(color, "40") },
            ]}
            onPress={() => {
              setFeedbackMensajesCliente(null);
              void cargarDatos(false);
            }}
            accessibilityRole="button"
            accessibilityLabel="Reintentar carga de mensajes"
          >
            <Text style={[styles.clientMessagesFeedbackRetryText, { color }]}>Reintentar</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.clientMessagesFeedbackClose}
            onPress={() => setFeedbackMensajesCliente(null)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar aviso"
          >
            <MaterialCommunityIcons name="close" size={16} color={color} />
          </Pressable>
        )}
      </View>
    );
  }

  function InicioEntrenadorPremium() {
    const nombreEntrenador =
      entrenadorDemo?.nombre?.split(" ")[0] || "Entrenador";

    return (
      <PremiumScreenContainer
        theme={clienteHomeTheme}
      >
        <DashboardHeroBackground imageUri={dashboardBackgroundUri} theme={clienteHomeTheme}>
          <View style={styles.trainerHomeHeader}>
            <View style={styles.trainerHomeHeaderCopy}>
              <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
                {nombreGimnasioApp}
              </Text>
              <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
                Hola, {nombreEntrenador}
              </Text>
              <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
                Revisa tu agenda y prepara la siguiente clase.
              </Text>
            </View>
            <PremiumAvatar
              uri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
              initials={obtenerIniciales(entrenadorDemo?.nombre)}
              size={52}
              theme={clienteHomeTheme}
              onPress={() => setSeccionEntrenador("PERFIL")}
            />
          </View>
        </DashboardHeroBackground>

        {cargando ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.trainerHomeLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.trainerHomeLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando agenda...
            </Text>
          </PremiumCard>
        ) : error && clasesEntrenador.length === 0 ? (
          <PremiumEmptyState
            icon="wifi-alert"
            title="No se pudo cargar la agenda"
            text={error}
            actionLabel="Reintentar"
            onAction={() => cargarDatos(false)}
            theme={clienteHomeTheme}
          />
        ) : (
          <>
            {renderEntrenadorProximaClase()}

            <View style={styles.trainerHomeMetricsRow}>
              <PremiumMetricCard
                icon="calendar-today-outline"
                label="Clases hoy"
                value={clasesHoyEntrenador.length}
                theme={clienteHomeTheme}
              />
              <PremiumMetricCard
                icon="account-group-outline"
                label="Alumnos previstos"
                value={alumnosPrevistosHoyEntrenador}
                theme={clienteHomeTheme}
                accent="secondary"
              />
              <PremiumMetricCard
                icon="message-text-outline"
                label="Mensajes nuevos"
                value={mensajesNoLeidosBadge}
                theme={clienteHomeTheme}
              />
            </View>

            <PremiumSectionHeader
              title="Agenda de hoy"
              actionLabel="Ver clases"
              onAction={() => setSeccionEntrenador("CLASES")}
              theme={clienteHomeTheme}
            />

            {clasesHoyEntrenador.length === 0 ? (
              <PremiumEmptyState
                icon="calendar-blank-outline"
                title="Sin clases hoy"
                text={
                  proximaClaseEntrenador
                    ? `Tu proxima clase asignada es ${formatearDia(
                        proximaClaseEntrenador.fechaHora,
                      )} a las ${obtenerHora(proximaClaseEntrenador.fechaHora)}.`
                    : "Cuando administracion te asigne clases, apareceran aqui."
                }
                actionLabel={proximaClaseEntrenador ? "Ver horario" : undefined}
                onAction={
                  proximaClaseEntrenador
                    ? () => setSeccionEntrenador("CLASES")
                    : undefined
                }
                theme={clienteHomeTheme}
              />
            ) : (
              <View style={styles.trainerTodayAgendaList}>
                {jornadaTerminadaEntrenador && (
                  <View
                    style={[
                      styles.trainerDayDoneBanner,
                      {
                        backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10"),
                        borderColor: colorConAlpha(colorSecundarioVisibleApp, "24"),
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={20}
                      color={colorSecundarioVisibleApp}
                    />
                    <Text style={[styles.trainerDayDoneText, { color: clienteHomeTheme.muted }]}>
                      Jornada terminada. Buen trabajo por hoy.
                    </Text>
                  </View>
                )}
                {clasesHoyEntrenador.map((clase) =>
                  renderEntrenadorAgendaClaseCard(clase),
                )}
              </View>
            )}

            <PremiumSectionHeader title="Accesos rápidos" theme={clienteHomeTheme} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trainerQuickActionsGrid}
              contentContainerStyle={styles.trainerQuickActionsContent}
              decelerationRate="fast"
              snapToInterval={trainerQuickActionWidth + 12}
              snapToAlignment="start"
            >
              {renderEntrenadorQuickAction({
                icon: "calendar-clock",
                title: "Mis clases",
                text: `${gruposClasesEntrenador.length} tipo(s) asignados`,
                color: colorPrimarioVisibleApp,
                onPress: () => setSeccionEntrenador("CLASES"),
              })}
              {renderEntrenadorQuickAction({
                icon: "message-text-outline",
                title: "Mensajes",
                text:
                  mensajesNoLeidosBadge > 0
                    ? `${mensajesNoLeidosBadge} pendiente(s)`
                    : "Bandeja al dia",
                color: colorSecundarioVisibleApp,
                onPress: () => setSeccionEntrenador("MENSAJES"),
              })}
              {renderEntrenadorQuickAction({
                icon: "arm-flex-outline",
                title: "Rutinas",
                text: rutinasEntrenador.length
                  ? `${rutinasEntrenador.length} creada(s)`
                  : "Crear entrenamientos",
                color: colorPrimarioVisibleApp,
                onPress: () => setSeccionEntrenador("RUTINAS"),
              })}
            </ScrollView>
          </>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorProximaClase() {
    if (!proximaClaseHoyEntrenador) {
      const titulo = jornadaTerminadaEntrenador
        ? "Jornada completada"
        : "Sin clase próxima hoy";
      const texto = jornadaTerminadaEntrenador
        ? "Todas las clases de hoy ya han pasado."
        : proximaClaseEntrenador
          ? `La siguiente clase asignada es ${formatearDia(
              proximaClaseEntrenador.fechaHora,
            )} a las ${obtenerHora(proximaClaseEntrenador.fechaHora)}.`
          : "No tienes clases asignadas en la agenda.";

      return (
        <PremiumCard theme={clienteHomeTheme} style={styles.trainerNextEmptyCard}>
          <View
            style={[
              styles.trainerNextEmptyIcon,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <MaterialCommunityIcons
              name={jornadaTerminadaEntrenador ? "check-circle-outline" : "calendar-blank-outline"}
              size={27}
              color={colorPrimarioVisibleApp}
            />
          </View>
          <View style={styles.trainerNextEmptyCopy}>
            <Text style={[styles.trainerNextEmptyTitle, { color: clienteHomeTheme.text }]}>
              {titulo}
            </Text>
            <Text style={[styles.trainerNextEmptyText, { color: clienteHomeTheme.muted }]}>
              {texto}
            </Text>
          </View>
          {proximaClaseEntrenador && (
            <Pressable
              style={[
                styles.trainerNextEmptyButton,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
              ]}
              onPress={() => setSeccionEntrenador("CLASES")}
            >
              <Text style={[styles.trainerNextEmptyButtonText, { color: colorPrimarioVisibleApp }]}>
                Ver
              </Text>
            </Pressable>
          )}
        </PremiumCard>
      );
    }

    const clase = proximaClaseHoyEntrenador;
    const imagenClase = resolverUrlMedia(clase.imagenUrl);
    const reservasClase = contarReservasActivasDeClase(clase.id);
    const capacidad = Number(clase.capacidadMaxima) || 0;
    const huecos = Math.max(0, obtenerHuecosDisponibles(clase));
    const duracion = Number(clase.duracionMinutos) || 45;

    return (
      <PremiumCard theme={clienteHomeTheme} style={styles.trainerNextClassCard}>
        {imagenClase ? (
          <ImageBackground
            source={{ uri: imagenClase }}
            style={styles.trainerNextClassImage}
            imageStyle={styles.trainerNextClassImageStyle}
          >
            <View style={styles.trainerNextClassShade} />
            <View style={styles.trainerNextClassBadge}>
              <MaterialCommunityIcons name="clock-outline" size={15} color="#FFFFFF" />
              <Text style={styles.trainerNextClassBadgeText}>Siguiente clase</Text>
            </View>
          </ImageBackground>
        ) : (
          <ClassMediaPlaceholder
            theme={clienteHomeTheme}
            icon="calendar-clock-outline"
            style={styles.trainerNextClassImage}
          />
        )}
        <View style={styles.trainerNextClassBody}>
          <View style={styles.trainerNextClassTopRow}>
            <View style={styles.trainerNextClassCopy}>
              <Text style={[styles.trainerNextClassTime, { color: colorPrimarioVisibleApp }]}>
                Hoy · {obtenerHora(clase.fechaHora)}
              </Text>
              <Text style={[styles.trainerNextClassTitle, { color: clienteHomeTheme.text }]} numberOfLines={2}>
                {clase.nombre}
              </Text>
              {!!clase.descripcion && (
                <Text style={[styles.trainerNextClassText, { color: clienteHomeTheme.muted }]} numberOfLines={2}>
                  {clase.descripcion}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.trainerNextClassCapacity,
                { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
              ]}
            >
              <Text style={[styles.trainerNextClassCapacityValue, { color: colorSecundarioVisibleApp }]}>
                {reservasClase}/{capacidad || "-"}
              </Text>
              <Text style={[styles.trainerNextClassCapacityLabel, { color: clienteHomeTheme.muted }]}>
                alumnos
              </Text>
            </View>
          </View>

          <View style={styles.trainerNextClassMetaGrid}>
            {[
              { icon: "timer-outline" as IconName, label: `${duracion} min` },
              {
                icon: "account-multiple-outline" as IconName,
                label: capacidad ? `${huecos} plazas libres` : "Sin capacidad",
              },
            ].map((item) => (
              <View key={item.label} style={styles.trainerNextClassMetaItem}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={17}
                  color={clienteHomeTheme.muted}
                />
                <Text style={[styles.trainerNextClassMetaText, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <PremiumPrimaryButton
            label="Ver clase"
            icon="calendar-clock"
            theme={clienteHomeTheme}
            onPress={() => setSeccionEntrenador("CLASES")}
          />
        </View>
      </PremiumCard>
    );
  }

  function obtenerEstadoAgendaEntrenador(clase: any) {
    const inicioClase = new Date(clase.fechaHora).getTime();
    const duracion = Number(clase.duracionMinutos) || 45;
    const finClase = inicioClase + duracion * 60 * 1000;
    const esSiguiente = proximaClaseHoyEntrenador?.id === clase.id;

    if (!Number.isNaN(inicioClase) && ahora.getTime() >= inicioClase && ahora.getTime() <= finClase) {
      return {
        label: "En curso",
        icon: "play-circle-outline" as IconName,
        color: colorPrimarioVisibleApp,
        background: colorConAlpha(colorPrimarioVisibleApp, "12"),
      };
    }

    if (!Number.isNaN(finClase) && finClase < ahora.getTime()) {
      return {
        label: "Realizada",
        icon: "check-circle-outline" as IconName,
        color: "#94A3B8",
        background: "#F1F5F9",
      };
    }

    if (esSiguiente) {
      return {
        label: "Siguiente",
        icon: "clock-outline" as IconName,
        color: colorPrimarioVisibleApp,
        background: colorConAlpha(colorPrimarioVisibleApp, "12"),
      };
    }

    return {
      label: "Pendiente",
      icon: "calendar-clock" as IconName,
      color: colorSecundarioVisibleApp,
      background: colorConAlpha(colorSecundarioVisibleApp, "12"),
    };
  }

  function renderEntrenadorAgendaClaseCard(clase: any) {
    const estado = obtenerEstadoAgendaEntrenador(clase);
    const reservasClase = contarReservasActivasDeClase(clase.id);
    const capacidad = Number(clase.capacidadMaxima) || 0;
    const duracion = Number(clase.duracionMinutos) || 45;
    const esRealizada = estado.label === "Realizada";
    const esDestacada =
      estado.label === "Siguiente" || estado.label === "En curso";

    return (
      <PremiumCard
        key={clase.id}
        theme={clienteHomeTheme}
        style={[
          styles.trainerAgendaClassCard,
          esDestacada && {
            borderColor: colorConAlpha(colorPrimarioVisibleApp, "42"),
          },
          esRealizada && styles.trainerAgendaClassCardDone,
        ]}
        onPress={() => setSeccionEntrenador("CLASES")}
      >
        <View
          style={[
            styles.trainerAgendaTimeBox,
            { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
          ]}
        >
          <Text style={[styles.trainerAgendaTimeText, { color: colorPrimarioVisibleApp }]}>
            {obtenerHora(clase.fechaHora)}
          </Text>
        </View>
        <View style={styles.trainerAgendaClassCopy}>
          <Text style={[styles.trainerAgendaClassTitle, { color: clienteHomeTheme.text }]} numberOfLines={1}>
            {clase.nombre}
          </Text>
          <Text style={[styles.trainerAgendaClassMeta, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
            {duracion} min · {reservasClase}/{capacidad || "-"} alumnos
          </Text>
        </View>
        <View style={[styles.trainerAgendaStatusPill, { backgroundColor: estado.background }]}>
          <MaterialCommunityIcons name={estado.icon} size={14} color={estado.color} />
          <Text style={[styles.trainerAgendaStatusText, { color: estado.color }]}>
            {estado.label}
          </Text>
        </View>
      </PremiumCard>
    );
  }

  function renderEntrenadorQuickAction({
    icon,
    title,
    text,
    color,
    onPress,
  }: {
    icon: IconName;
    title: string;
    text: string;
    color: string;
    onPress: () => void;
  }) {
    return (
      <PremiumCard
        key={title}
        theme={clienteHomeTheme}
        style={[
          styles.trainerQuickActionCard,
          { width: trainerQuickActionWidth },
        ]}
        onPress={onPress}
      >
        <View
          style={[
            styles.trainerQuickActionIcon,
            { backgroundColor: colorConAlpha(color, "12") },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.trainerQuickActionTitle, { color: clienteHomeTheme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.trainerQuickActionText, { color: clienteHomeTheme.muted }]} numberOfLines={2}>
          {text}
        </Text>
      </PremiumCard>
    );
  }

  function EntrenadorClasesPremium() {
    const nombreEntrenador =
      entrenadorDemo?.nombre?.split(" ")[0] || "Entrenador";

    if (claseEntrenadorSeleccionada) {
      return <EntrenadorClaseDetalle clase={claseEntrenadorSeleccionada} />;
    }

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.trainerHomeHeader}>
          <View style={styles.trainerHomeHeaderCopy}>
            <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
              Agenda
            </Text>
            <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
              Mis clases
            </Text>
            <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
              Hola, {nombreEntrenador}. Consulta tus sesiones y alumnos del día.
            </Text>
          </View>
          <PremiumAvatar
            uri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
            initials={obtenerIniciales(entrenadorDemo?.nombre)}
            size={52}
            theme={clienteHomeTheme}
            onPress={() => setSeccionEntrenador("PERFIL")}
          />
        </View>

        {cargando ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.trainerHomeLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.trainerHomeLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando agenda...
            </Text>
          </PremiumCard>
        ) : error && clasesEntrenador.length === 0 ? (
          <PremiumEmptyState
            icon="wifi-alert"
            title="No se pudo cargar la agenda"
            text={error}
            actionLabel="Reintentar"
            onAction={() => cargarDatos(false)}
            theme={clienteHomeTheme}
          />
        ) : clasesEntrenador.length === 0 ? (
          <PremiumEmptyState
            icon="calendar-account-outline"
            title="Sin clases asignadas"
            text="Cuando administración te asigne clases activas, aparecerán aquí."
            theme={clienteHomeTheme}
          />
        ) : (
          <>
            <View style={styles.clientClassWeekHeader}>
              <View style={styles.clientClassWeekCopy}>
                <Text style={[styles.clientClassWeekLabel, { color: clienteHomeTheme.muted }]}>
                  Semana
                </Text>
                <Text style={[styles.clientClassWeekRange, { color: clienteHomeTheme.text }]}>
                  {rangoSemanaAgendaEntrenador}
                </Text>
              </View>
              <View style={styles.clientClassWeekControls}>
                <Pressable
                  style={[
                    styles.clientClassWeekButton,
                    {
                      backgroundColor: clienteHomeTheme.surface,
                      borderColor: clienteHomeTheme.border,
                    },
                    semanaAgendaEntrenadorOffset === 0 &&
                      styles.clientClassWeekButtonDisabled,
                  ]}
                  disabled={semanaAgendaEntrenadorOffset === 0}
                  onPress={() => {
                    const nuevoOffset = Math.max(
                      0,
                      semanaAgendaEntrenadorOffset - 1,
                    );
                    const nuevoInicio = sumarDiasFechaLocal(
                      lunesSemanaActual,
                      nuevoOffset * 7,
                    );
                    setSemanaAgendaEntrenadorOffset(nuevoOffset);
                    setDiaAgendaEntrenadorSeleccionado(
                      nuevoOffset === 0
                        ? hoyClasesClienteKey
                        : crearFechaKeyLocal(nuevoInicio),
                    );
                    setClaseEntrenadorSeleccionadaId(null);
                  }}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={22}
                    color={clienteHomeTheme.muted}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.clientClassWeekButton,
                    {
                      backgroundColor: clienteHomeTheme.surface,
                      borderColor: clienteHomeTheme.border,
                    },
                  ]}
                  onPress={() => {
                    const nuevoOffset = semanaAgendaEntrenadorOffset + 1;
                    const nuevoInicio = sumarDiasFechaLocal(
                      lunesSemanaActual,
                      nuevoOffset * 7,
                    );
                    setSemanaAgendaEntrenadorOffset(nuevoOffset);
                    setDiaAgendaEntrenadorSeleccionado(
                      crearFechaKeyLocal(nuevoInicio),
                    );
                    setClaseEntrenadorSeleccionadaId(null);
                  }}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={colorPrimarioVisibleApp}
                  />
                </Pressable>
              </View>
            </View>

            <PremiumDaySelector
              days={diasAgendaEntrenadorItems}
              activeDay={diaAgendaEntrenadorActivo}
              weekKey={crearFechaKeyLocal(inicioSemanaAgendaEntrenador)}
              theme={clienteHomeTheme}
              onSelect={(dia) => {
                if (
                  diasAgendaEntrenadorItems.some(
                    (item) => item.key === dia && item.disabled,
                  )
                ) {
                  return;
                }
                setDiaAgendaEntrenadorSeleccionado(dia);
                setClaseEntrenadorSeleccionadaId(null);
              }}
            />

            <PremiumSectionHeader
              title={fechaAgendaEntrenadorTexto}
              actionLabel={
                semanaAgendaEntrenadorOffset > 0 ? "Volver a hoy" : undefined
              }
              onAction={
                semanaAgendaEntrenadorOffset > 0
                  ? () => {
                      setSemanaAgendaEntrenadorOffset(0);
                      setDiaAgendaEntrenadorSeleccionado(hoyClasesClienteKey);
                      setClaseEntrenadorSeleccionadaId(null);
                    }
                  : undefined
              }
              theme={clienteHomeTheme}
            />

            {clasesAgendaEntrenadorSemana.length === 0 ? (
              <PremiumEmptyState
                icon="calendar-blank-outline"
                title="Sin clases esta semana"
                text="Avanza a otra semana para revisar más sesiones asignadas."
                actionLabel="Semana siguiente"
                onAction={() => {
                  const nuevoOffset = semanaAgendaEntrenadorOffset + 1;
                  const nuevoInicio = sumarDiasFechaLocal(
                    lunesSemanaActual,
                    nuevoOffset * 7,
                  );
                  setSemanaAgendaEntrenadorOffset(nuevoOffset);
                  setDiaAgendaEntrenadorSeleccionado(
                    crearFechaKeyLocal(nuevoInicio),
                  );
                }}
                theme={clienteHomeTheme}
              />
            ) : clasesAgendaEntrenadorDia.length === 0 ? (
              <PremiumEmptyState
                icon="calendar-blank-outline"
                title="Sin clases este día"
                text="Selecciona otro día de la semana para ver tus próximas sesiones."
                theme={clienteHomeTheme}
              />
            ) : (
              <View style={styles.trainerClassList}>
                {clasesAgendaEntrenadorDia.map((clase) => (
                  <EntrenadorClaseAgendaCard key={clase.id} clase={clase} />
                ))}
              </View>
            )}
          </>
        )}
      </PremiumScreenContainer>
    );
  }

  function obtenerEstadoTemporalClaseEntrenador(clase: any) {
    const inicioClase = new Date(clase.fechaHora).getTime();
    const duracion = Number(clase.duracionMinutos) || 45;
    const finClase = inicioClase + duracion * 60 * 1000;
    const esSiguiente = proximaClaseEntrenador?.id === clase.id;

    if (!Number.isNaN(inicioClase) && ahora.getTime() >= inicioClase && ahora.getTime() <= finClase) {
      return {
        label: "En curso",
        icon: "play-circle-outline" as IconName,
        color: colorPrimarioVisibleApp,
        background: colorConAlpha(colorPrimarioVisibleApp, "12"),
      };
    }

    if (!Number.isNaN(finClase) && finClase < ahora.getTime()) {
      return {
        label: "Finalizada",
        icon: "check-circle-outline" as IconName,
        color: "#94A3B8",
        background: "#F1F5F9",
      };
    }

    if (esSiguiente) {
      return {
        label: "Próxima",
        icon: "clock-outline" as IconName,
        color: colorPrimarioVisibleApp,
        background: colorConAlpha(colorPrimarioVisibleApp, "12"),
      };
    }

    return {
      label: "Pendiente",
      icon: "calendar-clock" as IconName,
      color: colorSecundarioVisibleApp,
      background: colorConAlpha(colorSecundarioVisibleApp, "12"),
    };
  }

  function EntrenadorClaseAgendaCard({ clase }: { clase: any }) {
    const estado = obtenerEstadoTemporalClaseEntrenador(clase);
    const alumnos = contarReservasActivasDeClase(clase.id);
    const capacidad = Number(clase.capacidadMaxima) || 0;
    const duracion = Number(clase.duracionMinutos) || 45;
    const finalizada = estado.label === "Finalizada";
    const destacada = estado.label === "Próxima" || estado.label === "En curso";

    return (
      <PremiumCard
        theme={clienteHomeTheme}
        style={[
          styles.trainerClassAgendaCard,
          destacada && {
            borderColor: colorConAlpha(colorPrimarioVisibleApp, "42"),
          },
          finalizada && styles.trainerAgendaClassCardDone,
        ]}
        onPress={() => setClaseEntrenadorSeleccionadaId(clase.id)}
      >
        <View style={styles.trainerClassAgendaHeader}>
          <View
            style={[
              styles.trainerAgendaTimeBox,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <Text style={[styles.trainerAgendaTimeText, { color: colorPrimarioVisibleApp }]}>
              {obtenerHora(clase.fechaHora)}
            </Text>
          </View>
          <View style={styles.trainerAgendaClassCopy}>
            <Text style={[styles.trainerAgendaClassTitle, { color: clienteHomeTheme.text }]} numberOfLines={1}>
              {clase.nombre}
            </Text>
            <Text style={[styles.trainerAgendaClassMeta, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
              {duracion} min · {alumnos}/{capacidad || "-"} alumnos
            </Text>
          </View>
          <View style={[styles.trainerAgendaStatusPill, { backgroundColor: estado.background }]}>
            <MaterialCommunityIcons name={estado.icon} size={14} color={estado.color} />
            <Text style={[styles.trainerAgendaStatusText, { color: estado.color }]}>
              {estado.label}
            </Text>
          </View>
        </View>

        <View style={styles.trainerClassAgendaFooter}>
          <View style={styles.trainerClassAgendaMeta}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={17}
              color={clienteHomeTheme.muted}
            />
            <Text style={[styles.trainerClassAgendaMetaText, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
              {alumnos === 0 ? "Sin alumnos inscritos" : `${alumnos} alumno(s) inscritos`}
            </Text>
          </View>
          <View
            style={[
              styles.trainerClassAgendaDetailButton,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <Text style={[styles.trainerClassAgendaDetailText, { color: colorPrimarioVisibleApp }]}>
              Ver
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={17}
              color={colorPrimarioVisibleApp}
            />
          </View>
        </View>
      </PremiumCard>
    );
  }

  function EntrenadorClaseDetalle({ clase }: { clase: any }) {
    const estado = obtenerEstadoTemporalClaseEntrenador(clase);
    const reservasClase = obtenerReservasActivasDeClase(clase.id);
    const alumnos = reservasClase.length;
    const capacidad = Number(clase.capacidadMaxima) || 0;
    const duracion = Number(clase.duracionMinutos) || 45;
    const imagenClase = resolverUrlMedia(clase.imagenUrl);

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.clientClassDetailTop}>
          <Pressable
            style={[
              styles.clientClassBackButton,
              { backgroundColor: clienteHomeTheme.surface },
            ]}
            onPress={() => setClaseEntrenadorSeleccionadaId(null)}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={clienteHomeTheme.text}
            />
          </Pressable>
          <View style={[styles.trainerAgendaStatusPill, { backgroundColor: estado.background }]}>
            <MaterialCommunityIcons name={estado.icon} size={14} color={estado.color} />
            <Text style={[styles.trainerAgendaStatusText, { color: estado.color }]}>
              {estado.label}
            </Text>
          </View>
        </View>

        {imagenClase ? (
          <ImageBackground
            source={{ uri: imagenClase }}
            style={styles.clientClassDetailHero}
            imageStyle={styles.clientClassDetailHeroImage}
          >
            <View style={styles.clientClassDetailShade} />
            <View style={styles.clientClassDetailHeroCopy}>
              <Text style={styles.clientClassDetailEyebrow}>
                {formatearFechaCompleta(clase.fechaHora)}
              </Text>
              <Text style={styles.clientClassDetailTitle}>{clase.nombre}</Text>
            </View>
          </ImageBackground>
        ) : (
          <ClassMediaPlaceholder
            theme={clienteHomeTheme}
            icon="calendar-clock-outline"
            eyebrow={formatearFechaCompleta(clase.fechaHora)}
            title={clase.nombre}
            style={styles.clientClassDetailHero}
          />
        )}

        {!!clase.descripcion && (
          <Text style={[styles.clientClassDetailDescription, { color: clienteHomeTheme.muted }]}>
            {clase.descripcion}
          </Text>
        )}

        <View style={styles.clientClassDetailGrid}>
          <EntrenadorClaseInfoItem
            icon="clock-outline"
            label="Horario"
            value={`${obtenerHora(clase.fechaHora)} · ${duracion} min`}
          />
          <EntrenadorClaseInfoItem
            icon="account-group-outline"
            label="Alumnos"
            value={`${alumnos}/${capacidad || "-"} inscritos`}
          />
          <EntrenadorClaseInfoItem
            icon="calendar-check-outline"
            label="Estado"
            value={estado.label}
          />
          <EntrenadorClaseInfoItem
            icon="map-marker-outline"
            label="Gimnasio"
            value={nombreGimnasioApp}
          />
        </View>

        <PremiumSectionHeader
          title="Alumnos inscritos"
          actionLabel={`${alumnos}/${capacidad || "-"} plazas`}
          theme={clienteHomeTheme}
        />

        {reservasClase.length === 0 ? (
          <PremiumEmptyState
            icon="account-off-outline"
            title="Clase sin alumnos"
            text="Cuando los clientes reserven esta clase, aparecerán aquí."
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerStudentList}>
            {reservasClase.map((reserva) => {
              const clienteReserva = usuariosGimnasio.find(
                (usuario) => usuario.id === reserva.clienteId,
              );
              const nombreCliente =
                reserva.nombreCliente || clienteReserva?.nombre || "Cliente";

              return (
                <PremiumCard
                  key={reserva.id}
                  theme={clienteHomeTheme}
                  style={styles.trainerStudentCard}
                >
                  <PremiumAvatar
                    uri={resolverUrlMedia(clienteReserva?.fotoPerfilUrl)}
                    initials={obtenerIniciales(nombreCliente)}
                    size={46}
                    theme={clienteHomeTheme}
                  />
                  <View style={styles.trainerStudentCopy}>
                    <Text style={[styles.trainerStudentName, { color: clienteHomeTheme.text }]} numberOfLines={1}>
                      {nombreCliente}
                    </Text>
                    <Text style={[styles.trainerStudentMeta, { color: clienteHomeTheme.muted }]}>
                      Reserva activa
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.trainerStudentBadge,
                      { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={15}
                      color={colorSecundarioVisibleApp}
                    />
                  </View>
                </PremiumCard>
              );
            })}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function EntrenadorClaseInfoItem({
    icon,
    label,
    value,
  }: {
    icon: IconName;
    label: string;
    value: string;
  }) {
    return (
      <PremiumCard theme={clienteHomeTheme} style={styles.clientClassInfoItem}>
        <MaterialCommunityIcons name={icon} size={20} color={colorSecundarioVisibleApp} />
        <Text style={[styles.clientClassInfoLabel, { color: clienteHomeTheme.muted }]}>
          {label}
        </Text>
        <Text style={[styles.clientClassInfoValue, { color: clienteHomeTheme.text }]} numberOfLines={2}>
          {value}
        </Text>
      </PremiumCard>
    );
  }

  function cambiarPesoOneRm(text: string) {
    setOneRmPesoInput(sanitizeOneRepMaxWeightInput(text));
    setOneRmResultado(null);
  }

  function cambiarRepeticionesOneRm(text: string) {
    setOneRmRepeticionesInput(sanitizeOneRepMaxRepetitionInput(text));
    setOneRmResultado(null);
  }

  function calcularOneRm() {
    const validacion = validateOneRepMaxInputs(
      oneRmPesoInput,
      oneRmRepeticionesInput,
    );

    setOneRmMostrarErrores(true);

    if (!validacion.isValid || !validacion.peso || !validacion.repeticiones) {
      setOneRmResultado(null);
      return;
    }

    Keyboard.dismiss();
    setOneRmResultado({
      peso: validacion.peso,
      repeticiones: validacion.repeticiones,
      oneRepMax: calculateOneRepMax(validacion.peso, validacion.repeticiones),
    });
  }

  function limpiarOneRm() {
    setOneRmPesoInput("");
    setOneRmRepeticionesInput("");
    setOneRmMostrarErrores(false);
    setOneRmResultado(null);
  }

  function renderAdminRutinasPremium() {
    if (modoRutinasEntrenador === "CALCULADORA_1RM") {
      return (
        <OneRepMaxCalculator
          theme={clienteHomeTheme}
          colors={oneRepMaxColors}
          weight={oneRmPesoInput}
          repetitions={oneRmRepeticionesInput}
          showErrors={oneRmMostrarErrores}
          result={oneRmResultado}
          avatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
          avatarInitials={obtenerIniciales(usuarioActivo?.nombre)}
          onWeightChange={cambiarPesoOneRm}
          onRepetitionsChange={cambiarRepeticionesOneRm}
          onCalculate={calcularOneRm}
          onClear={limpiarOneRm}
          onBack={() => {
            Keyboard.dismiss();
            setModoRutinasEntrenador("LISTA");
          }}
          onAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
          onInputFocus={enfocarCampoRutina}
        />
      );
    }

    if (modoRutinasEntrenador === "FORMULARIO") {
      return renderEntrenadorRutinaFormulario();
    }

    if (rutinaEntrenadorSeleccionada && modoRutinasEntrenador === "EJERCICIOS") {
      return renderEntrenadorRutinaEjercicios();
    }

    if (rutinaEntrenadorSeleccionada && modoRutinasEntrenador === "ASIGNAR") {
      return renderEntrenadorRutinaAsignar();
    }

    return (
      <AdminRoutines
        theme={clienteHomeTheme}
        adminAvatarUri={resolverUrlMedia(usuarioActivo?.fotoPerfilUrl)}
        adminInitials={obtenerIniciales(usuarioActivo?.nombre)}
        adminId={usuarioActivo?.id}
        routines={rutinasEntrenador}
        selectedRoutine={
          modoRutinasEntrenador === "DETALLE"
            ? rutinaEntrenadorSeleccionada
            : null
        }
        assignments={asignacionesRutinaEntrenador}
        users={usuariosGimnasio}
        search={busquedaRutinasAdmin}
        activeFilter={filtroRutinasAdmin}
        loading={cargandoRutinasEntrenador}
        saving={guardandoRutinaEntrenador}
        error={errorRutinasEntrenador}
        feedback={renderEntrenadorRutinasFeedback()}
        oneRmAccess={
          <OneRepMaxAccessCard
            theme={clienteHomeTheme}
            secondaryColor={oneRepMaxColors.secondary}
            iconBackgroundColor={oneRepMaxColors.accessIconBackground}
            onPress={() => {
              limpiarOneRm();
              setModoRutinasEntrenador("CALCULADORA_1RM");
            }}
          />
        }
        onSearchChange={setBusquedaRutinasAdmin}
        onFilterChange={setFiltroRutinasAdmin}
        onAdminAvatarPress={() => abrirSeccionAdmin("PERSONALIZAR")}
        onNewRoutine={prepararNuevaRutinaEntrenador}
        onOpenRoutine={(routineId) =>
          cargarDetalleRutinaEntrenador(routineId, "DETALLE")
        }
        onBackToList={() => {
          setModoRutinasEntrenador("LISTA");
          setRutinaEntrenadorSeleccionadaId(null);
          setAsignacionesRutinaEntrenador([]);
          setFeedbackRutinasEntrenador(null);
        }}
        onManageExercises={() => {
          const exercises = rutinaEntrenadorSeleccionada
            ? obtenerEjerciciosRutinaOrdenados(rutinaEntrenadorSeleccionada)
            : [];
          setModoRutinasEntrenador("EJERCICIOS");
          setMostrarFormularioEjercicioRutina(exercises.length === 0);
          if (exercises.length === 0) {
            limpiarFormularioEjercicioRutina();
          }
        }}
        onAssignClients={abrirAsignacionRutinaEntrenador}
        onEdit={prepararEditarRutinaEntrenador}
        onDuplicate={duplicarRutinaEntrenador}
        onDeactivate={desactivarRutinaEntrenador}
        onRetry={cargarRutinasEntrenador}
        getRoutineImage={obtenerPrimeraImagenRutina}
        renderExercise={(item, index) =>
          renderEntrenadorExerciseCard(item, index, false)
        }
      />
    );
  }

  function renderEntrenadorRutinasPremium() {
    if (modoRutinasEntrenador === "CALCULADORA_1RM") {
      return (
        <OneRepMaxCalculator
          theme={clienteHomeTheme}
          colors={oneRepMaxColors}
          weight={oneRmPesoInput}
          repetitions={oneRmRepeticionesInput}
          showErrors={oneRmMostrarErrores}
          result={oneRmResultado}
          avatarUri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
          avatarInitials={obtenerIniciales(entrenadorDemo?.nombre)}
          onWeightChange={cambiarPesoOneRm}
          onRepetitionsChange={cambiarRepeticionesOneRm}
          onCalculate={calcularOneRm}
          onClear={limpiarOneRm}
          onBack={() => setModoRutinasEntrenador("LISTA")}
          onAvatarPress={() => setSeccionEntrenador("PERFIL")}
          onInputFocus={enfocarCampoRutina}
        />
      );
    }

    if (modoRutinasEntrenador === "FORMULARIO") {
      return renderEntrenadorRutinaFormulario();
    }

    if (rutinaEntrenadorSeleccionada && modoRutinasEntrenador === "EJERCICIOS") {
      return renderEntrenadorRutinaEjercicios();
    }

    if (rutinaEntrenadorSeleccionada && modoRutinasEntrenador === "ASIGNAR") {
      return renderEntrenadorRutinaAsignar();
    }

    if (rutinaEntrenadorSeleccionada && modoRutinasEntrenador === "DETALLE") {
      return renderEntrenadorRutinaDetalle();
    }

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.trainerHomeHeader}>
          <View style={styles.trainerHomeHeaderCopy}>
            <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
              Entrenamiento
            </Text>
            <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
              Rutinas
            </Text>
            <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
              Crea, organiza y asigna entrenamientos a tus alumnos.
            </Text>
          </View>
          <PremiumAvatar
            uri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
            initials={obtenerIniciales(entrenadorDemo?.nombre)}
            size={52}
            theme={clienteHomeTheme}
            onPress={() => setSeccionEntrenador("PERFIL")}
          />
        </View>

        <PremiumPrimaryButton
          label="Nueva rutina"
          icon="plus"
          theme={clienteHomeTheme}
          onPress={prepararNuevaRutinaEntrenador}
          style={styles.trainerRoutineMainButton}
        />

        <OneRepMaxAccessCard
          theme={clienteHomeTheme}
          secondaryColor={oneRepMaxColors.secondary}
          iconBackgroundColor={oneRepMaxColors.accessIconBackground}
          onPress={() => setModoRutinasEntrenador("CALCULADORA_1RM")}
        />

        {renderEntrenadorRutinasFeedback()}

        <View
          style={[
            styles.trainerRoutineSearch,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={clienteHomeTheme.muted} />
          <TextInput
            value={busquedaRutinasEntrenador}
            onChangeText={setBusquedaRutinasEntrenador}
            placeholder="Buscar rutina..."
            placeholderTextColor={clienteHomeTheme.muted}
            style={[styles.trainerRoutineSearchInput, { color: clienteHomeTheme.text }]}
            autoCapitalize="none"
          />
        </View>

        {nivelesRutinasEntrenador.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trainerRoutineFilterRow}
          >
            {["TODAS", ...nivelesRutinasEntrenador].slice(0, 6).map((nivel) => (
              <PremiumFilterChip
                key={nivel}
                label={nivel === "TODAS" ? "Todas" : nivel}
                active={filtroNivelRutinasEntrenador === nivel}
                theme={clienteHomeTheme}
                onPress={() => setFiltroNivelRutinasEntrenador(nivel)}
              />
            ))}
          </ScrollView>
        )}

        <PremiumSectionHeader
          title="Mis rutinas"
          actionLabel={
            rutinasEntrenador.length > 0
              ? `${rutinasEntrenador.length} total`
              : undefined
          }
          theme={clienteHomeTheme}
        />

        {cargandoRutinasEntrenador && rutinasEntrenador.length === 0 ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.trainerHomeLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.trainerHomeLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando rutinas...
            </Text>
          </PremiumCard>
        ) : errorRutinasEntrenador && rutinasEntrenador.length === 0 ? (
          <PremiumEmptyState
            icon="wifi-alert"
            title="No se pudieron cargar"
            text={errorRutinasEntrenador}
            actionLabel="Reintentar"
            onAction={cargarRutinasEntrenador}
            theme={clienteHomeTheme}
          />
        ) : rutinasEntrenador.length === 0 ? (
          <PremiumEmptyState
            icon="arm-flex-outline"
            title="Sin rutinas todavía"
            text="Crea tu primera rutina y después añade ejercicios y alumnos."
            actionLabel="Nueva rutina"
            onAction={prepararNuevaRutinaEntrenador}
            theme={clienteHomeTheme}
          />
        ) : rutinasEntrenadorFiltradas.length === 0 ? (
          <PremiumEmptyState
            icon="magnify-close"
            title="Sin resultados"
            text="Prueba con otro nombre o nivel."
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerRoutineList}>
            {rutinasEntrenadorFiltradas.map((rutina) =>
              renderEntrenadorRutinaCard(rutina),
            )}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorRutinaCard(rutina: RutinaApp) {
    const totalEjercicios = rutina.ejercicios?.length || 0;
    const imagenRutina = obtenerPrimeraImagenRutina(rutina);
    const meta = [
      `${totalEjercicios} ejercicio${totalEjercicios === 1 ? "" : "s"}`,
      rutina.duracionEstimadaMinutos
        ? `~${rutina.duracionEstimadaMinutos} min`
        : null,
      rutina.totalAsignacionesActivas != null
        ? `${rutina.totalAsignacionesActivas} alumno${rutina.totalAsignacionesActivas === 1 ? "" : "s"}`
        : null,
    ].filter(Boolean);

    return (
      <PremiumCard
        key={rutina.id}
        theme={clienteHomeTheme}
        style={styles.trainerRoutineCard}
        onPress={() => cargarDetalleRutinaEntrenador(rutina.id, "DETALLE")}
      >
        {imagenRutina ? (
          <Image source={{ uri: imagenRutina }} style={styles.trainerRoutineThumb} />
        ) : (
          <View
            style={[
              styles.trainerRoutineIcon,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <MaterialCommunityIcons
              name="arm-flex-outline"
              size={24}
              color={colorPrimarioVisibleApp}
            />
          </View>
        )}
        <View style={styles.trainerRoutineCardCopy}>
          <View style={styles.trainerRoutineCardTitleRow}>
            <Text
              style={[styles.trainerRoutineCardTitle, { color: clienteHomeTheme.text }]}
              numberOfLines={1}
            >
              {rutina.nombre}
            </Text>
            {!!rutina.nivel && (
              <View
                style={[
                  styles.trainerRoutineLevelPill,
                  { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
                ]}
              >
                <Text
                  style={[
                    styles.trainerRoutineLevelText,
                    { color: colorSecundarioVisibleApp },
                  ]}
                  numberOfLines={1}
                >
                  {rutina.nivel}
                </Text>
              </View>
            )}
          </View>
          {!!rutina.descripcion && (
            <Text
              style={[styles.trainerRoutineDescription, { color: clienteHomeTheme.muted }]}
              numberOfLines={2}
            >
              {rutina.descripcion}
            </Text>
          )}
          <Text
            style={[styles.trainerRoutineMeta, { color: clienteHomeTheme.muted }]}
            numberOfLines={1}
          >
            {meta.join(" · ")}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={23}
          color={clienteHomeTheme.muted}
        />
      </PremiumCard>
    );
  }

  function renderEntrenadorRutinaDetalle() {
    if (!rutinaEntrenadorSeleccionada) {
      return null;
    }

    const ejerciciosOrdenados = obtenerEjerciciosRutinaOrdenados(
      rutinaEntrenadorSeleccionada,
    );

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderEntrenadorRutinaTopBar("Rutina", () => {
          setModoRutinasEntrenador("LISTA");
          setRutinaEntrenadorSeleccionadaId(null);
        })}

        {renderEntrenadorRutinasFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.trainerRoutineDetailHero}>
          <View style={styles.trainerRoutineDetailTopRow}>
            <View
              style={[
                styles.trainerRoutineDetailIcon,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
              ]}
            >
              <MaterialCommunityIcons
                name="arm-flex-outline"
                size={30}
                color={colorPrimarioVisibleApp}
              />
            </View>
            <View style={styles.trainerRoutineDetailCopy}>
              <Text
                style={[styles.trainerRoutineDetailTitle, { color: clienteHomeTheme.text }]}
                numberOfLines={2}
              >
                {rutinaEntrenadorSeleccionada.nombre}
              </Text>
              {!!rutinaEntrenadorSeleccionada.descripcion && (
                <Text
                  style={[
                    styles.trainerRoutineDetailText,
                    { color: clienteHomeTheme.muted },
                  ]}
                >
                  {rutinaEntrenadorSeleccionada.descripcion}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.trainerRoutineDetailStats}>
            {renderEntrenadorRutinaMetric("Nivel", rutinaEntrenadorSeleccionada.nivel || "Sin nivel", "signal-cellular-2")}
            {renderEntrenadorRutinaMetric(
              "Duración",
              rutinaEntrenadorSeleccionada.duracionEstimadaMinutos
                ? `${rutinaEntrenadorSeleccionada.duracionEstimadaMinutos} min`
                : "Sin dato",
              "timer-outline",
            )}
            {renderEntrenadorRutinaMetric(
              "Ejercicios",
              ejerciciosOrdenados.length,
              "format-list-numbered",
            )}
            {renderEntrenadorRutinaMetric(
              "Alumnos",
              rutinaEntrenadorSeleccionada.totalAsignacionesActivas || 0,
              "account-group-outline",
            )}
          </View>

          <PremiumPrimaryButton
            label="Gestionar ejercicios"
            icon="format-list-numbered"
            theme={clienteHomeTheme}
            onPress={() => {
              setModoRutinasEntrenador("EJERCICIOS");
              setMostrarFormularioEjercicioRutina(ejerciciosOrdenados.length === 0);
              if (ejerciciosOrdenados.length === 0) {
                limpiarFormularioEjercicioRutina();
              }
            }}
          />
          <View style={styles.trainerRoutineActionsRow}>
            <PremiumSecondaryButton
              label="Asignar"
              icon="account-plus-outline"
              theme={clienteHomeTheme}
              onPress={abrirAsignacionRutinaEntrenador}
              style={styles.trainerRoutineActionButton}
            />
            <PremiumSecondaryButton
              label="Editar"
              icon="pencil-outline"
              theme={clienteHomeTheme}
              onPress={prepararEditarRutinaEntrenador}
              style={styles.trainerRoutineActionButton}
            />
          </View>
          <Pressable
            style={[
              styles.trainerRoutineDuplicateAction,
              {
                backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10"),
                borderColor: colorConAlpha(colorSecundarioVisibleApp, "24"),
              },
            ]}
            onPress={duplicarRutinaEntrenador}
            disabled={guardandoRutinaEntrenador}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={18}
              color={colorSecundarioVisibleApp}
            />
            <Text
              style={[
                styles.trainerRoutineDuplicateText,
                { color: colorSecundarioVisibleApp },
              ]}
            >
              Duplicar rutina
            </Text>
          </Pressable>
        </PremiumCard>

        <PremiumSectionHeader
          title="Ejercicios"
          actionLabel="Editar"
          onAction={() => setModoRutinasEntrenador("EJERCICIOS")}
          theme={clienteHomeTheme}
        />

        {ejerciciosOrdenados.length === 0 ? (
          <PremiumEmptyState
            icon="format-list-numbered"
            title="Rutina sin ejercicios"
            text="Añade ejercicios para que tus alumnos puedan seguir el entrenamiento en orden."
            actionLabel="Añadir ejercicio"
            onAction={() => {
              setModoRutinasEntrenador("EJERCICIOS");
              prepararNuevoEjercicioRutina();
            }}
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerRoutineExerciseList}>
            {ejerciciosOrdenados.map((item, index) =>
              renderEntrenadorExerciseCard(item, index, false),
            )}
          </View>
        )}

        <PremiumSectionHeader
          title="Alumnos asignados"
          actionLabel="Gestionar"
          onAction={abrirAsignacionRutinaEntrenador}
          theme={clienteHomeTheme}
        />

        {alumnosAsignadosRutina.length === 0 ? (
          <PremiumEmptyState
            icon="account-multiple-plus-outline"
            title="Sin alumnos asignados"
            text="Cuando asignes esta rutina a un alumno, aparecera aqui."
            actionLabel="Asignar alumnos"
            onAction={abrirAsignacionRutinaEntrenador}
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerRoutineAssignedPreview}>
            {alumnosAsignadosRutina.slice(0, 4).map(({ asignacion, cliente, nombre }) => (
              <PremiumCard
                key={asignacion.id}
                theme={clienteHomeTheme}
                style={styles.trainerRoutineStudentCompact}
              >
                <PremiumAvatar
                  uri={resolverUrlMedia(cliente?.fotoPerfilUrl)}
                  initials={obtenerIniciales(nombre)}
                  size={40}
                  theme={clienteHomeTheme}
                />
                <View style={styles.trainerRoutineStudentCopy}>
                  <Text
                    style={[styles.trainerRoutineStudentName, { color: clienteHomeTheme.text }]}
                    numberOfLines={1}
                  >
                    {nombre}
                  </Text>
                  <Text
                    style={[styles.trainerRoutineStudentMeta, { color: clienteHomeTheme.muted }]}
                    numberOfLines={1}
                  >
                    Asignada
                  </Text>
                </View>
              </PremiumCard>
            ))}
          </View>
        )}

        <Pressable
          style={[
            styles.trainerRoutineDangerLink,
            { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
          ]}
          onPress={desactivarRutinaEntrenador}
          disabled={guardandoRutinaEntrenador}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#B91C1C" />
          <Text style={styles.trainerRoutineDangerText}>Desactivar rutina</Text>
        </Pressable>
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorRutinaFormulario() {
    const editando = Boolean(rutinaEntrenadorSeleccionadaId);

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderEntrenadorRutinaTopBar(editando ? "Editar rutina" : "Nueva rutina", () => {
          confirmarDescartarFormularioRutina(() => {
            setModoRutinasEntrenador(
              rutinaEntrenadorSeleccionadaId ? "DETALLE" : "LISTA",
            );
            if (!rutinaEntrenadorSeleccionadaId) {
              setRutinaEntrenadorSeleccionadaId(null);
            }
          });
        })}

        {renderEntrenadorRutinasFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.trainerRoutineFormCard}>
          {renderRutinaTextInput({
            label: "Nombre",
            icon: "arm-flex-outline",
            value: rutinaFormNombre,
            onChangeText: setRutinaFormNombre,
            placeholder: "Ej. Full body principiante",
            returnKeyType: "next",
          })}
          {renderRutinaTextInput({
            label: "Descripcion",
            icon: "text-box-outline",
            value: rutinaFormDescripcion,
            onChangeText: setRutinaFormDescripcion,
            placeholder: "Objetivo, enfoque o indicaciones generales",
            multiline: true,
          })}
          {renderRutinaTextInput({
            label: "Nivel",
            icon: "signal-cellular-2",
            value: rutinaFormNivel,
            onChangeText: setRutinaFormNivel,
            placeholder: "Principiante, intermedio...",
            returnKeyType: "next",
          })}
          {renderRutinaTextInput({
            label: "Duración estimada",
            icon: "timer-outline",
            value: rutinaFormDuracion,
            onChangeText: setRutinaFormDuracion,
            placeholder: "45",
            keyboardType: "number-pad",
          })}

          <PremiumPrimaryButton
            label={guardandoRutinaEntrenador ? "Guardando" : "Guardar rutina"}
            icon="content-save-outline"
            theme={clienteHomeTheme}
            onPress={guardarRutinaEntrenador}
            loading={guardandoRutinaEntrenador}
          />
          <PremiumSecondaryButton
            label="Cancelar"
            icon="close"
            theme={clienteHomeTheme}
            onPress={() =>
              confirmarDescartarFormularioRutina(() =>
                setModoRutinasEntrenador(
                  rutinaEntrenadorSeleccionadaId ? "DETALLE" : "LISTA",
                ),
              )
            }
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorRutinaEjercicios() {
    if (!rutinaEntrenadorSeleccionada) {
      return null;
    }

    const ejerciciosOrdenados = obtenerEjerciciosRutinaOrdenados(
      rutinaEntrenadorSeleccionada,
    );

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderEntrenadorRutinaTopBar("Gestionar ejercicios", () => {
          confirmarDescartarEjercicioRutina(() => {
            setModoRutinasEntrenador("DETALLE");
          });
        })}

        {renderEntrenadorRutinasFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.trainerRoutineEditorSummary}>
          <Text
            style={[styles.trainerRoutineEditorTitle, { color: clienteHomeTheme.text }]}
            numberOfLines={1}
          >
            {rutinaEntrenadorSeleccionada.nombre}
          </Text>
          <Text style={[styles.trainerRoutineEditorMeta, { color: clienteHomeTheme.muted }]}>
            {ejerciciosOrdenados.length} ejercicio(s) · biblioteca: {ejerciciosDisponiblesRutina.length}
          </Text>
        </PremiumCard>

        <PremiumSectionHeader
          title="Ejercicios"
          actionLabel={mostrarFormularioEjercicioRutina ? undefined : "Añadir"}
          onAction={mostrarFormularioEjercicioRutina ? undefined : prepararNuevoEjercicioRutina}
          theme={clienteHomeTheme}
        />

        {mostrarFormularioEjercicioRutina && renderEntrenadorEjercicioForm()}

        {ejerciciosOrdenados.length === 0 && !mostrarFormularioEjercicioRutina ? (
          <PremiumEmptyState
            icon="format-list-numbered"
            title="Rutina sin ejercicios"
            text="Añade el primer ejercicio. Luego podrás cambiar el orden con subir y bajar."
            actionLabel="Añadir ejercicio"
            onAction={prepararNuevoEjercicioRutina}
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerRoutineExerciseList}>
            {ejerciciosOrdenados.map((item, index) =>
              renderEntrenadorExerciseCard(item, index, true),
            )}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorRutinaAsignar() {
    if (!rutinaEntrenadorSeleccionada) {
      return null;
    }

    const alumnosDisponiblesParaAsignar = alumnosDisponiblesRutina.filter(
      (cliente) => !asignacionesClienteIdsRutina.has(cliente.id),
    );

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderEntrenadorRutinaTopBar("Asignar alumnos", () => {
          setModoRutinasEntrenador("DETALLE");
          setAlumnosRutinaSeleccionadosIds([]);
          setBusquedaAlumnosRutina("");
        })}

        {renderEntrenadorRutinasFeedback()}

        <PremiumCard theme={clienteHomeTheme} style={styles.trainerRoutineEditorSummary}>
          <Text
            style={[styles.trainerRoutineEditorTitle, { color: clienteHomeTheme.text }]}
            numberOfLines={1}
          >
            {rutinaEntrenadorSeleccionada.nombre}
          </Text>
          <Text style={[styles.trainerRoutineEditorMeta, { color: clienteHomeTheme.muted }]}>
            {alumnosAsignadosRutina.length} alumno(s) con esta rutina
          </Text>
        </PremiumCard>

        <PremiumSectionHeader title="Ya asignada" theme={clienteHomeTheme} />
        {alumnosAsignadosRutina.length === 0 ? (
          <PremiumEmptyState
            icon="account-off-outline"
            title="Sin alumnos asignados"
            text="Selecciona alumnos disponibles para asignar la rutina."
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerRoutineStudentList}>
            {alumnosAsignadosRutina.map(({ asignacion, cliente, nombre }) =>
              renderRutinaAlumnoAsignado(asignacion, cliente, nombre),
            )}
          </View>
        )}

        <PremiumSectionHeader
          title="Alumnos disponibles"
          actionLabel={
            alumnosRutinaSeleccionadosIds.length > 0
              ? `${alumnosRutinaSeleccionadosIds.length} seleccionados`
              : undefined
          }
          theme={clienteHomeTheme}
        />

        <View
          style={[
            styles.trainerRoutineSearch,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={clienteHomeTheme.muted} />
          <TextInput
            value={busquedaAlumnosRutina}
            onChangeText={setBusquedaAlumnosRutina}
            placeholder="Buscar alumno..."
            placeholderTextColor={clienteHomeTheme.muted}
            style={[styles.trainerRoutineSearchInput, { color: clienteHomeTheme.text }]}
            autoCapitalize="none"
          />
        </View>

        {alumnosDisponiblesParaAsignar.length === 0 ? (
          <PremiumEmptyState
            icon="account-check-outline"
            title="Sin alumnos disponibles"
            text={
              clientesActivos.length === 0
                ? "No hay clientes activos en este gimnasio."
                : "Todos los alumnos que coinciden ya tienen esta rutina."
            }
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.trainerRoutineStudentList}>
            {alumnosDisponiblesParaAsignar.map((cliente) =>
              renderRutinaAlumnoDisponible(cliente),
            )}
          </View>
        )}

        <PremiumPrimaryButton
          label={
            alumnosRutinaSeleccionadosIds.length > 0
              ? `Asignar a ${alumnosRutinaSeleccionadosIds.length} alumno${
                  alumnosRutinaSeleccionadosIds.length === 1 ? "" : "s"
                }`
              : "Selecciona alumnos"
          }
          icon="account-plus-outline"
          theme={clienteHomeTheme}
          onPress={guardarAsignacionRutinaEntrenador}
          loading={guardandoRutinaEntrenador}
          disabled={alumnosRutinaSeleccionadosIds.length === 0}
          style={styles.trainerRoutineStickyAction}
        />
      </PremiumScreenContainer>
    );
  }

  function renderEntrenadorRutinaTopBar(title: string, onBack: () => void) {
    return (
      <View style={styles.trainerRoutineTopBar}>
        <Pressable
          style={[
            styles.clientClassBackButton,
            { backgroundColor: clienteHomeTheme.surface },
          ]}
          onPress={onBack}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={clienteHomeTheme.text}
          />
        </Pressable>
        <View style={styles.trainerRoutineTopCopy}>
          <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
            Entrenamiento
          </Text>
          <Text
            style={[styles.trainerRoutineTopTitle, { color: clienteHomeTheme.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>
    );
  }

  function renderEntrenadorRutinaMetric(
    label: string,
    value: string | number,
    icon: IconName,
  ) {
    return (
      <View
        style={[
          styles.trainerRoutineMetric,
          { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10") },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={colorSecundarioVisibleApp} />
        <Text style={[styles.trainerRoutineMetricValue, { color: clienteHomeTheme.text }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.trainerRoutineMetricLabel, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }

  function renderRutinaMultimediaPicker() {
    const mediaUri =
      resolverUrlMedia(ejercicioFormMultimediaUrl) ||
      ejercicioFormMultimediaLocalUri;
    const tieneMultimedia =
      ejercicioFormTipoMultimedia !== "NINGUNO" && Boolean(mediaUri);
    const subiendo = subiendoImagen === "rutina-ejercicio";
    const esVideo = ejercicioFormTipoMultimedia === "VIDEO";

    return (
      <View style={styles.trainerRoutineInputGroup}>
        <Text style={[styles.trainerRoutineInputLabel, { color: clienteHomeTheme.text }]}>
          Multimedia opcional
        </Text>

        {tieneMultimedia ? (
          <View
            style={[
              styles.trainerRoutineMediaPreview,
              {
                backgroundColor: clienteHomeTheme.surfaceSoft,
                borderColor: clienteHomeTheme.border,
              },
            ]}
          >
            {esVideo ? (
              <View
                style={[
                  styles.trainerRoutineVideoPreview,
                  { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "14") },
                ]}
              >
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={30}
                  color={colorSecundarioVisibleApp}
                />
              </View>
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.trainerRoutineMediaImage} />
            )}
            <View style={styles.trainerRoutineMediaCopy}>
              <Text
                style={[styles.trainerRoutineMediaTitle, { color: clienteHomeTheme.text }]}
                numberOfLines={1}
              >
                {esVideo ? "Vídeo añadido" : "Imagen añadida"}
              </Text>
              <Text
                style={[styles.trainerRoutineMediaMeta, { color: clienteHomeTheme.muted }]}
                numberOfLines={1}
              >
                {ejercicioFormMultimediaNombre || "Archivo listo para el ejercicio"}
              </Text>
            </View>
            <View style={styles.trainerRoutineMediaActions}>
              <Pressable
                style={[
                  styles.trainerRoutineMediaIconButton,
                  { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
                ]}
                onPress={abrirSelectorMultimediaRutina}
                disabled={subiendo}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={18}
                  color={colorSecundarioVisibleApp}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.trainerRoutineMediaIconButton,
                  { backgroundColor: "#FEF2F2" },
                ]}
                onPress={eliminarMultimediaEjercicioRutina}
                disabled={subiendo}
              >
                <MaterialCommunityIcons name="close" size={18} color="#B91C1C" />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[
              styles.trainerRoutineMediaPicker,
              {
                backgroundColor: clienteHomeTheme.surfaceSoft,
                borderColor: erroresEjercicioRutina.multimedia
                  ? "#FCA5A5"
                  : clienteHomeTheme.border,
              },
            ]}
            onPress={abrirSelectorMultimediaRutina}
            disabled={subiendo}
          >
            {subiendo ? (
              <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            ) : (
              <MaterialCommunityIcons
                name="image-plus"
                size={22}
                color={colorSecundarioVisibleApp}
              />
            )}
            <View style={styles.trainerRoutineMediaCopy}>
              <Text style={[styles.trainerRoutineMediaTitle, { color: clienteHomeTheme.text }]}>
                {subiendo ? "Subiendo archivo..." : "Añadir foto o vídeo"}
              </Text>
              <Text style={[styles.trainerRoutineMediaMeta, { color: clienteHomeTheme.muted }]}>
                Desde galería o cámara. Opcional.
              </Text>
            </View>
          </Pressable>
        )}

        {!!erroresEjercicioRutina.multimedia && (
          <Text style={styles.trainerRoutineInputError}>
            {erroresEjercicioRutina.multimedia}
          </Text>
        )}
      </View>
    );
  }

  function renderEntrenadorEjercicioForm() {
    return (
      <PremiumCard theme={clienteHomeTheme} style={styles.trainerRoutineExerciseForm}>
        <Text style={[styles.trainerRoutineFormTitle, { color: clienteHomeTheme.text }]}>
          {ejercicioRutinaEditandoId ? "Editar ejercicio" : "Añadir ejercicio"}
        </Text>

        {renderRutinaTextInput({
          label: "Ejercicio",
          icon: "dumbbell",
          value: ejercicioFormNombre,
          onChangeText: setEjercicioFormNombre,
          placeholder: "Ej. Sentadilla",
          error: erroresEjercicioRutina.nombre,
          returnKeyType: "next",
        })}
        {renderRutinaTextInput({
          label: "Descripción",
          icon: "text-box-outline",
          value: ejercicioFormDescripcion,
          onChangeText: setEjercicioFormDescripcion,
          placeholder: "Técnica o objetivo del ejercicio",
          multiline: true,
        })}

        {renderRutinaMultimediaPicker()}

        <View style={styles.trainerRoutineExerciseGrid}>
          {renderRutinaTextInput({
            label: "Series",
            icon: "counter",
            value: ejercicioFormSeries,
            onChangeText: setEjercicioFormSeries,
            placeholder: "3",
            keyboardType: "number-pad",
            error: erroresEjercicioRutina.series,
            compact: true,
          })}
          {renderRutinaTextInput({
            label: "Reps",
            icon: "repeat",
            value: ejercicioFormRepeticiones,
            onChangeText: setEjercicioFormRepeticiones,
            placeholder: "10",
            keyboardType: "number-pad",
            error: erroresEjercicioRutina.repeticiones,
            compact: true,
          })}
        </View>

        <View style={styles.trainerRoutineExerciseGrid}>
          {renderRutinaTextInput({
            label: "Descanso",
            icon: "timer-outline",
            value: ejercicioFormDescanso,
            onChangeText: setEjercicioFormDescanso,
            placeholder: "90",
            keyboardType: "number-pad",
            unit: "s",
            error: erroresEjercicioRutina.descanso,
            compact: true,
          })}
          {renderRutinaTextInput({
            label: "Peso",
            icon: "weight-kilogram",
            value: ejercicioFormPeso,
            onChangeText: setEjercicioFormPeso,
            placeholder: "Opcional",
            keyboardType: "decimal-pad",
            unit: "kg",
            error: erroresEjercicioRutina.peso,
            compact: true,
          })}
        </View>

        {renderRutinaTextInput({
          label: "Notas",
          icon: "note-text-outline",
          value: ejercicioFormNotas,
          onChangeText: setEjercicioFormNotas,
          placeholder: "Indicaciones concretas",
          multiline: true,
        })}

        <View style={styles.trainerRoutineFormActions}>
          <Pressable
            style={[
              styles.trainerRoutineExerciseSaveButton,
              { backgroundColor: colorPrimarioVisibleApp },
              !ejercicioRutinaPuedeGuardar && styles.trainerRoutineActionDisabled,
            ]}
            onPress={guardarEjercicioRutinaEntrenador}
            disabled={!ejercicioRutinaPuedeGuardar}
          >
            {guardandoRutinaEntrenador ? (
              <ActivityIndicator size="small" color={clienteHomeTheme.textOnPrimary} />
            ) : (
              <MaterialCommunityIcons
                name="content-save-outline"
                size={18}
                color={clienteHomeTheme.textOnPrimary}
              />
            )}
            <Text
              style={[
                styles.trainerRoutineExerciseSaveText,
                { color: clienteHomeTheme.textOnPrimary },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Guardar
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.trainerRoutineExerciseCancelButton,
              {
                backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10"),
                borderColor: colorConAlpha(colorSecundarioVisibleApp, "28"),
              },
            ]}
            onPress={() => confirmarDescartarEjercicioRutina()}
          >
            <Text
              style={[
                styles.trainerRoutineExerciseCancelText,
                { color: colorSecundarioVisibleApp },
              ]}
              numberOfLines={1}
            >
              Cancelar
            </Text>
          </Pressable>
        </View>
      </PremiumCard>
    );
  }

  function renderEntrenadorExerciseCard(
    item: RutinaEjercicioApp,
    index: number,
    editable: boolean,
  ) {
    const ejercicio = item.ejercicio;
    const mediaUri = resolverUrlMedia(ejercicio?.multimediaUrl);
    const nombreEjercicio = ejercicio?.nombre || "Ejercicio";
    const tieneImagen = ejercicio?.tipoMultimedia === "IMAGEN" && Boolean(mediaUri);
    const tieneVideo = ejercicio?.tipoMultimedia === "VIDEO" && Boolean(mediaUri);
    const seriesValidas = item.series != null && item.series > 0;
    const repeticiones = item.repeticiones?.trim();
    const detallePrincipal =
      seriesValidas && repeticiones
        ? `${item.series} × ${repeticiones}`
        : repeticiones || (seriesValidas ? `${item.series} series` : null);
    const metaItems = [
      detallePrincipal || null,
      item.descansoSegundos != null
        ? `${item.descansoSegundos} s descanso`
        : null,
      item.peso != null && item.peso > 0 ? `${item.peso} kg` : null,
    ].filter(Boolean);
    const meta = [metaItems.join(" · ")].filter(Boolean);

    return (
      <PremiumCard key={item.id} theme={clienteHomeTheme} style={styles.trainerExerciseCard}>
        <View
          style={[
            styles.trainerExerciseOrder,
            { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
          ]}
        >
          <Text style={[styles.trainerExerciseOrderText, { color: colorPrimarioVisibleApp }]}>
            {index + 1}
          </Text>
        </View>

        {tieneImagen && mediaUri && (
          <Pressable
            style={styles.trainerExerciseMediaButton}
            onPress={() => abrirMultimediaRutina("IMAGEN", mediaUri, nombreEjercicio)}
            accessibilityRole="button"
            accessibilityLabel={`Ver imagen de ${nombreEjercicio}`}
            hitSlop={6}
          >
            <Image source={{ uri: mediaUri }} style={styles.trainerExerciseThumb} />
          </Pressable>
        )}
        {tieneVideo && mediaUri && (
          <Pressable
            style={[
              styles.trainerExerciseMediaButton,
              styles.trainerExerciseVideoThumb,
              { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
            ]}
            onPress={() => abrirMultimediaRutina("VIDEO", mediaUri, nombreEjercicio)}
            accessibilityRole="button"
            accessibilityLabel={`Reproducir vídeo de ${nombreEjercicio}`}
            hitSlop={6}
          >
            <MaterialCommunityIcons
              name="play"
              size={21}
              color={colorSecundarioVisibleApp}
            />
          </Pressable>
        )}

        <View style={styles.trainerExerciseCopy}>
          <View style={styles.trainerExerciseTitleRow}>
            <Text
              style={[styles.trainerExerciseTitle, { color: clienteHomeTheme.text }]}
              numberOfLines={1}
            >
              {nombreEjercicio}
            </Text>
            {tieneVideo && mediaUri && (
              <Pressable
                style={[
                  styles.trainerRoutineLevelPill,
                  { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
                ]}
                onPress={() => abrirMultimediaRutina("VIDEO", mediaUri, nombreEjercicio)}
                accessibilityRole="button"
                accessibilityLabel={`Reproducir vídeo de ${nombreEjercicio}`}
                hitSlop={6}
              >
                <MaterialCommunityIcons
                  name="play-circle"
                  size={13}
                  color={colorSecundarioVisibleApp}
                />
                <Text
                  style={[
                    styles.trainerRoutineLevelText,
                    { color: colorSecundarioVisibleApp },
                  ]}
                >
                  Vídeo
                </Text>
              </Pressable>
            )}
          </View>
          {meta.length > 0 && (
            <Text
              style={[styles.trainerExerciseMeta, { color: clienteHomeTheme.muted }]}
              numberOfLines={2}
            >
              {meta.join(" · ")}
            </Text>
          )}
          {!!item.notas?.trim() && (
            <Text
              style={[styles.trainerExerciseNotes, { color: clienteHomeTheme.text }]}
              numberOfLines={2}
            >
              {item.notas.trim()}
            </Text>
          )}
        </View>

        {editable && (
          <View style={styles.trainerExerciseActions}>
            <Pressable
              style={styles.trainerExerciseIconButton}
              onPress={() => moverEjercicioRutinaEntrenador(item, "ARRIBA")}
              disabled={index === 0 || guardandoRutinaEntrenador}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={20}
                color={index === 0 ? "#CBD5E1" : clienteHomeTheme.muted}
              />
            </Pressable>
            <Pressable
              style={styles.trainerExerciseIconButton}
              onPress={() => moverEjercicioRutinaEntrenador(item, "ABAJO")}
              disabled={
                index === (rutinaEntrenadorSeleccionada?.ejercicios?.length || 0) - 1 ||
                guardandoRutinaEntrenador
              }
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={
                  index === (rutinaEntrenadorSeleccionada?.ejercicios?.length || 0) - 1
                    ? "#CBD5E1"
                    : clienteHomeTheme.muted
                }
              />
            </Pressable>
            <Pressable
              style={styles.trainerExerciseIconButton}
              onPress={() => abrirEditorEjercicioRutina(item)}
            >
              <MaterialCommunityIcons name="pencil-outline" size={19} color={colorSecundarioVisibleApp} />
            </Pressable>
            <Pressable
              style={styles.trainerExerciseIconButton}
              onPress={() => eliminarEjercicioRutinaEntrenador(item)}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={19} color="#EF4444" />
            </Pressable>
          </View>
        )}
      </PremiumCard>
    );
  }

  function renderRutinaAlumnoAsignado(
    asignacion: RutinaAsignadaApp,
    cliente: any,
    nombre: string,
  ) {
    return (
      <PremiumCard key={asignacion.id} theme={clienteHomeTheme} style={styles.trainerRoutineStudentCard}>
        <PremiumAvatar
          uri={resolverUrlMedia(cliente?.fotoPerfilUrl)}
          initials={obtenerIniciales(nombre)}
          size={42}
          theme={clienteHomeTheme}
        />
        <View style={styles.trainerRoutineStudentCopy}>
          <Text
            style={[styles.trainerRoutineStudentName, { color: clienteHomeTheme.text }]}
            numberOfLines={1}
          >
            {nombre}
          </Text>
          <Text
            style={[styles.trainerRoutineStudentMeta, { color: clienteHomeTheme.muted }]}
            numberOfLines={1}
          >
            {cliente?.email || "Rutina activa"}
          </Text>
        </View>
        <Pressable
          style={[
            styles.trainerRoutineRemoveStudent,
            { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
          ]}
          onPress={() => retirarAsignacionRutinaEntrenador(asignacion)}
        >
          <MaterialCommunityIcons name="close" size={18} color="#B91C1C" />
        </Pressable>
      </PremiumCard>
    );
  }

  function renderRutinaAlumnoDisponible(cliente: any) {
    const seleccionado = alumnosRutinaSeleccionadosIds.includes(cliente.id);

    return (
      <Pressable
        key={cliente.id}
        onPress={() =>
          setAlumnosRutinaSeleccionadosIds((seleccionados) =>
            seleccionados.includes(cliente.id)
              ? seleccionados.filter((id) => id !== cliente.id)
              : [...seleccionados, cliente.id],
          )
        }
      >
        <PremiumCard
          theme={clienteHomeTheme}
          style={[
            styles.trainerRoutineStudentCard,
            seleccionado && {
              borderColor: colorPrimarioVisibleApp,
              backgroundColor: mezclarColores(
                colorPrimarioVisibleApp,
                clienteHomeTheme.surface,
                0.9,
              ),
            },
          ]}
        >
          <PremiumAvatar
            uri={resolverUrlMedia(cliente.fotoPerfilUrl)}
            initials={obtenerIniciales(cliente.nombre)}
            size={42}
            theme={clienteHomeTheme}
          />
          <View style={styles.trainerRoutineStudentCopy}>
            <Text
              style={[styles.trainerRoutineStudentName, { color: clienteHomeTheme.text }]}
              numberOfLines={1}
            >
              {cliente.nombre}
            </Text>
            <Text
              style={[styles.trainerRoutineStudentMeta, { color: clienteHomeTheme.muted }]}
              numberOfLines={1}
            >
              {cliente.email || "Cliente activo"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={seleccionado ? "check-circle" : "circle-outline"}
            size={24}
            color={seleccionado ? colorPrimarioVisibleApp : clienteHomeTheme.muted}
          />
        </PremiumCard>
      </Pressable>
    );
  }

  function enfocarCampoRutina(target?: number | null) {
    if (keyboardScrollTimeoutRef.current) {
      clearTimeout(keyboardScrollTimeoutRef.current);
    }

    const screenKeyAtFocus = authenticatedScreenKey;
    keyboardScrollTimeoutRef.current = setTimeout(() => {
      keyboardScrollTimeoutRef.current = null;

      if (authenticatedScreenKeyRef.current !== screenKeyAtFocus) {
        return;
      }

      const responder = (authenticatedScrollRef.current as any)?.getScrollResponder?.();

      if (target && responder?.scrollResponderScrollNativeHandleToKeyboard) {
        responder.scrollResponderScrollNativeHandleToKeyboard(
          target,
          Math.max(insets.bottom, 18) + 96,
          true,
        );
      }
    }, Platform.OS === "ios" ? 120 : 80);
  }

  function renderRutinaTextInput({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    error,
    unit,
    multiline = false,
    keyboardType,
    autoCapitalize,
    returnKeyType,
    compact = false,
  }: {
    label: string;
    icon: IconName;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    error?: string;
    unit?: string;
    multiline?: boolean;
    keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
    autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
    returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
    compact?: boolean;
  }) {
    return (
      <View style={[styles.trainerRoutineInputGroup, compact && styles.trainerRoutineInputGroupCompact]}>
        <Text style={[styles.trainerRoutineInputLabel, { color: clienteHomeTheme.text }]}>
          {label}
        </Text>
        <View
          style={[
            styles.trainerRoutineInputShell,
            compact && styles.trainerRoutineInputShellCompact,
            multiline && styles.trainerRoutineTextAreaShell,
            {
              backgroundColor: clienteHomeTheme.surfaceSoft,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={compact ? 17 : 19}
            color={colorSecundarioVisibleApp}
            style={styles.trainerRoutineInputIcon}
          />
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChangeText(text);
              if (feedbackRutinasEntrenador?.tipo === "error") {
                setFeedbackRutinasEntrenador(null);
              }
            }}
            placeholder={placeholder}
            placeholderTextColor={clienteHomeTheme.muted}
            style={[
              styles.trainerRoutineInput,
              compact && styles.trainerRoutineInputCompact,
              !!unit && !multiline && styles.trainerRoutineInputWithUnit,
              multiline && styles.trainerRoutineTextArea,
              { color: clienteHomeTheme.text },
            ]}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            onFocus={(event) =>
              enfocarCampoRutina(findNodeHandle(event.target as any))
            }
          />
          {!!unit && !multiline && (
            <Text
              style={[styles.trainerRoutineInputUnit, { color: clienteHomeTheme.muted }]}
              numberOfLines={1}
            >
              {unit}
            </Text>
          )}
        </View>
        {!!error && (
          <Text style={styles.trainerRoutineInputError}>{error}</Text>
        )}
      </View>
    );
  }

  function renderEntrenadorRutinasFeedback() {
    if (!feedbackRutinasEntrenador) {
      return null;
    }

    const success = feedbackRutinasEntrenador.tipo === "success";
    const color = success ? "#16A34A" : "#DC2626";
    const background = success ? "#ECFDF5" : "#FEF2F2";
    const border = success ? "#BBF7D0" : "#FECACA";

    return (
      <View
        style={[
          styles.trainerRoutineFeedback,
          { backgroundColor: background, borderColor: border },
        ]}
      >
        <MaterialCommunityIcons
          name={success ? "check-circle-outline" : "alert-circle-outline"}
          size={19}
          color={color}
        />
        <Text style={[styles.trainerRoutineFeedbackText, { color }]}>
          {feedbackRutinasEntrenador.texto}
        </Text>
        <Pressable onPress={() => setFeedbackRutinasEntrenador(null)}>
          <MaterialCommunityIcons name="close" size={17} color={color} />
        </Pressable>
      </View>
    );
  }

  function obtenerEjerciciosRutinaOrdenados(rutina: RutinaApp) {
    return [...(rutina.ejercicios || [])].sort(
      (a, b) => (a.orden || 0) - (b.orden || 0),
    );
  }

  function obtenerPrimeraImagenRutina(rutina: RutinaApp) {
    const ejercicioConImagen = obtenerEjerciciosRutinaOrdenados(rutina).find(
      (item) =>
        item.ejercicio?.tipoMultimedia === "IMAGEN" &&
        Boolean(resolverUrlMedia(item.ejercicio?.multimediaUrl)),
    );

    return resolverUrlMedia(ejercicioConImagen?.ejercicio?.multimediaUrl);
  }

  function obtenerMetaEjercicioRutinaCliente(
    item: RutinaEjercicioApp,
    opciones: { incluirDescanso?: boolean } = {},
  ) {
    const incluirDescanso = opciones.incluirDescanso !== false;
    const repeticiones = item.repeticiones?.trim();
    const detallePrincipal =
      item.series != null && item.series > 0 && repeticiones
        ? `${item.series} × ${repeticiones}`
        : repeticiones || (item.series != null && item.series > 0 ? `${item.series} series` : null);

    return [
      detallePrincipal,
      incluirDescanso && item.descansoSegundos != null
        ? `${item.descansoSegundos} s descanso`
        : null,
      item.peso != null && item.peso > 0 ? `${item.peso} kg` : null,
    ].filter(Boolean) as string[];
  }

  function renderClienteRutinaHeader(
    eyebrow: string,
    title: string,
    subtitle: string,
    onBack?: () => void,
  ) {
    return (
      <View style={styles.clientClassesHeader}>
        {!!onBack && (
          <Pressable
            style={[
              styles.clientRoutineBackButton,
              { backgroundColor: clienteHomeTheme.surface, borderColor: clienteHomeTheme.border },
            ]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={clienteHomeTheme.text} />
          </Pressable>
        )}
        <View style={styles.clientClassesHeaderCopy}>
          <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
            {subtitle}
          </Text>
        </View>
        <PremiumAvatar
          uri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
          initials={obtenerIniciales(clienteDemo?.nombre)}
          size={52}
          theme={clienteHomeTheme}
          onPress={() => setSeccionCliente("PERFIL")}
        />
      </View>
    );
  }

  function renderClienteRutinasPremium() {
    if (modoRutinasCliente === "CALCULADORA_1RM") {
      return (
        <OneRepMaxCalculator
          theme={clienteHomeTheme}
          colors={oneRepMaxColors}
          weight={oneRmPesoInput}
          repetitions={oneRmRepeticionesInput}
          showErrors={oneRmMostrarErrores}
          result={oneRmResultado}
          avatarUri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
          avatarInitials={obtenerIniciales(clienteDemo?.nombre)}
          onWeightChange={cambiarPesoOneRm}
          onRepetitionsChange={cambiarRepeticionesOneRm}
          onCalculate={calcularOneRm}
          onClear={limpiarOneRm}
          onBack={() => setModoRutinasCliente("LISTA")}
          onAvatarPress={() => setSeccionCliente("PERFIL")}
          onInputFocus={enfocarCampoRutina}
        />
      );
    }

    if (modoRutinasCliente === "ENTRENAMIENTO") {
      return renderClienteRutinaEntrenamiento();
    }

    if (modoRutinasCliente === "COMPLETADA") {
      return renderClienteRutinaCompletada();
    }

    if (modoRutinasCliente === "DETALLE") {
      return renderClienteRutinaDetalle();
    }

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderClienteRutinaHeader(
          "Entrenamiento",
          "Mis rutinas",
          "Entrenamientos preparados para ti.",
        )}

        <OneRepMaxAccessCard
          theme={clienteHomeTheme}
          secondaryColor={oneRepMaxColors.secondary}
          iconBackgroundColor={oneRepMaxColors.accessIconBackground}
          onPress={() => setModoRutinasCliente("CALCULADORA_1RM")}
        />

        {cargandoRutinasCliente && rutinasClienteActivas.length === 0 ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.clientRoutineLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.trainerHomeLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando tus rutinas...
            </Text>
          </PremiumCard>
        ) : errorRutinasCliente && rutinasClienteActivas.length === 0 ? (
          <PremiumEmptyState
            icon="alert-circle-outline"
            title="No se pudieron cargar"
            text={errorRutinasCliente}
            actionLabel="Reintentar"
            onAction={cargarRutinasCliente}
            theme={clienteHomeTheme}
          />
        ) : rutinasClienteActivas.length === 0 ? (
          <PremiumEmptyState
            icon="arm-flex-outline"
            title="Todavía no tienes rutinas asignadas"
            text="Tu entrenador podrá prepararte un entrenamiento desde GymFlow."
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.clientRoutineList}>
            {rutinasClienteActivas.map((asignacion) =>
              renderClienteRutinaCard(asignacion),
            )}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderClienteRutinaCard(asignacion: RutinaAsignadaApp) {
    const rutina = asignacion.rutina;

    if (!rutina) {
      return null;
    }

    const totalEjercicios = rutina.ejercicios?.length || 0;
    const imagenRutina = obtenerPrimeraImagenRutina(rutina);
    const meta = [
      `${totalEjercicios} ejercicio${totalEjercicios === 1 ? "" : "s"}`,
      rutina.duracionEstimadaMinutos ? `~${rutina.duracionEstimadaMinutos} min` : null,
      asignacion.nombreEntrenador || rutina.nombreCreador
        ? `Con ${asignacion.nombreEntrenador || rutina.nombreCreador}`
        : null,
    ].filter(Boolean);

    return (
      <PremiumCard
        key={asignacion.id}
        theme={clienteHomeTheme}
        style={styles.clientRoutineListCard}
        onPress={() => abrirRutinaCliente(asignacion)}
      >
        {imagenRutina ? (
          <Image source={{ uri: imagenRutina }} style={styles.clientRoutineListThumb} />
        ) : (
          <View
            style={[
              styles.clientRoutineListIcon,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
            ]}
          >
            <MaterialCommunityIcons
              name="arm-flex-outline"
              size={27}
              color={colorPrimarioVisibleApp}
            />
          </View>
        )}

        <View style={styles.clientRoutineListCopy}>
          <View style={styles.clientRoutineListTitleRow}>
            <Text
              style={[styles.clientRoutineListTitle, { color: clienteHomeTheme.text }]}
              numberOfLines={1}
            >
              {rutina.nombre}
            </Text>
            {!!rutina.nivel && (
              <View
                style={[
                  styles.clientRoutineLevelPill,
                  { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
                ]}
              >
                <Text style={[styles.clientRoutineLevelText, { color: colorSecundarioVisibleApp }]}>
                  {rutina.nivel}
                </Text>
              </View>
            )}
          </View>
          {!!rutina.descripcion && (
            <Text
              style={[styles.clientRoutineListDescription, { color: clienteHomeTheme.muted }]}
              numberOfLines={2}
            >
              {rutina.descripcion}
            </Text>
          )}
          <Text
            style={[styles.clientRoutineListMeta, { color: colorSecundarioVisibleApp }]}
            numberOfLines={2}
          >
            {meta.join(" · ")}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={clienteHomeTheme.muted} />
      </PremiumCard>
    );
  }

  function renderClienteRutinaDetalle() {
    if (!rutinaClienteSeleccionada) {
      return (
        <PremiumScreenContainer theme={clienteHomeTheme}>
          {renderClienteRutinaHeader(
            "Entrenamiento",
            "Mis rutinas",
            "Entrenamientos preparados para ti.",
          )}
          <PremiumEmptyState
            icon="arm-flex-outline"
            title="Selecciona una rutina"
            text="Vuelve a Mis rutinas para abrir un entrenamiento asignado."
            actionLabel="Ver mis rutinas"
            onAction={() => {
              setModoRutinasCliente("LISTA");
              setRutinaClienteSeleccionadaId(null);
            }}
            theme={clienteHomeTheme}
          />
        </PremiumScreenContainer>
      );
    }

    const ejercicios = ejerciciosRutinaClienteSeleccionada;
    const imagenRutina = obtenerPrimeraImagenRutina(rutinaClienteSeleccionada);
    const entrenador =
      asignacionRutinaClienteSeleccionada?.nombreEntrenador ||
      rutinaClienteSeleccionada.nombreCreador;

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderClienteRutinaHeader(
          "Entrenamiento",
          "Rutina",
          "Consulta tus ejercicios y empieza cuando estés lista.",
          () => {
            setModoRutinasCliente("LISTA");
            setRutinaClienteSeleccionadaId(null);
          },
        )}

        <PremiumCard theme={clienteHomeTheme} style={styles.clientRoutineDetailCard}>
          <View style={styles.clientRoutineDetailTop}>
            {imagenRutina ? (
              <Image source={{ uri: imagenRutina }} style={styles.clientRoutineDetailThumb} />
            ) : (
              <View
                style={[
                  styles.clientRoutineDetailIcon,
                  { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
                ]}
              >
                <MaterialCommunityIcons
                  name="arm-flex-outline"
                  size={34}
                  color={colorPrimarioVisibleApp}
                />
              </View>
            )}
            <View style={styles.clientRoutineDetailCopy}>
              <Text style={[styles.clientRoutineDetailTitle, { color: clienteHomeTheme.text }]}>
                {rutinaClienteSeleccionada.nombre}
              </Text>
              {!!rutinaClienteSeleccionada.descripcion && (
                <Text style={[styles.clientRoutineDetailText, { color: clienteHomeTheme.muted }]}>
                  {rutinaClienteSeleccionada.descripcion}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.clientRoutineDetailChips}>
            {!!rutinaClienteSeleccionada.nivel && (
              <View style={[styles.clientRoutineChip, { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") }]}>
                <Text style={[styles.clientRoutineChipText, { color: colorSecundarioVisibleApp }]}>
                  {rutinaClienteSeleccionada.nivel}
                </Text>
              </View>
            )}
            {!!rutinaClienteSeleccionada.duracionEstimadaMinutos && (
              <View style={[styles.clientRoutineChip, { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") }]}>
                <Text style={[styles.clientRoutineChipText, { color: colorPrimarioVisibleApp }]}>
                  ~{rutinaClienteSeleccionada.duracionEstimadaMinutos} min
                </Text>
              </View>
            )}
            {!!entrenador && (
              <View style={[styles.clientRoutineChip, { backgroundColor: clienteHomeTheme.surfaceSoft }]}>
                <Text style={[styles.clientRoutineChipText, { color: clienteHomeTheme.text }]}>
                  Con {entrenador}
                </Text>
              </View>
            )}
          </View>

          <PremiumPrimaryButton
            label="Empezar rutina"
            icon="play-circle-outline"
            theme={clienteHomeTheme}
            onPress={() => empezarEntrenamientoCliente(rutinaClienteSeleccionada)}
            disabled={ejercicios.length === 0}
          />
        </PremiumCard>

        <PremiumSectionHeader title="Ejercicios" theme={clienteHomeTheme} />

        {ejercicios.length === 0 ? (
          <PremiumEmptyState
            icon="playlist-remove"
            title="Rutina sin ejercicios"
            text="Tu entrenador todavía no ha añadido ejercicios a esta rutina."
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.clientRoutineExerciseList}>
            {ejercicios.map((item, index) =>
              renderClienteRutinaEjercicioCard(item, index),
            )}
          </View>
        )}
      </PremiumScreenContainer>
    );
  }

  function renderClienteRutinaEjercicioCard(item: RutinaEjercicioApp, index: number) {
    const ejercicio = item.ejercicio;
    const mediaUri = resolverUrlMedia(ejercicio?.multimediaUrl);
    const nombreEjercicio = ejercicio?.nombre || "Ejercicio";
    const tieneImagen = ejercicio?.tipoMultimedia === "IMAGEN" && Boolean(mediaUri);
    const tieneVideo = ejercicio?.tipoMultimedia === "VIDEO" && Boolean(mediaUri);
    const thumbnailVideo = mediaUri ? thumbnailsVideoRutina[mediaUri] : null;
    const meta = obtenerMetaEjercicioRutinaCliente(item);

    return (
      <PremiumCard key={item.id} theme={clienteHomeTheme} style={styles.clientRoutineExerciseCard}>
        <View
          style={[
            styles.clientRoutineExerciseOrder,
            { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
          ]}
        >
          <Text style={[styles.clientRoutineExerciseOrderText, { color: colorPrimarioVisibleApp }]}>
            {index + 1}
          </Text>
        </View>

        {tieneImagen && mediaUri && (
          <Pressable
            style={styles.clientRoutineExerciseMedia}
            onPress={() => abrirMultimediaRutina("IMAGEN", mediaUri, nombreEjercicio)}
            accessibilityRole="button"
            accessibilityLabel={`Ver imagen de ${nombreEjercicio}`}
          >
            <Image source={{ uri: mediaUri }} style={styles.clientRoutineExerciseImage} />
          </Pressable>
        )}
        {tieneVideo && mediaUri && (
          <Pressable
            style={[
              styles.clientRoutineExerciseMedia,
              styles.clientRoutineExerciseVideo,
              { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
            ]}
            onPress={() => abrirMultimediaRutina("VIDEO", mediaUri, nombreEjercicio)}
            accessibilityRole="button"
            accessibilityLabel={`Reproducir vídeo de ${nombreEjercicio}`}
          >
            {thumbnailVideo ? (
              <Image
                source={{ uri: thumbnailVideo }}
                style={styles.clientRoutineExerciseImage}
              />
            ) : (
              <MaterialCommunityIcons name="play" size={20} color={colorSecundarioVisibleApp} />
            )}
            {!!thumbnailVideo && (
              <View style={styles.clientRoutineExercisePlayOverlay}>
                <MaterialCommunityIcons name="play" size={15} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        )}

        <View style={styles.clientRoutineExerciseCopy}>
          <Text style={[styles.clientRoutineExerciseTitle, { color: clienteHomeTheme.text }]} numberOfLines={2}>
            {nombreEjercicio}
          </Text>
          {meta.length > 0 && (
            <Text style={[styles.clientRoutineExerciseMeta, { color: clienteHomeTheme.muted }]} numberOfLines={2}>
              {meta.join(" · ")}
            </Text>
          )}
          {!!item.notas?.trim() && (
            <Text style={[styles.clientRoutineExerciseNotes, { color: clienteHomeTheme.text }]} numberOfLines={3}>
              {item.notas.trim()}
            </Text>
          )}
        </View>
      </PremiumCard>
    );
  }

  function renderClienteRutinaEntrenamiento() {
    if (!rutinaClienteSeleccionada || !ejercicioEntrenamientoCliente) {
      return (
        <PremiumScreenContainer theme={clienteHomeTheme}>
          {renderClienteRutinaHeader(
            "Entrenamiento",
            "Rutina",
            "No hay ejercicios disponibles para esta sesión.",
            () => setModoRutinasCliente("DETALLE"),
          )}
          <PremiumEmptyState
            icon="playlist-remove"
            title="Rutina sin ejercicios"
            text="Tu entrenador todavía no ha añadido ejercicios a esta rutina."
            theme={clienteHomeTheme}
          />
        </PremiumScreenContainer>
      );
    }

    const ejercicio = ejercicioEntrenamientoCliente.ejercicio;
    const mediaUri = resolverUrlMedia(ejercicio?.multimediaUrl);
    const nombreEjercicio = ejercicio?.nombre || "Ejercicio";
    const tieneImagen = ejercicio?.tipoMultimedia === "IMAGEN" && Boolean(mediaUri);
    const tieneVideo = ejercicio?.tipoMultimedia === "VIDEO" && Boolean(mediaUri);
    const thumbnailVideo = mediaUri ? thumbnailsVideoRutina[mediaUri] : null;
    const meta = obtenerMetaEjercicioRutinaCliente(ejercicioEntrenamientoCliente, {
      incluirDescanso: false,
    });
    const completado = entrenamientoClienteCompletadosIds.includes(
      ejercicioEntrenamientoCliente.id,
    );
    const esUltimoEjercicio =
      entrenamientoClienteIndice >= totalEjerciciosEntrenamientoCliente - 1;
    const puedeFinalizarRutina = esUltimoEjercicio && completado;
    const progreso =
      totalEjerciciosEntrenamientoCliente > 0
        ? (entrenamientoClienteIndice + 1) / totalEjerciciosEntrenamientoCliente
        : 0;

    return (
      <PremiumScreenContainer theme={clienteHomeTheme} style={styles.clientWorkoutScreen}>
        {renderClienteRutinaHeader(
          "Entrenamiento",
          rutinaClienteSeleccionada.nombre,
          `Ejercicio ${entrenamientoClienteIndice + 1} de ${totalEjerciciosEntrenamientoCliente}`,
          confirmarSalidaEntrenamientoCliente,
        )}

        <View style={styles.clientWorkoutProgressTrack}>
          <View
            style={[
              styles.clientWorkoutProgressFill,
              {
                width: `${Math.round(progreso * 100)}%` as `${number}%`,
                backgroundColor: colorPrimarioVisibleApp,
              },
            ]}
          />
        </View>

        <PremiumCard theme={clienteHomeTheme} style={styles.clientWorkoutCard}>
          {(tieneImagen || tieneVideo) && mediaUri && (
            <Pressable
              style={[
                styles.clientWorkoutMedia,
                tieneVideo && { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "14") },
              ]}
              onPress={() =>
                abrirMultimediaRutina(tieneVideo ? "VIDEO" : "IMAGEN", mediaUri, nombreEjercicio)
              }
              accessibilityRole="button"
              accessibilityLabel={
                tieneVideo
                  ? `Reproducir vídeo de ${nombreEjercicio}`
                  : `Ver imagen de ${nombreEjercicio}`
              }
            >
              {tieneImagen ? (
                <Image source={{ uri: mediaUri }} style={styles.clientWorkoutImage} />
              ) : thumbnailVideo ? (
                <>
                  <Image source={{ uri: thumbnailVideo }} style={styles.clientWorkoutImage} />
                  <View style={styles.clientWorkoutPlayOverlay}>
                    <MaterialCommunityIcons name="play" size={34} color="#FFFFFF" />
                  </View>
                </>
              ) : (
                <View style={styles.clientWorkoutVideoPlaceholder}>
                  <MaterialCommunityIcons
                    name="play-circle"
                    size={52}
                    color={colorSecundarioVisibleApp}
                  />
                  <Text style={[styles.clientWorkoutVideoText, { color: colorSecundarioVisibleApp }]}>
                    Ver vídeo
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          <View style={styles.clientWorkoutTitleRow}>
            <View style={styles.clientWorkoutCopy}>
              <Text style={[styles.clientWorkoutTitle, { color: clienteHomeTheme.text }]}>
                {nombreEjercicio}
              </Text>
              {meta.length > 0 && (
                <Text style={[styles.clientWorkoutMeta, { color: clienteHomeTheme.muted }]}>
                  {meta.join(" · ")}
                </Text>
              )}
            </View>
          </View>

          {!!ejercicioEntrenamientoCliente.notas?.trim() && (
            <View
              style={[
                styles.clientWorkoutNotes,
                { backgroundColor: clienteHomeTheme.surfaceSoft },
              ]}
            >
              <MaterialCommunityIcons
                name="note-text-outline"
                size={18}
                color={colorSecundarioVisibleApp}
              />
              <Text style={[styles.clientWorkoutNotesText, { color: clienteHomeTheme.text }]}>
                {ejercicioEntrenamientoCliente.notas.trim()}
              </Text>
            </View>
          )}

          {ejercicioEntrenamientoCliente.descansoSegundos != null && (
            <View
              style={[
                styles.clientWorkoutRestPill,
                { backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12") },
              ]}
            >
              <MaterialCommunityIcons
                name="timer-outline"
                size={18}
                color={colorSecundarioVisibleApp}
              />
              <Text style={[styles.clientWorkoutRestText, { color: colorSecundarioVisibleApp }]}>
                Descanso: {ejercicioEntrenamientoCliente.descansoSegundos} s
              </Text>
            </View>
          )}
        </PremiumCard>

        <Pressable
          style={[
            styles.clientWorkoutCompleteButton,
            completado
              ? {
                  backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "16"),
                  borderColor: colorConAlpha(colorPrimarioVisibleApp, "40"),
                }
              : {
                  backgroundColor: colorPrimarioVisibleApp,
                  borderColor: colorPrimarioVisibleApp,
                },
          ]}
          onPress={() => toggleEjercicioEntrenamientoCliente(ejercicioEntrenamientoCliente.id)}
          accessibilityRole="button"
          accessibilityLabel={completado ? "Desmarcar ejercicio completado" : "Completar ejercicio"}
        >
          <MaterialCommunityIcons
            name={completado ? "check-circle" : "check-circle-outline"}
            size={22}
            color={completado ? colorPrimarioVisibleApp : clienteHomeTheme.textOnPrimary}
          />
          <Text
            style={[
              styles.clientWorkoutCompleteText,
              {
                color: completado
                  ? colorPrimarioVisibleApp
                  : clienteHomeTheme.textOnPrimary,
              },
            ]}
          >
            {completado ? "Completado" : "Completar ejercicio"}
          </Text>
        </Pressable>

        <View style={styles.clientWorkoutNavigationRow}>
          <PremiumSecondaryButton
            label="Anterior"
            icon="chevron-left"
            theme={clienteHomeTheme}
            onPress={() =>
              setEntrenamientoClienteIndice((indice) => Math.max(0, indice - 1))
            }
            disabled={entrenamientoClienteIndice === 0}
            style={styles.clientWorkoutNavButton}
          />
          <PremiumSecondaryButton
            label="Siguiente"
            icon="chevron-right"
            theme={clienteHomeTheme}
            onPress={() =>
              setEntrenamientoClienteIndice((indice) =>
                Math.min(totalEjerciciosEntrenamientoCliente - 1, indice + 1),
              )
            }
            disabled={esUltimoEjercicio}
            style={styles.clientWorkoutNavButton}
          />
        </View>

        {puedeFinalizarRutina && (
          <PremiumSecondaryButton
            label="Finalizar rutina"
            icon="flag-checkered"
            theme={clienteHomeTheme}
            onPress={finalizarEntrenamientoCliente}
            style={styles.clientWorkoutFinishButton}
          />
        )}
      </PremiumScreenContainer>
    );
  }

  function renderClienteRutinaCompletada() {
    const totalEjercicios = totalEjerciciosEntrenamientoCliente;
    const completados = totalCompletadosEntrenamientoCliente;

    return (
      <PremiumScreenContainer
        theme={clienteHomeTheme}
        style={[
          styles.clientWorkoutCompletedScreen,
          {
            minHeight: Math.max(
              360,
              windowHeight - bottomDockHeight - Math.max(insets.top, 18) - 90,
            ),
          },
        ]}
      >
        <PremiumCard theme={clienteHomeTheme} style={styles.clientWorkoutCompletedCard}>
          <View
            style={[
              styles.clientWorkoutCompletedIcon,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "16") },
            ]}
          >
            <MaterialCommunityIcons
              name="check-bold"
              size={34}
              color={colorPrimarioVisibleApp}
            />
          </View>
          <Text style={[styles.clientWorkoutCompletedTitle, { color: clienteHomeTheme.text }]}>
            Rutina completada
          </Text>
          <Text style={[styles.clientWorkoutCompletedText, { color: clienteHomeTheme.muted }]}>
            {rutinaClienteSeleccionada?.nombre || "Entrenamiento"} · {completados} de {totalEjercicios} ejercicios completados.
          </Text>
          <PremiumPrimaryButton
            label="Volver a Mis rutinas"
            icon="arm-flex-outline"
            theme={clienteHomeTheme}
            onPress={() => {
              setModoRutinasCliente("LISTA");
              setRutinaClienteSeleccionadaId(null);
              setEntrenamientoClienteIndice(0);
              setEntrenamientoClienteCompletadosIds([]);
            }}
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function InicioClientePremium() {
    const nombreCliente = clienteDemo?.nombre?.split(" ")[0] || "Cliente";
    const reservasActivasCliente = reservasCliente.filter(
      (reserva) => reserva.estado === "RESERVADA",
    );
    const proximasReservasCliente = agendaInicioCliente.length;
    const tieneProximaClase = Boolean(
      proximaReservaCliente && claseProximaReservaCliente,
    );
    const imagenProximaClase = resolverUrlMedia(claseProximaReservaCliente?.imagenUrl);
    const totalRutinasCliente = rutinasClienteActivas.length;
    const asignacionRutinaInicio =
      totalRutinasCliente === 1 ? rutinasClienteActivas[0] : null;
    const rutinaInicio = asignacionRutinaInicio?.rutina || null;
    const imagenRutinaInicio = rutinaInicio
      ? obtenerPrimeraImagenRutina(rutinaInicio)
      : null;
    const totalEjerciciosRutinaInicio = rutinaInicio?.ejercicios?.length || 0;
    const tituloRutinaInicio = cargandoRutinasCliente
      ? "Cargando rutinas"
      : errorRutinasCliente
        ? "Rutinas no disponibles"
        : totalRutinasCliente === 0
          ? "Sin rutinas asignadas"
          : rutinaInicio
            ? rutinaInicio.nombre
            : "Mis rutinas";
    const textoRutinaInicio = cargandoRutinasCliente
      ? "Estamos revisando tus entrenamientos asignados."
      : errorRutinasCliente
        ? "No se pudieron cargar tus rutinas ahora mismo."
        : totalRutinasCliente === 0
          ? "Tu entrenador podrá prepararte un entrenamiento desde GymFlow."
          : rutinaInicio
            ? rutinaInicio.descripcion ||
              "Entrenamiento preparado para seguir a tu ritmo."
            : `${totalRutinasCliente} entrenamientos preparados para ti.`;
    const chipsRutinaInicio = rutinaInicio
      ? [
          `${totalEjerciciosRutinaInicio} ejercicio${totalEjerciciosRutinaInicio === 1 ? "" : "s"}`,
          rutinaInicio.duracionEstimadaMinutos
            ? `~${rutinaInicio.duracionEstimadaMinutos} min`
            : null,
          rutinaInicio.nivel || null,
        ].filter(Boolean)
      : totalRutinasCliente > 1
        ? [`${totalRutinasCliente} rutinas`, "Ver mis rutinas"]
        : [];

    return (
      <PremiumScreenContainer
        theme={clienteHomeTheme}
      >
        <DashboardHeroBackground imageUri={dashboardBackgroundUri} theme={clienteHomeTheme}>
          <View style={styles.clientHomeHeader}>
            <View style={styles.clientHomeHeaderCopy}>
              <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
                {nombreGimnasioApp}
              </Text>
              <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
                Hola, {nombreCliente}
              </Text>
              <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
                {bienvenidaGimnasioApp}
              </Text>
            </View>
            <PremiumAvatar
              uri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
              initials={obtenerIniciales(clienteDemo?.nombre)}
              size={52}
              theme={clienteHomeTheme}
              onPress={() => setSeccionCliente("PERFIL")}
            />
          </View>
        </DashboardHeroBackground>

        {tieneProximaClase && claseProximaReservaCliente ? (
          <>
            <PremiumClassCard
              title={
                proximaReservaCliente?.nombreClase ||
                claseProximaReservaCliente.nombre ||
                "Clase reservada"
              }
              subtitle={
                claseProximaReservaCliente.descripcion ||
                "Tu entrenamiento ya está preparado."
              }
              imageUri={imagenProximaClase}
              eyebrow="Tu próxima reserva"
              statusLabel="Próxima clase"
              theme={clienteHomeTheme}
              meta={[
                {
                  icon: "calendar-month-outline",
                  label: formatearDia(claseProximaReservaCliente.fechaHora),
                },
                {
                  icon: "clock-outline",
                  label: obtenerHora(claseProximaReservaCliente.fechaHora),
                },
                ...(claseProximaReservaCliente.nombreEntrenador
                  ? [
                      {
                        icon: "account-tie-outline" as IconName,
                        label: claseProximaReservaCliente.nombreEntrenador,
                      },
                    ]
                  : []),
              ]}
              actionLabel="Ver mi reserva"
              onAction={() => setSeccionCliente("RESERVAS")}
            />

            <View style={styles.clientHomeActionRow}>
              <PremiumPrimaryButton
                label="Reservar clase"
                icon="calendar-plus"
                theme={clienteHomeTheme}
                onPress={() => setSeccionCliente("CLASES")}
                style={styles.clientHomeMainButton}
              />
              <PremiumSecondaryButton
                label="Mi agenda"
                icon="clipboard-check-outline"
                theme={clienteHomeTheme}
                onPress={() => setSeccionCliente("RESERVAS")}
                style={styles.clientHomeSecondaryButton}
              />
            </View>
          </>
        ) : (
          <PremiumEmptyState
            icon="calendar-plus"
            title="Reserva tu próxima clase"
            text="Explora la agenda del gimnasio y elige el horario que mejor encaje contigo."
            actionLabel="Explorar clases"
            onAction={() => setSeccionCliente("CLASES")}
            theme={clienteHomeTheme}
          />
        )}

        <View style={styles.clientHomeMetricsRow}>
          <PremiumMetricCard
            icon="bookmark-check-outline"
            label="Reservas activas"
            value={reservasActivasCliente.length || proximasReservasCliente}
            theme={clienteHomeTheme}
          />
          <PremiumMetricCard
            icon="message-text-outline"
            label="Mensajes nuevos"
            value={mensajesNoLeidosBadge}
            theme={clienteHomeTheme}
            accent="secondary"
          />
        </View>

        <PremiumSectionHeader
          title="Entrenamiento"
          actionLabel={totalRutinasCliente > 0 ? "Ver rutinas" : undefined}
          onAction={() => setSeccionCliente("RUTINAS")}
          theme={clienteHomeTheme}
        />

        <PremiumCard
          theme={clienteHomeTheme}
          style={styles.clientRoutineCard}
          onPress={
            asignacionRutinaInicio
              ? () => abrirRutinaCliente(asignacionRutinaInicio)
              : totalRutinasCliente > 1
                ? () => setSeccionCliente("RUTINAS")
                : undefined
          }
        >
          {imagenRutinaInicio ? (
            <Image source={{ uri: imagenRutinaInicio }} style={styles.clientRoutineHomeThumb} />
          ) : (
            <View
              style={[
                styles.clientRoutineIcon,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
              ]}
            >
              <MaterialCommunityIcons
                name="arm-flex-outline"
                size={28}
                color={colorPrimarioVisibleApp}
              />
            </View>
          )}
          <View style={styles.clientRoutineCopy}>
            <Text style={[styles.clientRoutineTitle, { color: clienteHomeTheme.text }]}>
              {tituloRutinaInicio}
            </Text>
            <Text style={[styles.clientRoutineText, { color: clienteHomeTheme.muted }]}>
              {textoRutinaInicio}
            </Text>
            {chipsRutinaInicio.length > 0 && (
              <View style={styles.clientRoutineChips}>
                {chipsRutinaInicio.map((chip, index) => (
                  <View
                    key={String(chip)}
                    style={[
                      styles.clientRoutineChip,
                      {
                        backgroundColor: colorConAlpha(
                          index % 2 === 0
                            ? colorSecundarioVisibleApp
                            : colorPrimarioVisibleApp,
                          "12",
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clientRoutineChipText,
                        {
                          color:
                            index % 2 === 0
                              ? colorSecundarioVisibleApp
                              : colorPrimarioVisibleApp,
                        },
                      ]}
                    >
                      {chip}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          {totalRutinasCliente > 0 && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={clienteHomeTheme.muted}
            />
          )}
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function ClienteClasesPremium() {
    const mostrarFiltros = tiposClasesCliente.length > 1;
    const fechaActivaTexto = diaClasesClienteActivo
      ? formatearFechaCompleta(`${diaClasesClienteActivo}T00:00:00`)
      : "Sin clases";

    if (claseClienteSeleccionada) {
      return <ClienteClaseDetalle clase={claseClienteSeleccionada} />;
    }

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.clientClassesHeader}>
          <View style={styles.clientClassesHeaderCopy}>
            <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
              Agenda
            </Text>
            <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
              Clases
            </Text>
            <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
              Elige día, revisa horarios y reserva en un toque.
            </Text>
          </View>
          <PremiumAvatar
            uri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
            initials={obtenerIniciales(clienteDemo?.nombre)}
            size={52}
            theme={clienteHomeTheme}
            onPress={() => setSeccionCliente("PERFIL")}
          />
        </View>

        {cargando && clasesActivasGimnasio.length === 0 ? (
          <PremiumCard theme={clienteHomeTheme} style={styles.trainerHomeLoadingCard}>
            <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            <Text style={[styles.trainerHomeLoadingText, { color: clienteHomeTheme.muted }]}>
              Cargando clases...
            </Text>
          </PremiumCard>
        ) : error && clasesActivasGimnasio.length === 0 ? (
          <PremiumEmptyState
            icon="wifi-alert"
            title="No se pudieron cargar las clases"
            text={error}
            actionLabel="Reintentar"
            onAction={() => cargarDatos(false)}
            theme={clienteHomeTheme}
          />
        ) : clasesActivasGimnasio.length === 0 ? (
          <PremiumEmptyState
            icon="calendar-search"
            title="No hay clases disponibles"
            text="Cuando el gimnasio publique clases activas, podrás verlas y reservar desde aquí."
            theme={clienteHomeTheme}
          />
        ) : (
          <>
            <View style={styles.clientClassWeekHeader}>
              <View style={styles.clientClassWeekCopy}>
                <Text style={[styles.clientClassWeekLabel, { color: clienteHomeTheme.muted }]}>
                  Semana
                </Text>
                <Text style={[styles.clientClassWeekRange, { color: clienteHomeTheme.text }]}>
                  {rangoSemanaClases}
                </Text>
              </View>
              <View style={styles.clientClassWeekControls}>
                <Pressable
                  style={[
                    styles.clientClassWeekButton,
                    {
                      backgroundColor: clienteHomeTheme.surface,
                      borderColor: clienteHomeTheme.border,
                    },
                    semanaClasesOffset === 0 && styles.clientClassWeekButtonDisabled,
                  ]}
                  disabled={semanaClasesOffset === 0}
                  onPress={() => {
                    const nuevoOffset = Math.max(0, semanaClasesOffset - 1);
                    const nuevoInicio = sumarDiasFechaLocal(
                      lunesSemanaActual,
                      nuevoOffset * 7,
                    );
                    setSemanaClasesOffset(nuevoOffset);
                    setDiaSeleccionado(
                      nuevoOffset === 0
                        ? hoyClasesClienteKey
                        : crearFechaKeyLocal(nuevoInicio),
                    );
                    setClaseClienteSeleccionadaId(null);
                    setReservaConfirmada(null);
                    setErrorReservaCliente("");
                  }}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={22}
                    color={clienteHomeTheme.muted}
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.clientClassWeekButton,
                    {
                      backgroundColor: clienteHomeTheme.surface,
                      borderColor: clienteHomeTheme.border,
                    },
                  ]}
                  onPress={() => {
                    const nuevoOffset = semanaClasesOffset + 1;
                    const nuevoInicio = sumarDiasFechaLocal(
                      lunesSemanaActual,
                      nuevoOffset * 7,
                    );
                    setSemanaClasesOffset(nuevoOffset);
                    setDiaSeleccionado(crearFechaKeyLocal(nuevoInicio));
                    setClaseClienteSeleccionadaId(null);
                    setReservaConfirmada(null);
                    setErrorReservaCliente("");
                  }}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={colorPrimarioVisibleApp}
                  />
                </Pressable>
              </View>
            </View>

            <PremiumDaySelector
              days={diasClasesClienteItems}
              activeDay={diaClasesClienteActivo}
              weekKey={crearFechaKeyLocal(inicioSemanaClasesCliente)}
              theme={clienteHomeTheme}
              onSelect={(dia) => {
                setDiaSeleccionado(dia);
                setClaseClienteSeleccionadaId(null);
                setReservaConfirmada(null);
                setErrorReservaCliente("");
              }}
            />

            {mostrarFiltros && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.clientClassFilterList}
              >
                <PremiumFilterChip
                  label="Todas"
                  active={!actividadSeleccionada}
                  theme={clienteHomeTheme}
                  onPress={() => {
                    setActividadSeleccionada(null);
                    setClaseClienteSeleccionadaId(null);
                    setReservaConfirmada(null);
                    setErrorReservaCliente("");
                  }}
                />
                {tiposClasesCliente.map((tipoClase) => (
                  <PremiumFilterChip
                    key={tipoClase}
                    label={tipoClase}
                    active={actividadSeleccionada === tipoClase}
                    theme={clienteHomeTheme}
                    onPress={() => {
                      setActividadSeleccionada(tipoClase);
                      setClaseClienteSeleccionadaId(null);
                      setReservaConfirmada(null);
                      setErrorReservaCliente("");
                    }}
                  />
                ))}
              </ScrollView>
            )}

            {reservaConfirmada && <ClienteReservaFeedback tipo="success" />}
            {!!errorReservaCliente && <ClienteReservaFeedback tipo="error" />}

            <PremiumSectionHeader
              title={fechaActivaTexto}
              actionLabel={
                actividadSeleccionada ? "Quitar filtro" : undefined
              }
              onAction={
                actividadSeleccionada
                  ? () => {
                      setActividadSeleccionada(null);
                      setErrorReservaCliente("");
                    }
                  : undefined
              }
              theme={clienteHomeTheme}
            />

            {clasesClienteDeLaSemana.length === 0 ? (
              <PremiumEmptyState
                icon="calendar-blank-outline"
                title="Sin clases esta semana"
                text="No hay sesiones publicadas para esta semana."
                theme={clienteHomeTheme}
              />
            ) : clasesClienteDelDia.length === 0 ? (
              <PremiumEmptyState
                icon="calendar-blank-outline"
                title="Sin clases este día"
                text={
                  actividadSeleccionada
                    ? "No hay horarios de esta clase en el día seleccionado."
                    : "Selecciona otro día para revisar más horarios."
                }
                theme={clienteHomeTheme}
              />
            ) : (
              <View style={styles.clientClassList}>
                {clasesClienteDelDia.map((clase) => (
                  <ClienteClaseAgendaCard key={clase.id} clase={clase} />
                ))}
              </View>
            )}
          </>
        )}
      </PremiumScreenContainer>
    );
  }

  function obtenerEstadoClaseCliente(clase: any) {
    const reservaActiva = obtenerReservaClienteActivaDeClase(clase.id);
    const capacidad = Number(clase.capacidadMaxima) || 0;
    const huecos = Math.max(0, obtenerHuecosDisponibles(clase));

    if (reservaActiva) {
      return {
        key: "RESERVADA",
        label: "Ya reservada",
        color: colorPrimarioVisibleApp,
        backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "16"),
        icon: "check-circle-outline" as IconName,
      };
    }

    if (new Date(clase.fechaHora).getTime() <= Date.now()) {
      return {
        key: "FINALIZADA",
        label: "Finalizada",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        icon: "clock-check-outline" as IconName,
      };
    }

    if (huecos <= 0) {
      return {
        key: "COMPLETA",
        label: "Completa",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        icon: "lock-outline" as IconName,
      };
    }

    if (capacidad > 0 && huecos <= Math.max(2, Math.ceil(capacidad * 0.25))) {
      return {
        key: "POCAS",
        label: "Pocas plazas",
        color: colorPrimarioVisibleApp,
        backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12"),
        icon: "alert-circle-outline" as IconName,
      };
    }

    return {
      key: "DISPONIBLE",
      label: "Disponible",
      color: colorSecundarioVisibleApp,
      backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12"),
      icon: "check-outline" as IconName,
    };
  }

  function ClienteEstadoClasePill({ clase }: { clase: any }) {
    const estado = obtenerEstadoClaseCliente(clase);

    return (
      <View
        style={[
          styles.clientClassStatusPill,
          { backgroundColor: estado.backgroundColor },
        ]}
      >
        <MaterialCommunityIcons name={estado.icon} size={14} color={estado.color} />
        <Text style={[styles.clientClassStatusText, { color: estado.color }]}>
          {estado.label}
        </Text>
      </View>
    );
  }

  function ClienteClaseAgendaCard({ clase }: { clase: any }) {
    const estado = obtenerEstadoClaseCliente(clase);
    const huecos = Math.max(0, obtenerHuecosDisponibles(clase));
    const estaReservada = estado.key === "RESERVADA";
    const estaCompleta = estado.key === "COMPLETA";
    const estaFinalizada = estado.key === "FINALIZADA";
    const reservando = reservaEnProcesoId === clase.id;
    const duracion = Number(clase.duracionMinutos) || 45;
    const accionLabel = estaReservada
      ? "Ver"
      : estaFinalizada
        ? "Finalizada"
      : estaCompleta
        ? "Completa"
        : reservando
          ? "Reservando"
          : "Reservar";

    return (
      <PremiumCard
        theme={clienteHomeTheme}
        style={styles.clientClassAgendaCard}
        onPress={() => {
          setClaseClienteSeleccionadaId(clase.id);
          setErrorReservaCliente("");
        }}
      >
        <View style={styles.clientClassAgendaHeader}>
          <View
            style={[
              styles.clientClassTimeBadge,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <Text style={[styles.clientClassTimeText, { color: colorPrimarioVisibleApp }]}>
              {obtenerHora(clase.fechaHora)}
            </Text>
          </View>
          <View style={styles.clientClassAgendaCopy}>
            <Text style={[styles.clientClassName, { color: clienteHomeTheme.text }]} numberOfLines={1}>
              {clase.nombre}
            </Text>
            <Text style={[styles.clientClassMetaLine, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
              {duracion} min · {clase.nombreEntrenador || "Entrenador por asignar"}
            </Text>
          </View>
          <ClienteEstadoClasePill clase={clase} />
        </View>

        <View style={styles.clientClassAgendaFooter}>
          <View style={styles.clientClassSpaces}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={17}
              color={clienteHomeTheme.muted}
            />
            <Text style={[styles.clientClassSpacesText, { color: clienteHomeTheme.muted }]}>
              {estaCompleta ? "Sin plazas" : `${huecos} plazas disponibles`}
            </Text>
          </View>
          <Pressable
            style={[
              styles.clientClassReserveButton,
              { backgroundColor: colorPrimarioVisibleApp },
              (estaCompleta || reservando) && styles.clientClassReserveButtonDisabled,
              estaReservada && {
                backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12"),
              },
            ]}
            disabled={estaCompleta || estaFinalizada || reservando}
            onPress={() => {
              if (estaReservada) {
                setClaseClienteSeleccionadaId(clase.id);
                return;
              }

              reservarClase(clase.id);
            }}
          >
            {reservando ? (
              <ActivityIndicator size="small" color={colorTextoSobrePrimarioApp} />
            ) : (
              <Text
                style={[
                  styles.clientClassReserveButtonText,
                  {
                    color: estaReservada
                      ? colorPrimarioVisibleApp
                      : colorTextoSobrePrimarioApp,
                  },
                ]}
              >
                {accionLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </PremiumCard>
    );
  }

  function ClienteClaseDetalle({ clase }: { clase: any }) {
    const estado = obtenerEstadoClaseCliente(clase);
    const reservaActiva = obtenerReservaClienteActivaDeClase(clase.id);
    const huecos = Math.max(0, obtenerHuecosDisponibles(clase));
    const estaCompleta = estado.key === "COMPLETA";
    const reservando = reservaEnProcesoId === clase.id;
    const cancelando = reservaActiva
      ? cancelandoReservaId === reservaActiva.id
      : false;
    const duracion = Number(clase.duracionMinutos) || 45;
    const imagenClase = resolverUrlMedia(clase.imagenUrl);

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.clientClassDetailTop}>
          <Pressable
            style={[
              styles.clientClassBackButton,
              { backgroundColor: clienteHomeTheme.surface },
            ]}
            onPress={() => {
              setClaseClienteSeleccionadaId(null);
              setErrorReservaCliente("");
            }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={clienteHomeTheme.text}
            />
          </Pressable>
          <ClienteEstadoClasePill clase={clase} />
        </View>

        {imagenClase ? (
          <ImageBackground
            source={{ uri: imagenClase }}
            style={styles.clientClassDetailHero}
            imageStyle={styles.clientClassDetailHeroImage}
          >
            <View style={styles.clientClassDetailShade} />
            <View style={styles.clientClassDetailHeroCopy}>
              <Text style={styles.clientClassDetailEyebrow}>
                {formatearFechaCompleta(clase.fechaHora)}
              </Text>
              <Text style={styles.clientClassDetailTitle}>{clase.nombre}</Text>
            </View>
          </ImageBackground>
        ) : (
          <ClassMediaPlaceholder
            theme={clienteHomeTheme}
            icon="calendar-clock-outline"
            eyebrow={formatearFechaCompleta(clase.fechaHora)}
            title={clase.nombre}
            style={styles.clientClassDetailHero}
          />
        )}

        {clase.descripcion ? (
          <Text style={[styles.clientClassDetailDescription, { color: clienteHomeTheme.muted }]}>
            {clase.descripcion}
          </Text>
        ) : null}

        <View style={styles.clientClassDetailGrid}>
          <ClienteClaseInfoItem
            icon="clock-outline"
            label="Hora"
            value={`${obtenerHora(clase.fechaHora)} · ${duracion} min`}
          />
          <ClienteClaseInfoItem
            icon="account-tie-outline"
            label="Entrenador"
            value={clase.nombreEntrenador || "Por asignar"}
          />
          <ClienteClaseInfoItem
            icon="account-group-outline"
            label="Plazas"
            value={`${huecos}/${clase.capacidadMaxima || "-"} disponibles`}
          />
          <ClienteClaseInfoItem
            icon="calendar-check-outline"
            label="Estado"
            value={estado.label}
          />
        </View>

        {!!errorReservaCliente && <ClienteReservaFeedback tipo="error" />}

        {reservaActiva ? (
          <Pressable
            style={[
              styles.clientClassCancelButton,
              { borderColor: colorConAlpha(colorPrimarioVisibleApp, "36") },
              cancelando && styles.clientClassReserveButtonDisabled,
            ]}
            disabled={cancelando}
            onPress={() => cancelarReserva(reservaActiva.id)}
          >
            {cancelando ? (
              <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="calendar-remove-outline"
                  size={20}
                  color={colorPrimarioVisibleApp}
                />
                <Text
                  style={[
                    styles.clientClassCancelButtonText,
                    { color: colorPrimarioVisibleApp },
                  ]}
                >
                  Cancelar reserva
                </Text>
              </>
            )}
          </Pressable>
        ) : (
          <PremiumPrimaryButton
            label={
              estaCompleta
                ? "Clase completa"
                : reservando
                  ? "Reservando"
                  : "Reservar clase"
            }
            icon={estaCompleta ? "lock-outline" : "calendar-plus"}
            theme={clienteHomeTheme}
            onPress={() => reservarClase(clase.id)}
            disabled={estaCompleta}
            loading={reservando}
            style={styles.clientClassDetailAction}
          />
        )}
      </PremiumScreenContainer>
    );
  }

  function ClienteClaseInfoItem({
    icon,
    label,
    value,
  }: {
    icon: IconName;
    label: string;
    value: string;
  }) {
    return (
      <PremiumCard theme={clienteHomeTheme} style={styles.clientClassInfoItem}>
        <MaterialCommunityIcons name={icon} size={20} color={colorSecundarioVisibleApp} />
        <Text style={[styles.clientClassInfoLabel, { color: clienteHomeTheme.muted }]}>
          {label}
        </Text>
        <Text style={[styles.clientClassInfoValue, { color: clienteHomeTheme.text }]} numberOfLines={2}>
          {value}
        </Text>
      </PremiumCard>
    );
  }

  function ClienteReservaFeedback({ tipo }: { tipo: "success" | "error" }) {
    const esError = tipo === "error";
    const titulo = esError ? "No se pudo reservar" : "Reserva confirmada";
    const texto = esError
      ? errorReservaCliente
      : `Tienes ${reservaConfirmada?.nombreClase} el ${formatearFechaCompleta(
          reservaConfirmada?.fechaHora,
        )} a las ${obtenerHora(reservaConfirmada?.fechaHora)} con ${
          reservaConfirmada?.nombreEntrenador || "tu entrenador"
        }.`;
    const color = esError ? "#DC2626" : colorSecundarioVisibleApp;
    const feedbackBackgroundColor = esError
      ? "#FEF2F2"
      : mezclarColores(colorSecundarioVisibleApp, clienteHomeTheme.background, 0.82);
    const feedbackBorderColor = esError
      ? "#FECACA"
      : mezclarColores(colorSecundarioVisibleApp, clienteHomeTheme.background, 0.68);

    return (
      <View
        style={[
          styles.clientClassFeedback,
          {
            backgroundColor: feedbackBackgroundColor,
            borderColor: feedbackBorderColor,
          },
        ]}
      >
        <View style={[styles.clientClassFeedbackIcon, { backgroundColor: color }]}>
          <MaterialCommunityIcons
            name={esError ? "alert-circle-outline" : "check"}
            size={22}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.clientClassFeedbackCopy}>
          <Text style={[styles.clientClassFeedbackTitle, { color }]}>
            {titulo}
          </Text>
          <Text style={[styles.clientClassFeedbackText, { color: clienteHomeTheme.text }]}>
            {texto}
          </Text>
        </View>
      </View>
    );
  }

  function ClienteReservasPremium() {
    const reservasMostradas =
      modoReservasCliente === "PROXIMAS"
        ? reservasProximasClienteTodas
        : reservasHistorialCliente;
    const reservaPrincipal = reservasProximasClienteTodas[0];
    const reservasSecundarias = reservasProximasClienteTodas.slice(1);

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.clientReservationsHeader}>
          <View style={styles.clientReservationsHeaderCopy}>
            <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
              Reservas
            </Text>
            <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
              Mis reservas
            </Text>
            <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
              Consulta tus próximas clases y revisa tu historial.
            </Text>
          </View>
          <PremiumAvatar
            uri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
            initials={obtenerIniciales(clienteDemo?.nombre)}
            size={52}
            theme={clienteHomeTheme}
            onPress={() => setSeccionCliente("PERFIL")}
          />
        </View>

        <View style={styles.clientReservationsTabs}>
          {(
            [
              {
                key: "PROXIMAS",
                label: "Próximas",
                count: reservasProximasClienteTodas.length,
              },
              {
                key: "HISTORIAL",
                label: "Historial",
                count: reservasHistorialCliente.length,
              },
            ] as const
          ).map((tab) => {
            const active = modoReservasCliente === tab.key;

            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.clientReservationsTab,
                  {
                    backgroundColor: active
                      ? colorPrimarioVisibleApp
                      : clienteHomeTheme.surface,
                    borderColor: active
                      ? colorPrimarioVisibleApp
                      : clienteHomeTheme.border,
                  },
                ]}
                onPress={() => {
                  setModoReservasCliente(tab.key);
                  setErrorReservaCliente("");
                }}
              >
                <Text
                  style={[
                    styles.clientReservationsTabText,
                    {
                      color: active
                        ? obtenerColorContraste(colorPrimarioVisibleApp)
                        : clienteHomeTheme.muted,
                    },
                  ]}
                >
                  {tab.label} · {tab.count}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {reservaCanceladaFeedback && (
          <ClienteReservasFeedback tipo="success" reserva={reservaCanceladaFeedback} />
        )}
        {!!errorReservaCliente && (
          <ClienteReservasFeedback tipo="error" />
        )}

        {modoReservasCliente === "PROXIMAS" ? (
          reservasProximasClienteTodas.length === 0 ? (
            <PremiumEmptyState
              icon="calendar-heart"
              title="Sin próximas reservas"
              text="Reserva una clase para verla aquí con fecha, hora y entrenador."
              actionLabel="Explorar clases"
              onAction={() => setSeccionCliente("CLASES")}
              theme={clienteHomeTheme}
            />
          ) : (
            <>
              {reservaPrincipal && (
                <ClienteReservaHeroCard reserva={reservaPrincipal} />
              )}

              {reservasSecundarias.length > 0 && (
                <>
                  <PremiumSectionHeader
                    title="Siguientes"
                    theme={clienteHomeTheme}
                  />
                  <View style={styles.clientReservationsList}>
                    {reservasSecundarias.map((reserva) => (
                      <ClienteReservaCompactCard
                        key={reserva.id}
                        reserva={reserva}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          )
        ) : reservasMostradas.length === 0 ? (
          <PremiumEmptyState
            icon="history"
            title="Sin historial"
            text="Las reservas pasadas o canceladas aparecerán aquí."
            theme={clienteHomeTheme}
          />
        ) : (
          <View style={styles.clientReservationsList}>
            {reservasMostradas.map((reserva) => (
              <ClienteReservaHistoryCard key={reserva.id} reserva={reserva} />
            ))}
          </View>
        )}

        <ClienteCancelacionReservaModal />
      </PremiumScreenContainer>
    );
  }

  function obtenerDatosReservaCliente(reserva: any) {
    const clase = obtenerClaseDeReserva(reserva);
    const fechaHora = clase?.fechaHora || reserva.fechaHora;
    const timestamp = new Date(fechaHora || 0).getTime();
    const esFechaValida = !Number.isNaN(timestamp);
    const hoy = new Date();
    const fechaReserva = esFechaValida ? new Date(timestamp) : null;
    const esHoy =
      !!fechaReserva &&
      fechaReserva.getFullYear() === hoy.getFullYear() &&
      fechaReserva.getMonth() === hoy.getMonth() &&
      fechaReserva.getDate() === hoy.getDate();

    return {
      clase,
      fechaHora,
      timestamp,
      esHoy,
      nombre: reserva.nombreClase || clase?.nombre || "Clase",
      descripcion: clase?.descripcion || "",
      imagenUrl: resolverUrlMedia(clase?.imagenUrl),
      fecha: fechaHora ? formatearFechaCompleta(fechaHora) : "Sin fecha",
      hora: fechaHora ? obtenerHora(fechaHora) : "--:--",
      duracion: clase?.duracionMinutos ? `${clase.duracionMinutos} min` : "",
      entrenador: clase?.nombreEntrenador || reserva.nombreEntrenador || "",
      estado: reserva.estado || "RESERVADA",
    };
  }

  function obtenerEstadoReservaCliente(reserva: any) {
    const datos = obtenerDatosReservaCliente(reserva);
    const estaCancelada = datos.estado === "CANCELADA";
    const esPasada =
      datos.estado === "RESERVADA" &&
      datos.timestamp &&
      datos.timestamp < ahora.getTime();

    if (estaCancelada) {
      return {
        label: "Cancelada",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        icon: "calendar-remove-outline" as IconName,
      };
    }

    if (esPasada) {
      return {
        label: "Pasada",
        color: colorSecundarioVisibleApp,
        backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "12"),
        icon: "history" as IconName,
      };
    }

    return {
      label: datos.esHoy ? "Hoy" : datos.estado,
      color: colorPrimarioVisibleApp,
      backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12"),
      icon: datos.esHoy ? "calendar-today" : "calendar-check-outline" as IconName,
    };
  }

  function ClienteReservaEstadoPill({ reserva }: { reserva: any }) {
    const estado = obtenerEstadoReservaCliente(reserva);

    return (
      <View
        style={[
          styles.clientReservationStatusPill,
          { backgroundColor: estado.backgroundColor },
        ]}
      >
        <MaterialCommunityIcons name={estado.icon} size={14} color={estado.color} />
        <Text style={[styles.clientReservationStatusText, { color: estado.color }]}>
          {estado.label}
        </Text>
      </View>
    );
  }

  function ClienteReservaHeroCard({ reserva }: { reserva: any }) {
    const datos = obtenerDatosReservaCliente(reserva);
    const cancelando = cancelandoReservaId === reserva.id;

    return (
      <PremiumCard theme={clienteHomeTheme} style={styles.clientReservationHeroCard}>
        {datos.imagenUrl ? (
          <ImageBackground
            source={{ uri: datos.imagenUrl }}
            style={styles.clientReservationHeroImage}
            imageStyle={styles.clientReservationHeroImageStyle}
          >
            <View style={styles.clientReservationHeroShade} />
            <View style={styles.clientReservationHeroBadge}>
              <MaterialCommunityIcons
                name={datos.esHoy ? "calendar-today" : "calendar-star"}
                size={15}
                color={colorTextoSobrePrimarioApp}
              />
              <Text
                style={[
                  styles.clientReservationHeroBadgeText,
                  { color: colorTextoSobrePrimarioApp },
                ]}
              >
                {datos.esHoy ? "Clase de hoy" : "Próxima reserva"}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={styles.clientReservationHeroImage}>
            <ClassMediaPlaceholder
              theme={clienteHomeTheme}
              icon="calendar-check-outline"
              style={styles.clientReservationHeroPlaceholder}
            />
            <View style={styles.clientReservationHeroBadge}>
              <MaterialCommunityIcons
                name={datos.esHoy ? "calendar-today" : "calendar-star"}
                size={15}
                color={colorTextoSobrePrimarioApp}
              />
              <Text
                style={[
                  styles.clientReservationHeroBadgeText,
                  { color: colorTextoSobrePrimarioApp },
                ]}
              >
                {datos.esHoy ? "Clase de hoy" : "Próxima reserva"}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.clientReservationHeroBody}>
          <View style={styles.clientReservationTitleRow}>
            <View style={styles.clientReservationTitleCopy}>
              <Text style={[styles.clientReservationHeroTitle, { color: clienteHomeTheme.text }]}>
                {datos.nombre}
              </Text>
              <Text style={[styles.clientReservationHeroMeta, { color: clienteHomeTheme.muted }]}>
                {datos.fecha} · {datos.hora}
                {datos.duracion ? ` · ${datos.duracion}` : ""}
              </Text>
            </View>
            <ClienteReservaEstadoPill reserva={reserva} />
          </View>

          {!!datos.entrenador && (
            <ClienteReservaInfoLine
              icon="account-tie-outline"
              text={`Con ${datos.entrenador}`}
            />
          )}

          <Pressable
            style={styles.clientReservationSubtleCancel}
            disabled={cancelando}
            onPress={() => abrirConfirmacionCancelacionReserva(reserva)}
          >
            {cancelando ? (
              <ActivityIndicator size="small" color={colorPrimarioVisibleApp} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="calendar-remove-outline"
                  size={18}
                  color={colorPrimarioVisibleApp}
                />
                <Text
                  style={[
                    styles.clientReservationSubtleCancelText,
                    { color: colorPrimarioVisibleApp },
                  ]}
                >
                  Cancelar reserva
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </PremiumCard>
    );
  }

  function ClienteReservaCompactCard({ reserva }: { reserva: any }) {
    const datos = obtenerDatosReservaCliente(reserva);
    const cancelando = cancelandoReservaId === reserva.id;

    return (
      <PremiumCard theme={clienteHomeTheme} style={styles.clientReservationCompactCard}>
        <View
          style={[
            styles.clientReservationTimeBox,
            {
              backgroundColor: datos.esHoy
                ? colorConAlpha(colorPrimarioVisibleApp, "12")
                : colorConAlpha(colorSecundarioVisibleApp, "10"),
            },
          ]}
        >
          <Text
            style={[
              styles.clientReservationTimeText,
              {
                color: datos.esHoy
                  ? colorPrimarioVisibleApp
                  : colorSecundarioVisibleApp,
              },
            ]}
          >
            {datos.hora}
          </Text>
        </View>

        <View style={styles.clientReservationCompactCopy}>
          <View style={styles.clientReservationTitleRow}>
            <Text style={[styles.clientReservationCompactTitle, { color: clienteHomeTheme.text }]} numberOfLines={1}>
              {datos.nombre}
            </Text>
            <ClienteReservaEstadoPill reserva={reserva} />
          </View>
          <Text style={[styles.clientReservationCompactMeta, { color: clienteHomeTheme.muted }]} numberOfLines={2}>
            {datos.fecha}
            {datos.duracion ? ` · ${datos.duracion}` : ""}
            {datos.entrenador ? ` · ${datos.entrenador}` : ""}
          </Text>
          <Pressable
            style={styles.clientReservationInlineCancel}
            disabled={cancelando}
            onPress={() => abrirConfirmacionCancelacionReserva(reserva)}
          >
            <Text
              style={[
                styles.clientReservationInlineCancelText,
                { color: colorPrimarioVisibleApp },
              ]}
            >
              {cancelando ? "Cancelando..." : "Cancelar"}
            </Text>
          </Pressable>
        </View>
      </PremiumCard>
    );
  }

  function ClienteReservaHistoryCard({ reserva }: { reserva: any }) {
    const datos = obtenerDatosReservaCliente(reserva);

    return (
      <PremiumCard theme={clienteHomeTheme} style={styles.clientReservationHistoryCard}>
        <View style={styles.clientReservationHistoryCopy}>
          <Text style={[styles.clientReservationHistoryTitle, { color: clienteHomeTheme.text }]} numberOfLines={1}>
            {datos.nombre}
          </Text>
          <Text style={[styles.clientReservationHistoryMeta, { color: clienteHomeTheme.muted }]} numberOfLines={2}>
            {datos.fecha} · {datos.hora}
            {datos.entrenador ? ` · ${datos.entrenador}` : ""}
          </Text>
        </View>
        <ClienteReservaEstadoPill reserva={reserva} />
      </PremiumCard>
    );
  }

  function ClienteReservaInfoLine({
    icon,
    text,
  }: {
    icon: IconName;
    text: string;
  }) {
    return (
      <View style={styles.clientReservationInfoLine}>
        <MaterialCommunityIcons name={icon} size={18} color={clienteHomeTheme.muted} />
        <Text style={[styles.clientReservationInfoText, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    );
  }

  function abrirConfirmacionCancelacionReserva(reserva: any) {
    setReservaCancelacionPendiente(reserva);
    setReservaCanceladaFeedback(null);
    setErrorReservaCliente("");
  }

  async function confirmarCancelacionReservaCliente() {
    if (!reservaCancelacionPendiente) {
      return;
    }

    const reserva = reservaCancelacionPendiente;
    const datos = obtenerDatosReservaCliente(reserva);
    const cancelada = await cancelarReserva(reserva.id, { mostrarAlert: false });

    if (cancelada) {
      setReservaCanceladaFeedback({
        ...reserva,
        nombreClase: datos.nombre,
        fechaHora: datos.fechaHora,
        nombreEntrenador: datos.entrenador,
      });
      setModoReservasCliente("HISTORIAL");
    }

    setReservaCancelacionPendiente(null);
  }

  function ClienteCancelacionReservaModal() {
    const reserva = reservaCancelacionPendiente;

    if (!reserva) {
      return null;
    }

    const datos = obtenerDatosReservaCliente(reserva);
    const cancelando = cancelandoReservaId === reserva.id;

    return (
      <Modal
        visible
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          if (!cancelando) {
            setReservaCancelacionPendiente(null);
          }
        }}
      >
        <View style={styles.clientReservationModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            disabled={cancelando}
            onPress={() => setReservaCancelacionPendiente(null)}
          />
          <View
            style={[
              styles.clientReservationSheet,
              {
                backgroundColor: clienteHomeTheme.surface,
                paddingBottom: Math.max(insets.bottom, 18) + 8,
              },
            ]}
          >
            <View
              style={[
                styles.clientReservationSheetIcon,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-remove-outline"
                size={25}
                color={colorPrimarioVisibleApp}
              />
            </View>
            <Text style={[styles.clientReservationSheetTitle, { color: clienteHomeTheme.text }]}>
              Cancelar reserva
            </Text>
            <Text style={[styles.clientReservationSheetText, { color: clienteHomeTheme.muted }]}>
              Vas a cancelar {datos.nombre} el {datos.fecha} a las {datos.hora}
              {datos.entrenador ? ` con ${datos.entrenador}` : ""}.
            </Text>

            <PremiumPrimaryButton
              label="Mantener reserva"
              theme={clienteHomeTheme}
              onPress={() => setReservaCancelacionPendiente(null)}
              disabled={cancelando}
              style={styles.clientReservationSheetPrimary}
            />
            <Pressable
              style={[
                styles.clientReservationSheetDanger,
                cancelando && styles.clientClassReserveButtonDisabled,
              ]}
              disabled={cancelando}
              onPress={confirmarCancelacionReservaCliente}
            >
              {cancelando ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.clientReservationSheetDangerText}>
                  Cancelar reserva
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  function ClienteReservasFeedback({
    tipo,
    reserva,
  }: {
    tipo: "success" | "error";
    reserva?: any;
  }) {
    const esError = tipo === "error";
    const color = esError ? "#DC2626" : colorSecundarioVisibleApp;
    const backgroundColor = esError
      ? "#FEF2F2"
      : mezclarColores(colorSecundarioVisibleApp, clienteHomeTheme.background, 0.84);
    const borderColor = esError
      ? "#FECACA"
      : mezclarColores(colorSecundarioVisibleApp, clienteHomeTheme.background, 0.68);
    const datos = reserva ? obtenerDatosReservaCliente(reserva) : null;
    const titulo = esError ? "No se pudo cancelar" : "Reserva cancelada";
    const texto = esError
      ? errorReservaCliente
      : datos
        ? `${datos.nombre} ya no aparece en tus próximas reservas.`
        : "La reserva se ha cancelado correctamente.";

    return (
      <View
        style={[
          styles.clientReservationFeedback,
          { backgroundColor, borderColor },
        ]}
      >
        <View style={[styles.clientClassFeedbackIcon, { backgroundColor: color }]}>
          <MaterialCommunityIcons
            name={esError ? "alert-circle-outline" : "check"}
            size={22}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.clientClassFeedbackCopy}>
          <Text style={[styles.clientClassFeedbackTitle, { color }]}>
            {titulo}
          </Text>
          <Text style={[styles.clientClassFeedbackText, { color: clienteHomeTheme.text }]}>
            {texto}
          </Text>
        </View>
      </View>
    );
  }

  function renderEntrenadorPerfilPremium() {
    const nombreEntrenadorCompleto =
      entrenadorDemo?.nombre || usuarioActivo?.nombre || "Entrenador";
    const nombreEntrenador = obtenerNombreChatSinRol(nombreEntrenadorCompleto);
    const emailEntrenador = entrenadorDemo?.email || usuarioActivo?.email || "";
    const fotoEntrenadorUri = resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl);
    const subiendoFotoEntrenador = subiendoImagen === "perfil";

    if (modoPerfilCliente === "DATOS_PERSONALES") {
      return renderDatosPersonalesPerfilPremium();
    }

    if (modoPerfilCliente === "PASSWORD") {
      return renderPasswordPerfilPremium();
    }

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.clientProfileHeader}>
          <View style={styles.clientProfileHeaderCopy}>
            <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
              Mi cuenta
            </Text>
            <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>Perfil</Text>
            <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
              Gestiona tu información y tus accesos de trabajo.
            </Text>
          </View>
          {entrenadoresPuedenCambiarFotoPerfilApp ? (
            <Pressable
              style={[
                styles.clientProfileHeaderAvatar,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
              ]}
              onPress={() => cambiarFotoPerfil()}
              accessibilityRole="button"
              accessibilityLabel="Editar foto de perfil"
            >
              {fotoEntrenadorUri ? (
                <Image
                  source={{ uri: fotoEntrenadorUri }}
                  style={styles.clientProfileAvatarImage}
                />
              ) : (
                <Text style={[styles.clientProfileAvatarText, { color: colorPrimarioVisibleApp }]}>
                  {obtenerIniciales(nombreEntrenador)}
                </Text>
              )}
              <View
                style={[
                  styles.clientProfileCameraBadge,
                  { backgroundColor: colorPrimarioVisibleApp },
                ]}
              >
                {subiendoFotoEntrenador ? (
                  <ActivityIndicator size="small" color={colorTextoSobrePrimarioApp} />
                ) : (
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={15}
                    color={colorTextoSobrePrimarioApp}
                  />
                )}
              </View>
            </Pressable>
          ) : (
            <View
              style={[
                styles.clientProfileHeaderAvatar,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
              ]}
            >
              {fotoEntrenadorUri ? (
                <Image
                  source={{ uri: fotoEntrenadorUri }}
                  style={styles.clientProfileAvatarImage}
                />
              ) : (
                <Text style={[styles.clientProfileAvatarText, { color: colorPrimarioVisibleApp }]}>
                  {obtenerIniciales(nombreEntrenador)}
                </Text>
              )}
            </View>
          )}
        </View>

        <PremiumCard theme={clienteHomeTheme} style={styles.clientProfileIdentityCard}>
          <View
            style={[
              styles.clientProfileIdentityIcon,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <MaterialCommunityIcons
              name="account-tie-outline"
              size={25}
              color={colorPrimarioVisibleApp}
            />
          </View>

          <View style={styles.clientProfileIdentityCopy}>
            <Text
              style={[styles.clientProfileName, { color: clienteHomeTheme.text }]}
              numberOfLines={1}
            >
              {nombreEntrenador}
            </Text>
            <Text
              style={[styles.clientProfileEmail, { color: clienteHomeTheme.muted }]}
              numberOfLines={1}
            >
              <Text style={{ color: colorSecundarioVisibleApp }}>Entrenador</Text>
              {emailEntrenador ? ` · ${emailEntrenador}` : ""}
            </Text>
          </View>
        </PremiumCard>

        <PerfilGrupo title="Mi cuenta">
          <PerfilRow
            icon="account-edit-outline"
            title="Datos personales"
            description="Nombre y email de acceso"
            onPress={abrirDatosPersonalesPerfil}
          />
          <PerfilRow
            icon="lock-reset"
            title="Cambiar contraseña"
            description="Actualiza tu acceso de forma segura"
            onPress={abrirPasswordPerfil}
          />
          {entrenadoresPuedenCambiarFotoPerfilApp && (
            <PerfilRow
              icon="camera-outline"
              title="Foto de perfil"
              description="Actualiza tu imagen con la cámara o la galería"
              onPress={() => cambiarFotoPerfil()}
              loading={subiendoFotoEntrenador}
            />
          )}
        </PerfilGrupo>

        <PerfilGrupo title="Mi trabajo">
          <PerfilRow
            icon="calendar-clock-outline"
            title="Horario y clases"
            description={`${clasesEntrenador.length} sesiones asignadas`}
            onPress={() => setSeccionEntrenador("CLASES")}
          />
          <PerfilRow
            icon="dumbbell"
            title="Rutinas"
            description="Crea, organiza y asigna entrenamientos"
            onPress={() => setSeccionEntrenador("RUTINAS")}
          />
          <PerfilRow
            icon="message-text-outline"
            title="Mensajes"
            description={
              mensajesNoLeidosBadge > 0
                ? `${mensajesNoLeidosBadge} sin leer`
                : "Bandeja al día"
            }
            badgeCount={mensajesNoLeidosBadge}
            onPress={() => setSeccionEntrenador("MENSAJES")}
          />
        </PerfilGrupo>

        <PerfilGrupo title="Mi gimnasio">
          <PerfilRow
            icon="storefront-outline"
            title={nombreGimnasioApp}
            description="Gimnasio asociado a tu cuenta"
          />
        </PerfilGrupo>

        <PerfilGrupo title="Cuenta">
          <PerfilRow
            icon="logout"
            title="Cerrar sesión"
            description="Salir de este dispositivo"
            danger
            onPress={() => setConfirmarLogoutCliente(true)}
          />
        </PerfilGrupo>

        <PerfilLogoutModal />
      </PremiumScreenContainer>
    );
  }

  function renderClientePerfilPremium() {
    const nombreCliente = clienteDemo?.nombre || usuarioActivo?.nombre || "Cliente";
    const emailCliente = clienteDemo?.email || usuarioActivo?.email || "";
    const fotoClienteUri = resolverUrlMedia(clienteDemo?.fotoPerfilUrl);
    const subiendoFotoCliente = subiendoImagen === "perfil";

    if (modoPerfilCliente === "DATOS_PERSONALES") {
      return renderDatosPersonalesPerfilPremium();
    }

    if (modoPerfilCliente === "PASSWORD") {
      return renderPasswordPerfilPremium();
    }

    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <View style={styles.clientProfileHeader}>
          <View style={styles.clientProfileHeaderCopy}>
            <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
              Mi cuenta
            </Text>
            <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
              Perfil
            </Text>
            <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
              Gestiona tu información y tus accesos principales.
            </Text>
          </View>
          {clientesPuedenCambiarFotoPerfilApp ? (
            <Pressable
              style={[
                styles.clientProfileHeaderAvatar,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
              ]}
              onPress={() => cambiarFotoPerfil()}
              accessibilityRole="button"
              accessibilityLabel="Editar foto de perfil"
            >
              {fotoClienteUri ? (
                <Image source={{ uri: fotoClienteUri }} style={styles.clientProfileAvatarImage} />
              ) : (
                <Text style={[styles.clientProfileAvatarText, { color: colorPrimarioVisibleApp }]}>
                  {obtenerIniciales(nombreCliente)}
                </Text>
              )}
              <View
                style={[
                  styles.clientProfileCameraBadge,
                  { backgroundColor: colorPrimarioVisibleApp },
                ]}
              >
                {subiendoFotoCliente ? (
                  <ActivityIndicator size="small" color={colorTextoSobrePrimarioApp} />
                ) : (
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={15}
                    color={colorTextoSobrePrimarioApp}
                  />
                )}
              </View>
            </Pressable>
          ) : (
            <View
              style={[
                styles.clientProfileHeaderAvatar,
                { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "14") },
              ]}
            >
              {fotoClienteUri ? (
                <Image source={{ uri: fotoClienteUri }} style={styles.clientProfileAvatarImage} />
              ) : (
                <Text style={[styles.clientProfileAvatarText, { color: colorPrimarioVisibleApp }]}>
                  {obtenerIniciales(nombreCliente)}
                </Text>
              )}
            </View>
          )}
        </View>

        <PremiumCard theme={clienteHomeTheme} style={styles.clientProfileIdentityCard}>
          <View
            style={[
              styles.clientProfileIdentityIcon,
              { backgroundColor: colorConAlpha(colorPrimarioVisibleApp, "12") },
            ]}
          >
            <MaterialCommunityIcons
              name="account-heart-outline"
              size={25}
              color={colorPrimarioVisibleApp}
            />
          </View>
          <View style={styles.clientProfileIdentityCopy}>
            <Text style={[styles.clientProfileName, { color: clienteHomeTheme.text }]} numberOfLines={1}>
              {nombreCliente}
            </Text>
            {!!emailCliente && (
              <Text style={[styles.clientProfileEmail, { color: clienteHomeTheme.muted }]} numberOfLines={1}>
                {emailCliente}
              </Text>
            )}
          </View>
        </PremiumCard>

        <PerfilGrupo title="Mi cuenta">
          <PerfilRow
            icon="account-edit-outline"
            title="Datos personales"
            description="Nombre y email de acceso"
            onPress={abrirDatosPersonalesPerfil}
          />
          <PerfilRow
            icon="lock-reset"
            title="Cambiar contraseña"
            description="Actualiza tu acceso de forma segura"
            onPress={abrirPasswordPerfil}
          />
          {clientesPuedenCambiarFotoPerfilApp && (
            <PerfilRow
              icon="camera-outline"
              title="Foto de perfil"
              description="Actualiza tu imagen con la cámara o la galería"
              onPress={() => cambiarFotoPerfil()}
              loading={subiendoFotoCliente}
            />
          )}
          <PerfilRow
            icon="clipboard-check-outline"
            title="Mis reservas"
            description={`${reservasProximasClienteTodas.length} próximas · ${reservasHistorialCliente.length} en historial`}
            onPress={() => setSeccionCliente("RESERVAS")}
          />
          <PerfilRow
            icon="message-text-outline"
            title="Mensajes"
            description={
              mensajesNoLeidosBadge > 0
                ? `${mensajesNoLeidosBadge} sin leer`
                : "Bandeja al día"
            }
            badgeCount={mensajesNoLeidosBadge}
            onPress={() => setSeccionCliente("MENSAJES")}
          />
          <PerfilRow
            icon="receipt-text-outline"
            title="Pagos"
            description={
              pagos.some(
                (pago) =>
                  pago.estado === "PENDIENTE" || pago.estado === "VENCIDO",
              )
                ? `${pagos.filter((pago) => pago.estado === "PENDIENTE" || pago.estado === "VENCIDO").length} pendientes`
                : "Sin pagos pendientes"
            }
            onPress={() => setSeccionCliente("PAGOS")}
          />
        </PerfilGrupo>

        <PerfilGrupo title="Mi gimnasio">
          <PerfilRow
            icon="storefront-outline"
            title={nombreGimnasioApp}
            description="Gimnasio asociado a tu cuenta"
          />
        </PerfilGrupo>

        <PerfilGrupo title="Cuenta">
          <PerfilRow
            icon="logout"
            title="Cerrar sesión"
            description="Salir de este dispositivo"
            danger
            onPress={() => setConfirmarLogoutCliente(true)}
          />
        </PerfilGrupo>

        <PerfilLogoutModal />
      </PremiumScreenContainer>
    );
  }

  function renderDatosPersonalesPerfilPremium() {
    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderCuentaPerfilHeader({
          eyebrow: "Mi cuenta",
          title: "Datos personales",
          subtitle: "Actualiza solo los datos visibles de tu cuenta.",
        })}

        <PremiumCard theme={clienteHomeTheme} style={styles.clientAccountFormCard}>
          {renderCuentaPerfilInput({
            label: "Nombre",
            icon: "account-outline",
            value: perfilNombreForm,
            onChangeText: setPerfilNombreForm,
            placeholder: "Tu nombre",
            returnKeyType: "next",
          })}
          {renderCuentaPerfilInput({
            label: "Email",
            icon: "email-outline",
            value: perfilEmailForm,
            onChangeText: setPerfilEmailForm,
            placeholder: "tu@email.com",
            keyboardType: "email-address",
            autoCapitalize: "none",
            textContentType: "emailAddress",
            returnKeyType: "done",
            onSubmitEditing: guardarDatosPersonalesPerfil,
          })}

          {renderCuentaPerfilFeedback()}

          <PremiumPrimaryButton
            label="Guardar cambios"
            icon="content-save-outline"
            theme={clienteHomeTheme}
            loading={guardandoPerfilCliente}
            disabled={guardandoPerfilCliente}
            onPress={guardarDatosPersonalesPerfil}
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function renderPasswordPerfilPremium() {
    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        {renderCuentaPerfilHeader({
          eyebrow: "Seguridad",
          title: "Cambiar contraseña",
          subtitle: "Verificamos tu contraseña actual antes de guardar la nueva.",
        })}

        <PremiumCard theme={clienteHomeTheme} style={styles.clientAccountFormCard}>
          {renderCuentaPerfilInput({
            label: "Contraseña actual",
            icon: "lock-outline",
            value: passwordActualCuenta,
            onChangeText: setPasswordActualCuenta,
            placeholder: "Tu contraseña actual",
            autoCapitalize: "none",
            secureTextEntry: !mostrarPasswordActualCuenta,
            textContentType: "password",
            rightElement: renderPasswordPerfilToggle({
              visible: mostrarPasswordActualCuenta,
              onPress: () =>
                setMostrarPasswordActualCuenta((mostrar) => !mostrar),
            }),
          })}
          {renderCuentaPerfilInput({
            label: "Nueva contraseña",
            icon: "lock-plus-outline",
            value: passwordNuevaCuenta,
            onChangeText: setPasswordNuevaCuenta,
            placeholder: "Mínimo 6 caracteres",
            autoCapitalize: "none",
            secureTextEntry: !mostrarPasswordNuevaCuenta,
            textContentType: "newPassword",
            rightElement: renderPasswordPerfilToggle({
              visible: mostrarPasswordNuevaCuenta,
              onPress: () =>
                setMostrarPasswordNuevaCuenta((mostrar) => !mostrar),
            }),
          })}
          {renderCuentaPerfilInput({
            label: "Confirmar nueva contraseña",
            icon: "lock-check-outline",
            value: passwordConfirmacionCuenta,
            onChangeText: setPasswordConfirmacionCuenta,
            placeholder: "Repite la nueva contraseña",
            autoCapitalize: "none",
            secureTextEntry: !mostrarPasswordConfirmacionCuenta,
            textContentType: "newPassword",
            returnKeyType: "done",
            onSubmitEditing: guardarPasswordPerfil,
            rightElement: renderPasswordPerfilToggle({
              visible: mostrarPasswordConfirmacionCuenta,
              onPress: () =>
                setMostrarPasswordConfirmacionCuenta((mostrar) => !mostrar),
            }),
          })}

          <View
            style={[
              styles.clientAccountHint,
              {
                backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10"),
                borderColor: colorConAlpha(colorSecundarioVisibleApp, "20"),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={19}
              color={colorSecundarioVisibleApp}
            />
            <Text style={[styles.clientAccountHintText, { color: clienteHomeTheme.muted }]}>
              Usa una contraseña que no hayas utilizado en otros servicios.
            </Text>
          </View>

          {renderCuentaPerfilFeedback()}

          <PremiumPrimaryButton
            label="Actualizar contraseña"
            icon="shield-key-outline"
            theme={clienteHomeTheme}
            loading={guardandoPasswordCliente}
            disabled={guardandoPasswordCliente}
            onPress={guardarPasswordPerfil}
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function ClientePasswordPremium() {
    return (
      <PremiumScreenContainer theme={clienteHomeTheme}>
        <ClienteCuentaHeader
          eyebrow="Seguridad"
          title="Cambiar contraseña"
          subtitle="Verificamos tu contraseña actual antes de guardar la nueva."
        />

        <PremiumCard theme={clienteHomeTheme} style={styles.clientAccountFormCard}>
          <ClienteCuentaInput
            label="Contraseña actual"
            icon="lock-outline"
            value={passwordActualCuenta}
            onChangeText={setPasswordActualCuenta}
            placeholder="Tu contraseña actual"
            autoCapitalize="none"
            secureTextEntry={!mostrarPasswordActualCuenta}
            textContentType="password"
            rightElement={
              <ClientePasswordToggle
                visible={mostrarPasswordActualCuenta}
                onPress={() =>
                  setMostrarPasswordActualCuenta((mostrar) => !mostrar)
                }
              />
            }
          />
          <ClienteCuentaInput
            label="Nueva contraseña"
            icon="lock-plus-outline"
            value={passwordNuevaCuenta}
            onChangeText={setPasswordNuevaCuenta}
            placeholder="Mínimo 6 caracteres"
            autoCapitalize="none"
            secureTextEntry={!mostrarPasswordNuevaCuenta}
            textContentType="newPassword"
            rightElement={
              <ClientePasswordToggle
                visible={mostrarPasswordNuevaCuenta}
                onPress={() =>
                  setMostrarPasswordNuevaCuenta((mostrar) => !mostrar)
                }
              />
            }
          />
          <ClienteCuentaInput
            label="Confirmar nueva contraseña"
            icon="lock-check-outline"
            value={passwordConfirmacionCuenta}
            onChangeText={setPasswordConfirmacionCuenta}
            placeholder="Repite la nueva contraseña"
            autoCapitalize="none"
            secureTextEntry={!mostrarPasswordConfirmacionCuenta}
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={guardarPasswordPerfil}
            rightElement={
              <ClientePasswordToggle
                visible={mostrarPasswordConfirmacionCuenta}
                onPress={() =>
                  setMostrarPasswordConfirmacionCuenta((mostrar) => !mostrar)
                }
              />
            }
          />

          <View
            style={[
              styles.clientAccountHint,
              {
                backgroundColor: colorConAlpha(colorSecundarioVisibleApp, "10"),
                borderColor: colorConAlpha(colorSecundarioVisibleApp, "20"),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={19}
              color={colorSecundarioVisibleApp}
            />
            <Text style={[styles.clientAccountHintText, { color: clienteHomeTheme.muted }]}>
              Usa una contraseña que no hayas utilizado en otros servicios.
            </Text>
          </View>

          <ClienteCuentaFeedback />

          <PremiumPrimaryButton
            label="Actualizar contraseña"
            icon="shield-key-outline"
            theme={clienteHomeTheme}
            loading={guardandoPasswordCliente}
            disabled={guardandoPasswordCliente}
            onPress={guardarPasswordPerfil}
          />
        </PremiumCard>
      </PremiumScreenContainer>
    );
  }

  function ClienteCuentaHeader({
    eyebrow,
    title,
    subtitle,
  }: {
    eyebrow: string;
    title: string;
    subtitle: string;
  }) {
    const usuarioPerfil =
      usuarioActivo || (rolSeleccionado === "ENTRENADOR" ? entrenadorDemo : clienteDemo);
    const nombrePerfilCompleto = usuarioPerfil?.nombre || "Usuario";
    const nombrePerfil =
      rolSeleccionado === "ENTRENADOR"
        ? obtenerNombreChatSinRol(nombrePerfilCompleto)
        : nombrePerfilCompleto;
    const fotoPerfilUri = resolverUrlMedia(usuarioPerfil?.fotoPerfilUrl);

    return (
      <View style={styles.clientAccountHeader}>
        <Pressable
          style={[
            styles.clientAccountBackButton,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
          onPress={volverResumenPerfil}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={clienteHomeTheme.text}
          />
        </Pressable>
        <View style={styles.clientProfileHeaderCopy}>
          <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
            {subtitle}
          </Text>
        </View>
        <PremiumAvatar
          uri={fotoPerfilUri}
          initials={obtenerIniciales(nombrePerfil)}
          size={48}
          theme={clienteHomeTheme}
        />
      </View>
    );
  }

  function ClienteCuentaInput({
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
  }) {
    return (
      <View style={styles.clientAccountInputGroup}>
        <Text style={[styles.clientAccountLabel, { color: clienteHomeTheme.text }]}>
          {label}
        </Text>
        <View
          style={[
            styles.clientAccountInputShell,
            {
              backgroundColor: clienteHomeTheme.surfaceSoft,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colorSecundarioVisibleApp}
          />
          <TextInput
            value={value}
            onChangeText={(text) => {
              if (feedbackCuentaCliente?.tipo === "error") {
                setFeedbackCuentaCliente(null);
              }
              onChangeText(text);
            }}
            placeholder={placeholder}
            placeholderTextColor={clienteHomeTheme.muted}
            style={[styles.clientAccountInput, { color: clienteHomeTheme.text }]}
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

  function ClientePasswordToggle({
    visible,
    onPress,
  }: {
    visible: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable style={styles.clientAccountInputAction} onPress={onPress}>
        <MaterialCommunityIcons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={21}
          color={clienteHomeTheme.muted}
        />
      </Pressable>
    );
  }

  function ClienteCuentaFeedback() {
    if (!feedbackCuentaCliente) {
      return null;
    }

    const esError = feedbackCuentaCliente.tipo === "error";
    const color = esError ? "#DC2626" : colorSecundarioVisibleApp;

    return (
      <View
        style={[
          styles.clientAccountFeedback,
          {
            backgroundColor: esError
              ? "#FEF2F2"
              : colorConAlpha(colorSecundarioVisibleApp, "10"),
            borderColor: esError
              ? "#FECACA"
              : colorConAlpha(colorSecundarioVisibleApp, "24"),
          },
        ]}
      >
        <MaterialCommunityIcons
          name={esError ? "alert-circle-outline" : "check-circle-outline"}
          size={20}
          color={color}
        />
        <Text style={[styles.clientAccountFeedbackText, { color }]}>
          {feedbackCuentaCliente.texto}
        </Text>
      </View>
    );
  }

  function renderCuentaPerfilHeader({
    eyebrow,
    title,
    subtitle,
  }: {
    eyebrow: string;
    title: string;
    subtitle: string;
  }) {
    const usuarioPerfil =
      usuarioActivo || (rolSeleccionado === "ENTRENADOR" ? entrenadorDemo : clienteDemo);
    const nombrePerfilCompleto = usuarioPerfil?.nombre || "Usuario";
    const nombrePerfil =
      rolSeleccionado === "ENTRENADOR"
        ? obtenerNombreChatSinRol(nombrePerfilCompleto)
        : nombrePerfilCompleto;
    const fotoPerfilUri = resolverUrlMedia(usuarioPerfil?.fotoPerfilUrl);

    return (
      <View style={styles.clientAccountHeader}>
        <Pressable
          style={[
            styles.clientAccountBackButton,
            {
              backgroundColor: clienteHomeTheme.surface,
              borderColor: clienteHomeTheme.border,
            },
          ]}
          onPress={volverResumenPerfil}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={clienteHomeTheme.text}
          />
        </Pressable>
        <View style={styles.clientProfileHeaderCopy}>
          <Text style={[styles.clientHomeEyebrow, { color: colorSecundarioVisibleApp }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.clientHomeTitle, { color: clienteHomeTheme.text }]}>
            {title}
          </Text>
          <Text style={[styles.clientHomeSubtitle, { color: clienteHomeTheme.muted }]}>
            {subtitle}
          </Text>
        </View>
        <PremiumAvatar
          uri={fotoPerfilUri}
          initials={obtenerIniciales(nombrePerfil)}
          size={48}
          theme={clienteHomeTheme}
        />
      </View>
    );
  }

  function renderCuentaPerfilInput({
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
  }) {
    return (
      <View style={styles.clientAccountInputGroup}>
        <Text style={[styles.clientAccountLabel, { color: clienteHomeTheme.text }]}>
          {label}
        </Text>
        <View
          style={[
            styles.clientAccountInputShell,
            {
              backgroundColor: clienteHomeTheme.surfaceSoft,
              borderColor: clienteHomeTheme.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colorSecundarioVisibleApp}
          />
          <TextInput
            value={value}
            onChangeText={(text) => {
              if (feedbackCuentaCliente?.tipo === "error") {
                setFeedbackCuentaCliente(null);
              }
              onChangeText(text);
            }}
            placeholder={placeholder}
            placeholderTextColor={clienteHomeTheme.muted}
            style={[styles.clientAccountInput, { color: clienteHomeTheme.text }]}
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

  function renderPasswordPerfilToggle({
    visible,
    onPress,
  }: {
    visible: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable style={styles.clientAccountInputAction} onPress={onPress}>
        <MaterialCommunityIcons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={21}
          color={clienteHomeTheme.muted}
        />
      </Pressable>
    );
  }

  function renderCuentaPerfilFeedback() {
    if (!feedbackCuentaCliente) {
      return null;
    }

    const esError = feedbackCuentaCliente.tipo === "error";
    const color = esError ? "#DC2626" : colorSecundarioVisibleApp;

    return (
      <View
        style={[
          styles.clientAccountFeedback,
          {
            backgroundColor: esError
              ? "#FEF2F2"
              : colorConAlpha(colorSecundarioVisibleApp, "10"),
            borderColor: esError
              ? "#FECACA"
              : colorConAlpha(colorSecundarioVisibleApp, "24"),
          },
        ]}
      >
        <MaterialCommunityIcons
          name={esError ? "alert-circle-outline" : "check-circle-outline"}
          size={20}
          color={color}
        />
        <Text style={[styles.clientAccountFeedbackText, { color }]}>
          {feedbackCuentaCliente.texto}
        </Text>
      </View>
    );
  }

  function PerfilGrupo({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) {
    return (
      <View style={styles.clientProfileGroup}>
        <Text style={[styles.clientProfileGroupTitle, { color: clienteHomeTheme.text }]}>
          {title}
        </Text>
        <PremiumCard theme={clienteHomeTheme} style={styles.clientProfileGroupCard}>
          {children}
        </PremiumCard>
      </View>
    );
  }

  function PerfilRow({
    icon,
    title,
    description,
    onPress,
    badgeCount = 0,
    danger = false,
    loading = false,
  }: {
    icon: IconName;
    title: string;
    description?: string;
    onPress?: () => void;
    badgeCount?: number;
    danger?: boolean;
    loading?: boolean;
  }) {
    const color = danger ? "#DC2626" : colorSecundarioVisibleApp;
    const content = (
      <View style={styles.clientProfileRow}>
        <View
          style={[
            styles.clientProfileRowIcon,
            {
              backgroundColor: danger
                ? "#FEF2F2"
                : colorConAlpha(colorSecundarioVisibleApp, "12"),
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <MaterialCommunityIcons name={icon} size={20} color={color} />
          )}
        </View>
        <View style={styles.clientProfileRowCopy}>
          <Text
            style={[
              styles.clientProfileRowTitle,
              { color: danger ? "#DC2626" : clienteHomeTheme.text },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {!!description && (
            <Text
              style={[styles.clientProfileRowDescription, { color: clienteHomeTheme.muted }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
        {badgeCount > 0 && (
          <View
            style={[
              styles.clientProfileRowBadge,
              { backgroundColor: colorPrimarioVisibleApp },
            ]}
          >
            <Text
              style={[
                styles.clientProfileRowBadgeText,
                { color: colorTextoSobrePrimarioApp },
              ]}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        )}
        {!!onPress && !danger && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={clienteHomeTheme.muted}
          />
        )}
      </View>
    );

    if (!onPress) {
      return content;
    }

    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  function PerfilLogoutModal() {
    return (
      <Modal
        visible={confirmarLogoutCliente}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setConfirmarLogoutCliente(false)}
      >
        <View style={styles.clientReservationModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setConfirmarLogoutCliente(false)}
          />
          <View
            style={[
              styles.clientReservationSheet,
              {
                backgroundColor: clienteHomeTheme.surface,
                paddingBottom: Math.max(insets.bottom, 18) + 8,
              },
            ]}
          >
            <View
              style={[
                styles.clientReservationSheetIcon,
                { backgroundColor: "#FEF2F2" },
              ]}
            >
              <MaterialCommunityIcons
                name="logout"
                size={25}
                color="#DC2626"
              />
            </View>
            <Text style={[styles.clientReservationSheetTitle, { color: clienteHomeTheme.text }]}>
              Cerrar sesión
            </Text>
            <Text style={[styles.clientReservationSheetText, { color: clienteHomeTheme.muted }]}>
              Saldrás de GymFlow en este dispositivo. Podrás volver a entrar con tu email y contraseña.
            </Text>

            <PremiumPrimaryButton
              label="Mantener sesión"
              theme={clienteHomeTheme}
              onPress={() => setConfirmarLogoutCliente(false)}
              style={styles.clientReservationSheetPrimary}
            />
            <Pressable
              style={styles.clientReservationSheetDanger}
              onPress={() => {
                setConfirmarLogoutCliente(false);
                cerrarSesion();
              }}
            >
              <Text style={styles.clientReservationSheetDangerText}>
                Cerrar sesión
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#05070A",
    position: "relative",
  },
  keyboardAvoiding: {
    flex: 1,
  },
  themedBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  previewDashboardRoot: {
    flex: 1,
    minHeight: 0,
  },
  previewDashboardScroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  previewDashboardContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
  },
  previewAgendaRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  previewAgendaTime: {
    width: 50,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  previewAgendaCopy: {
    flex: 1,
    minWidth: 0,
  },
  previewAgendaTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  previewAgendaMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  themedBackdropTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    opacity: 0.42,
  },
  themedBackdropBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    opacity: 0.28,
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 42,
  },
  containerWithDock: {
    paddingBottom: 124,
  },
  center: {
    flex: 1,
    backgroundColor: "#05070A",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: "#A7B0BD",
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
  },
  errorHint: {
    marginTop: 10,
    fontSize: 14,
    color: "#A7B0BD",
    textAlign: "center",
  },
  header: {
    marginBottom: 22,
  },
  eyebrow: {
    color: "#E33B3B",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 16,
    color: "#A7B0BD",
    marginTop: 8,
    lineHeight: 23,
  },
  authHero: {
    borderRadius: 8,
    padding: 24,
    minHeight: 230,
    marginBottom: 16,
    justifyContent: "flex-end",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  authBrandMark: {
    width: 66,
    height: 66,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.24)",
    marginBottom: 18,
  },
  authBrandImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  authEyebrow: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  authTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 7,
  },
  authSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8,
  },
  authCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  authCardTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
  },
  authCardSubtitle: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 8,
  },
  authInputShell: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    backgroundColor: "#0B1017",
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authTextInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 0,
  },
  authPasswordToggle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  authSubmitContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  authSubmitDisabled: {
    opacity: 0.7,
  },
  authHintCard: {
    backgroundColor: "#10151D",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#263241",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  authHelpText: {
    flex: 1,
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  compactHeader: {
    marginBottom: 18,
    padding: 16,
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  compactTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  screenHeader: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  screenBackButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#111722",
    borderWidth: 1,
    borderColor: "#263241",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  screenHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  screenHeaderTitle: {
    color: "#F8FAFC",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
  },
  screenHeaderSubtitle: {
    color: "#A7B0BD",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 4,
  },
  screenProfileButton: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sessionTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sessionLogoutButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(17,23,34,0.92)",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#263241",
  },
  sessionLogoutText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "900",
  },
  sessionRolePill: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  sessionRoleText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  clientMessagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  clientMessagesHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientMessagesHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clientMessagesNewIconButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  clientMessagesNewIconButtonDisabled: {
    opacity: 0.5,
  },
  clientMessagesOverviewCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 14,
  },
  clientMessagesOverviewIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesOverviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientMessagesOverviewTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  clientMessagesOverviewText: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 3,
  },
  clientMessagesOverviewAction: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesPermissionNote: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 14,
  },
  clientMessagesPermissionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  clientMessagesFeedback: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
  },
  clientMessagesFeedbackText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  clientMessagesFeedbackClose: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesFeedbackRetry: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesFeedbackRetryText: {
    fontSize: 12,
    fontWeight: "900",
  },
  clientMessagesSearchBox: {
    minHeight: 54,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  clientMessagesSearchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  clientMessagesSearchClear: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  unifiedMessagesAdminActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  unifiedMessagesAdminAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  unifiedMessagesAdminSecondaryAction: {
    borderWidth: 1,
  },
  unifiedMessagesAdminActionText: {
    fontSize: 13,
    fontWeight: "900",
  },
  unifiedMessagesAccessCard: {
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  unifiedMessagesAccessIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedMessagesAccessCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedMessagesAccessTitle: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  unifiedMessagesAccessText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  unifiedMessagesAccessButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedMessagesFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 14,
  },
  unifiedMessagesSubHeader: {
    marginBottom: 18,
    gap: 14,
  },
  chatMessagesSubHeader: {
    marginBottom: 10,
    gap: 10,
  },
  unifiedMessagesSubHeaderTop: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chatMessagesSubHeaderTop: {
    minHeight: 48,
  },
  unifiedMessagesSubHeaderCopy: {
    width: "100%",
    minWidth: 0,
  },
  chatMessagesSubHeaderCopy: {
    paddingBottom: 0,
  },
  unifiedMessagesList: {
    gap: 12,
  },
  unifiedConversationCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  unifiedConversationAvatarWrap: {
    position: "relative",
  },
  unifiedConversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedUnreadDot: {
    position: "absolute",
    right: -1,
    top: -1,
    width: 11,
    height: 11,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  unifiedConversationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  unifiedConversationTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unifiedConversationName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  unifiedConversationNameUnread: {
    fontWeight: "900",
  },
  unifiedConversationDate: {
    maxWidth: 82,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
  },
  unifiedConversationSubject: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  unifiedConversationPreview: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  unifiedConversationMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  unifiedMessageBadge: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  unifiedMessageBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  unifiedConversationCount: {
    fontSize: 11,
    fontWeight: "800",
  },
  unifiedReadMini: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unifiedReadMiniText: {
    fontSize: 10,
    fontWeight: "900",
  },
  chatScreenContainer: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 0,
    marginTop: 0,
    paddingHorizontal: 18,
    paddingTop: 0,
  },
  chatFixedHeader: {
    flexShrink: 0,
  },
  chatCompactHeader: {
    minHeight: 58,
    marginHorizontal: -18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatCompactBackButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chatCompactHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  chatCompactHeaderName: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  chatCompactHeaderSubject: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  chatReadFixedHeader: {
    flexShrink: 1,
    minHeight: 0,
    paddingBottom: 18,
  },
  chatMessagesList: {
    flex: 1,
    minHeight: 0,
  },
  chatMessagesListContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  chatMessagesListContentRegular: {
    paddingTop: 18,
  },
  chatMessagesListContentWithReadPanel: {
    paddingTop: 18,
  },
  chatReadScrollContent: {
    paddingTop: 18,
    paddingBottom: 16,
  },
  chatMessageSeparator: {
    height: 12,
  },
  chatComposerFixed: {
    flexShrink: 0,
  },
  unifiedMessagesDetailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  chatMessagesDetailChips: {
    marginBottom: 8,
  },
  unifiedMessagesDetailDate: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: "auto",
  },
  unifiedMessagesThread: {
    gap: 12,
  },
  unifiedMessageBubbleWrap: {
    width: "100%",
    alignItems: "flex-start",
  },
  unifiedMessageBubbleWrapOwn: {
    alignItems: "flex-end",
  },
  unifiedMessageBubble: {
    maxWidth: "86%",
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  unifiedMessageBubbleOwn: {
    minWidth: 76,
    paddingHorizontal: 18,
  },
  unifiedMessageBubbleAuthor: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },
  unifiedMessageBubbleText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  unifiedMessageBubbleDate: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 8,
    alignSelf: "flex-end",
  },
  unifiedReadCard: {
    padding: 15,
    gap: 12,
    marginTop: 14,
  },
  unifiedReadCardScrollable: {
    flexShrink: 1,
    minHeight: 0,
  },
  unifiedReadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  unifiedReadTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  unifiedReadSubtitle: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  unifiedReadTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  unifiedReadFill: {
    height: "100%",
    borderRadius: 999,
  },
  unifiedReadList: {
    gap: 9,
  },
  unifiedReadListScroll: {
    flexShrink: 1,
    minHeight: 0,
  },
  unifiedReadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  unifiedReadUserCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedReadUserName: {
    fontSize: 13,
    fontWeight: "900",
  },
  unifiedReadUserRole: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  unifiedReadStatus: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedReadStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  unifiedComposerCard: {
    padding: 16,
    gap: 14,
  },
  unifiedComposerNotice: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  unifiedComposerNoticeText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  unifiedComposerSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  unifiedComposerSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  unifiedRecipientsCount: {
    fontSize: 12,
    fontWeight: "900",
  },
  unifiedOptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  unifiedOptionButton: {
    width: "48%",
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 18,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  unifiedOptionCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedOptionTitle: {
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  unifiedOptionMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
  },
  unifiedRecipientsBlock: {
    gap: 9,
  },
  unifiedSelectedPersonCard: {
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 66,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unifiedSelectedPersonSmallAction: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedPersonPickerButton: {
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 68,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  unifiedPersonPickerIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedRecipientRow: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 58,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unifiedRecipientCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedRecipientName: {
    fontSize: 13,
    fontWeight: "900",
  },
  unifiedRecipientRole: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  unifiedDeliveryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 9,
  },
  unifiedDateTimeBlock: {
    gap: 9,
  },
  unifiedDateTimeButton: {
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  unifiedDateTimeIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedDateTimeCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedDateTimeValue: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  unifiedDateTimeHint: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  unifiedComposerPreview: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  unifiedComposerPreviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedComposerPreviewTitle: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  unifiedComposerPreviewText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  unifiedMessagesAutomationAction: {
    minHeight: 48,
    borderRadius: 17,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  unifiedAutomationCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  unifiedAutomationSystemCard: {
    marginBottom: 12,
  },
  unifiedAutomationCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedAutomationTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  unifiedAutomationText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  unifiedAutomationMeta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "900",
  },
  unifiedAutomationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  unifiedAutomationSmallButton: {
    minHeight: 34,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  unifiedAutomationSmallText: {
    fontSize: 11,
    fontWeight: "900",
  },
  unifiedPersonModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  unifiedPersonModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  unifiedPersonSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 13,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  unifiedPersonSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  unifiedPersonSheetCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedPersonSheetTitle: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  unifiedPersonSheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  unifiedPersonSheetClose: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  unifiedPersonFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  unifiedPersonResultsMeta: {
    fontSize: 12,
    fontWeight: "900",
  },
  unifiedPersonResultList: {
    flexGrow: 0,
  },
  unifiedPersonResultListContent: {
    gap: 9,
    paddingBottom: 4,
  },
  unifiedPersonRow: {
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  unifiedPersonRowCopy: {
    flex: 1,
    minWidth: 0,
  },
  unifiedPersonRowEmail: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  unifiedPersonEmpty: {
    minHeight: 132,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  unifiedPersonEmptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
  },
  unifiedPersonEmptyText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  unifiedPersonMoreHint: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  unifiedDateSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  unifiedDateInputsRow: {
    flexDirection: "row",
    gap: 10,
  },
  unifiedDateInputGroup: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  unifiedDateInputLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  unifiedDateInputShell: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unifiedDateTextInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "900",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  unifiedDateError: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  unifiedDateErrorText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  unifiedDateModalActions: {
    flexDirection: "row",
    gap: 10,
  },
  unifiedDateModalButton: {
    flex: 1,
  },
  clientMessagesLoadingCard: {
    minHeight: 108,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  clientMessagesLoadingText: {
    fontSize: 13,
    fontWeight: "800",
  },
  clientMessagesConversationList: {
    gap: 12,
  },
  clientMessagesConversationCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  clientMessagesConversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesConversationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  clientMessagesConversationTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clientMessagesConversationTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  clientMessagesConversationTitleUnread: {
    fontWeight: "900",
  },
  clientMessagesConversationDateWrap: {
    maxWidth: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  clientMessagesUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  clientMessagesConversationDate: {
    fontSize: 11,
    fontWeight: "800",
  },
  clientMessagesConversationSubject: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  clientMessagesConversationPreview: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  clientMessagesConversationTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 5,
  },
  clientMessagesMiniTag: {
    minHeight: 27,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  clientMessagesMiniTagText: {
    fontSize: 10,
    fontWeight: "900",
  },
  clientMessagesThreadCard: {
    padding: 14,
    gap: 12,
  },
  clientMessagesBubbleWrap: {
    width: "100%",
    alignItems: "flex-start",
  },
  clientMessagesBubbleWrapOwn: {
    alignItems: "flex-end",
  },
  clientMessagesBubble: {
    maxWidth: "88%",
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  clientMessagesBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  clientMessagesBubbleAuthor: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "900",
  },
  clientMessagesBubbleAutoTag: {
    minHeight: 22,
    borderRadius: 999,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesBubbleAutoText: {
    fontSize: 9,
    fontWeight: "900",
  },
  clientMessagesBubbleText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  clientMessagesBubbleDate: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 8,
    alignSelf: "flex-end",
  },
  clientMessagesReplyBox: {
    borderWidth: 1,
    borderRadius: 24,
    marginTop: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  chatMessagesReplyBox: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clientMessagesReplyInput: {
    flex: 1,
    minWidth: 0,
    maxHeight: 118,
    minHeight: 44,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  chatMessagesReplyInput: {
    minHeight: 40,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  clientMessagesSendButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clientMessagesSendButtonDisabled: {
    opacity: 0.46,
  },
  chatMessagesSendButtonDisabled: {
    opacity: 0.58,
  },
  clientMessagesReplyDisabledCard: {
    marginTop: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  clientMessagesReplyDisabledText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  clientMessagesComposerCard: {
    padding: 16,
    gap: 15,
  },
  clientMessagesComposerNotice: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  clientMessagesComposerNoticeText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  clientMessagesInputShell: {
    minHeight: 58,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clientMessagesTextAreaShell: {
    minHeight: 148,
    alignItems: "flex-start",
    paddingTop: 14,
  },
  clientMessagesInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  clientMessagesTextArea: {
    minHeight: 120,
    lineHeight: 21,
    paddingTop: Platform.OS === "ios" ? 2 : 0,
  },
  trainerMessagesFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  trainerMessagesList: {
    gap: 12,
  },
  trainerMessagesAdminCard: {
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainerMessagesAdminIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerMessagesAdminCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerMessagesAdminTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  trainerMessagesAdminText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  trainerMessagesAdminActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trainerMessagesSmallAction: {
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerMessagesSmallActionText: {
    fontSize: 12,
    fontWeight: "900",
  },
  trainerMessagesPrimarySmallAction: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerMessagesMailboxTabs: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    padding: 5,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trainerMessagesMailboxTab: {
    flex: 1,
    minHeight: 45,
    borderRadius: 16,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  trainerMessagesMailboxText: {
    fontSize: 12,
    fontWeight: "900",
  },
  trainerMessagesMailboxBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerMessagesMailboxBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  trainerMessagesConversationCard: {
    paddingVertical: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  trainerMessagesUnreadRailWrap: {
    width: 5,
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 4,
  },
  trainerMessagesUnreadRail: {
    width: 4,
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
  },
  trainerMessagesConversationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  trainerMessagesConversationTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trainerMessagesConversationTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  trainerMessagesConversationTitleUnread: {
    fontWeight: "900",
  },
  trainerMessagesConversationDate: {
    maxWidth: 82,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
  },
  trainerMessagesConversationSubject: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  trainerMessagesConversationPreview: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  trainerMessagesTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5,
  },
  trainerMessagesTag: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  trainerMessagesTagText: {
    fontSize: 9,
    fontWeight: "900",
  },
  trainerMessagesDetailSummary: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  trainerMessagesDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerMessagesDetailCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerMessagesDetailTitle: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  trainerMessagesDetailMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  trainerMessagesDetailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  trainerMessagesDetailChip: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trainerMessagesDetailChipText: {
    fontSize: 10,
    fontWeight: "900",
  },
  clientHomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  clientHomeHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientHomeEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  clientHomeTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
  },
  clientHomeSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 4,
  },
  clientHomeActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  clientHomeMainButton: {
    flex: 1.25,
  },
  clientHomeSecondaryButton: {
    flex: 1,
  },
  clientHomeMetricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  clientRoutineCard: {
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  clientRoutineIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineHomeThumb: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  clientRoutineCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientRoutineTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  clientRoutineText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 5,
  },
  clientRoutineChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  clientRoutineChip: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineChipText: {
    fontSize: 12,
    fontWeight: "900",
  },
  clientRoutineBackButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineLoadingCard: {
    minHeight: 128,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  clientRoutineList: {
    gap: 12,
  },
  clientRoutineListCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clientRoutineListThumb: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  clientRoutineListIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineListCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientRoutineListTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientRoutineListTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  clientRoutineLevelPill: {
    minHeight: 26,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineLevelText: {
    fontSize: 10,
    fontWeight: "900",
  },
  clientRoutineListDescription: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 4,
  },
  clientRoutineListMeta: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    marginTop: 8,
  },
  clientRoutineDetailCard: {
    padding: 18,
    gap: 16,
  },
  clientRoutineDetailTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  clientRoutineDetailThumb: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  clientRoutineDetailIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineDetailCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientRoutineDetailTitle: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29,
  },
  clientRoutineDetailText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 7,
  },
  clientRoutineDetailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  clientRoutineExerciseList: {
    gap: 12,
  },
  clientRoutineExerciseCard: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  clientRoutineExerciseOrder: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineExerciseOrderText: {
    fontSize: 16,
    fontWeight: "900",
  },
  clientRoutineExerciseMedia: {
    width: 52,
    height: 52,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineExerciseImage: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
  },
  clientRoutineExerciseVideo: {
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineExercisePlayOverlay: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  clientRoutineExerciseCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientRoutineExerciseTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  clientRoutineExerciseMeta: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    marginTop: 4,
  },
  clientRoutineExerciseNotes: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 6,
  },
  clientWorkoutScreen: {
    paddingBottom: 18,
  },
  clientWorkoutProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(100, 116, 139, 0.18)",
    overflow: "hidden",
    marginBottom: 14,
  },
  clientWorkoutProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  clientWorkoutCard: {
    padding: 16,
    gap: 16,
  },
  clientWorkoutMedia: {
    height: 226,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  clientWorkoutImage: {
    width: "100%",
    height: "100%",
  },
  clientWorkoutPlayOverlay: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.74)",
    alignItems: "center",
    justifyContent: "center",
  },
  clientWorkoutVideoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clientWorkoutVideoText: {
    fontSize: 13,
    fontWeight: "900",
  },
  clientWorkoutTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  clientWorkoutNumber: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  clientWorkoutNumberText: {
    fontSize: 18,
    fontWeight: "900",
  },
  clientWorkoutCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientWorkoutTitle: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  clientWorkoutMeta: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 5,
  },
  clientWorkoutNotes: {
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  clientWorkoutNotesText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  clientWorkoutRestPill: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 13,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  clientWorkoutRestText: {
    fontSize: 13,
    fontWeight: "900",
  },
  clientWorkoutCompleteButton: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clientWorkoutCompleteText: {
    fontSize: 15,
    fontWeight: "900",
  },
  clientWorkoutNavigationRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 12,
  },
  clientWorkoutNavButton: {
    flex: 1,
  },
  clientWorkoutFinishButton: {
    marginTop: 4,
  },
  clientWorkoutCompletedScreen: {
    justifyContent: "center",
  },
  clientWorkoutCompletedCard: {
    minHeight: 292,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  clientWorkoutCompletedIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  clientWorkoutCompletedTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center",
  },
  clientWorkoutCompletedText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    textAlign: "center",
  },
  trainerHomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  trainerHomeHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerHomeLoadingCard: {
    minHeight: 120,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  trainerHomeLoadingText: {
    fontSize: 13,
    fontWeight: "800",
  },
  trainerHomeMetricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  trainerNextClassCard: {
    overflow: "hidden",
    marginBottom: 14,
  },
  trainerNextClassImage: {
    height: 190,
    padding: 16,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  trainerNextClassImageStyle: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  trainerNextClassShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
  },
  trainerNextClassBadge: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trainerNextClassBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  trainerNextClassBody: {
    padding: 18,
    gap: 14,
  },
  trainerNextClassTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  trainerNextClassCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerNextClassTime: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  trainerNextClassTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
  },
  trainerNextClassText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  trainerNextClassCapacity: {
    minWidth: 76,
    minHeight: 66,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  trainerNextClassCapacityValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  trainerNextClassCapacityLabel: {
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },
  trainerNextClassMetaGrid: {
    gap: 9,
  },
  trainerNextClassMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trainerNextClassMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  trainerNextEmptyCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 14,
  },
  trainerNextEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerNextEmptyCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerNextEmptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  trainerNextEmptyText: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 3,
  },
  trainerNextEmptyButton: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerNextEmptyButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  trainerTodayAgendaList: {
    gap: 12,
  },
  trainerDayDoneBanner: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  trainerDayDoneText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  trainerAgendaClassCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainerAgendaClassCardDone: {
    opacity: 0.62,
  },
  trainerAgendaTimeBox: {
    width: 66,
    minHeight: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerAgendaTimeText: {
    fontSize: 18,
    fontWeight: "900",
  },
  trainerAgendaClassCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerAgendaClassTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  trainerAgendaClassMeta: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  trainerAgendaStatusPill: {
    minHeight: 31,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trainerAgendaStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  trainerQuickActionsGrid: {
    marginRight: -20,
  },
  trainerQuickActionsContent: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 4,
  },
  trainerQuickActionCard: {
    flexShrink: 0,
    minHeight: 132,
    padding: 13,
    gap: 8,
  },
  trainerQuickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerQuickActionTitle: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  trainerQuickActionText: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  trainerClassList: {
    gap: 12,
  },
  trainerClassAgendaCard: {
    padding: 16,
    gap: 14,
  },
  trainerClassAgendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainerClassAgendaFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  trainerClassAgendaMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  trainerClassAgendaMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  trainerClassAgendaDetailButton: {
    minHeight: 42,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  trainerClassAgendaDetailText: {
    fontSize: 13,
    fontWeight: "900",
  },
  trainerStudentList: {
    gap: 10,
  },
  trainerStudentCard: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainerStudentCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerStudentName: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  trainerStudentMeta: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  trainerStudentBadge: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerRoutineMainButton: {
    marginBottom: 14,
  },
  trainerRoutineSearch: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  trainerRoutineSearchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },
  trainerRoutineFilterRow: {
    gap: 10,
    paddingRight: 20,
    paddingBottom: 2,
  },
  trainerRoutineList: {
    gap: 12,
  },
  trainerRoutineCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainerRoutineIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerRoutineThumb: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  trainerRoutineCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerRoutineCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trainerRoutineCardTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  trainerRoutineLevelPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  trainerRoutineLevelText: {
    fontSize: 11,
    fontWeight: "900",
  },
  trainerRoutineDescription: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 5,
  },
  trainerRoutineMeta: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
  },
  trainerRoutineTopBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 16,
  },
  trainerRoutineTopCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerRoutineTopTitle: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29,
  },
  trainerRoutineDetailHero: {
    padding: 18,
    gap: 16,
  },
  trainerRoutineDetailTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  trainerRoutineDetailIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerRoutineDetailCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerRoutineDetailTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
  },
  trainerRoutineDetailText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 7,
  },
  trainerRoutineDetailStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  trainerRoutineMetric: {
    width: "47.5%",
    minHeight: 82,
    borderRadius: 20,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  trainerRoutineMetricValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  trainerRoutineMetricLabel: {
    fontSize: 11,
    fontWeight: "900",
  },
  trainerRoutineActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  trainerRoutineActionButton: {
    flex: 1,
  },
  trainerRoutineDuplicateAction: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  trainerRoutineDuplicateText: {
    fontSize: 13,
    fontWeight: "900",
  },
  trainerRoutineExerciseList: {
    gap: 12,
  },
  trainerRoutineAssignedPreview: {
    gap: 10,
  },
  trainerRoutineStudentCompact: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trainerRoutineDangerLink: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 22,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  trainerRoutineDangerText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "900",
  },
  trainerRoutineFormCard: {
    padding: 18,
    gap: 14,
  },
  trainerRoutineEditorSummary: {
    padding: 16,
    marginBottom: 4,
  },
  trainerRoutineEditorTitle: {
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
  },
  trainerRoutineEditorMeta: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },
  trainerRoutineExerciseForm: {
    padding: 16,
    gap: 13,
    marginBottom: 14,
  },
  trainerRoutineFormTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  trainerRoutineInputGroup: {
    gap: 7,
  },
  trainerRoutineInputGroupCompact: {
    flex: 1,
    minWidth: 0,
  },
  trainerRoutineInputLabel: {
    fontSize: 13,
    fontWeight: "900",
  },
  trainerRoutineInputShell: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  trainerRoutineInputShellCompact: {
    paddingHorizontal: 10,
    gap: 6,
  },
  trainerRoutineInputIcon: {
    flexShrink: 0,
  },
  trainerRoutineTextAreaShell: {
    minHeight: 106,
    alignItems: "flex-start",
    paddingTop: 13,
  },
  trainerRoutineInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },
  trainerRoutineInputCompact: {
    fontSize: 14,
    minWidth: 64,
  },
  trainerRoutineInputWithUnit: {
    paddingRight: 1,
  },
  trainerRoutineInputUnit: {
    minWidth: 18,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  trainerRoutineInputError: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
  },
  trainerRoutineTextArea: {
    minHeight: 76,
    lineHeight: 21,
  },
  trainerRoutineMediaTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 2,
  },
  trainerRoutineMediaPicker: {
    minHeight: 74,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trainerRoutineMediaPreview: {
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  trainerRoutineMediaImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  trainerRoutineVideoPreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerRoutineMediaCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerRoutineMediaTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  trainerRoutineMediaMeta: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 2,
  },
  trainerRoutineMediaActions: {
    flexDirection: "row",
    gap: 7,
  },
  trainerRoutineMediaIconButton: {
    width: 35,
    height: 35,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerRoutineExerciseGrid: {
    flexDirection: "row",
    gap: 8,
  },
  trainerRoutineFormActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  trainerRoutineExerciseSaveButton: {
    flex: 1.15,
    minWidth: 0,
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  trainerRoutineExerciseSaveText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  trainerRoutineExerciseCancelButton: {
    flex: 0.9,
    minWidth: 94,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerRoutineExerciseCancelText: {
    fontSize: 14,
    fontWeight: "900",
  },
  trainerRoutineActionDisabled: {
    opacity: 0.48,
  },
  trainerExerciseCard: {
    padding: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 11,
  },
  trainerExerciseOrder: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerExerciseOrderText: {
    fontSize: 16,
    fontWeight: "900",
  },
  trainerExerciseMediaButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  trainerExerciseThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
  },
  trainerExerciseVideoThumb: {
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerExerciseCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerExerciseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trainerExerciseTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  trainerExerciseMeta: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    marginTop: 4,
  },
  trainerExerciseNotes: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 6,
  },
  trainerExerciseActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },
  trainerExerciseIconButton: {
    minWidth: 38,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  trainerExerciseActionRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },
  trainerExerciseSortActions: {
    flexDirection: "row",
    gap: 7,
  },
  trainerExerciseEditActions: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  trainerExerciseMiniButton: {
    minWidth: 38,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerExerciseActionPill: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trainerExerciseActionText: {
    fontSize: 12,
    fontWeight: "900",
  },
  trainerMediaModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.88)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },
  trainerMediaModalCard: {
    width: "100%",
    maxHeight: "94%",
    borderRadius: 28,
    padding: 12,
    gap: 12,
  },
  trainerMediaModalHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },
  trainerMediaModalTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerMediaModalKicker: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
  },
  trainerMediaModalTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 2,
  },
  trainerMediaModalClose: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerMediaStage: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  trainerMediaVideo: {
    width: "100%",
    height: "100%",
  },
  trainerMediaImageFull: {
    width: "100%",
    height: "100%",
  },
  trainerRoutineStudentList: {
    gap: 10,
  },
  trainerRoutineStudentCard: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  trainerRoutineStudentCopy: {
    flex: 1,
    minWidth: 0,
  },
  trainerRoutineStudentName: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  trainerRoutineStudentMeta: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  trainerRoutineRemoveStudent: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  trainerRoutineStickyAction: {
    marginTop: 14,
    marginBottom: 4,
  },
  trainerRoutineFeedback: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  trainerRoutineFeedbackText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
  },
  clientClassesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  clientClassesHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientClassWeekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  clientClassWeekCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientClassWeekLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  clientClassWeekRange: {
    fontSize: 17,
    fontWeight: "900",
  },
  clientClassWeekControls: {
    flexDirection: "row",
    gap: 8,
  },
  clientClassWeekButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clientClassWeekButtonDisabled: {
    opacity: 0.42,
  },
  clientClassFilterList: {
    gap: 10,
    paddingTop: 14,
    paddingRight: 20,
    paddingBottom: 2,
  },
  clientClassList: {
    gap: 12,
  },
  clientClassAgendaCard: {
    padding: 16,
    gap: 14,
  },
  clientClassAgendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clientClassTimeBadge: {
    minWidth: 68,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  clientClassTimeText: {
    fontSize: 19,
    fontWeight: "900",
  },
  clientClassAgendaCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientClassName: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  clientClassMetaLine: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  clientClassStatusPill: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  clientClassStatusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  clientClassAgendaFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  clientClassSpaces: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  clientClassSpacesText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  clientClassReserveButton: {
    minHeight: 42,
    minWidth: 96,
    borderRadius: 15,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  clientClassReserveButtonDisabled: {
    opacity: 0.5,
  },
  clientClassReserveButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  clientClassDetailTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  clientClassBackButton: {
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
  clientClassDetailHero: {
    minHeight: 270,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 20,
    backgroundColor: "#CBD5E1",
  },
  clientClassDetailHeroImage: {
    borderRadius: 28,
  },
  clientClassDetailShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  clientClassDetailHeroCopy: {
    gap: 6,
  },
  clientClassDetailEyebrow: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  clientClassDetailTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 36,
  },
  clientClassDetailDescription: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 16,
  },
  clientClassDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  clientClassInfoItem: {
    width: "48%",
    minHeight: 116,
    padding: 14,
    gap: 6,
  },
  clientClassInfoLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  clientClassInfoValue: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  clientClassDetailAction: {
    marginTop: 18,
  },
  clientClassCancelButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  clientClassCancelButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  clientClassFeedback: {
    marginTop: 16,
    padding: 15,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  clientClassFeedbackIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clientClassFeedbackCopy: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "transparent",
  },
  clientClassFeedbackTitle: {
    fontSize: 15,
    fontWeight: "900",
    backgroundColor: "transparent",
  },
  clientClassFeedbackText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 3,
    backgroundColor: "transparent",
  },
  clientReservationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  clientReservationsHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientReservationsTabs: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  clientReservationsTab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  clientReservationsTabText: {
    fontSize: 13,
    fontWeight: "900",
  },
  clientReservationsList: {
    gap: 12,
  },
  clientReservationHeroCard: {
    overflow: "hidden",
  },
  clientReservationHeroImage: {
    height: 176,
    padding: 16,
  },
  clientReservationHeroImageStyle: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  clientReservationHeroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    minHeight: 176,
  },
  clientReservationHeroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
  },
  clientReservationHeroBadge: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clientReservationHeroBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  clientReservationHeroBody: {
    padding: 18,
    gap: 12,
  },
  clientReservationTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  clientReservationTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientReservationHeroTitle: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29,
  },
  clientReservationHeroMeta: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 5,
  },
  clientReservationStatusPill: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  clientReservationStatusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  clientReservationInfoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clientReservationInfoText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  clientReservationSubtleCancel: {
    alignSelf: "flex-start",
    minHeight: 38,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  clientReservationSubtleCancelText: {
    fontSize: 13,
    fontWeight: "900",
  },
  clientReservationCompactCard: {
    padding: 15,
    flexDirection: "row",
    gap: 13,
  },
  clientReservationTimeBox: {
    width: 72,
    minHeight: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  clientReservationTimeText: {
    fontSize: 19,
    fontWeight: "900",
  },
  clientReservationCompactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  clientReservationCompactTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: "900",
  },
  clientReservationCompactMeta: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  clientReservationInlineCancel: {
    alignSelf: "flex-start",
    paddingTop: 2,
  },
  clientReservationInlineCancelText: {
    fontSize: 12,
    fontWeight: "900",
  },
  clientReservationHistoryCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    opacity: 0.86,
  },
  clientReservationHistoryCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientReservationHistoryTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  clientReservationHistoryMeta: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 4,
  },
  clientReservationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.36)",
    justifyContent: "flex-end",
  },
  clientReservationSheet: {
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
  clientReservationSheetIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  clientReservationSheetTitle: {
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 28,
  },
  clientReservationSheetText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },
  clientReservationSheetPrimary: {
    marginBottom: 10,
  },
  clientReservationSheetDanger: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clientReservationSheetDangerText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "900",
  },
  clientReservationFeedback: {
    marginBottom: 16,
    padding: 15,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  clientAccountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 18,
  },
  clientAccountBackButton: {
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
  clientAccountFormCard: {
    padding: 16,
    gap: 15,
  },
  clientAccountInputGroup: {
    gap: 8,
  },
  clientAccountLabel: {
    fontSize: 13,
    fontWeight: "900",
  },
  clientAccountInputShell: {
    minHeight: 58,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clientAccountInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  clientAccountInputAction: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  clientAccountHint: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  clientAccountHintText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  clientAccountFeedback: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  clientAccountFeedbackText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  clientProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  clientProfileHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientProfileHeaderAvatar: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  clientProfileAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  clientProfileAvatarText: {
    fontSize: 18,
    fontWeight: "900",
  },
  clientProfileCameraBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  clientProfileIdentityCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  clientProfileIdentityIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  clientProfileIdentityCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientProfileName: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  clientProfileEmail: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  clientProfileGroup: {
    marginTop: 22,
  },
  clientProfileGroupTitle: {
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },
  clientProfileGroupCard: {
    paddingVertical: 4,
    overflow: "hidden",
  },
  clientProfileRow: {
    minHeight: 70,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clientProfileRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  clientProfileRowCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientProfileRowTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
  },
  clientProfileRowDescription: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  clientProfileRowBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  clientProfileRowBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  brandHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandTitle: {
    color: "#F8FAFC",
    fontSize: 26,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: "#A7B0BD",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  brandProfileButton: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerProfileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  logoMarkImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  homeTopBar: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  homeIdentity: {
    flex: 1,
  },
  homeGymName: {
    color: "#F8FAFC",
    fontSize: 23,
    fontWeight: "900",
  },
  homeRoleText: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  homeProfileButton: {
    width: 66,
    minHeight: 58,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  homeProfileText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 1,
  },
  homeCoverImage: {
    borderRadius: 8,
  },
  homeHero: {
    borderRadius: 8,
    overflow: "hidden",
    minHeight: 272,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  homeHeroImage: {
    borderRadius: 8,
  },
  homeHeroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 24,
    backgroundColor: "rgba(5,7,10,0.76)",
  },
  homeHeroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  homeHeroIconShell: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.24)",
  },
  homeHeroCopy: {
    flex: 1,
    minWidth: 0,
  },
  homeProfileName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
  },
  homeInsightCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 14,
  },
  homeInsightLabel: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  homeInsightValue: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 7,
  },
  homeInsightMeta: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  homeSectionTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
  },
  homeSectionMeta: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  homeFeaturedCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  homeFeaturedInfo: {
    flex: 1,
    minWidth: 0,
  },
  homeFeaturedLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  homeFeaturedLabel: {
    fontSize: 14,
    fontWeight: "900",
  },
  homeFeaturedTitle: {
    color: "#F8FAFC",
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 8,
  },
  homeFeaturedMeta: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  homeFeaturedImageBox: {
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: "hidden",
  },
  homeFeaturedImage: {
    flex: 1,
  },
  homeFeaturedImageStyle: {
    borderRadius: 8,
  },
  homeAgendaCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  homeAgendaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#263241",
  },
  homeAgendaDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  homeAgendaInfo: {
    flex: 1,
    minWidth: 0,
  },
  homeAgendaTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
  },
  homeAgendaMeta: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  homeAgendaTime: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
    maxWidth: 92,
  },
  homeAgendaEmpty: {
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  homeAgendaEmptyText: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    backgroundColor: "#111722",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#263241",
  },
  backButtonText: {
    color: "#F8FAFC",
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  dashboardStatCard: {
    width: "48%",
    minHeight: 112,
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 15,
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  dashboardStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dashboardStatValue: {
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 34,
  },
  dashboardStatLabel: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "left",
    marginTop: 3,
  },
  sectionHeaderBlock: {
    marginBottom: 10,
  },
  sectionKicker: {
    color: "#8290A3",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 3,
  },
  classCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#263241",
  },
  className: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  classDescription: {
    marginTop: 8,
    fontSize: 15,
    color: "#A7B0BD",
    lineHeight: 22,
  },
  classFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#263241",
    paddingTop: 12,
  },
  classMeta: {
    fontSize: 14,
    color: "#A7B0BD",
    marginBottom: 4,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: "#E33B3B",
    borderWidth: 1,
    borderColor: "#E33B3B",
    borderRadius: 8,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  featureScreen: {
    gap: 14,
    marginBottom: 24,
  },
  featureHero: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  featureHeroIcon: {
    width: 74,
    height: 74,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  featureTitle: {
    color: "#F8FAFC",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  featureSubtitle: {
    color: "#A7B0BD",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },
  featureCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  featureCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureCardTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  featureCardText: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  routineCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  routineIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  routineCopy: {
    flex: 1,
    minWidth: 0,
  },
  routineTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  routineMeta: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 9,
  },
  routineTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#263241",
    overflow: "hidden",
  },
  routineFill: {
    height: "100%",
    borderRadius: 999,
  },
  routineLevelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#1A2330",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  routineLevelText: {
    color: "#A7B0BD",
    fontSize: 11,
    fontWeight: "900",
  },
  adminPersonalizationCard: {
    padding: 18,
    marginBottom: 8,
  },
  adminPersonalizationInput: {
    minHeight: 52,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
  },
  adminPersonalizationSave: {
    marginTop: 20,
  },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  formSectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formSectionCopy: {
    flex: 1,
    minWidth: 0,
  },
  formSectionTitleText: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
  },
  formSectionHint: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  messageStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  messageStatCard: {
    flex: 1,
    minWidth: 132,
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    backgroundColor: "#0B1017",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  messageStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  messageStatCopy: {
    flex: 1,
    minWidth: 0,
  },
  messageStatValue: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "900",
  },
  messageStatLabel: {
    color: "#A7B0BD",
    fontSize: 10,
    fontWeight: "900",
  },
  messageInboxOverview: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  messageNavigationPanel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  colorPickerRow: {
    flexDirection: "column",
    gap: 12,
    marginTop: 20,
  },
  personalizationSectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 12,
  },
  brandPreviewCard: {
    backgroundColor: "#111722",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
    overflow: "hidden",
  },
  brandPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  brandPreviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandPreviewTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
  },
  brandPreviewRole: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
  brandPreviewGreeting: {
    color: "#F8FAFC",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 7,
  },
  brandPreviewText: {
    color: "#A7B0BD",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  rgbPreviewDisc: {
    width: 92,
    height: 92,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  rgbPreviewText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    textShadowColor: "#111827",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rgbRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  rgbLabel: {
    width: 14,
    color: "#111827",
    fontSize: 12,
    fontWeight: "900",
  },
  rgbStepButton: {
    minWidth: 24,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  rgbStepText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 11,
  },
  rgbInput: {
    flex: 1,
    minWidth: 38,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    color: "#111827",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  helperText: {
    marginTop: 12,
    fontSize: 15,
    color: "#A7B0BD",
    fontWeight: "700",
  },
  selectorCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  groupClassImage: {
    width: "100%",
    height: "100%",
  },
  groupClassDetailImage: {
    width: "100%",
    height: 190,
    borderRadius: 8,
    marginTop: 14,
    marginBottom: 16,
  },

  groupClassDaysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 10,
  },

  groupClassDayPill: {
    backgroundColor: "#0B1017",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  groupClassDayText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  groupClassFooter: {
    borderTopWidth: 1,
    borderTopColor: "#263241",
    paddingTop: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  groupClassMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0B1017",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },

  groupClassMeta: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
  },

  detailDescription: {
    color: "#A7B0BD",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: -6,
    marginBottom: 12,
  },

  classDayManagerCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 12,
    marginBottom: 12,
  },

  classDayManagerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  classDayManagerCopy: {
    flex: 1,
    minWidth: 0,
  },

  classDayManagerTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
  },

  classDayManagerText: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },

  addDayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  addDayButton: {
    minWidth: 46,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#0B1017",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
  },

  addDayButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },

  deleteDayButton: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF7F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },

  deleteDayButtonText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "900",
  },

  classDayBlock: {
    marginTop: 8,
  },

  classDayTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    textTransform: "capitalize",
    marginBottom: 8,
  },

  classHourComposerCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  classHourComposerCopy: {
    flex: 1,
    minWidth: 0,
  },

  classHourComposerTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
  },

  classHourComposerText: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  classHourComposerInput: {
    width: 82,
    minHeight: 46,
    textAlign: "center",
    fontWeight: "900",
  },

  classHourRow: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  classHourInfo: {
    flex: 1,
  },

  classHourTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },

  classHourEditBox: {
    marginBottom: 5,
  },

  classHourEditLabel: {
    color: "#A7B0BD",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  classHourEditInput: {
    maxWidth: 118,
    minHeight: 46,
    textAlign: "center",
    fontWeight: "900",
  },

  classHourMeta: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },

  classReservationList: {
    marginTop: 8,
    gap: 4,
  },

  classReservationText: {
    alignSelf: "flex-start",
    backgroundColor: "#1A2330",
    borderRadius: 999,
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "900",
    paddingVertical: 5,
    paddingHorizontal: 9,
  },

  classHourActions: {
    minWidth: 104,
    gap: 8,
    alignItems: "stretch",
  },

  classActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: -4,
    marginBottom: 10,
  },
  classImageEditButton: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#0B1017",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },

  classActionButton: {
    flex: 1,
    backgroundColor: "#0B1017",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  classActionText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 13,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  filterText: {
    color: "#A7B0BD",
    fontWeight: "800",
    marginRight: 8,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },

  tableCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  tableRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#263241",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  tableTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
  },

  tableMeta: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  toggleDot: {
    width: 34,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#F8FAFC",
    backgroundColor: "#0B1017",
  },

  toggleText: {
    color: "#F8FAFC",
    fontWeight: "900",
  },

  messageCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  messageTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5,
  },

  messageBody: {
    color: "#A7B0BD",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },

  quickActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  quickActionButton: {
    flex: 1,
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  quickActionText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  addUserPill: {
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
    alignSelf: "flex-end",
    shadowColor: "#EF4444",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  addUserPillText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  smallOutlineButton: {
    borderWidth: 1,
    borderColor: "#263241",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    alignItems: "center",
  },

  smallOutlineButtonText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "900",
  },

  smallGhostButton: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: "#1A2330",
    alignItems: "center",
  },

  smallGhostButtonText: {
    color: "#A7B0BD",
    fontSize: 11,
    fontWeight: "900",
  },

  smallDangerButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF7F7",
    paddingVertical: 7,
    paddingHorizontal: 9,
    alignItems: "center",
  },

  smallDangerButtonText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "900",
  },

  dangerButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: -4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },

  dangerButtonText: {
    color: "#B91C1C",
    fontWeight: "900",
    fontSize: 14,
  },

  activityCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#263241",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  activityCover: {
    height: 150,
    justifyContent: "flex-end",
    padding: 13,
  },

  activityCoverImage: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  activityCoverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,10,0.26)",
  },

  activityCoverBadge: {
    alignSelf: "flex-start",
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  activityCoverBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
  },

  activityIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  activityImage: {
    width: "100%",
    height: "100%",
  },

  activityTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  activityTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 4,
  },

  activityDescription: {
    fontSize: 14,
    color: "#A7B0BD",
    lineHeight: 20,
  },

  activityMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  activityMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0B1017",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  activityMeta: {
    fontSize: 12,
    color: "#F8FAFC",
    fontWeight: "900",
  },

  classDetailHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  classDetailCopy: {
    flex: 1,
    minWidth: 0,
  },
  classDetailTitle: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
    marginBottom: 10,
  },
  classDetailText: {
    color: "#A7B0BD",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  classDetailImageBox: {
    width: 126,
    height: 126,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1A2330",
  },
  classDetailImage: {
    flex: 1,
  },
  classDetailImageStyle: {
    borderRadius: 8,
  },

  secondaryButton: {
    backgroundColor: "#111722",
    borderWidth: 1,
    borderColor: "#263241",
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 18,
  },

  secondaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
  },

  hourButton: {
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#263241",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  hourButtonIcon: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  hourButtonInfo: {
    flex: 1,
    minWidth: 0,
  },

  hourButtonRight: {
    alignItems: "flex-end",
    gap: 4,
  },

  hourTrainerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  hourTrainerInitials: {
    fontSize: 13,
    fontWeight: "900",
  },

  hourButtonDisabled: {
    backgroundColor: "#0B1017",
    borderColor: "#263241",
  },

  hourButtonTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 4,
  },

  hourButtonTitleDisabled: {
    color: "#9CA3AF",
  },

  hourButtonSubtitle: {
    fontSize: 13,
    color: "#A7B0BD",
    fontWeight: "700",
  },

  hourButtonSubtitleDisabled: {
    color: "#9CA3AF",
  },

  hourButtonSpaces: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "900",
  },

  hourButtonSpacesDisabled: {
    color: "#9CA3AF",
  },

  confirmationCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: "#86EFAC",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  confirmationIcon: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmationCopy: {
    flex: 1,
    minWidth: 0,
  },

  confirmationTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#166534",
    marginBottom: 8,
  },

  confirmationText: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "700",
    marginBottom: 4,
  },

  profileScreenCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  profileHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },

  profileHeroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  profileEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },

  profileHeroInitials: {
    fontSize: 27,
    fontWeight: "900",
  },

  profileHeroCopy: {
    flex: 1,
    minWidth: 0,
  },

  profileHeroName: {
    color: "#F8FAFC",
    fontSize: 25,
    fontWeight: "900",
  },

  profileHeroRole: {
    color: "#A7B0BD",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },

  profileHeroHint: {
    alignSelf: "flex-start",
    backgroundColor: "#0B1017",
    borderRadius: 999,
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  profileActionList: {
    gap: 12,
  },

  logoutCardButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 16,
  },

  logoutCardText: {
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "900",
  },

  profilePanel: {
    display: "none",
    backgroundColor: "#111722",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#263241",
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1017",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  avatarText: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
  },

  profileTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#F8FAFC",
    textAlign: "center",
  },

  profileHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: "#A7B0BD",
  },

  profileActionGrid: {
    width: "100%",
    marginTop: 16,
    gap: 10,
  },

  profileActionButton: {
    borderWidth: 1,
    borderColor: "#263241",
    backgroundColor: "#0B1017",
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },

  profileActionMuted: {
    borderColor: "#263241",
    backgroundColor: "#0B1017",
  },

  profileActionTitle: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textAlign: "center",
  },

  profileActionSubtitle: {
    marginTop: 4,
    color: "#A7B0BD",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },

  searchInput: {
    backgroundColor: "#0B1017",
    borderWidth: 1,
    borderColor: "#263241",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#F8FAFC",
    marginBottom: 14,
  },

  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },

  listResultMeta: {
    color: "#A7B0BD",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  filterChip: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#263241",
    backgroundColor: "#0B1017",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterChipActive: {
    borderColor: "transparent",
    shadowColor: "#EF4444",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  filterChipDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },

  filterChipText: {
    color: "#A7B0BD",
    fontSize: 14,
    fontWeight: "900",
  },

  filterChipTextActive: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  bottomDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    backgroundColor: "#0B1017",
    borderTopWidth: 1,
    borderTopColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },

  bottomDockInFlow: {
    position: "relative",
    flexShrink: 0,
  },

  bottomDockButton: {
    flex: 1,
    minHeight: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderTopWidth: 3,
    borderTopColor: "transparent",
  },

  bottomDockButtonActive: {
    backgroundColor: "transparent",
  },

  bottomDockButtonDisabled: {
    opacity: 0.45,
  },

  bottomDockIconWrap: {
    position: "relative",
    minWidth: 30,
    alignItems: "center",
  },

  notificationBadge: {
    position: "absolute",
    top: -9,
    right: -12,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0B1017",
  },

  notificationBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 12,
  },

  bottomDockText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },

  bottomDockTextActive: {
    color: "#F8FAFC",
  },

  adminMenuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  adminMenuButton: {
    width: "48%",
    minHeight: 154,
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#263241",
    justifyContent: "space-between",
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },

  adminMenuIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  adminMenuTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminMenuArrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  adminMenuCopy: {
    flex: 1,
    minWidth: 0,
  },

  adminMenuButtonTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 4,
  },

  adminMenuButtonSubtitle: {
    flex: 1,
    fontSize: 13,
    color: "#A7B0BD",
    lineHeight: 18,
    fontWeight: "800",
  },

  adminBackButton: {
    backgroundColor: "#111722",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#263241",
  },

  adminBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
  },
});
