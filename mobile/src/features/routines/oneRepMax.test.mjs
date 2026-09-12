import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOneRepMax,
  calculatePercentageLoad,
  formatKg,
  parseOneRepMaxRepetitions,
  parseOneRepMaxWeight,
  roundToHalfKg,
  sanitizeOneRepMaxRepetitionInput,
  sanitizeOneRepMaxWeightInput,
  validateOneRepMaxInputs,
} from "./oneRepMax.ts";

test("interpreta pesos enteros y decimales con punto o coma", () => {
  assert.equal(parseOneRepMaxWeight("60"), 60);
  assert.equal(parseOneRepMaxWeight("60.5"), 60.5);
  assert.equal(parseOneRepMaxWeight("60,5"), 60.5);
});

test("sanea caracteres no permitidos sin añadir separadores", () => {
  assert.equal(sanitizeOneRepMaxWeightInput("6a0,5kg"), "60,5");
  assert.equal(sanitizeOneRepMaxWeightInput("60.5,2"), "60.52");
  assert.equal(sanitizeOneRepMaxRepetitionInput("1a2 reps"), "12");
});

test("rechaza peso vacío, cero, negativo o no numérico", () => {
  assert.equal(validateOneRepMaxInputs("", "5").errors.peso, "Introduce el peso levantado.");
  assert.equal(
    validateOneRepMaxInputs("0", "5").errors.peso,
    "Introduce un peso válido mayor que 0.",
  );
  assert.equal(
    validateOneRepMaxInputs("-20", "5").errors.peso,
    "Introduce un peso válido mayor que 0.",
  );
});

test("valida repeticiones vacías, cero y superiores a doce", () => {
  assert.equal(
    validateOneRepMaxInputs("60", "").errors.repeticiones,
    "Introduce las repeticiones realizadas.",
  );
  assert.equal(
    validateOneRepMaxInputs("60", "0").errors.repeticiones,
    "Introduce un número entero mayor que 0.",
  );
  assert.equal(
    validateOneRepMaxInputs("60", "13").errors.repeticiones,
    "Para obtener una estimación más fiable del 1RM, utiliza una serie de 1 a 12 repeticiones.",
  );
  assert.ok(Number.isNaN(parseOneRepMaxRepetitions("")));
});

test("una repetición devuelve exactamente el mismo peso", () => {
  assert.equal(calculateOneRepMax(82.5, 1), 82.5);
});

test("mantiene la fórmula de Epley para varias repeticiones", () => {
  assert.equal(calculateOneRepMax(60, 5), 70);
  assert.equal(calculateOneRepMax(90, 10), 120);
});

test("redondea cargas al múltiplo de medio kilo más cercano", () => {
  assert.equal(roundToHalfKg(63.24), 63);
  assert.equal(roundToHalfKg(63.25), 63.5);
  assert.equal(roundToHalfKg(63.76), 64);
});

test("calcula cargas porcentuales usando el mismo redondeo", () => {
  assert.equal(calculatePercentageLoad(100, 85), 85);
  assert.equal(calculatePercentageLoad(87, 70), 61);
});

test("formatea kilos sin decimales innecesarios", () => {
  assert.equal(formatKg(80), "80");
  assert.equal(formatKg(80.5), "80,5");
  assert.equal(formatKg(80.04), "80");
});
