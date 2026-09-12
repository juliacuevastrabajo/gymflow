import { API_BASE_URL } from "../config/api";
import { publishSessionExpired } from "./authSessionCoordinator";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const API_TIMEOUT_MS = 10000;
let authToken: string | null = null;
let sessionExpirationNotified = false;

export class GymFlowApiError extends Error {
  status?: number;
  kind: "HTTP" | "NETWORK" | "TIMEOUT";
  scope?: "MESSAGES";

  constructor(
    message: string,
    options: {
      status?: number;
      kind: "HTTP" | "NETWORK" | "TIMEOUT";
      scope?: "MESSAGES";
    },
  ) {
    super(message);
    this.name = "GymFlowApiError";
    this.status = options.status;
    this.kind = options.kind;
    this.scope = options.scope;
  }
}

export type AuthSessionUser = {
  id: number;
  nombre: string;
  email: string;
  fotoPerfilUrl?: string | null;
  rol: "ADMIN" | "ENTRENADOR" | "CLIENTE";
  gimnasioId?: number | null;
  nombreGimnasio?: string | null;
};

export type AuthLoginResponse = AuthSessionUser & { token: string };

export type AdminUserRole = "CLIENTE" | "ENTRENADOR";

export type AdminCreatedUser = AuthSessionUser & {
  activo: boolean;
};

export type CreateAdminUserRequest = {
  nombre: string;
  email: string;
  fotoPerfilUrl?: string | null;
  rol: AdminUserRole;
};

export type CreateAdminUserResponse = {
  usuario: AdminCreatedUser;
  passwordInicial: string;
};

export type MessageApiResponse = {
  id: number;
  asunto: string;
  texto: string;
  automatico: boolean;
  conversacionId?: string | null;
  mensajePadreId?: number | null;
  audiencia: "TODOS" | "CLIENTES" | "ENTRENADORES" | "INDIVIDUAL";
  estado: "ENVIADO" | "PROGRAMADO" | "ACTIVO" | "PAUSADO";
  tipoProgramacion: "AHORA" | "FECHA" | "RECURRENTE";
  frecuencia: "NINGUNA" | "DIARIA" | "SEMANAL" | "MENSUAL";
  prioridad: "NORMAL" | "IMPORTANTE" | "URGENTE";
  fechaCreacion?: string | null;
  fechaProgramada?: string | null;
  fechaEnvio?: string | null;
  gimnasioId?: number | null;
  nombreGimnasio?: string | null;
  remitenteId?: number | null;
  nombreRemitente?: string | null;
  destinatarioIds?: number[];
  leidoPorUsuarioIds?: number[];
  interlocutorIds?: number[];
  leidoPorMi: boolean;
  destinatariosCount: number;
};

export function setAuthToken(token?: string | null) {
  authToken = token || null;
  sessionExpirationNotified = false;
}

function getAuthHeaders(): Record<string, string> {
  return authToken
    ? {
        Authorization: `Bearer ${authToken}`,
      }
    : {};
}

