import type { ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  RutinaApp,
  RutinaEjercicioApp,
} from "../../features/routines/types";
import { colorConAlpha } from "../../theme/colorUtils";
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
import { OneRepMaxAccessCard } from "../routines/OneRepMaxCalculator";

type TrainerAssignedStudent = {
  id: number;
  name: string;
  initials: string;
  photoUri?: string | null;
};

function RoutineMetric({
  label,
  value,
  icon,
  theme,
  secondaryColor,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  theme: GymFlowTheme;
  secondaryColor: string;
}) {
  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: colorConAlpha(secondaryColor, "10") },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={secondaryColor} />
      <Text
        style={[styles.metricValue, { color: theme.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={[styles.metricLabel, { color: theme.muted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TrainerRoutinesOverview({
  theme,
  primaryColor,
  secondaryColor,
  oneRepMaxSecondaryColor,
  oneRepMaxIconBackgroundColor,
  trainerPhotoUri,
  trainerInitials,
  feedback,
  search,
  levels,
  selectedLevel,
  routines,
  filteredRoutines,
  selectedRoutine,
  selectedExercises,
  assignedStudents,
  loading,
  error,
  saving,
  getRoutineImage,
  renderExercise,
  onOpenProfile,
  onNewRoutine,
  onOpenOneRepMax,
  onSearchChange,
  onLevelChange,
  onRetry,
  onOpenRoutine,
  onBackToList,
  onManageExercises,
  onAssignStudents,
  onEditRoutine,
  onDuplicateRoutine,
  onEditExercises,
  onAddExercise,
  onDeactivateRoutine,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  oneRepMaxSecondaryColor: string;
  oneRepMaxIconBackgroundColor: string;
  trainerPhotoUri?: string | null;
  trainerInitials: string;
  feedback?: ReactNode;
  search: string;
  levels: string[];
  selectedLevel: string;
  routines: RutinaApp[];
  filteredRoutines: RutinaApp[];
  selectedRoutine?: RutinaApp | null;
  selectedExercises: RutinaEjercicioApp[];
  assignedStudents: TrainerAssignedStudent[];
  loading: boolean;
  error?: string | null;
  saving: boolean;
  getRoutineImage: (routine: RutinaApp) => string | null;
  renderExercise: (item: RutinaEjercicioApp, index: number) => ReactNode;
  onOpenProfile: () => void;
  onNewRoutine: () => void;
  onOpenOneRepMax: () => void;
  onSearchChange: (value: string) => void;
  onLevelChange: (level: string) => void;
  onRetry: () => void;
  onOpenRoutine: (routineId: number) => void;
  onBackToList: () => void;
  onManageExercises: () => void;
  onAssignStudents: () => void;
  onEditRoutine: () => void;
  onDuplicateRoutine: () => void;
  onEditExercises: () => void;
  onAddExercise: () => void;
  onDeactivateRoutine: () => void;
}) {
  const renderRoutineCard = (routine: RutinaApp) => {
    const exerciseCount = routine.ejercicios?.length || 0;
    const routineImage = getRoutineImage(routine);
    const meta = [
      `${exerciseCount} ejercicio${exerciseCount === 1 ? "" : "s"}`,
      routine.duracionEstimadaMinutos
        ? `~${routine.duracionEstimadaMinutos} min`
        : null,
      routine.totalAsignacionesActivas != null
        ? `${routine.totalAsignacionesActivas} alumno${routine.totalAsignacionesActivas === 1 ? "" : "s"}`
        : null,
    ].filter(Boolean);

    return (
      <Card
        key={routine.id}
        theme={theme}
        style={styles.routineCard}
        onPress={() => onOpenRoutine(routine.id)}
      >
        {routineImage ? (
          <Image source={{ uri: routineImage }} style={styles.routineThumb} />
        ) : (
          <View
            style={[
              styles.routineIcon,
              { backgroundColor: colorConAlpha(primaryColor, "12") },
            ]}
          >
            <MaterialCommunityIcons
              name="arm-flex-outline"
              size={24}
              color={primaryColor}
            />
          </View>
        )}
        <View style={styles.routineCardCopy}>
          <View style={styles.routineCardTitleRow}>
            <Text
              style={[styles.routineCardTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {routine.nombre}
            </Text>
            {!!routine.nivel && (
              <View
                style={[
                  styles.levelPill,
                  { backgroundColor: colorConAlpha(secondaryColor, "12") },
                ]}
              >
                <Text
                  style={[styles.levelText, { color: secondaryColor }]}
                  numberOfLines={1}
                >
                  {routine.nivel}
                </Text>
              </View>
            )}
          </View>
          {!!routine.descripcion && (
            <Text
              style={[styles.routineDescription, { color: theme.muted }]}
              numberOfLines={2}
            >
              {routine.descripcion}
            </Text>
          )}
          <Text
            style={[styles.routineMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {meta.join(" · ")}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={23}
          color={theme.muted}
        />
      </Card>
    );
  };

  if (selectedRoutine) {
    return (
      <ScreenContainer theme={theme}>
        <View style={styles.topBar}>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={onBackToList}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.text}
            />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={[styles.eyebrow, { color: secondaryColor }]}>
              Entrenamiento
            </Text>
            <Text
              style={[styles.topTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              Rutina
            </Text>
          </View>
        </View>

        {feedback}

        <Card theme={theme} style={styles.detailHero}>
          <View style={styles.detailTopRow}>
            <View
              style={[
                styles.detailIcon,
                { backgroundColor: colorConAlpha(primaryColor, "12") },
              ]}
            >
              <MaterialCommunityIcons
                name="arm-flex-outline"
                size={30}
                color={primaryColor}
              />
            </View>
            <View style={styles.detailCopy}>
              <Text
                style={[styles.detailTitle, { color: theme.text }]}
                numberOfLines={2}
              >
                {selectedRoutine.nombre}
              </Text>
              {!!selectedRoutine.descripcion && (
                <Text style={[styles.detailText, { color: theme.muted }]}>
                  {selectedRoutine.descripcion}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.detailStats}>
            <RoutineMetric
              label="Nivel"
              value={selectedRoutine.nivel || "Sin nivel"}
              icon="signal-cellular-2"
              theme={theme}
              secondaryColor={secondaryColor}
            />
            <RoutineMetric
              label="Duración"
              value={
                selectedRoutine.duracionEstimadaMinutos
                  ? `${selectedRoutine.duracionEstimadaMinutos} min`
                  : "Sin dato"
              }
              icon="timer-outline"
              theme={theme}
              secondaryColor={secondaryColor}
            />
            <RoutineMetric
              label="Ejercicios"
              value={selectedExercises.length}
              icon="format-list-numbered"
              theme={theme}
              secondaryColor={secondaryColor}
            />
            <RoutineMetric
              label="Alumnos"
              value={selectedRoutine.totalAsignacionesActivas || 0}
              icon="account-group-outline"
              theme={theme}
              secondaryColor={secondaryColor}
            />
          </View>

          <PrimaryButton
            label="Gestionar ejercicios"
            icon="format-list-numbered"
            theme={theme}
            onPress={onManageExercises}
          />
          <View style={styles.actionsRow}>
            <SecondaryButton
              label="Asignar"
              icon="account-plus-outline"
              theme={theme}
              onPress={onAssignStudents}
              style={styles.actionButton}
            />
            <SecondaryButton
              label="Editar"
              icon="pencil-outline"
              theme={theme}
              onPress={onEditRoutine}
              style={styles.actionButton}
            />
          </View>
          <Pressable
            style={[
              styles.duplicateAction,
              {
                backgroundColor: colorConAlpha(secondaryColor, "10"),
                borderColor: colorConAlpha(secondaryColor, "24"),
              },
            ]}
            onPress={onDuplicateRoutine}
            disabled={saving}
          >
            <MaterialCommunityIcons
              name="content-copy"
              size={18}
              color={secondaryColor}
            />
            <Text style={[styles.duplicateText, { color: secondaryColor }]}>
              Duplicar rutina
            </Text>
          </Pressable>
        </Card>

        <SectionHeader
          title="Ejercicios"
          actionLabel="Editar"
          onAction={onEditExercises}
          theme={theme}
        />

        {selectedExercises.length === 0 ? (
          <EmptyState
            icon="format-list-numbered"
            title="Rutina sin ejercicios"
            text="Añade ejercicios para que tus alumnos puedan seguir el entrenamiento en orden."
            actionLabel="Añadir ejercicio"
            onAction={onAddExercise}
            theme={theme}
          />
        ) : (
          <View style={styles.exerciseList}>
            {selectedExercises.map((item, index) =>
              renderExercise(item, index),
            )}
          </View>
        )}

        <SectionHeader
          title="Alumnos asignados"
          actionLabel="Gestionar"
          onAction={onAssignStudents}
          theme={theme}
        />

        {assignedStudents.length === 0 ? (
          <EmptyState
            icon="account-multiple-plus-outline"
            title="Sin alumnos asignados"
            text="Cuando asignes esta rutina a un alumno, aparecera aqui."
            actionLabel="Asignar alumnos"
            onAction={onAssignStudents}
            theme={theme}
          />
        ) : (
          <View style={styles.assignedPreview}>
            {assignedStudents.slice(0, 4).map((student) => (
              <Card
                key={student.id}
                theme={theme}
                style={styles.studentCompact}
              >
                <Avatar
                  uri={student.photoUri}
                  initials={student.initials}
                  size={40}
                  theme={theme}
                />
                <View style={styles.studentCopy}>
                  <Text
                    style={[styles.studentName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {student.name}
                  </Text>
                  <Text
                    style={[styles.studentMeta, { color: theme.muted }]}
                    numberOfLines={1}
                  >
                    Asignada
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        <Pressable
          style={[
            styles.dangerLink,
            { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
          ]}
          onPress={onDeactivateRoutine}
          disabled={saving}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color="#B91C1C"
          />
          <Text style={styles.dangerText}>Desactivar rutina</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer theme={theme}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: secondaryColor }]}>
            Entrenamiento
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Rutinas</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Crea, organiza y asigna entrenamientos a tus alumnos.
          </Text>
        </View>
        <Avatar
          uri={trainerPhotoUri}
          initials={trainerInitials}
          size={52}
          theme={theme}
          onPress={onOpenProfile}
        />
      </View>

      <PrimaryButton
        label="Nueva rutina"
        icon="plus"
        theme={theme}
        onPress={onNewRoutine}
        style={styles.mainButton}
      />

      <OneRepMaxAccessCard
        theme={theme}
        secondaryColor={oneRepMaxSecondaryColor}
        iconBackgroundColor={oneRepMaxIconBackgroundColor}
        onPress={onOpenOneRepMax}
      />

      {feedback}

      <View
        style={[
          styles.search,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <MaterialCommunityIcons name="magnify" size={22} color={theme.muted} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Buscar rutina..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
        />
      </View>

      {levels.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {["TODAS", ...levels].slice(0, 6).map((level) => (
            <FilterChip
              key={level}
              label={level === "TODAS" ? "Todas" : level}
              active={selectedLevel === level}
              theme={theme}
              onPress={() => onLevelChange(level)}
            />
          ))}
        </ScrollView>
      )}

      <SectionHeader
        title="Mis rutinas"
        actionLabel={
          routines.length > 0 ? `${routines.length} total` : undefined
        }
        theme={theme}
      />

      {loading && routines.length === 0 ? (
        <Card theme={theme} style={styles.loadingCard}>
          <ActivityIndicator size="small" color={primaryColor} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Cargando rutinas...
          </Text>
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
          title="Sin rutinas todavía"
          text="Crea tu primera rutina y después añade ejercicios y alumnos."
          actionLabel="Nueva rutina"
          onAction={onNewRoutine}
          theme={theme}
        />
      ) : filteredRoutines.length === 0 ? (
        <EmptyState
          icon="magnify-close"
          title="Sin resultados"
          text="Prueba con otro nombre o nivel."
          theme={theme}
        />
      ) : (
        <View style={styles.routineList}>
          {filteredRoutines.map(renderRoutineCard)}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: { fontSize: 30, fontWeight: "900", lineHeight: 35 },
  subtitle: { fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 4 },
  loadingCard: {
    minHeight: 120,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { fontSize: 13, fontWeight: "800" },
  mainButton: { marginBottom: 14 },
  search: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },
  filterRow: { gap: 10, paddingRight: 20, paddingBottom: 2 },
  routineList: { gap: 12 },
  routineCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routineIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  routineThumb: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  routineCardCopy: { flex: 1, minWidth: 0 },
  routineCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routineCardTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  levelPill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  levelText: { fontSize: 11, fontWeight: "900" },
  routineDescription: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 5,
  },
  routineMeta: { fontSize: 12, fontWeight: "900", marginTop: 8 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 16,
  },
  backButton: {
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
  topCopy: { flex: 1, minWidth: 0 },
  topTitle: { fontSize: 24, fontWeight: "900", lineHeight: 29 },
  detailHero: { padding: 18, gap: 16 },
  detailTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  detailIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCopy: { flex: 1, minWidth: 0 },
  detailTitle: { fontSize: 25, fontWeight: "900", lineHeight: 30 },
  detailText: { fontSize: 14, fontWeight: "800", lineHeight: 21, marginTop: 7 },
  detailStats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: {
    width: "47.5%",
    minHeight: 82,
    borderRadius: 20,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  metricValue: { fontSize: 16, fontWeight: "900" },
  metricLabel: { fontSize: 11, fontWeight: "900" },
  actionsRow: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1 },
  duplicateAction: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  duplicateText: { fontSize: 13, fontWeight: "900" },
  exerciseList: { gap: 12 },
  assignedPreview: { gap: 10 },
  studentCompact: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  studentCopy: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 15, fontWeight: "900", lineHeight: 20 },
  studentMeta: { fontSize: 12, fontWeight: "800", marginTop: 3 },
  dangerLink: {
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
  dangerText: { color: "#B91C1C", fontSize: 13, fontWeight: "900" },
});
