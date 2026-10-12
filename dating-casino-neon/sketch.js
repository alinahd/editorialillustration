// THE DATING-APP CASINO — NEON ROSE
// A roulette table reimagined as a dating app, seen from above, playing itself.
// Pinks, burgundy, magenta and gold under neon: a felt table in a dark room,
// a gold wheel, thick glossy cards, everything lit from the upper left.
//
// The game follows roulette: one chip is bet on a profile; the wheel has 24
// pockets, two per profile (numbered 1–12, like the cards' corner numbers), so
// every bet has a 1-in-12 chance. The ball's pocket decides the winning
// profile: its card lifts out of the table, then the outcome is stamped on it.
// If it is the profile you bet on: MATCH, then REPLY or GHOSTED. If not:
// NO MATCH, and the house sweeps the chips.
//
// The rounds are a fixed script so the loop is seamless and every frame agrees
// with itself: the wheel turns exactly two revolutions per round, and the
// ball's path is solved backwards from the scripted pocket.

const W = 1600, H = 900;

const C = {
  felt: '#3a0620',
  feltD: '#12010a',
  pink: '#ff7ad9',      // neon tube
  magenta: '#e0198f',
  hot: '#ff2b8a',
  burgundy: '#3a0620',
  ivory: '#fff4f0',
  ink: '#2a0716',
  gold: '#f0c25a',
  goldD: '#9a6a1e',
};

const PROFILES = [
  { name: 'Maya', age: 29, cap: 'Will steal your fries', skin: '#e8b98a', skinD: '#c99466', hair: '#2b1b17', style: 'long', shirt: '#d61f3a', bg: '#f6d7d0', eye: '#4a2a18', mouth: 'grin', brow: 'arched', tilt: -0.06 },
  { name: 'Theo', age: 31, cap: 'Plants > people', skin: '#f3d2b8', skinD: '#d9ab8c', hair: '#a5521c', style: 'swoop', shirt: '#2f4a3a', bg: '#f1e2c8', eye: '#3c6a4a', mouth: 'smirk', brow: 'tilt', tilt: 0.05, glasses: true },
  { name: 'Priya', age: 27, cap: 'Fluent in sarcasm', skin: '#b97a4a', skinD: '#995f34', hair: '#15100e', style: 'bun', shirt: '#7c0f37', bg: '#f3d0da', eye: '#2a1a10', mouth: 'smirk', brow: 'raised', tilt: 0.04, earrings: true },
  { name: 'Sam', age: 30, cap: 'Looking for player 2', skin: '#7a4a2a', skinD: '#5e361d', hair: '#15100e', style: 'fade', shirt: '#e2a33a', bg: '#f7e3cf', eye: '#2a1a10', mouth: 'laugh', brow: 'up', tilt: -0.03, beard: true },
  { name: 'Inès', age: 26, cap: 'Here for the dogs', skin: '#d9a273', skinD: '#b9834f', hair: '#5a3423', style: 'waves', shirt: '#f4cfd8', bg: '#e9d3f0', eye: '#5a3a1a', mouth: 'smile', brow: 'soft', tilt: 0.07 },
  { name: 'Marcus', age: 33, cap: 'Gym, brunch, repeat', skin: '#5c3a22', skinD: '#432815', hair: '#120c0a', style: 'buzz', shirt: '#2a3f7a', bg: '#f2d6c4', eye: '#2a1a10', mouth: 'grin', brow: 'flat', tilt: 0 },
  { name: 'Lena', age: 28, cap: 'Ask me about tarot', skin: '#f3d6c2', skinD: '#dcb39a', hair: '#8e2b55', style: 'bob', shirt: '#2a0b18', bg: '#f7dbe2', eye: '#3a5a7a', mouth: 'soft', brow: 'arched', tilt: -0.08, earrings: true },
  { name: 'Kofi', age: 32, cap: 'Bad at texting back', skin: '#5a3620', skinD: '#3f2413', hair: '#120c0a', style: 'curly', shirt: '#f2b8a8', bg: '#f4e0c9', eye: '#2a1a10', mouth: 'smirk', brow: 'tilt', tilt: 0.06 },
  { name: 'Rosa', age: 25, cap: 'Swipe right for memes', skin: '#c58a5c', skinD: '#a46a3f', hair: '#2b1b17', style: 'curlylong', shirt: '#22604a', bg: '#f9d9cf', eye: '#3a2412', mouth: 'laugh', brow: 'up', tilt: -0.05 },
  { name: 'Jun', age: 29, cap: "Will cook, won't call", skin: '#efcfa6', skinD: '#d2ad80', hair: '#15100e', style: 'swoop', shirt: '#d61f3a', bg: '#eedbd2', eye: '#2a1a10', mouth: 'soft', brow: 'flat', tilt: 0.03, glasses: true },
  { name: 'Amira', age: 30, cap: 'Just here to see', skin: '#d4a074', skinD: '#b47f52', hair: '#3a5a7a', style: 'hijab', shirt: '#3a5a7a', bg: '#f6dfd6', eye: '#3a2412', mouth: 'smile', brow: 'raised', tilt: -0.04 },
  { name: 'Eli', age: 27, cap: "6'0 (I'm 5'9)", skin: '#f4d8c0', skinD: '#dbb495', hair: '#d9b36a', style: 'waves', shirt: '#2a0b18', bg: '#f3e6cf', eye: '#4a7a9a', mouth: 'grin', brow: 'up', tilt: 0.05 },
];

const OUTCOMES = ['MATCH', 'REPLY', 'GHOSTED'];

// 24 pockets, each profile twice, never side by side
const POCKETS = [0, 7, 2, 9, 4, 11, 1, 6, 3, 10, 5, 8, 9, 3, 11, 0, 6, 2, 8, 4, 10, 1, 7, 5];
const NP = POCKETS.length, STEP = (Math.PI * 2) / NP;

// the script: bet (profile), landing pocket, and the follow-up when it matches
const ROUNDS = [
  { bet: 0, pocket: 6 },                                               // bet Maya, ball finds Theo
  { bet: 7, pocket: 1, follow: 'They replied.', box: 1 },              // Kofi, Kofi
  { bet: 6, pocket: 12 },                                              // Lena, ball finds Jun
  { bet: 4, pocket: 19, follow: 'They replied. Eventually.', box: 1 }, // Inès, Inès
  { bet: 2, pocket: 23 },                                              // Priya, ball finds Marcus
  { bet: 11, pocket: 14, follow: 'Great date. Then ghosted.', box: 2 }, // Eli, Eli
];

// ---------------------------------------------------------------- timing
// the wheel stops at SPIN1; the card lifts over the next half second, then the
// result is stamped on it (RESULT), then what happened next (FOLLOW)

const CHIP_IN = 0.2, SPIN0 = 1.0, SPIN1 = 5.0, LIFT = 0.55, RESULT = 5.8, FOLLOW = 6.9, FADE_IN = 0.35, HOLD = 3, CLEAR = 0.7;
ROUNDS.forEach(r => {
  r.won = POCKETS[r.pocket] === r.bet;
  r.shown = (r.won ? FOLLOW : RESULT) + FADE_IN;   // result fully on screen
  r.clear = r.shown + HOLD;                         // ...held for three seconds
  r.dur = r.clear + CLEAR;
});
const STARTS = [];
let LOOP = 0;
ROUNDS.forEach(r => { STARTS.push(LOOP); LOOP += r.dur; });

