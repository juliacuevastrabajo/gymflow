import type { ComponentProps, ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  findNodeHandle,
  Image,
  Pressable,
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
  Card,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type TrainerExerciseTextField =
  | "name"
  | "description"
  | "series"
  | "repetitions"
  | "rest"
  | "weight"
  | "notes";

export type TrainerExerciseFormData = {
  name: string;
  description: string;
  mediaType: "NINGUNO" | "IMAGEN" | "VIDEO";
  mediaUrl: string;
  localMediaUri: string;
  mediaName: string;
  series: string;
  repetitions: string;
  rest: string;
  weight: string;
  notes: string;
};

export type TrainerExerciseFormErrors = Partial<
  Record<
    "name" | "series" | "repetitions" | "rest" | "weight" | "media",
    string
  >
>;

function RoutineField({
  label,
  icon,
  value,
  placeholder,
  error,
  unit,
  multiline = false,
  keyboardType,
  returnKeyType,
  compact = false,
  theme,
  secondaryColor,
  onChangeText,
  onInputFocus,
}: {
  label: string;
  icon: IconName;
  value: string;
  placeholder: string;
  error?: string;
  unit?: string;
  multiline?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  returnKeyType?: ComponentProps<typeof TextInput>["returnKeyType"];
  compact?: boolean;
  theme: GymFlowTheme;
  secondaryColor: string;
  onChangeText: (value: string) => void;
  onInputFocus: (node: number | null) => void;
}) {
  return (
    <View style={[styles.inputGroup, compact && styles.inputGroupCompact]}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          compact && styles.inputShellCompact,
          multiline && styles.textAreaShell,
          { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={compact ? 17 : 19}
          color={secondaryColor}
          style={styles.inputIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[
            styles.input,
            compact && styles.inputCompact,
            !!unit && !multiline && styles.inputWithUnit,
            multiline && styles.textArea,
            { color: theme.text },
          ]}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onFocus={(event) =>
            onInputFocus(findNodeHandle(event.target as unknown as number))
          }
        />
        {!!unit && !multiline && (
          <Text
            style={[styles.inputUnit, { color: theme.muted }]}
            numberOfLines={1}
          >
            {unit}
          </Text>
        )}
      </View>
      {!!error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
}

function RoutineMediaPicker({
  form,
  errors,
  uploading,
  theme,
  primaryColor,
  secondaryColor,
  resolveMediaUrl,
  onSelectMedia,
  onRemoveMedia,
}: {
  form: TrainerExerciseFormData;
  errors: TrainerExerciseFormErrors;
  uploading: boolean;
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  resolveMediaUrl: (url?: string | null) => string | null;
  onSelectMedia: () => void;
  onRemoveMedia: () => void;
}) {
  const mediaUri = resolveMediaUrl(form.mediaUrl) || form.localMediaUri;
  const hasMedia = form.mediaType !== "NINGUNO" && Boolean(mediaUri);
  const isVideo = form.mediaType === "VIDEO";

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>
        Multimedia opcional
      </Text>

      {hasMedia ? (
        <View
          style={[
            styles.mediaPreview,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          ]}
        >
          {isVideo ? (
            <View
              style={[
                styles.videoPreview,
                { backgroundColor: colorConAlpha(secondaryColor, "14") },
              ]}
            >
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={30}
                color={secondaryColor}
              />
            </View>
          ) : (
            <Image source={{ uri: mediaUri }} style={styles.mediaImage} />
          )}
          <View style={styles.mediaCopy}>
            <Text
              style={[styles.mediaTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {isVideo ? "Vídeo añadido" : "Imagen añadida"}
            </Text>
            <Text
              style={[styles.mediaMeta, { color: theme.muted }]}
              numberOfLines={1}
            >
              {form.mediaName || "Archivo listo para el ejercicio"}
            </Text>
          </View>
          <View style={styles.mediaActions}>
            <Pressable
              style={[
                styles.mediaIconButton,
                { backgroundColor: colorConAlpha(secondaryColor, "12") },
              ]}
              onPress={onSelectMedia}
              disabled={uploading}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={18}
                color={secondaryColor}
              />
            </Pressable>
            <Pressable
              style={[styles.mediaIconButton, { backgroundColor: "#FEF2F2" }]}
              onPress={onRemoveMedia}
              disabled={uploading}
            >
              <MaterialCommunityIcons name="close" size={18} color="#B91C1C" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[
            styles.mediaPicker,
            {
              backgroundColor: theme.surfaceSoft,
              borderColor: errors.media ? "#FCA5A5" : theme.border,
            },
          ]}
          onPress={onSelectMedia}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={primaryColor} />
          ) : (
            <MaterialCommunityIcons
              name="image-plus"
              size={22}
              color={secondaryColor}
            />
          )}
          <View style={styles.mediaCopy}>
            <Text style={[styles.mediaTitle, { color: theme.text }]}>
              {uploading ? "Subiendo archivo..." : "Añadir foto o vídeo"}
            </Text>
            <Text style={[styles.mediaMeta, { color: theme.muted }]}>
              Desde galería o cámara. Opcional.
            </Text>
          </View>
        </Pressable>
      )}

      {!!errors.media && <Text style={styles.inputError}>{errors.media}</Text>}
    </View>
  );
}

export function TrainerRoutineExerciseCard({
  item,
  index,
  totalExercises,
  editable = false,
  saving = false,
  theme,
  primaryColor,
  secondaryColor,
  resolveMediaUrl,
  onOpenMedia,
  onMove,
  onEdit,
  onDelete,
}: {
  item: RutinaEjercicioApp;
  index: number;
  totalExercises: number;
  editable?: boolean;
  saving?: boolean;
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  resolveMediaUrl: (url?: string | null) => string | null;
  onOpenMedia: (type: "IMAGEN" | "VIDEO", uri: string, title: string) => void;
  onMove?: (item: RutinaEjercicioApp, direction: "ARRIBA" | "ABAJO") => void;
  onEdit?: (item: RutinaEjercicioApp) => void;
  onDelete?: (item: RutinaEjercicioApp) => void;
}) {
  const exercise = item.ejercicio;
  const mediaUri = resolveMediaUrl(exercise?.multimediaUrl);
  const exerciseName = exercise?.nombre || "Ejercicio";
  const hasImage = exercise?.tipoMultimedia === "IMAGEN" && Boolean(mediaUri);
  const hasVideo = exercise?.tipoMultimedia === "VIDEO" && Boolean(mediaUri);
  const validSeries = item.series != null && item.series > 0;
  const repetitions = item.repeticiones?.trim();
  const mainDetail =
    validSeries && repetitions
      ? `${item.series} × ${repetitions}`
      : repetitions || (validSeries ? `${item.series} series` : null);
  const meta = [
    mainDetail,
    item.descansoSegundos != null
      ? `${item.descansoSegundos} s descanso`
      : null,
    item.peso != null && item.peso > 0 ? `${item.peso} kg` : null,
  ].filter(Boolean);

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
          style={styles.exerciseMediaButton}
          onPress={() => onOpenMedia("IMAGEN", mediaUri, exerciseName)}
          accessibilityRole="button"
          accessibilityLabel={`Ver imagen de ${exerciseName}`}
          hitSlop={6}
        >
          <Image source={{ uri: mediaUri }} style={styles.exerciseThumb} />
        </Pressable>
      )}
      {hasVideo && mediaUri && (
        <Pressable
          style={[
            styles.exerciseMediaButton,
            styles.exerciseVideoThumb,
            { backgroundColor: colorConAlpha(secondaryColor, "12") },
          ]}
          onPress={() => onOpenMedia("VIDEO", mediaUri, exerciseName)}
          accessibilityRole="button"
          accessibilityLabel={`Reproducir vídeo de ${exerciseName}`}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name="play"
            size={21}
            color={secondaryColor}
          />
        </Pressable>
      )}

      <View style={styles.exerciseCopy}>
        <View style={styles.exerciseTitleRow}>
          <Text
            style={[styles.exerciseTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {exerciseName}
          </Text>
          {hasVideo && mediaUri && (
            <Pressable
              style={[
                styles.levelPill,
                { backgroundColor: colorConAlpha(secondaryColor, "12") },
              ]}
              onPress={() => onOpenMedia("VIDEO", mediaUri, exerciseName)}
              accessibilityRole="button"
              accessibilityLabel={`Reproducir vídeo de ${exerciseName}`}
              hitSlop={6}
            >
              <MaterialCommunityIcons
                name="play-circle"
                size={13}
                color={secondaryColor}
              />
              <Text style={[styles.levelText, { color: secondaryColor }]}>
                Vídeo
              </Text>
            </Pressable>
          )}
        </View>
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
            numberOfLines={2}
          >
            {item.notas.trim()}
          </Text>
        )}
      </View>

      {editable && (
        <View style={styles.exerciseActions}>
          <Pressable
            style={styles.exerciseIconButton}
            onPress={() => onMove?.(item, "ARRIBA")}
            disabled={index === 0 || saving}
          >
            <MaterialCommunityIcons
              name="chevron-up"
              size={20}
              color={index === 0 ? "#CBD5E1" : theme.muted}
            />
          </Pressable>
          <Pressable
            style={styles.exerciseIconButton}
            onPress={() => onMove?.(item, "ABAJO")}
            disabled={index === totalExercises - 1 || saving}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={index === totalExercises - 1 ? "#CBD5E1" : theme.muted}
            />
          </Pressable>
          <Pressable
            style={styles.exerciseIconButton}
            onPress={() => onEdit?.(item)}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={19}
              color={secondaryColor}
            />
          </Pressable>
          <Pressable
            style={styles.exerciseIconButton}
            onPress={() => onDelete?.(item)}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={19}
              color="#EF4444"
            />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function ExerciseForm({
  editing,
  form,
  errors,
  canSave,
  saving,
  uploadingMedia,
  theme,
  primaryColor,
  secondaryColor,
  resolveMediaUrl,
  onFormChange,
  onInputFocus,
  onSelectMedia,
  onRemoveMedia,
  onSave,
  onCancel,
}: {
  editing: boolean;
  form: TrainerExerciseFormData;
  errors: TrainerExerciseFormErrors;
  canSave: boolean;
  saving: boolean;
  uploadingMedia: boolean;
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  resolveMediaUrl: (url?: string | null) => string | null;
  onFormChange: (field: TrainerExerciseTextField, value: string) => void;
  onInputFocus: (node: number | null) => void;
  onSelectMedia: () => void;
  onRemoveMedia: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const commonFieldProps = { theme, secondaryColor, onInputFocus };

  return (
    <Card theme={theme} style={styles.exerciseForm}>
      <Text style={[styles.formTitle, { color: theme.text }]}>
        {editing ? "Editar ejercicio" : "Añadir ejercicio"}
      </Text>

      <RoutineField
        {...commonFieldProps}
        label="Ejercicio"
        icon="dumbbell"
        value={form.name}
        onChangeText={(value) => onFormChange("name", value)}
        placeholder="Ej. Sentadilla"
        error={errors.name}
        returnKeyType="next"
      />
      <RoutineField
        {...commonFieldProps}
        label="Descripción"
        icon="text-box-outline"
        value={form.description}
        onChangeText={(value) => onFormChange("description", value)}
        placeholder="Técnica o objetivo del ejercicio"
        multiline
      />

      <RoutineMediaPicker
        form={form}
        errors={errors}
        uploading={uploadingMedia}
        theme={theme}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        resolveMediaUrl={resolveMediaUrl}
        onSelectMedia={onSelectMedia}
        onRemoveMedia={onRemoveMedia}
      />

      <View style={styles.exerciseGrid}>
        <RoutineField
          {...commonFieldProps}
          label="Series"
          icon="counter"
          value={form.series}
          onChangeText={(value) => onFormChange("series", value)}
          placeholder="3"
          keyboardType="number-pad"
          error={errors.series}
          compact
        />
        <RoutineField
          {...commonFieldProps}
          label="Reps"
          icon="repeat"
          value={form.repetitions}
          onChangeText={(value) => onFormChange("repetitions", value)}
          placeholder="10"
          keyboardType="number-pad"
          error={errors.repetitions}
          compact
        />
      </View>

      <View style={styles.exerciseGrid}>
        <RoutineField
          {...commonFieldProps}
          label="Descanso"
          icon="timer-outline"
          value={form.rest}
          onChangeText={(value) => onFormChange("rest", value)}
          placeholder="90"
          keyboardType="number-pad"
          unit="s"
          error={errors.rest}
          compact
        />
        <RoutineField
          {...commonFieldProps}
          label="Peso"
          icon="weight-kilogram"
          value={form.weight}
          onChangeText={(value) => onFormChange("weight", value)}
          placeholder="Opcional"
          keyboardType="decimal-pad"
          unit="kg"
          error={errors.weight}
          compact
        />
      </View>

      <RoutineField
        {...commonFieldProps}
        label="Notas"
        icon="note-text-outline"
        value={form.notes}
        onChangeText={(value) => onFormChange("notes", value)}
        placeholder="Indicaciones concretas"
        multiline
      />

      <View style={styles.formActions}>
        <Pressable
          style={[
            styles.exerciseSaveButton,
            { backgroundColor: primaryColor },
            !canSave && styles.actionDisabled,
          ]}
          onPress={onSave}
          disabled={!canSave}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.textOnPrimary} />
          ) : (
            <MaterialCommunityIcons
              name="content-save-outline"
              size={18}
              color={theme.textOnPrimary}
            />
          )}
          <Text
            style={[styles.exerciseSaveText, { color: theme.textOnPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Guardar
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.exerciseCancelButton,
            {
              backgroundColor: colorConAlpha(secondaryColor, "10"),
              borderColor: colorConAlpha(secondaryColor, "28"),
            },
          ]}
          onPress={onCancel}
        >
          <Text
            style={[styles.exerciseCancelText, { color: secondaryColor }]}
            numberOfLines={1}
          >
            Cancelar
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function TrainerRoutineExercises({
  theme,
  primaryColor,
  secondaryColor,
  routine,
  exercises,
  libraryCount,
  feedback,
  showForm,
  editingExerciseId,
  form,
  errors,
  canSave,
  saving,
  uploadingMedia,
  resolveMediaUrl,
  onBack,
  onAddExercise,
  onFormChange,
  onInputFocus,
  onSelectMedia,
  onRemoveMedia,
  onSaveExercise,
  onCancelForm,
  onOpenMedia,
  onMoveExercise,
  onEditExercise,
  onDeleteExercise,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  routine: RutinaApp;
  exercises: RutinaEjercicioApp[];
  libraryCount: number;
  feedback?: ReactNode;
  showForm: boolean;
  editingExerciseId?: number | null;
  form: TrainerExerciseFormData;
  errors: TrainerExerciseFormErrors;
  canSave: boolean;
  saving: boolean;
  uploadingMedia: boolean;
  resolveMediaUrl: (url?: string | null) => string | null;
  onBack: () => void;
  onAddExercise: () => void;
  onFormChange: (field: TrainerExerciseTextField, value: string) => void;
  onInputFocus: (node: number | null) => void;
  onSelectMedia: () => void;
  onRemoveMedia: () => void;
  onSaveExercise: () => void;
  onCancelForm: () => void;
  onOpenMedia: (type: "IMAGEN" | "VIDEO", uri: string, title: string) => void;
  onMoveExercise: (
    item: RutinaEjercicioApp,
    direction: "ARRIBA" | "ABAJO",
  ) => void;
  onEditExercise: (item: RutinaEjercicioApp) => void;
  onDeleteExercise: (item: RutinaEjercicioApp) => void;
}) {
  return (
    <ScreenContainer theme={theme}>
      <View style={styles.topBar}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={onBack}
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
            Gestionar ejercicios
          </Text>
        </View>
      </View>

      {feedback}

      <Card theme={theme} style={styles.summary}>
        <Text
          style={[styles.summaryTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {routine.nombre}
        </Text>
        <Text style={[styles.summaryMeta, { color: theme.muted }]}>
          {exercises.length} ejercicio(s) · biblioteca: {libraryCount}
        </Text>
      </Card>

      <SectionHeader
        title="Ejercicios"
        actionLabel={showForm ? undefined : "Añadir"}
        onAction={showForm ? undefined : onAddExercise}
        theme={theme}
      />

      {showForm && (
        <ExerciseForm
          editing={Boolean(editingExerciseId)}
          form={form}
          errors={errors}
          canSave={canSave}
          saving={saving}
          uploadingMedia={uploadingMedia}
          theme={theme}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          resolveMediaUrl={resolveMediaUrl}
          onFormChange={onFormChange}
          onInputFocus={onInputFocus}
          onSelectMedia={onSelectMedia}
          onRemoveMedia={onRemoveMedia}
          onSave={onSaveExercise}
          onCancel={onCancelForm}
        />
      )}

      {exercises.length === 0 && !showForm ? (
        <EmptyState
          icon="format-list-numbered"
          title="Rutina sin ejercicios"
          text="Añade el primer ejercicio. Luego podrás cambiar el orden con subir y bajar."
          actionLabel="Añadir ejercicio"
          onAction={onAddExercise}
          theme={theme}
        />
      ) : (
        <View style={styles.exerciseList}>
          {exercises.map((item, index) => (
            <TrainerRoutineExerciseCard
              key={item.id}
              item={item}
              index={index}
              totalExercises={exercises.length}
              editable
              saving={saving}
              theme={theme}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              resolveMediaUrl={resolveMediaUrl}
              onOpenMedia={onOpenMedia}
              onMove={onMoveExercise}
              onEdit={onEditExercise}
              onDelete={onDeleteExercise}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  topTitle: { fontSize: 24, fontWeight: "900", lineHeight: 29 },
  summary: { padding: 16, marginBottom: 4 },
  summaryTitle: { fontSize: 19, fontWeight: "900", lineHeight: 24 },
  summaryMeta: { fontSize: 13, fontWeight: "800", marginTop: 5 },
  exerciseList: { gap: 12 },
  exerciseForm: { padding: 16, gap: 13, marginBottom: 14 },
  formTitle: { fontSize: 18, fontWeight: "900" },
  inputGroup: { gap: 7 },
  inputGroupCompact: { flex: 1, minWidth: 0 },
  inputLabel: { fontSize: 13, fontWeight: "900" },
  inputShell: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  inputShellCompact: { paddingHorizontal: 10, gap: 6 },
  inputIcon: { flexShrink: 0 },
  textAreaShell: { minHeight: 106, alignItems: "flex-start", paddingTop: 13 },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },
  inputCompact: { fontSize: 14, minWidth: 64 },
  inputWithUnit: { paddingRight: 1 },
  inputUnit: {
    minWidth: 18,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "right",
  },
  inputError: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
  },
  textArea: { minHeight: 76, lineHeight: 21 },
  mediaPicker: {
    minHeight: 74,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mediaPreview: {
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  mediaImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  videoPreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaCopy: { flex: 1, minWidth: 0 },
  mediaTitle: { fontSize: 14, fontWeight: "900" },
  mediaMeta: { fontSize: 12, fontWeight: "800", lineHeight: 17, marginTop: 2 },
  mediaActions: { flexDirection: "row", gap: 7 },
  mediaIconButton: {
    width: 35,
    height: 35,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseGrid: { flexDirection: "row", gap: 8 },
  formActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  exerciseSaveButton: {
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
  exerciseSaveText: { flexShrink: 1, fontSize: 14, fontWeight: "900" },
  exerciseCancelButton: {
    flex: 0.9,
    minWidth: 94,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseCancelText: { fontSize: 14, fontWeight: "900" },
  actionDisabled: { opacity: 0.48 },
  exerciseCard: {
    padding: 13,
    flexDirection: "row",
    flexWrap: "wrap",
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
  exerciseOrderText: { fontSize: 16, fontWeight: "900" },
  exerciseMediaButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
  },
  exerciseVideoThumb: {
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
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
  exerciseActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },
  exerciseIconButton: {
    minWidth: 38,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
