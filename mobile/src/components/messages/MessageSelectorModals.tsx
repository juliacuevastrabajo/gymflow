import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colorConAlpha, mezclarColores } from "../../theme/colorUtils";
import {
  Avatar,
  FilterChip,
  PrimaryButton,
  SecondaryButton,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

export type MessageRecipientFilter = "TODOS" | "CLIENTES" | "ENTRENADORES";

export type MessageRecipient = {
  id: number;
  rol: "CLIENTE" | "ENTRENADOR";
  nombre: string;
  email?: string | null;
  fotoPerfilUrl?: string | null;
};

function getInitials(name?: string) {
  const initials = (name || "GymFlow")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "GF";
}

function pluralize(quantity: number, singular: string, plural: string) {
  return `${quantity} ${quantity === 1 ? singular : plural}`;
}

export function MessageRecipientSelectorModal({
  visible,
  hasSearch,
  searchValue,
  filter,
  filteredRecipients,
  visibleRecipients,
  selectedRecipientId,
  keyboardVisible,
  windowHeight,
  topInset,
  bottomInset,
  theme,
  primaryColor,
  secondaryColor,
  resolvePhotoUri,
  onChangeSearch,
  onChangeFilter,
  onSelectRecipient,
  onClose,
}: {
  visible: boolean;
  hasSearch: boolean;
  searchValue: string;
  filter: MessageRecipientFilter;
  filteredRecipients: MessageRecipient[];
  visibleRecipients: MessageRecipient[];
  selectedRecipientId?: number | null;
  keyboardVisible: boolean;
  windowHeight: number;
  topInset: number;
  bottomInset: number;
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  resolvePhotoUri: (url?: string | null) => string | null;
  onChangeSearch: (value: string) => void;
  onChangeFilter: (filter: MessageRecipientFilter) => void;
  onSelectRecipient: (id: number) => void;
  onClose: () => void;
}) {
  const hasTruncatedResults =
    filteredRecipients.length > visibleRecipients.length;
  const resultMeta = hasTruncatedResults
    ? `Mostrando ${visibleRecipients.length} de ${filteredRecipients.length}`
    : pluralize(
        filteredRecipients.length,
        "persona encontrada",
        "personas encontradas",
      );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar selector"
        />
        <View
          style={[
            styles.personSheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: keyboardVisible
                ? 12
                : Math.max(Math.min(bottomInset, 18), 12),
              maxHeight: Math.min(
                windowHeight -
                  Math.max(topInset, 18) -
                  (keyboardVisible ? 16 : 28),
                keyboardVisible ? 560 : 660,
              ),
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetCopy}>
              <Text style={[styles.eyebrow, { color: secondaryColor }]}>
                Destinatario
              </Text>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                Seleccionar persona
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.muted }]}>
                Busca por nombre o email sin perder el mensaje que ya estabas
                preparando.
              </Text>
            </View>
            <Pressable
              style={[
                styles.sheetClose,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                },
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <MaterialCommunityIcons
                name="close"
                size={21}
                color={theme.text}
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={theme.muted}
            />
            <TextInput
              value={searchValue}
              onChangeText={onChangeSearch}
              placeholder="Buscar persona..."
              placeholderTextColor={theme.muted}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
            />
            {hasSearch && (
              <Pressable
                style={styles.searchClear}
                onPress={() => onChangeSearch("")}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={theme.muted}
                />
              </Pressable>
            )}
          </View>

          <View style={styles.filterRow}>
            {(
              [
                { value: "TODOS", label: "Todos" },
                { value: "CLIENTES", label: "Clientes" },
                { value: "ENTRENADORES", label: "Entrenadores" },
              ] as const
            ).map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                active={filter === option.value}
                theme={theme}
                onPress={() => onChangeFilter(option.value)}
              />
            ))}
          </View>

          <Text style={[styles.resultsMeta, { color: theme.muted }]}>
            {resultMeta}
          </Text>

          {filteredRecipients.length === 0 ? (
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account-search-outline"
                size={26}
                color={theme.muted}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Sin resultados
              </Text>
              <Text style={[styles.emptyText, { color: theme.muted }]}>
                Prueba con otro nombre, email o filtro.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={[
                styles.resultList,
                {
                  maxHeight: keyboardVisible
                    ? Math.min(windowHeight * 0.24, 220)
                    : Math.min(windowHeight * 0.38, 340),
                },
              ]}
              contentContainerStyle={styles.resultListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {visibleRecipients.map((recipient) => {
                const selected = recipient.id === selectedRecipientId;
                const roleLabel =
                  recipient.rol === "CLIENTE" ? "Cliente" : "Entrenador";

                return (
                  <Pressable
                    key={`${recipient.rol}-${recipient.id}`}
                    style={[
                      styles.personRow,
                      {
                        backgroundColor: selected
                          ? mezclarColores(primaryColor, theme.surface, 0.92)
                          : theme.surface,
                        borderColor: selected
                          ? colorConAlpha(primaryColor, "42")
                          : theme.border,
                      },
                    ]}
                    onPress={() => onSelectRecipient(recipient.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar ${recipient.nombre}`}
                  >
                    <Avatar
                      uri={resolvePhotoUri(recipient.fotoPerfilUrl)}
                      initials={getInitials(recipient.nombre)}
                      size={42}
                      theme={theme}
                    />
                    <View style={styles.personRowCopy}>
                      <Text
                        style={[styles.recipientName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {recipient.nombre}
                      </Text>
                      <Text
                        style={[
                          styles.recipientRole,
                          { color: secondaryColor },
                        ]}
                        numberOfLines={1}
                      >
                        {roleLabel}
                      </Text>
                      {!!recipient.email && (
                        <Text
                          style={[
                            styles.personRowEmail,
                            { color: theme.muted },
                          ]}
                          numberOfLines={1}
                        >
                          {recipient.email}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name={selected ? "check-circle" : "chevron-right"}
                      size={22}
                      color={selected ? primaryColor : theme.muted}
                    />
                  </Pressable>
                );
              })}
              {hasTruncatedResults && (
                <Text style={[styles.moreHint, { color: theme.muted }]}>
                  Hay más resultados. Usa la búsqueda para afinar.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function MessageDateSelectorModal({
  visible,
  dateValue,
  timeValue,
  error,
  keyboardVisible,
  bottomInset,
  theme,
  secondaryColor,
  onChangeDate,
  onChangeTime,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  dateValue: string;
  timeValue: string;
  error?: string | null;
  keyboardVisible: boolean;
  bottomInset: number;
  theme: GymFlowTheme;
  secondaryColor: string;
  onChangeDate: (value: string) => void;
  onChangeTime: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancelar selección de fecha"
        />
        <View
          style={[
            styles.dateSheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: keyboardVisible
                ? 12
                : Math.max(Math.min(bottomInset, 18), 12),
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetCopy}>
              <Text style={[styles.eyebrow, { color: secondaryColor }]}>
                Entrega
              </Text>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                Fecha y hora
              </Text>
              <Text style={[styles.sheetSubtitle, { color: theme.muted }]}>
                Elige cuándo se enviará el mensaje.
              </Text>
            </View>
            <Pressable
              style={[
                styles.sheetClose,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: theme.border,
                },
              ]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <MaterialCommunityIcons
                name="close"
                size={21}
                color={theme.text}
              />
            </Pressable>
          </View>

          <View style={styles.dateInputsRow}>
            <View style={styles.dateInputGroup}>
              <Text style={[styles.dateInputLabel, { color: theme.muted }]}>
                Día
              </Text>
              <View
                style={[
                  styles.dateInputShell,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={19}
                  color={secondaryColor}
                />
                <TextInput
                  value={dateValue}
                  onChangeText={onChangeDate}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={theme.muted}
                  style={[styles.dateTextInput, { color: theme.text }]}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.dateInputGroup}>
              <Text style={[styles.dateInputLabel, { color: theme.muted }]}>
                Hora
              </Text>
              <View
                style={[
                  styles.dateInputShell,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={19}
                  color={secondaryColor}
                />
                <TextInput
                  value={timeValue}
                  onChangeText={onChangeTime}
                  placeholder="HH:mm"
                  placeholderTextColor={theme.muted}
                  style={[styles.dateTextInput, { color: theme.text }]}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  onSubmitEditing={onConfirm}
                />
              </View>
            </View>
          </View>

          {!!error && (
            <View
              style={[
                styles.dateError,
                {
                  backgroundColor: "#FEF2F2",
                  borderColor: "#FECACA",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color="#DC2626"
              />
              <Text style={[styles.dateErrorText, { color: "#DC2626" }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.dateModalActions}>
            <SecondaryButton
              label="Cancelar"
              theme={theme}
              onPress={onCancel}
              style={styles.dateModalButton}
            />
            <PrimaryButton
              label="Confirmar"
              icon="check"
              theme={theme}
              onPress={onConfirm}
              style={styles.dateModalButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  personSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 13,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sheetCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  sheetClose: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    minHeight: 54,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  searchClear: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  resultsMeta: {
    fontSize: 12,
    fontWeight: "900",
  },
  resultList: {
    flexGrow: 0,
  },
  resultListContent: {
    gap: 9,
    paddingBottom: 4,
  },
  personRow: {
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  personRowCopy: {
    flex: 1,
    minWidth: 0,
  },
  recipientName: {
    fontSize: 13,
    fontWeight: "900",
  },
  recipientRole: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  personRowEmail: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  empty: {
    minHeight: 132,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  moreHint: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  dateSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInputGroup: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  dateInputLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dateInputShell: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateTextInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "900",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  dateError: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dateErrorText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  dateModalActions: {
    flexDirection: "row",
    gap: 10,
  },
  dateModalButton: {
    flex: 1,
  },
});
