import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
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
import GymDashboardPreview from "../../src/components/admin/GymDashboardPreview";
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
import ClientDashboard from "../../src/components/client/ClientDashboard";
import ClientClasses from "../../src/components/client/ClientClasses";
import ClientRoutines from "../../src/components/client/ClientRoutines";
import ClientReservations from "../../src/components/client/ClientReservations";
import MemberProfile, {
  type MemberProfileSection,
} from "../../src/components/profile/MemberProfile";
import {
  ProfileDetailsScreen,
  ProfilePasswordScreen,
} from "../../src/components/profile/ProfileAccountScreens";
import { ProfilePhotoSourceSheet } from "../../src/components/media/ProfilePhotoSourceSheet";
import {
  MessageFeedback,
  MessageFormField,
  type MessageFeedbackValue,
} from "../../src/components/messages/MessageFormControls";
import {
  MessageChatHeader,
  MessageConversationCard,
  obtenerNombreChatSinRol,
} from "../../src/components/messages/MessageConversation";
import {
  MessageBubble,
  MessageReadPanel,
  MessageReplyComposer,
} from "../../src/components/messages/MessageThreadComponents";
import {
  MessageDateSelectorModal,
  MessageRecipientSelectorModal,
} from "../../src/components/messages/MessageSelectorModals";
import OneRepMaxCalculator, {
  OneRepMaxAccessCard,
} from "../../src/components/routines/OneRepMaxCalculator";
import RoutineMediaModal, {
  type RoutineMediaItem,
} from "../../src/components/routines/RoutineMediaModal";
import TrainerDashboard from "../../src/components/trainer/TrainerDashboard";
import TrainerClasses from "../../src/components/trainer/TrainerClasses";
import TrainerRoutineAssignments from "../../src/components/trainer/TrainerRoutineAssignments";
import TrainerRoutineExercises, {
  TrainerRoutineExerciseCard,
  type TrainerExerciseTextField,
} from "../../src/components/trainer/TrainerRoutineExercises";
import TrainerRoutineForm from "../../src/components/trainer/TrainerRoutineForm";
import TrainerRoutinesOverview from "../../src/components/trainer/TrainerRoutinesOverview";
import GymFlowLogin, {
  GymFlowSessionError,
  GymFlowSessionLoading,
  type GymFlowLoginCredentials,
} from "../../src/components/auth/GymFlowLogin";
import {
  Avatar as PremiumAvatar,
  Card as PremiumCard,
  DashboardBackdrop,
  EmptyState as PremiumEmptyState,
  FilterChip as PremiumFilterChip,
  PrimaryButton as PremiumPrimaryButton,
  ScreenContainer as PremiumScreenContainer,
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
import {
  crearFechaKeyLocal,
  crearFechaLocalDesdeKey,
  formatearDia,
  formatearFechaCompleta,
  normalizarFechaLocal,
  obtenerFechaKey,
  obtenerHora,
  obtenerLunesSemanaLocal,
  sumarDiasFechaLocal,
} from "../../src/features/classes/classDateUtils";
import {
  colorConAlpha,
  hexToHsl,
  mezclarColores,
  obtenerColorContraste,
} from "../../src/theme/colorUtils";
import { styles } from "../../src/theme/homeScreenStyles";

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
type AudienciaMensaje = "TODOS" | "CLIENTES" | "ENTRENADORES" | "INDIVIDUAL";
type TipoProgramacionMensajeApp = "AHORA" | "FECHA" | "RECURRENTE";
type FrecuenciaMensajeApp = "NINGUNA" | "DIARIA" | "SEMANAL" | "MENSUAL";
type EstadoMensajeApp = "ENVIADO" | "PROGRAMADO" | "ACTIVO" | "PAUSADO";
type PrioridadMensajeApp = "NORMAL" | "IMPORTANTE" | "URGENTE";
type FeedbackMensajesCliente = MessageFeedbackValue;
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
type RutinaMultimediaActiva = RoutineMediaItem;
const DIAS_CLASE = [
  { id: 1, corto: "L", nombre: "Lunes" },
  { id: 2, corto: "M", nombre: "Martes" },
  { id: 3, corto: "X", nombre: "Miércoles" },
  { id: 4, corto: "J", nombre: "Jueves" },
  { id: 5, corto: "V", nombre: "Viernes" },
  { id: 6, corto: "S", nombre: "Sábado" },
  { id: 0, corto: "D", nombre: "Domingo" },
];
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

  function renderDashboardPreview(context: GymPreviewContext) {
    return (
      <GymDashboardPreview
        context={context}
        fallbackGymName={nombreGimnasioApp}
        classes={clasesActivasGimnasio}
        dockHeight={bottomDockHeight}
        dockBottomInset={bottomDockBottomInset}
      />
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
    return (
      <RoutineMediaModal
        item={multimediaRutinaActiva}
        windowWidth={windowWidth}
        theme={clienteHomeTheme}
        onClose={() => setMultimediaRutinaActiva(null)}
      />
    );
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

  function renderCabeceraChatCompacta({
    participante,
    asunto,
    onBack,
  }: {
    participante: ReturnType<typeof obtenerParticipanteConversacion>;
    asunto: string;
    onBack: () => void;
  }) {
    return (
      <MessageChatHeader
        participant={participante}
        subject={asunto}
        theme={clienteHomeTheme}
        secondaryColor={colorSecundarioVisibleApp}
        textColor={obtenerColorContraste(colorSecundarioVisibleApp)}
        onBack={onBack}
      />
    );
  }
  function renderTarjetaConversacionUnificada(
    conversacion: ConversacionMensaje,
    rolVista: RolMensajesVista,
  ) {
    const mensaje = conversacion.mensaje;
    const participante = obtenerParticipanteConversacion(conversacion, rolVista);
    const esPropio = mensajeEnviadoPorUsuarioActual(mensaje);
    const prioridad = conversacion.mensajes.find(
      (mensajeHilo) =>
        mensajeHilo.prioridad === "IMPORTANTE" ||
        mensajeHilo.prioridad === "URGENTE",
    )?.prioridad;
    const lecturas = obtenerLecturasMensaje(mensaje);
    const mostrarLecturas =
      rolVista === "ADMIN" &&
      esPropio &&
      lecturas.total > 1 &&
      participante.esComunicado;

    return (
      <MessageConversationCard
        key={conversacion.id}
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        participant={participante}
        isOwn={esPropio}
        unreadCount={conversacion.noLeidos}
        total={conversacion.total}
        date={mensaje.fecha}
        subject={obtenerAsuntoMensaje(mensaje)}
        messagePreview={mensaje.texto}
        priority={prioridad ? obtenerConfigPrioridadMensaje(prioridad) : undefined}
        readReceipt={
          mostrarLecturas
            ? { read: lecturas.leidos, total: lecturas.total }
            : undefined
        }
        onPress={() => abrirConversacionMensaje(conversacion)}
      />
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
    const destinatariosLectura = obtenerEstadoDestinatariosMensaje(mensaje).map(
      ({ usuario, leido }) => ({
        id: usuario.id,
        name: usuario.nombre,
        roleLabel:
          usuario.rol === "CLIENTE"
            ? "Cliente"
            : usuario.rol === "ENTRENADOR"
              ? "Entrenador"
              : "Administración",
        avatarUri: resolverUrlMedia(usuario.fotoPerfilUrl),
        initials: obtenerIniciales(usuario.nombre),
        read: leido,
      }),
    );
    const renderMensajeHilo = ({ item: mensajeHilo }: { item: MensajeApp }) => {
      const esPropio = mensajeEnviadoPorUsuarioActual(mensajeHilo);
      const autor = esPropio
        ? "Tú"
        : mensajeHilo.automatico
          ? "Sistema"
          : obtenerNombreChatSinRol(mensajeHilo.remitente || nombreGimnasioApp);

      return (
        <MessageBubble
          author={autor}
          text={mensajeHilo.texto}
          date={mensajeHilo.fecha}
          isOwn={esPropio}
          theme={clienteHomeTheme}
          primaryColor={colorPrimarioVisibleApp}
          textOnPrimary={colorTextoSobrePrimarioApp}
        />
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
            <MessageReadPanel
              theme={clienteHomeTheme}
              secondaryColor={colorSecundarioVisibleApp}
              readCount={lecturas.leidos}
              total={lecturas.total}
              recipients={destinatariosLectura}
            />
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
          <MessageReplyComposer
            value={respuestaMensaje}
            theme={clienteHomeTheme}
            primaryColor={colorPrimarioVisibleApp}
            textOnPrimary={colorTextoSobrePrimarioApp}
            loading={guardandoRespuestaMensaje}
            canReply={puedeResponderMensaje}
            onChangeText={(texto) => {
              setRespuestaMensaje(texto);
              if (feedbackMensajesCliente?.tipo === "error") {
                setFeedbackMensajesCliente(null);
              }
            }}
            onSend={enviarRespuestaMensaje}
          />
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
    return (
      <MessageRecipientSelectorModal
        visible={selectorPersonaMensajeVisible}
        hasSearch={busquedaDestinatariosNormalizada.length > 0}
        searchValue={busquedaDestinatariosMensaje}
        filter={filtroSelectorPersonasMensaje}
        filteredRecipients={destinatariosSelectorPersonaFiltrados}
        visibleRecipients={destinatariosSelectorPersonaVisibles}
        selectedRecipientId={destinatarioIndividualSeleccionado?.id}
        keyboardVisible={tecladoVisible}
        windowHeight={windowHeight}
        topInset={insets.top}
        bottomInset={insets.bottom}
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        resolvePhotoUri={resolverUrlMedia}
        onChangeSearch={setBusquedaDestinatariosMensaje}
        onChangeFilter={setFiltroSelectorPersonasMensaje}
        onSelectRecipient={seleccionarDestinatarioIndividualMensaje}
        onClose={() => setSelectorPersonaMensajeVisible(false)}
      />
    );
  }

  function renderSelectorFechaMensajeModal() {
    return (
      <MessageDateSelectorModal
        visible={selectorFechaMensajeVisible}
        dateValue={fechaMensajeTemporal}
        timeValue={horaMensajeTemporal}
        error={errorFechaMensajeTemporal}
        keyboardVisible={tecladoVisible}
        bottomInset={insets.bottom}
        theme={clienteHomeTheme}
        secondaryColor={colorSecundarioVisibleApp}
        onChangeDate={(texto) => {
          setFechaMensajeTemporal(texto);
          setErrorFechaMensajeTemporal(null);
        }}
        onChangeTime={(texto) => {
          setHoraMensajeTemporal(texto);
          setErrorFechaMensajeTemporal(null);
        }}
        onCancel={cancelarSelectorFechaMensaje}
        onConfirm={confirmarSelectorFechaMensaje}
      />
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
      <MessageFormField
        label={label}
        icon={icon}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        returnKeyType={returnKeyType}
        textAlignVertical={textAlignVertical}
        theme={clienteHomeTheme}
        accentColor={colorSecundarioVisibleApp}
        feedback={feedbackMensajesCliente}
        onClearFeedback={() => setFeedbackMensajesCliente(null)}
        onFocusTarget={enfocarCampoRutina}
      />
    );
  }

  function renderClienteMensajesFeedback() {
    return (
      <MessageFeedback
        feedback={feedbackMensajesCliente}
        accentColor={colorSecundarioVisibleApp}
        onClose={() => setFeedbackMensajesCliente(null)}
        onRetry={() => {
          setFeedbackMensajesCliente(null);
          void cargarDatos(false);
        }}
      />
    );
  }

  function InicioEntrenadorPremium() {
    const nombreEntrenador =
      entrenadorDemo?.nombre?.split(" ")[0] || "Entrenador";

    return (
      <TrainerDashboard
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        backgroundImageUri={dashboardBackgroundUri}
        gymName={nombreGimnasioApp}
        trainerFirstName={nombreEntrenador}
        trainerPhotoUri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
        trainerInitials={obtenerIniciales(entrenadorDemo?.nombre)}
        loading={cargando}
        error={error}
        hasAssignedClasses={clasesEntrenador.length > 0}
        classesToday={clasesHoyEntrenador}
        nextClassToday={proximaClaseHoyEntrenador}
        nextClass={proximaClaseEntrenador}
        dayFinished={jornadaTerminadaEntrenador}
        expectedStudents={alumnosPrevistosHoyEntrenador}
        unreadMessages={mensajesNoLeidosBadge}
        classGroupCount={gruposClasesEntrenador.length}
        routineCount={rutinasEntrenador.length}
        quickActionWidth={trainerQuickActionWidth}
        now={ahora}
        getActiveReservationCount={contarReservasActivasDeClase}
        getAvailableSpaces={obtenerHuecosDisponibles}
        resolveMediaUrl={resolverUrlMedia}
        onOpenProfile={() => setSeccionEntrenador("PERFIL")}
        onRetry={() => cargarDatos(false)}
        onOpenClasses={() => setSeccionEntrenador("CLASES")}
        onOpenMessages={() => setSeccionEntrenador("MENSAJES")}
        onOpenRoutines={() => setSeccionEntrenador("RUTINAS")}
      />
    );
  }
  function EntrenadorClasesPremium() {
    const nombreEntrenador =
      entrenadorDemo?.nombre?.split(" ")[0] || "Entrenador";

    const cambiarSemanaEntrenador = (nuevoOffset: number) => {
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
    };

    return (
      <TrainerClasses
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        gymName={nombreGimnasioApp}
        trainerFirstName={nombreEntrenador}
        trainerPhotoUri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
        trainerInitials={obtenerIniciales(entrenadorDemo?.nombre)}
        loading={cargando}
        error={error}
        allClasses={clasesEntrenador}
        selectedClass={claseEntrenadorSeleccionada}
        weekOffset={semanaAgendaEntrenadorOffset}
        weekRange={rangoSemanaAgendaEntrenador}
        weekKey={crearFechaKeyLocal(inicioSemanaAgendaEntrenador)}
        days={diasAgendaEntrenadorItems}
        activeDay={diaAgendaEntrenadorActivo}
        selectedDateLabel={fechaAgendaEntrenadorTexto}
        classesThisWeek={clasesAgendaEntrenadorSemana}
        classesSelectedDay={clasesAgendaEntrenadorDia}
        nextClass={proximaClaseEntrenador}
        now={ahora}
        users={usuariosGimnasio}
        getActiveReservations={obtenerReservasActivasDeClase}
        resolveMediaUrl={resolverUrlMedia}
        onOpenProfile={() => setSeccionEntrenador("PERFIL")}
        onRetry={() => cargarDatos(false)}
        onPreviousWeek={() =>
          cambiarSemanaEntrenador(
            Math.max(0, semanaAgendaEntrenadorOffset - 1),
          )
        }
        onNextWeek={() =>
          cambiarSemanaEntrenador(semanaAgendaEntrenadorOffset + 1)
        }
        onSelectDay={(dia) => {
          setDiaAgendaEntrenadorSeleccionado(dia);
          setClaseEntrenadorSeleccionadaId(null);
        }}
        onBackToToday={() => cambiarSemanaEntrenador(0)}
        onSelectClass={setClaseEntrenadorSeleccionadaId}
        onBackFromDetail={() => setClaseEntrenadorSeleccionadaId(null)}
      />
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
          <TrainerRoutineExerciseCard
            key={item.id}
            item={item}
            index={index}
            totalExercises={0}
            theme={clienteHomeTheme}
            primaryColor={colorPrimarioVisibleApp}
            secondaryColor={colorSecundarioVisibleApp}
            resolveMediaUrl={resolverUrlMedia}
            onOpenMedia={abrirMultimediaRutina}
          />
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

    const ejerciciosSeleccionados = rutinaEntrenadorSeleccionada
      ? obtenerEjerciciosRutinaOrdenados(rutinaEntrenadorSeleccionada)
      : [];

    return (
      <TrainerRoutinesOverview
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        oneRepMaxSecondaryColor={oneRepMaxColors.secondary}
        oneRepMaxIconBackgroundColor={oneRepMaxColors.accessIconBackground}
        trainerPhotoUri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
        trainerInitials={obtenerIniciales(entrenadorDemo?.nombre)}
        feedback={renderEntrenadorRutinasFeedback()}
        search={busquedaRutinasEntrenador}
        levels={nivelesRutinasEntrenador}
        selectedLevel={filtroNivelRutinasEntrenador}
        routines={rutinasEntrenador}
        filteredRoutines={rutinasEntrenadorFiltradas}
        selectedRoutine={
          modoRutinasEntrenador === "DETALLE"
            ? rutinaEntrenadorSeleccionada
            : null
        }
        selectedExercises={ejerciciosSeleccionados}
        assignedStudents={alumnosAsignadosRutina.map(
          ({ asignacion, cliente, nombre }) => ({
            id: asignacion.id,
            name: nombre,
            initials: obtenerIniciales(nombre),
            photoUri: resolverUrlMedia(cliente?.fotoPerfilUrl),
          }),
        )}
        loading={cargandoRutinasEntrenador}
        error={errorRutinasEntrenador}
        saving={guardandoRutinaEntrenador}
        getRoutineImage={obtenerPrimeraImagenRutina}
        renderExercise={(item, index) =>
          <TrainerRoutineExerciseCard
            key={item.id}
            item={item}
            index={index}
            totalExercises={0}
            theme={clienteHomeTheme}
            primaryColor={colorPrimarioVisibleApp}
            secondaryColor={colorSecundarioVisibleApp}
            resolveMediaUrl={resolverUrlMedia}
            onOpenMedia={abrirMultimediaRutina}
          />
        }
        onOpenProfile={() => setSeccionEntrenador("PERFIL")}
        onNewRoutine={prepararNuevaRutinaEntrenador}
        onOpenOneRepMax={() =>
          setModoRutinasEntrenador("CALCULADORA_1RM")
        }
        onSearchChange={setBusquedaRutinasEntrenador}
        onLevelChange={setFiltroNivelRutinasEntrenador}
        onRetry={cargarRutinasEntrenador}
        onOpenRoutine={(routineId) =>
          cargarDetalleRutinaEntrenador(routineId, "DETALLE")
        }
        onBackToList={() => {
          setModoRutinasEntrenador("LISTA");
          setRutinaEntrenadorSeleccionadaId(null);
        }}
        onManageExercises={() => {
          setModoRutinasEntrenador("EJERCICIOS");
          setMostrarFormularioEjercicioRutina(
            ejerciciosSeleccionados.length === 0,
          );
          if (ejerciciosSeleccionados.length === 0) {
            limpiarFormularioEjercicioRutina();
          }
        }}
        onAssignStudents={abrirAsignacionRutinaEntrenador}
        onEditRoutine={prepararEditarRutinaEntrenador}
        onDuplicateRoutine={duplicarRutinaEntrenador}
        onEditExercises={() => setModoRutinasEntrenador("EJERCICIOS")}
        onAddExercise={() => {
          setModoRutinasEntrenador("EJERCICIOS");
          prepararNuevoEjercicioRutina();
        }}
        onDeactivateRoutine={desactivarRutinaEntrenador}
      />
    );
  }
  function renderEntrenadorRutinaFormulario() {
    const editando = Boolean(rutinaEntrenadorSeleccionadaId);

    return (
      <TrainerRoutineForm
        editing={editando}
        theme={clienteHomeTheme}
        secondaryColor={colorSecundarioVisibleApp}
        feedback={renderEntrenadorRutinasFeedback()}
        name={rutinaFormNombre}
        description={rutinaFormDescripcion}
        level={rutinaFormNivel}
        duration={rutinaFormDuracion}
        saving={guardandoRutinaEntrenador}
        onNameChange={setRutinaFormNombre}
        onDescriptionChange={setRutinaFormDescripcion}
        onLevelChange={setRutinaFormNivel}
        onDurationChange={setRutinaFormDuracion}
        onDismissError={() => {
          if (feedbackRutinasEntrenador?.tipo === "error") {
            setFeedbackRutinasEntrenador(null);
          }
        }}
        onInputFocus={enfocarCampoRutina}
        onSave={guardarRutinaEntrenador}
        onBack={() => {
          confirmarDescartarFormularioRutina(() => {
            setModoRutinasEntrenador(
              rutinaEntrenadorSeleccionadaId ? "DETALLE" : "LISTA",
            );
            if (!rutinaEntrenadorSeleccionadaId) {
              setRutinaEntrenadorSeleccionadaId(null);
            }
          });
        }}
        onCancel={() => {
          confirmarDescartarFormularioRutina(() =>
            setModoRutinasEntrenador(
              rutinaEntrenadorSeleccionadaId ? "DETALLE" : "LISTA",
            ),
          );
        }}
      />
    );
  }
  function renderEntrenadorRutinaEjercicios() {
    if (!rutinaEntrenadorSeleccionada) {
      return null;
    }

    const ejerciciosOrdenados = obtenerEjerciciosRutinaOrdenados(
      rutinaEntrenadorSeleccionada,
    );

    const cambiarCampoEjercicio = (
      field: TrainerExerciseTextField,
      value: string,
    ) => {
      switch (field) {
        case "name":
          setEjercicioFormNombre(value);
          break;
        case "description":
          setEjercicioFormDescripcion(value);
          break;
        case "series":
          setEjercicioFormSeries(value);
          break;
        case "repetitions":
          setEjercicioFormRepeticiones(value);
          break;
        case "rest":
          setEjercicioFormDescanso(value);
          break;
        case "weight":
          setEjercicioFormPeso(value);
          break;
        case "notes":
          setEjercicioFormNotas(value);
          break;
      }

      if (feedbackRutinasEntrenador?.tipo === "error") {
        setFeedbackRutinasEntrenador(null);
      }
    };

    return (
      <TrainerRoutineExercises
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        routine={rutinaEntrenadorSeleccionada}
        exercises={ejerciciosOrdenados}
        libraryCount={ejerciciosDisponiblesRutina.length}
        feedback={renderEntrenadorRutinasFeedback()}
        showForm={mostrarFormularioEjercicioRutina}
        editingExerciseId={ejercicioRutinaEditandoId}
        form={{
          name: ejercicioFormNombre,
          description: ejercicioFormDescripcion,
          mediaType: ejercicioFormTipoMultimedia,
          mediaUrl: ejercicioFormMultimediaUrl,
          localMediaUri: ejercicioFormMultimediaLocalUri,
          mediaName: ejercicioFormMultimediaNombre,
          series: ejercicioFormSeries,
          repetitions: ejercicioFormRepeticiones,
          rest: ejercicioFormDescanso,
          weight: ejercicioFormPeso,
          notes: ejercicioFormNotas,
        }}
        errors={{
          name: erroresEjercicioRutina.nombre,
          series: erroresEjercicioRutina.series,
          repetitions: erroresEjercicioRutina.repeticiones,
          rest: erroresEjercicioRutina.descanso,
          weight: erroresEjercicioRutina.peso,
          media: erroresEjercicioRutina.multimedia,
        }}
        canSave={ejercicioRutinaPuedeGuardar}
        saving={guardandoRutinaEntrenador}
        uploadingMedia={subiendoImagen === "rutina-ejercicio"}
        resolveMediaUrl={resolverUrlMedia}
        onBack={() => {
          confirmarDescartarEjercicioRutina(() => {
            setModoRutinasEntrenador("DETALLE");
          });
        }}
        onAddExercise={prepararNuevoEjercicioRutina}
        onFormChange={cambiarCampoEjercicio}
        onInputFocus={enfocarCampoRutina}
        onSelectMedia={abrirSelectorMultimediaRutina}
        onRemoveMedia={eliminarMultimediaEjercicioRutina}
        onSaveExercise={guardarEjercicioRutinaEntrenador}
        onCancelForm={() => confirmarDescartarEjercicioRutina()}
        onOpenMedia={abrirMultimediaRutina}
        onMoveExercise={moverEjercicioRutinaEntrenador}
        onEditExercise={abrirEditorEjercicioRutina}
        onDeleteExercise={eliminarEjercicioRutinaEntrenador}
      />
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
      <TrainerRoutineAssignments
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        routineName={rutinaEntrenadorSeleccionada.nombre}
        feedback={renderEntrenadorRutinasFeedback()}
        assignedStudents={alumnosAsignadosRutina.map(
          ({ asignacion, cliente, nombre }) => ({
            id: asignacion.clienteId,
            assignment: asignacion,
            name: nombre,
            email: cliente?.email,
            photoUri: resolverUrlMedia(cliente?.fotoPerfilUrl),
            initials: obtenerIniciales(nombre),
          }),
        )}
        availableStudents={alumnosDisponiblesParaAsignar.map((cliente) => ({
          id: cliente.id,
          name: cliente.nombre,
          email: cliente.email,
          photoUri: resolverUrlMedia(cliente.fotoPerfilUrl),
          initials: obtenerIniciales(cliente.nombre),
        }))}
        activeClientCount={clientesActivos.length}
        selectedStudentIds={alumnosRutinaSeleccionadosIds}
        search={busquedaAlumnosRutina}
        saving={guardandoRutinaEntrenador}
        onBack={() => {
          setModoRutinasEntrenador("DETALLE");
          setAlumnosRutinaSeleccionadosIds([]);
          setBusquedaAlumnosRutina("");
        }}
        onRemoveAssignment={retirarAsignacionRutinaEntrenador}
        onSearchChange={setBusquedaAlumnosRutina}
        onToggleStudent={(studentId) => {
          setAlumnosRutinaSeleccionadosIds((seleccionados) =>
            seleccionados.includes(studentId)
              ? seleccionados.filter((id) => id !== studentId)
              : [...seleccionados, studentId],
          );
        }}
        onSave={guardarAsignacionRutinaEntrenador}
      />
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

    return (
      <ClientRoutines
        mode={modoRutinasCliente}
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        oneRepMaxSecondaryColor={oneRepMaxColors.secondary}
        oneRepMaxIconBackgroundColor={oneRepMaxColors.accessIconBackground}
        clientPhotoUri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
        clientInitials={obtenerIniciales(clienteDemo?.nombre)}
        assignments={rutinasClienteActivas}
        selectedAssignment={asignacionRutinaClienteSeleccionada}
        selectedRoutine={rutinaClienteSeleccionada}
        selectedExercises={ejerciciosRutinaClienteSeleccionada}
        currentExercise={ejercicioEntrenamientoCliente}
        currentExerciseIndex={entrenamientoClienteIndice}
        completedExerciseIds={entrenamientoClienteCompletadosIds}
        thumbnails={thumbnailsVideoRutina}
        loading={cargandoRutinasCliente}
        error={errorRutinasCliente}
        windowHeight={windowHeight}
        bottomDockHeight={bottomDockHeight}
        topInset={insets.top}
        getRoutineImage={obtenerPrimeraImagenRutina}
        resolveMediaUrl={resolverUrlMedia}
        onOpenProfile={() => setSeccionCliente("PERFIL")}
        onOpenOneRepMax={() => setModoRutinasCliente("CALCULADORA_1RM")}
        onRetry={cargarRutinasCliente}
        onOpenRoutine={abrirRutinaCliente}
        onBackToList={() => {
          setModoRutinasCliente("LISTA");
          setRutinaClienteSeleccionadaId(null);
        }}
        onBackToDetail={() => setModoRutinasCliente("DETALLE")}
        onStartRoutine={empezarEntrenamientoCliente}
        onOpenMedia={abrirMultimediaRutina}
        onExitWorkout={confirmarSalidaEntrenamientoCliente}
        onToggleExercise={toggleEjercicioEntrenamientoCliente}
        onPreviousExercise={() =>
          setEntrenamientoClienteIndice((indice) => Math.max(0, indice - 1))
        }
        onNextExercise={() =>
          setEntrenamientoClienteIndice((indice) =>
            Math.min(totalEjerciciosEntrenamientoCliente - 1, indice + 1),
          )
        }
        onFinishWorkout={finalizarEntrenamientoCliente}
        onReturnFromCompleted={() => {
          setModoRutinasCliente("LISTA");
          setRutinaClienteSeleccionadaId(null);
          setEntrenamientoClienteIndice(0);
          setEntrenamientoClienteCompletadosIds([]);
        }}
      />
    );
  }
  function InicioClientePremium() {
    const nombreCliente = clienteDemo?.nombre?.split(" ")[0] || "Cliente";
    const reservasActivasCliente = reservasCliente.filter(
      (reserva) => reserva.estado === "RESERVADA",
    );
    const totalRutinasCliente = rutinasClienteActivas.length;
    const asignacionRutinaInicio =
      totalRutinasCliente === 1 ? rutinasClienteActivas[0] : null;
    const rutinaInicio = asignacionRutinaInicio?.rutina || null;
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
    const chipsRutinaInicio = (
      rutinaInicio
        ? [
            `${totalEjerciciosRutinaInicio} ejercicio${totalEjerciciosRutinaInicio === 1 ? "" : "s"}`,
            rutinaInicio.duracionEstimadaMinutos
              ? `~${rutinaInicio.duracionEstimadaMinutos} min`
              : null,
            rutinaInicio.nivel || null,
          ]
        : totalRutinasCliente > 1
          ? [`${totalRutinasCliente} rutinas`, "Ver mis rutinas"]
          : []
    ).filter((chip): chip is string => Boolean(chip));
    const proximaClase =
      proximaReservaCliente && claseProximaReservaCliente
        ? {
            title:
              proximaReservaCliente.nombreClase ||
              claseProximaReservaCliente.nombre ||
              "Clase reservada",
            subtitle:
              claseProximaReservaCliente.descripcion ||
              "Tu entrenamiento ya está preparado.",
            imageUri: resolverUrlMedia(claseProximaReservaCliente.imagenUrl),
            dateLabel: formatearDia(claseProximaReservaCliente.fechaHora),
            timeLabel: obtenerHora(claseProximaReservaCliente.fechaHora),
            trainerName: claseProximaReservaCliente.nombreEntrenador,
          }
        : null;

    return (
      <ClientDashboard
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        backgroundUri={dashboardBackgroundUri}
        gymName={nombreGimnasioApp}
        welcomeText={bienvenidaGimnasioApp}
        clientName={nombreCliente}
        clientPhotoUri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
        clientInitials={obtenerIniciales(clienteDemo?.nombre)}
        nextClass={proximaClase}
        activeReservationsCount={
          reservasActivasCliente.length || agendaInicioCliente.length
        }
        unreadMessagesCount={mensajesNoLeidosBadge}
        routine={{
          title: tituloRutinaInicio,
          text: textoRutinaInicio,
          imageUri: rutinaInicio ? obtenerPrimeraImagenRutina(rutinaInicio) : null,
          chips: chipsRutinaInicio,
          onPress: asignacionRutinaInicio
            ? () => abrirRutinaCliente(asignacionRutinaInicio)
            : totalRutinasCliente > 1
              ? () => setSeccionCliente("RUTINAS")
              : undefined,
        }}
        routinesCount={totalRutinasCliente}
        onOpenProfile={() => setSeccionCliente("PERFIL")}
        onOpenClasses={() => setSeccionCliente("CLASES")}
        onOpenReservations={() => setSeccionCliente("RESERVAS")}
        onOpenRoutines={() => setSeccionCliente("RUTINAS")}
      />
    );
  }
  function ClienteClasesPremium() {
    const fechaActivaTexto = diaClasesClienteActivo
      ? formatearFechaCompleta(`${diaClasesClienteActivo}T00:00:00`)
      : "Sin clases";

    const limpiarSeleccionClase = () => {
      setClaseClienteSeleccionadaId(null);
      setReservaConfirmada(null);
      setErrorReservaCliente("");
    };

    const cambiarSemanaClases = (nuevoOffset: number) => {
      const offsetSeguro = Math.max(0, nuevoOffset);
      const nuevoInicio = sumarDiasFechaLocal(
        lunesSemanaActual,
        offsetSeguro * 7,
      );
      setSemanaClasesOffset(offsetSeguro);
      setDiaSeleccionado(
        offsetSeguro === 0
          ? hoyClasesClienteKey
          : crearFechaKeyLocal(nuevoInicio),
      );
      limpiarSeleccionClase();
    };

    return (
      <ClientClasses
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        textOnPrimaryColor={colorTextoSobrePrimarioApp}
        clientPhotoUri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
        clientInitials={obtenerIniciales(clienteDemo?.nombre)}
        loading={cargando}
        error={error}
        allClasses={clasesActivasGimnasio}
        selectedClass={claseClienteSeleccionada}
        weekOffset={semanaClasesOffset}
        weekRange={rangoSemanaClases}
        weekKey={crearFechaKeyLocal(inicioSemanaClasesCliente)}
        days={diasClasesClienteItems}
        activeDay={diaClasesClienteActivo}
        activeDateLabel={fechaActivaTexto}
        classTypes={tiposClasesCliente}
        selectedClassType={actividadSeleccionada}
        classesThisWeek={clasesClienteDeLaSemana}
        classesSelectedDay={clasesClienteDelDia}
        confirmedReservation={reservaConfirmada}
        reservationError={errorReservaCliente}
        reservingClassId={reservaEnProcesoId}
        cancellingReservationId={cancelandoReservaId}
        getActiveReservation={obtenerReservaClienteActivaDeClase}
        getAvailableSpaces={obtenerHuecosDisponibles}
        resolveMediaUrl={resolverUrlMedia}
        onOpenProfile={() => setSeccionCliente("PERFIL")}
        onRetry={() => cargarDatos(false)}
        onPreviousWeek={() => cambiarSemanaClases(semanaClasesOffset - 1)}
        onNextWeek={() => cambiarSemanaClases(semanaClasesOffset + 1)}
        onSelectDay={(dayKey) => {
          setDiaSeleccionado(dayKey);
          limpiarSeleccionClase();
        }}
        onSelectClassType={(classType) => {
          setActividadSeleccionada(classType);
          limpiarSeleccionClase();
        }}
        onClearClassType={() => {
          setActividadSeleccionada(null);
          setErrorReservaCliente("");
        }}
        onSelectClass={(classId) => {
          setClaseClienteSeleccionadaId(classId);
          setErrorReservaCliente("");
        }}
        onBackFromDetail={() => {
          setClaseClienteSeleccionadaId(null);
          setErrorReservaCliente("");
        }}
        onReserve={reservarClase}
        onCancelReservation={cancelarReserva}
      />
    );
  }
  function ClienteReservasPremium() {
    return (
      <ClientReservations
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        textOnPrimaryColor={colorTextoSobrePrimarioApp}
        clientPhotoUri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
        clientInitials={obtenerIniciales(clienteDemo?.nombre)}
        mode={modoReservasCliente}
        upcomingReservations={reservasProximasClienteTodas}
        historyReservations={reservasHistorialCliente}
        cancelledReservation={reservaCanceladaFeedback}
        reservationError={errorReservaCliente}
        cancellingReservationId={cancelandoReservaId}
        pendingCancellation={reservaCancelacionPendiente}
        nowTimestamp={ahora.getTime()}
        bottomInset={insets.bottom}
        getReservationData={obtenerDatosReservaCliente}
        onOpenProfile={() => setSeccionCliente("PERFIL")}
        onChangeMode={(mode) => {
          setModoReservasCliente(mode);
          setErrorReservaCliente("");
        }}
        onExploreClasses={() => setSeccionCliente("CLASES")}
        onRequestCancellation={(reserva) => {
          setReservaCancelacionPendiente(reserva);
          setReservaCanceladaFeedback(null);
          setErrorReservaCliente("");
        }}
        onDismissCancellation={() => setReservaCancelacionPendiente(null)}
        onConfirmCancellation={confirmarCancelacionReservaCliente}
      />
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
  function renderEntrenadorPerfilPremium() {
    const nombreEntrenadorCompleto =
      entrenadorDemo?.nombre || usuarioActivo?.nombre || "Entrenador";
    const nombreEntrenador = obtenerNombreChatSinRol(nombreEntrenadorCompleto);
    const emailEntrenador = entrenadorDemo?.email || usuarioActivo?.email || "";
    const subiendoFotoEntrenador = subiendoImagen === "perfil";

    if (modoPerfilCliente === "DATOS_PERSONALES") {
      return renderDatosPersonalesPerfilPremium();
    }

    if (modoPerfilCliente === "PASSWORD") {
      return renderPasswordPerfilPremium();
    }

    const seccionesPerfilEntrenador: MemberProfileSection[] = [
      {
        title: "Mi cuenta",
        rows: [
          {
            icon: "account-edit-outline",
            title: "Datos personales",
            description: "Nombre y email de acceso",
            onPress: abrirDatosPersonalesPerfil,
          },
          {
            icon: "lock-reset",
            title: "Cambiar contraseña",
            description: "Actualiza tu acceso de forma segura",
            onPress: abrirPasswordPerfil,
          },
          ...(entrenadoresPuedenCambiarFotoPerfilApp
            ? [
                {
                  icon: "camera-outline" as const,
                  title: "Foto de perfil",
                  description: "Actualiza tu imagen con la cámara o la galería",
                  onPress: cambiarFotoPerfil,
                  loading: subiendoFotoEntrenador,
                },
              ]
            : []),
        ],
      },
      {
        title: "Mi trabajo",
        rows: [
          {
            icon: "calendar-clock-outline",
            title: "Horario y clases",
            description: `${clasesEntrenador.length} sesiones asignadas`,
            onPress: () => setSeccionEntrenador("CLASES"),
          },
          {
            icon: "dumbbell",
            title: "Rutinas",
            description: "Crea, organiza y asigna entrenamientos",
            onPress: () => setSeccionEntrenador("RUTINAS"),
          },
          {
            icon: "message-text-outline",
            title: "Mensajes",
            description:
              mensajesNoLeidosBadge > 0
                ? `${mensajesNoLeidosBadge} sin leer`
                : "Bandeja al día",
            badgeCount: mensajesNoLeidosBadge,
            onPress: () => setSeccionEntrenador("MENSAJES"),
          },
        ],
      },
      {
        title: "Mi gimnasio",
        rows: [
          {
            icon: "storefront-outline",
            title: nombreGimnasioApp,
            description: "Gimnasio asociado a tu cuenta",
          },
        ],
      },
      {
        title: "Cuenta",
        rows: [
          {
            icon: "logout",
            title: "Cerrar sesión",
            description: "Salir de este dispositivo",
            danger: true,
            onPress: () => setConfirmarLogoutCliente(true),
          },
        ],
      },
    ];

    return (
      <MemberProfile
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        textOnPrimaryColor={colorTextoSobrePrimarioApp}
        subtitle="Gestiona tu información y tus accesos de trabajo."
        name={nombreEntrenador}
        email={emailEntrenador}
        roleLabel="Entrenador"
        photoUri={resolverUrlMedia(entrenadorDemo?.fotoPerfilUrl)}
        initials={obtenerIniciales(nombreEntrenador)}
        canEditPhoto={entrenadoresPuedenCambiarFotoPerfilApp}
        uploadingPhoto={subiendoFotoEntrenador}
        identityIcon="account-tie-outline"
        sections={seccionesPerfilEntrenador}
        logoutVisible={confirmarLogoutCliente}
        bottomInset={insets.bottom}
        onEditPhoto={cambiarFotoPerfil}
        onDismissLogout={() => setConfirmarLogoutCliente(false)}
        onConfirmLogout={() => {
          setConfirmarLogoutCliente(false);
          cerrarSesion();
        }}
      />
    );
  }

  function renderClientePerfilPremium() {
    const nombreCliente = clienteDemo?.nombre || usuarioActivo?.nombre || "Cliente";
    const emailCliente = clienteDemo?.email || usuarioActivo?.email || "";
    const subiendoFotoCliente = subiendoImagen === "perfil";

    if (modoPerfilCliente === "DATOS_PERSONALES") {
      return renderDatosPersonalesPerfilPremium();
    }

    if (modoPerfilCliente === "PASSWORD") {
      return renderPasswordPerfilPremium();
    }

    const pagosPendientes = pagos.filter(
      (pago) => pago.estado === "PENDIENTE" || pago.estado === "VENCIDO",
    ).length;
    const seccionesPerfilCliente: MemberProfileSection[] = [
      {
        title: "Mi cuenta",
        rows: [
          {
            icon: "account-edit-outline",
            title: "Datos personales",
            description: "Nombre y email de acceso",
            onPress: abrirDatosPersonalesPerfil,
          },
          {
            icon: "lock-reset",
            title: "Cambiar contraseña",
            description: "Actualiza tu acceso de forma segura",
            onPress: abrirPasswordPerfil,
          },
          ...(clientesPuedenCambiarFotoPerfilApp
            ? [
                {
                  icon: "camera-outline" as const,
                  title: "Foto de perfil",
                  description: "Actualiza tu imagen con la cámara o la galería",
                  onPress: cambiarFotoPerfil,
                  loading: subiendoFotoCliente,
                },
              ]
            : []),
          {
            icon: "clipboard-check-outline",
            title: "Mis reservas",
            description: `${reservasProximasClienteTodas.length} próximas · ${reservasHistorialCliente.length} en historial`,
            onPress: () => setSeccionCliente("RESERVAS"),
          },
          {
            icon: "message-text-outline",
            title: "Mensajes",
            description:
              mensajesNoLeidosBadge > 0
                ? `${mensajesNoLeidosBadge} sin leer`
                : "Bandeja al día",
            badgeCount: mensajesNoLeidosBadge,
            onPress: () => setSeccionCliente("MENSAJES"),
          },
          {
            icon: "receipt-text-outline",
            title: "Pagos",
            description:
              pagosPendientes > 0
                ? `${pagosPendientes} pendientes`
                : "Sin pagos pendientes",
            onPress: () => setSeccionCliente("PAGOS"),
          },
        ],
      },
      {
        title: "Mi gimnasio",
        rows: [
          {
            icon: "storefront-outline",
            title: nombreGimnasioApp,
            description: "Gimnasio asociado a tu cuenta",
          },
        ],
      },
      {
        title: "Cuenta",
        rows: [
          {
            icon: "logout",
            title: "Cerrar sesión",
            description: "Salir de este dispositivo",
            danger: true,
            onPress: () => setConfirmarLogoutCliente(true),
          },
        ],
      },
    ];

    return (
      <MemberProfile
        theme={clienteHomeTheme}
        primaryColor={colorPrimarioVisibleApp}
        secondaryColor={colorSecundarioVisibleApp}
        textOnPrimaryColor={colorTextoSobrePrimarioApp}
        subtitle="Gestiona tu información y tus accesos principales."
        name={nombreCliente}
        email={emailCliente}
        photoUri={resolverUrlMedia(clienteDemo?.fotoPerfilUrl)}
        initials={obtenerIniciales(nombreCliente)}
        canEditPhoto={clientesPuedenCambiarFotoPerfilApp}
        uploadingPhoto={subiendoFotoCliente}
        identityIcon="account-heart-outline"
        sections={seccionesPerfilCliente}
        logoutVisible={confirmarLogoutCliente}
        bottomInset={insets.bottom}
        onEditPhoto={cambiarFotoPerfil}
        onDismissLogout={() => setConfirmarLogoutCliente(false)}
        onConfirmLogout={() => {
          setConfirmarLogoutCliente(false);
          cerrarSesion();
        }}
      />
    );
  }
  function obtenerPresentacionCuentaPerfil() {
    const usuarioPerfil =
      usuarioActivo || (rolSeleccionado === "ENTRENADOR" ? entrenadorDemo : clienteDemo);
    const nombrePerfilCompleto = usuarioPerfil?.nombre || "Usuario";
    const nombrePerfil =
      rolSeleccionado === "ENTRENADOR"
        ? obtenerNombreChatSinRol(nombrePerfilCompleto)
        : nombrePerfilCompleto;

    return {
      fotoPerfilUri: resolverUrlMedia(usuarioPerfil?.fotoPerfilUrl),
      iniciales: obtenerIniciales(nombrePerfil),
    };
  }

  function renderDatosPersonalesPerfilPremium() {
    const presentacionPerfil = obtenerPresentacionCuentaPerfil();

    return (
      <ProfileDetailsScreen
        theme={clienteHomeTheme}
        secondaryColor={colorSecundarioVisibleApp}
        profilePhotoUri={presentacionPerfil.fotoPerfilUri}
        profileInitials={presentacionPerfil.iniciales}
        feedback={feedbackCuentaCliente}
        saving={guardandoPerfilCliente}
        name={perfilNombreForm}
        email={perfilEmailForm}
        onBack={volverResumenPerfil}
        onClearError={() => setFeedbackCuentaCliente(null)}
        onChangeName={setPerfilNombreForm}
        onChangeEmail={setPerfilEmailForm}
        onSubmit={guardarDatosPersonalesPerfil}
      />
    );
  }

  function renderPasswordPerfilPremium() {
    const presentacionPerfil = obtenerPresentacionCuentaPerfil();

    return (
      <ProfilePasswordScreen
        theme={clienteHomeTheme}
        secondaryColor={colorSecundarioVisibleApp}
        profilePhotoUri={presentacionPerfil.fotoPerfilUri}
        profileInitials={presentacionPerfil.iniciales}
        feedback={feedbackCuentaCliente}
        saving={guardandoPasswordCliente}
        currentPassword={passwordActualCuenta}
        newPassword={passwordNuevaCuenta}
        confirmationPassword={passwordConfirmacionCuenta}
        showCurrentPassword={mostrarPasswordActualCuenta}
        showNewPassword={mostrarPasswordNuevaCuenta}
        showConfirmationPassword={mostrarPasswordConfirmacionCuenta}
        onBack={volverResumenPerfil}
        onClearError={() => setFeedbackCuentaCliente(null)}
        onChangeCurrentPassword={setPasswordActualCuenta}
        onChangeNewPassword={setPasswordNuevaCuenta}
        onChangeConfirmationPassword={setPasswordConfirmacionCuenta}
        onToggleCurrentPassword={() =>
          setMostrarPasswordActualCuenta((mostrar) => !mostrar)
        }
        onToggleNewPassword={() =>
          setMostrarPasswordNuevaCuenta((mostrar) => !mostrar)
        }
        onToggleConfirmationPassword={() =>
          setMostrarPasswordConfirmacionCuenta((mostrar) => !mostrar)
        }
        onSubmit={guardarPasswordPerfil}
      />
    );
  }
}
