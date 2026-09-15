type HslColor = {
  h: number;
  s: number;
  l: number;
};

export function normalizarHex(hex: string, fallback = "#000000") {
  const limpio = hex.trim().replace("#", "");

  if (/^[0-9a-fA-F]{6}$/.test(limpio)) {
    return `#${limpio.toUpperCase()}`;
  }

  return fallback;
}

function limitarNumero(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo);
}

export function hexToHsl(hex: string): HslColor {
  const normalizado = normalizarHex(hex);
  const numero = parseInt(normalizado.replace("#", ""), 16);
  const r = ((numero >> 16) & 255) / 255;
  const g = ((numero >> 8) & 255) / 255;
  const b = (numero & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h = 0;

  if (max === r) {
    h = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  return {
    h: Math.round(h * 60),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function obtenerColorContraste(hex: string) {
  const normalizado = normalizarHex(hex);
  const numero = parseInt(normalizado.replace("#", ""), 16);
  const r = (numero >> 16) & 255;
  const g = (numero >> 8) & 255;
  const b = numero & 255;
  const luminosidad = (r * 299 + g * 587 + b * 114) / 1000;

  return luminosidad > 150 ? "#0F172A" : "#FFFFFF";
}

export function colorConAlpha(hex: string, alphaHex: string) {
  return `${normalizarHex(hex)}${alphaHex}`;
}

export function mezclarColores(color: string, destino: string, pesoDestino: number) {
  const origenSeguro = normalizarHex(color);
  const destinoSeguro = normalizarHex(destino);
  const peso = limitarNumero(pesoDestino, 0, 1);
  const origenNumero = parseInt(origenSeguro.replace("#", ""), 16);
  const destinoNumero = parseInt(destinoSeguro.replace("#", ""), 16);
  const origen = [
    (origenNumero >> 16) & 255,
    (origenNumero >> 8) & 255,
    origenNumero & 255,
  ];
  const objetivo = [
    (destinoNumero >> 16) & 255,
    (destinoNumero >> 8) & 255,
    destinoNumero & 255,
  ];

  return `#${origen
    .map((canal, index) =>
      Math.round(canal * (1 - peso) + objetivo[index] * peso)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}
