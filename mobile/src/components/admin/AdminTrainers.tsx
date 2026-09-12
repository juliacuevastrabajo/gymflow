import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Card,
  EmptyState,
  FilterChip,
  PrimaryButton,
  ScreenContainer,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import {
  AdminScreenHeader,
  DetailRow,
  DetailSection,
  PersonDetailHeader,
  PersonIdentityCard,
  PersonListCard,
  PersonStatusBadge,
  SearchInput,
  normalizeSearch,
  withAlpha,
} from "./AdminClients";

export type AdminTrainerFilter = "TODOS" | "ACTIVOS" | "INACTIVOS";

type TrainerStatus = Exclude<AdminTrainerFilter, "TODOS">;

type AdminTrainer = {
  id: number;
  nombre?: string | null;
  email?: string | null;
  fotoPerfilUrl?: string | null;
  activo?: boolean;
  telefono?: string | null;
  fechaAlta?: string | null;
  fechaCreacion?: string | null;
  createdAt?: string | null;
};

type TrainerClass = {
  id: number;
  entrenadorId?: number | null;
  nombre?: string | null;
  fechaHora?: string | null;
  duracionMinutos?: number | null;
  activa?: boolean;
};

type TrainerRoutine = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  nombreCreador?: string | null;
  creadorId?: number | null;
  activa?: boolean;
};

type AdminTrainersProps = {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  trainers: AdminTrainer[];
  classes: TrainerClass[];
  routines: TrainerRoutine[];
  routinesLoading: boolean;
  routinesError?: string | null;
  search: string;
  activeFilter: AdminTrainerFilter;
  selectedTrainerId: number | null;
  updatingPhoto: boolean;
  userMessagesAllowed: boolean;
  canManagePhoto: boolean;
  loading?: boolean;
  error?: string | null;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: AdminTrainerFilter) => void;
  onAdminAvatarPress: () => void;
  onNewTrainer: () => void;
  onOpenTrainer: (trainerId: number) => void;
  onBackToList: () => void;
  onChangePhoto: (trainer: AdminTrainer) => void;
  onSendMessage: (trainer: AdminTrainer) => void;
  onDeactivate: (trainer: AdminTrainer) => void;
};

const FILTERS: { value: AdminTrainerFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ACTIVOS", label: "Activos" },
  { value: "INACTIVOS", label: "Inactivos" },
];

function getTrainerStatus(trainer: AdminTrainer): TrainerStatus {
  return trainer.activo === false ? "INACTIVOS" : "ACTIVOS";
}

