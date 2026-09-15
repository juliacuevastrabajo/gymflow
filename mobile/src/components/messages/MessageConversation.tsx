import type { ComponentProps } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { mezclarColores } from "../../theme/colorUtils";
import { Avatar, Card, type GymFlowTheme } from "../GymFlowDesignSystem";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type MessageParticipant = {
  titulo: string;
  subtitulo: string;
  avatarUri: string | null;
  initials: string;
  icon: IconName;
  esComunicado: boolean;
};

export type MessagePriorityBadge = {
  background: string;
  color: string;
  icon: IconName;
  label: string;
};

export function obtenerNombreChatSinRol(name: string) {
  const cleanName = name
    .replace(
      /\s*(?:[·|-]\s*)?\(?(?:administraci[oó]n|administrador(?:a)?|admin|entrenador(?:a)?|cliente)\)?$/i,
      "",
    )
    .trim();

  return cleanName || name.trim();
}

export function MessageChatHeader({
  participant,
  subject,
  theme,
  secondaryColor,
  textColor,
  onBack,
}: {
  participant: MessageParticipant;
  subject: string;
  theme: GymFlowTheme;
  secondaryColor: string;
  textColor: string;
  onBack: () => void;
}) {
  const displayName = obtenerNombreChatSinRol(participant.titulo);
  const separatedRole =
    displayName && displayName !== participant.titulo.trim()
      ? participant.subtitulo
      : null;
  const context = separatedRole ? `${separatedRole} · ${subject}` : subject;
  const secondaryTextColor = mezclarColores(textColor, secondaryColor, 0.2);
  const controlSurface = mezclarColores(textColor, secondaryColor, 0.82);
  const avatarTheme: GymFlowTheme = {
    ...theme,
    primary: textColor,
    textOnPrimary: secondaryColor,
  };

  return (
    <View
      style={[
        styles.chatHeader,
        {
          backgroundColor: secondaryColor,
          borderBottomColor: mezclarColores(textColor, secondaryColor, 0.78),
        },
      ]}
    >
      <Pressable
        style={[styles.chatBackButton, { backgroundColor: controlSurface }]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Volver a mensajes"
        hitSlop={7}
      >
        <MaterialCommunityIcons name="arrow-left" size={23} color={textColor} />
      </Pressable>

      <Avatar
        uri={participant.avatarUri}
        initials={participant.initials}
        size={44}
        theme={avatarTheme}
      />

      <View style={styles.chatHeaderCopy}>
        <Text
          style={[styles.chatHeaderName, { color: textColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName || participant.titulo}
        </Text>
        <Text
          style={[styles.chatHeaderSubject, { color: secondaryTextColor }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {context}
        </Text>
      </View>
    </View>
  );
}

export function MessageConversationCard({
  theme,
  primaryColor,
  secondaryColor,
  participant,
  isOwn,
  unreadCount,
  total,
  date,
  subject,
  messagePreview,
  priority,
  readReceipt,
  onPress,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  participant: MessageParticipant;
  isOwn: boolean;
  unreadCount: number;
  total: number;
  date: string;
  subject: string;
  messagePreview: string;
  priority?: MessagePriorityBadge;
  readReceipt?: { read: number; total: number };
  onPress: () => void;
}) {
  const hasUnreadMessages = unreadCount > 0;
  const accentColor = participant.esComunicado ? secondaryColor : primaryColor;
  const preview = `${isOwn ? "Tú: " : ""}${messagePreview}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    <Card
      theme={theme}
      style={[
        styles.conversationCard,
        hasUnreadMessages && {
          borderColor: mezclarColores(primaryColor, theme.surface, 0.48),
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        {participant.avatarUri ? (
          <Avatar
            uri={participant.avatarUri}
            initials={participant.initials}
            size={48}
            theme={theme}
          />
        ) : (
          <View
            style={[
              styles.conversationIcon,
              { backgroundColor: mezclarColores(accentColor, theme.surface, 0.88) },
            ]}
          >
            <MaterialCommunityIcons name={participant.icon} size={23} color={accentColor} />
          </View>
        )}
        {hasUnreadMessages && (
          <View style={[styles.unreadDot, { backgroundColor: primaryColor }]} />
        )}
      </View>

      <View style={styles.conversationCopy}>
        <View style={styles.conversationTop}>
          <Text
            style={[
              styles.conversationName,
              { color: theme.text },
              hasUnreadMessages && styles.conversationNameUnread,
            ]}
            numberOfLines={1}
          >
            {participant.titulo}
          </Text>
          <Text style={[styles.conversationDate, { color: theme.muted }]} numberOfLines={1}>
            {date}
          </Text>
        </View>
        <Text style={[styles.conversationSubject, { color: theme.text }]} numberOfLines={1}>
          {subject}
        </Text>
        <Text style={[styles.conversationPreview, { color: theme.muted }]} numberOfLines={2}>
          {preview || "Sin contenido"}
        </Text>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: mezclarColores(accentColor, theme.surface, 0.9) },
            ]}
          >
            <Text style={[styles.badgeText, { color: accentColor }]}>
              {participant.subtitulo}
            </Text>
          </View>
          {total > 1 && (
            <Text style={[styles.conversationCount, { color: theme.muted }]}>
              {total} {total === 1 ? "mensaje" : "mensajes"}
            </Text>
          )}
          {priority && (
            <View style={[styles.badge, { backgroundColor: priority.background }]}>
              <MaterialCommunityIcons name={priority.icon} size={12} color={priority.color} />
              <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
            </View>
          )}
          {readReceipt && (
            <View style={styles.readReceipt}>
              <MaterialCommunityIcons
                name="eye-check-outline"
                size={13}
                color={secondaryColor}
              />
              <Text style={[styles.readReceiptText, { color: secondaryColor }]}>
                {readReceipt.read}/{readReceipt.total}{" "}
                {readReceipt.read === 1 ? "leído" : "leídos"}
              </Text>
            </View>
          )}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={21} color={theme.muted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  chatHeader: {
    minHeight: 58,
    marginHorizontal: -18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatBackButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chatHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  chatHeaderSubject: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  conversationCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  conversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    right: -1,
    top: -1,
    width: 11,
    height: 11,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  conversationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  conversationTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  conversationName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  conversationNameUnread: {
    fontWeight: "900",
  },
  conversationDate: {
    maxWidth: 82,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
  },
  conversationSubject: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  conversationPreview: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  badge: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  conversationCount: {
    fontSize: 11,
    fontWeight: "800",
  },
  readReceipt: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readReceiptText: {
    fontSize: 10,
    fontWeight: "900",
  },
});