async function fetchConTimeout(
  url: string,
  opciones: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...opciones,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GymFlowApiError("El servidor está tardando demasiado en responder.", {
        kind: "TIMEOUT",
      });
    }

    if (error instanceof GymFlowApiError) {
      throw error;
    }

    throw new GymFlowApiError("No se pudo conectar con GymFlow.", {
      kind: "NETWORK",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function procesarRespuesta(respuesta: Response) {
  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    let mensajeError = textoError || "Error en la petición al backend";

    try {
      const errorJson = JSON.parse(textoError);
      mensajeError =
        errorJson.message ||
        errorJson.detail ||
        errorJson.error ||
        mensajeError;
    } catch {
      // Si el backend devuelve texto plano, usamos ese texto directamente.
    }

    if (respuesta.status === 401 && authToken && !sessionExpirationNotified) {
      sessionExpirationNotified = true;
      publishSessionExpired();
    }

    throw new GymFlowApiError(mensajeError, {
      status: respuesta.status,
      kind: "HTTP",
    });
  }

  return respuesta.json();
}

export async function obtenerDashboardData() {
  const [gimnasioRes, usuariosRes, clasesRes, reservasRes] = await Promise.all(
    [
      fetchConTimeout(`${API_BASE_URL}/gimnasios/me`, {
        headers: getAuthHeaders(),
      }),
      fetchConTimeout(`${API_BASE_URL}/usuarios`, {
        headers: getAuthHeaders(),
      }),
      fetchConTimeout(`${API_BASE_URL}/clases`, {
        headers: getAuthHeaders(),
      }),
      fetchConTimeout(`${API_BASE_URL}/reservas`, {
        headers: getAuthHeaders(),
      }),
    ],
  );

  const gimnasio = await procesarRespuesta(gimnasioRes);
  const usuarios = await procesarRespuesta(usuariosRes);
  const clases = await procesarRespuesta(clasesRes);
  const reservas = await procesarRespuesta(reservasRes);
  let mensajes: MessageApiResponse[];

  try {
    const mensajesRes = await fetchConTimeout(`${API_BASE_URL}/mensajes/me`, {
      headers: getAuthHeaders(),
    });
    mensajes = (await procesarRespuesta(mensajesRes)) as MessageApiResponse[];
  } catch (error) {
    if (error instanceof GymFlowApiError) {
      throw new GymFlowApiError("No se pudieron cargar los mensajes.", {
        status: error.status,
        kind: error.kind,
        scope: "MESSAGES",
      });
    }

    throw error;
  }

  return {
    gimnasios: gimnasio ? [gimnasio] : [],
    usuarios,
    clases,
    reservas,
    mensajes,
  };
}

export async function crearUsuarioApi(
  datosUsuario: CreateAdminUserRequest,
): Promise<CreateAdminUserResponse> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosUsuario),
  });

  return procesarRespuesta(respuesta) as Promise<CreateAdminUserResponse>;
}

export type InvitationExpiry = "HORAS_24" | "DIAS_7" | "DIAS_30";
export type ClientInvitationStatus =
  | "ACTIVA"
  | "CADUCADA"
  | "AGOTADA"
  | "REVOCADA"
  | "INVALIDA";

export type ClientInvitation = {
  id: number;
  publicId: string;
  gimnasioId: number;
  nombreGimnasio: string;
  fechaCreacion: string;
  fechaExpiracion: string;
  limiteRegistros: number;
  usosConsumidos: number;
  usosDisponibles: number;
  estado: ClientInvitationStatus;
  token?: string | null;
};

export type ClientInvitationValidation = {
  valida: boolean;
  estado: ClientInvitationStatus;
  mensaje: string;
  nombreGimnasio?: string | null;
  fechaExpiracion?: string | null;
  usosDisponibles?: number | null;
};

export type ClientInvitationRegistration = {
  token: string;
  nombre: string;
  email: string;
  password: string;
  confirmarPassword: string;
};

export async function crearInvitacionClienteApi(datos: {
  caducidad: InvitationExpiry;
  limiteRegistros: number;
}): Promise<ClientInvitation> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/invitaciones-clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(respuesta) as Promise<ClientInvitation>;
}

export async function listarInvitacionesClienteApi(): Promise<ClientInvitation[]> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/invitaciones-clientes`, {
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta) as Promise<ClientInvitation[]>;
}

export async function revocarInvitacionClienteApi(
  invitacionId: number,
): Promise<ClientInvitation> {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/invitaciones-clientes/${invitacionId}/revocar`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );

  return procesarRespuesta(respuesta) as Promise<ClientInvitation>;
}

