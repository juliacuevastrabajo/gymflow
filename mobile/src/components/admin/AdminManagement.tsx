import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Card,
  ScreenContainer,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import { AdminScreenHeader, withAlpha } from "./AdminClients";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type AdminManagementItem = {
  key: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  icon: IconName;
  onPress: () => void;
};

export type AdminManagementGroup = {
  key: string;
  title: string;
  items: AdminManagementItem[];
};

export default function AdminManagement({
  theme,
  adminAvatarUri,
  adminInitials,
  groups,
  onAdminAvatarPress,
}: {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  groups: AdminManagementGroup[];
  onAdminAvatarPress: () => void;
}) {
  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={adminAvatarUri}
        adminInitials={adminInitials}
        onAdminAvatarPress={onAdminAvatarPress}
        eyebrow="ADMINISTRACIÓN"
        title="Gestión"
        subtitle="Gestiona las áreas principales del gimnasio."
      />

      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={[styles.groupTitle, { color: theme.muted }]}>
              {group.title}
            </Text>
            <Card theme={theme} style={styles.groupCard}>
              {group.items.map((item, index) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && {
                      borderTopWidth: 1,
                      borderTopColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.countLabel}`}
                >
                  <View
                    style={[
                      styles.icon,
                      { backgroundColor: withAlpha(theme.primary, "14") },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.copy}>
                    <Text
                      style={[styles.title, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.description, { color: theme.muted }]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.count,
                      {
                        backgroundColor: theme.surfaceSoft,
                        borderColor: theme.border,
                      },
                    ]}
                    accessibilityElementsHidden
                  >
                    <Text style={[styles.countValue, { color: theme.text }]}>
                      {item.count}
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
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    minHeight: "100%",
  },
  groups: {
    marginTop: 17,
    gap: 20,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    marginLeft: 4,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
  groupCard: {
    overflow: "hidden",
  },
  row: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  description: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  count: {
    minWidth: 38,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  countValue: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.72,
  },
});
