import type { ComponentProps, ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  RutinaApp,
  RutinaAsignadaApp,
  RutinaEjercicioApp,
} from "../../features/routines/types";
import { resolverUrlMedia } from "../../services/gymflowService";
import {
  Avatar,
  Card,
  EmptyState,
  FilterChip,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import {
  AdminScreenHeader,
  DetailSection,
  PersonDetailHeader,
  SearchInput,
  getInitials,
  normalizeSearch,
  withAlpha,
} from "./AdminClients";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type AdminRoutineFilter = "TODAS" | "MIAS" | "ENTRENADORES";

type RoutineUser = {
  id: number;
  nombre?: string | null;
  email?: string | null;
  fotoPerfilUrl?: string | null;
  rol?: string | null;
  activo?: boolean;
};

type AdminRoutinesProps = {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  adminId?: number | null;
  routines: RutinaApp[];
  selectedRoutine: RutinaApp | null;
  assignments: RutinaAsignadaApp[];
  users: RoutineUser[];
  search: string;
  activeFilter: AdminRoutineFilter;
  loading: boolean;
  saving: boolean;
  error: string;
  oneRmAccess: ReactNode;
  feedback: ReactNode;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: AdminRoutineFilter) => void;
  onAdminAvatarPress: () => void;
  onNewRoutine: () => void;
  onOpenRoutine: (routineId: number) => void;
  onBackToList: () => void;
  onManageExercises: () => void;
  onAssignClients: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeactivate: () => void;
  onRetry: () => void;
  getRoutineImage: (routine: RutinaApp) => string | null | undefined;
  renderExercise: (item: RutinaEjercicioApp, index: number) => ReactNode;
};

const FILTERS: { value: AdminRoutineFilter; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "MIAS", label: "Creadas por mí" },
  { value: "ENTRENADORES", label: "Entrenadores" },
];

function pluralize(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getOrderedExercises(routine: RutinaApp) {
  return [...(routine.ejercicios || [])].sort(
    (a, b) => (a.orden || 0) - (b.orden || 0),
  );
}

function getCreator(
  routine: RutinaApp,
  users: RoutineUser[],
  adminId?: number | null,
) {
  const user = users.find((candidate) => candidate.id === routine.creadorId);
  const isAdministration =
    user?.rol === "ADMIN" ||
    (adminId != null && routine.creadorId === adminId);

  if (isAdministration) {
    return {
      label: "Administración",
      role: "ADMIN",
      user,
    };
  }

  const name = routine.nombreCreador?.trim() || user?.nombre?.trim();

  return {
    label: name || "Creador no disponible",
    role: user?.rol || (routine.creadorId ? "ENTRENADOR" : "DESCONOCIDO"),
    user,
  };
}

function RoutineFallback({ theme, size = 58 }: { theme: GymFlowTheme; size?: number }) {
  return (
    <View
      style={[
        styles.routineFallback,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          backgroundColor: withAlpha(theme.primary, "12"),
        },
      ]}
    >
      <MaterialCommunityIcons
        name="arm-flex-outline"
        size={Math.round(size * 0.42)}
        color={theme.primary}
      />
    </View>
  );
}