function TrainerStatusBadge({
  status,
  theme,
}: {
  status: TrainerStatus;
  theme: GymFlowTheme;
}) {
  return (
    <PersonStatusBadge
      label={status === "ACTIVOS" ? "Activo" : "Inactivo"}
      color={status === "ACTIVOS" ? theme.secondary : theme.muted}
    />
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatSessionDate(value?: string | null) {
  if (!value) {
    return "Fecha por confirmar";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha por confirmar";
  }

  const dateText = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  const timeText = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${dateText} · ${timeText}`;
}

function TrainerDetail({
  trainer,
  theme,
  classes,
  routines,
  routinesLoading,
  routinesError,
  updatingPhoto,
  userMessagesAllowed,
  canManagePhoto,
  onBack,
  onChangePhoto,
  onSendMessage,
  onDeactivate,
}: {
  trainer: AdminTrainer;
  theme: GymFlowTheme;
  classes: TrainerClass[];
  routines: TrainerRoutine[];
  routinesLoading: boolean;
  routinesError?: string | null;
  updatingPhoto: boolean;
  userMessagesAllowed: boolean;
  canManagePhoto: boolean;
  onBack: () => void;
  onChangePhoto: () => void;
  onSendMessage: () => void;
  onDeactivate: () => void;
}) {
  const status = getTrainerStatus(trainer);
  const trainerClasses = classes
    .filter((gymClass) => gymClass.entrenadorId === trainer.id && gymClass.activa !== false)
    .sort(
      (classA, classB) =>
        new Date(classA.fechaHora || 0).getTime() -
        new Date(classB.fechaHora || 0).getTime(),
    );
  const upcomingClasses = trainerClasses.filter((gymClass) => {
    const timestamp = new Date(gymClass.fechaHora || 0).getTime();
    return Number.isFinite(timestamp) && timestamp >= Date.now();
  });
  const normalizedTrainerName = normalizeSearch(trainer.nombre || "");
  const trainerRoutines = routines.filter((routine) => {
    if (routine.activa === false) {
      return false;
    }

    if (routine.creadorId != null) {
      return routine.creadorId === trainer.id;
    }

    return (
      !!normalizedTrainerName &&
      normalizeSearch(routine.nombreCreador || "") === normalizedTrainerName
    );
  });
  const joinedAt = formatDate(
    trainer.fechaAlta || trainer.fechaCreacion || trainer.createdAt,
  );

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <PersonDetailHeader
        eyebrow="FICHA DE ENTRENADOR"
        title="Entrenador"
        theme={theme}
        onBack={onBack}
        backAccessibilityLabel="Volver al listado de entrenadores"
      />

      <PersonIdentityCard
        person={trainer}
        statusBadge={<TrainerStatusBadge status={status} theme={theme} />}
        theme={theme}
        updatingPhoto={updatingPhoto}
        onChangePhoto={onChangePhoto}
        photoAccessibilityLabel="Cambiar foto del entrenador"
        fallbackLabel="Entrenador"
      />

      {trainerClasses.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Card theme={theme} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {trainerClasses.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Sesiones</Text>
            </Card>
            <Card theme={theme} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {upcomingClasses.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Próximas</Text>
            </Card>
          </View>
        </View>
      )}

      <DetailSection title="Datos personales" theme={theme}>
        <DetailRow
          icon="account-tie-outline"
          title="Nombre"
          value={trainer.nombre || "Sin nombre"}
          theme={theme}
        />
        <DetailRow
          icon="email-outline"
          title="Email"
          value={trainer.email || "Sin email"}
          theme={theme}
          last={!trainer.telefono && !joinedAt}
        />
        {!!trainer.telefono && (
          <DetailRow
            icon="phone-outline"
            title="Teléfono"
            value={trainer.telefono}
            theme={theme}
            last={!joinedAt}
          />
        )}
        {!!joinedAt && (
          <DetailRow
            icon="calendar-check-outline"
            title="En el equipo desde"
            value={joinedAt}
            theme={theme}
            last
          />
        )}
      </DetailSection>

      <DetailSection title="Clases asignadas" theme={theme}>
        {upcomingClasses.length === 0 ? (
          <View style={styles.inlineEmpty}>
            <View
              style={[
                styles.inlineIcon,
                { backgroundColor: withAlpha(theme.primary, "12") },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={21}
                color={theme.primary}
              />
            </View>
            <View style={styles.inlineCopy}>
              <Text style={[styles.inlineTitle, { color: theme.text }]}>Sin próximas clases</Text>
              <Text style={[styles.inlineText, { color: theme.muted }]}>No tiene sesiones futuras asignadas.</Text>
            </View>
          </View>
        ) : (
          upcomingClasses.slice(0, 2).map((gymClass, index, visible) => (
            <View
              key={gymClass.id}
              style={[
                styles.contentRow,
                index < visible.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.inlineIcon,
                  { backgroundColor: withAlpha(theme.primary, "12") },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-clock-outline"
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View style={styles.inlineCopy}>
                <Text style={[styles.inlineTitle, { color: theme.text }]} numberOfLines={2}>
                  {gymClass.nombre || "Clase"}
                </Text>
                <Text style={[styles.inlineText, { color: theme.muted }]}>
                  {formatSessionDate(gymClass.fechaHora)}
                </Text>
                {!!gymClass.duracionMinutos && (
                  <Text style={[styles.inlineMeta, { color: theme.muted }]}>
                    {gymClass.duracionMinutos} min
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </DetailSection>

      <DetailSection title="Rutinas" theme={theme}>
        {routinesLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.inlineText, { color: theme.muted }]}>Cargando rutinas...</Text>
          </View>
        ) : routinesError ? (
          <View style={styles.inlineEmpty}>
            <View style={[styles.inlineIcon, { backgroundColor: withAlpha(theme.primary, "12") }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={21} color={theme.primary} />
            </View>
            <View style={styles.inlineCopy}>
              <Text style={[styles.inlineTitle, { color: theme.text }]}>No disponibles</Text>
              <Text style={[styles.inlineText, { color: theme.muted }]}>{routinesError}</Text>
            </View>
          </View>
        ) : trainerRoutines.length === 0 ? (
          <View style={styles.inlineEmpty}>
            <View style={[styles.inlineIcon, { backgroundColor: withAlpha(theme.primary, "12") }]}>
              <MaterialCommunityIcons name="dumbbell" size={21} color={theme.primary} />
            </View>
            <View style={styles.inlineCopy}>
              <Text style={[styles.inlineTitle, { color: theme.text }]}>Sin rutinas creadas</Text>
              <Text style={[styles.inlineText, { color: theme.muted }]}>No hay rutinas activas asociadas a este entrenador.</Text>
            </View>
          </View>
        ) : (
          trainerRoutines.slice(0, 3).map((routine, index, visible) => (
            <View
              key={routine.id}
              style={[
                styles.contentRow,
                index < visible.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View style={[styles.inlineIcon, { backgroundColor: withAlpha(theme.secondary, "12") }]}>
                <MaterialCommunityIcons name="dumbbell" size={20} color={theme.secondary} />
              </View>
              <View style={styles.inlineCopy}>
                <Text style={[styles.inlineTitle, { color: theme.text }]} numberOfLines={2}>
                  {routine.nombre || "Rutina"}
                </Text>
                {!!routine.descripcion && (
                  <Text style={[styles.inlineText, { color: theme.muted }]} numberOfLines={2}>
                    {routine.descripcion}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </DetailSection>

      <DetailSection title="Comunicación" theme={theme}>
        <DetailRow
          icon="message-text-outline"
          title="Enviar mensaje"
          value={
            status === "INACTIVOS"
              ? "El acceso del entrenador está desactivado"
              : "Abre una conversación individual"
          }
          theme={theme}
          onPress={status === "INACTIVOS" ? undefined : onSendMessage}
          last
        />
      </DetailSection>

      <DetailSection title="Permisos" theme={theme}>
        <DetailRow
          icon={userMessagesAllowed ? "message-check-outline" : "message-lock-outline"}
          title="Mensajes a usuarios"
          value={
            userMessagesAllowed
              ? "Permitido por la configuración del gimnasio"
              : "No permitido por la configuración del gimnasio"
          }
          theme={theme}
          last
        />
      </DetailSection>

      <DetailSection title="Acciones de cuenta" theme={theme}>
        {canManagePhoto && (
          <DetailRow
            icon="camera-outline"
            title="Cambiar foto"
            value="Actualiza la imagen del perfil"
            theme={theme}
            onPress={onChangePhoto}
            last={status === "INACTIVOS"}
          />
        )}
        {status === "ACTIVOS" && (
          <DetailRow
            icon="account-off-outline"
            title="Desactivar entrenador"
            value="Bloquea el acceso conservando su historial"
            theme={theme}
            onPress={onDeactivate}
            danger
            last
          />
        )}
      </DetailSection>
    </ScreenContainer>
  );
}

export default function AdminTrainers(props: AdminTrainersProps) {
  const selectedTrainer =
    props.trainers.find((trainer) => trainer.id === props.selectedTrainerId) || null;

  if (selectedTrainer) {
    return (
      <TrainerDetail
        trainer={selectedTrainer}
        theme={props.theme}
        classes={props.classes}
        routines={props.routines}
        routinesLoading={props.routinesLoading}
        routinesError={props.routinesError}
        updatingPhoto={props.updatingPhoto}
        userMessagesAllowed={props.userMessagesAllowed}
        canManagePhoto={props.canManagePhoto}
        onBack={props.onBackToList}
        onChangePhoto={() => props.onChangePhoto(selectedTrainer)}
        onSendMessage={() => props.onSendMessage(selectedTrainer)}
        onDeactivate={() => props.onDeactivate(selectedTrainer)}
      />
    );
  }

  const normalizedSearch = normalizeSearch(props.search);
  const counts = props.trainers.reduce(
    (result, trainer) => {
      result[getTrainerStatus(trainer)] += 1;
      return result;
    },
    { ACTIVOS: 0, INACTIVOS: 0 },
  );
  const filteredTrainers = props.trainers.filter((trainer) => {
    const matchesSearch = !normalizedSearch
      ? true
      : normalizeSearch(`${trainer.nombre || ""} ${trainer.email || ""}`).includes(
          normalizedSearch,
        );
    const matchesFilter =
      props.activeFilter === "TODOS" ||
      getTrainerStatus(trainer) === props.activeFilter;

    return matchesSearch && matchesFilter;
  });
  const generalEmpty = props.trainers.length === 0;
  const resultsEmpty = !generalEmpty && filteredTrainers.length === 0;
  const resultText =
    props.activeFilter === "TODOS" && !normalizedSearch
      ? `${props.trainers.length} ${props.trainers.length === 1 ? "entrenador" : "entrenadores"}`
      : `Mostrando ${filteredTrainers.length} de ${props.trainers.length} entrenadores`;

  return (
    <ScreenContainer theme={props.theme} style={styles.screen}>
      <AdminScreenHeader
        theme={props.theme}
        adminAvatarUri={props.adminAvatarUri}
        adminInitials={props.adminInitials}
        onAdminAvatarPress={props.onAdminAvatarPress}
        eyebrow="PERSONAL"
        title="Entrenadores"
        subtitle="Gestiona el equipo de profesionales del gimnasio."
      />

      <PrimaryButton
        label="Nuevo entrenador"
        icon="account-tie-outline"
        theme={props.theme}
        onPress={props.onNewTrainer}
        style={styles.newTrainerButton}
      />

      {props.loading && generalEmpty ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={props.theme.primary} />
          <Text style={[styles.inlineText, { color: props.theme.muted }]}>Cargando entrenadores...</Text>
        </View>
      ) : props.error && generalEmpty ? (
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudieron cargar"
          text={props.error}
          theme={props.theme}
        />
      ) : generalEmpty ? (
        <EmptyState
          icon="account-tie-outline"
          title="Todavía no hay entrenadores"
          text="Añade el primer entrenador para empezar a organizar el equipo."
          actionLabel="Nuevo entrenador"
          onAction={props.onNewTrainer}
          theme={props.theme}
        />
      ) : (
        <>
          <SearchInput
            value={props.search}
            onChangeText={props.onSearchChange}
            theme={props.theme}
            placeholder="Buscar por nombre o email..."
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            keyboardShouldPersistTaps="handled"
          >
            {FILTERS.map((filter) => {
              const count =
                filter.value === "TODOS"
                  ? props.trainers.length
                  : counts[filter.value];
              return (
                <FilterChip
                  key={filter.value}
                  label={`${filter.label} ${count}`}
                  active={props.activeFilter === filter.value}
                  theme={props.theme}
                  onPress={() => props.onFilterChange(filter.value)}
                  stableHeight
                />
              );
            })}
          </ScrollView>
          <Text style={[styles.resultMeta, { color: props.theme.muted }]}>
            {resultText}
          </Text>

          {resultsEmpty ? (
            <EmptyState
              icon="account-search-outline"
              title={normalizedSearch ? "Sin resultados" : "Sin entrenadores en este estado"}
              text={
                normalizedSearch
                  ? "Prueba con otro nombre o email."
                  : "No hay entrenadores que coincidan con el filtro seleccionado."
              }
              theme={props.theme}
            />
          ) : (
            <View style={styles.trainerList}>
              {filteredTrainers.map((trainer) => (
                <PersonListCard
                  key={trainer.id}
                  person={trainer}
                  statusBadge={
                    <TrainerStatusBadge
                      status={getTrainerStatus(trainer)}
                      theme={props.theme}
                    />
                  }
                  theme={props.theme}
                  onPress={() => props.onOpenTrainer(trainer.id)}
                  fallbackLabel="Entrenador"
                />
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
  newTrainerButton: {
    minHeight: 50,
    marginTop: 15,
    marginBottom: 16,
  },
  filters: {
    gap: 9,
    paddingTop: 13,
    paddingRight: 20,
    alignItems: "center",
  },
  resultMeta: {
    marginTop: 13,
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  trainerList: {
    gap: 10,
  },
  loadingState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  detailSection: {
    marginTop: 23,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minHeight: 88,
    padding: 15,
    borderRadius: 20,
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  inlineEmpty: {
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inlineIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineCopy: {
    flex: 1,
    minWidth: 0,
  },
  inlineTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  inlineText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  inlineMeta: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  contentRow: {
    minHeight: 78,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingRow: {
    minHeight: 78,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
