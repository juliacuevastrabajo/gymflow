import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { resolverUrlMedia } from "../../services/gymflowService";
import {
  Avatar,
  Card,
  EmptyState,
  FilterChip,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import {
  AdminScreenHeader,
  SearchInput,
  getInitials,
  normalizeSearch,
  withAlpha,
} from "./AdminClients";

export type AdminClassesMode = "CREADAS" | "DESACTIVADAS" | "CREAR" | "EDITAR";

export type AdminClassSession = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  imagenUrl?: string | null;
  fechaHora: string;
  duracionMinutos?: number | null;
  capacidadMaxima?: number | null;
  gimnasioId?: number | null;
  entrenadorId?: number | null;
  nombreEntrenador?: string | null;
  activa?: boolean;
  programacionId?: number | null;
  programacionActiva?: boolean;
  programacionFechaInicio?: string | null;
  reglasProgramacion?: AdminClassRule[] | null;
};

export type AdminClassRule = {
  id?: number | null;
  diaSemana: number;
  hora: string;
};

export type AdminClassGroup = {
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
  reglas: AdminClassRule[];
  sesiones: AdminClassSession[];
};

export type AdminClassTrainer = {
  id: number;
  nombre?: string | null;
  email?: string | null;
  fotoPerfilUrl?: string | null;
  activo?: boolean;
};

export type AdminClassDay = {
  id: number;
  corto: string;
  nombre: string;
};

type ClassFormState = {
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  entrenadorId: number | null;
  dias: number[];
  horas: string[];
  horaNueva: string;
  duracion: string;
  capacidad: string;
};

type AdminClassesProps = {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  mode: AdminClassesMode;
  selectedGroupKey: string | null;
  activeGroups: AdminClassGroup[];
  inactiveGroups: AdminClassGroup[];
  trainers: AdminClassTrainer[];
  days: AdminClassDay[];
  search: string;
  loading: boolean;
  error: string;
  form: ClassFormState;
  uploadingFormImage: boolean;
  uploadingExistingImage: boolean;
  saving: boolean;
  onSearchChange: (value: string) => void;
  onModeChange: (mode: "CREADAS" | "DESACTIVADAS") => void;
  onAdminAvatarPress: () => void;
  onNewClass: () => void;
  onOpenGroup: (groupKey: string) => void;
  onBackToList: () => void;
  onEditGroup: (group: AdminClassGroup) => void;
  onChangeCover: (group: AdminClassGroup) => Promise<void>;
  onCreateTrainer: () => void;
  onFormNameChange: (value: string) => void;
  onFormDescriptionChange: (value: string) => void;
  onFormTrainerChange: (trainerId: number) => void;
  onFormDurationChange: (value: string) => void;
  onFormCapacityChange: (value: string) => void;
  onToggleFormDay: (dayId: number) => void;
  onFormNewTimeChange: (value: string) => void;
  onAddFormTime: () => void;
  onRemoveFormTime: (time: string) => void;
  onPickFormImage: () => Promise<void>;
  onSubmitForm: () => Promise<void>;
  onCancelForm: () => void;
  onManageScheduleFromEdit: () => void;
  getReservationsCount: (sessionId: number) => number;
  onAddDay: (
    group: AdminClassGroup,
    dayId: number,
    referenceTimes: string[],
    fallbackTime: string,
  ) => Promise<boolean>;
  onRemoveDay: (group: AdminClassGroup, dayKey: string) => void;
  onAddTime: (
    group: AdminClassGroup,
    dateKey: string | null,
    time: string,
  ) => Promise<boolean>;
  onUpdateTime: (
    group: AdminClassGroup,
    rule: AdminClassRule,
    time: string,
  ) => Promise<boolean>;
  onRemoveTime: (group: AdminClassGroup, rule: AdminClassRule) => void;
  onDeactivateProgram: (group: AdminClassGroup) => void;
};

const FILTERS: { value: "CREADAS" | "DESACTIVADAS"; label: string }[] = [
  { value: "CREADAS", label: "Activas" },
  { value: "DESACTIVADAS", label: "Desactivadas" },
];

const ISO_DAY_NAMES = [
  "",
  "LUN",
  "MAR",
  "MIÉ",
  "JUE",
  "VIE",
  "SÁB",
  "DOM",
];

