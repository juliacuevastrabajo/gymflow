import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  formatearDia,
  obtenerHora,
} from "../../features/classes/classDateUtils";
import { colorConAlpha } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  ClassMediaPlaceholder,
  DashboardHeroBackground,
  EmptyState,
  MetricCard,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type TrainerDashboardClass = {
  id: number;
  nombre: string;
  fechaHora: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  capacidadMaxima?: number | string | null;
  duracionMinutos?: number | string | null;
};

export default function TrainerDashboard({
  theme,
  primaryColor,
  secondaryColor,
  backgroundImageUri,
  gymName,
  trainerFirstName,
  trainerPhotoUri,
  trainerInitials,
  loading,
  error,
  hasAssignedClasses,
  classesToday,
  nextClassToday,
  nextClass,
  dayFinished,
  expectedStudents,
  unreadMessages,
  classGroupCount,
  routineCount,
  quickActionWidth,
  now,
  getActiveReservationCount,
  getAvailableSpaces,
  resolveMediaUrl,
  onOpenProfile,
  onRetry,
  onOpenClasses,
  onOpenMessages,
  onOpenRoutines,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  backgroundImageUri?: string | null;
  gymName: string;
  trainerFirstName: string;
  trainerPhotoUri?: string | null;
  trainerInitials: string;
  loading: boolean;
  error?: string | null;
  hasAssignedClasses: boolean;
  classesToday: TrainerDashboardClass[];
  nextClassToday?: TrainerDashboardClass | null;
  nextClass?: TrainerDashboardClass | null;
  dayFinished: boolean;
  expectedStudents: number;
  unreadMessages: number;
  classGroupCount: number;
  routineCount: number;
  quickActionWidth: number;
  now: Date;
  getActiveReservationCount: (classId: number) => number;
  getAvailableSpaces: (item: TrainerDashboardClass) => number;
  resolveMediaUrl: (url?: string | null) => string | null;
  onOpenProfile: () => void;
  onRetry: () => void;
  onOpenClasses: () => void;
  onOpenMessages: () => void;
  onOpenRoutines: () => void;
}) {
  const renderNextClass = () => {
    if (!nextClassToday) {
      const title = dayFinished
        ? "Jornada completada"
        : "Sin clase próxima hoy";
      const description = dayFinished
        ? "Todas las clases de hoy ya han pasado."
        : nextClass
          ? `La siguiente clase asignada es ${formatearDia(nextClass.fechaHora)} a las ${obtenerHora(
              nextClass.fechaHora,
            )}.`
          : "No tienes clases asignadas en la agenda.";

      return (
        <Card theme={theme} style={styles.nextEmptyCard}>
          <View
            style={[
              styles.nextEmptyIcon,
              { backgroundColor: colorConAlpha(primaryColor, "12") },
            ]}
          >
            <MaterialCommunityIcons
              name={
                dayFinished ? "check-circle-outline" : "calendar-blank-outline"
              }
              size={27}
              color={primaryColor}
            />
          </View>
          <View style={styles.nextEmptyCopy}>
            <Text style={[styles.nextEmptyTitle, { color: theme.text }]}>
              {title}
            </Text>
            <Text style={[styles.nextEmptyText, { color: theme.muted }]}>
              {description}
            </Text>
          </View>
          {nextClass && (
            <Pressable
              style={[
                styles.nextEmptyButton,
                { backgroundColor: colorConAlpha(primaryColor, "12") },
              ]}
              onPress={onOpenClasses}
            >
              <Text
                style={[styles.nextEmptyButtonText, { color: primaryColor }]}
              >
                Ver
              </Text>
            </Pressable>
          )}
        </Card>
      );
    }

    const imageUri = resolveMediaUrl(nextClassToday.imagenUrl);
    const reservationCount = getActiveReservationCount(nextClassToday.id);
    const capacity = Number(nextClassToday.capacidadMaxima) || 0;
    const availableSpaces = Math.max(0, getAvailableSpaces(nextClassToday));
    const duration = Number(nextClassToday.duracionMinutos) || 45;

    return (
      <Card theme={theme} style={styles.nextClassCard}>
        {imageUri ? (
          <ImageBackground
            source={{ uri: imageUri }}
            style={styles.nextClassImage}
            imageStyle={styles.nextClassImageStyle}
          >
            <View style={styles.nextClassShade} />
            <View style={styles.nextClassBadge}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.nextClassBadgeText}>Siguiente clase</Text>
            </View>
          </ImageBackground>
        ) : (
          <ClassMediaPlaceholder
            theme={theme}
            icon="calendar-clock-outline"
            style={styles.nextClassImage}
          />
        )}
        <View style={styles.nextClassBody}>
          <View style={styles.nextClassTopRow}>
            <View style={styles.nextClassCopy}>
              <Text style={[styles.nextClassTime, { color: primaryColor }]}>
                Hoy · {obtenerHora(nextClassToday.fechaHora)}
              </Text>
              <Text
                style={[styles.nextClassTitle, { color: theme.text }]}
                numberOfLines={2}
              >
                {nextClassToday.nombre}
              </Text>
              {!!nextClassToday.descripcion && (
                <Text
                  style={[styles.nextClassText, { color: theme.muted }]}
                  numberOfLines={2}
                >
                  {nextClassToday.descripcion}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.nextClassCapacity,
                { backgroundColor: colorConAlpha(secondaryColor, "12") },
              ]}
            >
              <Text
                style={[
                  styles.nextClassCapacityValue,
                  { color: secondaryColor },
                ]}
              >
                {reservationCount}/{capacity || "-"}
              </Text>
              <Text
                style={[styles.nextClassCapacityLabel, { color: theme.muted }]}
              >
                alumnos
              </Text>
            </View>
          </View>

          <View style={styles.nextClassMetaGrid}>
            {[
              { icon: "timer-outline" as IconName, label: `${duration} min` },
              {
                icon: "account-multiple-outline" as IconName,
                label: capacity
                  ? `${availableSpaces} plazas libres`
                  : "Sin capacidad",
              },
            ].map((item) => (
              <View key={item.label} style={styles.nextClassMetaItem}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={17}
                  color={theme.muted}
                />
                <Text
                  style={[styles.nextClassMetaText, { color: theme.muted }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            label="Ver clase"
            icon="calendar-clock"
            theme={theme}
            onPress={onOpenClasses}
          />
        </View>
      </Card>
    );
  };

  const getScheduleStatus = (item: TrainerDashboardClass) => {
    const startsAt = new Date(item.fechaHora).getTime();
    const duration = Number(item.duracionMinutos) || 45;
    const endsAt = startsAt + duration * 60 * 1000;
    const isNext = nextClassToday?.id === item.id;

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
        label: "Realizada",
        icon: "check-circle-outline" as IconName,
        color: "#94A3B8",
        background: "#F1F5F9",
      };
    }

    if (isNext) {
      return {
        label: "Siguiente",
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

  const renderScheduleClass = (item: TrainerDashboardClass) => {
    const status = getScheduleStatus(item);
    const reservationCount = getActiveReservationCount(item.id);
    const capacity = Number(item.capacidadMaxima) || 0;
    const duration = Number(item.duracionMinutos) || 45;
    const isCompleted = status.label === "Realizada";
    const isHighlighted =
      status.label === "Siguiente" || status.label === "En curso";

    return (
      <Card
        key={item.id}
        theme={theme}
        style={[
          styles.agendaClassCard,
          isHighlighted && { borderColor: colorConAlpha(primaryColor, "42") },
          isCompleted && styles.agendaClassCardDone,
        ]}
        onPress={onOpenClasses}
      >
        <View
          style={[
            styles.agendaTimeBox,
            { backgroundColor: colorConAlpha(primaryColor, "12") },
          ]}
        >
          <Text style={[styles.agendaTimeText, { color: primaryColor }]}>
            {obtenerHora(item.fechaHora)}
          </Text>
        </View>
        <View style={styles.agendaClassCopy}>
          <Text
            style={[styles.agendaClassTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.nombre}
          </Text>
          <Text
            style={[styles.agendaClassMeta, { color: theme.muted }]}
            numberOfLines={1}
          >
            {duration} min · {reservationCount}/{capacity || "-"} alumnos
          </Text>
        </View>
        <View
          style={[
            styles.agendaStatusPill,
            { backgroundColor: status.background },
          ]}
        >
          <MaterialCommunityIcons
            name={status.icon}
            size={14}
            color={status.color}
          />
          <Text style={[styles.agendaStatusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </Card>
    );
  };

  const renderQuickAction = ({
    icon,
    title,
    text,
    color,
    onPress,
  }: {
    icon: IconName;
    title: string;
    text: string;
    color: string;
    onPress: () => void;
  }) => (
    <Card
      key={title}
      theme={theme}
      style={[styles.quickActionCard, { width: quickActionWidth }]}
      onPress={onPress}
    >
      <View
        style={[
          styles.quickActionIcon,
          { backgroundColor: colorConAlpha(color, "12") },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text
        style={[styles.quickActionTitle, { color: theme.text }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[styles.quickActionText, { color: theme.muted }]}
        numberOfLines={2}
      >
        {text}
      </Text>
    </Card>
  );

  return (
    <ScreenContainer theme={theme}>
      <DashboardHeroBackground imageUri={backgroundImageUri} theme={theme}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: secondaryColor }]}>
              {gymName}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Hola, {trainerFirstName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Revisa tu agenda y prepara la siguiente clase.
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
      </DashboardHeroBackground>

      {loading ? (
        <Card theme={theme} style={styles.loadingCard}>
          <ActivityIndicator size="small" color={primaryColor} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Cargando agenda...
          </Text>
        </Card>
      ) : error && !hasAssignedClasses ? (
        <EmptyState
          icon="wifi-alert"
          title="No se pudo cargar la agenda"
          text={error}
          actionLabel="Reintentar"
          onAction={onRetry}
          theme={theme}
        />
      ) : (
        <>
          {renderNextClass()}

          <View style={styles.metricsRow}>
            <MetricCard
              icon="calendar-today-outline"
              label="Clases hoy"
              value={classesToday.length}
              theme={theme}
            />
            <MetricCard
              icon="account-group-outline"
              label="Alumnos previstos"
              value={expectedStudents}
              theme={theme}
              accent="secondary"
            />
            <MetricCard
              icon="message-text-outline"
              label="Mensajes nuevos"
              value={unreadMessages}
              theme={theme}
            />
          </View>

          <SectionHeader
            title="Agenda de hoy"
            actionLabel="Ver clases"
            onAction={onOpenClasses}
            theme={theme}
          />

          {classesToday.length === 0 ? (
            <EmptyState
              icon="calendar-blank-outline"
              title="Sin clases hoy"
              text={
                nextClass
                  ? `Tu proxima clase asignada es ${formatearDia(nextClass.fechaHora)} a las ${obtenerHora(
                      nextClass.fechaHora,
                    )}.`
                  : "Cuando administracion te asigne clases, apareceran aqui."
              }
              actionLabel={nextClass ? "Ver horario" : undefined}
              onAction={nextClass ? onOpenClasses : undefined}
              theme={theme}
            />
          ) : (
            <View style={styles.todayAgendaList}>
              {dayFinished && (
                <View
                  style={[
                    styles.dayDoneBanner,
                    {
                      backgroundColor: colorConAlpha(secondaryColor, "10"),
                      borderColor: colorConAlpha(secondaryColor, "24"),
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={20}
                    color={secondaryColor}
                  />
                  <Text style={[styles.dayDoneText, { color: theme.muted }]}>
                    Jornada terminada. Buen trabajo por hoy.
                  </Text>
                </View>
              )}
              {classesToday.map(renderScheduleClass)}
            </View>
          )}

          <SectionHeader title="Accesos rápidos" theme={theme} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsGrid}
            contentContainerStyle={styles.quickActionsContent}
            decelerationRate="fast"
            snapToInterval={quickActionWidth + 12}
            snapToAlignment="start"
          >
            {renderQuickAction({
              icon: "calendar-clock",
              title: "Mis clases",
              text: `${classGroupCount} tipo(s) asignados`,
              color: primaryColor,
              onPress: onOpenClasses,
            })}
            {renderQuickAction({
              icon: "message-text-outline",
              title: "Mensajes",
              text:
                unreadMessages > 0
                  ? `${unreadMessages} pendiente(s)`
                  : "Bandeja al dia",
              color: secondaryColor,
              onPress: onOpenMessages,
            })}
            {renderQuickAction({
              icon: "arm-flex-outline",
              title: "Rutinas",
              text: routineCount
                ? `${routineCount} creada(s)`
                : "Crear entrenamientos",
              color: primaryColor,
              onPress: onOpenRoutines,
            })}
          </ScrollView>
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
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  nextClassCard: {
    overflow: "hidden",
    marginBottom: 14,
  },
  nextClassImage: {
    height: 190,
    padding: 16,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  nextClassImageStyle: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  nextClassShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
  },
  nextClassBadge: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextClassBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  nextClassBody: {
    padding: 18,
    gap: 14,
  },
  nextClassTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  nextClassCopy: {
    flex: 1,
    minWidth: 0,
  },
  nextClassTime: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  nextClassTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
  },
  nextClassText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  nextClassCapacity: {
    minWidth: 76,
    minHeight: 66,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  nextClassCapacityValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  nextClassCapacityLabel: {
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },
  nextClassMetaGrid: {
    gap: 9,
  },
  nextClassMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nextClassMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  nextEmptyCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 14,
  },
  nextEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  nextEmptyCopy: {
    flex: 1,
    minWidth: 0,
  },
  nextEmptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  nextEmptyText: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 3,
  },
  nextEmptyButton: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nextEmptyButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  todayAgendaList: {
    gap: 12,
  },
  dayDoneBanner: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  dayDoneText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  agendaClassCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  agendaClassCardDone: {
    opacity: 0.62,
  },
  agendaTimeBox: {
    width: 66,
    minHeight: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  agendaTimeText: {
    fontSize: 18,
    fontWeight: "900",
  },
  agendaClassCopy: {
    flex: 1,
    minWidth: 0,
  },
  agendaClassTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  agendaClassMeta: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  agendaStatusPill: {
    minHeight: 31,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  agendaStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  quickActionsGrid: {
    marginRight: -20,
  },
  quickActionsContent: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 4,
  },
  quickActionCard: {
    flexShrink: 0,
    minHeight: 132,
    padding: 13,
    gap: 8,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
});
