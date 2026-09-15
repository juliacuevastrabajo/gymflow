import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import { colorConAlpha } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  ClassCard,
  DashboardHeroBackground,
  EmptyState,
  MetricCard,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type ClientDashboardNextClass = {
  title: string;
  subtitle: string;
  imageUri?: string | null;
  dateLabel: string;
  timeLabel: string;
  trainerName?: string | null;
};

export type ClientDashboardRoutine = {
  title: string;
  text: string;
  imageUri?: string | null;
  chips: string[];
  onPress?: () => void;
};

export default function ClientDashboard({
  theme,
  primaryColor,
  secondaryColor,
  backgroundUri,
  gymName,
  welcomeText,
  clientName,
  clientPhotoUri,
  clientInitials,
  nextClass,
  activeReservationsCount,
  unreadMessagesCount,
  routine,
  routinesCount,
  onOpenProfile,
  onOpenClasses,
  onOpenReservations,
  onOpenRoutines,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  backgroundUri?: string | null;
  gymName: string;
  welcomeText: string;
  clientName: string;
  clientPhotoUri?: string | null;
  clientInitials: string;
  nextClass?: ClientDashboardNextClass | null;
  activeReservationsCount: number;
  unreadMessagesCount: number;
  routine: ClientDashboardRoutine;
  routinesCount: number;
  onOpenProfile: () => void;
  onOpenClasses: () => void;
  onOpenReservations: () => void;
  onOpenRoutines: () => void;
}) {
  const classMeta = nextClass
    ? [
        {
          icon: "calendar-month-outline" as IconName,
          label: nextClass.dateLabel,
        },
        { icon: "clock-outline" as IconName, label: nextClass.timeLabel },
        ...(nextClass.trainerName
          ? [
              {
                icon: "account-tie-outline" as IconName,
                label: nextClass.trainerName,
              },
            ]
          : []),
      ]
    : [];

  return (
    <ScreenContainer theme={theme}>
      <DashboardHeroBackground imageUri={backgroundUri} theme={theme}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: secondaryColor }]}>
              {gymName}
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Hola, {clientName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {welcomeText}
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
      </DashboardHeroBackground>

      {nextClass ? (
        <>
          <ClassCard
            title={nextClass.title}
            subtitle={nextClass.subtitle}
            imageUri={nextClass.imageUri}
            eyebrow="Tu próxima reserva"
            statusLabel="Próxima clase"
            theme={theme}
            meta={classMeta}
            actionLabel="Ver mi reserva"
            onAction={onOpenReservations}
          />

          <View style={styles.actionRow}>
            <PrimaryButton
              label="Reservar clase"
              icon="calendar-plus"
              theme={theme}
              onPress={onOpenClasses}
              style={styles.mainButton}
            />
            <SecondaryButton
              label="Mi agenda"
              icon="clipboard-check-outline"
              theme={theme}
              onPress={onOpenReservations}
              style={styles.secondaryButton}
            />
          </View>
        </>
      ) : (
        <EmptyState
          icon="calendar-plus"
          title="Reserva tu próxima clase"
          text="Explora la agenda del gimnasio y elige el horario que mejor encaje contigo."
          actionLabel="Explorar clases"
          onAction={onOpenClasses}
          theme={theme}
        />
      )}

      <View style={styles.metricsRow}>
        <MetricCard
          icon="bookmark-check-outline"
          label="Reservas activas"
          value={activeReservationsCount}
          theme={theme}
        />
        <MetricCard
          icon="message-text-outline"
          label="Mensajes nuevos"
          value={unreadMessagesCount}
          theme={theme}
          accent="secondary"
        />
      </View>

      <SectionHeader
        title="Entrenamiento"
        actionLabel={routinesCount > 0 ? "Ver rutinas" : undefined}
        onAction={onOpenRoutines}
        theme={theme}
      />

      <Card theme={theme} style={styles.routineCard} onPress={routine.onPress}>
        {routine.imageUri ? (
          <Image
            source={{ uri: routine.imageUri }}
            style={styles.routineThumb}
          />
        ) : (
          <View
            style={[
              styles.routineIcon,
              { backgroundColor: colorConAlpha(primaryColor, "14") },
            ]}
          >
            <MaterialCommunityIcons
              name="arm-flex-outline"
              size={28}
              color={primaryColor}
            />
          </View>
        )}
        <View style={styles.routineCopy}>
          <Text style={[styles.routineTitle, { color: theme.text }]}>
            {routine.title}
          </Text>
          <Text style={[styles.routineText, { color: theme.muted }]}>
            {routine.text}
          </Text>
          {routine.chips.length > 0 && (
            <View style={styles.routineChips}>
              {routine.chips.map((chip, index) => {
                const chipColor =
                  index % 2 === 0 ? secondaryColor : primaryColor;

                return (
                  <View
                    key={chip}
                    style={[
                      styles.routineChip,
                      { backgroundColor: colorConAlpha(chipColor, "12") },
                    ]}
                  >
                    <Text
                      style={[styles.routineChipText, { color: chipColor }]}
                    >
                      {chip}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        {routinesCount > 0 && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.muted}
          />
        )}
      </Card>
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  mainButton: {
    flex: 1.25,
  },
  secondaryButton: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
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
  routineThumb: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
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
  routineChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  routineChip: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  routineChipText: {
    fontSize: 12,
    fontWeight: "900",
  },
});
