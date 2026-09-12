import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  formatCurrency,
  formatDate,
  paymentMethodLabel,
  sortPayments,
} from "../../features/payments/paymentUtils";
import { resolverUrlMedia, type Pago } from "../../services/gymflowService";
import {
  Avatar,
  Card,
  EmptyState,
  FilterChip,
  ScreenContainer,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import {
  DetailRow,
  DetailSection,
  PersonDetailHeader,
} from "../admin/AdminClients";
import { PaymentStatusBadge } from "../admin/AdminPayments";

type Props = {
  theme: GymFlowTheme;
  avatarUri?: string | null;
  initials: string;
  payments: Pago[];
  loading: boolean;
  error: string;
  onAvatarPress: () => void;
  onReload: () => Promise<void> | void;
  bottomPadding?: number;
};

type ViewMode = "PENDIENTES" | "HISTORIAL";

function ClientPaymentCard({
  payment,
  theme,
  onPress,
}: {
  payment: Pago;
  theme: GymFlowTheme;
  onPress: () => void;
}) {
  const paid = payment.estado === "PAGADO";
  return (
    <Card theme={theme} style={styles.paymentCard} onPress={onPress}>
      <View
        style={[
          styles.icon,
          { backgroundColor: `${theme.primary}14` },
        ]}
      >
        <MaterialCommunityIcons
          name={paid ? "check-circle-outline" : "receipt-text-clock-outline"}
          size={22}
          color={theme.primary}
        />
      </View>
      <View style={styles.cardCopy}>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
          {payment.concepto}
        </Text>
        <Text style={[styles.cardDate, { color: theme.muted }]}>
          {paid ? "Pagado" : "Vence"}: {formatDate(paid ? payment.fechaPago : payment.fechaVencimiento)}
        </Text>
        <PaymentStatusBadge status={payment.estado} theme={theme} />
      </View>
      <View style={styles.amountColumn}>
        <Text style={[styles.amount, { color: theme.text }]} numberOfLines={1}>
          {formatCurrency(payment.importe, payment.moneda)}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
      </View>
    </Card>
  );
}

export default function ClientPayments({
  theme,
  avatarUri,
  initials,
  payments,
  loading,
  error,
  onAvatarPress,
  onReload,
  bottomPadding = 28,
}: Props) {
  const [view, setView] = useState<ViewMode>("PENDIENTES");
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const hardwareBackHandlerRef = useRef<() => boolean>(() => false);
  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) || null;
  const pendingPayments = useMemo(
    () =>
      sortPayments(
        payments.filter(
          (payment) => payment.estado === "PENDIENTE" || payment.estado === "VENCIDO",
        ),
      ),
    [payments],
  );
  const historyPayments = useMemo(
    () =>
      sortPayments(
        payments.filter(
          (payment) => payment.estado === "PAGADO" || payment.estado === "CANCELADO",
        ),
      ),
    [payments],
  );
  const visiblePayments = view === "PENDIENTES" ? pendingPayments : historyPayments;
  const pendingAmount = pendingPayments.reduce(
    (total, payment) => total + Number(payment.importe || 0),
    0,
  );
  const nextDue = pendingPayments
    .filter((payment) => payment.fechaVencimiento)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))[0];

  const backToList = () => setSelectedPaymentId(null);

  useEffect(() => {
    hardwareBackHandlerRef.current = () => {
      if (selectedPaymentId !== null) {
        backToList();
        return true;
      }
      return false;
    };
  });

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => hardwareBackHandlerRef.current(),
    );
    return () => subscription.remove();
  }, []);

  const screen = (key: string, content: ReactNode) => (
    <ScrollView
      key={key}
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );

  if (selectedPayment) {
    return screen(`DETAIL:${selectedPayment.id}`, (
      <ScreenContainer theme={theme} style={styles.screen}>
        <PersonDetailHeader
          eyebrow="DETALLE DE COBRO"
          title="Pago"
          theme={theme}
          onBack={backToList}
          backAccessibilityLabel="Volver a mis pagos"
        />
        <Card theme={theme} style={styles.detailHero}>
          <PaymentStatusBadge status={selectedPayment.estado} theme={theme} />
          <Text style={[styles.detailConcept, { color: theme.text }]}>
            {selectedPayment.concepto}
          </Text>
          <Text style={[styles.detailAmount, { color: theme.primary }]}>
            {formatCurrency(selectedPayment.importe, selectedPayment.moneda)}
          </Text>
          {!!selectedPayment.descripcion && (
            <Text style={[styles.detailDescription, { color: theme.muted }]}>
              {selectedPayment.descripcion}
            </Text>
          )}
        </Card>
        <DetailSection title="Fechas" theme={theme}>
          <DetailRow icon="calendar-outline" title="Emisión" value={formatDate(selectedPayment.fechaEmision)} theme={theme} />
          <DetailRow icon="calendar-clock-outline" title="Vencimiento" value={formatDate(selectedPayment.fechaVencimiento)} theme={theme} last={!selectedPayment.fechaPago} />
          {!!selectedPayment.fechaPago && (
            <DetailRow icon="calendar-check-outline" title="Pago" value={formatDate(selectedPayment.fechaPago)} theme={theme} last />
          )}
        </DetailSection>
        {(selectedPayment.metodoPago || selectedPayment.referencia) && (
          <DetailSection title="Registro" theme={theme}>
            {!!selectedPayment.metodoPago && (
              <DetailRow icon="wallet-outline" title="Método" value={paymentMethodLabel(selectedPayment.metodoPago)} theme={theme} last={!selectedPayment.referencia} />
            )}
            {!!selectedPayment.referencia && (
              <DetailRow icon="identifier" title="Referencia" value={selectedPayment.referencia} theme={theme} last />
            )}
          </DetailSection>
        )}
      </ScreenContainer>
    ));
  }

  return screen("LIST", (
    <ScreenContainer theme={theme} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.secondary }]}>MI CUENTA</Text>
          <Text style={[styles.title, { color: theme.text }]}>Pagos</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Consulta tus cobros y pagos realizados.</Text>
        </View>
        <Avatar uri={resolverUrlMedia(avatarUri)} initials={initials} size={54} theme={theme} onPress={onAvatarPress} />
      </View>

      {!loading && !error && payments.length > 0 && (
        <View style={styles.summaryRow}>
          <Card theme={theme} style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>Total pendiente</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]} numberOfLines={1}>{formatCurrency(pendingAmount)}</Text>
          </Card>
          <Card theme={theme} style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>Próximo vencimiento</Text>
            <Text style={[styles.summaryDate, { color: theme.text }]} numberOfLines={2}>{nextDue ? formatDate(nextDue.fechaVencimiento) : "Sin cobros pendientes"}</Text>
          </Card>
        </View>
      )}

      {!loading && !error && payments.length > 0 && (
        <View style={styles.tabs}>
          <FilterChip label={`Pendientes ${pendingPayments.length}`} active={view === "PENDIENTES"} theme={theme} onPress={() => setView("PENDIENTES")} stableHeight />
          <FilterChip label={`Historial ${historyPayments.length}`} active={view === "HISTORIAL"} theme={theme} onPress={() => setView("HISTORIAL")} stableHeight />
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Cargando pagos...</Text>
        </View>
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="No se pudieron cargar tus pagos" text={error} actionLabel="Reintentar" onAction={onReload} theme={theme} />
      ) : payments.length === 0 ? (
        <EmptyState icon="receipt-text-outline" title="Todavía no tienes cobros registrados" text="Cuando el gimnasio registre un cobro, aparecerá aquí." theme={theme} />
      ) : visiblePayments.length === 0 ? (
        <EmptyState
          icon={view === "PENDIENTES" ? "check-circle-outline" : "history"}
          title={view === "PENDIENTES" ? "No tienes pagos pendientes" : "Sin historial"}
          text={view === "PENDIENTES" ? "Todos tus cobros están al día." : "Los pagos realizados o cancelados aparecerán aquí."}
          theme={theme}
        />
      ) : (
        <View style={styles.list}>
          {visiblePayments.map((payment) => (
            <ClientPaymentCard key={payment.id} payment={payment} theme={theme} onPress={() => setSelectedPaymentId(payment.id)} />
          ))}
        </View>
      )}
    </ScreenContainer>
  ));
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 16 },
  screen: { flexGrow: 1 },
  header: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: 16 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: "900", marginBottom: 5 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: "900" },
  subtitle: { maxWidth: 285, marginTop: 5, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  summaryCard: { flex: 1, minHeight: 98, padding: 14, justifyContent: "space-between", borderRadius: 21 },
  summaryLabel: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  summaryValue: { marginTop: 8, fontSize: 19, lineHeight: 24, fontWeight: "900" },
  summaryDate: { marginTop: 8, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, marginBottom: 12 },
  list: { gap: 10 },
  paymentCard: { minHeight: 112, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 22 },
  icon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardCopy: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: "900" },
  cardDate: { marginTop: 3, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  amountColumn: { alignSelf: "stretch", minWidth: 80, alignItems: "flex-end", justifyContent: "space-between" },
  amount: { maxWidth: 115, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  loading: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13, fontWeight: "700" },
  detailHero: { padding: 18, alignItems: "flex-start", borderRadius: 23 },
  detailConcept: { marginTop: 14, fontSize: 20, lineHeight: 26, fontWeight: "900" },
  detailAmount: { marginTop: 7, fontSize: 30, lineHeight: 36, fontWeight: "900" },
  detailDescription: { marginTop: 10, fontSize: 13, lineHeight: 19, fontWeight: "700" },
});