export async function validarInvitacionClienteApi(
  token: string,
): Promise<ClientInvitationValidation> {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/invitaciones-clientes/validar?token=${encodeURIComponent(token)}`,
  );

  return procesarRespuesta(respuesta) as Promise<ClientInvitationValidation>;
}

export async function registrarClienteConInvitacionApi(
  datos: ClientInvitationRegistration,
): Promise<AuthLoginResponse> {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/invitaciones-clientes/registrar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    },
  );

  return procesarRespuesta(respuesta) as Promise<AuthLoginResponse>;
}

export async function crearClaseApi(datosClase: any) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/clases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosClase),
  });

  return procesarRespuesta(respuesta);
}

export type ReglaProgramacionClase = {
  id?: number | null;
  diaSemana: number;
  hora: string;
};

export type ProgramacionClaseRequest = {
  nombre?: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  duracionMinutos?: number;
  capacidadMaxima?: number;
  entrenadorId?: number;
  fechaInicio?: string;
  reglas?: ReglaProgramacionClase[];
};

export async function crearProgramacionClaseApi(
  datos: ProgramacionClaseRequest,
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/clases/programaciones`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(datos),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function actualizarProgramacionClaseApi(
  programacionId: number,
  datos: ProgramacionClaseRequest,
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/clases/programaciones/${programacionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(datos),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function desactivarProgramacionClaseApi(programacionId: number) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/clases/programaciones/${programacionId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function crearReservaApi(datosReserva: {
  claseId: number;
  clienteId?: number;
}) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/reservas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosReserva),
  });

  return procesarRespuesta(respuesta);
}

export async function cancelarReservaApi(reservaId: number) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/reservas/${reservaId}/cancelar`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function actualizarGimnasioApi(
  gimnasioId: number,
  datosGimnasio: any,
) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/gimnasios/${gimnasioId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosGimnasio),
  });

  return procesarRespuesta(respuesta);
}

export async function loginApi(datosLogin: any) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datosLogin),
  });

  return procesarRespuesta(respuesta) as Promise<AuthLoginResponse>;
}

export async function obtenerSesionActualApi() {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta) as Promise<AuthSessionUser>;
}

export async function actualizarMiPerfilApi(datosPerfil: {
  nombre: string;
  email: string;
}) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/usuarios/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosPerfil),
  });

  return procesarRespuesta(respuesta);
}

export async function cambiarMiPasswordApi(datosPassword: {
  passwordActual: string;
  passwordNueva: string;
}) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/usuarios/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosPassword),
  });

  return procesarRespuesta(respuesta);
}

export async function actualizarClaseApi(claseId: number, datosClase: any) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/clases/${claseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(datosClase),
  });

  return procesarRespuesta(respuesta);
}

export async function desactivarClaseApi(claseId: number) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/clases/${claseId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta);
}

export async function desactivarUsuarioApi(usuarioId: number) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/usuarios/${usuarioId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta);
}

export type EstadoPago = "PENDIENTE" | "VENCIDO" | "PAGADO" | "CANCELADO";

export type MetodoPago =
  | "EFECTIVO"
  | "TARJETA"
  | "TRANSFERENCIA"
  | "DOMICILIACION"
  | "OTRO";

export type Pago = {
  id: number;
  gimnasioId: number;
  clienteId: number;
  nombreCliente?: string | null;
  emailCliente?: string | null;
  fotoClienteUrl?: string | null;
  creadoPorId?: number | null;
  nombreCreador?: string | null;
  concepto: string;
  descripcion?: string | null;
  importe: number;
  moneda: string;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaPago?: string | null;
  metodoPago?: MetodoPago | null;
  referencia?: string | null;
  estado: EstadoPago;
  fechaCreacion: string;
  fechaActualizacion: string;
};

export type PagoRequest = {
  clienteId: number;
  concepto: string;
  descripcion?: string | null;
  importe: string;
  fechaVencimiento: string;
};

export type MarcarPagoRequest = {
  fechaPago: string;
  metodoPago: MetodoPago;
  referencia?: string | null;
};

export async function listarPagosApi(): Promise<Pago[]> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/pagos`, {
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta) as Promise<Pago[]>;
}

