import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  formatearFechaCompleta,
  obtenerHora,
} from "../../features/classes/classDateUtils";
import { colorConAlpha } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  ClassMediaPlaceholder,
  DaySelector,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import type { TrainerDashboardClass } from "./TrainerDashboard";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type TrainerCalendarDay = {
  key: string;
  label: string;
  meta?: string;
  disabled?: boolean;
};

export type TrainerClassReservation = {
  id: number;
  clienteId: number;
  nombreCliente?: string | null;
};

export type TrainerClassUser = {
  id: number;
  nombre?: string | null;
  fotoPerfilUrl?: string | null;
};

function getInitials(name?: string | null) {
  const initials = (name || "GymFlow")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "GF";
}

export default function TrainerClasses({
  theme,
  primaryColor,
  secondaryColor,
  gymName,
  trainerFirstName,
  trainerPhotoUri,
  trainerInitials,
  loading,
  error,
  allClasses,
  selectedClass,
  weekOffset,
  weekRange,
  weekKey,
  days,
  activeDay,
  selectedDateLabel,
  classesThisWeek,
  classesSelectedDay,
  nextClass,
  now,
  users,
  getActiveReservations,
  resolveMediaUrl,
  onOpenProfile,
  onRetry,
  onPreviousWeek,
  onNextWeek,
  onSelectDay,
  onBackToToday,
  onSelectClass,
  onBackFromDetail,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  gymName: string;
  trainerFirstName: string;
  trainerPhotoUri?: string | null;
  trainerInitials: string;
  loading: boolean;
  error?: string | null;
  allClasses: TrainerDashboardClass[];
  selectedClass?: TrainerDashboardClass | null;
  weekOffset: number;
  weekRange: string;
  weekKey: string;
  days: TrainerCalendarDay[];
  activeDay: string;
  selectedDateLabel: string;
  classesThisWeek: TrainerDashboardClass[];
  classesSelectedDay: TrainerDashboardClass[];
  nextClass?: TrainerDashboardClass | null;
  now: Date;
  users: TrainerClassUser[];
  getActiveReservations: (classId: number) => TrainerClassReservation[];
  resolveMediaUrl: (url?: string | null) => string | null;
  onOpenProfile: () => void;
  onRetry: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onSelectDay: (day: string) => void;
  onBackToToday: () => void;
  onSelectClass: (classId: number) => void;
  onBackFromDetail: () => void;
}) {
  const getTemporalStatus = (item: TrainerDashboardClass) => {
    const startsAt = new Date(item.fechaHora).getTime();
    const duration = Number(item.duracionMinutos) || 45;
    const endsAt = startsAt + duration * 60 * 1000;
    const isNext = nextClass?.id === item.id;

    if (
      !Number.isNaN(startsAt) &&
      now.getTime() >= startsAt &&
      now.getTime() <= endsAt
    ) {
      return {
        label: "En curso",
        icon: "play-circle-outline" as IconName,
        color: primaryColor,
        background: colorConAlpha(primaryColor, "12"),
      };
    }

    if (!Number.isNaN(endsAt) && endsAt < now.getTime()) {
      return {
        label: "Finalizada",
        icon: "check-circle-outline" as IconName,
        color: "#94A3B8",
        background: "#F1F5F9",
      };
    }

    if (isNext) {
      return {
        label: "Próxima",
        icon: "clock-outline" as IconName,
        color: primaryColor,
        background: colorConAlpha(primaryColor, "12"),
      };
    }

    return {
      label: "Pendiente",
      icon: "calendar-clock" as IconName,
      color: secondaryColor,
      background: colorConAlpha(secondaryColor, "12"),
    };
  };

  const renderInfoItem = ({
    icon,
    label,
    value,
  }: {
    icon: IconName;
    label: string;
    value: string;
  }) => (
    <Card theme={theme} style={styles.infoItem}>
      <MaterialCommunityIcons name={icon} size={20} color={secondaryColor} />
      <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
        {value}
      </Text>
    </Card>
  );

  const renderClassDetail = (item: TrainerDashboardClass) => {
    const status = getTemporalStatus(item);
    const classReservations = getActiveReservations(item.id);
    const studentCount = classReservations.length;
    const capacity = Number(item.capacidadMaxima) || 0;
    const duration = Number(item.duracionMinutos) || 45;
    const imageUri = resolveMediaUrl(item.imagenUrl);

    return (
      <ScreenContainer theme={theme}>
        <View style={styles.detailTop}>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={onBackFromDetail}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.text}
            />
          </Pressable>
          <View
            style={[styles.statusPill, { backgroundColor: status.background }]}
          >
            <MaterialCommunityIcons
              name={status.icon}
              size={14}
              color={status.color}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {imageUri ? (
          <ImageBackground
            source={{ uri: imageUri }}
            style={styles.detailHero}
            imageStyle={styles.detailHeroImage}
          >
            <View style={styles.detailShade} />
            <View style={styles.detailHeroCopy}>
              <Text style={styles.detailEyebrow}>
                {formatearFechaCompleta(item.fechaHora)}
              </Text>
              <Text style={styles.detailTitle}>{item.nombre}</Text>
            </View>
          </ImageBackground>
        ) : (
          <ClassMediaPlaceholder
            theme={theme}
            icon="calendar-clock-outline"
            eyebrow={formatearFechaCompleta(item.fechaHora)}
            title={item.nombre}
            style={styles.detailHero}
          />
        )}

        {!!item.descripcion && (
          <Text style={[styles.detailDescription, { color: theme.muted }]}>
            {item.descripcion}
          </Text>
        )}

        <View style={styles.detailGrid}>
          {renderInfoItem({
            icon: "clock-outline",
            label: "Horario",
            value: `${obtenerHora(item.fechaHora)} · ${duration} min`,
          })}
          {renderInfoItem({
            icon: "account-group-outline",
            label: "Alumnos",
            value: `${studentCount}/${capacity || "-"} inscritos`,
          })}
          {renderInfoItem({
            icon: "calendar-check-outline",
            label: "Estado",
            value: status.label,
          })}
          {renderInfoItem({
            icon: "map-marker-outline",
            label: "Gimnasio",
            value: gymName,
          })}
        </View>

        <SectionHeader
          title="Alumnos inscritos"
          actionLabel={`${studentCount}/${capacity || "-"} plazas`}
          theme={theme}
        />

        {classReservations.length === 0 ? (
          <EmptyState
            icon="account-off-outline"
            title="Clase sin alumnos"
            text="Cuando los clientes reserven esta clase, aparecerán aquí."
            theme={theme}
          />
        ) : (
          <View style={styles.studentList}>
            {classReservations.map((reservation) => {
              const client = users.find(
                (user) => user.id === reservation.clienteId,
              );
              const clientName =
                reservation.nombreCliente || client?.nombre || "Cliente";

              return (
                <Card
                  key={reservation.id}
                  theme={theme}
                  style={styles.studentCard}
                >
                  <Avatar
                    uri={resolveMediaUrl(client?.fotoPerfilUrl)}
                    initials={getInitials(clientName)}
                    size={46}
                    theme={theme}
                  />
                  <View style={styles.studentCopy}>
                    <Text
                      style={[styles.studentName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {clientName}
                    </Text>
                    <Text style={[styles.studentMeta, { color: theme.muted }]}>
                      Reserva activa
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.studentBadge,
                      { backgroundColor: colorConAlpha(secondaryColor, "12") },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={15}
                      color={secondaryColor}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScreenContainer>
    );
  };

  const renderAgendaCard = (item: TrainerDashboardClass) => {
    const status = getTemporalStatus(item);
    const studentCount = getActiveReservations(item.id).length;
    const capacity = Number(item.capacidadMaxima) || 0;
    const duration = Number(item.duracionMinutos) || 45;
    const finished = status.label === "Finalizada";
    const highlighted =
      status.label === "Próxima" || status.label === "En curso";

    return (
      <Card
        key={item.id}
        theme={theme}
        style={[
          styles.agendaCard,
          highlighted && { borderColor: colorConAlpha(primaryColor, "42") },
          finished && styles.agendaCardDone,
        ]}
        onPress={() => onSelectClass(item.id)}
      >
        <View style={styles.agendaHeader}>
          <View
            style={[
              styles.timeBox,
              { backgroundColor: colorConAlpha(primaryColor, "12") },
            ]}
          >
            <Text style={[styles.timeText, { color: primaryColor }]}>
              {obtenerHora(item.fechaHora)}
            </Text>
          </View>
          <View style={styles.agendaCopy}>
            <Text
              style={[styles.agendaTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.nombre}
            </Text>
            <Text
              style={[styles.agendaMeta, { color: theme.muted }]}
              numberOfLines={1}
            >
              {duration} min · {studentCount}/{capacity || "-"} alumnos
            </Text>
          </View>
          <View
            style={[styles.statusPill, { backgroundColor: status.background }]}
          >
            <MaterialCommunityIcons
              name={status.icon}
              size={14}
              color={status.color}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.agendaFooter}>
          <View style={styles.agendaFooterMeta}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={17}
              color={theme.muted}
            />
            <Text
              style={[styles.agendaFooterMetaText, { color: theme.muted }]}
              numberOfLines={1}
            >
              {studentCount === 0
                ? "Sin alumnos inscritos"
                : `${studentCount} alumno(s) inscritos`}
            </Text>
          </View>
          <View
            style={[
              styles.detailButton,
              { backgroundColor: colorConAlpha(primaryColor, "12") },
            ]}
          >
            <Text style={[styles.detailButtonText, { color: primaryColor }]}>
              Ver
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={17}
              color={primaryColor}
            />
          </View>
        </View>
      </Card>
    );
  };

  if (selectedClass) {
    return renderClassDetail(selectedClass);
  }

  return (
    <ScreenContainer theme={theme}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: secondaryColor }]}>
            Agenda
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Mis clases</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Hola, {trainerFirstName}. Consulta tus sesiones y alumnos del día.
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

      {loading ? (
        <Card theme={theme} style={styles.loadingCard}>
          <ActivityIndicator size="small" color={primaryColor} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Cargando agenda...
          </Text>
        </Card>
      ) : error && allClasses.length === 0 ? (
        <EmptyState
          icon="wifi-alert"
          title="No se pudo cargar la agenda"
          text={error}
          actionLabel="Reintentar"
          onAction={onRetry}
          theme={theme}
        />
      ) : allClasses.length === 0 ? (
        <EmptyState
          icon="calendar-account-outline"
          title="Sin clases asignadas"
          text="Cuando administración te asigne clases activas, aparecerán aquí."
          theme={theme}
        />
      ) : (
        <>
          <View style={styles.weekHeader}>
            <View style={styles.weekCopy}>
              <Text style={[styles.weekLabel, { color: theme.muted }]}>
                Semana
              </Text>
              <Text style={[styles.weekRange, { color: theme.text }]}>
                {weekRange}
              </Text>
            </View>
            <View style={styles.weekControls}>
              <Pressable
                style={[
                  styles.weekButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  weekOffset === 0 && styles.weekButtonDisabled,
                ]}
                disabled={weekOffset === 0}
                onPress={onPreviousWeek}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={22}
                  color={theme.muted}
                />
              </Pressable>
              <Pressable
                style={[
                  styles.weekButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={onNextWeek}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={primaryColor}
                />
              </Pressable>
            </View>
          </View>

          <DaySelector
            days={days}
            activeDay={activeDay}
            weekKey={weekKey}
            theme={theme}
            onSelect={(day) => {
              if (days.some((item) => item.key === day && item.disabled)) {
                return;
              }
              onSelectDay(day);
            }}
          />

          <SectionHeader
            title={selectedDateLabel}
            actionLabel={weekOffset > 0 ? "Volver a hoy" : undefined}
            onAction={weekOffset > 0 ? onBackToToday : undefined}
            theme={theme}
          />

          {classesThisWeek.length === 0 ? (
            <EmptyState
              icon="calendar-blank-outline"
              title="Sin clases esta semana"
              text="Avanza a otra semana para revisar más sesiones asignadas."
              actionLabel="Semana siguiente"
              onAction={onNextWeek}
              theme={theme}
            />
          ) : classesSelectedDay.length === 0 ? (
            <EmptyState
              icon="calendar-blank-outline"
              title="Sin clases este día"
              text="Selecciona otro día de la semana para ver tus próximas sesiones."
              theme={theme}
            />
          ) : (
            <View style={styles.classList}>
              {classesSelectedDay.map(renderAgendaCard)}
            </View>
          )}
        </>
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
  loadingCard: {
    minHeight: 120,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "800",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  weekCopy: {
    flex: 1,
    minWidth: 0,
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  weekRange: {
    fontSize: 17,
    fontWeight: "900",
  },
  weekControls: {
    flexDirection: "row",
    gap: 8,
  },
  weekButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekButtonDisabled: {
    opacity: 0.42,
  },
  classList: {
    gap: 12,
  },
  agendaCard: {
    padding: 16,
    gap: 14,
  },
  agendaCardDone: {
    opacity: 0.62,
  },
  agendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeBox: {
    width: 66,
    minHeight: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "900",
  },
  agendaCopy: {
    flex: 1,
    minWidth: 0,
  },
  agendaTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  agendaMeta: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  statusPill: {
    minHeight: 31,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  agendaFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  agendaFooterMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  agendaFooterMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  detailButton: {
    minHeight: 42,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  detailButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  detailTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
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
  detailHero: {
    minHeight: 270,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 20,
    backgroundColor: "#CBD5E1",
  },
  detailHeroImage: {
    borderRadius: 28,
  },
  detailShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  detailHeroCopy: {
    gap: 6,
  },
  detailEyebrow: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  detailTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 36,
  },
  detailDescription: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 16,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  infoItem: {
    width: "48%",
    minHeight: 116,
    padding: 14,
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  studentList: {
    gap: 10,
  },
  studentCard: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  studentCopy: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  studentMeta: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  studentBadge: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
