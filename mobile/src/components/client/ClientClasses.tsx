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
  formatearFechaCompleta,
  obtenerHora,
} from "../../features/classes/classDateUtils";
import { colorConAlpha, mezclarColores } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  ClassMediaPlaceholder,
  DaySelector,
  EmptyState,
  FilterChip,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type ClientClass = {
  id: number;
  nombre: string;
  fechaHora: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  nombreEntrenador?: string | null;
  capacidadMaxima?: number | string | null;
  duracionMinutos?: number | string | null;
};

export type ClientClassReservation = {
  id: number;
};

export type ClientClassDay = {
  key: string;
  label: string;
  meta?: string;
  disabled?: boolean;
};

type ConfirmedReservation = {
  nombreClase?: string | null;
  fechaHora?: string | null;
  nombreEntrenador?: string | null;
};

type ClassStatus = {
  key: "RESERVADA" | "FINALIZADA" | "COMPLETA" | "POCAS" | "DISPONIBLE";
  label: string;
  color: string;
  backgroundColor: string;
  icon: IconName;
};

export default function ClientClasses({
  theme,
  primaryColor,
  secondaryColor,
  textOnPrimaryColor,
  clientPhotoUri,
  clientInitials,
  loading,
  error,
  allClasses,
  selectedClass,
  weekOffset,
  weekRange,
  weekKey,
  days,
  activeDay,
  activeDateLabel,
  classTypes,
  selectedClassType,
  classesThisWeek,
  classesSelectedDay,
  confirmedReservation,
  reservationError,
  reservingClassId,
  cancellingReservationId,
  getActiveReservation,
  getAvailableSpaces,
  resolveMediaUrl,
  onOpenProfile,
  onRetry,
  onPreviousWeek,
  onNextWeek,
  onSelectDay,
  onSelectClassType,
  onClearClassType,
  onSelectClass,
  onBackFromDetail,
  onReserve,
  onCancelReservation,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  textOnPrimaryColor: string;
  clientPhotoUri?: string | null;
  clientInitials: string;
  loading: boolean;
  error?: string | null;
  allClasses: ClientClass[];
  selectedClass?: ClientClass | null;
  weekOffset: number;
  weekRange: string;
  weekKey: string;
  days: ClientClassDay[];
  activeDay: string;
  activeDateLabel: string;
  classTypes: string[];
  selectedClassType?: string | null;
  classesThisWeek: ClientClass[];
  classesSelectedDay: ClientClass[];
  confirmedReservation?: ConfirmedReservation | null;
  reservationError?: string | null;
  reservingClassId?: number | null;
  cancellingReservationId?: number | null;
  getActiveReservation: (classId: number) => ClientClassReservation | undefined;
  getAvailableSpaces: (classItem: ClientClass) => number;
  resolveMediaUrl: (url?: string | null) => string | null;
  onOpenProfile: () => void;
  onRetry: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onSelectDay: (dayKey: string) => void;
  onSelectClassType: (classType: string | null) => void;
  onClearClassType: () => void;
  onSelectClass: (classId: number) => void;
  onBackFromDetail: () => void;
  onReserve: (classId: number) => void;
  onCancelReservation: (reservationId: number) => void;
}) {
  const getStatus = (classItem: ClientClass): ClassStatus => {
    const activeReservation = getActiveReservation(classItem.id);
    const capacity = Number(classItem.capacidadMaxima) || 0;
    const availableSpaces = Math.max(0, getAvailableSpaces(classItem));

    if (activeReservation) {
      return {
        key: "RESERVADA",
        label: "Ya reservada",
        color: primaryColor,
        backgroundColor: colorConAlpha(primaryColor, "16"),
        icon: "check-circle-outline",
      };
    }

    if (new Date(classItem.fechaHora).getTime() <= Date.now()) {
      return {
        key: "FINALIZADA",
        label: "Finalizada",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        icon: "clock-check-outline",
      };
    }

    if (availableSpaces <= 0) {
      return {
        key: "COMPLETA",
        label: "Completa",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        icon: "lock-outline",
      };
    }

    if (
      capacity > 0 &&
      availableSpaces <= Math.max(2, Math.ceil(capacity * 0.25))
    ) {
      return {
        key: "POCAS",
        label: "Pocas plazas",
        color: primaryColor,
        backgroundColor: colorConAlpha(primaryColor, "12"),
        icon: "alert-circle-outline",
      };
    }

    return {
      key: "DISPONIBLE",
      label: "Disponible",
      color: secondaryColor,
      backgroundColor: colorConAlpha(secondaryColor, "12"),
      icon: "check-outline",
    };
  };

  const renderStatus = (classItem: ClientClass) => {
    const status = getStatus(classItem);

    return (
      <View
        style={[styles.statusPill, { backgroundColor: status.backgroundColor }]}
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
    );
  };

  const renderFeedback = (type: "success" | "error") => {
    const isError = type === "error";
    const title = isError ? "No se pudo reservar" : "Reserva confirmada";
    const text = isError
      ? reservationError
      : `Tienes ${confirmedReservation?.nombreClase} el ${formatearFechaCompleta(
          confirmedReservation?.fechaHora,
        )} a las ${obtenerHora(confirmedReservation?.fechaHora)} con ${
          confirmedReservation?.nombreEntrenador || "tu entrenador"
        }.`;
    const color = isError ? "#DC2626" : secondaryColor;
    const backgroundColor = isError
      ? "#FEF2F2"
      : mezclarColores(secondaryColor, theme.background, 0.82);
    const borderColor = isError
      ? "#FECACA"
      : mezclarColores(secondaryColor, theme.background, 0.68);

    return (
      <View style={[styles.feedback, { backgroundColor, borderColor }]}>
        <View style={[styles.feedbackIcon, { backgroundColor: color }]}>
          <MaterialCommunityIcons
            name={isError ? "alert-circle-outline" : "check"}
            size={22}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.feedbackCopy}>
          <Text style={[styles.feedbackTitle, { color }]}>{title}</Text>
          <Text style={[styles.feedbackText, { color: theme.text }]}>
            {text}
          </Text>
        </View>
      </View>
    );
  };

  const renderInfoItem = (icon: IconName, label: string, value: string) => (
    <Card theme={theme} style={styles.infoItem}>
      <MaterialCommunityIcons name={icon} size={20} color={secondaryColor} />
      <Text style={[styles.infoLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
        {value}
      </Text>
    </Card>
  );

  if (selectedClass) {
    const status = getStatus(selectedClass);
    const activeReservation = getActiveReservation(selectedClass.id);
    const availableSpaces = Math.max(0, getAvailableSpaces(selectedClass));
    const isFull = status.key === "COMPLETA";
    const reserving = reservingClassId === selectedClass.id;
    const cancelling = activeReservation
      ? cancellingReservationId === activeReservation.id
      : false;
    const duration = Number(selectedClass.duracionMinutos) || 45;
    const classImage = resolveMediaUrl(selectedClass.imagenUrl);

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
          {renderStatus(selectedClass)}
        </View>

        {classImage ? (
          <ImageBackground
            source={{ uri: classImage }}
            style={styles.detailHero}
            imageStyle={styles.detailHeroImage}
          >
            <View style={styles.detailShade} />
            <View style={styles.detailHeroCopy}>
              <Text style={styles.detailEyebrow}>
                {formatearFechaCompleta(selectedClass.fechaHora)}
              </Text>
              <Text style={styles.detailTitle}>{selectedClass.nombre}</Text>
            </View>
          </ImageBackground>
        ) : (
          <ClassMediaPlaceholder
            theme={theme}
            icon="calendar-clock-outline"
            eyebrow={formatearFechaCompleta(selectedClass.fechaHora)}
            title={selectedClass.nombre}
            style={styles.detailHero}
          />
        )}

        {!!selectedClass.descripcion && (
          <Text style={[styles.detailDescription, { color: theme.muted }]}>
            {selectedClass.descripcion}
          </Text>
        )}

        <View style={styles.detailGrid}>
          {renderInfoItem(
            "clock-outline",
            "Hora",
            `${obtenerHora(selectedClass.fechaHora)} · ${duration} min`,
          )}
          {renderInfoItem(
            "account-tie-outline",
            "Entrenador",
            selectedClass.nombreEntrenador || "Por asignar",
          )}
          {renderInfoItem(
            "account-group-outline",
            "Plazas",
            `${availableSpaces}/${selectedClass.capacidadMaxima || "-"} disponibles`,
          )}
          {renderInfoItem("calendar-check-outline", "Estado", status.label)}
        </View>

        {!!reservationError && renderFeedback("error")}

        {activeReservation ? (
          <Pressable
            style={[
              styles.cancelButton,
              { borderColor: colorConAlpha(primaryColor, "36") },
              cancelling && styles.reserveButtonDisabled,
            ]}
            disabled={cancelling}
            onPress={() => onCancelReservation(activeReservation.id)}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="calendar-remove-outline"
                  size={20}
                  color={primaryColor}
                />
                <Text
                  style={[styles.cancelButtonText, { color: primaryColor }]}
                >
                  Cancelar reserva
                </Text>
              </>
            )}
          </Pressable>
        ) : (
          <PrimaryButton
            label={
              isFull
                ? "Clase completa"
                : reserving
                  ? "Reservando"
                  : "Reservar clase"
            }
            icon={isFull ? "lock-outline" : "calendar-plus"}
            theme={theme}
            onPress={() => onReserve(selectedClass.id)}
            disabled={isFull}
            loading={reserving}
            style={styles.detailAction}
          />
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer theme={theme}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: secondaryColor }]}>
            Agenda
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Clases</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Elige día, revisa horarios y reserva en un toque.
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

      {loading && allClasses.length === 0 ? (
        <Card theme={theme} style={styles.loadingCard}>
          <ActivityIndicator size="small" color={primaryColor} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Cargando clases...
          </Text>
        </Card>
      ) : error && allClasses.length === 0 ? (
        <EmptyState
          icon="wifi-alert"
          title="No se pudieron cargar las clases"
          text={error}
          actionLabel="Reintentar"
          onAction={onRetry}
          theme={theme}
        />
      ) : allClasses.length === 0 ? (
        <EmptyState
          icon="calendar-search"
          title="No hay clases disponibles"
          text="Cuando el gimnasio publique clases activas, podrás verlas y reservar desde aquí."
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
                  { backgroundColor: theme.surface, borderColor: theme.border },
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
                  { backgroundColor: theme.surface, borderColor: theme.border },
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
            onSelect={onSelectDay}
          />

          {classTypes.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              <FilterChip
                label="Todas"
                active={!selectedClassType}
                theme={theme}
                onPress={() => onSelectClassType(null)}
              />
              {classTypes.map((classType) => (
                <FilterChip
                  key={classType}
                  label={classType}
                  active={selectedClassType === classType}
                  theme={theme}
                  onPress={() => onSelectClassType(classType)}
                />
              ))}
            </ScrollView>
          )}

          {!!confirmedReservation && renderFeedback("success")}
          {!!reservationError && renderFeedback("error")}

          <SectionHeader
            title={activeDateLabel}
            actionLabel={selectedClassType ? "Quitar filtro" : undefined}
            onAction={selectedClassType ? onClearClassType : undefined}
            theme={theme}
          />

          {classesThisWeek.length === 0 ? (
            <EmptyState
              icon="calendar-blank-outline"
              title="Sin clases esta semana"
              text="No hay sesiones publicadas para esta semana."
              theme={theme}
            />
          ) : classesSelectedDay.length === 0 ? (
            <EmptyState
              icon="calendar-blank-outline"
              title="Sin clases este día"
              text={
                selectedClassType
                  ? "No hay horarios de esta clase en el día seleccionado."
                  : "Selecciona otro día para revisar más horarios."
              }
              theme={theme}
            />
          ) : (
            <View style={styles.classList}>
              {classesSelectedDay.map((classItem) => {
                const status = getStatus(classItem);
                const availableSpaces = Math.max(
                  0,
                  getAvailableSpaces(classItem),
                );
                const isReserved = status.key === "RESERVADA";
                const isFull = status.key === "COMPLETA";
                const isFinished = status.key === "FINALIZADA";
                const reserving = reservingClassId === classItem.id;
                const duration = Number(classItem.duracionMinutos) || 45;
                const actionLabel = isReserved
                  ? "Ver"
                  : isFinished
                    ? "Finalizada"
                    : isFull
                      ? "Completa"
                      : reserving
                        ? "Reservando"
                        : "Reservar";

                return (
                  <Card
                    key={classItem.id}
                    theme={theme}
                    style={styles.agendaCard}
                    onPress={() => onSelectClass(classItem.id)}
                  >
                    <View style={styles.agendaHeader}>
                      <View
                        style={[
                          styles.timeBadge,
                          {
                            backgroundColor: colorConAlpha(primaryColor, "12"),
                          },
                        ]}
                      >
                        <Text
                          style={[styles.timeText, { color: primaryColor }]}
                        >
                          {obtenerHora(classItem.fechaHora)}
                        </Text>
                      </View>
                      <View style={styles.agendaCopy}>
                        <Text
                          style={[styles.className, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {classItem.nombre}
                        </Text>
                        <Text
                          style={[styles.classMetaLine, { color: theme.muted }]}
                          numberOfLines={1}
                        >
                          {duration} min ·{" "}
                          {classItem.nombreEntrenador ||
                            "Entrenador por asignar"}
                        </Text>
                      </View>
                      {renderStatus(classItem)}
                    </View>

                    <View style={styles.agendaFooter}>
                      <View style={styles.spaces}>
                        <MaterialCommunityIcons
                          name="account-group-outline"
                          size={17}
                          color={theme.muted}
                        />
                        <Text
                          style={[styles.spacesText, { color: theme.muted }]}
                        >
                          {isFull
                            ? "Sin plazas"
                            : `${availableSpaces} plazas disponibles`}
                        </Text>
                      </View>
                      <Pressable
                        style={[
                          styles.reserveButton,
                          { backgroundColor: primaryColor },
                          (isFull || reserving) && styles.reserveButtonDisabled,
                          isReserved && {
                            backgroundColor: colorConAlpha(primaryColor, "12"),
                          },
                        ]}
                        disabled={isFull || isFinished || reserving}
                        onPress={() =>
                          isReserved
                            ? onSelectClass(classItem.id)
                            : onReserve(classItem.id)
                        }
                      >
                        {reserving ? (
                          <ActivityIndicator
                            size="small"
                            color={textOnPrimaryColor}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.reserveButtonText,
                              {
                                color: isReserved
                                  ? primaryColor
                                  : textOnPrimaryColor,
                              },
                            ]}
                          >
                            {actionLabel}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </Card>
                );
              })}
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
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  weekCopy: { flex: 1, minWidth: 0 },
  weekLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  weekRange: { fontSize: 17, fontWeight: "900" },
  weekControls: { flexDirection: "row", gap: 8 },
  weekButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekButtonDisabled: { opacity: 0.42 },
  filterList: { gap: 10, paddingTop: 14, paddingRight: 20, paddingBottom: 2 },
  classList: { gap: 12 },
  agendaCard: { padding: 16, gap: 14 },
  agendaHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeBadge: {
    minWidth: 68,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: { fontSize: 19, fontWeight: "900" },
  agendaCopy: { flex: 1, minWidth: 0 },
  className: { fontSize: 18, fontWeight: "900", lineHeight: 23 },
  classMetaLine: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  statusPill: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  statusText: { fontSize: 11, fontWeight: "900" },
  agendaFooter: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  spaces: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  spacesText: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "800" },
  reserveButton: {
    minHeight: 42,
    minWidth: 96,
    borderRadius: 15,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  reserveButtonDisabled: { opacity: 0.5 },
  reserveButtonText: { fontSize: 13, fontWeight: "900" },
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
  detailHeroImage: { borderRadius: 28 },
  detailShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  detailHeroCopy: { gap: 6 },
  detailEyebrow: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
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
  infoItem: { width: "48%", minHeight: 116, padding: 14, gap: 6 },
  infoLabel: { fontSize: 12, fontWeight: "800" },
  infoValue: { fontSize: 15, fontWeight: "900", lineHeight: 20 },
  detailAction: { marginTop: 18 },
  cancelButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelButtonText: { fontSize: 15, fontWeight: "900" },
  feedback: {
    marginTop: 16,
    padding: 15,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  feedbackIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackCopy: { flex: 1, minWidth: 0, backgroundColor: "transparent" },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: "900",
    backgroundColor: "transparent",
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 3,
    backgroundColor: "transparent",
  },
});