export async function listarMisPagosApi(): Promise<Pago[]> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/pagos/me`, {
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta) as Promise<Pago[]>;
}

export async function consultarPagoApi(pagoId: number): Promise<Pago> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/pagos/${pagoId}`, {
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta) as Promise<Pago>;
}

export async function crearPagoApi(datosPago: PagoRequest): Promise<Pago> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/pagos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosPago),
  });

  return procesarRespuesta(respuesta) as Promise<Pago>;
}

export async function actualizarPagoApi(
  pagoId: number,
  datosPago: PagoRequest,
): Promise<Pago> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/pagos/${pagoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosPago),
  });

  return procesarRespuesta(respuesta) as Promise<Pago>;
}

export async function marcarPagoComoPagadoApi(
  pagoId: number,
  datosPago: MarcarPagoRequest,
): Promise<Pago> {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/pagos/${pagoId}/marcar-pagado`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(datosPago),
    },
  );

  return procesarRespuesta(respuesta) as Promise<Pago>;
}

export async function cancelarPagoApi(pagoId: number): Promise<Pago> {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/pagos/${pagoId}/cancelar`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    },
  );

  return procesarRespuesta(respuesta) as Promise<Pago>;
}

export type TipoMultimediaEjercicio = "NINGUNO" | "IMAGEN" | "VIDEO";

export type RutinaRequest = {
  nombre: string;
  descripcion?: string | null;
  nivel?: string | null;
  duracionEstimadaMinutos?: number | null;
};

export type EjercicioRequest = {
  nombre: string;
  descripcion?: string | null;
  tipoMultimedia?: TipoMultimediaEjercicio | null;
  multimediaUrl?: string | null;
};

export type RutinaEjercicioRequest = {
  ejercicioId?: number | null;
  orden?: number | null;
  series?: number | null;
  repeticiones?: string | null;
  descansoSegundos?: number | null;
  peso?: number | null;
  notas?: string | null;
};

export async function listarRutinasApi() {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return procesarRespuesta(respuesta);
}

export async function consultarRutinaApi(rutinaId: number) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas/${rutinaId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return procesarRespuesta(respuesta);
}

export async function crearRutinaApi(datosRutina: RutinaRequest) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosRutina),
  });

  return procesarRespuesta(respuesta);
}

export async function actualizarRutinaApi(
  rutinaId: number,
  datosRutina: RutinaRequest,
) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas/${rutinaId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosRutina),
  });

  return procesarRespuesta(respuesta);
}

export async function desactivarRutinaApi(rutinaId: number) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas/${rutinaId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  return procesarRespuesta(respuesta);
}

export async function listarEjerciciosApi() {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas/ejercicios`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return procesarRespuesta(respuesta);
}

export async function crearEjercicioApi(datosEjercicio: EjercicioRequest) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas/ejercicios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosEjercicio),
  });

  return procesarRespuesta(respuesta);
}

export async function actualizarEjercicioApi(
  ejercicioId: number,
  datosEjercicio: EjercicioRequest,
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/ejercicios/${ejercicioId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(datosEjercicio),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function desactivarEjercicioApi(ejercicioId: number) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/ejercicios/${ejercicioId}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );

  return procesarRespuesta(respuesta);
}

export async function agregarEjercicioARutinaApi(
  rutinaId: number,
  datosEjercicioRutina: RutinaEjercicioRequest,
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/${rutinaId}/ejercicios`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(datosEjercicioRutina),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function actualizarEjercicioDeRutinaApi(
  rutinaId: number,
  rutinaEjercicioId: number,
  datosEjercicioRutina: RutinaEjercicioRequest,
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/${rutinaId}/ejercicios/${rutinaEjercicioId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(datosEjercicioRutina),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function eliminarEjercicioDeRutinaApi(
  rutinaId: number,
  rutinaEjercicioId: number,
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/${rutinaId}/ejercicios/${rutinaEjercicioId}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );

  return procesarRespuesta(respuesta);
}

export async function cambiarOrdenEjerciciosRutinaApi(
  rutinaId: number,
  rutinaEjercicioIds: number[],
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/${rutinaId}/ejercicios/orden`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ rutinaEjercicioIds }),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function asignarRutinaApi(rutinaId: number, clienteIds: number[]) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/${rutinaId}/asignaciones`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ clienteIds }),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function listarAsignacionesRutinaApi(rutinaId: number) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/${rutinaId}/asignaciones`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    },
  );

  return procesarRespuesta(respuesta);
}

export async function retirarAsignacionRutinaApi(asignacionId: number) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/rutinas/asignaciones/${asignacionId}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );

  return procesarRespuesta(respuesta);
}

export async function listarMisRutinasAsignadasApi() {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/rutinas/me/asignadas`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return procesarRespuesta(respuesta);
}

