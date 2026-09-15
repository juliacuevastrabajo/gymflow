import type { ComponentProps, ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { resolverUrlMedia } from "../../services/gymflowService";
import { colorConAlpha, mezclarColores } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  ClassCard,
  DashboardHeroBackground,
  MetricCard,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import AdminDashboard from "./AdminDashboard";
import type { GymPreviewContext } from "./AdminGymSettings";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type PreviewClass = {
  id: number | string;
  imagenUrl?: string | null;
};

type Props = {
  context: GymPreviewContext;
  fallbackGymName: string;
  classes: PreviewClass[];
  dockHeight: number;
  dockBottomInset: number;
};

const ROLE_TABS: Record<GymPreviewContext["role"], readonly (readonly [IconName, string])[]> = {
  ADMIN: [
    ["home-outline", "Inicio"],
    ["view-grid-outline", "Gestión"],
    ["message-text-outline", "Mensajes"],
    ["cog-outline", "Ajustes"],
  ],
  ENTRENADOR: [
    ["home-outline", "Inicio"],
    ["calendar-clock", "Clases"],
    ["arm-flex-outline", "Rutinas"],
    ["message-text-outline", "Mensajes"],
    ["account-circle-outline", "Perfil"],
  ],
  CLIENTE: [
    ["home-outline", "Inicio"],
    ["calendar-star", "Clases"],
    ["clipboard-check-outline", "Reservas"],
    ["message-text-outline", "Mensajes"],
    ["account-circle-outline", "Perfil"],
  ],
};

function PreviewDockButton({
  icon,
  label,
  theme,
  active,
}: {
  icon: IconName;
  label: string;
  theme: GymFlowTheme;
  active: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.dockButton,
        active && {
          backgroundColor: colorConAlpha(theme.primary, "22"),
          borderTopColor: theme.primary,
        },
      ]}
      disabled
      accessibilityRole="button"
      accessibilityState={{ disabled: true, selected: active }}
      accessibilityLabel={label}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={active ? theme.primary : "#94A3B8"}
      />
      <Text style={[styles.dockText, active && { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

function PreviewBottomBar({
  role,
  theme,
  height,
  bottomInset,
}: {
  role: GymPreviewContext["role"];
  theme: GymFlowTheme;
  height: number;
  bottomInset: number;
}) {
  return (
    <View
      style={[
        styles.dock,
        {
          backgroundColor: mezclarColores(theme.secondary, "#10151D", 0.78),
          borderTopColor: colorConAlpha(theme.secondary, "42"),
          minHeight: height,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {ROLE_TABS[role].map(([icon, label], index) => (
        <PreviewDockButton
          key={label}
          icon={icon}
          label={label}
          theme={theme}
          active={index === 0}
        />
      ))}
    </View>
  );
}

function TrainerPreview({
  theme,
  backgroundUri,
  gymName,
  classImageUri,
}: {
  theme: GymFlowTheme;
  backgroundUri: string | null;
  gymName: string;
  classImageUri: string | null;
}) {
  return (
    <ScreenContainer theme={theme}>
      <DashboardHeroBackground imageUri={backgroundUri} theme={theme}>
        <View style={styles.homeHeader}>
          <View style={styles.homeHeaderCopy}>
            <Text style={[styles.homeEyebrow, { color: theme.secondary }]}>{gymName}</Text>
            <Text style={[styles.homeTitle, { color: theme.text }]}>Hola, Entrenador</Text>
            <Text style={[styles.homeSubtitle, { color: theme.muted }]}>
              Revisa tu agenda y prepara la siguiente clase.
            </Text>
          </View>
          <Avatar initials="EN" size={52} theme={theme} />
        </View>
      </DashboardHeroBackground>

      <ClassCard
        title="Movilidad y fuerza"
        subtitle="Sesión de ejemplo para comprobar la apariencia del panel."
        imageUri={classImageUri}
        eyebrow="Próxima clase"
        statusLabel="8 alumnos"
        meta={[
          { icon: "calendar-month-outline", label: "Hoy" },
          { icon: "clock-outline", label: "18:00" },
          { icon: "timer-outline", label: "45 min" },
        ]}
        actionLabel="Ver clase"
        onAction={() => undefined}
        theme={theme}
      />

      <View style={styles.trainerMetricsRow}>
        <MetricCard icon="calendar-today-outline" label="Clases hoy" value={3} theme={theme} />
        <MetricCard
          icon="arm-flex-outline"
          label="Rutinas"
          value={6}
          theme={theme}
          accent="secondary"
        />
        <MetricCard icon="message-text-outline" label="Mensajes nuevos" value={2} theme={theme} />
      </View>

      <SectionHeader title="Agenda de hoy" theme={theme} />
      <View style={styles.agendaList}>
        {[
          ["09:00", "Pilates", "6 alumnos · 45 min"],
          ["18:00", "Movilidad y fuerza", "8 alumnos · 45 min"],
        ].map(([time, title, meta]) => (
          <Card key={`${time}-${title}`} theme={theme} style={styles.agendaRow}>
            <Text style={[styles.agendaTime, { color: theme.primary }]}>{time}</Text>
            <View style={styles.agendaCopy}>
              <Text style={[styles.agendaTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.agendaMeta, { color: theme.muted }]}>{meta}</Text>
            </View>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

function ClientPreview({
  theme,
  backgroundUri,
  gymName,
  welcome,
  classImageUri,
}: {
  theme: GymFlowTheme;
  backgroundUri: string | null;
  gymName: string;
  welcome: string;
  classImageUri: string | null;
}) {
  return (
    <ScreenContainer theme={theme}>
      <DashboardHeroBackground imageUri={backgroundUri} theme={theme}>
        <View style={styles.homeHeader}>
          <View style={styles.homeHeaderCopy}>
            <Text style={[styles.homeEyebrow, { color: theme.secondary }]}>{gymName}</Text>
            <Text style={[styles.homeTitle, { color: theme.text }]}>Hola, Cliente</Text>
            <Text style={[styles.homeSubtitle, { color: theme.muted }]}>{welcome}</Text>
          </View>
          <Avatar initials="CL" size={52} theme={theme} />
        </View>
      </DashboardHeroBackground>

      <ClassCard
        title="Pilates"
        subtitle="Una sesión de ejemplo para mejorar movilidad, fuerza y bienestar."
        imageUri={classImageUri}
        eyebrow="Tu próxima reserva"
        statusLabel="Próxima clase"
        meta={[
          { icon: "calendar-month-outline", label: "Martes, 6 de agosto" },
          { icon: "clock-outline", label: "18:00" },
          { icon: "account-tie-outline", label: "Entrenador" },
        ]}
        actionLabel="Ver mi reserva"
        onAction={() => undefined}
        theme={theme}
      />

      <View style={styles.clientMetricsRow}>
        <MetricCard icon="bookmark-check-outline" label="Reservas activas" value={2} theme={theme} />
        <MetricCard
          icon="message-text-outline"
          label="Mensajes nuevos"
          value={1}
          theme={theme}
          accent="secondary"
        />
      </View>
      <View style={styles.clientMetricsRow}>
        <MetricCard icon="arm-flex-outline" label="Rutinas" value={2} theme={theme} />
        <MetricCard
          icon="receipt-text-outline"
          label="Pagos pendientes"
          value={0}
          theme={theme}
          accent="secondary"
        />
      </View>

      <SectionHeader title="Entrenamiento" theme={theme} />
      <Card theme={theme} style={styles.routineCard}>
        <View style={[styles.routineIcon, { backgroundColor: colorConAlpha(theme.primary, "14") }]}>
          <MaterialCommunityIcons name="arm-flex-outline" size={28} color={theme.primary} />
        </View>
        <View style={styles.routineCopy}>
          <Text style={[styles.routineTitle, { color: theme.text }]}>Rutina de ejemplo</Text>
          <Text style={[styles.routineText, { color: theme.muted }]}>
            Entrenamiento preparado para comprobar el estilo del panel.
          </Text>
        </View>
      </Card>
    </ScreenContainer>
  );
}

export default function GymDashboardPreview({
  context,
  fallbackGymName,
  classes,
  dockHeight,
  dockBottomInset,
}: Props) {
  const { role, draft, theme } = context;
  const backgroundUri = resolverUrlMedia(draft.imagenFondoUrl);
  const gymName = draft.nombre.trim() || fallbackGymName;
  const welcome = draft.textoBienvenida.trim() || "Gestiona tu gimnasio desde el móvil.";
  const classImageUri = [...classes]
    .sort((classA, classB) =>
      String(classA.id).localeCompare(String(classB.id), "es", { numeric: true }),
    )
    .map((item) => resolverUrlMedia(item.imagenUrl))
    .find((uri): uri is string => Boolean(uri)) ?? null;

  let content: ReactNode;

  if (role === "ADMIN") {
    content = (
      <AdminDashboard
        theme={theme}
        heroImageUri={backgroundUri}
        greeting="Buenos días"
        administratorName="Administrador"
        gymName={gymName}
        avatarUri={null}
        initials="AD"
        onAvatarPress={() => undefined}
        metrics={[
          { key: "classes", label: "Clases de hoy", value: 4, icon: "calendar-clock-outline", accent: "primary" },
          { key: "bookings", label: "Reservas de hoy", value: 8, icon: "bookmark-check-outline", accent: "secondary" },
          { key: "messages", label: "Mensajes sin leer", value: 2, icon: "message-badge-outline", accent: "primary" },
          { key: "payments", label: "Pagos pendientes", value: 3, icon: "receipt-clock-outline", accent: "secondary" },
        ]}
        quickActions={[
          { key: "create-class", title: "Crear clase", description: "Añade una clase y sus horarios", icon: "calendar-plus", accent: "primary", onPress: () => undefined },
          { key: "new-client", title: "Nuevo cliente", description: "Crea un acceso para un cliente", icon: "account-plus-outline", accent: "secondary", onPress: () => undefined },
          { key: "new-trainer", title: "Nuevo entrenador", description: "Incorpora a tu equipo", icon: "account-tie-hat-outline", accent: "primary", onPress: () => undefined },
          { key: "new-message", title: "Enviar comunicado", description: "Inicia un mensaje para tu comunidad", icon: "message-plus-outline", accent: "secondary", onPress: () => undefined },
        ]}
        priorities={[
          {
            key: "messages",
            title: "Mensajes sin leer",
            description: "2 mensajes requieren atención",
            icon: "message-badge-outline",
            onPress: () => undefined,
          },
          {
            key: "payments",
            title: "Pagos por revisar",
            description: "3 cobros pendientes o vencidos",
            icon: "receipt-clock-outline",
            onPress: () => undefined,
          },
        ]}
      />
    );
  } else if (role === "ENTRENADOR") {
    content = (
      <TrainerPreview
        theme={theme}
        backgroundUri={backgroundUri}
        gymName={gymName}
        classImageUri={classImageUri}
      />
    );
  } else {
    content = (
      <ClientPreview
        theme={theme}
        backgroundUri={backgroundUri}
        gymName={gymName}
        welcome={welcome}
        classImageUri={classImageUri}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        key={role}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: dockHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
      <PreviewBottomBar
        role={role}
        theme={theme}
        height={dockHeight}
        bottomInset={dockBottomInset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
  },
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  homeHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  homeEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  homeTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
  },
  homeSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 4,
  },
  trainerMetricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  clientMetricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  agendaList: {
    gap: 12,
  },
  agendaRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  agendaTime: {
    width: 50,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  agendaCopy: {
    flex: 1,
    minWidth: 0,
  },
  agendaTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  agendaMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  routineCard: {
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  routineIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  routineCopy: {
    flex: 1,
    minWidth: 0,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  routineText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 5,
  },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    borderTopWidth: 1,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  dockButton: {
    flex: 1,
    minHeight: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderTopWidth: 3,
    borderTopColor: "transparent",
  },
  dockText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
});