function RoutineMetric({
  icon,
  value,
  label,
  theme,
}: {
  icon: IconName;
  value: string | number;
  label: string;
  theme: GymFlowTheme;
}) {
  return (
    <View style={[styles.metric, { backgroundColor: theme.surfaceSoft }]}>
      <MaterialCommunityIcons name={icon} size={19} color={theme.secondary} />
      <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: theme.muted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function AdminRoutines(props: AdminRoutinesProps) {
  const {
    theme,
    adminAvatarUri,
    adminInitials,
    adminId,
    routines,
    selectedRoutine,
    assignments,
    users,
    search,
    activeFilter,
    loading,
    saving,
    error,
    oneRmAccess,
    feedback,
    onSearchChange,
    onFilterChange,
    onAdminAvatarPress,
    onNewRoutine,
    onOpenRoutine,
    onBackToList,
    onManageExercises,
    onAssignClients,
    onEdit,
    onDuplicate,
    onDeactivate,
    onRetry,
    getRoutineImage,
    renderExercise,
  } = props;

  if (selectedRoutine) {
    const exercises = getOrderedExercises(selectedRoutine);
    const creator = getCreator(selectedRoutine, users, adminId);
    const activeAssignments = assignments.filter(
      (assignment) => assignment.activa !== false,
    );
    const imageUri = getRoutineImage(selectedRoutine);

    return (
      <ScreenContainer theme={theme}>
        <PersonDetailHeader
          eyebrow="FICHA DE RUTINA"
          title="Rutina"
          theme={theme}
          onBack={onBackToList}
          backAccessibilityLabel="Volver al listado de rutinas"
        />

        {feedback}

        <Card theme={theme} style={styles.detailHero}>
          <View style={styles.detailIdentity}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.detailImage} />
            ) : (
              <RoutineFallback theme={theme} size={78} />
            )}
            <View style={styles.detailCopy}>
              <Text style={[styles.detailName, { color: theme.text }]} numberOfLines={2}>
                {selectedRoutine.nombre}
              </Text>
              <Text style={[styles.creatorLabel, { color: theme.secondary }]} numberOfLines={2}>
                Creada por {creator.label}
              </Text>
              {!!selectedRoutine.descripcion?.trim() && (
                <Text style={[styles.detailDescription, { color: theme.muted }]}>
                  {selectedRoutine.descripcion.trim()}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <RoutineMetric
              icon="format-list-numbered"
              value={exercises.length}
              label="Ejercicios"
              theme={theme}
            />
            <RoutineMetric
              icon="timer-outline"
              value={
                selectedRoutine.duracionEstimadaMinutos
                  ? `${selectedRoutine.duracionEstimadaMinutos} min`
                  : "Sin dato"
              }
              label="Duración"
              theme={theme}
            />
            <RoutineMetric
              icon="account-group-outline"
              value={activeAssignments.length}
              label="Clientes"
              theme={theme}
            />
            <RoutineMetric
              icon="signal-cellular-2"
              value={selectedRoutine.nivel?.trim() || "Sin nivel"}
              label="Nivel"
              theme={theme}
            />
          </View>

          <PrimaryButton
            label="Gestionar ejercicios"
            icon="format-list-numbered"
            theme={theme}
            onPress={onManageExercises}
          />
          <View style={styles.secondaryActions}>
            <SecondaryButton
              label="Asignar"
              icon="account-plus-outline"
              theme={theme}
              onPress={onAssignClients}
              style={styles.secondaryAction}
            />
            <SecondaryButton
              label="Editar"
              icon="pencil-outline"
              theme={theme}
              onPress={onEdit}
              style={styles.secondaryAction}
            />
          </View>
          <Pressable
            style={[
              styles.duplicateAction,
              {
                backgroundColor: withAlpha(theme.secondary, "10"),
                borderColor: withAlpha(theme.secondary, "28"),
              },
            ]}
            onPress={onDuplicate}
            disabled={saving}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="content-copy" size={18} color={theme.secondary} />
            <Text style={[styles.duplicateText, { color: theme.secondary }]}>Duplicar rutina</Text>
          </Pressable>
        </Card>

        <SectionHeader
          title="Ejercicios"
          actionLabel="Gestionar"
          onAction={onManageExercises}
          theme={theme}
        />
        {exercises.length === 0 ? (
          <EmptyState
            icon="format-list-numbered"
            title="Rutina sin ejercicios"
            text="Añade ejercicios para construir este entrenamiento."
            actionLabel="Añadir ejercicio"
            onAction={onManageExercises}
            theme={theme}
          />
        ) : (
          <View style={styles.exerciseList}>
            {exercises.map((exercise, index) => renderExercise(exercise, index))}
          </View>
        )}

        <SectionHeader
          title="Clientes asignados"
          actionLabel="Gestionar"
          onAction={onAssignClients}
          theme={theme}
        />
        {activeAssignments.length === 0 ? (
          <EmptyState
            icon="account-multiple-plus-outline"
            title="Sin clientes asignados"
            text="Asigna la rutina a clientes activos del gimnasio."
            actionLabel="Asignar clientes"
            onAction={onAssignClients}
            theme={theme}
          />
        ) : (
          <Card theme={theme} style={styles.assignmentCard}>
            {activeAssignments.slice(0, 4).map((assignment, index) => {
              const client = users.find((user) => user.id === assignment.clienteId);
              const name = assignment.nombreCliente?.trim() || client?.nombre?.trim() || "Cliente";

              return (
                <View
                  key={assignment.id}
                  style={[
                    styles.assignmentRow,
                    index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                  ]}
                >
                  <Avatar
                    uri={resolverUrlMedia(client?.fotoPerfilUrl)}
                    initials={getInitials(name)}
                    size={42}
                    theme={theme}
                  />
                  <View style={styles.assignmentCopy}>
                    <Text style={[styles.assignmentName, { color: theme.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={[styles.assignmentEmail, { color: theme.muted }]} numberOfLines={1}>
                      {client?.email || "Sin email"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.secondary} />
                </View>
              );
            })}
            {activeAssignments.length > 4 && (
              <Text style={[styles.moreAssignments, { color: theme.secondary }]}>
                +{activeAssignments.length - 4} más
              </Text>
            )}
          </Card>
        )}

        <DetailSection title="Acciones" theme={theme}>
          <Pressable
            style={styles.dangerRow}
            onPress={onDeactivate}
            disabled={saving}
            accessibilityRole="button"
          >
            <View style={styles.dangerIcon}>
              <MaterialCommunityIcons name="archive-off-outline" size={20} color="#B91C1C" />
            </View>
            <View style={styles.dangerCopy}>
              <Text style={styles.dangerTitle}>Desactivar rutina</Text>
              <Text style={styles.dangerText}>
                Dejará de estar disponible para los clientes asignados.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#B91C1C" />
          </Pressable>
        </DetailSection>
      </ScreenContainer>
    );
  }

  const normalizedSearch = normalizeSearch(search);
  const filteredRoutines = routines.filter((routine) => {
    const creator = getCreator(routine, users, adminId);
    const matchesFilter =
      activeFilter === "TODAS" ||
      (activeFilter === "MIAS" && adminId != null && routine.creadorId === adminId) ||
      (activeFilter === "ENTRENADORES" &&
        creator.role === "ENTRENADOR" &&
        routine.creadorId !== adminId);
    const searchable = normalizeSearch(
      [routine.nombre, routine.descripcion, routine.nivel, creator.label]
        .filter(Boolean)
        .join(" "),
    );

    return matchesFilter && (!normalizedSearch || searchable.includes(normalizedSearch));
  });
  const hasFeedback = !!feedback;

  return (
    <ScreenContainer theme={theme}>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={adminAvatarUri}
        adminInitials={adminInitials}
        onAdminAvatarPress={onAdminAvatarPress}
        eyebrow="ENTRENAMIENTO"
        title="Rutinas"
        subtitle="Crea, organiza y asigna los entrenamientos del gimnasio"
      />

      <PrimaryButton
        label="Nueva rutina"
        icon="plus"
        theme={theme}
        onPress={onNewRoutine}
        style={styles.primaryAction}
      />

      {hasFeedback && <View style={styles.feedbackBlock}>{feedback}</View>}

      <View style={hasFeedback ? styles.toolAfterFeedback : styles.toolWithoutFeedback}>
        {oneRmAccess}
      </View>

      <SearchInput
        value={search}
        onChangeText={onSearchChange}
        theme={theme}
        placeholder="Buscar por nombre, nivel o creador..."
      />

      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <FilterChip
            key={filter.value}
            label={filter.label}
            active={activeFilter === filter.value}
            onPress={() => onFilterChange(filter.value)}
            stableHeight
            theme={theme}
          />
        ))}
      </View>

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>Rutinas del gimnasio</Text>
        {routines.length > 0 && (
          <Text style={[styles.summaryCount, { color: theme.muted }]}>
            {pluralize(routines.length, "activa", "activas")}
          </Text>
        )}
      </View>

      {!!error && routines.length > 0 && (
        <Card theme={theme} style={styles.inlineError}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#B91C1C" />
          <Text style={styles.inlineErrorText}>{error}</Text>
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text style={[styles.retryText, { color: theme.secondary }]}>Reintentar</Text>
          </Pressable>
        </Card>
      )}

      {loading && routines.length === 0 ? (
        <Card theme={theme} style={styles.loadingCard}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Cargando rutinas...</Text>
        </Card>
      ) : error && routines.length === 0 ? (
        <EmptyState
          icon="wifi-alert"
          title="No se pudieron cargar"
          text={error}
          actionLabel="Reintentar"
          onAction={onRetry}
          theme={theme}
        />
      ) : routines.length === 0 ? (
        <EmptyState
          icon="arm-flex-outline"
          title="Todavía no hay rutinas"
          text="Crea la primera rutina del gimnasio y añade sus ejercicios."
          actionLabel="Nueva rutina"
          onAction={onNewRoutine}
          theme={theme}
        />
      ) : filteredRoutines.length === 0 ? (
        <EmptyState
          icon="magnify-close"
          title="Sin resultados"
          text="Prueba con otra búsqueda o filtro."
          theme={theme}
        />
      ) : (
        <View style={styles.routineList}>
          {filteredRoutines.map((routine) => {
            const creator = getCreator(routine, users, adminId);
            const exerciseCount = routine.ejercicios?.length || 0;
            const assignmentCount = routine.totalAsignacionesActivas || 0;
            const imageUri = getRoutineImage(routine);

            return (
              <Card
                key={routine.id}
                theme={theme}
                style={styles.routineCard}
                onPress={() => onOpenRoutine(routine.id)}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.routineImage} />
                ) : (
                  <RoutineFallback theme={theme} />
                )}
                <View style={styles.routineCopy}>
                  <View style={styles.routineTitleRow}>
                    <Text style={[styles.routineTitle, { color: theme.text }]} numberOfLines={2}>
                      {routine.nombre}
                    </Text>
                    {!!routine.nivel?.trim() && (
                      <View style={[styles.levelBadge, { backgroundColor: withAlpha(theme.secondary, "12") }]}>
                        <Text style={[styles.levelText, { color: theme.secondary }]} numberOfLines={1}>
                          {routine.nivel.trim()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.creatorText, { color: theme.secondary }]} numberOfLines={1}>
                    Creada por {creator.label}
                  </Text>
                  <Text style={[styles.routineMeta, { color: theme.muted }]} numberOfLines={2}>
                    {[
                      pluralize(exerciseCount, "ejercicio", "ejercicios"),
                      routine.duracionEstimadaMinutos
                        ? `~${routine.duracionEstimadaMinutos} min`
                        : null,
                      pluralize(assignmentCount, "cliente", "clientes"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={23} color={theme.muted} />
              </Card>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  primaryAction: {
    marginTop: 17,
  },
  feedbackBlock: {
    marginTop: 13,
  },
  toolAfterFeedback: {
    marginTop: 4,
  },
  toolWithoutFeedback: {
    marginTop: 16,
  },
  summaryRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  summaryTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
  },
  summaryCount: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  filters: {
    marginTop: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  loadingCard: {
    minHeight: 88,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "700",
  },
  inlineError: {
    minHeight: 58,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  inlineErrorText: {
    flex: 1,
    minWidth: 0,
    color: "#991B1B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  retryText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  routineList: {
    marginTop: 12,
    gap: 12,
  },
  routineCard: {
    minHeight: 102,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
  },
  routineImage: {
    width: 58,
    height: 58,
    borderRadius: 17,
  },
  routineFallback: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  routineCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  routineTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  routineTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  levelBadge: {
    maxWidth: 92,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
  },
  creatorText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  routineMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  detailHero: {
    padding: 18,
    gap: 16,
  },
  detailIdentity: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },
  detailImage: {
    width: 78,
    height: 78,
    borderRadius: 23,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  detailName: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
  },
  creatorLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  detailDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  metric: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 126,
    minHeight: 82,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 11,
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
  },
  duplicateAction: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  duplicateText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  exerciseList: {
    gap: 10,
  },
  assignmentCard: {
    overflow: "hidden",
  },
  assignmentRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  assignmentCopy: {
    flex: 1,
    minWidth: 0,
  },
  assignmentName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  assignmentEmail: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginTop: 2,
  },
  moreAssignments: {
    borderTopWidth: 0,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  dangerRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dangerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerCopy: {
    flex: 1,
    minWidth: 0,
  },
  dangerTitle: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  dangerText: {
    color: "#7F1D1D",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 2,
  },
});
