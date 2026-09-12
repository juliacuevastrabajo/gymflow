import type { ComponentProps, ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { resolverUrlMedia } from "../../services/gymflowService";
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

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type AdminClientFilter =
  | "TODOS"
  | "ACTIVOS"
  | "PENDIENTES"
  | "CANCELADOS";

type ClientStatus = Exclude<AdminClientFilter, "TODOS">;

type AdminClient = {
  id: number;
  nombre?: string | null;
  email?: string | null;
  fotoPerfilUrl?: string | null;
  activo?: boolean;
  telefono?: string | null;
  fechaAlta?: string | null;
  fechaCreacion?: string | null;
  createdAt?: string | null;
};

type Reservation = {
  id: number;
  clienteId: number;
  claseId: number;
  estado?: string | null;
};

type GymClass = {
  id: number;
  nombre?: string | null;
  fechaHora?: string | null;
  duracionMinutos?: number | null;
};

type AdminClientsProps = {
  theme: GymFlowTheme;
  adminAvatarUri?: string | null;
  adminInitials: string;
  clients: AdminClient[];
  reservations: Reservation[];
  classes: GymClass[];
  search: string;
  activeFilter: AdminClientFilter;
  selectedClientId: number | null;
  updatingPhoto: boolean;
  getClientStatus: (client: AdminClient) => ClientStatus;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: AdminClientFilter) => void;
  onAdminAvatarPress: () => void;
  onNewClient: () => void;
  onInviteClients: () => void;
  onOpenClient: (clientId: number) => void;
  onBackToList: () => void;
  onChangePhoto: (client: AdminClient) => void;
  onSendMessage: (client: AdminClient) => void;
  onDeactivate: (client: AdminClient) => void;
};

const FILTERS: { value: AdminClientFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ACTIVOS", label: "Activos" },
  { value: "PENDIENTES", label: "Pendientes" },
  { value: "CANCELADOS", label: "Cancelados" },
];

export function withAlpha(hex: string, alpha: string) {
  const safeHex = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#64748B";
  return `${safeHex}${alpha}`;
}

export function getInitials(name?: string | null, fallback = "Cliente") {
  const initials = (name || fallback)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CL";
}

