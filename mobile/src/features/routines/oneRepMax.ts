export const ONE_RM_PERCENTAGES = [
  100,
  95,
  90,
  85,
  80,
  75,
  70,
  65,
  60,
  55,
  50,
  45,
  40,
  35,
  30,
] as const;

export const ONE_RM_REPS_BY_PERCENTAGE: Record<number, string> = {
  100: "1",
  95: "2-3",
  90: "3-4",
  85: "5-6",
  80: "7-8",
  75: "9-10",
  70: "10-12",
  65: "12-15",
  60: "15-20",
  55: "20-25",
  50: "25-30",
  45: "20+",
  40: "20+",
  35: "20+",
  30: "20+",
};

export type OneRepMaxResult = {
  peso: number;
  repeticiones: number;
  oneRepMax: number;
};

export type OneRepMaxErrors = Partial<
  Record<"peso" | "repeticiones", string>
>;

export type OneRepMaxValidation = {
  errors: OneRepMaxErrors;
  peso?: number;
  repeticiones?: number;
  isValid: boolean;
};

export function parseOneRepMaxWeight(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function sanitizeOneRepMaxWeightInput(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, "");
  const firstSeparator = cleaned.search(/[.,]/);

  if (firstSeparator === -1) {
    return cleaned;
  }

  return `${cleaned.slice(0, firstSeparator + 1)}${cleaned
    .slice(firstSeparator + 1)
    .replace(/[.,]/g, "")}`;
}

export function sanitizeOneRepMaxRepetitionInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function parseOneRepMaxRepetitions(value: string) {
  const normalized = value.trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function calculateOneRepMax(weightKg: number, repetitions: number) {
  if (repetitions === 1) {
    return weightKg;
  }

  return weightKg * (1 + repetitions / 30);
}

export function roundToHalfKg(value: number) {
  return Math.round(value * 2) / 2;
}

export function calculatePercentageLoad(
  oneRepMax: number,
  percentage: number,
) {
  return roundToHalfKg(oneRepMax * (percentage / 100));
}

export function formatKg(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(".", ",");
}

export function validateOneRepMaxInputs(
  weightInput: string,
  repetitionsInput: string,
): OneRepMaxValidation {
  const errors: OneRepMaxErrors = {};
  const peso = parseOneRepMaxWeight(weightInput);
  const repeticiones = parseOneRepMaxRepetitions(repetitionsInput);

  if (!weightInput.trim()) {
    errors.peso = "Introduce el peso levantado.";
  } else if (!Number.isFinite(peso) || peso <= 0) {
    errors.peso = "Introduce un peso válido mayor que 0.";
  }

  if (!repetitionsInput.trim()) {
    errors.repeticiones = "Introduce las repeticiones realizadas.";
  } else if (!Number.isFinite(repeticiones) || repeticiones <= 0) {
    errors.repeticiones = "Introduce un número entero mayor que 0.";
  } else if (repeticiones > 12) {
    errors.repeticiones =
      "Para obtener una estimación más fiable del 1RM, utiliza una serie de 1 a 12 repeticiones.";
  }

  return {
    errors,
    peso,
    repeticiones,
    isValid: Object.keys(errors).length === 0,
  };
}
