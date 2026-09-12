import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
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
import { SafeAreaView } from "react-native-safe-area-context";

import {
  actualizarPagoApi,
  cancelarPagoApi,
  crearPagoApi,
  marcarPagoComoPagadoApi,
  resolverUrlMedia,
  type MetodoPago,
  type Pago,
} from "../../services/gymflowService";
import {
  displayDateToIso,
  formatCurrency,
  formatDate,
  isoToDisplayDate,
  maskDisplayDate,
  normalizeAmountInput,
  paymentMethodLabel,
  paymentStatusLabel,
  sortPayments,
} from "../../features/payments/paymentUtils";
import {
  Avatar,
  Card,
  EmptyState,
  FilterChip,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";
import {
  AdminScreenHeader,
  DetailRow,
  DetailSection,
  PersonDetailHeader,
  SearchInput,
  getInitials,
  normalizeSearch,
  withAlpha,
} from "./AdminClients";

type AdminPaymentFilter =
  | "PENDIENTE"
  | "VENCIDO"
  | "PAGADO"
  | "CANCELADO"
  | "TODOS";

type PaymentMode = "LIST" | "DETAIL" | "FORM" | "MARK_PAID";
type SectionExitGuard = (onConfirm: () => void) => void;

type PaymentClient = {
  id: number;
  nombre?: string | null;
  email?: string | null;
  fotoPerfilUrl?: string | null;
  activo?: boolean;
};

type Props = {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  clients: PaymentClient[];
  payments: Pago[];
  loading: boolean;
  error: string;
  onAdminAvatarPress: () => void;
  onReload: () => Promise<void> | void;
  onPaymentsChange: (payments: Pago[]) => void;
  onRegisterExitGuard?: (guard: SectionExitGuard | null) => void;
  onRootBack?: () => void;
  bottomPadding?: number;
};

const FILTERS: { value: AdminPaymentFilter; label: string }[] = [
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "VENCIDO", label: "Vencidos" },
  { value: "PAGADO", label: "Pagados" },
  { value: "CANCELADO", label: "Cancelados" },
  { value: "TODOS", label: "Todos" },
];

const METHODS: { value: MetodoPago; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "DOMICILIACION", label: "Domiciliación" },
  { value: "OTRO", label: "Otro" },
];

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusColor(status: Pago["estado"], theme: GymFlowTheme) {
  if (status === "PAGADO") return "#16803C";
  if (status === "VENCIDO") return "#C2413B";
  if (status === "CANCELADO") return theme.muted;
  return "#B45309";
}

export function PaymentStatusBadge({
  status,
  theme,
}: {
  status: Pago["estado"];
  theme: GymFlowTheme;
}) {
  const color = statusColor(status, theme);
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: withAlpha(color, "12"), borderColor: withAlpha(color, "30") },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{paymentStatusLabel(status)}</Text>
    </View>
  );
}