// sanity: the script must agree with itself
ROUNDS.forEach((r, i) => {
  if (r.won !== Boolean(r.follow)) console.warn(`round ${i + 1}: follow-up does not match the pocket`);
});

// ---------------------------------------------------------------- layout

const WC = { x: 400, y: 456 };
const R = { rim: 352, rimIn: 312, track: 312, trackIn: 270, turn: 268, numOut: 262, numIn: 238, pktIn: 200, cone: 196, hub: 62 };
const R_BALL_TRACK = 290, R_SEAT = 220;
const GRID = { x: 784, y: 74, cw: 180, ch: 184, gx: 14, gy: 12 };
const GRID_W = 4 * GRID.cw + 3 * GRID.gx, GRID_H = 3 * GRID.ch + 2 * GRID.gy;
const OUT = { x: 784, y: 676, h: 70 };
const RESULT_Y = 806;
const THICK = 6; // card thickness
const EDGE_INSET = 9; // the edge tube's distance from the picture's edge, in screen pixels

const cardRect = i => ({ x: GRID.x + (i % 4) * (GRID.cw + GRID.gx), y: GRID.y + floor(i / 4) * (GRID.ch + GRID.gy), w: GRID.cw, h: GRID.ch });
const outRect = i => ({ x: OUT.x + (i * GRID_W) / OUTCOMES.length, y: OUT.y, w: GRID_W / OUTCOMES.length, h: OUT.h });

// ---------------------------------------------------------------- state

let sc = 1, offX = 0, offY = 0, pd = 1;
let portraits = [], cardsG = [], tableG, wheelG, ready = false, rebuild = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pd = pixelDensity();
  fit();
  Promise.all(['700 16px "Playfair Display"', '800 16px "Playfair Display"', 'italic 600 16px "Playfair Display"',
    '400 12px Inter', '600 12px Inter'].map(f => document.fonts.load(f))).catch(() => {}).then(() => {
    buildAll();
    ready = true;
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fit();
  clearTimeout(rebuild);
  rebuild = setTimeout(() => ready && buildAll(), 200);
}

function fit() {
  sc = min(width / W, height / H);
  offX = (width - W * sc) / 2;
  offY = (height - H * sc) / 2;
}

function buildAll() {
  if (width < 2 || height < 2) return;
  [tableG, wheelG, ...portraits, ...cardsG].forEach(g => g && g.remove());
  portraits = PROFILES.map(drawPortrait);
  cardsG = PROFILES.map((_, i) => buildCard(i));
  wheelG = buildWheel();
  tableG = buildTable();
}

// ---------------------------------------------------------------- timeline helpers

const clamp01 = x => constrain(x, 0, 1);
const easeOutCubic = x => 1 - pow(1 - x, 3);
const easeInCubic = x => x * x * x;
const mod = (a, m) => ((a % m) + m) % m;
const TURN = Math.PI * 4;          // two revolutions per round
const BASE = 0.1;                  // idle drift between spins
const spinEase = x => 1 - pow(1 - pow(x, 1.6), 3);

function wheelAngle(k, u) {
  const bump = TURN - BASE * ROUNDS[k].dur;
  return k * TURN + BASE * u + bump * spinEase(clamp01((u - SPIN0) / (SPIN1 - SPIN0)));
}

const pocketPhi = i => (i + 0.5) * STEP;

function ballState(k, u) {
  const prev = pocketPhi(ROUNDS[mod(k - 1, ROUNDS.length)].pocket), next = pocketPhi(ROUNDS[k].pocket);
  const L0 = 1.2;
  if (u < L0) return { phi: prev, r: R_SEAT, air: 0 };
  if (u >= SPIN1) return { phi: next, r: R_SEAT, air: 0 };
  const x = (u - L0) / (SPIN1 - L0);
  const D = mod(prev - next, TWO_PI) + TWO_PI * 4;
  const phi = prev - D * (1 - pow(1 - x, 2.4));
  let r = R_BALL_TRACK, air = 0;
  if (u < L0 + 0.25) r = lerp(R_SEAT, R_BALL_TRACK, easeOutCubic((u - L0) / 0.25));
  else if (u > 4.0) {
    const y = clamp01((u - 4.0) / 0.85);
    air = abs(sin(y * PI * 3)) * (1 - y);
    r = lerp(R_BALL_TRACK, R_SEAT, easeOutCubic(y)) + air * 12;
  }
  return { phi, r, air };
}


// ---------------------------------------------------------------- frame

// how far the ball's card has lifted out of the table (0–1)
function liftAmount(Rd, u) {
  return easeOutCubic(clamp01((u - SPIN1) / LIFT)) * (1 - easeInCubic(clamp01((u - Rd.clear) / 0.6)));
}

// where a lifted card sits: a little bigger, drawn toward the middle of the grid
function cardPose(i, L) {
  const r = cardRect(i);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const gx = GRID.x + GRID_W / 2, gy = GRID.y + GRID_H / 2;
  return { x: lerp(cx, gx, 0.3 * L), y: lerp(cy, gy, 0.3 * L) - 10 * L, s: 1 + 0.34 * L };
}

function draw() {
  if (!ready || !tableG) { background(C.feltD); return; }
  // window.__T pins the clock for testing; normally the loop runs on real time
  const t = mod(window.__T ?? millis() / 1000, LOOP);
  let k = 0;
  while (k < ROUNDS.length - 1 && t >= STARTS[k + 1]) k++;
  const u = t - STARTS[k], Rd = ROUNDS[k];
  const win = POCKETS[Rd.pocket];

  drawingContext.drawImage(tableG.elt, 0, 0, width, height);

  push();
  translate(offX, offY);
  scale(sc);
  const ctx = drawingContext;

  // highlight envelope: on at the settle, off when the round clears
  const lit = clamp01((u - SPIN1) / 0.3) * (1 - clamp01((u - Rd.clear) / 0.5));
  const L = liftAmount(Rd, u);

  // the other profiles sink back into the dark
  if (lit > 0) {
    ctx.fillStyle = `rgba(18,1,10,${0.6 * lit})`;
    for (let i = 0; i < PROFILES.length; i++) {
      if (i === win) continue;
      if (i === Rd.bet) continue; // your own bet stays in view, marked below
      const r = cardRect(i);
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h + THICK, 12);
      ctx.fill();
    }
  }

  // wheel
  const wa = wheelAngle(k, u);
  push();
  translate(WC.x, WC.y);
  rotate(wa);
  image(wheelG, -R.turn, -R.turn, R.turn * 2, R.turn * 2);
  pop();
  wheelLight();
  if (lit > 0) pocketHighlight(wa + pocketPhi(Rd.pocket), lit);
  const b = ballState(k, u);
  drawBall(WC.x + cos(wa + b.phi) * b.r, WC.y + sin(wa + b.phi) * b.r, b.air);
  spindle(wa);

  // the ball's profile lifts out of the table; a winning bet's chips ride on it
  if (!Rd.won) drawChips(Rd, u, 0);
  if (!Rd.won) betMarker(Rd, u);
  if (L > 0) liftedCard(win, L, Rd, u);
  if (Rd.won) drawChips(Rd, u, L);

  outcomeLights(Rd, u);
  drawResult(Rd, u);
  pop();
}

