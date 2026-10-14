const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG encoder using Node's built-in zlib
function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(toCrc), 8 + len);
  return chunk;
}

function encodePNG(width, height, rgbaBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace
  const ihdrChunk = writeChunk('IHDR', ihdr);

  // Raw Scanlines with Filter type 0 (None)
  const rowBytes = width * 4;
  const scanlines = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + rowBytes)] = 0; // Filter 0
    rgbaBuffer.copy(scanlines, y * (1 + rowBytes) + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  // IDAT
  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = writeChunk('IDAT', compressed);

  // IEND
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Pixel Art Icon
function drawAlienIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    buf[idx] = r;
    buf[idx + 1] = g;
    buf[idx + 2] = b;
    buf[idx + 3] = a;
  }

  const cx = size / 2;
  const cy = size / 2;
  const rBase = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Background rounded container (Dark futuristic slate)
      if (dist <= rBase) {
        // Gradient dark background
        const grad = (y / size);
        const bgR = Math.floor(11 + 15 * grad);
        const bgG = Math.floor(15 + 25 * grad);
        const bgB = Math.floor(25 + 40 * grad);

        // Border ring glowing emerald/cyan
        if (dist >= rBase - (size * 0.04)) {
          setPixel(x, y, 16, 185, 129, 255); // Emerald glow border
        } else if (dist >= rBase - (size * 0.06)) {
          setPixel(x, y, 6, 182, 212, 255); // Cyan secondary ring
        } else {
          setPixel(x, y, bgR, bgG, bgB, 255);
        }
      }
    }
  }

  // Draw Pixel Alien Head / Biohazard symbol in the center
  const scale = size / 32;
  // 32x32 template map
  // 1: Green alien bio, 2: Cyan glow, 3: Purple toxin, 4: Orange eye
  const iconMatrix = [
    "................................",
    "...........22222222.............",
    ".........221111111122...........",
    "........21111111111112..........",
    ".......2111111111111112.........",
    "......211111111111111112........",
    ".....21111111111111111112.......",
    ".....21111111111111111112.......",
    "....2111144441111444411112......",
    "....2111444444114444441112......",
    "....2111443344114433441112......",
    "....2111443344114433441112......",
    ".....21114444111144441112.......",
    ".....21111111111111111112.......",
    "......211111133331111112........",
    ".......2111133333311112.........",
    "........21111333311112..........",
    ".........221111111122...........",
    "...........22111122.............",
    "..........2111111112............",
    ".........211111111112...........",
    "........2111.1111.1112..........",
    "........211...11...112..........",
    ".........22...22...22...........",
    "................................"
  ];

  const offsetX = Math.floor((size - 32 * scale) / 2);
  const offsetY = Math.floor((size - 25 * scale) / 2);

  for (let row = 0; row < iconMatrix.length; row++) {
    for (let col = 0; col < iconMatrix[row].length; col++) {
      const ch = iconMatrix[row][col];
      let color = null;
      if (ch === '1') color = [16, 185, 129]; // Emerald body
      else if (ch === '2') color = [6, 182, 212]; // Cyan edge
      else if (ch === '3') color = [168, 85, 247]; // Purple bio
      else if (ch === '4') color = [249, 115, 22]; // Orange glowing eyes

      if (color) {
        for (let py = 0; py < Math.ceil(scale); py++) {
          for (let px = 0; px < Math.ceil(scale); px++) {
            const rx = Math.floor(offsetX + col * scale + px);
            const ry = Math.floor(offsetY + row * scale + py);
            setPixel(rx, ry, color[0], color[1], color[2], 255);
          }
        }
      }
    }
  }

  return encodePNG(size, size, buf);
}

// Generate Icons
const outDir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), drawAlienIcon(192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), drawAlienIcon(512));

console.log('✅ Generated PWA Icons:');
console.log(' - ' + path.join(outDir, 'icon-192.png'));
console.log(' - ' + path.join(outDir, 'icon-512.png'));
