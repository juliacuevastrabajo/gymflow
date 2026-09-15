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
  colorConAlpha,
  mezclarColores,
  obtenerColorContraste,
} from "../../theme/colorUtils";
import ConfirmationActionSheet from "../ConfirmationActionSheet";
import {
  Avatar,
  Card,
  ClassMediaPlaceholder,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type ClientReservation = {
  id: number;
  estado?: string | null;
};

export type ClientReservationData = {
  fechaHora?: string | null;
  timestamp: number;
  esHoy: boolean;
  nombre: string;
  descripcion: string;
  imagenUrl?: string | null;
  fecha: string;
  hora: string;
  duracion: string;
  entrenador: string;
  estado: string;
};

export type ClientReservationsMode = "PROXIMAS" | "HISTORIAL";

export default function ClientReservations({
  theme,
  primaryColor,
  secondaryColor,
  textOnPrimaryColor,
  clientPhotoUri,
  clientInitials,
  mode,
  upcomingReservations,
  historyReservations,
  cancelledReservation,
  reservationError,
  cancellingReservationId,
  pendingCancellation,
  nowTimestamp,
  bottomInset,
  getReservationData,
  onOpenProfile,
  onChangeMode,
  onExploreClasses,
  onRequestCancellation,
  onDismissCancellation,
  onConfirmCancellation,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  textOnPrimaryColor: string;
  clientPhotoUri?: string | null;
  clientInitials: string;
  mode: ClientReservationsMode;
  upcomingReservations: ClientReservation[];
  historyReservations: ClientReservation[];
  cancelledReservation?: ClientReservation | null;
  reservationError?: string | null;
  cancellingReservationId?: number | null;
  pendingCancellation?: ClientReservation | null;
  nowTimestamp: number;
  bottomInset: number;
  getReservationData: (reservation: ClientReservation) => ClientReservationData;
  onOpenProfile: () => void;
  onChangeMode: (mode: ClientReservationsMode) => void;
  onExploreClasses: () => void;
  onRequestCancellation: (reservation: ClientReservation) => void;
  onDismissCancellation: () => void;
  onConfirmCancellation: () => void;
}) {
  const getStatus = (reservation: ClientReservation) => {
    const data = getReservationData(reservation);
    const cancelled = data.estado === "CANCELADA";
    const past =
      data.estado === "RESERVADA" &&
      Boolean(data.timestamp) &&
      data.timestamp < nowTimestamp;

    if (cancelled) {
      return {
        label: "Cancelada",
        color: "#64748B",
        backgroundColor: "#F1F5F9",
        icon: "calendar-remove-outline" as IconName,
      };
    }

    if (past) {
      return {
        label: "Pasada",
        color: secondaryColor,
        backgroundColor: colorConAlpha(secondaryColor, "12"),
        icon: "history" as IconName,
      };
    }

    return {
      label: data.esHoy ? "Hoy" : data.estado,
      color: primaryColor,
      backgroundColor: colorConAlpha(primaryColor, "12"),
      icon: (data.esHoy
        ? "calendar-today"
        : "calendar-check-outline") as IconName,
    };
  };

  const renderStatus = (reservation: ClientReservation) => {
    const status = getStatus(reservation);

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

  const renderFeedback = (
    type: "success" | "error",
    reservation?: ClientReservation | null,
  ) => {
    const isError = type === "error";
    const color = isError ? "#DC2626" : secondaryColor;
    const backgroundColor = isError
      ? "#FEF2F2"
      : mezclarColores(secondaryColor, theme.background, 0.84);
    const borderColor = isError
      ? "#FECACA"
      : mezclarColores(secondaryColor, theme.background, 0.68);
    const data = reservation ? getReservationData(reservation) : null;
    const title = isError ? "No se pudo cancelar" : "Reserva cancelada";
    const text = isError
      ? reservationError
      : data
        ? `${data.nombre} ya no aparece en tus próximas reservas.`
        : "La reserva se ha cancelado correctamente.";

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

  const renderInfoLine = (icon: IconName, text: string) => (
    <View style={styles.infoLine}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.muted} />
      <Text style={[styles.infoText, { color: theme.muted }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );

  const renderHeroCard = (reservation: ClientReservation) => {
    const data = getReservationData(reservation);
    const cancelling = cancellingReservationId === reservation.id;

    return (
      <Card key={reservation.id} theme={theme} style={styles.heroCard}>
        {data.imagenUrl ? (
          <ImageBackground
            source={{ uri: data.imagenUrl }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <View style={styles.heroShade} />
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons
                name={data.esHoy ? "calendar-today" : "calendar-star"}
                size={15}
                color={textOnPrimaryColor}
              />
              <Text
                style={[styles.heroBadgeText, { color: textOnPrimaryColor }]}
              >
                {data.esHoy ? "Clase de hoy" : "Próxima reserva"}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={styles.heroImage}>
            <ClassMediaPlaceholder
              theme={theme}
              icon="calendar-check-outline"
              style={styles.heroPlaceholder}
            />
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons
                name={data.esHoy ? "calendar-today" : "calendar-star"}
                size={15}
                color={textOnPrimaryColor}
              />
              <Text
                style={[styles.heroBadgeText, { color: textOnPrimaryColor }]}
              >
                {data.esHoy ? "Clase de hoy" : "Próxima reserva"}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.heroBody}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={[styles.heroTitle, { color: theme.text }]}>
                {data.nombre}
              </Text>
              <Text style={[styles.heroMeta, { color: theme.muted }]}>
                {data.fecha} · {data.hora}
                {data.duracion ? ` · ${data.duracion}` : ""}
              </Text>
            </View>
            {renderStatus(reservation)}
          </View>

          {!!data.entrenador &&
            renderInfoLine("account-tie-outline", `Con ${data.entrenador}`)}

          <Pressable
            style={styles.subtleCancel}
            disabled={cancelling}
            onPress={() => onRequestCancellation(reservation)}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="calendar-remove-outline"
                  size={18}
                  color={primaryColor}
                />
                <Text
                  style={[styles.subtleCancelText, { color: primaryColor }]}
                >
                  Cancelar reserva
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderCompactCard = (reservation: ClientReservation) => {
    const data = getReservationData(reservation);
    const cancelling = cancellingReservationId === reservation.id;

    return (
      <Card key={reservation.id} theme={theme} style={styles.compactCard}>
        <View
          style={[
            styles.timeBox,
            {
              backgroundColor: data.esHoy
                ? colorConAlpha(primaryColor, "12")
                : colorConAlpha(secondaryColor, "10"),
            },
          ]}
        >
          <Text
            style={[
              styles.timeText,
              { color: data.esHoy ? primaryColor : secondaryColor },
            ]}
          >
            {data.hora}
          </Text>
        </View>

        <View style={styles.compactCopy}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.compactTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {data.nombre}
            </Text>
            {renderStatus(reservation)}
          </View>
          <Text
            style={[styles.compactMeta, { color: theme.muted }]}
            numberOfLines={2}
          >
            {data.fecha}
            {data.duracion ? ` · ${data.duracion}` : ""}
            {data.entrenador ? ` · ${data.entrenador}` : ""}
          </Text>
          <Pressable
            style={styles.inlineCancel}
            disabled={cancelling}
            onPress={() => onRequestCancellation(reservation)}
          >
            <Text style={[styles.inlineCancelText, { color: primaryColor }]}>
              {cancelling ? "Cancelando..." : "Cancelar"}
            </Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderHistoryCard = (reservation: ClientReservation) => {
    const data = getReservationData(reservation);

    return (
      <Card key={reservation.id} theme={theme} style={styles.historyCard}>
        <View style={styles.historyCopy}>
          <Text
            style={[styles.historyTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {data.nombre}
          </Text>
          <Text
            style={[styles.historyMeta, { color: theme.muted }]}
            numberOfLines={2}
          >
            {data.fecha} · {data.hora}
            {data.entrenador ? ` · ${data.entrenador}` : ""}
          </Text>
        </View>
        {renderStatus(reservation)}
      </Card>
    );
  };

  const shownReservations =
    mode === "PROXIMAS" ? upcomingReservations : historyReservations;
  const mainReservation = upcomingReservations[0];
  const secondaryReservations = upcomingReservations.slice(1);
  const pendingData = pendingCancellation
    ? getReservationData(pendingCancellation)
    : null;

  return (
    <ScreenContainer theme={theme}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: secondaryColor }]}>
            Reservas
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Mis reservas
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Consulta tus próximas clases y revisa tu historial.
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

      <View style={styles.tabs}>
        {[
          {
            key: "PROXIMAS" as const,
            label: "Próximas",
            count: upcomingReservations.length,
          },
          {
            key: "HISTORIAL" as const,
            label: "Historial",
            count: historyReservations.length,
          },
        ].map((tab) => {
          const active = mode === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? primaryColor : theme.surface,
                  borderColor: active ? primaryColor : theme.border,
                },
              ]}
              onPress={() => onChangeMode(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active
                      ? obtenerColorContraste(primaryColor)
                      : theme.muted,
                  },
                ]}
              >
                {tab.label} · {tab.count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!cancelledReservation &&
        renderFeedback("success", cancelledReservation)}
      {!!reservationError && renderFeedback("error")}

      {mode === "PROXIMAS" ? (
        upcomingReservations.length === 0 ? (
          <EmptyState
            icon="calendar-heart"
            title="Sin próximas reservas"
            text="Reserva una clase para verla aquí con fecha, hora y entrenador."
            actionLabel="Explorar clases"
            onAction={onExploreClasses}
            theme={theme}
          />
        ) : (
          <>
            {!!mainReservation && renderHeroCard(mainReservation)}
            {secondaryReservations.length > 0 && (
              <>
                <SectionHeader title="Siguientes" theme={theme} />
                <View style={styles.list}>
                  {secondaryReservations.map(renderCompactCard)}
                </View>
              </>
            )}
          </>
        )
      ) : shownReservations.length === 0 ? (
        <EmptyState
          icon="history"
          title="Sin historial"
          text="Las reservas pasadas o canceladas aparecerán aquí."
          theme={theme}
        />
      ) : (
        <View style={styles.list}>
          {shownReservations.map(renderHistoryCard)}
        </View>
      )}

      {!!pendingCancellation && !!pendingData && (
        <ConfirmationActionSheet
          visible
          icon="calendar-remove-outline"
          iconColor={primaryColor}
          iconBackgroundColor={colorConAlpha(primaryColor, "14")}
          title="Cancelar reserva"
          description={`Vas a cancelar ${pendingData.nombre} el ${pendingData.fecha} a las ${pendingData.hora}${
            pendingData.entrenador ? ` con ${pendingData.entrenador}` : ""
          }.`}
          primaryLabel="Mantener reserva"
          dangerLabel="Cancelar reserva"
          theme={theme}
          bottomInset={bottomInset}
          busy={cancellingReservationId === pendingCancellation.id}
          onDismiss={onDismissCancellation}
          onConfirm={onConfirmCancellation}
        />
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
  tabs: { flexDirection: "row", gap: 10, marginBottom: 16 },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tabText: { fontSize: 13, fontWeight: "900" },
  list: { gap: 12 },
  heroCard: { overflow: "hidden" },
  heroImage: { height: 176, padding: 16 },
  heroImageStyle: { borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  heroPlaceholder: { ...StyleSheet.absoluteFillObject, minHeight: 176 },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
  },
  heroBadge: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBadgeText: { fontSize: 12, fontWeight: "900" },
  heroBody: { padding: 18, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  titleCopy: { flex: 1, minWidth: 0 },
  heroTitle: { fontSize: 24, fontWeight: "900", lineHeight: 29 },
  heroMeta: { fontSize: 14, fontWeight: "800", lineHeight: 20, marginTop: 5 },
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
  infoLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "800" },
  subtleCancel: {
    alignSelf: "flex-start",
    minHeight: 38,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  subtleCancelText: { fontSize: 13, fontWeight: "900" },
  compactCard: { padding: 15, flexDirection: "row", gap: 13 },
  timeBox: {
    width: 72,
    minHeight: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: { fontSize: 19, fontWeight: "900" },
  compactCopy: { flex: 1, minWidth: 0, gap: 6 },
  compactTitle: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: "900" },
  compactMeta: { fontSize: 13, fontWeight: "800", lineHeight: 19 },
  inlineCancel: { alignSelf: "flex-start", paddingTop: 2 },
  inlineCancelText: { fontSize: 12, fontWeight: "900" },
  historyCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    opacity: 0.86,
  },
  historyCopy: { flex: 1, minWidth: 0 },
  historyTitle: { fontSize: 16, fontWeight: "900" },
  historyMeta: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 4,
  },
  feedback: {
    marginBottom: 16,
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