// ---------------------------------------------------------------- the room and table (static)

function buildTable() {
  const g = createGraphics(width, height);
  g.pixelDensity(pd);
  const ctx = g.drawingContext;
  feltRoom(ctx, width, height);

  g.push();
  g.translate(offX, offY);
  g.scale(sc);
  const k = sc * pd; // shadows are measured in device pixels

  // the wheel floats over the felt on a soft shadow, ringed in pink neon
  ctx.save();
  ctx.shadowColor = 'rgba(8,0,4,0.75)';
  ctx.shadowBlur = 70 * k;
  ctx.shadowOffsetX = 10 * k;
  ctx.shadowOffsetY = 26 * k;
  ctx.fillStyle = '#1a020c';
  ctx.beginPath(); ctx.arc(WC.x, WC.y, R.rim, 0, TWO_PI); ctx.fill();
  ctx.restore();
  neonStroke(ctx, k, () => { ctx.beginPath(); ctx.arc(WC.x, WC.y, R.rim + 14, 0, TWO_PI); });
  bowl(g);

  // a neon tube frames the betting layout
  neonStroke(ctx, k, () => { ctx.beginPath(); ctx.roundRect(GRID.x - 20, GRID.y - 20, GRID_W + 40, GRID_H + 40, 22); });

  // title, in gold neon
  ctx.save();
  ctx.font = '700 26px "Playfair Display"';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(255,200,90,0.9)';
  ctx.shadowBlur = 14 * k;
  ctx.fillStyle = '#ffe3a0';
  ctx.fillText('The Dating-App Casino', GRID.x - 18, 40);
  ctx.shadowBlur = 0;
  ctx.font = '600 13px Inter';
  ctx.textAlign = 'right';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.fillStyle = 'rgba(255,190,230,0.85)';
  ctx.fillText('A FICTIONAL SIMULATION', GRID.x + GRID_W - 30, 38); // kept clear of the edge tube's rounded corner
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();

  // cards rest on the felt with soft shadows
  for (let i = 0; i < PROFILES.length; i++) {
    const r = cardRect(i);
    cardShadow(ctx, r.x, r.y, r.w, r.h, k, 0);
    g.image(cardsG[i], r.x, r.y, r.w, r.h + THICK);
  }
  OUTCOMES.forEach((o, i) => tile(ctx, outRect(i), o, 0, k));
  g.pop();
  return g;
}

function neonStroke(ctx, k, pathFn) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,60,190,0.35)';
  ctx.shadowColor = 'rgba(255,60,200,0.95)';
  ctx.shadowBlur = 26 * k;
  pathFn();
  ctx.stroke();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#ffd0f2';
  ctx.shadowBlur = 8 * k;
  pathFn();
  ctx.stroke();
  ctx.restore();
}

