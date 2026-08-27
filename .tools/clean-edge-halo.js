// Limpia el halo fantasma (fragmentos aislados de pixeles semi-transparentes,
// residuo del removedor de fondo a cuadros) que quedan flotando cerca del
// contorno de la silueta principal, aunque su alpha individual sea alta.
//
// Estrategia: cualquier pixel con alpha > 0 pertenece a algun componente
// conectado (8-conexo). El dispositivo + el papel forman un unico componente
// enorme. Cualquier otro componente (los puntos del halo) esta desconectado
// de ese componente principal, sin importar su valor de alpha individual, asi
// que se elimina por completo.
const sharp = require('sharp');
const path = require('path');

async function cleanEdgeHalo(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const total = width * height;

  const labels = new Int32Array(total).fill(-1);
  const alphaAt = (i) => data[i * channels + 3];

  let largestLabel = -1;
  let largestSize = 0;
  let nextLabel = 0;
  const stack = new Int32Array(total);

  for (let start = 0; start < total; start++) {
    if (alphaAt(start) === 0 || labels[start] !== -1) continue;

    let sp = 0;
    stack[sp++] = start;
    labels[start] = nextLabel;
    let size = 0;

    while (sp > 0) {
      const idx = stack[--sp];
      size++;
      const x = idx % width;
      const y = (idx / width) | 0;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const nIdx = ny * width + nx;
          if (labels[nIdx] === -1 && alphaAt(nIdx) > 0) {
            labels[nIdx] = nextLabel;
            stack[sp++] = nIdx;
          }
        }
      }
    }

    if (size > largestSize) {
      largestSize = size;
      largestLabel = nextLabel;
    }
    nextLabel++;
  }

  const output = Buffer.from(data);
  let cleared = 0;
  for (let i = 0; i < total; i++) {
    if (labels[i] !== -1 && labels[i] !== largestLabel) {
      output[i * channels + 3] = 0;
      cleared++;
    }
  }

  await sharp(output, { raw: { width, height, channels } }).png().toFile(outputPath);
  console.log(path.basename(inputPath), '-> components:', nextLabel, '| main size:', largestSize, '| stray pixels cleared:', cleared);
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error('Uso: node clean-edge-halo.js <archivo1.png> [archivo2.png...]');
  process.exit(1);
}

(async () => {
  for (const input of inputs) {
    const ext = path.extname(input);
    const outputPath = input.replace(ext, `-clean${ext}`);
    await cleanEdgeHalo(input, outputPath);
  }
})();
