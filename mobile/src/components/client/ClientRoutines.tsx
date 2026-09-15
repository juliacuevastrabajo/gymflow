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
import { colorConAlpha } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  EmptyState,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import { OneRepMaxAccessCard } from "../routines/OneRepMaxCalculator";

export type ClientRoutineMode =
  "LISTA" | "DETALLE" | "ENTRENAMIENTO" | "COMPLETADA";

function getExerciseMeta(
  item: RutinaEjercicioApp,
  options: { includeRest?: boolean } = {},
) {
  const includeRest = options.includeRest !== false;
  const repetitions = item.repeticiones?.trim();
  const mainDetail =
    item.series != null && item.series > 0 && repetitions
      ? `${item.series} × ${repetitions}`
      : repetitions ||
        (item.series != null && item.series > 0
          ? `${item.series} series`
          : null);

  return [
    mainDetail,
    includeRest && item.descansoSegundos != null
      ? `${item.descansoSegundos} s descanso`
      : null,
    item.peso != null && item.peso > 0 ? `${item.peso} kg` : null,
  ].filter(Boolean) as string[];
}

export default function ClientRoutines({
  mode,
  theme,
  primaryColor,
  secondaryColor,
  oneRepMaxSecondaryColor,
  oneRepMaxIconBackgroundColor,
  clientPhotoUri,
  clientInitials,
  assignments,
  selectedAssignment,
  selectedRoutine,
  selectedExercises,
  currentExercise,
  currentExerciseIndex,
  completedExerciseIds,
  thumbnails,
  loading,
  error,
  windowHeight,
  bottomDockHeight,
  topInset,
  getRoutineImage,
  resolveMediaUrl,
  onOpenProfile,
  onOpenOneRepMax,
  onRetry,
  onOpenRoutine,
  onBackToList,
  onBackToDetail,
  onStartRoutine,
  onOpenMedia,
  onExitWorkout,
  onToggleExercise,
  onPreviousExercise,
  onNextExercise,
  onFinishWorkout,
  onReturnFromCompleted,
}: {
  mode: ClientRoutineMode;
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  oneRepMaxSecondaryColor: string;
  oneRepMaxIconBackgroundColor: string;
  clientPhotoUri?: string | null;
  clientInitials: string;
  assignments: RutinaAsignadaApp[];
  selectedAssignment?: RutinaAsignadaApp | null;
  selectedRoutine?: RutinaApp | null;
  selectedExercises: RutinaEjercicioApp[];
  currentExercise?: RutinaEjercicioApp | null;
  currentExerciseIndex: number;
  completedExerciseIds: number[];
  thumbnails: Record<string, string>;
  loading: boolean;
  error?: string | null;
  windowHeight: number;
  bottomDockHeight: number;
  topInset: number;
  getRoutineImage: (routine: RutinaApp) => string | null;
  resolveMediaUrl: (url?: string | null) => string | null;
  onOpenProfile: () => void;
  onOpenOneRepMax: () => void;
  onRetry: () => void;
  onOpenRoutine: (assignment: RutinaAsignadaApp) => void;
  onBackToList: () => void;
  onBackToDetail: () => void;
  onStartRoutine: (routine: RutinaApp) => void;
  onOpenMedia: (type: "IMAGEN" | "VIDEO", uri: string, title: string) => void;
  onExitWorkout: () => void;
  onToggleExercise: (exerciseId: number) => void;
  onPreviousExercise: () => void;
  onNextExercise: () => void;
  onFinishWorkout: () => void;
  onReturnFromCompleted: () => void;
}) {
  const totalExercises = selectedExercises.length;
  const completedExercises = completedExerciseIds.length;

  const renderHeader = (
    eyebrow: string,
    title: string,
    subtitle: string,
    onBack?: () => void,
  ) => (
    <View style={styles.header}>
      {!!onBack && (
        <Pressable
          style={[
            styles.backButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.text}
          />
        </Pressable>
      )}
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, { color: secondaryColor }]}>
          {eyebrow}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {subtitle}
        </Text>
      </View>
      <Avatar
        uri={clientPhotoUri}
        initials={clientInitials}
        size={52}
        theme={theme}
        onPress={onOpenProfile}
      />
    </View>
  );

  const renderRoutineCard = (assignment: RutinaAsignadaApp) => {
    const routine = assignment.rutina;

    if (!routine) {
      return null;
    }

    const exerciseCount = routine.ejercicios?.length || 0;
    const routineImage = getRoutineImage(routine);
    const meta = [
      `${exerciseCount} ejercicio${exerciseCount === 1 ? "" : "s"}`,
      routine.duracionEstimadaMinutos
        ? `~${routine.duracionEstimadaMinutos} min`
        : null,
      assignment.nombreEntrenador || routine.nombreCreador
        ? `Con ${assignment.nombreEntrenador || routine.nombreCreador}`
        : null,
    ].filter(Boolean);

    return (
      <Card
        key={assignment.id}
        theme={theme}
        style={styles.listCard}
        onPress={() => onOpenRoutine(assignment)}
      >
        {routineImage ? (
          <Image source={{ uri: routineImage }} style={styles.listThumb} />
        ) : (
          <View
            style={[
              styles.listIcon,
              { backgroundColor: colorConAlpha(primaryColor, "14") },
            ]}
          >
            <MaterialCommunityIcons
              name="arm-flex-outline"
              size={27}
              color={primaryColor}
            />
          </View>
        )}

        <View style={styles.listCopy}>
          <View style={styles.listTitleRow}>
            <Text
              style={[styles.listTitle, { color: theme.text }]}
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
                <Text style={[styles.levelText, { color: secondaryColor }]}>
                  {routine.nivel}
                </Text>
              </View>
            )}
          </View>
          {!!routine.descripcion && (
            <Text
              style={[styles.listDescription, { color: theme.muted }]}
              numberOfLines={2}
            >
              {routine.descripcion}
            </Text>
          )}
          <Text
            style={[styles.listMeta, { color: secondaryColor }]}
            numberOfLines={2}
          >
            {meta.join(" · ")}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.muted}
        />
      </Card>
    );
  };

  const renderExerciseCard = (item: RutinaEjercicioApp, index: number) => {
    const exercise = item.ejercicio;
    const mediaUri = resolveMediaUrl(exercise?.multimediaUrl);
    const exerciseName = exercise?.nombre || "Ejercicio";
    const hasImage = exercise?.tipoMultimedia === "IMAGEN" && Boolean(mediaUri);
    const hasVideo = exercise?.tipoMultimedia === "VIDEO" && Boolean(mediaUri);
    const videoThumbnail = mediaUri ? thumbnails[mediaUri] : null;
    const meta = getExerciseMeta(item);

    return (
      <Card key={item.id} theme={theme} style={styles.exerciseCard}>
        <View
          style={[
            styles.exerciseOrder,
            { backgroundColor: colorConAlpha(primaryColor, "12") },
          ]}
        >
          <Text style={[styles.exerciseOrderText, { color: primaryColor }]}>
            {index + 1}
          </Text>
        </View>

        {hasImage && mediaUri && (
          <Pressable
            style={styles.exerciseMedia}
            onPress={() => onOpenMedia("IMAGEN", mediaUri, exerciseName)}
            accessibilityRole="button"
            accessibilityLabel={`Ver imagen de ${exerciseName}`}
          >
            <Image source={{ uri: mediaUri }} style={styles.exerciseImage} />
          </Pressable>
        )}
        {hasVideo && mediaUri && (
          <Pressable
            style={[
              styles.exerciseMedia,
              styles.exerciseVideo,
              { backgroundColor: colorConAlpha(secondaryColor, "12") },
            ]}
            onPress={() => onOpenMedia("VIDEO", mediaUri, exerciseName)}
            accessibilityRole="button"
            accessibilityLabel={`Reproducir vídeo de ${exerciseName}`}
          >
            {videoThumbnail ? (
              <Image
                source={{ uri: videoThumbnail }}
                style={styles.exerciseImage}
              />
            ) : (
              <MaterialCommunityIcons
                name="play"
                size={20}
                color={secondaryColor}
              />
            )}
            {!!videoThumbnail && (
              <View style={styles.exercisePlayOverlay}>
                <MaterialCommunityIcons name="play" size={15} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        )}

        <View style={styles.exerciseCopy}>
          <Text
            style={[styles.exerciseTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {exerciseName}
          </Text>
          {meta.length > 0 && (
            <Text
              style={[styles.exerciseMeta, { color: theme.muted }]}
              numberOfLines={2}
            >
              {meta.join(" · ")}
            </Text>
          )}
          {!!item.notas?.trim() && (
            <Text
              style={[styles.exerciseNotes, { color: theme.text }]}
              numberOfLines={3}
            >
              {item.notas.trim()}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderList = () => (
    <ScreenContainer theme={theme}>
      {renderHeader(
        "Entrenamiento",
        "Mis rutinas",
        "Entrenamientos preparados para ti.",
      )}

      <OneRepMaxAccessCard
        theme={theme}
        secondaryColor={oneRepMaxSecondaryColor}
        iconBackgroundColor={oneRepMaxIconBackgroundColor}
        onPress={onOpenOneRepMax}
      />

      {loading && assignments.length === 0 ? (
        <Card theme={theme} style={styles.loadingCard}>
          <ActivityIndicator size="small" color={primaryColor} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Cargando tus rutinas...
          </Text>
        </Card>
      ) : error && assignments.length === 0 ? (
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudieron cargar"
          text={error}
          actionLabel="Reintentar"
          onAction={onRetry}
          theme={theme}
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon="arm-flex-outline"
          title="Todavía no tienes rutinas asignadas"
          text="Tu entrenador podrá prepararte un entrenamiento desde GymFlow."
          theme={theme}
        />
      ) : (
        <View style={styles.list}>{assignments.map(renderRoutineCard)}</View>
      )}
    </ScreenContainer>
  );

  const renderDetail = () => {
    if (!selectedRoutine) {
      return (
        <ScreenContainer theme={theme}>
          {renderHeader(
            "Entrenamiento",
            "Mis rutinas",
            "Entrenamientos preparados para ti.",
          )}
          <EmptyState
            icon="arm-flex-outline"
            title="Selecciona una rutina"
            text="Vuelve a Mis rutinas para abrir un entrenamiento asignado."
            actionLabel="Ver mis rutinas"
            onAction={onBackToList}
            theme={theme}
          />
        </ScreenContainer>
      );
    }

    const routineImage = getRoutineImage(selectedRoutine);
    const trainer =
      selectedAssignment?.nombreEntrenador || selectedRoutine.nombreCreador;

    return (
      <ScreenContainer theme={theme}>
        {renderHeader(
          "Entrenamiento",
          "Rutina",
          "Consulta tus ejercicios y empieza cuando estés lista.",
          onBackToList,
        )}

        <Card theme={theme} style={styles.detailCard}>
          <View style={styles.detailTop}>
            {routineImage ? (
              <Image
                source={{ uri: routineImage }}
                style={styles.detailThumb}
              />
            ) : (
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: colorConAlpha(primaryColor, "14") },
                ]}
              >
                <MaterialCommunityIcons
                  name="arm-flex-outline"
                  size={34}
                  color={primaryColor}
                />
              </View>
            )}
            <View style={styles.detailCopy}>
              <Text style={[styles.detailTitle, { color: theme.text }]}>
                {selectedRoutine.nombre}
              </Text>
              {!!selectedRoutine.descripcion && (
                <Text style={[styles.detailText, { color: theme.muted }]}>
                  {selectedRoutine.descripcion}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.detailChips}>
            {!!selectedRoutine.nivel && (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: colorConAlpha(secondaryColor, "12") },
                ]}
              >
                <Text style={[styles.chipText, { color: secondaryColor }]}>
                  {selectedRoutine.nivel}
                </Text>
              </View>
            )}
            {!!selectedRoutine.duracionEstimadaMinutos && (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: colorConAlpha(primaryColor, "12") },
                ]}
              >
                <Text style={[styles.chipText, { color: primaryColor }]}>
                  ~{selectedRoutine.duracionEstimadaMinutos} min
                </Text>
              </View>
            )}
            {!!trainer && (
              <View
                style={[styles.chip, { backgroundColor: theme.surfaceSoft }]}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>
                  Con {trainer}
                </Text>
              </View>
            )}
          </View>

          <PrimaryButton
            label="Empezar rutina"
            icon="play-circle-outline"
            theme={theme}
            onPress={() => onStartRoutine(selectedRoutine)}
            disabled={selectedExercises.length === 0}
          />
        </Card>

        <SectionHeader title="Ejercicios" theme={theme} />

        {selectedExercises.length === 0 ? (
          <EmptyState
            icon="playlist-remove"
            title="Rutina sin ejercicios"
            text="Tu entrenador todavía no ha añadido ejercicios a esta rutina."
            theme={theme}
          />
        ) : (
          <View style={styles.exerciseList}>
            {selectedExercises.map(renderExerciseCard)}
          </View>
        )}
      </ScreenContainer>
    );
  };

  const renderWorkout = () => {
    if (!selectedRoutine || !currentExercise) {
      return (
        <ScreenContainer theme={theme}>
          {renderHeader(
            "Entrenamiento",
            "Rutina",
            "No hay ejercicios disponibles para esta sesión.",
            onBackToDetail,
          )}
          <EmptyState
            icon="playlist-remove"
            title="Rutina sin ejercicios"
            text="Tu entrenador todavía no ha añadido ejercicios a esta rutina."
            theme={theme}
          />
        </ScreenContainer>
      );
    }

    const exercise = currentExercise.ejercicio;
    const mediaUri = resolveMediaUrl(exercise?.multimediaUrl);
    const exerciseName = exercise?.nombre || "Ejercicio";
    const hasImage = exercise?.tipoMultimedia === "IMAGEN" && Boolean(mediaUri);
    const hasVideo = exercise?.tipoMultimedia === "VIDEO" && Boolean(mediaUri);
    const videoThumbnail = mediaUri ? thumbnails[mediaUri] : null;
    const meta = getExerciseMeta(currentExercise, { includeRest: false });
    const completed = completedExerciseIds.includes(currentExercise.id);
    const isLastExercise = currentExerciseIndex >= totalExercises - 1;
    const canFinish = isLastExercise && completed;
    const progress =
      totalExercises > 0 ? (currentExerciseIndex + 1) / totalExercises : 0;

    return (
      <ScreenContainer theme={theme} style={styles.workoutScreen}>
        {renderHeader(
          "Entrenamiento",
          selectedRoutine.nombre,
          `Ejercicio ${currentExerciseIndex + 1} de ${totalExercises}`,
          onExitWorkout,
        )}

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%` as `${number}%`,
                backgroundColor: primaryColor,
              },
            ]}
          />
        </View>

        <Card theme={theme} style={styles.workoutCard}>
          {(hasImage || hasVideo) && mediaUri && (
            <Pressable
              style={[
                styles.workoutMedia,
                hasVideo && {
                  backgroundColor: colorConAlpha(secondaryColor, "14"),
                },
              ]}
              onPress={() =>
                onOpenMedia(
                  hasVideo ? "VIDEO" : "IMAGEN",
                  mediaUri,
                  exerciseName,
                )
              }
              accessibilityRole="button"
              accessibilityLabel={
                hasVideo
                  ? `Reproducir vídeo de ${exerciseName}`
                  : `Ver imagen de ${exerciseName}`
              }
            >
              {hasImage ? (
                <Image source={{ uri: mediaUri }} style={styles.workoutImage} />
              ) : videoThumbnail ? (
                <>
                  <Image
                    source={{ uri: videoThumbnail }}
                    style={styles.workoutImage}
                  />
                  <View style={styles.workoutPlayOverlay}>
                    <MaterialCommunityIcons
                      name="play"
                      size={34}
                      color="#FFFFFF"
                    />
                  </View>
                </>
              ) : (
                <View style={styles.videoPlaceholder}>
                  <MaterialCommunityIcons
                    name="play-circle"
                    size={52}
                    color={secondaryColor}
                  />
                  <Text style={[styles.videoText, { color: secondaryColor }]}>
                    Ver vídeo
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          <View style={styles.workoutTitleRow}>
            <View style={styles.workoutCopy}>
              <Text style={[styles.workoutTitle, { color: theme.text }]}>
                {exerciseName}
              </Text>
              {meta.length > 0 && (
                <Text style={[styles.workoutMeta, { color: theme.muted }]}>
                  {meta.join(" · ")}
                </Text>
              )}
            </View>
          </View>

          {!!currentExercise.notas?.trim() && (
            <View
              style={[
                styles.workoutNotes,
                { backgroundColor: theme.surfaceSoft },
              ]}
            >
              <MaterialCommunityIcons
                name="note-text-outline"
                size={18}
                color={secondaryColor}
              />
              <Text style={[styles.workoutNotesText, { color: theme.text }]}>
                {currentExercise.notas.trim()}
              </Text>
            </View>
          )}

          {currentExercise.descansoSegundos != null && (
            <View
              style={[
                styles.restPill,
                { backgroundColor: colorConAlpha(secondaryColor, "12") },
              ]}
            >
              <MaterialCommunityIcons
                name="timer-outline"
                size={18}
                color={secondaryColor}
              />
              <Text style={[styles.restText, { color: secondaryColor }]}>
                Descanso: {currentExercise.descansoSegundos} s
              </Text>
            </View>
          )}
        </Card>

        <Pressable
          style={[
            styles.completeButton,
            completed
              ? {
                  backgroundColor: colorConAlpha(primaryColor, "16"),
                  borderColor: colorConAlpha(primaryColor, "40"),
                }
              : {
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                },
          ]}
          onPress={() => onToggleExercise(currentExercise.id)}
          accessibilityRole="button"
          accessibilityLabel={
            completed ? "Desmarcar ejercicio completado" : "Completar ejercicio"
          }
        >
          <MaterialCommunityIcons
            name={completed ? "check-circle" : "check-circle-outline"}
            size={22}
            color={completed ? primaryColor : theme.textOnPrimary}
          />
          <Text
            style={[
              styles.completeText,
              { color: completed ? primaryColor : theme.textOnPrimary },
            ]}
          >
            {completed ? "Completado" : "Completar ejercicio"}
          </Text>
        </Pressable>

        <View style={styles.navigationRow}>
          <SecondaryButton
            label="Anterior"
            icon="chevron-left"
            theme={theme}
            onPress={onPreviousExercise}
            disabled={currentExerciseIndex === 0}
            style={styles.navButton}
          />
          <SecondaryButton
            label="Siguiente"
            icon="chevron-right"
            theme={theme}
            onPress={onNextExercise}
            disabled={isLastExercise}
            style={styles.navButton}
          />
        </View>

        {canFinish && (
          <SecondaryButton
            label="Finalizar rutina"
            icon="flag-checkered"
            theme={theme}
            onPress={onFinishWorkout}
            style={styles.finishButton}
          />
        )}
      </ScreenContainer>
    );
  };

  const renderCompleted = () => (
    <ScreenContainer
      theme={theme}
      style={[
        styles.completedScreen,
        {
          minHeight: Math.max(
            360,
            windowHeight - bottomDockHeight - Math.max(topInset, 18) - 90,
          ),
        },
      ]}
    >
      <Card theme={theme} style={styles.completedCard}>
        <View
          style={[
            styles.completedIcon,
            { backgroundColor: colorConAlpha(primaryColor, "16") },
          ]}
        >
          <MaterialCommunityIcons
            name="check-bold"
            size={34}
            color={primaryColor}
          />
        </View>
        <Text style={[styles.completedTitle, { color: theme.text }]}>
          Rutina completada
        </Text>
        <Text style={[styles.completedText, { color: theme.muted }]}>
          {selectedRoutine?.nombre || "Entrenamiento"} · {completedExercises} de{" "}
          {totalExercises} ejercicios completados.
        </Text>
        <PrimaryButton
          label="Volver a Mis rutinas"
          icon="arm-flex-outline"
          theme={theme}
          onPress={onReturnFromCompleted}
        />
      </Card>
    </ScreenContainer>
  );

  if (mode === "ENTRENAMIENTO") {
    return renderWorkout();
  }

  if (mode === "COMPLETADA") {
    return renderCompleted();
  }

  if (mode === "DETALLE") {
    return renderDetail();
  }

  return renderList();
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 4,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    minHeight: 128,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "800",
  },
  list: {
    gap: 12,
  },
  listCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listThumb: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  listIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listCopy: {
    flex: 1,
    minWidth: 0,
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  levelPill: {
    minHeight: 26,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  levelText: {
    fontSize: 10,
    fontWeight: "900",
  },
  listDescription: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 4,
  },
  listMeta: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    marginTop: 8,
  },
  detailCard: {
    padding: 18,
    gap: 16,
  },
  detailTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  detailThumb: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  detailIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 7,
  },
  detailChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "900",
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  exerciseOrder: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseOrderText: {
    fontSize: 16,
    fontWeight: "900",
  },
  exerciseMedia: {
    width: 52,
    height: 52,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
  },
  exerciseVideo: {
    alignItems: "center",
    justifyContent: "center",
  },
  exercisePlayOverlay: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseCopy: {
    flex: 1,
    minWidth: 0,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  exerciseMeta: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    marginTop: 4,
  },
  exerciseNotes: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 6,
  },
  workoutScreen: {
    paddingBottom: 18,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(100, 116, 139, 0.18)",
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  workoutCard: {
    padding: 16,
    gap: 16,
  },
  workoutMedia: {
    height: 226,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  workoutPlayOverlay: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.74)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  videoText: {
    fontSize: 13,
    fontWeight: "900",
  },
  workoutTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  workoutCopy: {
    flex: 1,
    minWidth: 0,
  },
  workoutTitle: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  workoutMeta: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 5,
  },
  workoutNotes: {
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  workoutNotesText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  restPill: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 13,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  restText: {
    fontSize: 13,
    fontWeight: "900",
  },
  completeButton: {
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
  completeText: {
    fontSize: 15,
    fontWeight: "900",
  },
  navigationRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 12,
  },
  navButton: {
    flex: 1,
  },
  finishButton: {
    marginTop: 4,
  },
  completedScreen: {
    justifyContent: "center",
  },
  completedCard: {
    minHeight: 292,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  completedIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  completedTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center",
  },
  completedText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    textAlign: "center",
  },
});