export function resolverUrlMedia(url?: string | null) {
  if (!url) {
    return null;
  }

  if (/^(https?:|file:|content:|data:|blob:)/i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export type FinalidadArchivo =
  | "FOTO_PERFIL"
  | "FONDO_GIMNASIO"
  | "PORTADA_CLASE"
  | "MULTIMEDIA_EJERCICIO";

export type ArchivoSubidoResponse = {
  id: string;
  url: string;
  tipoMultimedia: "IMAGEN" | "VIDEO";
  finalidad: FinalidadArchivo;
  temporal: boolean;
};

export async function subirImagenApi(
  uri: string,
  finalidad: FinalidadArchivo,
  mimeType = "image/jpeg",
  fileName = "imagen.jpg",
  objetivoUsuarioId?: number,
) {
  const datos = new FormData();
  datos.append(
    "archivo",
    {
      uri,
      name: fileName,
      type: mimeType,
    } as any,
  );
  datos.append("finalidad", finalidad);
  if (objetivoUsuarioId != null) {
    datos.append("objetivoUsuarioId", String(objetivoUsuarioId));
  }

  const respuesta = await fetchConTimeout(`${API_BASE_URL}/archivos/imagenes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: datos,
  });

  return procesarRespuesta(respuesta) as Promise<ArchivoSubidoResponse>;
}

export async function subirMultimediaApi(
  uri: string,
  mimeType = "image/jpeg",
  fileName = "multimedia.jpg",
) {
  const datos = new FormData();
  datos.append(
    "archivo",
    {
      uri,
      name: fileName,
      type: mimeType,
    } as any,
  );
  datos.append("finalidad", "MULTIMEDIA_EJERCICIO");

  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/archivos/multimedia`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: datos,
    },
    60000,
  );

  return procesarRespuesta(respuesta) as Promise<ArchivoSubidoResponse>;
}

export async function actualizarFotoPerfilApi(
  usuarioId: number,
  fotoPerfilUrl: string,
) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/usuarios/${usuarioId}/foto`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ url: fotoPerfilUrl }),
  });

  return procesarRespuesta(respuesta);
}

export async function crearMensajeApi(
  datosMensaje: Record<string, unknown>,
): Promise<MessageApiResponse> {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/mensajes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(datosMensaje),
  });

  return procesarRespuesta(respuesta) as Promise<MessageApiResponse>;
}

export async function pausarMensajeApi(mensajeId: number) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/mensajes/${mensajeId}/pausar`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  return procesarRespuesta(respuesta);
}

export async function reanudarMensajeApi(mensajeId: number) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/mensajes/${mensajeId}/reanudar`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    },
  );

  return procesarRespuesta(respuesta);
}

export async function eliminarMensajeApi(mensajeId: number) {
  const respuesta = await fetchConTimeout(`${API_BASE_URL}/mensajes/${mensajeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!respuesta.ok) {
    const textoError = await respuesta.text();
    throw new Error(textoError || "Error en la petición al backend");
  }
}

export async function marcarMensajeLeidoApi(
  mensajeId: number,
) {
  const respuesta = await fetchConTimeout(
    `${API_BASE_URL}/mensajes/${mensajeId}/leer`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    },
  );

  return procesarRespuesta(respuesta);
}