// burgundy felt in a dark room: a pool of pink light, fine nap, a neon tube
// around the edge of the picture, a few glints
function feltRoom(ctx, w, h) {
  ctx.save();
  let gr = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.5, max(w, h) * 0.75);
  gr.addColorStop(0, '#6e0f3c');
  gr.addColorStop(0.5, '#3a0620');
  gr.addColorStop(1, '#12010a');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
  // felt nap: thousands of tiny fibres, light and dark
  randomSeed(5);
  const n = (w * h) / 14;
  for (let i = 0; i < n; i++) {
    const x = random(w), y = random(h), a = random(TWO_PI), l = random(0.8, 2.6);
    ctx.strokeStyle = random() < 0.5 ? `rgba(255,170,210,${random(0.03, 0.07)})` : `rgba(10,0,6,${random(0.05, 0.12)})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + cos(a) * l, y + sin(a) * l);
    ctx.stroke();
  }
  // a glowing neon tube around the edge, its corners rounded to match the
  // rounded window the page shows this in (border-radius 40px in site-neon.html),
  // so no dark square corners poke out beyond it
  neonStroke(ctx, sc * pd, () => { ctx.beginPath(); ctx.roundRect(EDGE_INSET, EDGE_INSET, w - 2 * EDGE_INSET, h - 2 * EDGE_INSET, 40 - EDGE_INSET); });
  // vignette
  gr = ctx.createRadialGradient(w / 2, h / 2, max(w, h) * 0.35, w / 2, h / 2, max(w, h) * 0.8);
  gr.addColorStop(0, 'rgba(8,0,4,0)');
  gr.addColorStop(1, 'rgba(8,0,4,0.55)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, w, h);
  // glints
  for (let i = 0; i < 9; i++) {
    const x = random(w), y = random(h), r = random(6, 13) * max(0.6, sc);
    const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
    gl.addColorStop(0, 'rgba(255,230,245,0.5)');
    gl.addColorStop(1, 'rgba(255,230,245,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
    ctx.fillStyle = i % 3 ? '#fff4fb' : '#ffe0a0';
    ctx.beginPath();
    for (let j = 0; j < 8; j++) {
      const a = (j * PI) / 4, rr = j % 2 ? r * 0.1 : j % 4 ? r * 0.55 : r;
      ctx.lineTo(x + rr * cos(a), y + rr * sin(a));
    }
    ctx.closePath();
    ctx.fill();
  }
  randomSeed();
  ctx.restore();
}

function bowl(g) {
  const ctx = g.drawingContext;
  const ring = (r0, r1, stops) => {
    const gr = ctx.createRadialGradient(WC.x, WC.y, r1, WC.x, WC.y, r0);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(WC.x, WC.y, r0, 0, TWO_PI); ctx.arc(WC.x, WC.y, r1, 0, TWO_PI, true); ctx.fill();
  };
  const hair = (r, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(WC.x, WC.y, r, 0, TWO_PI); ctx.stroke(); };
  // polished gold rim
  ring(R.rim, R.rimIn, [[0, '#5a3a0e'], [0.25, '#ffe9b0'], [0.55, '#c9922e'], [0.8, '#ffe2a0'], [1, '#6a4512']]);
  hair(R.rim - 1, 'rgba(255,245,215,0.6)', 1.5);
  hair(R.rim - 9, 'rgba(90,50,10,0.8)', 1);
  // glossy burgundy ball track
  ring(R.track, R.trackIn, [[0, '#14010a'], [0.3, '#4a0a26'], [1, '#9a1d52']]);
  hair(R.track, C.gold, 2.2);
  hair(R.trackIn + 1, 'rgba(10,0,6,0.8)', 3);
  // gold diamonds on the track
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TWO_PI + 0.2, rr = 292;
    g.push(); g.translate(WC.x + cos(a) * rr, WC.y + sin(a) * rr); g.rotate(a);
    g.noStroke(); g.fill(C.goldD); g.quad(-9, 1.5, 0, -4, 9, 1.5, 0, 6);
    g.fill(C.gold); g.quad(-9, 0, 0, -5, 9, 0, 0, 4.5);
    g.fill(255, 250, 225, 220); g.quad(-5, -0.5, 0, -3.5, 1, -0.5, 0, 0.5);
    g.pop();
  }
  const sh = ctx.createLinearGradient(WC.x - R.rim, WC.y - R.rim, WC.x + R.rim, WC.y + R.rim);
  sh.addColorStop(0, 'rgba(255,235,240,0.2)');
  sh.addColorStop(0.5, 'rgba(255,235,240,0)');
  sh.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = sh;
  ctx.beginPath(); ctx.arc(WC.x, WC.y, R.rim, 0, TWO_PI); ctx.arc(WC.x, WC.y, R.trackIn, 0, TWO_PI, true); ctx.fill();
}

// ---------------------------------------------------------------- cards
// Each card is a thick, glossy object: a darker edge below its face, paper
// grain, a gold inlay, a recessed portrait window. Built once, so the same
// card can rest on the table or lift out of it.

function cardShadow(ctx, x, y, w, h, k, L) {
  ctx.save();
  ctx.shadowColor = `rgba(8,0,4,${0.55 + 0.2 * L})`;
  ctx.shadowBlur = (18 + 46 * L) * k;
  ctx.shadowOffsetX = (4 + 10 * L) * k;
  ctx.shadowOffsetY = (9 + 28 * L) * k;
  ctx.fillStyle = '#2a0416';
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w - 4, h + THICK - 4, 12);
  ctx.fill();
  ctx.restore();
}

function buildCard(i) {
  const p = PROFILES[i], w = GRID.cw, h = GRID.ch;
  const g = createGraphics(w, h + THICK);
  g.pixelDensity(max(2, pd * sc * 2.4));
  const ctx = g.drawingContext;
  const rr = (x, y, ww, hh, r) => { ctx.beginPath(); ctx.roundRect(x, y, ww, hh, r); };

  // edge, then face
  rr(0, THICK, w, h, 12);
  ctx.fillStyle = '#a8456e';
  ctx.fill();
  rr(0, 0, w, h, 12);
  const fg = ctx.createLinearGradient(0, 0, w * 0.4, h);
  fg.addColorStop(0, '#fffaf6');
  fg.addColorStop(1, '#f6d9e2');
  ctx.fillStyle = fg;
  ctx.fill();
  // paper grain
  randomSeed(30 + i);
  for (let j = 0; j < 1100; j++) {
    ctx.fillStyle = random() < 0.65 ? 'rgba(130,40,80,0.07)' : 'rgba(255,255,255,0.6)';
    ctx.fillRect(random(w), random(h), 0.8, 0.8);
  }
  randomSeed();
  // gold inlay
  rr(6, 6, w - 12, h - 12, 8);
  ctx.strokeStyle = 'rgba(200,148,50,0.9)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // recessed portrait window
  const px = 13, py = 30, pw = w - 26, ph = 100;
  ctx.save();
  rr(px, py, pw, ph, 8);
  ctx.clip();
  g.image(portraits[i], px, py, pw, ph);
  ctx.translate(0, 3);
  rr(px, py, pw, ph, 8);
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(70,0,30,0.32)';
  ctx.stroke();
  ctx.translate(0, -3);
  const gl = ctx.createLinearGradient(px, py, px + pw, py + ph);
  gl.addColorStop(0, 'rgba(255,255,255,0.28)');
  gl.addColorStop(0.35, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
  rr(px, py, pw, ph, 8);
  ctx.strokeStyle = 'rgba(110,20,60,0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // number, embossed in gold, and a heart
  ctx.font = '700 21px "Playfair Display"';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(String(i + 1), 15, 18);
  ctx.fillStyle = '#a8741c';
  ctx.fillText(String(i + 1), 14, 17);
  g.noStroke();
  g.fill(C.magenta);
  heart(g, w - 22, 17, 15);

  // the name, and one short detail
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = '700 24px "Playfair Display"';
  ctx.fillText(p.name, w / 2, 152);
  let fs = 14;
  ctx.font = `400 ${fs}px Inter`;
  while (ctx.measureText(p.cap).width > w - 22 && fs > 10) ctx.font = `400 ${--fs}px Inter`;
  ctx.fillStyle = '#8a2f55';
  ctx.fillText(p.cap, w / 2, 172);

  // gloss over the top of the card and a bright edge
  ctx.save();
  rr(0, 0, w, h, 12);
  ctx.clip();
  const sh = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sh.addColorStop(0, 'rgba(255,255,255,0.4)');
  sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, w, h * 0.5);
  ctx.restore();
  rr(0.8, 0.8, w - 1.6, h - 1.6, 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  return g;
}

function heart(g, x, y, s) {
  g.beginShape();
  g.vertex(x, y + s * 0.42);
  g.bezierVertex(x - s * 0.12, y + s * 0.28, x - s * 0.55, y + s * 0.05, x - s * 0.5, y - s * 0.18);
  g.bezierVertex(x - s * 0.45, y - s * 0.45, x - s * 0.08, y - s * 0.45, x, y - s * 0.18);
  g.bezierVertex(x + s * 0.08, y - s * 0.45, x + s * 0.45, y - s * 0.45, x + s * 0.5, y - s * 0.18);
  g.bezierVertex(x + s * 0.55, y + s * 0.05, x + s * 0.12, y + s * 0.28, x, y + s * 0.42);
  g.endShape(CLOSE);
}

// the ball's card rises out of its slot, grows a deeper shadow and a neon
// halo, then the outcome is stamped across it
function liftedCard(i, L, Rd, u) {
  const ctx = drawingContext, k = sc * pd;
  const r = cardRect(i), pose = cardPose(i, L);
  // the empty slot it left behind
  ctx.fillStyle = `rgba(14,0,8,${0.85 * L})`;
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h + THICK, 12);
  ctx.fill();

  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.scale(pose.s, pose.s);
  const x = -r.w / 2, y = -r.h / 2;
  cardShadow(ctx, x, y, r.w, r.h, k, L);
  ctx.save();
  ctx.shadowColor = Rd.won ? 'rgba(255,205,100,0.95)' : 'rgba(255,60,200,0.95)';
  ctx.shadowBlur = 34 * k * L;
  ctx.strokeStyle = Rd.won ? `rgba(255,226,150,${L})` : `rgba(255,140,225,${L})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, r.w + 6, r.h + THICK + 6, 14);
  ctx.stroke();
  ctx.restore();
  ctx.drawImage(cardsG[i].elt, x, y, r.w, r.h + THICK);
  tag(ctx, Rd.won ? 'YOUR BET · THE BALL’S PICK' : 'THE BALL’S PICK', 0, y, L, Rd.won ? '#ffe2a0' : '#ff9ae0');
  banner(Rd, u, x, y, r.w);
  ctx.restore();
}

// a small glossy label pinned to the top edge of a card
function tag(ctx, text, cx, y, a, col) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = '700 12px Inter';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1.5px';
  const w = ctx.measureText(text).width + 24, h = 24;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - h / 2, w, h, 12);
  ctx.fillStyle = '#2a0416';
  ctx.shadowColor = col;
  ctx.shadowBlur = 12 * sc * pd;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = col;
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + 1);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();
}

