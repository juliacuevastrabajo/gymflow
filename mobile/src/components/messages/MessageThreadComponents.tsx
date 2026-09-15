import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { mezclarColores } from "../../theme/colorUtils";
import { Avatar, Card, type GymFlowTheme } from "../GymFlowDesignSystem";

export function MessageBubble({
  author,
  text,
  date,
  isOwn,
  theme,
  primaryColor,
  textOnPrimary,
}: {
  author: string;
  text: string;
  date: string;
  isOwn: boolean;
  theme: GymFlowTheme;
  primaryColor: string;
  textOnPrimary: string;
}) {
  const contentColor = isOwn ? textOnPrimary : theme.text;

  return (
    <View style={[styles.bubbleWrap, isOwn && styles.bubbleWrapOwn]}>
      <View
        style={[
          styles.bubble,
          isOwn && styles.bubbleOwn,
          {
            backgroundColor: isOwn ? primaryColor : theme.surface,
            borderColor: isOwn ? primaryColor : theme.border,
          },
        ]}
      >
        <Text style={[styles.bubbleAuthor, { color: contentColor }]} numberOfLines={1}>
          {author}
        </Text>
        <Text style={[styles.bubbleText, { color: contentColor }]}>{text}</Text>
        <Text style={[styles.bubbleDate, { color: isOwn ? textOnPrimary : theme.muted }]}>
          {date}
        </Text>
      </View>
    </View>
  );
}

export type MessageReadRecipient = {
  id: number;
  name: string;
  roleLabel: string;
  avatarUri: string | null;
  initials: string;
  read: boolean;
};

export function MessageReadPanel({
  theme,
  secondaryColor,
  readCount,
  total,
  recipients,
}: {
  theme: GymFlowTheme;
  secondaryColor: string;
  readCount: number;
  total: number;
  recipients: MessageReadRecipient[];
}) {
  const percentage = Math.round(total > 0 ? (readCount / total) * 100 : 0);
  const progress = `${Math.min(total > 0 ? (readCount / total) * 100 : 0, 100)}%` as `${number}%`;

  return (
    <Card theme={theme} style={styles.readCard}>
      <View style={styles.readHeader}>
        <View>
          <Text style={[styles.readTitle, { color: theme.text }]}>Lecturas</Text>
          <Text style={[styles.readSubtitle, { color: theme.muted }]}>
            {readCount} de {total}
          </Text>
        </View>
        <View
          style={[
            styles.readBadge,
            { backgroundColor: mezclarColores(secondaryColor, theme.surface, 0.88) },
          ]}
        >
          <Text style={[styles.readBadgeText, { color: secondaryColor }]}>{percentage}%</Text>
        </View>
      </View>

      <View style={[styles.readTrack, { backgroundColor: theme.surfaceSoft }]}>
        <View
          style={[
            styles.readFill,
            { width: progress, backgroundColor: secondaryColor },
          ]}
        />
      </View>

      <View style={styles.readList}>
        {recipients.map((recipient) => (
          <View key={recipient.id} style={styles.readRow}>
            <Avatar
              uri={recipient.avatarUri}
              initials={recipient.initials}
              size={36}
              theme={theme}
            />
            <View style={styles.readUserCopy}>
              <Text style={[styles.readUserName, { color: theme.text }]} numberOfLines={1}>
                {recipient.name}
              </Text>
              <Text style={[styles.readUserRole, { color: theme.muted }]}>
                {recipient.roleLabel}
              </Text>
            </View>
            <View
              style={[
                styles.readStatus,
                {
                  backgroundColor: recipient.read
                    ? mezclarColores(secondaryColor, theme.surface, 0.88)
                    : mezclarColores(theme.muted, theme.surface, 0.9),
                },
              ]}
            >
              <Text
                style={[
                  styles.readStatusText,
                  { color: recipient.read ? secondaryColor : theme.muted },
                ]}
              >
                {recipient.read ? "Visto" : "Pendiente"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function MessageReplyComposer({
  value,
  theme,
  primaryColor,
  textOnPrimary,
  loading,
  canReply,
  onChangeText,
  onSend,
}: {
  value: string;
  theme: GymFlowTheme;
  primaryColor: string;
  textOnPrimary: string;
  loading: boolean;
  canReply: boolean;
  onChangeText: (text: string) => void;
  onSend: () => void;
}) {
  if (!canReply) {
    return (
      <Card theme={theme} style={styles.replyDisabledCard}>
        <MaterialCommunityIcons name="lock-outline" size={18} color={theme.muted} />
        <Text style={[styles.replyDisabledText, { color: theme.muted }]}>
          Este comunicado no admite respuesta directa.
        </Text>
      </Card>
    );
  }

  const disabled = !value.trim() || loading;

  return (
    <View
      style={[
        styles.replyBox,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Escribe una respuesta..."
        placeholderTextColor={theme.muted}
        style={[styles.replyInput, { color: theme.text }]}
        multiline
        textAlignVertical="top"
        autoCorrect
        blurOnSubmit={false}
      />
      <Pressable
        style={[
          styles.sendButton,
          { backgroundColor: primaryColor },
          disabled && styles.sendButtonDisabled,
        ]}
        disabled={disabled}
        onPress={onSend}
        accessibilityRole="button"
        accessibilityLabel="Enviar respuesta"
      >
        {loading ? (
          <ActivityIndicator size="small" color={textOnPrimary} />
        ) : (
          <MaterialCommunityIcons name="send" size={20} color={textOnPrimary} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrap: {
    width: "100%",
    alignItems: "flex-start",
  },
  bubbleWrapOwn: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "86%",
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleOwn: {
    minWidth: 76,
    paddingHorizontal: 18,
  },
  bubbleAuthor: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  bubbleDate: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 8,
    alignSelf: "flex-end",
  },
  readCard: {
    padding: 15,
    gap: 12,
    marginTop: 14,
  },
  readHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  readTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  readSubtitle: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  readBadge: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  readBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  readTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  readFill: {
    height: "100%",
    borderRadius: 999,
  },
  readList: {
    gap: 9,
  },
  readRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  readUserCopy: {
    flex: 1,
    minWidth: 0,
  },
  readUserName: {
    fontSize: 13,
    fontWeight: "900",
  },
  readUserRole: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  readStatus: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  readStatusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  replyBox: {
    borderWidth: 1,
    borderRadius: 24,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  replyInput: {
    flex: 1,
    minWidth: 0,
    maxHeight: 118,
    minHeight: 40,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.58,
  },
  replyDisabledCard: {
    marginTop: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  replyDisabledText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
});
