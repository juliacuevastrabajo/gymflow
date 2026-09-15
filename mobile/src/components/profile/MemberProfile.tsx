import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colorConAlpha } from "../../theme/colorUtils";
import ConfirmationActionSheet from "../ConfirmationActionSheet";
import {
  Card,
  ScreenContainer,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type MemberProfileRow = {
  icon: IconName;
  title: string;
  description?: string;
  onPress?: () => void;
  badgeCount?: number;
  danger?: boolean;
  loading?: boolean;
};

export type MemberProfileSection = {
  title: string;
  rows: MemberProfileRow[];
};

export default function MemberProfile({
  theme,
  primaryColor,
  secondaryColor,
  textOnPrimaryColor,
  subtitle,
  name,
  email,
  roleLabel,
  photoUri,
  initials,
  canEditPhoto,
  uploadingPhoto,
  identityIcon,
  sections,
  logoutVisible,
  bottomInset,
  onEditPhoto,
  onDismissLogout,
  onConfirmLogout,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  textOnPrimaryColor: string;
  subtitle: string;
  name: string;
  email?: string | null;
  roleLabel?: string;
  photoUri?: string | null;
  initials: string;
  canEditPhoto: boolean;
  uploadingPhoto: boolean;
  identityIcon: IconName;
  sections: MemberProfileSection[];
  logoutVisible: boolean;
  bottomInset: number;
  onEditPhoto: () => void;
  onDismissLogout: () => void;
  onConfirmLogout: () => void;
}) {
  const avatar = (
    <>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.avatarImage} />
      ) : (
        <Text style={[styles.avatarText, { color: primaryColor }]}>
          {initials}
        </Text>
      )}
      {canEditPhoto && (
        <View style={[styles.cameraBadge, { backgroundColor: primaryColor }]}>
          {uploadingPhoto ? (
            <ActivityIndicator size="small" color={textOnPrimaryColor} />
          ) : (
            <MaterialCommunityIcons
              name="camera-outline"
              size={15}
              color={textOnPrimaryColor}
            />
          )}
        </View>
      )}
    </>
  );

  return (
    <ScreenContainer theme={theme}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: secondaryColor }]}>
            Mi cuenta
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Perfil</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {subtitle}
          </Text>
        </View>

        {canEditPhoto ? (
          <Pressable
            style={[
              styles.headerAvatar,
              { backgroundColor: colorConAlpha(primaryColor, "14") },
            ]}
            onPress={onEditPhoto}
            accessibilityRole="button"
            accessibilityLabel="Editar foto de perfil"
          >
            {avatar}
          </Pressable>
        ) : (
          <View
            style={[
              styles.headerAvatar,
              { backgroundColor: colorConAlpha(primaryColor, "14") },
            ]}
          >
            {avatar}
          </View>
        )}
      </View>

      <Card theme={theme} style={styles.identityCard}>
        <View
          style={[
            styles.identityIcon,
            { backgroundColor: colorConAlpha(primaryColor, "12") },
          ]}
        >
          <MaterialCommunityIcons
            name={identityIcon}
            size={25}
            color={primaryColor}
          />
        </View>

        <View style={styles.identityCopy}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {name}
          </Text>
          {(roleLabel || email) && (
            <Text
              style={[styles.email, { color: theme.muted }]}
              numberOfLines={1}
            >
              {!!roleLabel && (
                <Text style={{ color: secondaryColor }}>{roleLabel}</Text>
              )}
              {roleLabel && email ? " · " : ""}
              {email || ""}
            </Text>
          )}
        </View>
      </Card>

      {sections.map((section) => (
        <View key={section.title} style={styles.group}>
          <Text style={[styles.groupTitle, { color: theme.text }]}>
            {section.title}
          </Text>
          <Card theme={theme} style={styles.groupCard}>
            {section.rows.map((row, index) => (
              <ProfileRow
                key={`${section.title}-${row.title}-${index}`}
                {...row}
                theme={theme}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                textOnPrimaryColor={textOnPrimaryColor}
              />
            ))}
          </Card>
        </View>
      ))}

      <ConfirmationActionSheet
        visible={logoutVisible}
        icon="logout"
        iconColor="#DC2626"
        iconBackgroundColor="#FEF2F2"
        title="Cerrar sesión"
        description="Saldrás de GymFlow en este dispositivo. Podrás volver a entrar con tu email y contraseña."
        primaryLabel="Mantener sesión"
        dangerLabel="Cerrar sesión"
        theme={theme}
        bottomInset={bottomInset}
        onDismiss={onDismissLogout}
        onConfirm={onConfirmLogout}
      />
    </ScreenContainer>
  );
}

function ProfileRow({
  icon,
  title,
  description,
  onPress,
  badgeCount = 0,
  danger = false,
  loading = false,
  theme,
  primaryColor,
  secondaryColor,
  textOnPrimaryColor,
}: MemberProfileRow & {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  textOnPrimaryColor: string;
}) {
  const color = danger ? "#DC2626" : secondaryColor;
  const content = (
    <View style={styles.row}>
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: danger
              ? "#FEF2F2"
              : colorConAlpha(secondaryColor, "12"),
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        )}
      </View>
      <View style={styles.rowCopy}>
        <Text
          style={[styles.rowTitle, { color: danger ? "#DC2626" : theme.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!description && (
          <Text
            style={[styles.rowDescription, { color: theme.muted }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}
      </View>
      {badgeCount > 0 && (
        <View style={[styles.rowBadge, { backgroundColor: primaryColor }]}>
          <Text style={[styles.rowBadgeText, { color: textOnPrimaryColor }]}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
      {!!onPress && !danger && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.muted}
        />
      )}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
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
  headerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "900",
  },
  cameraBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  identityCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  identityIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  email: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  group: {
    marginTop: 22,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },
  groupCard: {
    paddingVertical: 4,
    overflow: "hidden",
  },
  row: {
    minHeight: 70,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
  },
  rowDescription: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  rowBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
});