// on a miss, the card you bet on stays lit with a dashed pink ring and a
// YOUR BET label, so the gap between your pick and the ball's is visible
function betMarker(Rd, u) {
  const a = clamp01((u - SPIN1) / 0.4) * (1 - clamp01((u - Rd.clear) / 0.5));
  if (a <= 0) return;
  const ctx = drawingContext, r = cardRect(Rd.bet);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.setLineDash([10, 7]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ff9ae0';
  ctx.shadowColor = 'rgba(255,60,200,0.9)';
  ctx.shadowBlur = 14 * sc * pd;
  ctx.beginPath();
  ctx.roundRect(r.x - 5, r.y - 5, r.w + 10, r.h + THICK + 10, 15);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  tag(ctx, 'YOUR BET', r.x + r.w / 2, r.y - 2, a, '#ff9ae0');
}

// the result, stamped across the lifted card: MATCH then REPLY / GHOSTED, or NO MATCH
function banner(Rd, u, x, y, w) {
  const out = 1 - clamp01((u - Rd.clear) / 0.5);
  const showWord = (word, t0, t1) => {
    const a = clamp01((u - t0) / 0.25) * (t1 ? 1 - clamp01((u - t1) / 0.2) : 1) * out;
    if (a <= 0) return;
    const pop = 1 + 0.5 * (1 - easeOutCubic(clamp01((u - t0) / 0.25)));
    const ctx = drawingContext;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x + w / 2, y + GRID.ch + 18); // hangs off the bottom edge, clear of the face and name
    ctx.rotate(-0.06);
    ctx.scale(pop, pop);
    const bw = w + 14, bh = 40;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2 + 5, bw, bh, 10);
    ctx.fillStyle = Rd.won ? '#7a0a48' : '#2a0416';
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 10);
    const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
    if (Rd.won) { g.addColorStop(0, '#ff8ad8'); g.addColorStop(0.5, '#e0198f'); g.addColorStop(1, '#9a0a5c'); }
    else { g.addColorStop(0, '#6a1438'); g.addColorStop(1, '#2a0416'); }
    ctx.shadowColor = Rd.won ? 'rgba(255,60,200,0.9)' : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 18 * sc * pd;
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.gold;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-bw / 2 + 8, -bh / 2 + 3, bw - 16, 4);
    ctx.font = '800 25px "Playfair Display"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,220,250,0.9)';
    ctx.shadowBlur = 10 * sc * pd;
    ctx.fillStyle = '#fff6fb';
    ctx.fillText(word, 0, 2);
    ctx.restore();
  };
  if (!Rd.won) showWord('NO MATCH', RESULT);
  else {
    showWord('MATCH', RESULT, FOLLOW);
    showWord(OUTCOMES[Rd.box], FOLLOW);
  }
}

// a glossy 3D button on the felt; lit ones glow magenta
function tile(ctx, r, label, lit, k) {
  const x = r.x + 7, y = r.y + 6, w = r.w - 14, h = r.h - 14;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y + 6, w, h, 16);
  ctx.fillStyle = lit ? '#6a0840' : '#1a020c';
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (lit) { g.addColorStop(0, '#ff8ad8'); g.addColorStop(0.5, '#e0198f'); g.addColorStop(1, '#8a0a52'); }
  else { g.addColorStop(0, '#6a1438'); g.addColorStop(1, '#2e0418'); }
  if (lit) { ctx.shadowColor = 'rgba(255,60,200,0.95)'; ctx.shadowBlur = 26 * k; }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = lit ? '#ffe2a0' : 'rgba(240,194,90,0.6)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 4, w - 20, h * 0.32, 10);
  ctx.fill();
  ctx.font = '700 20px "Playfair Display"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = lit ? '#ffffff' : 'rgba(255,200,232,0.75)';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();
}

// ---------------------------------------------------------------- the wheel (turning part)

function buildWheel() {
  const S = R.turn * 2, g = createGraphics(S, S);
  g.pixelDensity(max(1.5, pd * sc * 1.3));
  const ctx = g.drawingContext;
  g.translate(R.turn, R.turn);
  const ring = (r0, r1, stops) => {
    const gr = ctx.createRadialGradient(0, 0, r1, 0, 0, r0);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(0, 0, r0, 0, TWO_PI); ctx.arc(0, 0, r1, 0, TWO_PI, true); ctx.fill();
  };
  const hair = (r, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, r, 0, TWO_PI); ctx.stroke(); };
  const sector = (r0, r1, a0, a1, col) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, 0, r0, a0, a1); ctx.arc(0, 0, r1, a1, a0, true); ctx.closePath(); ctx.fill();
  };

  // gold outer edge of the turning wheel
  ring(R.turn, R.numOut, [[0, '#6a4512'], [0.5, '#ffe2a0'], [1, '#9a6a1e']]);
  // number ring and pockets: hot pink and deep burgundy
  for (let i = 0; i < NP; i++) {
    const a0 = i * STEP, a1 = a0 + STEP, pink = i % 2 === 0;
    sector(R.numOut, R.numIn, a0, a1, pink ? '#e8187a' : '#2a0416');
    const pg = ctx.createRadialGradient(0, 0, R.pktIn, 0, 0, R.numIn);
    pg.addColorStop(0, pink ? '#ff5aa8' : '#5a0c30');
    pg.addColorStop(0.7, pink ? '#c8106a' : '#2e0418');
    pg.addColorStop(1, pink ? '#5a0430' : '#0e0106');
    sector(R.numIn, R.pktIn, a0, a1, pg);
  }
  g.noStroke(); g.fill('#fff4f8'); g.textFont('Playfair Display'); g.textStyle(BOLD); g.textSize(16); g.textAlign(CENTER, CENTER);
  for (let i = 0; i < NP; i++) {
    const a = pocketPhi(i);
    g.push(); g.translate(cos(a) * 250, sin(a) * 250); g.rotate(a + HALF_PI);
    g.text(POCKETS[i] + 1, 0, 0);
    g.pop();
  }
  // gold frets with a bright edge
  for (let i = 0; i < NP; i++) {
    const a = i * STEP;
    ctx.strokeStyle = C.goldD; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cos(a) * R.pktIn, sin(a) * R.pktIn); ctx.lineTo(cos(a) * R.numIn, sin(a) * R.numIn); ctx.stroke();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cos(a) * R.pktIn, sin(a) * R.pktIn); ctx.lineTo(cos(a) * R.numIn, sin(a) * R.numIn); ctx.stroke();
    ctx.strokeStyle = 'rgba(240,194,90,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cos(a) * R.numIn, sin(a) * R.numIn); ctx.lineTo(cos(a) * R.numOut, sin(a) * R.numOut); ctx.stroke();
  }
  hair(R.numOut, C.gold, 1.6);
  hair(R.numIn, C.gold, 2.2);
  hair(R.pktIn, C.gold, 2.6);

  // the cone: rose glass, rising toward the spindle
  ring(R.cone, R.hub, [[0, '#3a0620'], [0.35, '#8a1a48'], [0.8, '#ff9ad0'], [1, '#c0306e']]);
  hair(R.cone, 'rgba(10,0,6,0.9)', 3);
  hair(R.cone - 18, 'rgba(255,226,160,0.55)', 1.2);
  hair(R.hub + 26, 'rgba(255,226,160,0.55)', 1.2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TWO_PI + PI / 8;
    ctx.strokeStyle = 'rgba(255,226,160,0.5)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cos(a) * (R.hub + 30), sin(a) * (R.hub + 30)); ctx.lineTo(cos(a) * (R.cone - 22), sin(a) * (R.cone - 22)); ctx.stroke();
  }
  return g;
}

