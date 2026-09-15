export function crearFechaLocalDesdeKey(fechaKey: string) {
  return new Date(`${fechaKey}T00:00:00`);
}

export function crearFechaKeyLocal(fecha: Date) {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

export function normalizarFechaLocal(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function sumarDiasFechaLocal(fecha: Date, dias: number) {
  const nuevaFecha = normalizarFechaLocal(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  return nuevaFecha;
}

export function obtenerLunesSemanaLocal(fecha: Date) {
  const fechaNormalizada = normalizarFechaLocal(fecha);
  const desplazamiento = (fechaNormalizada.getDay() + 6) % 7;
  return sumarDiasFechaLocal(fechaNormalizada, -desplazamiento);
}

export function obtenerFechaKey(fechaHora?: string | null) {
  if (!fechaHora) {
    return "";
  }

  return fechaHora.split("T")[0];
}

export function obtenerHora(fechaHora?: string | null) {
  if (!fechaHora) {
    return "--:--";
  }

  return fechaHora.split("T")[1]?.slice(0, 5) || "";
}

export function formatearDia(fechaHora?: string | null) {
  if (!fechaHora) {
    return "Sin fecha";
  }

  const fecha = new Date(fechaHora);

  if (Number.isNaN(fecha.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(fecha);
}

export function formatearFechaCompleta(fechaHora?: string | null) {
  if (!fechaHora) {
    return "Sin fecha";
  }

  const fecha = new Date(fechaHora);

  if (Number.isNaN(fecha.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
}