function PaymentCard({
  payment,
  theme,
  onPress,
}: {
  payment: Pago;
  theme: GymFlowTheme;
  onPress: () => void;
}) {
  const dateLabel = payment.estado === "PAGADO" ? "Pagado" : "Vence";
  const dateValue = payment.estado === "PAGADO" ? payment.fechaPago : payment.fechaVencimiento;

  return (
    <Card theme={theme} style={styles.paymentCard} onPress={onPress}>
      <Avatar
        uri={resolverUrlMedia(payment.fotoClienteUrl)}
        initials={getInitials(payment.nombreCliente, "Cliente")}
        size={50}
        theme={theme}
      />
      <View style={styles.paymentCopy}>
        <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={1}>
          {payment.nombreCliente || "Cliente"}
        </Text>
        <Text style={[styles.concept, { color: theme.muted }]} numberOfLines={1}>
          {payment.concepto}
        </Text>
        <Text style={[styles.date, { color: theme.muted }]}>
          {dateLabel}: {formatDate(dateValue)}
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

function Field({
  label,
  value,
  onChangeText,
  theme,
  placeholder,
  error,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: GymFlowTheme;
  placeholder: string;
  error?: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.field,
          multiline && styles.textArea,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: error ? "#C2413B" : theme.border,
          },
        ]}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function AdminPayments({
  theme,
  adminAvatarUri,
  adminInitials,
  clients,
  payments,
  loading,
  error,
  onAdminAvatarPress,
  onReload,
  onPaymentsChange,
  onRegisterExitGuard,
  onRootBack,
  bottomPadding = 28,
}: Props) {
  const [mode, setMode] = useState<PaymentMode>("LIST");
  const [filter, setFilter] = useState<AdminPaymentFilter>("PENDIENTE");
  const [search, setSearch] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [formClientId, setFormClientId] = useState<number | null>(null);
  const [formConcept, setFormConcept] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInitialSnapshot, setFormInitialSnapshot] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [paidDate, setPaidDate] = useState(isoToDisplayDate(todayIso()));
  const [paidMethod, setPaidMethod] = useState<MetodoPago | null>(null);
  const [paidReference, setPaidReference] = useState("");
  const [paidInitialSnapshot, setPaidInitialSnapshot] = useState(() =>
    JSON.stringify([isoToDisplayDate(todayIso()), null, ""]),
  );
  const hardwareBackHandlerRef = useRef<() => boolean>(() => false);

  const selectedPayment =
    payments.find((payment) => payment.id === selectedPaymentId) || null;
  const selectedClient = clients.find((client) => client.id === formClientId) || null;
  const activeClients = clients.filter((client) => client.activo !== false);

  const filteredPayments = useMemo(() => {
    const query = normalizeSearch(search);
    return sortPayments(payments).filter((payment) => {
      const matchesFilter = filter === "TODOS" || payment.estado === filter;
      const matchesSearch =
        !query ||
        normalizeSearch(
          `${payment.nombreCliente || ""} ${payment.emailCliente || ""} ${payment.concepto} ${payment.referencia || ""}`,
        ).includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, payments, search]);

  const counts = useMemo(
    () =>
      payments.reduce(
        (result, payment) => {
          result[payment.estado] += 1;
          return result;
        },
        { PENDIENTE: 0, VENCIDO: 0, PAGADO: 0, CANCELADO: 0 },
      ),
    [payments],
  );
  const pendingAmount = payments
    .filter((payment) => payment.estado === "PENDIENTE" || payment.estado === "VENCIDO")
    .reduce((total, payment) => total + Number(payment.importe || 0), 0);
  const currentMonth = todayIso().slice(0, 7);
  const collectedThisMonth = payments
    .filter((payment) => payment.estado === "PAGADO" && payment.fechaPago?.startsWith(currentMonth))
    .reduce((total, payment) => total + Number(payment.importe || 0), 0);

  const updatePayment = (updated: Pago) => {
    const exists = payments.some((payment) => payment.id === updated.id);
    onPaymentsChange(
      exists
        ? payments.map((payment) => (payment.id === updated.id ? updated : payment))
        : [updated, ...payments],
    );
    setSelectedPaymentId(updated.id);
  };

  const clearForm = () => {
    setFormClientId(null);
    setFormConcept("");
    setFormAmount("");
    setFormDueDate("");
    setFormDescription("");
    setFormErrors({});
    setClientSearch("");
    setFormInitialSnapshot(JSON.stringify([null, "", "", "", ""]));
  };

  const openNew = () => {
    setSelectedPaymentId(null);
    clearForm();
    setMode("FORM");
  };

  const openEdit = (payment: Pago) => {
    setSelectedPaymentId(payment.id);
    setFormClientId(payment.clienteId);
    setFormConcept(payment.concepto);
    setFormAmount(String(payment.importe).replace(".", ","));
    setFormDueDate(isoToDisplayDate(payment.fechaVencimiento));
    setFormDescription(payment.descripcion || "");
    setFormInitialSnapshot(
      JSON.stringify([
        payment.clienteId,
        payment.concepto,
        String(payment.importe).replace(".", ","),
        isoToDisplayDate(payment.fechaVencimiento),
        payment.descripcion || "",
      ]),
    );
    setFormErrors({});
    setMode("FORM");
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const normalizedAmount = normalizeAmountInput(formAmount);
    const isoDate = displayDateToIso(formDueDate);
    if (!formClientId) nextErrors.client = "Selecciona un cliente.";
    if (!formConcept.trim()) nextErrors.concept = "Escribe el concepto.";
    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount) || Number(normalizedAmount) <= 0) {
      nextErrors.amount = "Introduce un importe válido mayor que cero.";
    }
    if (!isoDate) nextErrors.date = "Usa una fecha válida en formato DD/MM/AAAA.";
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 && isoDate
      ? { normalizedAmount, isoDate }
      : null;
  };

  const savePayment = async () => {
    const valid = validateForm();
    if (!valid || !formClientId || saving) return;
    setSaving(true);
    try {
      const request = {
        clienteId: formClientId,
        concepto: formConcept.trim(),
        descripcion: formDescription.trim() || null,
        importe: valid.normalizedAmount,
        fechaVencimiento: valid.isoDate,
      };
      const result = selectedPayment
        ? await actualizarPagoApi(selectedPayment.id, request)
        : await crearPagoApi(request);
      updatePayment(result);
      setMode("DETAIL");
      Alert.alert(selectedPayment ? "Cobro actualizado" : "Cobro creado", "Los datos se han guardado correctamente.");
    } catch (requestError) {
      Alert.alert("No se pudo guardar", requestError instanceof Error ? requestError.message : "Revisa los datos del cobro.");
    } finally {
      setSaving(false);
    }
  };

  const openMarkPaid = () => {
    const initialDate = isoToDisplayDate(todayIso());
    setPaidDate(initialDate);
    setPaidMethod(null);
    setPaidReference("");
    setPaidInitialSnapshot(JSON.stringify([initialDate, null, ""]));
    setFormErrors({});
    setMode("MARK_PAID");
  };

  const markPaid = async () => {
    if (!selectedPayment || saving) return;
    const isoDate = displayDateToIso(paidDate);
    const errors: Record<string, string> = {};
    if (!isoDate) errors.paidDate = "Usa una fecha válida en formato DD/MM/AAAA.";
    if (isoDate && isoDate > todayIso()) {
      errors.paidDate = "La fecha de pago no puede ser futura.";
    }
    if (!paidMethod) errors.paidMethod = "Selecciona un método de pago.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0 || !isoDate || !paidMethod) return;
    setSaving(true);
    try {
      const updated = await marcarPagoComoPagadoApi(selectedPayment.id, {
        fechaPago: isoDate,
        metodoPago: paidMethod,
        referencia: paidReference.trim() || null,
      });
      updatePayment(updated);
      setMode("DETAIL");
      Alert.alert("Pago registrado", "El cobro se ha marcado como pagado.");
    } catch (requestError) {
      Alert.alert("No se pudo registrar", requestError instanceof Error ? requestError.message : "Revisa los datos del pago.");
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = (payment: Pago) => {
    Alert.alert(
      "Cancelar cobro",
      `${payment.nombreCliente || "Cliente"}\n${payment.concepto}\n${formatCurrency(payment.importe, payment.moneda)}\n\nEl cobro permanecerá en el historial y ya no podrá marcarse como pagado.`,
      [
        { text: "Mantener cobro", style: "cancel" },
        {
          text: "Cancelar cobro",
          style: "destructive",
          onPress: async () => {
            if (saving) return;
            setSaving(true);
            try {
              const updated = await cancelarPagoApi(payment.id);
              updatePayment(updated);
              Alert.alert("Cobro cancelado", "El registro se conserva en el historial.");
            } catch (requestError) {
              Alert.alert("No se pudo cancelar", requestError instanceof Error ? requestError.message : "Inténtalo de nuevo.");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const formHasChanges = useCallback(
    () =>
      JSON.stringify([
        formClientId,
        formConcept,
        formAmount,
        formDueDate,
        formDescription,
      ]) !== formInitialSnapshot,
    [
      formAmount,
      formClientId,
      formConcept,
      formDescription,
      formDueDate,
      formInitialSnapshot,
    ],
  );
  const paidFormHasChanges = useCallback(
    () =>
      JSON.stringify([paidDate, paidMethod, paidReference]) !==
      paidInitialSnapshot,
    [paidDate, paidInitialSnapshot, paidMethod, paidReference],
  );

  const requestFormExit = useCallback((onDiscard: () => void) => {
    if (saving) return;
    if (!formHasChanges()) {
      onDiscard();
      return;
    }
    Alert.alert("Descartar cambios", "Los datos introducidos no se guardarán.", [
      { text: "Seguir editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: onDiscard },
    ]);
  }, [formHasChanges, saving]);

  const requestPaidFormExit = useCallback((onDiscard: () => void) => {
    if (saving) return;
    if (!paidFormHasChanges()) {
      onDiscard();
      return;
    }
    Alert.alert("Descartar cambios", "Los datos del pago introducidos no se guardarán.", [
      { text: "Seguir editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: onDiscard },
    ]);
  }, [paidFormHasChanges, saving]);

  const backFromForm = () => {
    requestFormExit(() => setMode(selectedPayment ? "DETAIL" : "LIST"));
  };

  const backFromMarkPaid = () => {
    requestPaidFormExit(() => setMode("DETAIL"));
  };

  const backFromDetail = () => {
    setSelectedPaymentId(null);
    setMode("LIST");
  };

  const requestExternalExit = useCallback((onConfirm: () => void) => {
    if (saving) return;
    if (clientPickerVisible) {
      setClientPickerVisible(false);
      return;
    }
    if (mode === "FORM") {
      requestFormExit(onConfirm);
      return;
    }
    if (mode === "MARK_PAID") {
      requestPaidFormExit(onConfirm);
      return;
    }
    onConfirm();
  }, [clientPickerVisible, mode, requestFormExit, requestPaidFormExit, saving]);

  useEffect(() => {
    onRegisterExitGuard?.(requestExternalExit);
    return () => onRegisterExitGuard?.(null);
  }, [onRegisterExitGuard, requestExternalExit]);

  useEffect(() => {
    hardwareBackHandlerRef.current = () => {
      if (clientPickerVisible) {
        setClientPickerVisible(false);
        return true;
      }
      if (mode === "FORM") {
        backFromForm();
        return true;
      }
      if (mode === "MARK_PAID") {
        backFromMarkPaid();
        return true;
      }
      if (mode === "DETAIL") {
        backFromDetail();
        return true;
      }
      if (mode === "LIST" && onRootBack) {
        onRootBack();
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

  const clientPickerResults = activeClients.filter((client) =>
    normalizeSearch(`${client.nombre || ""} ${client.email || ""}`).includes(
      normalizeSearch(clientSearch),
    ),
  );

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

  if (mode === "DETAIL" && selectedPayment) {
    const canManage = selectedPayment.estado === "PENDIENTE" || selectedPayment.estado === "VENCIDO";
    return screen(`DETAIL:${selectedPayment.id}`, (
      <ScreenContainer theme={theme} style={styles.screen}>
        <PersonDetailHeader eyebrow="FICHA DE COBRO" title="Pago" theme={theme} onBack={backFromDetail} backAccessibilityLabel="Volver a pagos" />
        <Card theme={theme} style={styles.identityCard}>
          <Avatar uri={resolverUrlMedia(selectedPayment.fotoClienteUrl)} initials={getInitials(selectedPayment.nombreCliente, "Cliente")} size={62} theme={theme} />
          <View style={styles.identityCopy}>
            <Text style={[styles.identityName, { color: theme.text }]} numberOfLines={2}>{selectedPayment.nombreCliente || "Cliente"}</Text>
            <Text style={[styles.identityEmail, { color: theme.muted }]} numberOfLines={1}>{selectedPayment.emailCliente || "Sin email"}</Text>
            <PaymentStatusBadge status={selectedPayment.estado} theme={theme} />
          </View>
          <Text style={[styles.detailAmount, { color: theme.text }]}>{formatCurrency(selectedPayment.importe, selectedPayment.moneda)}</Text>
        </Card>
        <DetailSection title="Cobro" theme={theme}>
          <DetailRow icon="text-box-outline" title="Concepto" value={selectedPayment.concepto} theme={theme} />
          {!!selectedPayment.descripcion && <DetailRow icon="note-text-outline" title="Notas" value={selectedPayment.descripcion} theme={theme} />}
          <DetailRow icon="cash-multiple" title="Importe" value={formatCurrency(selectedPayment.importe, selectedPayment.moneda)} theme={theme} last />
        </DetailSection>
        <DetailSection title="Fechas" theme={theme}>
          <DetailRow icon="calendar-outline" title="Emisión" value={formatDate(selectedPayment.fechaEmision)} theme={theme} />
          <DetailRow icon="calendar-clock-outline" title="Vencimiento" value={formatDate(selectedPayment.fechaVencimiento)} theme={theme} last={!selectedPayment.fechaPago} />
          {!!selectedPayment.fechaPago && <DetailRow icon="calendar-check-outline" title="Pago" value={formatDate(selectedPayment.fechaPago)} theme={theme} last />}
        </DetailSection>
        {(selectedPayment.metodoPago || selectedPayment.referencia || selectedPayment.nombreCreador) && (
          <DetailSection title="Registro" theme={theme}>
            {!!selectedPayment.metodoPago && <DetailRow icon="wallet-outline" title="Método" value={paymentMethodLabel(selectedPayment.metodoPago)} theme={theme} last={!selectedPayment.referencia && !selectedPayment.nombreCreador} />}
            {!!selectedPayment.referencia && <DetailRow icon="identifier" title="Referencia" value={selectedPayment.referencia} theme={theme} last={!selectedPayment.nombreCreador} />}
            {!!selectedPayment.nombreCreador && <DetailRow icon="account-check-outline" title="Registrado por" value={selectedPayment.nombreCreador} theme={theme} last />}
          </DetailSection>
        )}
        {canManage && (
          <View style={styles.actionSection}>
            <PrimaryButton label="Marcar como pagado" icon="check-circle-outline" theme={theme} onPress={openMarkPaid} loading={saving} />
            <SecondaryButton label="Editar cobro" icon="pencil-outline" theme={theme} onPress={() => openEdit(selectedPayment)} />
            <Pressable style={styles.cancelAction} onPress={() => confirmCancel(selectedPayment)} disabled={saving}>
              <MaterialCommunityIcons name="close-circle-outline" size={20} color="#C2413B" />
              <Text style={styles.cancelActionText}>Cancelar cobro</Text>
            </Pressable>
          </View>
        )}
      </ScreenContainer>
    ));
  }

  if (mode === "FORM") {
    return screen(`FORM:${selectedPayment?.id || "NEW"}`, (
      <ScreenContainer theme={theme} style={styles.screen}>
        <PersonDetailHeader eyebrow={selectedPayment ? "EDITAR COBRO" : "NUEVO COBRO"} title={selectedPayment ? "Editar cobro" : "Nuevo cobro"} theme={theme} onBack={backFromForm} backAccessibilityLabel="Volver a pagos" />
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Cliente</Text>
            <Pressable style={[styles.selector, { backgroundColor: theme.surface, borderColor: formErrors.client ? "#C2413B" : theme.border }]} onPress={() => setClientPickerVisible(true)}>
              {selectedClient ? <Avatar uri={resolverUrlMedia(selectedClient.fotoPerfilUrl)} initials={getInitials(selectedClient.nombre, "Cliente")} size={38} theme={theme} /> : <MaterialCommunityIcons name="account-search-outline" size={22} color={theme.muted} />}
              <View style={styles.selectorCopy}>
                <Text style={[styles.selectorTitle, { color: selectedClient ? theme.text : theme.muted }]} numberOfLines={1}>{selectedClient?.nombre || "Seleccionar cliente"}</Text>
                {!!selectedClient?.email && <Text style={[styles.selectorMeta, { color: theme.muted }]} numberOfLines={1}>{selectedClient.email}</Text>}
              </View>
              <MaterialCommunityIcons name="chevron-down" size={22} color={theme.muted} />
            </Pressable>
            {!!formErrors.client && <Text style={styles.errorText}>{formErrors.client}</Text>}
          </View>
          <Field label="Concepto" value={formConcept} onChangeText={setFormConcept} placeholder="Ej. Cuota de agosto" error={formErrors.concept} theme={theme} />
          <Field label="Importe (€)" value={formAmount} onChangeText={setFormAmount} placeholder="35,00" error={formErrors.amount} keyboardType="decimal-pad" theme={theme} />
          <Field label="Fecha de vencimiento" value={formDueDate} onChangeText={(value) => setFormDueDate(maskDisplayDate(value))} placeholder="DD/MM/AAAA" error={formErrors.date} keyboardType="number-pad" theme={theme} />
          <Field label="Descripción o notas (opcional)" value={formDescription} onChangeText={setFormDescription} placeholder="Información útil para el cliente" theme={theme} multiline />
          <PrimaryButton label={selectedPayment ? "Guardar cambios" : "Crear cobro"} icon="content-save-outline" theme={theme} onPress={savePayment} loading={saving} />
          <SecondaryButton label="Cancelar" theme={theme} onPress={backFromForm} disabled={saving} />
        </View>
        {renderClientPicker()}
      </ScreenContainer>
    ));
  }

  if (mode === "MARK_PAID" && selectedPayment) {
    return screen(`MARK:${selectedPayment.id}`, (
      <ScreenContainer theme={theme} style={styles.screen}>
        <PersonDetailHeader eyebrow="REGISTRAR PAGO" title="Marcar como pagado" theme={theme} onBack={backFromMarkPaid} backAccessibilityLabel="Volver al cobro" />
        <Card theme={theme} style={styles.paymentSummary}>
          <Text style={[styles.summaryClient, { color: theme.text }]}>{selectedPayment.nombreCliente || "Cliente"}</Text>
          <Text style={[styles.summaryConcept, { color: theme.muted }]}>{selectedPayment.concepto}</Text>
          <Text style={[styles.summaryAmount, { color: theme.primary }]}>{formatCurrency(selectedPayment.importe, selectedPayment.moneda)}</Text>
        </Card>
        <View style={styles.form}>
          <Field label="Fecha de pago" value={paidDate} onChangeText={(value) => setPaidDate(maskDisplayDate(value))} placeholder="DD/MM/AAAA" error={formErrors.paidDate} keyboardType="number-pad" theme={theme} />
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Método de pago</Text>
            <View style={styles.methodList}>
              {METHODS.map((method) => <FilterChip key={method.value} label={method.label} active={paidMethod === method.value} theme={theme} onPress={() => setPaidMethod(method.value)} stableHeight />)}
            </View>
            {!!formErrors.paidMethod && <Text style={styles.errorText}>{formErrors.paidMethod}</Text>}
          </View>
          <Field label="Referencia (opcional)" value={paidReference} onChangeText={setPaidReference} placeholder="N.º de operación o nota" theme={theme} />
          <PrimaryButton label="Confirmar pago" icon="check-circle-outline" theme={theme} onPress={markPaid} loading={saving} />
          <SecondaryButton label="Cancelar" theme={theme} onPress={backFromMarkPaid} disabled={saving} />
        </View>
      </ScreenContainer>
    ));
  }

  return screen("LIST", (
    <ScreenContainer theme={theme} style={styles.screen}>
      <AdminScreenHeader theme={theme} adminAvatarUri={adminAvatarUri} adminInitials={adminInitials} onAdminAvatarPress={onAdminAvatarPress} eyebrow="COBROS" title="Pagos" subtitle="Controla los cobros y vencimientos del gimnasio." />
      <PrimaryButton label="Nuevo cobro" icon="receipt-text-plus-outline" theme={theme} onPress={openNew} style={styles.newButton} />
      <View style={styles.metricsRow}>
        <Card theme={theme} style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: theme.muted }]}>Pendiente</Text>
          <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>{formatCurrency(pendingAmount)}</Text>
        </Card>
        <Card theme={theme} style={styles.metricCard}>
          <Text style={[styles.metricLabel, { color: theme.muted }]}>Cobrado este mes</Text>
          <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>{formatCurrency(collectedThisMonth)}</Text>
        </Card>
        <Card theme={theme} style={styles.metricCardSmall}>
          <Text style={[styles.metricLabel, { color: theme.muted }]}>Vencidos</Text>
          <Text style={[styles.metricCount, { color: statusColor("VENCIDO", theme) }]}>{counts.VENCIDO}</Text>
        </Card>
      </View>
      {payments.length > 0 && (
        <>
          <SearchInput value={search} onChangeText={setSearch} theme={theme} placeholder="Buscar cliente, concepto o referencia..." />
          <View style={styles.filters}>
            {FILTERS.map((item) => {
              const count = item.value === "TODOS" ? payments.length : counts[item.value];
              return <FilterChip key={item.value} label={`${item.label} ${count}`} active={filter === item.value} theme={theme} onPress={() => setFilter(item.value)} stableHeight />;
            })}
          </View>
        </>
      )}
      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.loadingText, { color: theme.muted }]}>Cargando pagos...</Text></View>
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="No se pudieron cargar los pagos" text={error} actionLabel="Reintentar" onAction={onReload} theme={theme} />
      ) : payments.length === 0 ? (
        <EmptyState icon="receipt-text-plus-outline" title="Todavía no hay cobros" text="Crea el primer cobro para empezar a gestionar los pagos del gimnasio." actionLabel="Nuevo cobro" onAction={openNew} theme={theme} />
      ) : filteredPayments.length === 0 ? (
        <EmptyState icon="text-search" title="Sin resultados" text="No hay pagos que coincidan con la búsqueda y el filtro actuales." theme={theme} />
      ) : (
        <View style={styles.list}>{filteredPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} theme={theme} onPress={() => { setSelectedPaymentId(payment.id); setMode("DETAIL"); }} />)}</View>
      )}
    </ScreenContainer>
  ));

  function renderClientPicker() {
    return (
      <Modal visible={clientPickerVisible} animationType="slide" onRequestClose={() => setClientPickerVisible(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]} edges={["top", "bottom", "left", "right"]}>
          <KeyboardAvoidingView style={styles.modalFlex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={[styles.modalEyebrow, { color: theme.secondary }]}>CLIENTES</Text>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Seleccionar cliente</Text>
              </View>
              <Pressable style={[styles.modalClose, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setClientPickerVisible(false)} accessibilityLabel="Cerrar selector">
                <MaterialCommunityIcons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>
            <SearchInput value={clientSearch} onChangeText={setClientSearch} theme={theme} placeholder="Buscar por nombre o email..." />
            <FlatList
              data={clientPickerResults}
              keyExtractor={(item) => String(item.id)}
              style={styles.clientList}
              contentContainerStyle={styles.clientListContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<EmptyState icon="account-search-outline" title="Sin clientes" text="No hay clientes activos que coincidan con la búsqueda." theme={theme} />}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.clientOption, { backgroundColor: theme.surface, borderColor: item.id === formClientId ? theme.primary : theme.border }]}
                  onPress={() => { setFormClientId(item.id); setClientPickerVisible(false); setClientSearch(""); setFormErrors((current) => ({ ...current, client: "" })); }}
                >
                  <Avatar uri={resolverUrlMedia(item.fotoPerfilUrl)} initials={getInitials(item.nombre, "Cliente")} size={46} theme={theme} />
                  <View style={styles.clientOptionCopy}>
                    <Text style={[styles.clientOptionName, { color: theme.text }]} numberOfLines={1}>{item.nombre || "Cliente"}</Text>
                    <Text style={[styles.clientOptionEmail, { color: theme.muted }]} numberOfLines={1}>{item.email || "Sin email"}</Text>
                  </View>
                  {item.id === formClientId && <MaterialCommunityIcons name="check-circle" size={23} color={theme.primary} />}
                </Pressable>
              )}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 16 },
  screen: { flexGrow: 1 },
  newButton: { marginTop: 15, marginBottom: 16, minHeight: 50 },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 15 },
  metricCard: { width: "48%", minHeight: 92, padding: 13, justifyContent: "space-between", borderRadius: 20 },
  metricCardSmall: { width: "100%", minHeight: 74, paddingHorizontal: 15, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 20 },
  metricLabel: { fontSize: 12, lineHeight: 16, fontWeight: "800" },
  metricValue: { marginTop: 8, fontSize: 18, lineHeight: 23, fontWeight: "900" },
  metricCount: { fontSize: 25, fontWeight: "900" },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, marginBottom: 12, alignItems: "center" },
  list: { gap: 10 },
  paymentCard: { minHeight: 122, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 22 },
  paymentCopy: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  clientName: { fontSize: 16, lineHeight: 20, fontWeight: "900" },
  concept: { marginTop: 2, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  date: { marginTop: 3, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  amountColumn: { alignSelf: "stretch", minWidth: 76, alignItems: "flex-end", justifyContent: "space-between" },
  amount: { maxWidth: 112, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  statusBadge: { minHeight: 25, marginTop: 7, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "900" },
  loading: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13, fontWeight: "700" },
  identityCard: { padding: 16, flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 22 },
  identityCopy: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  identityName: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  identityEmail: { marginTop: 2, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  detailAmount: { maxWidth: 115, fontSize: 18, lineHeight: 24, fontWeight: "900", textAlign: "right" },
  actionSection: { gap: 10, marginTop: 24 },
  cancelAction: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  cancelActionText: { color: "#C2413B", fontSize: 14, fontWeight: "900" },
  form: { gap: 14 },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontSize: 13, lineHeight: 18, fontWeight: "900" },
  field: { minHeight: 52, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15, paddingVertical: 11, fontSize: 15, fontWeight: "700" },
  textArea: { minHeight: 112 },
  errorText: { color: "#C2413B", fontSize: 12, lineHeight: 16, fontWeight: "700" },
  selector: { minHeight: 58, borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  selectorCopy: { flex: 1, minWidth: 0 },
  selectorTitle: { fontSize: 14, lineHeight: 19, fontWeight: "900" },
  selectorMeta: { marginTop: 1, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  paymentSummary: { padding: 18, marginBottom: 20, borderRadius: 22 },
  summaryClient: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  summaryConcept: { marginTop: 3, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  summaryAmount: { marginTop: 12, fontSize: 27, lineHeight: 32, fontWeight: "900" },
  methodList: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  modalSafe: { flex: 1 },
  modalFlex: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  modalHeader: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  modalHeaderCopy: { flex: 1 },
  modalEyebrow: { fontSize: 11, fontWeight: "900" },
  modalTitle: { marginTop: 3, fontSize: 24, lineHeight: 29, fontWeight: "900" },
  modalClose: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  clientList: { flex: 1, marginTop: 12 },
  clientListContent: { gap: 9, paddingBottom: 24, flexGrow: 1 },
  clientOption: { minHeight: 74, borderWidth: 1, borderRadius: 20, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  clientOptionCopy: { flex: 1, minWidth: 0 },
  clientOptionName: { fontSize: 15, lineHeight: 20, fontWeight: "900" },
  clientOptionEmail: { marginTop: 2, fontSize: 12, lineHeight: 16, fontWeight: "700" },
});
