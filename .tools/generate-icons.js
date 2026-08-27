// Genera todos los iconos/favicons de LNX a partir del simbolo vectorial.
// Herramienta de build local: no se sirve como parte del sitio.
// Uso: node .tools/generate-icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const symbolSvgRaw = fs.readFileSync(path.join(ROOT, 'assets/brand/lnx-symbol.svg'), 'utf8');
const symbolInner = symbolSvgRaw
  .replace(/<\?xml[^>]*\?>/g, '')
  .replace(/<\/?svg[^>]*>/g, '')
  .replace(/<title[^>]*>.*?<\/title>/g, '');
const NAVY = '#031D42';
// El simbolo base usa relleno navy pensado para fondos claros. Para componerlo
// sobre los tiles navy de favicons/iconos, el monograma debe ir en claro
// (el acento cian se conserva igual porque ya contrasta sobre navy).
const symbolInnerOnDark = symbolInner.replace(/#031D42/g, '#F4F7FA');

function tileSvg(extraPaddingRatio) {
  // Envuelve el simbolo (que ya trae su propio margen interno) en un cuadrado
  // navy con un margen adicional, para iconos cuadrados de app/favicon.
  const scale = 1 - extraPaddingRatio;
  const offset = (512 * extraPaddingRatio) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${NAVY}"/>
    <g transform="translate(${offset},${offset}) scale(${scale})">
      ${symbolInnerOnDark}
    </g>
  </svg>`;
}

async function png(svg, size, outPath) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(path.join(ROOT, outPath));
  console.log('generado', outPath);
}

function buildIco(images) {
  // Empaqueta PNGs como entradas ICO (formato PNG-in-ICO, soportado por todos los navegadores modernos).
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const dirEntries = [];
  const dataChunks = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += img.png.length;
    dirEntries.push(entry);
    dataChunks.push(img.png);
  }
  return Buffer.concat([header, ...dirEntries, ...dataChunks]);
}

async function main() {
  const tile = tileSvg(0.12); // simbolo con margen adicional para iconos cuadrados
  const maskable = tileSvg(0.20); // mas margen: zona segura maskable

  await png(tile, 16, 'assets/icons/favicon-16x16.png');
  await png(tile, 32, 'assets/icons/favicon-32x32.png');
  await png(tile, 180, 'assets/icons/apple-touch-icon.png');
  await png(tile, 192, 'assets/icons/icon-192x192.png');
  await png(tile, 512, 'assets/icons/icon-512x512.png');
  await png(maskable, 512, 'assets/icons/maskable-icon-512x512.png');
  await png(tile, 150, 'assets/icons/mstile-150x150.png');

  // favicon.svg: version vectorial del icono cuadrado (misma fuente que las variantes PNG)
  fs.writeFileSync(path.join(ROOT, 'favicon.svg'), tile);

  // safari-pinned-tab.svg: mascara monocroma requerida por Safari (solo negro sobre transparente)
  const monoSymbol = symbolInner.replace(/fill="#[0-9A-Fa-f]+"/g, 'fill="#000000"');
  fs.writeFileSync(
    path.join(ROOT, 'assets/icons/safari-pinned-tab.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${monoSymbol}</svg>\n`
  );
  console.log('generado assets/icons/safari-pinned-tab.svg');

  // favicon.ico multi-resolucion (16 + 32) empaquetado a mano
  const png16 = await sharp(Buffer.from(tile), { density: 300 }).resize(16, 16).png().toBuffer();
  const png32 = await sharp(Buffer.from(tile), { density: 300 }).resize(32, 32).png().toBuffer();
  fs.writeFileSync(
    path.join(ROOT, 'favicon.ico'),
    buildIco([
      { size: 16, png: png16 },
      { size: 32, png: png32 },
    ])
  );
  console.log('generado favicon.ico');

  // Imagen social OG 1200x630: navy con simbolo centrado y wordmark simple
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${NAVY}"/>
    <g transform="translate(500,135) scale(0.7)">${symbolInnerOnDark}</g>
    <text x="600" y="560" text-anchor="middle" fill="#19B9ED" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" letter-spacing="10">LNX TECHNOLOGIES</text>
  </svg>`;
  await sharp(Buffer.from(ogSvg), { density: 200 })
    .resize(1200, 630)
    .png()
    .toFile(path.join(ROOT, 'assets/images/og-image-1200x630.png'));
  console.log('generado assets/images/og-image-1200x630.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
