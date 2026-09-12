import { useMemo, useState } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { resolverUrlMedia } from "../../services/gymflowService";
import {
  Avatar,
  Card,
  EmptyState,
  FilterChip,
  ScreenContainer,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import {
  AdminScreenHeader,
  DetailRow,
  DetailSection,
  PersonDetailHeader,
  PersonStatusBadge,
  SearchInput,
  getInitials,
  normalizeSearch,
  withAlpha,
} from "./AdminClients";

export type AdminReservationFilter = "ACTIVAS" | "CANCELADAS";

type AdminReservation = {
  id: number;
  fechaReserva?: string | null;
  estado?: string | null;
  claseId: number;
  nombreClase?: string | null;
  clienteId: number;
  nombreCliente?: string | null;
  gimnasioId?: number | null;
  nombreGimnasio?: string | null;
};

type AdminReservationClass = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  fechaHora?: string | null;
  duracionMinutos?: number | null;
  capacidadMaxima?: number | null;
  entrenadorId?: number | null;
  nombreEntrenador?: string | null;
  imagenUrl?: string | null;
  activa?: boolean;
};

type AdminReservationClient = {
  id: number;
  nombre?: string | null;
  email?: string | null;
  fotoPerfilUrl?: string | null;
};

type ReservationSession = {
  classId: number;
  gymClass?: AdminReservationClass;
  reservations: AdminReservation[];
  activeReservations: AdminReservation[];
  cancelledReservations: AdminReservation[];
  className: string;
  trainerName: string;
  timestamp: number | null;
  dateKey: string | null;
  capacity: number | null;
};

type AdminReservationsProps = {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  reservations: AdminReservation[];
  classes: AdminReservationClass[];
  clients: AdminReservationClient[];
  search: string;
  activeFilter: AdminReservationFilter;
  selectedSessionId: number | null;
  loading: boolean;
  error?: string | null;
  cancellingReservationId: number | null;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: AdminReservationFilter) => void;
  onAdminAvatarPress: () => void;
  onOpenSession: (classId: number) => void;
  onBackToList: () => void;
  onCancelReservation: (reservationId: number) => Promise<boolean>;
};

const FILTERS: { value: AdminReservationFilter; label: string }[] = [
  { value: "ACTIVAS", label: "Activas" },
  { value: "CANCELADAS", label: "Canceladas" },
];

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function capitalizeFirst(value: string) {
  return value ? `${value.charAt(0).toLocaleUpperCase("es-ES")}${value.slice(1)}` : value;
}

function formatTime(value?: string | null) {
  const date = parseDate(value);
  if (!date) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLongDate(value?: string | null) {
  const date = parseDate(value);
  if (!date) {
    return "Fecha no disponible";
  }

  return capitalizeFirst(
    new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date),
  );
}

function formatAgendaHeading(dateKey: string | null) {
  if (!dateKey) {
    return "FECHA NO DISPONIBLE";
  }

  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "FECHA NO DISPONIBLE";
  }

  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  const todayPrefix = dateKey === toDateKey(new Date()) ? "HOY · " : "";
  return `${todayPrefix}${formatted}`.toLocaleUpperCase("es-ES");
}

