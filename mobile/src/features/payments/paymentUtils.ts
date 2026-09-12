import type { EstadoPago, Pago } from "../../services/gymflowService";

export function formatCurrency(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function parseIsoDate(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatDate(value?: string | null) {
  const date = parseIsoDate(value);
  return date
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    : "Sin fecha";
}

export function isoToDisplayDate(value?: string | null) {
  return value ? formatDate(value) : "";
}

export function displayDateToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  return parseIsoDate(iso) ? iso : null;
}

export function maskDisplayDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function normalizeAmountInput(value: string) {
  return value.replace(/\s/g, "").replace(",", ".");
}

export function paymentStatusLabel(status: EstadoPago) {
  const labels: Record<EstadoPago, string> = {
    PENDIENTE: "Pendiente",
    VENCIDO: "Vencido",
    PAGADO: "Pagado",
    CANCELADO: "Cancelado",
  };
  return labels[status];
}

export function paymentMethodLabel(method?: Pago["metodoPago"] | null) {
  if (!method) return null;
  const labels = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    DOMICILIACION: "Domiciliación",
    OTRO: "Otro",
  };
  return labels[method];
}

export function sortPayments(payments: Pago[]) {
  const priority: Record<EstadoPago, number> = {
    VENCIDO: 0,
    PENDIENTE: 1,
    PAGADO: 2,
    CANCELADO: 3,
  };

  return [...payments].sort((a, b) => {
    const statusDifference = priority[a.estado] - priority[b.estado];
    if (statusDifference !== 0) return statusDifference;

    if (a.estado === "PAGADO") {
      return String(b.fechaPago || "").localeCompare(String(a.fechaPago || ""));
    }
    if (a.estado === "CANCELADO") {
      return String(b.fechaActualizacion || "").localeCompare(
        String(a.fechaActualizacion || ""),
      );
    }
    return String(a.fechaVencimiento || "").localeCompare(
      String(b.fechaVencimiento || ""),
    );
  });
}