// fixed lighting over the turning wheel, so highlights don't spin with it
function wheelLight() {
  const ctx = drawingContext;
  const gr = ctx.createLinearGradient(WC.x - R.turn, WC.y - R.turn, WC.x + R.turn, WC.y + R.turn);
  gr.addColorStop(0, 'rgba(255,236,246,0.2)');
  gr.addColorStop(0.45, 'rgba(255,236,246,0)');
  gr.addColorStop(1, 'rgba(10,0,4,0.28)');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(WC.x, WC.y, R.turn, 0, TWO_PI); ctx.fill();
  const cg = ctx.createRadialGradient(WC.x - 50, WC.y - 60, 20, WC.x, WC.y, R.cone);
  cg.addColorStop(0, 'rgba(255,235,245,0.3)');
  cg.addColorStop(1, 'rgba(255,235,245,0)');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(WC.x, WC.y, R.cone, 0, TWO_PI); ctx.fill();
}

// the spindle: a polished gold turret with four arms and ball finials
function spindle(wa) {
  const ctx = drawingContext;
  const metal = (x, y, r) => {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, '#fff8e0');
    g.addColorStop(0.35, '#f0c25a');
    g.addColorStop(0.75, '#9a6a1e');
    g.addColorStop(1, '#4a3008');
    return g;
  };
  ctx.fillStyle = 'rgba(10,0,6,0.4)';
  ctx.beginPath(); ctx.arc(WC.x + 7, WC.y + 9, R.hub - 4, 0, TWO_PI); ctx.fill();
  ctx.fillStyle = metal(WC.x, WC.y, R.hub);
  ctx.beginPath(); ctx.arc(WC.x, WC.y, R.hub, 0, TWO_PI); ctx.fill();
  ctx.strokeStyle = 'rgba(70,40,5,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,245,210,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(WC.x, WC.y, R.hub - 10, 0, TWO_PI); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = wa + (i / 4) * TWO_PI;
    const ex = WC.x + cos(a) * 86, ey = WC.y + sin(a) * 86;
    ctx.strokeStyle = 'rgba(10,0,6,0.38)'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(WC.x + 6, WC.y + 8); ctx.lineTo(ex + 6, ey + 8); ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const a = wa + (i / 4) * TWO_PI;
    const ex = WC.x + cos(a) * 86, ey = WC.y + sin(a) * 86;
    const lg = ctx.createLinearGradient(WC.x - sin(a) * 5, WC.y + cos(a) * 5, WC.x + sin(a) * 5, WC.y - cos(a) * 5);
    lg.addColorStop(0, '#6a4512'); lg.addColorStop(0.5, '#fff0c0'); lg.addColorStop(1, '#7a5216');
    ctx.strokeStyle = lg; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(WC.x, WC.y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.fillStyle = metal(ex, ey, 11);
    ctx.beginPath(); ctx.arc(ex, ey, 11, 0, TWO_PI); ctx.fill();
  }
  ctx.fillStyle = 'rgba(10,0,6,0.4)';
  ctx.beginPath(); ctx.arc(WC.x + 4, WC.y + 6, 22, 0, TWO_PI); ctx.fill();
  ctx.fillStyle = metal(WC.x, WC.y, 22);
  ctx.beginPath(); ctx.arc(WC.x, WC.y, 22, 0, TWO_PI); ctx.fill();
  ctx.fillStyle = metal(WC.x - 2, WC.y - 2, 10);
  ctx.beginPath(); ctx.arc(WC.x - 2, WC.y - 2, 10, 0, TWO_PI); ctx.fill();
  ctx.lineCap = 'butt';
}

// ---------------------------------------------------------------- highlights

function pocketHighlight(a, lit) {
  const ctx = drawingContext;
  ctx.save();
  ctx.translate(WC.x, WC.y);
  ctx.rotate(a);
  ctx.globalAlpha = lit;
  ctx.strokeStyle = '#ffe9b8'; ctx.lineWidth = 3.5;
  ctx.shadowColor = 'rgba(255,205,100,1)'; ctx.shadowBlur = 18 * sc * pd;
  ctx.beginPath();
  ctx.arc(0, 0, R.numOut - 1, -STEP / 2, STEP / 2);
  ctx.arc(0, 0, R.pktIn + 1, STEP / 2, -STEP / 2, true);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function outcomeLights(Rd, u) {
  if (!Rd.won) return;
  const show = (i, t0, t1) => {
    const a = clamp01((u - t0) / FADE_IN) * (t1 ? 1 - clamp01((u - t1) / 0.3) : 1) * (1 - clamp01((u - Rd.clear) / 0.5));
    if (a <= 0) return;
    drawingContext.save();
    drawingContext.globalAlpha = a;
    tile(drawingContext, outRect(i), OUTCOMES[i], 1, sc * pd);
    drawingContext.restore();
  };
  show(0, RESULT, FOLLOW);
  show(Rd.box, FOLLOW);
}

// ---------------------------------------------------------------- chips

function chipSpots(Rd) {
  const c = cardRect(Rd.bet);
  const x = c.x + c.w - 8, y = c.y + c.h - 6;   // on the card's corner, clear of its caption
  return [[x, y], [x + 1.5, y - 7]];
}

// L: how far the bet card has lifted, so chips on a winning card ride with it
function drawChips(Rd, u, L) {
  const pose = cardPose(Rd.bet, L), r = cardRect(Rd.bet);
  chipSpots(Rd).forEach(([tx, ty], i) => {
    if (L > 0) {
      tx = pose.x + (tx - (r.x + r.w / 2)) * pose.s;
      ty = pose.y + (ty - (r.y + r.h / 2)) * pose.s;
    }
    const tin = clamp01((u - CHIP_IN - i * 0.18) / 0.65);
    const tout = clamp01((u - Rd.clear - i * 0.06) / 0.6);
    if (tin <= 0 || tout >= 1) return;
    let x, y, lift = 0;
    if (tout > 0) {
      // winners come back to the player; losers are swept to the house, toward the wheel
      const to = Rd.won ? [W + 80, H - 80] : [WC.x + 360, WC.y - 300];
      const e = easeInCubic(tout);
      x = lerp(tx, to[0], e); y = lerp(ty, to[1], e);
      lift = sin(tout * PI) * 0.1;
    } else {
      const from = [W + 80, H - 60];
      const e = easeOutCubic(tin);
      x = lerp(from[0], tx, e); y = lerp(from[1], ty, e) - sin(e * PI) * 30;
      lift = sin(tin * PI) * 0.14;
    }
    chip(x, y, 1 + lift + 0.2 * L, lift > 0.02 || L > 0.05);
  });
}

// a clay chip: a gold edge with ivory inserts, a magenta face, an embossed heart
function chip(x, y, s, lifted) {
  const ctx = drawingContext, r = 24 * s, k = sc * pd;
  ctx.save();
  ctx.fillStyle = 'rgba(8,0,4,0.5)';
  ctx.shadowColor = 'rgba(8,0,4,0.6)';
  ctx.shadowBlur = (lifted ? 16 : 6) * k;
  const off = lifted ? 10 : 3;
  ctx.beginPath(); ctx.ellipse(x + off, y + off + 3, r, r * 0.96, 0, 0, TWO_PI); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#9a6a1e';
  ctx.beginPath(); ctx.arc(x, y + 4, r, 0, TWO_PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,244,240,0.9)';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TWO_PI + 0.3;
    if (sin(a) < -0.2) continue;
    ctx.beginPath(); ctx.ellipse(x + cos(a) * r * 0.96, y + 4 + sin(a) * r * 0.96, 3.2, 2.2, a, 0, TWO_PI); ctx.fill();
  }
  const fg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  fg.addColorStop(0, '#ff7ad0');
  fg.addColorStop(0.7, C.magenta);
  fg.addColorStop(1, '#7a0a4c');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
  ctx.fillStyle = C.ivory;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TWO_PI + 0.3;
    ctx.save(); ctx.translate(x + cos(a) * r * 0.82, y + sin(a) * r * 0.82); ctx.rotate(a);
    ctx.fillRect(-3.2 * s, -5 * s, 6.4 * s, 10 * s);
    ctx.restore();
  }
  ctx.fillStyle = '#fff2e0';
  ctx.beginPath(); ctx.arc(x, y, r * 0.56, 0, TWO_PI); ctx.fill();
  ctx.strokeStyle = 'rgba(154,106,30,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
  noStroke();
  fill(255, 255, 255, 190); heart(window, x - 0.8, y - 0.8, 16 * s);
  fill(90, 10, 50, 110); heart(window, x + 1, y + 1.2, 16 * s);
  fill(C.magenta); heart(window, x, y, 16 * s);
  const sp = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  sp.addColorStop(0, 'rgba(255,255,255,0.3)');
  sp.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = sp;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
}

