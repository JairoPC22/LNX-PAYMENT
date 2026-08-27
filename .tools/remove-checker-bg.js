// Convierte el fondo de cuadros (gris/blanco, opaco) de imagenes tipo POS*.png
// en transparencia real, sin confundirlo con objetos blancos reales (como el
// papel del recibo), que tienen un tono muy similar al del fondo.
//
// Estrategia:
// 1. Clasifica cada pixel como "tono claro de cuadro", "tono oscuro de
//    cuadro" o "ninguno" (umbral amplio, tolera ruido de compresion).
// 2. Flood-fill desde los bordes de la imagen, avanzando por pixeles que
//    sean CUALQUIERA de los dos tonos (esto conecta el ajedrezado real sin
//    romperse por ruido).
// 3. Antes de borrar un pixel alcanzado por el flood-fill, revisa una
//    ventana local a su alrededor: si esa ventana tiene una mezcla real de
//    ambos tonos (como un ajedrezado autentico), se borra. Si la ventana es
//    casi enteramente de un solo tono (como una hoja de papel blanca lisa),
//    se conserva aunque el flood-fill haya llegado hasta ahi.
//
// Uso: node .tools/remove-checker-bg.js archivo1.png archivo2.png ...
// (rutas relativas a la raiz del proyecto). Genera <nombre>-transparent.png
// junto a cada archivo de entrada.
const sharp = require('sharp');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TONE_TOLERANCE = 10; // margen extra mas alla del punto medio light/dark
const MIN_MIX_RATIO = 0.12; // % minimo del tono minoritario para considerarse "ajedrezado real"

function luminance(r, g, b) {
  return (r + g + b) / 3;
}

function isDesaturated(r, g, b, maxSpread) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min <= maxSpread;
}

function detectCellSize(data, width, channels, sampleY, maxScan) {
  let prev = null;
  let runStart = 0;
  const runs = [];
  for (let x = 0; x < maxScan; x++) {
    const i = (sampleY * width + x) * channels;
    const v = luminance(data[i], data[i + 1], data[i + 2]);
    const bucket = v > 248 ? 'light' : 'dark';
    if (prev === null) {
      prev = bucket;
      runStart = x;
    } else if (bucket !== prev) {
      runs.push(x - runStart);
      runStart = x;
      prev = bucket;
    }
  }
  let lightSum = 0;
  let lightN = 0;
  let darkSum = 0;
  let darkN = 0;
  for (let x = 0; x < maxScan; x++) {
    const i = (sampleY * width + x) * channels;
    const v = luminance(data[i], data[i + 1], data[i + 2]);
    if (v > 248) {
      lightSum += v;
      lightN++;
    } else {
      darkSum += v;
      darkN++;
    }
  }
  runs.sort((a, b) => a - b);
  const cellSize = runs.length ? runs[Math.floor(runs.length / 2)] : 16;
  return {
    cellSize: cellSize || 16,
    light: lightN ? lightSum / lightN : 253,
    dark: darkN ? darkSum / darkN : 243,
  };
}

async function processImage(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const { cellSize, light, dark } = detectCellSize(data, width, channels, 2, Math.min(200, width));
  console.log(`  patron detectado: celda=${cellSize}px, claro=${light.toFixed(1)}, oscuro=${dark.toFixed(1)}`);

  // tone: 1 = claro de cuadro, -1 = oscuro de cuadro, 0 = ninguno (foreground).
  // Clasifica por CERCANIA (al tono claro o al oscuro), no por rangos fijos
  // que pueden solaparse cuando light y dark estan cerca entre si.
  const midTone = (light + dark) / 2;
  const halfGap = Math.abs(light - dark) / 2;
  const tone = new Int8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const p = i * channels;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      if (!isDesaturated(r, g, b, 12)) continue;
      const v = luminance(r, g, b);
      const distFromMid = Math.abs(v - midTone);
      if (distFromMid > halfGap + TONE_TOLERANCE) continue; // muy lejos de ambos tonos
      tone[i] = v >= midTone ? 1 : -1;
    }
  }

  // Flood-fill desde los bordes por cualquier pixel con tono != 0.
  const reached = new Uint8Array(width * height);
  const stack = [];
  function idx(x, y) {
    return y * width + x;
  }
  for (let x = 0; x < width; x++) {
    stack.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    stack.push([0, y], [width - 1, y]);
  }
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const i = idx(x, y);
    if (reached[i] || tone[i] === 0) continue;
    reached[i] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Suma de area (integral image) de "claro" y "oscuro" para consultar
  // ventanas locales en O(1) y decidir si de verdad hay mezcla de ambos
  // tonos (ajedrezado real) o es un objeto blanco liso (papel).
  const W = width + 1;
  const lightSum = new Int32Array(W * (height + 1));
  const darkSum = new Int32Array(W * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowLight = 0;
    let rowDark = 0;
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (tone[i] === 1) rowLight++;
      if (tone[i] === -1) rowDark++;
      const o = (y + 1) * W + (x + 1);
      lightSum[o] = lightSum[o - W] + rowLight;
      darkSum[o] = darkSum[o - W] + rowDark;
    }
  }
  function windowCounts(cx, cy, radius) {
    const x0 = Math.max(0, cx - radius);
    const y0 = Math.max(0, cy - radius);
    const x1 = Math.min(width, cx + radius + 1);
    const y1 = Math.min(height, cy + radius + 1);
    const l = lightSum[y1 * W + x1] - lightSum[y0 * W + x1] - lightSum[y1 * W + x0] + lightSum[y0 * W + x0];
    const d = darkSum[y1 * W + x1] - darkSum[y0 * W + x1] - darkSum[y1 * W + x0] + darkSum[y0 * W + x0];
    return { l, d };
  }

  const radius = Math.round(cellSize * 1.6);
  let removed = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (!reached[i]) continue;
      const { l, d } = windowCounts(x, y, radius);
      const total = l + d;
      if (total === 0) continue;
      const minorityRatio = Math.min(l, d) / total;
      if (minorityRatio >= MIN_MIX_RATIO) {
        data[i * channels + 3] = 0;
        removed++;
      }
    }
  }
  console.log(`  pixeles removidos: ${removed} de ${width * height}`);

  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log('generado', outputPath);
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.log('Uso: node .tools/remove-checker-bg.js ruta/a/imagen1.png [imagen2.png ...]');
    process.exit(1);
  }
  for (const file of files) {
    const inputPath = path.resolve(ROOT, file);
    const ext = path.extname(inputPath);
    const outputPath = inputPath.replace(ext, `-transparent${ext}`);
    console.log('procesando', file);
    await processImage(inputPath, outputPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
