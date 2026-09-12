import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  crearInvitacionClienteApi,
  listarInvitacionesClienteApi,
  revocarInvitacionClienteApi,
  type ClientInvitation,
  type InvitationExpiry,
} from "../../services/gymflowService";
import {
  Card,
  EmptyState,
  FilterChip,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import { AdminScreenHeader, PersonStatusBadge, withAlpha } from "./AdminClients";

type AdminClientInvitationsProps = {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  onAdminAvatarPress: () => void;
  onBack: () => void;
};

const EXPIRIES: { value: InvitationExpiry; label: string }[] = [
  { value: "HORAS_24", label: "24 horas" },
  { value: "DIAS_7", label: "7 días" },
  { value: "DIAS_30", label: "30 días" },
];

function invitationLink(token?: string | null) {
  if (!token) {
    return null;
  }
  return Linking.createURL("invite", { queryParams: { token } });
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function InvitationCard({
  invitation,
  theme,
  onShowQr,
  onCopy,
  onShare,
  onRevoke,
}: {
  invitation: ClientInvitation;
  theme: GymFlowTheme;
  onShowQr: () => void;
  onCopy: () => void;
  onShare: () => void;
  onRevoke: () => void;
}) {
  const active = invitation.estado === "ACTIVA";
  const status =
    invitation.estado === "CADUCADA"
      ? "Caducada"
      : invitation.estado === "AGOTADA"
        ? "Agotada"
        : invitation.estado === "REVOCADA"
          ? "Revocada"
          : "Activa";
  const statusColor = active ? theme.secondary : theme.muted;

  return (
    <Card theme={theme} style={styles.invitationCard}>
      <View style={styles.cardTopRow}>
        <View style={[styles.invitationIcon, { backgroundColor: withAlpha(theme.primary, "12") }]}>
          <MaterialCommunityIcons name="qrcode" size={24} color={theme.primary} />
        </View>
        <View style={styles.cardTitleCopy}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Invitación de clientes</Text>
          <Text style={[styles.cardDate, { color: theme.muted }]}>
            Caduca el {formatDate(invitation.fechaExpiracion)}
          </Text>
        </View>
        <PersonStatusBadge label={status} color={statusColor} />
      </View>

      <View style={[styles.usagePanel, { backgroundColor: theme.surfaceSoft }]}>
        <View>
          <Text style={[styles.usageValue, { color: theme.text }]}>
            {invitation.usosConsumidos} de {invitation.limiteRegistros}
          </Text>
          <Text style={[styles.usageLabel, { color: theme.muted }]}>registros utilizados</Text>
        </View>
        <View style={styles.availableCopy}>
          <Text style={[styles.availableValue, { color: theme.secondary }]}>
            {invitation.usosDisponibles}
          </Text>
          <Text style={[styles.usageLabel, { color: theme.muted }]}>disponibles</Text>
        </View>
      </View>

      {active && (
        <View style={styles.cardActions}>
          <Pressable style={styles.iconAction} onPress={onShowQr} accessibilityLabel="Ver QR">
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={theme.primary} />
            <Text style={[styles.iconActionText, { color: theme.text }]}>QR</Text>
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onCopy} accessibilityLabel="Copiar enlace">
            <MaterialCommunityIcons name="content-copy" size={20} color={theme.primary} />
            <Text style={[styles.iconActionText, { color: theme.text }]}>Copiar</Text>
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onShare} accessibilityLabel="Compartir enlace">
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={theme.primary} />
            <Text style={[styles.iconActionText, { color: theme.text }]}>Compartir</Text>
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onRevoke} accessibilityLabel="Revocar invitación">
            <MaterialCommunityIcons name="link-off" size={20} color="#DC2626" />
            <Text style={[styles.iconActionText, { color: "#DC2626" }]}>Revocar</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

export default function AdminClientInvitations({
  theme,
  adminAvatarUri,
  adminInitials,
  onAdminAvatarPress,
  onBack,
}: AdminClientInvitationsProps) {
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<InvitationExpiry>("DIAS_7");
  const [limit, setLimit] = useState("10");
  const [tab, setTab] = useState<"ACTIVAS" | "FINALIZADAS">("ACTIVAS");
  const [qrInvitation, setQrInvitation] = useState<ClientInvitation | null>(null);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvitations(await listarInvitacionesClienteApi());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las invitaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleInvitations = useMemo(
    () => invitations.filter((item) =>
      tab === "ACTIVAS" ? item.estado === "ACTIVA" : item.estado !== "ACTIVA",
    ),
    [invitations, tab],
  );

  const createInvitation = async () => {
    if (savingRef.current) {
      return;
    }
    const numericLimit = Number(limit);
    if (!Number.isInteger(numericLimit) || numericLimit < 1 || numericLimit > 1000) {
      setError("El límite debe ser un número entre 1 y 1000.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const created = await crearInvitacionClienteApi({
        caducidad: expiry,
        limiteRegistros: numericLimit,
      });
      setInvitations((current) => [created, ...current]);
      setTab("ACTIVAS");
      setQrInvitation(created);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo crear la invitación.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const copyInvitation = async (invitation: ClientInvitation) => {
    try {
      const link = invitationLink(invitation.token);
      if (!link) {
        throw new Error("La invitación ya no dispone de un enlace activo.");
      }
      await Clipboard.setStringAsync(link);
      Alert.alert("Enlace copiado", "La invitación está lista para compartir.");
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "No se pudo copiar el enlace.");
    }
  };

  const shareInvitation = async (invitation: ClientInvitation) => {
    try {
      const link = invitationLink(invitation.token);
      if (!link) {
        throw new Error("La invitación ya no dispone de un enlace activo.");
      }
      await Share.share({
        title: `Invitación a ${invitation.nombreGimnasio}`,
        message: `Únete a ${invitation.nombreGimnasio} en GymFlow:\n${link}`,
      });
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "No se pudo compartir el enlace.");
    }
  };

  const revokeInvitation = (invitation: ClientInvitation) => {
    Alert.alert(
      "Revocar invitación",
      "El enlace y el QR dejarán de admitir nuevos registros. Los clientes ya registrados no se verán afectados.",
      [
        { text: "Conservar", style: "cancel" },
        {
          text: "Revocar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                const updated = await revocarInvitacionClienteApi(invitation.id);
                setInvitations((current) => current.map((item) =>
                  item.id === updated.id ? updated : item,
                ));
              } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "No se pudo revocar la invitación.");
              }
            })();
          },
        },
      ],
    );
  };

  const qrLink = qrInvitation ? invitationLink(qrInvitation.token) : null;

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={adminAvatarUri}
        adminInitials={adminInitials}
        onAdminAvatarPress={onAdminAvatarPress}
        onBack={onBack}
        eyebrow="PERSONAS"
        title="Invitar clientes"
        subtitle="Comparte un acceso seguro y controla cuántas altas admite."
      />

      <Card theme={theme} style={styles.createCard}>
        <View style={styles.createHeading}>
          <View style={[styles.invitationIcon, { backgroundColor: withAlpha(theme.primary, "12") }]}>
            <MaterialCommunityIcons name="link-plus" size={23} color={theme.primary} />
          </View>
          <View style={styles.cardTitleCopy}>
            <Text style={[styles.createTitle, { color: theme.text }]}>Nueva invitación</Text>
            <Text style={[styles.createSubtitle, { color: theme.muted }]}>Solo permitirá registrar clientes en tu gimnasio.</Text>
          </View>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text }]}>Caducidad</Text>
        <View style={styles.expiryRow}>
          {EXPIRIES.map((item) => (
            <FilterChip
              key={item.value}
              label={item.label}
              active={expiry === item.value}
              theme={theme}
              onPress={() => {
                if (!savingRef.current) {
                  setExpiry(item.value);
                }
              }}
              stableHeight
              disabled={saving}
            />
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text }]}>Máximo de registros</Text>
        <View style={[styles.limitInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="account-multiple-plus-outline" size={21} color={theme.secondary} />
          <TextInput
            value={limit}
            onChangeText={(value) => {
              if (!savingRef.current) {
                setLimit(value);
              }
            }}
            editable={!saving}
            keyboardType="number-pad"
            maxLength={4}
            style={[styles.limitText, { color: theme.text }]}
            accessibilityLabel="Máximo de registros"
          />
          <Text style={[styles.limitUnit, { color: theme.muted }]}>clientes</Text>
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={19} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PrimaryButton
          label="Generar invitación"
          icon="qrcode-plus"
          theme={theme}
          onPress={createInvitation}
          loading={saving}
          disabled={saving}
          style={styles.createButton}
        />
      </Card>

      <SectionHeader title="Tus invitaciones" theme={theme} />
      <View style={styles.tabs}>
        <FilterChip label="Activas" active={tab === "ACTIVAS"} theme={theme} onPress={() => setTab("ACTIVAS")} stableHeight />
        <FilterChip label="Finalizadas" active={tab === "FINALIZADAS"} theme={theme} onPress={() => setTab("FINALIZADAS")} stableHeight />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Cargando invitaciones...</Text>
        </View>
      ) : visibleInvitations.length === 0 ? (
        <EmptyState
          icon={tab === "ACTIVAS" ? "qrcode" : "history"}
          title={tab === "ACTIVAS" ? "No hay invitaciones activas" : "No hay invitaciones finalizadas"}
          text={tab === "ACTIVAS" ? "Genera una invitación para compartir el alta con tus clientes." : "Aquí aparecerán las invitaciones caducadas, agotadas o revocadas."}
          theme={theme}
        />
      ) : (
        <View style={styles.invitationList}>
          {visibleInvitations.map((invitation) => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              theme={theme}
              onShowQr={() => setQrInvitation(invitation)}
              onCopy={() => void copyInvitation(invitation)}
              onShare={() => void shareInvitation(invitation)}
              onRevoke={() => revokeInvitation(invitation)}
            />
          ))}
        </View>
      )}

      <Modal visible={Boolean(qrInvitation && qrLink)} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setQrInvitation(null)}>
        <SafeAreaView style={[styles.qrSafeArea, { backgroundColor: theme.background }]}>
          <View style={styles.qrHeader}>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setQrInvitation(null)} accessibilityLabel="Cerrar código QR">
              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.qrHeaderTitle, { color: theme.text }]}>Invitación GymFlow</Text>
            <View style={styles.closeButtonPlaceholder} />
          </View>
          <View style={styles.qrContent}>
            <Text style={[styles.qrEyebrow, { color: theme.secondary }]}>ALTA DE CLIENTES</Text>
            <Text style={[styles.qrTitle, { color: theme.text }]}>{qrInvitation?.nombreGimnasio}</Text>
            <Text style={[styles.qrSubtitle, { color: theme.muted }]}>Escanea este código desde GymFlow para unirte al gimnasio.</Text>
            {!!qrLink && (
              <View style={styles.qrSurface}>
                <QRCode value={qrLink} size={244} color={theme.text} backgroundColor="#FFFFFF" />
              </View>
            )}
            <View style={styles.qrMeta}>
              <Text style={[styles.qrMetaTitle, { color: theme.text }]}>{qrInvitation?.usosDisponibles} registros disponibles</Text>
              <Text style={[styles.qrMetaText, { color: theme.muted }]}>Caduca el {qrInvitation ? formatDate(qrInvitation.fechaExpiracion) : ""}</Text>
            </View>
          </View>
          <View style={styles.qrActions}>
            <PrimaryButton label="Compartir enlace" icon="share-variant-outline" theme={theme} onPress={() => qrInvitation && void shareInvitation(qrInvitation)} />
            <SecondaryButton label="Copiar enlace" icon="content-copy" theme={theme} onPress={() => qrInvitation && void copyInvitation(qrInvitation)} />
          </View>
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1 },
  createCard: { padding: 18, borderRadius: 24, marginTop: 14 },
  createHeading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  invitationIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitleCopy: { flex: 1, minWidth: 0 },
  createTitle: { fontSize: 18, lineHeight: 23, fontWeight: "900" },
  createSubtitle: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  fieldLabel: { marginBottom: 9, fontSize: 13, fontWeight: "900" },
  expiryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  limitInput: { minHeight: 52, borderRadius: 17, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  limitText: { flex: 1, minWidth: 0, paddingVertical: 0, fontSize: 16, fontWeight: "900" },
  limitUnit: { fontSize: 13, fontWeight: "800" },
  errorRow: { marginTop: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  errorText: { flex: 1, color: "#B91C1C", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  createButton: { marginTop: 16 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 12 },
  loadingState: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13, fontWeight: "800" },
  invitationList: { gap: 12 },
  invitationCard: { padding: 16, borderRadius: 23 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  cardTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  cardDate: { marginTop: 3, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  usagePanel: { marginTop: 14, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  usageValue: { fontSize: 17, fontWeight: "900" },
  usageLabel: { marginTop: 2, fontSize: 11, fontWeight: "800" },
  availableCopy: { alignItems: "flex-end" },
  availableValue: { fontSize: 20, fontWeight: "900" },
  cardActions: { marginTop: 12, flexDirection: "row", justifyContent: "space-between" },
  iconAction: { minWidth: 54, minHeight: 46, alignItems: "center", justifyContent: "center", gap: 3 },
  iconActionText: { fontSize: 10, fontWeight: "900" },
  qrSafeArea: { flex: 1 },
  qrHeader: { minHeight: 64, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  closeButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  closeButtonPlaceholder: { width: 44 },
  qrHeaderTitle: { fontSize: 16, fontWeight: "900" },
  qrContent: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  qrEyebrow: { fontSize: 11, fontWeight: "900" },
  qrTitle: { marginTop: 7, fontSize: 28, lineHeight: 34, fontWeight: "900", textAlign: "center" },
  qrSubtitle: { maxWidth: 320, marginTop: 8, fontSize: 14, lineHeight: 20, fontWeight: "700", textAlign: "center" },
  qrSurface: { marginTop: 26, padding: 18, borderRadius: 26, backgroundColor: "#FFFFFF" },
  qrMeta: { marginTop: 22, alignItems: "center" },
  qrMetaTitle: { fontSize: 15, fontWeight: "900" },
  qrMetaText: { marginTop: 4, fontSize: 12, fontWeight: "700" },
  qrActions: { paddingHorizontal: 20, paddingBottom: 14, gap: 9 },
});