// ---------------------------------------------------------------- result
// one short line under the buttons, in glowing script

function drawResult(Rd, u) {
  const t0 = Rd.won ? FOLLOW : RESULT;
  const a = clamp01((u - t0) / FADE_IN) * (1 - clamp01((u - Rd.clear) / 0.5));
  if (a <= 0) return;
  const ctx = drawingContext;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = 'italic 600 34px "Playfair Display"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(255,60,200,0.95)';
  ctx.shadowBlur = 20 * sc * pd;
  ctx.fillStyle = '#ffeaf8';
  const cx = GRID.x + GRID_W / 2;
  if (Rd.won) {
    ctx.fillText(Rd.follow, cx, RESULT_Y + 18);
  } else {
    const bet = PROFILES[Rd.bet].name, hit = PROFILES[POCKETS[Rd.pocket]].name;
    ctx.fillText(`You bet on ${bet}. The ball picked ${hit}.`, cx, RESULT_Y + 4);
    ctx.shadowBlur = 0;
    ctx.font = '600 17px Inter';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
    ctx.fillStyle = '#ff9ae0';
    ctx.fillText('No match, so the house takes your chips.', cx, RESULT_Y + 40);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  ctx.restore();
}

// ---------------------------------------------------------------- portraits

function drawPortrait(p) {
  const w = 160, h = 104, g = createGraphics(w, h);
  g.pixelDensity(max(2, pd * sc * 1.6));
  const ctx = g.drawingContext;
  // a soft studio backdrop
  const bg = ctx.createRadialGradient(w * 0.35, h * 0.3, 10, w * 0.5, h * 0.5, w * 0.7);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.25, p.bg);
  bg.addColorStop(1, shade(p.bg, -0.12));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = 52;
  g.push();
  g.translate(cx, cy + 10);
  g.rotate(p.tilt);
  g.translate(-cx, -(cy + 10));
  g.noStroke();

  // hair behind the head
  g.fill(p.hair);
  if (p.style === 'long') g.rect(cx - 36, cy - 30, 72, 86, 34, 34, 8, 8);
  if (p.style === 'waves') { g.rect(cx - 37, cy - 30, 74, 80, 34, 34, 18, 18); g.circle(cx - 34, cy + 44, 18); g.circle(cx + 34, cy + 44, 18); }
  if (p.style === 'curlylong') for (let i = 0; i < 16; i++) { const a = PI * 0.9 + (i / 15) * PI * 1.2; g.circle(cx + cos(a) * 34, cy + 4 + sin(a) * 40, 22); }
  if (p.style === 'bob') g.rect(cx - 36, cy - 32, 72, 60, 30, 30, 12, 12);
  if (p.style === 'hijab') { g.ellipse(cx, cy + 2, 84, 96); g.rect(cx - 50, cy + 30, 100, 40, 24); }

  // shoulders and neckline
  g.fill(p.shirt);
  g.ellipse(cx, h + 22, 140, 92);
  g.fill(shade(p.shirt, -0.18)); g.ellipse(cx + 26, h + 24, 70, 80);
  g.fill(p.skin);
  if (p.style !== 'hijab') {
    g.rect(cx - 11, cy + 18, 22, 26, 8);
    g.triangle(cx - 16, h - 22, cx + 16, h - 22, cx, h - 4);
    g.fill(p.skinD); g.rect(cx - 11, cy + 22, 22, 8, 4);
  } else {
    g.fill(p.hair); g.triangle(cx - 30, h - 20, cx + 30, h - 20, cx, h + 6);
  }

  // head with a shadowed side
  const hw = p.style === 'hijab' ? 46 : 52, hh = 62;
  g.fill(p.skin); g.ellipse(cx, cy, hw, hh);
  if (p.style !== 'hijab') { g.ellipse(cx - hw / 2, cy + 2, 9, 13); g.ellipse(cx + hw / 2, cy + 2, 9, 13); }
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, hw / 2, hh / 2, 0, 0, TWO_PI); ctx.clip();
  g.fill(p.skinD); g.ellipse(cx + hw * 0.42, cy + 4, hw * 0.55, hh * 1.1);
  g.fill(255, 255, 255, 40); g.ellipse(cx - hw * 0.2, cy - hh * 0.22, hw * 0.4, hh * 0.25);
  ctx.restore();

  frontHair(g, p, cx, cy, hw, hh);
  if (p.beard) {
    g.fill(p.hair);
    g.arc(cx, cy + 8, hw + 2, hh * 0.85, 0.15, PI - 0.15, CHORD);
    g.fill(p.skin); g.ellipse(cx, cy + 15, 20, 10);
  }

  // brows
  const browY = cy - 10;
  const bt = { arched: [-3, 1], tilt: [2, -2], raised: [-4, -3], up: [-2, -2], soft: [0, 1], flat: [0, 0] }[p.brow];
  g.stroke(p.style === 'hijab' ? '#2a1a10' : shade(p.hair, p.hair === '#d9b36a' ? -0.35 : 0)); g.strokeWeight(2.6); g.strokeCap(ROUND);
  g.line(cx - 17, browY + 1, cx - 6, browY + bt[0]);
  g.line(cx + 6, browY + bt[1], cx + 17, browY + 1);
  g.noStroke();

  // eyes
  [-11, 11].forEach(dx => {
    const ex = cx + dx, ey = cy - 1;
    g.fill('#fffaf5'); g.ellipse(ex, ey, 11, p.mouth === 'laugh' ? 4 : 7.5);
    if (p.mouth !== 'laugh') {
      g.fill(p.eye); g.circle(ex + 0.6, ey + 0.4, 6);
      g.fill('#0e0606'); g.circle(ex + 0.6, ey + 0.4, 3);
      g.fill(255); g.circle(ex - 0.6, ey - 1, 1.6);
    }
    g.stroke('#2a120c'); g.strokeWeight(1.6); g.noFill();
    g.arc(ex, ey + 0.5, 12, 8.5, PI + 0.2, TWO_PI - 0.2);
    g.noStroke();
  });

  // nose and cheeks
  g.stroke(p.skinD); g.strokeWeight(1.8); g.noFill();
  g.arc(cx + 1, cy + 8, 7, 6, -0.3, PI * 0.75);
  g.noStroke();
  g.fill(214, 31, 58, 38); g.circle(cx - 15, cy + 10, 11); g.circle(cx + 15, cy + 10, 11);

  mouth(g, p, cx, cy + 18);

  if (p.glasses) {
    g.noFill(); g.stroke('#2a0b18'); g.strokeWeight(1.8);
    g.rect(cx - 19, cy - 6, 15, 11, 4); g.rect(cx + 4, cy - 6, 15, 11, 4);
    g.line(cx - 4, cy - 2, cx + 4, cy - 2);
    g.stroke(255, 255, 255, 120); g.strokeWeight(1); g.line(cx - 16, cy - 4, cx - 12, cy - 4);
    g.noStroke();
  }
  if (p.earrings) { g.fill(C.gold); g.circle(cx - hw / 2 - 1, cy + 11, 5); g.circle(cx + hw / 2 + 1, cy + 11, 5); }
  g.pop();
  return g;
}