function formatReservationCreated(value?: string | null) {
  const date = parseDate(value);
  if (!date) {
    return null;
  }

  const day = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${day} · ${time}`;
}

function getTemporalStatus(session: ReservationSession) {
  if (!session.timestamp || !session.dateKey) {
    return null;
  }

  const todayKey = toDateKey(new Date());
  if (session.dateKey === todayKey) {
    return "Hoy";
  }

  return session.timestamp > Date.now() ? "Próxima" : "Pasada";
}

function getClient(
  reservation: AdminReservation,
  clientsById: Map<number, AdminReservationClient>,
) {
  return clientsById.get(reservation.clienteId);
}

function getClientName(
  reservation: AdminReservation,
  clientsById: Map<number, AdminReservationClient>,
) {
  return (
    getClient(reservation, clientsById)?.nombre ||
    reservation.nombreCliente ||
    "Cliente no disponible"
  );
}

function getReservationsForFilter(
  session: ReservationSession,
  filter: AdminReservationFilter,
) {
  return filter === "ACTIVAS"
    ? session.activeReservations
    : session.cancelledReservations;
}

function buildSessions(
  reservations: AdminReservation[],
  classes: AdminReservationClass[],
) {
  const classesById = new Map(classes.map((gymClass) => [gymClass.id, gymClass]));
  const grouped = new Map<number, AdminReservation[]>();

  reservations.forEach((reservation) => {
    const current = grouped.get(reservation.claseId) || [];
    current.push(reservation);
    grouped.set(reservation.claseId, current);
  });

  return Array.from(grouped.entries()).map(([classId, sessionReservations]) => {
    const gymClass = classesById.get(classId);
    const date = parseDate(gymClass?.fechaHora);
    const capacityValue = Number(gymClass?.capacidadMaxima);

    return {
      classId,
      gymClass,
      reservations: sessionReservations,
      activeReservations: sessionReservations.filter(
        (reservation) => reservation.estado === "RESERVADA",
      ),
      cancelledReservations: sessionReservations.filter(
        (reservation) => reservation.estado === "CANCELADA",
      ),
      className:
        gymClass?.nombre ||
        sessionReservations.find((reservation) => reservation.nombreClase)?.nombreClase ||
        "Clase no disponible",
      trainerName: gymClass?.nombreEntrenador || "Sin entrenador",
      timestamp: date?.getTime() ?? null,
      dateKey: date ? toDateKey(date) : null,
      capacity:
        Number.isFinite(capacityValue) && capacityValue >= 0 ? capacityValue : null,
    } satisfies ReservationSession;
  });
}

function sortSessions(a: ReservationSession, b: ReservationSession) {
  const todayKey = toDateKey(new Date());
  const getBucket = (session: ReservationSession) => {
    if (!session.dateKey) {
      return 2;
    }
    return session.dateKey >= todayKey ? 0 : 1;
  };
  const bucketA = getBucket(a);
  const bucketB = getBucket(b);

  if (bucketA !== bucketB) {
    return bucketA - bucketB;
  }
  if (bucketA === 2) {
    return a.className.localeCompare(b.className, "es-ES");
  }

  const timestampA = a.timestamp || 0;
  const timestampB = b.timestamp || 0;
  return bucketA === 0 ? timestampA - timestampB : timestampB - timestampA;
}

function TemporalBadge({
  label,
  theme,
}: {
  label: string;
  theme: GymFlowTheme;
}) {
  const color = label === "Pasada" ? theme.muted : theme.secondary;
  return <PersonStatusBadge label={label} color={color} />;
}

function ClassVisual({
  uri,
  theme,
  compact = false,
}: {
  uri?: string | null;
  theme: GymFlowTheme;
  compact?: boolean;
}) {
  const resolvedUri = resolverUrlMedia(uri);
  const sizeStyle = compact ? styles.sessionThumbnail : styles.detailImage;

  if (resolvedUri) {
    return <Image source={{ uri: resolvedUri }} style={sizeStyle} resizeMode="cover" />;
  }

  return (
    <View
      style={[
        sizeStyle,
        styles.classFallback,
        { backgroundColor: withAlpha(theme.primary, "12") },
      ]}
    >
      <MaterialCommunityIcons
        name="calendar-heart"
        size={compact ? 28 : 42}
        color={theme.primary}
      />
    </View>
  );
}

function SessionCard({
  session,
  filter,
  theme,
  onPress,
}: {
  session: ReservationSession;
  filter: AdminReservationFilter;
  theme: GymFlowTheme;
  onPress: () => void;
}) {
  const activeCount = session.activeReservations.length;
  const cancelledCount = session.cancelledReservations.length;
  const available =
    session.capacity === null ? null : Math.max(session.capacity - activeCount, 0);
  const occupancy =
    session.capacity && session.capacity > 0
      ? Math.min((activeCount / session.capacity) * 100, 100)
      : 0;
  const temporalStatus = getTemporalStatus(session);

  return (
    <Card theme={theme} style={styles.sessionCard} onPress={onPress}>
      <ClassVisual uri={session.gymClass?.imagenUrl} theme={theme} compact />
      <View style={styles.sessionBody}>
        <View style={styles.sessionTopRow}>
          <Text style={[styles.sessionTime, { color: theme.primary }]}>
            {formatTime(session.gymClass?.fechaHora)}
          </Text>
          {!!temporalStatus && <TemporalBadge label={temporalStatus} theme={theme} />}
        </View>
        <Text style={[styles.sessionName, { color: theme.text }]} numberOfLines={2}>
          {session.className}
        </Text>
        <Text style={[styles.sessionTrainer, { color: theme.muted }]} numberOfLines={1}>
          {session.trainerName}
        </Text>

        <View style={styles.sessionStatsRow}>
          <Text style={[styles.sessionCount, { color: theme.text }]} numberOfLines={1}>
            {filter === "ACTIVAS"
              ? session.capacity === null
                ? `${activeCount} ${activeCount === 1 ? "reserva" : "reservas"}`
                : `${activeCount}/${session.capacity} reservas`
              : `${cancelledCount} ${cancelledCount === 1 ? "cancelada" : "canceladas"}`}
          </Text>
          {filter === "ACTIVAS" && available !== null && (
            <Text style={[styles.availableText, { color: theme.secondary }]}>
              {available === 0 ? "Completa" : `${available} libres`}
            </Text>
          )}
        </View>
        {filter === "ACTIVAS" && session.capacity !== null && (
          <View style={[styles.occupancyTrack, { backgroundColor: theme.surfaceSoft }]}>
            <View
              style={[
                styles.occupancyFill,
                { backgroundColor: theme.secondary, width: `${occupancy}%` },
              ]}
            />
          </View>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.muted} />
    </Card>
  );
}

function ReservationRow({
  reservation,
  client,
  className,
  filter,
  theme,
  cancelling,
  cancellationLocked,
  onCancel,
}: {
  reservation: AdminReservation;
  client?: AdminReservationClient;
  className: string;
  filter: AdminReservationFilter;
  theme: GymFlowTheme;
  cancelling: boolean;
  cancellationLocked: boolean;
  onCancel: () => void;
}) {
  const clientName = client?.nombre || reservation.nombreCliente || "Cliente no disponible";
  const createdAt = formatReservationCreated(reservation.fechaReserva);
  const active = filter === "ACTIVAS";

  return (
    <View style={[styles.reservationRow, { borderBottomColor: theme.border }]}>
      <Avatar
        uri={resolverUrlMedia(client?.fotoPerfilUrl)}
        initials={getInitials(clientName, "Cliente")}
        size={48}
        theme={theme}
      />
      <View style={styles.reservationCopy}>
        <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={2}>
          {clientName}
        </Text>
        <Text style={[styles.clientEmail, { color: theme.muted }]} numberOfLines={1}>
          {client?.email || "Email no disponible"}
        </Text>
        {!!createdAt && (
          <Text style={[styles.reservationCreated, { color: theme.muted }]}>
            Reserva creada el {createdAt}
          </Text>
        )}
        <View style={styles.reservationActions}>
          <PersonStatusBadge
            label={active ? "Reservada" : "Cancelada"}
            color={active ? theme.secondary : theme.muted}
          />
          {active && (
            <Pressable
              style={[
                styles.cancelButton,
                { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
                cancellationLocked && !cancelling && styles.actionDisabled,
              ]}
              onPress={onCancel}
              disabled={cancellationLocked}
              accessibilityRole="button"
              accessibilityLabel={`Cancelar reserva de ${clientName} para ${className}`}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <MaterialCommunityIcons name="calendar-remove-outline" size={17} color="#DC2626" />
              )}
              <Text style={styles.cancelButtonText}>
                {cancelling ? "Cancelando" : "Cancelar reserva"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function SessionDetail({
  session,
  clientsById,
  filter,
  theme,
  cancellingReservationId,
  onBack,
  onCancelReservation,
}: {
  session: ReservationSession;
  clientsById: Map<number, AdminReservationClient>;
  filter: AdminReservationFilter;
  theme: GymFlowTheme;
  cancellingReservationId: number | null;
  onBack: () => void;
  onCancelReservation: (reservationId: number) => Promise<boolean>;
}) {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const visibleReservations = getReservationsForFilter(session, filter);
  const activeCount = session.activeReservations.length;
  const cancelledCount = session.cancelledReservations.length;
  const available =
    session.capacity === null ? null : Math.max(session.capacity - activeCount, 0);
  const temporalStatus = getTemporalStatus(session);

  const confirmCancellation = (reservation: AdminReservation) => {
    const clientName = getClientName(reservation, clientsById);
    setFeedback(null);
    Alert.alert(
      "Cancelar reserva",
      `Se cancelará la reserva de ${clientName} para ${session.className}. La plaza volverá a estar disponible.`,
      [
        { text: "Mantener reserva", style: "cancel" },
        {
          text: "Cancelar reserva",
          style: "destructive",
          onPress: async () => {
            const cancelled = await onCancelReservation(reservation.id);
            setFeedback(
              cancelled
                ? {
                    type: "success",
                    text: `La reserva de ${clientName} se ha cancelado correctamente.`,
                  }
                : {
                    type: "error",
                    text: "No se pudo cancelar la reserva. Inténtalo de nuevo.",
                  },
            );
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <PersonDetailHeader
        eyebrow="FICHA DE SESIÓN"
        title="Reservas"
        theme={theme}
        onBack={onBack}
        backAccessibilityLabel="Volver a la agenda de reservas"
      />

      <Card theme={theme} style={styles.identityCard}>
        <ClassVisual uri={session.gymClass?.imagenUrl} theme={theme} />
        <View style={styles.identityCopy}>
          <View style={styles.detailBadgeRow}>
            {!!temporalStatus && <TemporalBadge label={temporalStatus} theme={theme} />}
            {session.gymClass?.activa === false && (
              <PersonStatusBadge label="Desactivada" color={theme.muted} />
            )}
          </View>
          <Text style={[styles.detailClassName, { color: theme.text }]} numberOfLines={3}>
            {session.className}
          </Text>
          <Text style={[styles.detailDate, { color: theme.muted }]}>
            {formatLongDate(session.gymClass?.fechaHora)}
          </Text>
          <Text style={[styles.detailTime, { color: theme.primary }]}>
            {formatTime(session.gymClass?.fechaHora)}
          </Text>
        </View>
      </Card>

      <View style={styles.summaryGrid}>
        <Card theme={theme} style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>
            {session.capacity ?? "-"}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Capacidad</Text>
        </Card>
        <Card theme={theme} style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>{activeCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Activas</Text>
        </Card>
        <Card theme={theme} style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>{cancelledCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Canceladas</Text>
        </Card>
        <Card theme={theme} style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>
            {available ?? "-"}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Disponibles</Text>
        </Card>
      </View>

      <DetailSection title="Información de la sesión" theme={theme}>
        <DetailRow
          icon="calendar-outline"
          title="Fecha"
          value={formatLongDate(session.gymClass?.fechaHora)}
          theme={theme}
        />
        <DetailRow
          icon="clock-outline"
          title="Hora y duración"
          value={`${formatTime(session.gymClass?.fechaHora)}${
            session.gymClass?.duracionMinutos
              ? ` · ${session.gymClass.duracionMinutos} min`
              : ""
          }`}
          theme={theme}
        />
        <DetailRow
          icon="account-tie-outline"
          title="Entrenador"
          value={session.trainerName}
          theme={theme}
          last
        />
      </DetailSection>

      {!!feedback && (
        <View
          style={[
            styles.feedback,
            {
              backgroundColor:
                feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
              borderColor: feedback.type === "success" ? "#A7F3D0" : "#FECACA",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={feedback.type === "success" ? "check-circle-outline" : "alert-circle-outline"}
            size={20}
            color={feedback.type === "success" ? "#047857" : "#DC2626"}
          />
          <Text
            style={[
              styles.feedbackText,
              { color: feedback.type === "success" ? "#047857" : "#991B1B" },
            ]}
          >
            {feedback.text}
          </Text>
        </View>
      )}

      <View style={styles.clientsSection}>
        <View style={styles.clientsHeader}>
          <View style={styles.clientsHeaderCopy}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Clientes reservados</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
              {filter === "ACTIVAS" ? "Reservas activas" : "Reservas canceladas"}
            </Text>
          </View>
          <PersonStatusBadge
            label={String(visibleReservations.length)}
            color={filter === "ACTIVAS" ? theme.secondary : theme.muted}
          />
        </View>

        {visibleReservations.length === 0 ? (
          <EmptyState
            icon="account-group-outline"
            title={filter === "ACTIVAS" ? "Sin reservas activas" : "Sin reservas canceladas"}
            text="No hay clientes en el estado seleccionado para esta sesión."
            theme={theme}
          />
        ) : (
          <Card theme={theme} style={styles.reservationsCard}>
            {visibleReservations.map((reservation, index) => (
              <View key={reservation.id}>
                <ReservationRow
                  reservation={reservation}
                  client={clientsById.get(reservation.clienteId)}
                  className={session.className}
                  filter={filter}
                  theme={theme}
                  cancelling={cancellingReservationId === reservation.id}
                  cancellationLocked={cancellingReservationId !== null}
                  onCancel={() => confirmCancellation(reservation)}
                />
                {index < visibleReservations.length - 1 && (
                  <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

export default function AdminReservations(props: AdminReservationsProps) {
  const {
    theme,
    reservations,
    classes,
    clients,
    search,
    activeFilter,
    selectedSessionId,
    loading,
    error,
    onSearchChange,
    onFilterChange,
    onOpenSession,
  } = props;
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );
  const sessions = useMemo(
    () => buildSessions(reservations, classes),
    [reservations, classes],
  );
  const selectedSession =
    selectedSessionId === null
      ? null
      : sessions.find((session) => session.classId === selectedSessionId) || null;

  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        clientsById={clientsById}
        filter={activeFilter}
        theme={theme}
        cancellingReservationId={props.cancellingReservationId}
        onBack={props.onBackToList}
        onCancelReservation={props.onCancelReservation}
      />
    );
  }

  const normalizedSearch = normalizeSearch(search);
  const counts = {
    ACTIVAS: reservations.filter((reservation) => reservation.estado === "RESERVADA").length,
    CANCELADAS: reservations.filter((reservation) => reservation.estado === "CANCELADA").length,
  };
  const sessionsForFilter = sessions.filter(
    (session) => getReservationsForFilter(session, activeFilter).length > 0,
  );
  const filteredSessions = sessionsForFilter
    .filter((session) => {
      if (!normalizedSearch) {
        return true;
      }

      const clientText = getReservationsForFilter(session, activeFilter)
        .map((reservation) => {
          const client = clientsById.get(reservation.clienteId);
          return `${client?.nombre || reservation.nombreCliente || ""} ${client?.email || ""}`;
        })
        .join(" ");
      return normalizeSearch(
        `${session.className} ${session.trainerName} ${clientText}`,
      ).includes(normalizedSearch);
    })
    .sort(sortSessions);
  const dateSections = new Map<string, ReservationSession[]>();
  filteredSessions.forEach((session) => {
    const key = session.dateKey || "SIN_FECHA";
    const current = dateSections.get(key) || [];
    current.push(session);
    dateSections.set(key, current);
  });
  const hasAnyReservations = reservations.length > 0;
  const hasFilteredReservations = sessionsForFilter.length > 0;
  const showLoading = loading && !hasAnyReservations;
  const showError = !!error && !hasAnyReservations && !loading;

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={props.adminAvatarUri}
        adminInitials={props.adminInitials}
        onAdminAvatarPress={props.onAdminAvatarPress}
        eyebrow="ACTIVIDAD"
        title="Reservas"
        subtitle="Consulta y gestiona las reservas de las clases del gimnasio."
      />

      {showLoading ? (
        <Card theme={theme} style={styles.loadingCard}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Cargando reservas...</Text>
        </Card>
      ) : showError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudieron cargar las reservas"
          text={error || "Comprueba la conexión e inténtalo de nuevo."}
          theme={theme}
        />
      ) : !hasAnyReservations ? (
        <EmptyState
          icon="calendar-blank-outline"
          title="Todavía no hay reservas"
          text="Las sesiones reservadas por los clientes aparecerán aquí."
          theme={theme}
        />
      ) : (
        <>
          <View style={styles.searchBlock}>
            <SearchInput
              value={search}
              onChangeText={onSearchChange}
              theme={theme}
              placeholder="Buscar por cliente, clase o entrenador..."
            />
          </View>
          <View style={styles.filters}>
            {FILTERS.map((filter) => (
              <FilterChip
                key={filter.value}
                label={`${filter.label} ${counts[filter.value]}`}
                active={activeFilter === filter.value}
                theme={theme}
                onPress={() => onFilterChange(filter.value)}
                stableHeight
              />
            ))}
          </View>

          {!hasFilteredReservations ? (
            <EmptyState
              icon="calendar-remove-outline"
              title={
                activeFilter === "ACTIVAS"
                  ? "Sin reservas activas"
                  : "Sin reservas canceladas"
              }
              text="No hay sesiones con reservas en el estado seleccionado."
              theme={theme}
            />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              icon="calendar-search-outline"
              title="Sin resultados"
              text="Prueba con otro cliente, email, clase o entrenador."
              theme={theme}
            />
          ) : (
            <View style={styles.agenda}>
              {Array.from(dateSections.entries()).map(([dateKey, dateSessions]) => (
                <View key={dateKey} style={styles.dateSection}>
                  <Text
                    style={[styles.dateHeading, { color: theme.muted }]}
                  >
                    {formatAgendaHeading(dateKey === "SIN_FECHA" ? null : dateKey)}
                  </Text>
                  <View style={styles.sessionList}>
                    {dateSessions.map((session) => (
                      <SessionCard
                        key={session.classId}
                        session={session}
                        filter={activeFilter}
                        theme={theme}
                        onPress={() => onOpenSession(session.classId)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
  },
  loadingCard: {
    minHeight: 120,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  searchBlock: {
    marginTop: 17,
  },
  filters: {
    marginTop: 13,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  agenda: {
    gap: 24,
  },
  dateSection: {
    gap: 10,
  },
  dateHeading: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  sessionList: {
    gap: 11,
  },
  sessionCard: {
    minHeight: 132,
    padding: 13,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionThumbnail: {
    width: 76,
    height: 100,
    borderRadius: 17,
  },
  classFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  sessionBody: {
    flex: 1,
    minWidth: 0,
  },
  sessionTopRow: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionTime: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  sessionName: {
    marginTop: 2,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  sessionTrainer: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  sessionStatsRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionCount: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  availableText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "900",
  },
  occupancyTrack: {
    height: 5,
    marginTop: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  occupancyFill: {
    height: "100%",
    borderRadius: 999,
  },
  identityCard: {
    padding: 14,
    borderRadius: 24,
    gap: 15,
  },
  detailImage: {
    width: "100%",
    aspectRatio: 16 / 7,
    borderRadius: 18,
  },
  identityCopy: {
    paddingHorizontal: 3,
    paddingBottom: 3,
  },
  detailBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },
  detailClassName: {
    marginTop: 10,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
  },
  detailDate: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  detailTime: {
    marginTop: 3,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
  },
  summaryGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 88,
    padding: 14,
    borderRadius: 20,
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
  },
  summaryLabel: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  feedback: {
    marginTop: 18,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  feedbackText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
  },
  clientsSection: {
    marginTop: 23,
  },
  clientsHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clientsHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  reservationsCard: {
    borderRadius: 22,
    overflow: "hidden",
  },
  reservationRow: {
    minHeight: 112,
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  reservationCopy: {
    flex: 1,
    minWidth: 0,
  },
  clientName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  clientEmail: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  reservationCreated: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  reservationActions: {
    marginTop: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  cancelButton: {
    minHeight: 38,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 75,
  },
});
