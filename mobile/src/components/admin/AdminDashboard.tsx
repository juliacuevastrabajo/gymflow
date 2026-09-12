import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Card,
  DashboardHeroBackground,
  MetricCard,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type AdminDashboardMetric = {
  key: string;
  label: string;
  value: number;
  icon: IconName;
  accent: "primary" | "secondary";
};

export type AdminDashboardAction = {
  key: string;
  title: string;
  description: string;
  icon: IconName;
  accent: "primary" | "secondary";
  onPress: () => void;
};

export type AdminDashboardPriority = {
  key: string;
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
};

function withAlpha(hex: string, alpha: string) {
  const safeHex = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#64748B";
  return `${safeHex}${alpha}`;
}

export default function AdminDashboard({
  theme,
  greeting,
  administratorName,
  gymName,
  avatarUri,
  initials,
  metrics,
  quickActions,
  priorities,
  onAvatarPress,
  heroImageUri,
}: {
  theme: GymFlowTheme;
  greeting: string;
  administratorName: string;
  gymName: string;
  avatarUri?: string | null;
  initials: string;
  metrics: AdminDashboardMetric[];
  quickActions: AdminDashboardAction[];
  priorities: AdminDashboardPriority[];
  onAvatarPress: () => void;
  heroImageUri?: string | null;
}) {
  const metricRows = [metrics.slice(0, 2), metrics.slice(2, 4)].filter(
    (row) => row.length > 0,
  );

  return (
    <ScreenContainer theme={theme}>
      <DashboardHeroBackground
        imageUri={heroImageUri}
        theme={theme}
        style={heroImageUri ? styles.heroWithImage : styles.heroWithoutImage}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.secondary }]}>CENTRO DE CONTROL</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              {greeting}, {administratorName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Administrador · {gymName}
            </Text>
          </View>
          <Avatar
            uri={avatarUri}
            initials={initials}
            size={58}
            theme={theme}
            onPress={onAvatarPress}
          />
        </View>
      </DashboardHeroBackground>

      <SectionHeader title="Hoy" theme={theme} style={styles.firstSectionHeader} />
      <View style={styles.metricGrid}>
        {metricRows.map((row, rowIndex) => (
          <View key={`metrics-${rowIndex}`} style={styles.metricRow}>
            {row.map((metric) => (
              <MetricCard
                key={metric.key}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                accent="primary"
                theme={theme}
              />
            ))}
          </View>
        ))}
      </View>

      <SectionHeader title="Acciones rápidas" theme={theme} />
      <View style={styles.quickGrid}>
        {quickActions.map((action) => {
          return (
            <Pressable
              key={action.key}
              style={({ pressed }) => [
                styles.quickAction,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
                pressed && styles.pressed,
              ]}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.title}
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: withAlpha(theme.primary, "14") },
                ]}
              >
                <MaterialCommunityIcons name={action.icon} size={22} color={theme.primary} />
              </View>
              <Text style={[styles.quickTitle, { color: theme.text }]} numberOfLines={1}>
                {action.title}
              </Text>
              <Text style={[styles.quickDescription, { color: theme.muted }]} numberOfLines={2}>
                {action.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {priorities.length > 0 && (
        <>
          <SectionHeader title="Prioridades" theme={theme} />
          <Card theme={theme} style={styles.priorityCard}>
            {priorities.map((priority, index) => (
              <Pressable
                key={priority.key}
                style={({ pressed }) => [
                  styles.priorityRow,
                  index > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
                onPress={priority.onPress}
                accessibilityRole="button"
                accessibilityLabel={priority.title}
              >
                <View
                  style={[
                    styles.priorityIcon,
                    { backgroundColor: withAlpha(theme.primary, "14") },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={priority.icon}
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.priorityCopy}>
                  <Text
                    style={[styles.priorityTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {priority.title}
                  </Text>
                  <Text
                    style={[styles.priorityDescription, { color: theme.muted }]}
                    numberOfLines={2}
                  >
                    {priority.description}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.muted}
                />
              </Pressable>
            ))}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroWithImage: {
    paddingBottom: 20,
  },
  heroWithoutImage: {
    paddingBottom: 8,
  },
  firstSectionHeader: {
    marginTop: 14,
  },
  header: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  metricGrid: {
    gap: 10,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickAction: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 142,
    minHeight: 126,
    borderWidth: 1,
    borderRadius: 24,
    padding: 15,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  quickDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 3,
  },
  priorityCard: {
    overflow: "hidden",
  },
  priorityRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  priorityIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityCopy: {
    flex: 1,
    minWidth: 0,
  },
  priorityTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  priorityDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  pressed: {
    opacity: 0.72,
  },
});