function frontHair(g, p, cx, cy, hw, hh) {
  g.fill(p.hair);
  const top = cy - hh / 2;
  switch (p.style) {
    case 'long': case 'waves':
      g.arc(cx, cy - 8, hw + 8, hh * 0.85, PI, TWO_PI, CHORD);
      g.arc(cx - 6, top + 14, hw, 30, PI * 0.95, PI * 1.75, CHORD);
      g.rect(cx - hw / 2 - 5, cy - 12, 9, 50, 4);
      g.rect(cx + hw / 2 - 4, cy - 12, 9, 50, 4);
      break;
    case 'bob':
      g.arc(cx, cy - 8, hw + 10, hh * 0.86, PI, TWO_PI, CHORD);
      g.rect(cx - hw / 2 + 2, top + 8, hw - 4, 12, 4);
      break;
    case 'bun':
      g.circle(cx + 4, top - 6, 24);
      g.arc(cx, cy - 6, hw + 4, hh * 0.8, PI, TWO_PI, CHORD);
      break;
    case 'swoop':
      g.arc(cx, cy - 8, hw + 4, hh * 0.78, PI, TWO_PI, CHORD);
      g.beginShape(); g.vertex(cx - hw / 2, cy - 10); g.bezierVertex(cx - 10, top - 10, cx + 20, top - 8, cx + hw / 2 + 4, cy - 14); g.vertex(cx + 6, top + 10); g.endShape(CLOSE);
      break;
    case 'fade': case 'buzz':
      g.arc(cx, cy - 8, hw + 2, hh * 0.72, PI, TWO_PI, CHORD);
      if (p.style === 'fade') g.rect(cx - 16, top - 4, 32, 10, 5);
      break;
    case 'curly':
      for (let i = 0; i < 13; i++) { const a = PI + (i / 12) * PI; g.circle(cx + cos(a) * (hw / 2 + 2), cy - 8 + sin(a) * (hh * 0.46), 15); }
      g.arc(cx, cy - 8, hw, hh * 0.7, PI, TWO_PI, CHORD);
      break;
    case 'curlylong':
      for (let i = 0; i < 12; i++) { const a = PI + (i / 11) * PI; g.circle(cx + cos(a) * (hw / 2 + 3), cy - 8 + sin(a) * (hh * 0.46), 16); }
      break;
    case 'hijab':
      g.noFill(); g.stroke(p.hair); g.strokeWeight(9);
      g.ellipse(cx, cy, hw + 8, hh + 8);
      g.noStroke();
      break;
  }
  // a little shine
  if (p.style !== 'hijab') {
    g.stroke(255, 255, 255, 45); g.strokeWeight(2); g.noFill();
    g.arc(cx - 4, cy - 6, hw * 0.7, hh * 0.62, PI * 1.15, PI * 1.45);
    g.noStroke();
  }
}

function mouth(g, p, x, y) {
  const lip = shade(p.skin, -0.32);
  if (p.mouth === 'grin') {
    g.fill('#5a1424'); g.arc(x, y - 1, 18, 12, 0, PI, CHORD);
    g.fill('#fffaf5'); g.rect(x - 7.5, y - 1, 15, 3.4, 1);
  } else if (p.mouth === 'laugh') {
    g.fill('#5a1424'); g.ellipse(x, y + 1, 17, 12);
    g.fill('#fffaf5'); g.rect(x - 7, y - 4.5, 14, 3, 1);
    g.fill('#e06a7a'); g.ellipse(x, y + 4, 9, 4);
  } else if (p.mouth === 'smirk') {
    g.noFill(); g.stroke(lip); g.strokeWeight(2.4);
    g.bezier(x - 8, y, x - 2, y + 3, x + 4, y + 2, x + 9, y - 3);
    g.noStroke();
  } else if (p.mouth === 'smile') {
    g.noFill(); g.stroke(lip); g.strokeWeight(2.4);
    g.arc(x, y - 2, 16, 9, 0.2, PI - 0.2);
    g.noStroke();
  } else {
    g.fill(lip); g.ellipse(x, y, 10, 4);
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}


function drawBall(x, y, air) {
  const ctx = drawingContext;
  const off = 3 + air * 6;
  ctx.fillStyle = `rgba(10,0,4,${0.45 - air * 0.2})`;
  ctx.beginPath(); ctx.ellipse(x + off, y + off * 1.3, 10 + air * 3, 9 + air * 3, 0, 0, TWO_PI); ctx.fill();
  const g = ctx.createRadialGradient(x - 3.5, y - 4, 0.5, x, y, 11);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, '#fbf4ee');
  g.addColorStop(0.85, '#d8c6c4');
  g.addColorStop(1, '#a8908e');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, 10.5, 0, TWO_PI); ctx.fill();
}

