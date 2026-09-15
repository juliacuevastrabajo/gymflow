import test from "node:test";
import assert from "node:assert/strict";

import {
  crearFechaKeyLocal,
  crearFechaLocalDesdeKey,
  formatearDia,
  formatearFechaCompleta,
  normalizarFechaLocal,
  obtenerFechaKey,
  obtenerHora,
  obtenerLunesSemanaLocal,
  sumarDiasFechaLocal,
} from "./classDateUtils.ts";

test("crea claves de fecha con el calendario local", () => {
  const fecha = new Date(2026, 7, 25, 23, 45);

  assert.equal(crearFechaKeyLocal(fecha), "2026-08-25");
  assert.equal(crearFechaKeyLocal(normalizarFechaLocal(fecha)), "2026-08-25");
  assert.equal(crearFechaKeyLocal(crearFechaLocalDesdeKey("2026-08-25")), "2026-08-25");
});

test("calcula semanas de lunes a domingo incluso entre meses", () => {
  const martes = crearFechaLocalDesdeKey("2026-09-01");
  const lunes = obtenerLunesSemanaLocal(martes);

  assert.equal(crearFechaKeyLocal(lunes), "2026-08-31");
  assert.equal(crearFechaKeyLocal(sumarDiasFechaLocal(lunes, 6)), "2026-09-06");
});

test("extrae fecha y hora de una sesión", () => {
  assert.equal(obtenerFechaKey("2026-08-25T18:30:00"), "2026-08-25");
  assert.equal(obtenerHora("2026-08-25T18:30:00"), "18:30");
  assert.equal(obtenerFechaKey(null), "");
  assert.equal(obtenerHora(undefined), "--:--");
});

test("las fechas vacías o inválidas muestran un fallback seguro", () => {
  assert.equal(formatearDia("fecha-invalida"), "Sin fecha");
  assert.equal(formatearFechaCompleta(null), "Sin fecha");
});