const ISO_DAY_FULL_NAMES = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function getTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(11, 16) || "--:--";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function getEndTime(start: string, duration: number) {
  const [hours, minutes] = start.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return "--:--";
  }

  const total = hours * 60 + minutes + duration;
  return `${String(Math.floor((total % 1440) / 60)).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}

function getMondayFirstIndex(day: number) {
  return (day + 6) % 7;
}

function getSessionWeekdayIndex(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 7 : getMondayFirstIndex(date.getDay());
}

function compareSessionsByWeekday(a: AdminClassSession, b: AdminClassSession) {
  const weekdayDifference =
    getSessionWeekdayIndex(a.fechaHora) - getSessionWeekdayIndex(b.fechaHora);

  if (weekdayDifference !== 0) {
    return weekdayDifference;
  }

  const timeDifference = getTime(a.fechaHora).localeCompare(getTime(b.fechaHora));
  if (timeDifference !== 0) {
    return timeDifference;
  }

  return new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime();
}

function sortSessionsByWeekday(sessions: AdminClassSession[]) {
  return [...sessions].sort(compareSessionsByWeekday);
}

function sortDaysMondayFirst(days: AdminClassDay[]) {
  return [...days].sort(
    (a, b) => getMondayFirstIndex(a.id) - getMondayFirstIndex(b.id),
  );
}

function getFullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return `${formattedDate.charAt(0).toLocaleUpperCase("es-ES")}${formattedDate.slice(1)}`;
}

function normalizeTime(value: string) {
  const clean = value.trim();
  if (!/^\d{1,2}:\d{2}$/.test(clean)) {
    return null;
  }

  const [hours, minutes] = clean.split(":").map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function groupSummary(
  group: AdminClassGroup,
  getReservationsCount: (sessionId: number) => number,
) {
  const sessions = sortSessionsByWeekday(group.sesiones);
  const futureSessions = sessions.filter(
    (session) =>
      session.activa !== false && new Date(session.fechaHora).getTime() >= Date.now(),
  );
  const rules = [...group.reglas].sort(
    (a, b) => a.diaSemana - b.diaSemana || a.hora.localeCompare(b.hora),
  );
  const dayKeys = Array.from(new Set(rules.map((rule) => String(rule.diaSemana))));
  const weekdayLabels = dayKeys.map((dayKey) => ISO_DAY_NAMES[Number(dayKey)] || "DÍA");
  const reservationCount = futureSessions.reduce(
    (total, session) => total + getReservationsCount(session.id),
    0,
  );
  const capacities = futureSessions.map((session) => Number(session.capacidadMaxima) || 0);
  const totalCapacity = capacities.reduce((total, capacity) => total + capacity, 0);
  const uniqueCapacities = Array.from(new Set(capacities.filter((value) => value > 0)));
  const durations = Array.from(
    new Set(sessions.map((session) => Number(session.duracionMinutos) || 0).filter(Boolean)),
  );
  const timeCount = rules.length;

  return {
    sessions,
    futureSessions,
    dayKeys,
    rules,
    daysText: weekdayLabels.length > 0 ? weekdayLabels.join(", ") : "Sin días",
    scheduleText: `${dayKeys.length} ${dayKeys.length === 1 ? "día" : "días"} · ${
      rules.length
    } ${rules.length === 1 ? "horario" : "horarios"}`,
    timeCount,
    reservationCount,
    totalCapacity,
    capacityText:
      uniqueCapacities.length === 0
        ? "Sin capacidad"
        : uniqueCapacities.length === 1
          ? `${uniqueCapacities[0]} plazas por sesión`
          : "Capacidad variable",
    durationText:
      durations.length === 0
        ? "Sin duración"
        : durations.length === 1
          ? `${durations[0]} min`
          : "Duración variable",
  };
}

function ClassStatusBadge({ active, theme }: { active: boolean; theme: GymFlowTheme }) {
  const color = active ? theme.secondary : theme.muted;
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: withAlpha(color, "12"), borderColor: withAlpha(color, "2E") },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{active ? "Activa" : "Desactivada"}</Text>
    </View>
  );
}

function ClassListCard({
  group,
  active,
  theme,
  getReservationsCount,
  onPress,
}: {
  group: AdminClassGroup;
  active: boolean;
  theme: GymFlowTheme;
  getReservationsCount: (sessionId: number) => number;
  onPress: () => void;
}) {
  const summary = groupSummary(group, getReservationsCount);
  const imageUri = resolverUrlMedia(group.imagenUrl);

  return (
    <Card theme={theme} style={styles.classCard} onPress={onPress}>
      <View style={[styles.classThumbnail, { backgroundColor: theme.surfaceSoft }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.classThumbnailImage} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="dumbbell" size={29} color={theme.primary} />
        )}
      </View>

      <View style={styles.classCardBody}>
        <View style={styles.classCardTitleRow}>
          <Text style={[styles.className, { color: theme.text }]} numberOfLines={2}>
            {group.nombre || "Clase sin nombre"}
          </Text>
          <ClassStatusBadge active={active} theme={theme} />
        </View>
        <Text style={[styles.classTrainer, { color: theme.muted }]} numberOfLines={1}>
          {group.nombreEntrenador || "Sin entrenador asignado"}
        </Text>
        <Text style={[styles.classSchedule, { color: theme.text }]} numberOfLines={2}>
          {summary.daysText} · {summary.timeCount} {summary.timeCount === 1 ? "horario" : "horarios"}
        </Text>
        <View style={styles.classMetaRow}>
          <Text style={[styles.classMeta, { color: theme.muted }]}>{summary.durationText}</Text>
          <View style={[styles.metaDot, { backgroundColor: theme.border }]} />
          <Text style={[styles.classMeta, { color: theme.muted }]}>
            {summary.reservationCount}/{summary.totalCapacity || "-"} reservas
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={23} color={theme.muted} />
    </Card>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: GymFlowTheme }) {
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>;
}

function SummaryTile({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  theme: GymFlowTheme;
}) {
  return (
    <Card theme={theme} style={styles.summaryTile}>
      <View style={[styles.summaryIcon, { backgroundColor: withAlpha(theme.primary, "12") }]}>
        <MaterialCommunityIcons name={icon} size={19} color={theme.primary} />
      </View>
      <Text style={[styles.summaryValue, { color: theme.text }]} numberOfLines={2}>
        {value}
      </Text>
      <Text style={[styles.summaryLabel, { color: theme.muted }]}>{label}</Text>
    </Card>
  );
}

function ClassDetail({
  group,
  active,
  theme,
  days,
  uploadingExistingImage,
  getReservationsCount,
  onBack,
  onEdit,
  onChangeCover,
  onAddDay,
  onRemoveDay,
  onAddTime,
  onUpdateTime,
  onRemoveTime,
  onDeactivateProgram,
}: {
  group: AdminClassGroup;
  active: boolean;
  theme: GymFlowTheme;
  days: AdminClassDay[];
  uploadingExistingImage: boolean;
  getReservationsCount: (sessionId: number) => number;
  onBack: () => void;
  onEdit: () => void;
  onChangeCover: () => Promise<void>;
  onAddDay: AdminClassesProps["onAddDay"];
  onRemoveDay: AdminClassesProps["onRemoveDay"];
  onAddTime: AdminClassesProps["onAddTime"];
  onUpdateTime: AdminClassesProps["onUpdateTime"];
  onRemoveTime: AdminClassesProps["onRemoveTime"];
  onDeactivateProgram: AdminClassesProps["onDeactivateProgram"];
}) {
  const summary = useMemo(
    () => groupSummary(group, getReservationsCount),
    [group, getReservationsCount],
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [newTime, setNewTime] = useState("12:00");
  const [editingRuleKey, setEditingRuleKey] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const pendingActionRef = useRef(false);
  const imageUri = resolverUrlMedia(group.imagenUrl);
  const currentIsoWeekday = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const currentDayKey = summary.dayKeys.includes(String(currentIsoWeekday))
    ? String(currentIsoWeekday)
    : null;
  const activeDayKey =
    selectedDayKey && summary.dayKeys.includes(selectedDayKey)
      ? selectedDayKey
      : currentDayKey || summary.dayKeys[0] || null;
  const dayRules = useMemo(
    () =>
      activeDayKey
        ? summary.rules.filter((rule) => String(rule.diaSemana) === activeDayKey)
        : [],
    [activeDayKey, summary.rules],
  );
  const usedWeekdays = new Set(summary.rules.map((rule) => rule.diaSemana));
  const availableDays = sortDaysMondayFirst(days).filter(
    (day) => !usedWeekdays.has(day.id === 0 ? 7 : day.id),
  );
  const upcomingSessions = useMemo(
    () =>
      [...summary.sessions]
        .filter(
          (session) =>
            session.activa !== false &&
            new Date(session.fechaHora).getTime() >= Date.now(),
        )
        .sort(
          (a, b) =>
            new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
        )
        .slice(0, 6),
    [summary.sessions],
  );

  useEffect(() => {
    setSelectedDayKey(null);
    setEditingRuleKey(null);
    setEditingTime("");
  }, [group.key]);

  useEffect(() => {
    setSelectedDayKey((current) =>
      current && summary.dayKeys.includes(current)
        ? current
        : currentDayKey || summary.dayKeys[0] || null,
    );
  }, [currentDayKey, summary.dayKeys]);

  useEffect(() => {
    const lastRule = dayRules[dayRules.length - 1];
    if (lastRule) {
      setNewTime(
        getEndTime(lastRule.hora.slice(0, 5), Number(group.duracionMinutos) || 45),
      );
    } else {
      setNewTime("12:00");
    }
  }, [group.duracionMinutos, dayRules]);

  const runAsync = async (key: string, action: () => Promise<unknown>) => {
    if (pendingActionRef.current) {
      return;
    }
    pendingActionRef.current = true;
    setPendingAction(key);
    try {
      await action();
    } finally {
      pendingActionRef.current = false;
      setPendingAction(null);
    }
  };

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <View style={styles.detailHeader}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver al listado de clases"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.detailHeaderCopy}>
          <Text style={[styles.detailEyebrow, { color: theme.secondary }]}>FICHA DE CLASE</Text>
          <Text style={[styles.detailTitle, { color: theme.text }]} numberOfLines={1}>
            {group.nombre}
          </Text>
        </View>
        <ClassStatusBadge active={active} theme={theme} />
      </View>

      <Card theme={theme} style={styles.identityCard}>
        <View style={[styles.detailCover, { backgroundColor: theme.surfaceSoft }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.detailCoverImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="dumbbell" size={48} color={theme.primary} />
          )}
        </View>
        <View style={styles.identityCopy}>
          <Text style={[styles.identityName, { color: theme.text }]} numberOfLines={2}>
            {group.nombre}
          </Text>
          <Text style={[styles.identityDescription, { color: theme.muted }]} numberOfLines={4}>
            {group.descripcion || "Sin descripción."}
          </Text>
        </View>
        {active && (
          <View style={styles.detailActions}>
            <SecondaryButton
              label="Editar datos"
              icon="pencil-outline"
              theme={theme}
              onPress={onEdit}
              style={styles.detailActionButton}
            />
            <SecondaryButton
              label="Cambiar portada"
              icon="image-edit-outline"
              theme={theme}
              onPress={() => void runAsync("cover", onChangeCover)}
              disabled={uploadingExistingImage || pendingAction === "cover"}
              style={styles.detailActionButton}
            />
          </View>
        )}
      </Card>

      <SectionTitle title="Resumen" theme={theme} />
      <View style={styles.summaryGrid}>
        <SummaryTile
          icon="account-tie-outline"
          label="Entrenador"
          value={group.nombreEntrenador || "Sin asignar"}
          theme={theme}
        />
        <SummaryTile icon="timer-outline" label="Duración" value={summary.durationText} theme={theme} />
        <SummaryTile
          icon="calendar-clock-outline"
          label="Horario"
          value={summary.scheduleText}
          theme={theme}
        />
        <SummaryTile
          icon="account-group-outline"
          label="Ocupación total"
          value={`${summary.reservationCount}/${summary.totalCapacity || "-"}`}
          theme={theme}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderCopy}>
          <SectionTitle title="Horario semanal" theme={theme} />
          <Text style={[styles.sectionHint, { color: theme.muted }]}>
            Selecciona un día para revisar sus sesiones.
          </Text>
        </View>
      </View>

      <View style={styles.dayTabs}>
        {summary.dayKeys.map((dayKey) => {
          const isSelected = dayKey === activeDayKey;
          const scheduleCount = summary.rules.filter(
            (rule) => String(rule.diaSemana) === dayKey,
          ).length;
          return (
            <Pressable
              key={dayKey}
              style={[
                styles.dayTab,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setSelectedDayKey(dayKey)}
            >
              <Text style={[styles.dayTabLabel, { color: isSelected ? theme.textOnPrimary : theme.text }]}>
                {ISO_DAY_NAMES[Number(dayKey)] || "DÍA"}
              </Text>
              <Text style={[styles.dayTabMeta, { color: isSelected ? theme.textOnPrimary : theme.muted }]}>
                {scheduleCount} {scheduleCount === 1 ? "horario" : "horarios"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {active && availableDays.length > 0 && (
        <Card theme={theme} style={styles.addDayCard}>
          <View style={styles.addDayCopy}>
            <Text style={[styles.addDayTitle, { color: theme.text }]}>Añadir día</Text>
            <Text style={[styles.addDayHint, { color: theme.muted }]}>Copia las horas del día seleccionado.</Text>
          </View>
          <View style={styles.addDayChips}>
            {availableDays.map((day) => (
              <Pressable
                key={day.id}
                style={[styles.addDayChip, { borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
                onPress={() =>
                  void runAsync(`day-${day.id}`, async () => {
                    await onAddDay(
                      group,
                      day.id,
                      dayRules.map((rule) => rule.hora.slice(0, 5)),
                      newTime,
                    );
                  })
                }
                disabled={!!pendingAction}
              >
                {pendingAction === `day-${day.id}` ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={[styles.addDayChipText, { color: theme.primary }]}>+ {day.corto}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <Card theme={theme} style={styles.scheduleCard}>
        <View style={styles.selectedDayHeader}>
          <View style={styles.selectedDayCopy}>
            <Text style={[styles.selectedDayTitle, { color: theme.text }]}>
              {activeDayKey
                ? ISO_DAY_FULL_NAMES[Number(activeDayKey)]
                : "Sin horarios"}
            </Text>
            <Text style={[styles.selectedDayMeta, { color: theme.muted }]}>
              {dayRules.length} {dayRules.length === 1 ? "horario" : "horarios"}
            </Text>
          </View>
          {active && activeDayKey && (
            <Pressable
              style={styles.iconTouchTarget}
              onPress={() => onRemoveDay(group, activeDayKey)}
              accessibilityRole="button"
              accessibilityLabel="Eliminar día"
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
            </Pressable>
          )}
        </View>

        {active && activeDayKey && (
          <View style={styles.addTimeRow}>
            <TextInput
              style={[
                styles.compactInput,
                { color: theme.text, backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              ]}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="12:00"
              placeholderTextColor={theme.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            <PrimaryButton
              label="Añadir hora"
              icon="plus"
              theme={theme}
              onPress={() =>
                void runAsync("add-time", async () => {
                  const added = await onAddTime(group, activeDayKey, newTime);
                  if (added) {
                    const normalized = normalizeTime(newTime) || "12:00";
                    setNewTime(getEndTime(normalized, Number(group.duracionMinutos) || 45));
                  }
                })
              }
              loading={pendingAction === "add-time"}
              disabled={!!pendingAction || !normalizeTime(newTime)}
              style={styles.addTimeButton}
            />
          </View>
        )}

        {dayRules.length === 0 ? (
          <View style={styles.inlineEmpty}>
            <MaterialCommunityIcons name="clock-alert-outline" size={24} color={theme.muted} />
            <Text style={[styles.inlineEmptyText, { color: theme.muted }]}>No hay horas en este día.</Text>
          </View>
        ) : (
          <View style={[styles.sessionList, { borderTopColor: theme.border }]}>
            {dayRules.map((rule, index) => {
              const ruleKey = `${rule.diaSemana}-${rule.hora}`;
              const startTime = rule.hora.slice(0, 5);
              const duration = Number(group.duracionMinutos) || 45;
              const isEditing = editingRuleKey === ruleKey;
              return (
                <View
                  key={ruleKey}
                  style={[
                    styles.sessionRow,
                    index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                  ]}
                >
                  <View style={[styles.sessionTimeIcon, { backgroundColor: theme.surfaceSoft }]}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.sessionBody}>
                    {isEditing ? (
                      <TextInput
                        style={[
                          styles.sessionEditInput,
                          { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft },
                        ]}
                        value={editingTime}
                        onChangeText={setEditingTime}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        autoFocus
                      />
                    ) : (
                      <Text style={[styles.sessionTime, { color: theme.text }]}>
                        {startTime} - {getEndTime(startTime, duration)}
                      </Text>
                    )}
                    <Text style={[styles.sessionMeta, { color: theme.muted }]}>
                      Se repite cada semana
                    </Text>
                  </View>

                  {active && (
                    <View style={styles.sessionActions}>
                      {isEditing ? (
                        <>
                          <Pressable
                            style={styles.iconTouchTarget}
                            disabled={!!pendingAction || !normalizeTime(editingTime)}
                            onPress={() =>
                              void runAsync(`edit-${ruleKey}`, async () => {
                                const updated = await onUpdateTime(group, rule, editingTime);
                                if (updated) {
                                  setEditingRuleKey(null);
                                  setEditingTime("");
                                }
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Guardar hora"
                          >
                            {pendingAction === `edit-${ruleKey}` ? (
                              <ActivityIndicator size="small" color={theme.secondary} />
                            ) : (
                              <MaterialCommunityIcons name="check" size={20} color={theme.secondary} />
                            )}
                          </Pressable>
                          <Pressable
                            style={styles.iconTouchTarget}
                            onPress={() => {
                              setEditingRuleKey(null);
                              setEditingTime("");
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Cancelar edición de hora"
                          >
                            <MaterialCommunityIcons name="close" size={20} color={theme.muted} />
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable
                            style={styles.iconTouchTarget}
                            onPress={() => {
                              setEditingRuleKey(ruleKey);
                              setEditingTime(startTime);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Editar hora"
                          >
                            <MaterialCommunityIcons name="pencil-outline" size={19} color={theme.secondary} />
                          </Pressable>
                          <Pressable
                            style={styles.iconTouchTarget}
                            onPress={() => onRemoveTime(group, rule)}
                            accessibilityRole="button"
                            accessibilityLabel="Eliminar horario semanal"
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={19} color="#DC2626" />
                          </Pressable>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderCopy}>
          <SectionTitle title="Próximas sesiones" theme={theme} />
          <Text style={[styles.sectionHint, { color: theme.muted }]}>
            {summary.futureSessions.length} sesiones futuras materializadas.
          </Text>
        </View>
      </View>

      <Card theme={theme} style={styles.scheduleCard}>
        {upcomingSessions.length === 0 ? (
          <View style={styles.inlineEmpty}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={24} color={theme.muted} />
            <Text style={[styles.inlineEmptyText, { color: theme.muted }]}>No hay próximas sesiones.</Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {upcomingSessions.map((session, index) => {
              const reservations = getReservationsCount(session.id);
              const capacity = Number(session.capacidadMaxima) || 0;
              return (
                <View
                  key={session.id}
                  style={[
                    styles.sessionRow,
                    index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                  ]}
                >
                  <View style={[styles.sessionTimeIcon, { backgroundColor: theme.surfaceSoft }]}>
                    <MaterialCommunityIcons name="calendar-clock-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.sessionBody}>
                    <Text style={[styles.sessionTime, { color: theme.text }]}>
                      {getFullDate(session.fechaHora)} · {getTime(session.fechaHora)}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: theme.muted }]}>
                      {reservations}/{capacity || "-"} reservas
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {active && group.programacionId && (
        <SecondaryButton
          label="Desactivar programación"
          icon="calendar-remove-outline"
          theme={theme}
          onPress={() => onDeactivateProgram(group)}
        />
      )}

      {!active && (
        <Card theme={theme} style={styles.readOnlyNotice}>
          <MaterialCommunityIcons name="lock-outline" size={21} color={theme.muted} />
          <Text style={[styles.readOnlyText, { color: theme.muted }]}>
            Esta clase está desactivada. Puedes consultar sus datos e historial, pero no modificarla.
          </Text>
        </Card>
      )}
    </ScreenContainer>
  );
}

function FieldLabel({ children, theme }: { children: string; theme: GymFlowTheme }) {
  return <Text style={[styles.fieldLabel, { color: theme.text }]}>{children}</Text>;
}

function FieldError({ children }: { children?: string | null }) {
  if (!children) {
    return null;
  }
  return <Text style={styles.fieldError}>{children}</Text>;
}

function TrainerSelectorModal({
  visible,
  trainers,
  selectedTrainerId,
  theme,
  onSelect,
  onClose,
}: {
  visible: boolean;
  trainers: AdminClassTrainer[];
  selectedTrainerId: number | null;
  theme: GymFlowTheme;
  onSelect: (trainerId: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearch("");
    }
  }, [visible]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const normalizedSearch = normalizeSearch(search);
  const filteredTrainers = useMemo(
    () =>
      trainers.filter((trainer) =>
        normalizeSearch(`${trainer.nombre || ""} ${trainer.email || ""}`).includes(
          normalizedSearch,
        ),
      ),
    [normalizedSearch, trainers],
  );
  const resultsLabel = normalizedSearch
    ? `${filteredTrainers.length} ${filteredTrainers.length === 1 ? "resultado" : "resultados"}`
    : `${filteredTrainers.length} ${filteredTrainers.length === 1 ? "entrenador activo" : "entrenadores activos"}`;
  const closeSelector = () => {
    Keyboard.dismiss();
    onClose();
  };
  const selectTrainer = (trainerId: number) => {
    Keyboard.dismiss();
    onSelect(trainerId);
  };
  const sheetMaxHeight = Math.min(
    Math.max(
      windowHeight - Math.max(insets.top, 18) - (keyboardVisible ? 16 : 28),
      0,
    ),
    keyboardVisible ? 560 : 660,
  );
  const listMaxHeight = keyboardVisible
    ? Math.min(windowHeight * 0.24, 220)
    : Math.min(windowHeight * 0.42, 360);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeSelector}
    >
      <KeyboardAvoidingView
        style={styles.trainerSelectorModalRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={styles.trainerSelectorBackdrop}
          onPress={closeSelector}
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector de entrenador"
        />
        <View
          style={[
            styles.trainerSelectorSheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: keyboardVisible
                ? 12
                : Math.max(Math.min(insets.bottom, 18), 12),
              maxHeight: sheetMaxHeight,
            },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.trainerSelectorHeader}>
            <View style={styles.trainerSelectorHeaderCopy}>
              <Text style={[styles.trainerSelectorEyebrow, { color: theme.secondary }]}>ENTRENADOR</Text>
              <Text style={[styles.trainerSelectorTitle, { color: theme.text }]}>Seleccionar entrenador</Text>
              <Text style={[styles.trainerSelectorSubtitle, { color: theme.muted }]}>
                Busca y asigna un entrenador activo a esta clase.
              </Text>
            </View>
            <Pressable
              style={[
                styles.trainerSelectorClose,
                { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              ]}
              onPress={closeSelector}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <MaterialCommunityIcons name="close" size={21} color={theme.text} />
            </Pressable>
          </View>

          <SearchInput
            value={search}
            onChangeText={setSearch}
            theme={theme}
            placeholder="Buscar por nombre o email..."
          />

          <Text style={[styles.trainerSelectorResults, { color: theme.muted }]}>{resultsLabel}</Text>

          <FlatList
            data={filteredTrainers}
            keyExtractor={(trainer) => String(trainer.id)}
            style={[styles.trainerSelectorList, { maxHeight: listMaxHeight }]}
            contentContainerStyle={[
              styles.trainerSelectorListContent,
              filteredTrainers.length === 0 && styles.trainerSelectorEmptyContent,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            renderItem={({ item: trainer }) => {
              const selected = trainer.id === selectedTrainerId;
              const trainerName = trainer.nombre?.trim() || "Entrenador";
              return (
                <Pressable
                  style={[
                    styles.trainerSelectorRow,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    selected && { backgroundColor: theme.surfaceSoft, borderColor: theme.primary },
                  ]}
                  onPress={() => selectTrainer(trainer.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar ${trainerName}`}
                  accessibilityState={{ selected }}
                >
                  <Avatar
                    uri={resolverUrlMedia(trainer.fotoPerfilUrl)}
                    initials={getInitials(trainerName, "Entrenador")}
                    size={44}
                    theme={theme}
                  />
                  <View style={styles.trainerSelectorRowCopy}>
                    <Text style={[styles.trainerSelectorName, { color: theme.text }]} numberOfLines={1}>
                      {trainerName}
                    </Text>
                    <Text style={[styles.trainerSelectorEmail, { color: theme.muted }]} numberOfLines={1}>
                      {trainer.email?.trim() || "Sin email disponible"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={selected ? "check-circle" : "chevron-right"}
                    size={23}
                    color={selected ? theme.primary : theme.muted}
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.trainerSelectorEmpty}>
                <MaterialCommunityIcons name="account-search-outline" size={28} color={theme.muted} />
                <Text style={[styles.trainerSelectorEmptyTitle, { color: theme.text }]}>Sin resultados</Text>
                <Text style={[styles.trainerSelectorEmptyText, { color: theme.muted }]}>
                  Prueba con otro nombre o email.
                </Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ClassForm({ props }: { props: AdminClassesProps }) {
  const { theme, form, mode, trainers, days } = props;
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [trainerSelectorVisible, setTrainerSelectorVisible] = useState(false);
  const isEditing = mode === "EDITAR";
  const duration = Number(form.duracion);
  const capacity = Number(form.capacidad);
  const durationError =
    form.duracion.trim() && (!Number.isFinite(duration) || duration <= 0)
      ? "Introduce una duración mayor que 0."
      : null;
  const capacityError =
    form.capacidad.trim() && (!Number.isFinite(capacity) || capacity <= 0)
      ? "Introduce una capacidad mayor que 0."
      : null;
  const orderedDays = useMemo(() => sortDaysMondayFirst(days), [days]);
  const activeTrainers = useMemo(
    () =>
      trainers
        .filter((trainer) => trainer.activo !== false)
        .sort((a, b) =>
          (a.nombre?.trim() || "Entrenador").localeCompare(
            b.nombre?.trim() || "Entrenador",
            "es",
            { sensitivity: "base" },
          ),
        ),
    [trainers],
  );
  const selectedTrainer = activeTrainers.find(
    (trainer) => trainer.id === form.entrenadorId,
  );
  const unavailableTrainer = !!form.entrenadorId && !selectedTrainer;
  const trainerError = unavailableTrainer
    ? "El entrenador actual no está disponible. Selecciona un entrenador activo."
    : !selectedTrainer
      ? "Selecciona un entrenador activo."
      : null;
  const openTrainerSelector = () => {
    Keyboard.dismiss();
    setTrainerSelectorVisible(true);
  };
  const isValid =
    !!form.nombre.trim() &&
    !!selectedTrainer &&
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isFinite(capacity) &&
    capacity > 0 &&
    (isEditing || (form.dias.length > 0 && form.horas.length > 0));
  const imageUri = resolverUrlMedia(form.imagenUrl);
  const sessionCount = form.dias.length * form.horas.length;

  const submit = async () => {
    if (!isValid || submittingRef.current || props.saving) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await props.onSubmitForm();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <View style={styles.detailHeader}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={props.onCancelForm}
          accessibilityRole="button"
          accessibilityLabel="Cancelar y volver"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.detailHeaderCopy}>
          <Text style={[styles.detailEyebrow, { color: theme.secondary }]}>
            {isEditing ? "EDITAR CLASE" : "NUEVA CLASE"}
          </Text>
          <Text style={[styles.detailTitle, { color: theme.text }]}>
            {isEditing ? "Datos generales" : "Crear clase"}
          </Text>
        </View>
      </View>

      <Card theme={theme} style={styles.formCard}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Información de la clase</Text>
        <Text style={[styles.formHint, { color: theme.muted }]}>Nombre, portada y profesional responsable.</Text>

        <Pressable
          style={[styles.formCover, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
          onPress={() => void props.onPickFormImage()}
          disabled={props.uploadingFormImage}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar portada de la clase"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.formCoverImage} resizeMode="cover" />
          ) : (
            <View style={styles.formCoverEmpty}>
              <MaterialCommunityIcons name="image-plus-outline" size={34} color={theme.primary} />
              <Text style={[styles.formCoverText, { color: theme.muted }]}>Añadir portada</Text>
            </View>
          )}
          <View style={[styles.formCoverAction, { backgroundColor: theme.primary }]}>
            {props.uploadingFormImage ? (
              <ActivityIndicator size="small" color={theme.textOnPrimary} />
            ) : (
              <MaterialCommunityIcons name="camera-outline" size={19} color={theme.textOnPrimary} />
            )}
          </View>
        </Pressable>

        <FieldLabel theme={theme}>Nombre</FieldLabel>
        <TextInput
          value={form.nombre}
          onChangeText={props.onFormNameChange}
          placeholder="Ej. Pilates reformer"
          placeholderTextColor={theme.muted}
          style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
          returnKeyType="next"
        />
        <FieldError>
          {!form.nombre.trim() ? "El nombre es obligatorio." : null}
        </FieldError>

        <FieldLabel theme={theme}>Descripción</FieldLabel>
        <TextInput
          value={form.descripcion}
          onChangeText={props.onFormDescriptionChange}
          placeholder="Describe brevemente la actividad."
          placeholderTextColor={theme.muted}
          style={[
            styles.textInput,
            styles.textArea,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft },
          ]}
          multiline
          textAlignVertical="top"
        />

        <FieldLabel theme={theme}>Entrenador asignado</FieldLabel>
        {activeTrainers.length === 0 ? (
          <EmptyState
            icon="account-tie-outline"
            title="Necesitas un entrenador activo"
            text={
              unavailableTrainer
                ? "El entrenador asignado ya no está disponible. Crea o reactiva uno antes de guardar."
                : "Crea o reactiva un entrenador antes de publicar la clase."
            }
            actionLabel="Crear entrenador"
            onAction={props.onCreateTrainer}
            theme={theme}
          />
        ) : (
          <Pressable
            style={[
              styles.trainerField,
              { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              unavailableTrainer && styles.trainerFieldUnavailable,
            ]}
            onPress={openTrainerSelector}
            accessibilityRole="button"
            accessibilityLabel={
              selectedTrainer
                ? `Cambiar entrenador. Seleccionado ${selectedTrainer.nombre || "Entrenador"}`
                : "Seleccionar entrenador activo"
            }
            accessibilityState={{ expanded: trainerSelectorVisible }}
          >
            {selectedTrainer ? (
              <Avatar
                uri={resolverUrlMedia(selectedTrainer.fotoPerfilUrl)}
                initials={getInitials(selectedTrainer.nombre, "Entrenador")}
                size={46}
                theme={theme}
              />
            ) : (
              <View style={[styles.trainerFieldIcon, { backgroundColor: theme.surface }]}>
                <MaterialCommunityIcons
                  name={unavailableTrainer ? "account-alert-outline" : "account-search-outline"}
                  size={23}
                  color={unavailableTrainer ? "#DC2626" : theme.primary}
                />
              </View>
            )}
            <View style={styles.trainerFieldCopy}>
              <Text style={[styles.trainerFieldName, { color: theme.text }]} numberOfLines={1}>
                {selectedTrainer?.nombre?.trim() ||
                  (unavailableTrainer ? "Entrenador no disponible" : "Seleccionar entrenador")}
              </Text>
              <Text style={[styles.trainerFieldEmail, { color: theme.muted }]} numberOfLines={1}>
                {selectedTrainer?.email?.trim() ||
                  (unavailableTrainer
                    ? "Elige un entrenador activo antes de guardar"
                    : "Busca por nombre o email")}
              </Text>
            </View>
            <View style={styles.trainerFieldAction}>
              <Text style={[styles.trainerFieldActionText, { color: theme.primary }]}>
                {selectedTrainer || unavailableTrainer ? "Cambiar" : "Elegir"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={21} color={theme.primary} />
            </View>
          </Pressable>
        )}
        <FieldError>{trainerError}</FieldError>
      </Card>

      <Card theme={theme} style={styles.formCard}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Duración y capacidad</Text>
        <Text style={[styles.formHint, { color: theme.muted }]}>Estos valores se aplican a cada sesión.</Text>
        <View style={styles.numberFields}>
          <View style={styles.numberField}>
            <FieldLabel theme={theme}>Duración (min)</FieldLabel>
            <TextInput
              value={form.duracion}
              onChangeText={props.onFormDurationChange}
              placeholder="45"
              placeholderTextColor={theme.muted}
              keyboardType="number-pad"
              style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
            />
            <FieldError>{durationError || (!form.duracion.trim() ? "Obligatoria." : null)}</FieldError>
          </View>
          <View style={styles.numberField}>
            <FieldLabel theme={theme}>Capacidad</FieldLabel>
            <TextInput
              value={form.capacidad}
              onChangeText={props.onFormCapacityChange}
              placeholder="20"
              placeholderTextColor={theme.muted}
              keyboardType="number-pad"
              style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
            />
            <FieldError>{capacityError || (!form.capacidad.trim() ? "Obligatoria." : null)}</FieldError>
          </View>
        </View>
      </Card>

      {isEditing ? (
        <Card theme={theme} style={styles.scheduleInfoCard}>
          <View style={[styles.scheduleInfoIcon, { backgroundColor: theme.surfaceSoft }]}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={23} color={theme.primary} />
          </View>
          <View style={styles.scheduleInfoCopy}>
            <Text style={[styles.scheduleInfoTitle, { color: theme.text }]}>Horario semanal</Text>
            <Text style={[styles.scheduleInfoText, { color: theme.muted }]}>
              Los días y las horas se gestionan desde la ficha de la clase.
            </Text>
          </View>
          <Pressable
            style={styles.iconTouchTarget}
            onPress={props.onManageScheduleFromEdit}
            accessibilityRole="button"
            accessibilityLabel="Gestionar horario"
          >
            <MaterialCommunityIcons name="chevron-right" size={23} color={theme.secondary} />
          </Pressable>
        </Card>
      ) : (
        <Card theme={theme} style={styles.formCard}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Horario semanal</Text>
          <Text style={[styles.formHint, { color: theme.muted }]}>El horario se repetirá cada semana hasta que desactives la programación.</Text>

          <FieldLabel theme={theme}>Días</FieldLabel>
          <View style={styles.weekDays}>
            {orderedDays.map((day) => {
              const selected = form.dias.includes(day.id);
              return (
                <Pressable
                  key={day.id}
                  style={[
                    styles.weekDay,
                    { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                    selected && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => props.onToggleFormDay(day.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={day.nombre}
                >
                  <Text style={[styles.weekDayText, { color: selected ? theme.textOnPrimary : theme.text }]}>
                    {day.corto}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <FieldError>
            {form.dias.length === 0 ? "Selecciona al menos un día." : null}
          </FieldError>

          <FieldLabel theme={theme}>Horas</FieldLabel>
          <View style={styles.timeComposer}>
            <TextInput
              value={form.horaNueva}
              onChangeText={props.onFormNewTimeChange}
              placeholder="18:00"
              placeholderTextColor={theme.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={[
                styles.textInput,
                styles.timeInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceSoft },
              ]}
            />
            <SecondaryButton
              label="Añadir"
              icon="plus"
              theme={theme}
              onPress={props.onAddFormTime}
              disabled={!normalizeTime(form.horaNueva)}
              style={styles.timeAddButton}
            />
          </View>
          <View style={styles.timeChips}>
            {form.horas.map((time) => (
              <Pressable
                key={time}
                style={[styles.timeChip, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}
                onPress={() => props.onRemoveFormTime(time)}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar hora ${time}`}
              >
                <Text style={[styles.timeChipText, { color: theme.text }]}>{time}</Text>
                <MaterialCommunityIcons name="close" size={16} color={theme.muted} />
              </Pressable>
            ))}
          </View>
          <FieldError>
            {form.horas.length === 0 ? "Añade al menos una hora." : null}
          </FieldError>

          <View style={[styles.creationSummary, { backgroundColor: theme.surfaceSoft }]}>
            <MaterialCommunityIcons name="calendar-check-outline" size={22} color={theme.primary} />
            <Text style={[styles.creationSummaryText, { color: theme.text }]}>
              {form.dias.length} {form.dias.length === 1 ? "día" : "días"} · {form.horas.length}{" "}
              {form.horas.length === 1 ? "hora" : "horas"} por día · {sessionCount}{" "}
              {sessionCount === 1 ? "horario semanal" : "horarios semanales"}
            </Text>
          </View>
        </Card>
      )}

      <View style={styles.formActions}>
        <PrimaryButton
          label={isEditing ? "Guardar cambios" : "Crear clase"}
          icon={isEditing ? "content-save-outline" : "plus"}
          theme={theme}
          onPress={() => void submit()}
          disabled={!isValid || activeTrainers.length === 0}
          loading={submitting || props.saving}
          style={styles.formPrimaryAction}
        />
        <SecondaryButton
          label="Cancelar"
          theme={theme}
          onPress={props.onCancelForm}
          disabled={submitting || props.saving}
          style={styles.formSecondaryAction}
        />
      </View>
      <TrainerSelectorModal
        visible={trainerSelectorVisible}
        trainers={activeTrainers}
        selectedTrainerId={selectedTrainer?.id || null}
        theme={theme}
        onSelect={(trainerId) => {
          props.onFormTrainerChange(trainerId);
          setTrainerSelectorVisible(false);
        }}
        onClose={() => setTrainerSelectorVisible(false)}
      />
    </ScreenContainer>
  );
}

export default function AdminClasses(props: AdminClassesProps) {
  const { theme, mode, activeGroups, inactiveGroups, selectedGroupKey } = props;
  const selectedGroup =
    activeGroups.find((group) => group.key === selectedGroupKey) ||
    inactiveGroups.find((group) => group.key === selectedGroupKey) ||
    null;

  if (mode === "CREAR" || mode === "EDITAR") {
    return <ClassForm props={props} />;
  }

  if (selectedGroup) {
    const active = activeGroups.some((group) => group.key === selectedGroup.key);
    return (
      <ClassDetail
        group={selectedGroup}
        active={active}
        theme={theme}
        days={props.days}
        uploadingExistingImage={props.uploadingExistingImage}
        getReservationsCount={props.getReservationsCount}
        onBack={props.onBackToList}
        onEdit={() => props.onEditGroup(selectedGroup)}
        onChangeCover={() => props.onChangeCover(selectedGroup)}
        onAddDay={props.onAddDay}
        onRemoveDay={props.onRemoveDay}
        onAddTime={props.onAddTime}
        onUpdateTime={props.onUpdateTime}
        onRemoveTime={props.onRemoveTime}
        onDeactivateProgram={props.onDeactivateProgram}
      />
    );
  }

  const activeFilter = mode === "DESACTIVADAS" ? "DESACTIVADAS" : "CREADAS";
  const sourceGroups = activeFilter === "CREADAS" ? activeGroups : inactiveGroups;
  const normalizedSearch = normalizeSearch(props.search);
  const filteredGroups = sourceGroups.filter((group) =>
    normalizeSearch(
      `${group.nombre || ""} ${group.descripcion || ""} ${group.nombreEntrenador || ""}`,
    ).includes(normalizedSearch),
  );
  const isGeneralEmpty = sourceGroups.length === 0;
  const hasNoResults = !isGeneralEmpty && filteredGroups.length === 0;
  const resultText = normalizedSearch
    ? `Mostrando ${filteredGroups.length} de ${sourceGroups.length} clases`
    : `${sourceGroups.length} ${sourceGroups.length === 1 ? "clase" : "clases"}`;

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={props.adminAvatarUri}
        adminInitials={props.adminInitials}
        onAdminAvatarPress={props.onAdminAvatarPress}
        eyebrow="ACTIVIDAD"
        title="Clases"
        subtitle="Organiza las actividades, horarios y ocupación del gimnasio."
      />

      <PrimaryButton
        label="Nueva clase"
        icon="calendar-plus"
        theme={theme}
        onPress={props.onNewClass}
        style={styles.newClassButton}
      />

      <SearchInput
        value={props.search}
        onChangeText={props.onSearchChange}
        theme={theme}
        placeholder="Buscar por clase, descripción o entrenador..."
      />

      <View style={styles.filters}>
        {FILTERS.map((filter) => {
          const count = filter.value === "CREADAS" ? activeGroups.length : inactiveGroups.length;
          return (
            <FilterChip
              key={filter.value}
              label={`${filter.label} ${count}`}
              active={activeFilter === filter.value}
              theme={theme}
              onPress={() => props.onModeChange(filter.value)}
              stableHeight
            />
          );
        })}
      </View>

      {!props.loading && !props.error && (
        <Text style={[styles.resultMeta, { color: theme.muted }]}>{resultText}</Text>
      )}

      {props.loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Cargando clases...</Text>
        </View>
      ) : props.error ? (
        <EmptyState
          icon="cloud-alert-outline"
          title="No se pudieron cargar las clases"
          text={props.error}
          theme={theme}
        />
      ) : isGeneralEmpty ? (
        <EmptyState
          icon={activeFilter === "CREADAS" ? "calendar-plus" : "calendar-remove-outline"}
          title={activeFilter === "CREADAS" ? "Sin clases activas" : "Sin clases desactivadas"}
          text={
            activeFilter === "CREADAS"
              ? "Crea una clase con días y horas para publicarla en la agenda."
              : "Las clases que desactives aparecerán aquí en modo consulta."
          }
          actionLabel={activeFilter === "CREADAS" ? "Nueva clase" : undefined}
          onAction={activeFilter === "CREADAS" ? props.onNewClass : undefined}
          theme={theme}
        />
      ) : hasNoResults ? (
        <EmptyState
          icon="calendar-search"
          title="Sin resultados"
          text="Prueba con otro nombre, descripción o entrenador."
          theme={theme}
        />
      ) : (
        <View style={styles.classList}>
          {filteredGroups.map((group) => (
            <ClassListCard
              key={group.key}
              group={group}
              active={activeFilter === "CREADAS"}
              theme={theme}
              getReservationsCount={props.getReservationsCount}
              onPress={() => props.onOpenGroup(group.key)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1 },
  newClassButton: { minHeight: 50, marginTop: 15, marginBottom: 16 },
  filters: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 9, marginTop: 13 },
  resultMeta: { marginTop: 13, marginBottom: 10, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  classList: { gap: 10 },
  classCard: { minHeight: 126, padding: 14, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 13 },
  classThumbnail: { width: 76, height: 88, borderRadius: 17, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  classThumbnailImage: { width: "100%", height: "100%" },
  classCardBody: { flex: 1, minWidth: 0, alignSelf: "stretch", justifyContent: "center" },
  classCardTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  className: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21, fontWeight: "900" },
  classTrainer: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  classSchedule: { marginTop: 7, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  classMetaRow: { marginTop: 5, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  classMeta: { fontSize: 11, lineHeight: 16, fontWeight: "700" },
  metaDot: { width: 4, height: 4, borderRadius: 999 },
  statusBadge: { minHeight: 24, borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  statusDot: { width: 6, height: 6, borderRadius: 999 },
  statusText: { fontSize: 10, lineHeight: 14, fontWeight: "900" },
  loadingState: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontWeight: "700" },
  detailHeader: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 15 },
  backButton: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  detailHeaderCopy: { flex: 1, minWidth: 0 },
  detailEyebrow: { fontSize: 10, lineHeight: 14, fontWeight: "900", marginBottom: 3 },
  detailTitle: { fontSize: 25, lineHeight: 29, fontWeight: "900" },
  identityCard: { padding: 16, borderRadius: 24 },
  detailCover: { width: "100%", aspectRatio: 16 / 7, borderRadius: 18, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  detailCoverImage: { width: "100%", height: "100%" },
  identityCopy: { marginTop: 15 },
  identityName: { fontSize: 22, lineHeight: 27, fontWeight: "900" },
  identityDescription: { marginTop: 5, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  detailActions: { marginTop: 15, flexDirection: "row", gap: 10 },
  detailActionButton: { flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: 10 },
  sectionTitle: { marginTop: 23, marginBottom: 10, fontSize: 18, lineHeight: 23, fontWeight: "900" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryTile: { width: "48%", flexGrow: 1, minHeight: 112, padding: 14, borderRadius: 20 },
  summaryIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  summaryValue: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  summaryLabel: { marginTop: 3, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-end" },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  sectionHint: { marginTop: -6, marginBottom: 10, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  dayTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayTab: { minWidth: 72, minHeight: 56, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dayTabLabel: { fontSize: 12, lineHeight: 16, fontWeight: "900" },
  dayTabMeta: { marginTop: 2, fontSize: 10, lineHeight: 14, fontWeight: "700" },
  addDayCard: { marginTop: 12, padding: 14, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  addDayCopy: { flex: 1, minWidth: 0 },
  addDayTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  addDayHint: { marginTop: 2, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  addDayChips: { maxWidth: "48%", flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 7 },
  addDayChip: { minWidth: 42, minHeight: 36, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addDayChipText: { fontSize: 12, fontWeight: "900" },
  scheduleCard: { marginTop: 12, padding: 0, borderRadius: 22, overflow: "hidden" },
  selectedDayHeader: { minHeight: 72, paddingHorizontal: 15, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  selectedDayCopy: { flex: 1, minWidth: 0 },
  selectedDayTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  selectedDayMeta: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  iconTouchTarget: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  addTimeRow: { paddingHorizontal: 15, paddingBottom: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  compactInput: { flex: 1, minWidth: 0, height: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: "800" },
  addTimeButton: { minHeight: 48, paddingHorizontal: 14 },
  inlineEmpty: { minHeight: 100, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  inlineEmptyText: { fontSize: 13, fontWeight: "700" },
  sessionList: { borderTopWidth: 1 },
  sessionRow: { minHeight: 100, paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  sessionTimeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sessionBody: { flex: 1, minWidth: 0 },
  sessionTime: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  sessionMeta: { marginTop: 3, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  sessionEditInput: { height: 40, maxWidth: 104, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, fontSize: 14, fontWeight: "800" },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", borderRadius: 999 },
  sessionActions: { flexDirection: "row", alignItems: "center", marginRight: -8 },
  readOnlyNotice: { marginTop: 14, padding: 16, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  readOnlyText: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  formCard: { padding: 17, borderRadius: 23, marginBottom: 13 },
  formTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  formHint: { marginTop: 3, marginBottom: 15, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  formCover: { width: "100%", aspectRatio: 16 / 7, borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  formCoverImage: { width: "100%", height: "100%" },
  formCoverEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 7 },
  formCoverText: { fontSize: 12, fontWeight: "800" },
  formCoverAction: { position: "absolute", right: 10, bottom: 10, width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  fieldLabel: { marginTop: 13, marginBottom: 7, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  textInput: { minHeight: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  textArea: { minHeight: 104 },
  fieldError: { marginTop: 5, fontSize: 11, lineHeight: 16, fontWeight: "700", color: "#DC2626" },
  trainerField: { minHeight: 72, borderRadius: 18, borderWidth: 1, padding: 11, flexDirection: "row", alignItems: "center", gap: 11 },
  trainerFieldUnavailable: { borderColor: "#DC2626" },
  trainerFieldIcon: { width: 46, height: 46, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  trainerFieldCopy: { flex: 1, minWidth: 0 },
  trainerFieldName: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  trainerFieldEmail: { marginTop: 2, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  trainerFieldAction: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 2 },
  trainerFieldActionText: { fontSize: 11, lineHeight: 16, fontWeight: "900" },
  trainerSelectorModalRoot: { flex: 1, justifyContent: "flex-end" },
  trainerSelectorBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15, 23, 42, 0.42)" },
  trainerSelectorSheet: { flexShrink: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, paddingTop: 18, paddingHorizontal: 18, gap: 13, shadowColor: "#0F172A", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 10 },
  trainerSelectorHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  trainerSelectorHeaderCopy: { flex: 1, minWidth: 0 },
  trainerSelectorEyebrow: { fontSize: 10, lineHeight: 14, fontWeight: "900", marginBottom: 3 },
  trainerSelectorTitle: { fontSize: 25, lineHeight: 30, fontWeight: "900" },
  trainerSelectorSubtitle: { marginTop: 4, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  trainerSelectorClose: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  trainerSelectorResults: { fontSize: 12, lineHeight: 17, fontWeight: "900" },
  trainerSelectorList: { flexGrow: 0, flexShrink: 1, minHeight: 80 },
  trainerSelectorListContent: { gap: 9, paddingBottom: 12 },
  trainerSelectorEmptyContent: { flexGrow: 1 },
  trainerSelectorRow: { minHeight: 68, borderRadius: 20, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 11 },
  trainerSelectorRowCopy: { flex: 1, minWidth: 0 },
  trainerSelectorName: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  trainerSelectorEmail: { marginTop: 2, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  trainerSelectorEmpty: { minHeight: 140, alignItems: "center", justifyContent: "center", padding: 18 },
  trainerSelectorEmptyTitle: { marginTop: 8, fontSize: 16, lineHeight: 21, fontWeight: "900" },
  trainerSelectorEmptyText: { marginTop: 4, fontSize: 12, lineHeight: 17, fontWeight: "700", textAlign: "center" },
  numberFields: { flexDirection: "row", gap: 10 },
  numberField: { flex: 1, minWidth: 0 },
  scheduleInfoCard: { padding: 15, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 13 },
  scheduleInfoIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  scheduleInfoCopy: { flex: 1, minWidth: 0 },
  scheduleInfoTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  scheduleInfoText: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  weekDays: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  weekDay: { width: 43, height: 43, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  weekDayText: { fontSize: 13, fontWeight: "900" },
  timeComposer: { flexDirection: "row", alignItems: "center", gap: 9 },
  timeInput: { flex: 1, minWidth: 0 },
  timeAddButton: { minHeight: 50 },
  timeChips: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  timeChipText: { fontSize: 12, fontWeight: "900" },
  creationSummary: { marginTop: 16, borderRadius: 17, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  creationSummaryText: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18, fontWeight: "800" },
  formActions: { gap: 10 },
  formPrimaryAction: { minHeight: 52 },
  formSecondaryAction: { minHeight: 48 },
});
