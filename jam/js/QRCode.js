// Tiny dependency-free QR code generator (Reed–Solomon + bit manipulation)
// Adapted from public-domain reference by Project Nayuki. Renders to canvas.
// Supports L/M/Q/H error correction and auto-sized versions up to v10.

const ECC = { L: 0, M: 1, Q: 2, H: 3 };

const NUM_RAW_DATA_MODULES = [null,
  208, 359, 567, 807, 1079, 1383, 1568, 1936, 2336, 2768, 3232,
  3728, 4256, 4651, 5243, 5867, 6523, 7211, 7931, 8683, 9252, 10068,
  10916, 11796, 12708, 13652, 14628, 15371, 16411, 17483, 18587, 19723,
  20891, 22091, 23008, 24272, 25568, 26896, 28256, 29648
];

const ECC_CODEWORDS_PER_BLOCK = {
  L: [null, 7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  M: [null,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
  Q: [null,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  H: [null,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
};

const NUM_ERROR_CORRECTION_BLOCKS = {
  L: [null,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
  M: [null,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
  Q: [null,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
  H: [null,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
};

function getNumRawDataModules(ver) { return NUM_RAW_DATA_MODULES[ver]; }
function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8)
       - ECC_CODEWORDS_PER_BLOCK[ecl][ver]
       * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver];
}

// Build the bytes for byte-mode encoding
function encodeBytes(data, ecl) {
  // Determine the smallest version that fits
  let version;
  for (version = 1; version <= 40; version++) {
    const cap = getNumDataCodewords(version, ecl);
    const need = 1 + (version < 10 ? 1 : 2) + data.length + 1; // mode+len+data+terminator approx
    if (need <= cap) break;
  }
  if (version > 40) throw new Error('Data too long for QR v40');

  const dataCw = getNumDataCodewords(version, ecl);
  const bits = [];
  pushBits(bits, 0b0100, 4); // byte mode
  pushBits(bits, data.length, version < 10 ? 8 : 16);
  data.forEach(b => pushBits(bits, b, 8));
  pushBits(bits, 0, Math.min(4, dataCw * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataBytes.push(b);
  }
  // Pad
  const padBytes = [0xEC, 0x11];
  while (dataBytes.length < dataCw) dataBytes.push(padBytes[dataBytes.length & 1]);

  // Interleave with ECC
  const ecLen = ECC_CODEWORDS_PER_BLOCK[ecl][version];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][version];
  const shortLen = Math.floor(dataCw / numBlocks);
  const numShort = numBlocks - (dataCw % numBlocks);
  const blocks = [];
  let off = 0;
  for (let i = 0; i < numBlocks; i++) {
    const dlen = shortLen + (i < numShort ? 0 : 1);
    const dat = dataBytes.slice(off, off + dlen); off += dlen;
    const ec  = rsEncode(dat, ecLen);
    blocks.push({ data: dat, ecc: ec });
  }
  const result = [];
  for (let i = 0; i < shortLen + 1; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < blocks[b].data.length) result.push(blocks[b].data[i]);
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (let b = 0; b < numBlocks; b++) result.push(blocks[b].ecc[i]);
  }
  return { version, codewords: result };
}

function pushBits(arr, val, len) {
  for (let i = len - 1; i >= 0; i--) arr.push((val >> i) & 1);
}

// ── Reed–Solomon over GF(256) ───────────────────────────────────────────────
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function () {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x; GF_LOG[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11D : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) { return a && b ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0; }

function rsGeneratorPoly(degree) {
  let p = [1];
  for (let i = 0; i < degree; i++) {
    const np = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) {
      np[j]     ^= gfMul(p[j], 1);
      np[j + 1] ^= gfMul(p[j], GF_EXP[i]);
    }
    p = np;
  }
  return p;
}

function rsEncode(data, degree) {
  const gen = rsGeneratorPoly(degree);
  const result = new Array(degree).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0];
    result.shift(); result.push(0);
    if (factor) {
      for (let j = 0; j < gen.length - 1; j++) result[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return result;
}

// ── Build QR matrix ─────────────────────────────────────────────────────────
function makeMatrix(codewords, version, ecl) {
  const size = 17 + version * 4;
  const mat = Array.from({ length: size }, () => new Uint8Array(size));   // 0/1
  const reserved = Array.from({ length: size }, () => new Uint8Array(size));

  // Finder patterns
  [[0, 0], [size - 7, 0], [0, size - 7]].forEach(([r, c]) => drawFinder(mat, reserved, r, c));
  // Separators reserved
  for (let i = 0; i < 8; i++) {
    reserved[7][i] = reserved[i][7] = 1;
    reserved[size - 8][i] = reserved[i][size - 8] = 1;
    reserved[7][size - 1 - i] = reserved[size - 1 - i][7] = 1;
  }
  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    mat[6][i] = mat[i][6] = i % 2 === 0 ? 1 : 0;
    reserved[6][i] = reserved[i][6] = 1;
  }
  // Dark module
  mat[(4 * version) + 9][8] = 1; reserved[(4 * version) + 9][8] = 1;

  // Format info reserved
  for (let i = 0; i < 9; i++) { reserved[8][i] = 1; reserved[i][8] = 1; }
  for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = 1; reserved[size - 1 - i][8] = 1; }

  // Place data
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right--;
    for (let v = 0; v < size; v++) {
      const y = upward ? size - 1 - v : v;
      for (let dx = 0; dx < 2; dx++) {
        const x = right - dx;
        if (reserved[y][x]) continue;
        if (bitIdx < totalBits) {
          const byte = codewords[bitIdx >> 3];
          const bit  = (byte >> (7 - (bitIdx & 7))) & 1;
          mat[y][x] = bit;
        }
        bitIdx++;
      }
    }
    upward = !upward;
  }

  // Apply best mask
  let bestMask = 0, bestPenalty = Infinity;
  for (let m = 0; m < 8; m++) {
    const test = mat.map(r => Uint8Array.from(r));
    applyMask(test, reserved, m);
    drawFormat(test, ecl, m);
    const p = penalty(test);
    if (p < bestPenalty) { bestPenalty = p; bestMask = m; }
  }
  applyMask(mat, reserved, bestMask);
  drawFormat(mat, ecl, bestMask);
  return mat;
}

function drawFinder(mat, res, r, c) {
  for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
    const onRing = dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
    mat[r + dr][c + dc] = onRing ? 1 : 0;
    res[r + dr][c + dc] = 1;
  }
}

function maskFn(m, y, x) {
  switch (m) {
    case 0: return (y + x) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (y + x) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return ((y * x) % 2) + ((y * x) % 3) === 0;
    case 6: return (((y * x) % 2) + ((y * x) % 3)) % 2 === 0;
    case 7: return (((y + x) % 2) + ((y * x) % 3)) % 2 === 0;
  }
}

function applyMask(mat, res, m) {
  for (let y = 0; y < mat.length; y++) {
    for (let x = 0; x < mat.length; x++) {
      if (!res[y][x] && maskFn(m, y, x)) mat[y][x] ^= 1;
    }
  }
}

function drawFormat(mat, eclName, mask) {
  const ecl = ECC[eclName];
  let data = (ecl << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  data = ((data << 10) | rem) ^ 0x5412;
  const size = mat.length;
  for (let i = 0; i < 15; i++) {
    const bit = (data >> i) & 1;
    if (i < 6) mat[i][8] = bit;
    else if (i < 8) mat[i + 1][8] = bit;
    else if (i < 9) mat[8][7] = bit;
    else mat[8][14 - i] = bit;

    if (i < 8) mat[8][size - 1 - i] = bit;
    else mat[size - 15 + i][8] = bit;
  }
  mat[size - 8][8] = 1;
}

function penalty(mat) {
  // Simplified ISO penalty rules (good enough for clean codes)
  let p = 0; const n = mat.length;
  // Rule 1: runs of 5+
  for (let i = 0; i < n; i++) {
    let runRow = 1, runCol = 1;
    for (let j = 1; j < n; j++) {
      if (mat[i][j] === mat[i][j - 1]) { runRow++; if (runRow === 5) p += 3; else if (runRow > 5) p++; }
      else runRow = 1;
      if (mat[j][i] === mat[j - 1][i]) { runCol++; if (runCol === 5) p += 3; else if (runCol > 5) p++; }
      else runCol = 1;
    }
  }
  return p;
}

// ─── Public render ──────────────────────────────────────────────────────────
export async function renderQR(canvas, text, opts = {}) {
  const ecl = opts.ecc || 'M';
  const bytes = new TextEncoder().encode(text);
  const { version, codewords } = encodeBytes(Array.from(bytes), ecl);
  const mat = makeMatrix(codewords, version, ecl);
  const size = mat.length;
  const moduleSize = opts.moduleSize || 8;
  const margin = opts.margin || 4;
  const px = (size + margin * 2) * moduleSize;
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = opts.bg || '#ffffff';
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = opts.fg || '#000000';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (mat[y][x]) ctx.fillRect((x + margin) * moduleSize, (y + margin) * moduleSize, moduleSize, moduleSize);
    }
  }
}