export function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatReservationDate(value?: string | null) {
  if (!value) {
    return "Fecha por confirmar";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha por confirmar";
  }

  const dateText = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  const timeText = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${dateText} · ${timeText}`;
}

export function AdminScreenHeader({
  theme,
  adminAvatarUri,
  adminInitials,
  onAdminAvatarPress,
  onBack,
  eyebrow = "PERSONAS",
  title = "Clientes",
  subtitle = "Gestiona las cuentas y el estado de tus clientes.",
}: Pick<
  AdminClientsProps,
  "theme" | "adminAvatarUri" | "adminInitials" | "onAdminAvatarPress"
> & {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      {!!onBack && (
        <Pressable
          style={[
            styles.headerBackButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons name="arrow-left" size={23} color={theme.text} />
        </Pressable>
      )}
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, { color: theme.secondary }]}>{eyebrow}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {subtitle}
        </Text>
      </View>
      <Avatar
        uri={adminAvatarUri}
        initials={adminInitials}
        size={54}
        theme={theme}
        onPress={onAdminAvatarPress}
      />
    </View>
  );
}

function StatusBadge({
  status,
  theme,
}: {
  status: ClientStatus;
  theme: GymFlowTheme;
}) {
  const config =
    status === "ACTIVOS"
      ? { label: "Activo", color: theme.secondary }
      : status === "PENDIENTES"
        ? { label: "Pendiente", color: theme.primary }
        : { label: "Cancelado", color: theme.muted };

  return <PersonStatusBadge label={config.label} color={config.color} />;
}

export function PersonStatusBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: withAlpha(color, "12"),
          borderColor: withAlpha(color, "28"),
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export function SearchInput({
  value,
  onChangeText,
  theme,
  placeholder = "Buscar por nombre o email...",
}: {
  value: string;
  onChangeText: (value: string) => void;
  theme: GymFlowTheme;
  placeholder?: string;
}) {
  return (
    <View
      style={[
        styles.search,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <MaterialCommunityIcons name="magnify" size={22} color={theme.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={[styles.searchInput, { color: theme.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {!!value && (
        <Pressable
          style={styles.clearSearch}
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
        >
          <MaterialCommunityIcons name="close-circle" size={20} color={theme.muted} />
        </Pressable>
      )}
    </View>
  );
}

export function PersonListCard({
  person,
  statusBadge,
  theme,
  onPress,
  fallbackLabel = "Usuario",
}: {
  person: AdminClient;
  statusBadge: ReactNode;
  theme: GymFlowTheme;
  onPress: () => void;
  fallbackLabel?: string;
}) {
  return (
    <Card theme={theme} style={styles.clientCard} onPress={onPress}>
      <Avatar
        uri={resolverUrlMedia(person.fotoPerfilUrl)}
        initials={getInitials(person.nombre, fallbackLabel)}
        size={54}
        theme={theme}
      />
      <View style={styles.clientCopy}>
        <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={2}>
          {person.nombre || fallbackLabel}
        </Text>
        <Text style={[styles.clientEmail, { color: theme.muted }]} numberOfLines={1}>
          {person.email || "Sin email"}
        </Text>
        {statusBadge}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={23} color={theme.muted} />
    </Card>
  );
}

function ClientListCard({
  client,
  status,
  theme,
  onPress,
}: {
  client: AdminClient;
  status: ClientStatus;
  theme: GymFlowTheme;
  onPress: () => void;
}) {
  return (
    <PersonListCard
      person={client}
      statusBadge={<StatusBadge status={status} theme={theme} />}
      theme={theme}
      onPress={onPress}
      fallbackLabel="Cliente"
    />
  );
}

export function DetailSection({
  title,
  children,
  theme,
}: {
  title: string;
  children: ReactNode;
  theme: GymFlowTheme;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Card theme={theme} style={styles.detailCard}>
        {children}
      </Card>
    </View>
  );
}

export function DetailRow({
  icon,
  title,
  value,
  theme,
  onPress,
  danger = false,
  last = false,
}: {
  icon: IconName;
  title: string;
  value?: string | null;
  theme: GymFlowTheme;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const color = danger ? "#DC2626" : theme.secondary;
  const content = (
    <View
      style={[
        styles.detailRow,
        !last && { borderBottomWidth: 1, borderBottomColor: theme.border },
      ]}
    >
      <View
        style={[
          styles.detailRowIcon,
          {
            backgroundColor: danger ? "#FEF2F2" : withAlpha(theme.secondary, "12"),
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.detailRowCopy}>
        <Text style={[styles.detailRowTitle, { color: danger ? color : theme.text }]}>
          {title}
        </Text>
        {!!value && (
          <Text style={[styles.detailRowValue, { color: theme.muted }]} numberOfLines={2}>
            {value}
          </Text>
        )}
      </View>
      {!!onPress && (
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.muted} />
      )}
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function PersonDetailHeader({
  eyebrow,
  title,
  theme,
  onBack,
  backAccessibilityLabel,
}: {
  eyebrow: string;
  title: string;
  theme: GymFlowTheme;
  onBack: () => void;
  backAccessibilityLabel: string;
}) {
  return (
    <View style={styles.detailHeader}>
      <Pressable
        style={[
          styles.backButton,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
      >
        <MaterialCommunityIcons name="arrow-left" size={23} color={theme.text} />
      </Pressable>
      <View style={styles.detailHeaderCopy}>
        <Text style={[styles.eyebrow, { color: theme.secondary }]}>{eyebrow}</Text>
        <Text style={[styles.detailTitle, { color: theme.text }]}>{title}</Text>
      </View>
    </View>
  );
}

export function PersonIdentityCard({
  person,
  statusBadge,
  theme,
  updatingPhoto,
  onChangePhoto,
  photoAccessibilityLabel,
  fallbackLabel = "Usuario",
}: {
  person: AdminClient;
  statusBadge: ReactNode;
  theme: GymFlowTheme;
  updatingPhoto: boolean;
  onChangePhoto: () => void;
  photoAccessibilityLabel: string;
  fallbackLabel?: string;
}) {
  return (
    <Card theme={theme} style={styles.identityCard}>
      <Pressable
        style={styles.identityAvatar}
        onPress={onChangePhoto}
        disabled={updatingPhoto}
        accessibilityRole="button"
        accessibilityLabel={photoAccessibilityLabel}
      >
        <Avatar
          uri={resolverUrlMedia(person.fotoPerfilUrl)}
          initials={getInitials(person.nombre, fallbackLabel)}
          size={76}
          theme={theme}
        />
        <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
          {updatingPhoto ? (
            <ActivityIndicator size="small" color={theme.textOnPrimary} />
          ) : (
            <MaterialCommunityIcons
              name="camera-outline"
              size={15}
              color={theme.textOnPrimary}
            />
          )}
        </View>
      </Pressable>
      <View style={styles.identityCopy}>
        <Text style={[styles.identityName, { color: theme.text }]} numberOfLines={2}>
          {person.nombre || fallbackLabel}
        </Text>
        <Text style={[styles.identityEmail, { color: theme.muted }]} numberOfLines={2}>
          {person.email || "Sin email"}
        </Text>
        {statusBadge}
      </View>
    </Card>
  );
}

function ClientDetail({
  client,
  theme,
  reservations,
  classes,
  status,
  updatingPhoto,
  onBack,
  onChangePhoto,
  onSendMessage,
  onDeactivate,
}: {
  client: AdminClient;
  theme: GymFlowTheme;
  reservations: Reservation[];
  classes: GymClass[];
  status: ClientStatus;
  updatingPhoto: boolean;
  onBack: () => void;
  onChangePhoto: () => void;
  onSendMessage: () => void;
  onDeactivate: () => void;
}) {
  const classesById = new Map(classes.map((gymClass) => [gymClass.id, gymClass]));
  const clientReservations = reservations.filter(
    (reservation) => reservation.clienteId === client.id,
  );
  const upcomingReservations = clientReservations
    .filter((reservation) => {
      const gymClass = classesById.get(reservation.claseId);
      const timestamp = new Date(gymClass?.fechaHora || 0).getTime();
      return (
        reservation.estado === "RESERVADA" &&
        Number.isFinite(timestamp) &&
        timestamp >= Date.now()
      );
    })
    .sort((a, b) => {
      const dateA = new Date(classesById.get(a.claseId)?.fechaHora || 0).getTime();
      const dateB = new Date(classesById.get(b.claseId)?.fechaHora || 0).getTime();
      return dateA - dateB;
    });
  const joinedAt = formatDate(
    client.fechaAlta || client.fechaCreacion || client.createdAt,
  );
  const statusDescription =
    status === "ACTIVOS"
      ? "Tiene reservas activas en este momento."
      : status === "PENDIENTES"
        ? "No tiene reservas activas en este momento."
        : "El acceso a la cuenta está desactivado.";

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <PersonDetailHeader
        eyebrow="FICHA DE CLIENTE"
        title="Cliente"
        theme={theme}
        onBack={onBack}
        backAccessibilityLabel="Volver al listado de clientes"
      />

      <PersonIdentityCard
        person={client}
        statusBadge={<StatusBadge status={status} theme={theme} />}
        theme={theme}
        updatingPhoto={updatingPhoto}
        onChangePhoto={onChangePhoto}
        photoAccessibilityLabel="Cambiar foto del cliente"
        fallbackLabel="Cliente"
      />

      {clientReservations.length > 0 && (
        <View style={styles.detailSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Card theme={theme} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {upcomingReservations.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Próximas</Text>
            </Card>
            <Card theme={theme} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                {clientReservations.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Registradas</Text>
            </Card>
          </View>
        </View>
      )}

      <DetailSection title="Datos personales" theme={theme}>
        <DetailRow
          icon="account-outline"
          title="Nombre"
          value={client.nombre || "Sin nombre"}
          theme={theme}
        />
        <DetailRow
          icon="email-outline"
          title="Email"
          value={client.email || "Sin email"}
          theme={theme}
          last={!client.telefono && !joinedAt}
        />
        {!!client.telefono && (
          <DetailRow
            icon="phone-outline"
            title="Teléfono"
            value={client.telefono}
            theme={theme}
            last={!joinedAt}
          />
        )}
        {!!joinedAt && (
          <DetailRow
            icon="calendar-check-outline"
            title="Cliente desde"
            value={joinedAt}
            theme={theme}
            last
          />
        )}
      </DetailSection>

      <DetailSection title="Estado de la cuenta" theme={theme}>
        <View style={styles.statusDetail}>
          <StatusBadge status={status} theme={theme} />
          <Text style={[styles.statusDescription, { color: theme.muted }]}>
            {statusDescription}
          </Text>
        </View>
      </DetailSection>

      <DetailSection title="Reservas" theme={theme}>
        {upcomingReservations.length === 0 ? (
          <View style={styles.inlineEmpty}>
            <View
              style={[
                styles.inlineEmptyIcon,
                { backgroundColor: withAlpha(theme.primary, "12") },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={21}
                color={theme.primary}
              />
            </View>
            <View style={styles.inlineEmptyCopy}>
              <Text style={[styles.inlineEmptyTitle, { color: theme.text }]}>
                Sin próximas reservas
              </Text>
              <Text style={[styles.inlineEmptyText, { color: theme.muted }]}>
                No hay clases reservadas próximamente.
              </Text>
            </View>
          </View>
        ) : (
          upcomingReservations.slice(0, 2).map((reservation, index, visible) => {
            const gymClass = classesById.get(reservation.claseId);
            return (
              <View
                key={reservation.id}
                style={[
                  styles.reservationRow,
                  index < visible.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.reservationIcon,
                    { backgroundColor: withAlpha(theme.primary, "12") },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-check-outline"
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.reservationCopy}>
                  <Text style={[styles.reservationTitle, { color: theme.text }]}>
                    {gymClass?.nombre || "Clase"}
                  </Text>
                  <Text style={[styles.reservationMeta, { color: theme.muted }]}>
                    {formatReservationDate(gymClass?.fechaHora)}
                  </Text>
                  {!!gymClass?.duracionMinutos && (
                    <Text style={[styles.reservationDuration, { color: theme.muted }]}>
                      {gymClass.duracionMinutos} min
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </DetailSection>

      <DetailSection title="Comunicación" theme={theme}>
        <DetailRow
          icon="message-text-outline"
          title="Enviar mensaje"
          value={
            status === "CANCELADOS"
              ? "El acceso del cliente está desactivado"
              : "Abre una conversación individual"
          }
          theme={theme}
          onPress={status === "CANCELADOS" ? undefined : onSendMessage}
          last
        />
      </DetailSection>

      <DetailSection title="Acciones de cuenta" theme={theme}>
        <DetailRow
          icon="camera-outline"
          title="Cambiar foto"
          value="Actualiza la imagen del perfil"
          theme={theme}
          onPress={onChangePhoto}
          last={status === "CANCELADOS"}
        />
        {status !== "CANCELADOS" && (
          <DetailRow
            icon="account-off-outline"
            title="Desactivar cliente"
            value="Bloquea el acceso conservando su historial"
            theme={theme}
            onPress={onDeactivate}
            danger
            last
          />
        )}
      </DetailSection>
    </ScreenContainer>
  );
}

export default function AdminClients(props: AdminClientsProps) {
  const {
    theme,
    clients,
    reservations,
    classes,
    search,
    activeFilter,
    selectedClientId,
    getClientStatus,
    onSearchChange,
    onFilterChange,
    onNewClient,
    onOpenClient,
  } = props;
  const selectedClient = clients.find((client) => client.id === selectedClientId) || null;

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        theme={theme}
        reservations={reservations}
        classes={classes}
        status={getClientStatus(selectedClient)}
        updatingPhoto={props.updatingPhoto}
        onBack={props.onBackToList}
        onChangePhoto={() => props.onChangePhoto(selectedClient)}
        onSendMessage={() => props.onSendMessage(selectedClient)}
        onDeactivate={() => props.onDeactivate(selectedClient)}
      />
    );
  }

  const normalizedSearch = normalizeSearch(search);
  const counts = clients.reduce(
    (result, client) => {
      result[getClientStatus(client)] += 1;
      return result;
    },
    { ACTIVOS: 0, PENDIENTES: 0, CANCELADOS: 0 },
  );
  const filteredClients = clients.filter((client) => {
    const matchesSearch = !normalizedSearch
      ? true
      : normalizeSearch(`${client.nombre || ""} ${client.email || ""}`).includes(
          normalizedSearch,
        );
    const matchesFilter =
      activeFilter === "TODOS" || getClientStatus(client) === activeFilter;

    return matchesSearch && matchesFilter;
  });
  const isGeneralEmpty = clients.length === 0;
  const isSearchEmpty = !isGeneralEmpty && filteredClients.length === 0;
  const resultText =
    activeFilter === "TODOS" && !normalizedSearch
      ? `${clients.length} ${clients.length === 1 ? "cliente" : "clientes"}`
      : `Mostrando ${filteredClients.length} de ${clients.length} clientes`;

  return (
    <ScreenContainer theme={theme} style={styles.screen}>
      <AdminScreenHeader
        theme={theme}
        adminAvatarUri={props.adminAvatarUri}
        adminInitials={props.adminInitials}
        onAdminAvatarPress={props.onAdminAvatarPress}
      />

      <PrimaryButton
        label="Nuevo cliente"
        icon="account-plus-outline"
        theme={theme}
        onPress={onNewClient}
        style={styles.newClientButton}
      />
      <SecondaryButton
        label="Invitar clientes"
        icon="qrcode-scan"
        theme={theme}
        onPress={props.onInviteClients}
        style={styles.inviteClientButton}
      />

      {!isGeneralEmpty && (
        <>
          <SearchInput value={search} onChangeText={onSearchChange} theme={theme} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            keyboardShouldPersistTaps="handled"
          >
            {FILTERS.map((filter) => {
              const count = filter.value === "TODOS" ? clients.length : counts[filter.value];
              return (
                <FilterChip
                  key={filter.value}
                  label={`${filter.label} ${count}`}
                  active={activeFilter === filter.value}
                  theme={theme}
                  onPress={() => onFilterChange(filter.value)}
                  stableHeight
                />
              );
            })}
          </ScrollView>
          <Text style={[styles.resultMeta, { color: theme.muted }]}>{resultText}</Text>
        </>
      )}

      {isGeneralEmpty ? (
        <EmptyState
          icon="account-plus-outline"
          title="Todavía no hay clientes"
          text="Añade el primer cliente para empezar a gestionar su cuenta."
          actionLabel="Nuevo cliente"
          onAction={onNewClient}
          theme={theme}
        />
      ) : isSearchEmpty ? (
        <EmptyState
          icon="account-search-outline"
          title={normalizedSearch ? "Sin resultados" : "Sin clientes en este estado"}
          text={
            normalizedSearch
              ? "Prueba con otro nombre o email."
              : "No hay clientes que coincidan con el filtro seleccionado."
          }
          theme={theme}
        />
      ) : (
        <View style={styles.clientList}>
          {filteredClients.map((client) => (
            <ClientListCard
              key={client.id}
              client={client}
              status={getClientStatus(client)}
              theme={theme}
              onPress={() => onOpenClient(client.id)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
  },
  header: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "900",
  },
  subtitle: {
    maxWidth: 285,
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  newClientButton: {
    minHeight: 50,
    marginTop: 15,
    marginBottom: 9,
  },
  inviteClientButton: {
    minHeight: 48,
    marginBottom: 16,
  },
  search: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: "700",
  },
  clearSearch: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -9,
  },
  filters: {
    gap: 9,
    paddingTop: 13,
    paddingRight: 20,
    alignItems: "center",
  },
  resultMeta: {
    marginTop: 13,
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  clientList: {
    gap: 10,
  },
  clientCard: {
    minHeight: 108,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 22,
  },
  clientCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },
  clientName: {
    maxWidth: "100%",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },
  clientEmail: {
    maxWidth: "100%",
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  statusBadge: {
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  detailHeader: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 15,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailTitle: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
  },
  identityCard: {
    padding: 18,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  identityAvatar: {
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 29,
    height: 29,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
  },
  identityName: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
  },
  identityEmail: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  detailSection: {
    marginTop: 23,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  detailCard: {
    overflow: "hidden",
    borderRadius: 22,
  },
  detailRow: {
    minHeight: 70,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  detailRowCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailRowTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  detailRowValue: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minHeight: 88,
    padding: 15,
    borderRadius: 20,
    justifyContent: "center",
  },
  summaryValue: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  statusDetail: {
    padding: 17,
    alignItems: "flex-start",
  },
  statusDescription: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  inlineEmpty: {
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inlineEmptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineEmptyCopy: {
    flex: 1,
    minWidth: 0,
  },
  inlineEmptyTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  inlineEmptyText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  reservationRow: {
    minHeight: 78,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reservationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  reservationCopy: {
    flex: 1,
    minWidth: 0,
  },
  reservationTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  reservationMeta: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  reservationDuration: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
});
