// SMALL HOPES — NEON ARCADE
// A variant inspired by the glow and colour of the article's original lead art,
// with its own identity: a neon arcade ticket machine in a neon corridor. The
// bets come out as pink arcade tickets, notched where they tear apart.
// A betting receipt for everyday life that never stops printing.
// A fictional simulation: every odd is invented and nothing is wagered but time.
//
// p5.js runs the loop and input. Everything is drawn with the canvas 2D API in
// "virtual units" (the frame is always at least 700 x 900 of them):
//   - the paper is one continuous ribbon laid along a path. Each receipt is
//     baked once into a small texture and mapped onto the ribbon slice by
//     slice, so the strip can bend, twist to show its back, and fold. A light
//     from the upper left shades every slice; newer paper casts a soft contact
//     shadow on older paper, and the oldest paper sinks into a cobalt haze;
//   - rough.js inks the little drawings and the rubber stamps once, up front;
//   - the printer is drawn live so it can pulse, light up and count.

const COBALT = '#2a55d4';
const NAVY = '#1d2a78';   // ticket print: deep navy
const NAVY_DEEP = '#121a52';
const INK = '#121433';
const IVORY = '#fbf3e2';
const YELLOW = '#ffd23f';
const YELLOW_D = '#d9a400';
const CORAL = '#ff6b57';
const CORAL_D = '#d9473a';
const GREEN = '#1f9e5e';
// names the hand-drawn icons were written with
const BLUE = COBALT, CREAM = IVORY, CHERRY = CORAL;

const PAPER_RGB = [251, 243, 226];
const BACK_RGB = [233, 218, 188];   // the reverse of the slip: warmer, unprinted
const SHADE_RGB = [70, 82, 150];    // shadows pick up the blue of the room
const HAZE_RGB = [10, 16, 60];      // far paper recedes into the dark corridor
const LIGHT_RGB = [255, 253, 246];
const INK_RGB = [18, 20, 51];

const DISPLAY = 'Anton';
const SANS = 'Archivo';

const PW = 230;        // paper width
const EL = 100;        // length of paper per bet
const FOOT = 128;      // the totals block that sits at the printer mouth
const HEAD = 132;      // the receipt header at the far end
const DS = 5;          // path sample spacing
const SIDE_IN = 80;   // the paper's centre starts turning back this far in from the sides...
const TOP_IN = 30;    // ...and from the top; it may overshoot a little while it turns
const STRAIGHT = FOOT + 2 * EL + 20; // the totals block and two whole tickets print straight up before any bend
const LAP = 480;       // paper is drawn in laps, oldest first, each casting one shadow
const TINT_MAX = 0.55;
const TICKET_RGB = [255, 255, 255];      // arcade tickets: plain white, no tint
const TOTALS_RGB = [236, 246, 255];      // the totals block: a paler tint of the same blue
const TICKET_EDGE_RGB = [24, 42, 110];
const TICKET_LINE_RGB = [96, 150, 235];  // the printed border inside the edge

const CYCLE = 25;      // seconds: the whole print run, then the slate is wiped
const AUTO_STOP = 23;  // stop auto-printing so the last bet clears the printer
const FADE = 0.9;      // the old slip fades before a new one feeds

const LX = -0.35, LY = -0.55, LZ = 0.76; // light: upper left, toward the viewer

const STAMP_COL = { PENDING: '#2a6cff', WON: '#12a46a', LOST: '#e8122e' };

// [drawing, the hope, invented odds, the stake: always time]
const BETS = [
  ['heart', 'They text back tonight', '5/2', '40 MIN'],
  ['heart', 'A second date actually happens', '3/1', 'A WEEKEND'],
  ['heart', 'Your ex doesn’t see your story', '9/1', '10 MIN'],
  ['heart', 'Mom doesn’t ask about dating', '10/1', 'THANKSGIVING'],
  ['house', 'Rent stays the same next year', '25/1', '1 YEAR'],
  ['house', 'The landlord fixes the heat', '12/1', 'A WINTER'],
  ['house', 'You get the place with the window', '7/1', '3 OPEN HOUSES'],
  ['house', 'The roommate does the dishes', '12/1', 'A FULL SINK'],
  ['diploma', 'The professor curves the final', '4/1', 'AN ALL-NIGHTER'],
  ['diploma', 'Your degree pays for itself', '14/1', '4 YEARS'],
  ['diploma', 'Loan forgiveness goes through', '40/1', 'YOUR PATIENCE'],
  ['diploma', 'Your group project partner shows up', '3/1', 'A SEMESTER'],
  ['briefcase', 'You land the internship', '8/1', '12 COVER LETTERS'],
  ['briefcase', 'Your raise beats inflation', '11/1', 'A YEAR'],
  ['briefcase', 'The recruiter writes back', '6/1', '2 WEEKS'],
  ['briefcase', 'Friday stays meeting-free', '8/1', 'A FRIDAY'],
  ['phone', 'Your post gets 100 likes', '7/1', '1 HOUR'],
  ['phone', 'You close the app in 5 minutes', '30/1', '3 HOURS'],
  ['phone', 'Your battery lasts until midnight', '3/2', 'SCREEN TIME'],
  ['phone', 'The group chat picks a date', '6/1', '47 MESSAGES'],
  ['ballot', 'Your candidate keeps the promise', '20/1', 'A TERM'],
  ['ballot', 'The line at the polls is short', '5/1', 'LUNCH BREAK'],
  ['bus', 'The bus comes on time', '9/2', '15 MIN'],
  ['bus', 'You make the last train', '2/1', 'A SPRINT'],
  ['umbrella', 'It won’t rain on the walk home', '2/1', 'YOUR SHOES'],
  ['umbrella', 'Sunny for the weekend plans', '4/1', 'A WEEKEND'],
  ['coffee', 'The coffee kicks in before 9', '4/5', 'YOUR MORNING'],
  ['coffee', 'You sleep eight hours tonight', '15/1', 'A NIGHT'],
  ['plant', 'The plant survives the week', '5/1', 'A WEEK'],
  ['plant', 'You keep the new habit', '18/1', '21 DAYS'],
];

// ---------------------------------------------------------------- state

let u = 1, VW = 700, VH = 900, pd = 1, texScale = 2;
let ready = false, dirty = true;
let icons = {}, stamps = {}, bgCanvas, scene, sctx, paperCv, pctx;
let path, turtle, mouth, rHard, twists = [], rollPh = 0, loadSide = null;
let pathSeed = 0, curSEnd = 0;
let entries = [], fed = 0, fedV = 0, bag = [], barcode = [];
let headTex = null, headScale = 0, footTex = null, footKey = '';
let gradCache = new Map();
let autoTimer = 1.6, holding = false, holdT = 0, holdAcc = 0, cycleT0 = 0, paperAlpha = 1;
let pulse = 0, pulseV = 0, wob = 0, wobV = 0, btnT = -10, countDisp = 0, lastBuzz = 0;
let actx = null, soundOn = false;

// ---------------------------------------------------------------- p5

function setup() {
  // the canvas fills its panel, not the browser window, so the piece can sit
  // in the right half of the article's split-screen opener
  const panel = document.getElementById('panel');
  const c = createCanvas(panel.clientWidth, panel.clientHeight);
  c.parent('stage');
  new ResizeObserver(fitPanel).observe(panel);
  // a fresh route for the paper on every page load
  pathSeed = floor(Math.random() * 2 ** 31);
  noiseSeed(pathSeed);
  setupSoundButton();
  scene = document.createElement('canvas');
  sctx = scene.getContext('2d');
  paperCv = document.createElement('canvas');
  pctx = paperCv.getContext('2d');
  for (let i = 0; i < 46; i++) barcode.push(random() < 0.3 ? 3 : random() < 0.5 ? 2 : 1);

  Promise.all([
    document.fonts.load(`40px "${DISPLAY}"`),
    document.fonts.load(`400 12px "${SANS}"`),
    document.fonts.load(`700 12px "${SANS}"`),
  ]).catch(() => {}).then(() => {
    buildIcons();
    buildStamps();
    fit();
    startCycle(true);
    ready = true;
  });
}

function fitPanel() {
  const panel = document.getElementById('panel');
  const w = panel.clientWidth, h = panel.clientHeight;
  if (!w || !h || (w === width && h === height)) return;
  resizeCanvas(w, h);
  if (ready) fit();
}

function fit() {
  u = min(width / 700, height / 900);
  VW = width / u;
  VH = height / u;
  pd = pixelDensity();
  texScale = min(2.4, u * pd);
  scene.width = paperCv.width = round(width * pd);
  scene.height = paperCv.height = round(height * pd);
  mouth = { x: VW / 2, y: VH - 262 }; // low enough for the longer straight run
  bgCanvas = buildBackground();
  gradCache.clear();
  headTex = null;
  footTex = null;
  footKey = '';
  entries.forEach(e => { e.base = e.tex = null; });
  resetPath();
  dirty = true;
}

function draw() {
  if (!ready) {
    background('#04061a');
    return;
  }
  const dt = min(deltaTime / 1000, 0.05);
  const now = millis() / 1000;
  const moving = update(dt, now);
  if (dirty || moving) renderScene(now);
  dirty = false;
  drawingContext.drawImage(scene, 0, 0, width, height);
}

// ---------------------------------------------------------------- printing

function startCycle(initial) {
  // every run starts from a blank slip: the first bet prints on its own, then
  // the next, and they come faster and faster
  const now = millis() / 1000;
  entries = [];
  bag = [];
  fed = 0;
  fedV = 0;
  holdAcc = 0;
  countDisp = 0;
  cycleT0 = now;
  autoTimer = 0.9;
  footKey = '';
  paperAlpha = 1;
  dirty = true;
  if (!initial) announce('The slip ran out. A new one starts printing.');
}

function update(dt, now) {
  // every CYCLE seconds the run ends and it starts over from a blank slip
  const cycleT = now - cycleT0;
  if (cycleT >= CYCLE) {
    startCycle(false);
    return true;
  }
  paperAlpha = 1 - smooth01((cycleT - (CYCLE - FADE)) / FADE);

  // it prints by itself, slowly at first, then faster and faster
  if (cycleT < AUTO_STOP) {
    autoTimer -= dt;
    if (autoTimer <= 0) {
      printBet(false);
      autoTimer = max(0.26, 1.35 - entries.length * 0.055);
    }
  }
  // holding builds smoothly from a steady feed to a flood
  if (holding) {
    holdT += dt;
    if (holdT > 0.32) {
      const iv = lerp(0.42, 0.07, smooth01((holdT - 0.32) / 2.6));
      holdAcc += dt;
      while (holdAcc >= iv) {
        holdAcc -= iv;
        printBet(true);
      }
    }
  }

  // the paper eases out of the slot: it accelerates, cruises, then settles
  const target = entries.length * EL;
  const gap = target - fed;
  const vmax = 380 + min(560, max(0, gap - 100) * 1.1);
  const want = gap > 0.05 ? min(vmax, 30 + gap * 6) : 0;
  fedV += (want - fedV) * min(1, dt * 7);
  fed = min(target, fed + max(0, fedV) * dt);
  if (target - fed < 0.05) {
    fed = target;
    if (want === 0) fedV = 0;
  }
  if (gap > 1 && now - lastBuzz > 0.07) {
    lastBuzz = now;
    blip(140 + random(30), 0.05, 'sawtooth', 0.02);
  }

  // the machine thumps once per bet; the free end of the slip swings and settles
  pulseV += (-260 * pulse - 16 * pulseV) * dt;
  pulse += pulseV * dt;
  wobV += (-14 * wob - 2.4 * wobV) * dt;
  wob += wobV * dt;
  const n = entries.length;
  if (countDisp > n) countDisp = n;
  countDisp += (n - countDisp) * min(1, dt * 7);
  if (abs(n - countDisp) < 0.002) countDisp = n;

  let stamping = false;
  entries.forEach((e, i) => {
    if (e.outT === null && fed >= (i + 1) * EL - 0.01) {
      // fully out of the printer: stamp it PENDING and maybe settle it later
      e.outT = now;
      e.stampT = now;
      e.resolveAt = e.quick ? now + random(0.3, 1.3) : random() < 0.7 ? now + random(2, 9) : Infinity;
    }
    if (e.status === 'PENDING' && now >= e.resolveAt) {
      e.status = e.final;
      e.stampT = now;
      thunk(e.status === 'WON');
    }
    if (e.stampT !== null && now - e.stampT < 0.3) stamping = true;
  });

  // the marquee bulbs chase continuously, so the scene redraws every frame
  return true;
}

function printBet(byUser, quiet = false) {
  if (!bag.length) bag = shuffle(BETS.map((_, i) => i));
  const b = BETS[bag.pop()];
  const e = {
    no: entries.length + 1, icon: b[0], text: b[1], odds: b[2], stake: b[3],
    status: 'PENDING', final: random() < 0.38 ? 'WON' : 'LOST',
    outT: null, stampT: null, resolveAt: Infinity, quick: false,
    rot0: radians(random(-9, 4)), rot: radians(random(-5, 9)),
    v0: floor(random(3)), v1: floor(random(3)), seed: floor(random(1e9)),
    base: null, tex: null, texKey: '', iconT: null,
  };
  e.lines = wrapText(e.text, `15.5px ${DISPLAY}`, 158);
  e.stakeLines = wrapText(e.stake, `700 8.5px ${SANS}`, 52);
  entries.push(e);
  if (!quiet) {
    const now = millis() / 1000;
    btnT = now;
    pulseV += 6;
    wobV += 1.1;
    blip(320, 0.04, 'square', 0.025);
  }
  if (byUser) announce(`Printed bet ${e.no}: ${e.text}. Invented odds ${e.odds}. Stake: ${e.stake.toLowerCase()}. Pending.`);
}

function mousePressed(ev) {
  if (!ready) return;
  // only presses on the illustration print; the sound button handles itself
  if (ev && ev.target && ev.target.tagName !== 'CANVAS') return;
  initAudioIfOn();
  holding = true;
  holdT = 0;
  holdAcc = 0;
  printBet(true);
  return false;
}

function mouseReleased() {
  holding = false;
  holdT = 0;
}

function keyPressed() {
  if (key === ' ' || keyCode === ENTER) {
    if (document.activeElement && document.activeElement.id === 'sound') return;
    printBet(true);
    return false;
  }
}

function initAudioIfOn() {
  if (soundOn) initAudio();
}

// ---------------------------------------------------------------- the paper path
// A turtle walks away from the printer mouth: straight up at first so the
// newest bet is always flat and legible, then a deliberate curl, then it
// wanders between waypoints with curves of varying size.
// Paper near the machine must never leave the frame. The turtle only takes a
// step if, from the new spot, a full hard-turn circle still fits inside the
// safe box; staying on such a circle is always allowed, so it can never be
// cornered. Further along the path (where only the oldest paper ever goes)
// the box grows past the frame, so the pile spills off the edges.

function resetPath() {
  // tightest turn allowed. A 230-wide receipt bent tighter than about 200
  // crowds its own print on the inside of the bend, so this is fixed, and
  // the paper may arc a little past the frame's edges to keep to it
  rHard = 200;
  const r = mulberry32(pathSeed);
  // the paper turns the opposite way from the last load, so every reload
  // visibly changes direction (a coin flip often repeated the same side)
  // (chosen once per page load, so resizing the window doesn't flip it)
  if (loadSide === null) {
    loadSide = r() < 0.5 ? -1 : 1;
    try {
      const last = Number(localStorage.getItem('smallHopesNeonSide'));
      if (last === 1 || last === -1) loadSide = -last;
      localStorage.setItem('smallHopesNeonSide', String(loadSide));
    } catch (e) { /* storage unavailable: keep the coin flip */ }
  }
  const side = loadSide;
  // the opening is different on every load: one of several shapes of bend,
  // each with its own tightness and length (curvature in units of 1/rHard)
  // [turn in radians, tightness as a fraction of the tightest turn]
  // gentle bends only: a 230-wide receipt bent tighter than this crowds its
  // own print on the inside of the bend
  const shapes = [
    () => [[side * (1.6 + r() * 0.8), 0.38 + r() * 0.12]],                                  // one wide hook
    () => [[side * (1.0 + r() * 0.5), 0.45], [-side * (1.2 + r() * 0.6), 0.4 + r() * 0.1]],  // an S-bend
    () => [[side * 0.3, 0.12], [side * (1.4 + r() * 0.7), 0.42 + r() * 0.08]],               // a lean, then a curve
    () => [[side * (0.7 + r() * 0.3), 0.45], [-side * (0.7 + r() * 0.3), 0.45], [side * (1.2 + r() * 0.6), 0.4]], // a wiggle, then a curve
    () => [[side * (1.1 + r() * 0.4), 0.3 + r() * 0.08]],                                   // a long sweep to one side
  ];
  // each bend becomes [length of paper, curvature in units of 1/rHard]
  const open = shapes[floor(r() * shapes.length)]().map(([turn, f]) => [abs(turn) * rHard / f, Math.sign(turn) * f]);
  turtle = {
    x: mouth.x, y: mouth.y, h: -HALF_PI, k: 0, wp: null, wpSteps: 0, rng: r, side,
    straight: STRAIGHT + r() * 20, open, openLen: open.reduce((n, [l]) => n + l, 0),
    lazy: 560 + r() * 240, tight: 300 + r() * 80,    // how lazy or tight its later curves get (never tight enough to crowd the print)
  };
  path = { xs: [mouth.x], ys: [mouth.y], hs: [-HALF_PI], ks: [], ph: [0] };
  buildTwists();
  extendPath(FOOT + fed + HEAD + 60);
}

function boxAt(s) {
  const m = lerp(PW / 2 + 14, -(PW / 2 + 140), smooth01((s - 1700) / 1500));
  // the sides give way just enough for a hard circle beside the straight run,
  // and the paper may arc out through the top of the frame and come back. The
  // straight run ends close to the top, so without that headroom every route
  // was forced into the same turn there and the random opening never showed
  return { l: min(m, SIDE_IN), r: VW - min(m, SIDE_IN), t: min(m, TOP_IN), b: VH - m };
}

// The strip lies flat, as in the original illustration: no twists or rolls.
function buildTwists() {
  twists = [];
}

function twistAt() {
  return 0;
}

function extendPath(toS) {
  while ((path.xs.length - 1) * DS < toS + DS * 2) stepTurtle();
}

function stepTurtle() {
  const t = turtle;
  const s = (path.xs.length - 1) * DS;
  let k = 0;
  if (s >= t.straight) {
    let want;
    if (s < t.straight + t.openLen) {
      let d = s - t.straight, seg = 0;
      while (d > t.open[seg][0]) d -= t.open[seg++][0];
      want = t.open[seg][1] / rHard;
    } else {
      if (!t.wp || dist(t.x, t.y, t.wp.x, t.wp.y) < 200 || t.wpSteps > 600) {
        t.wp = pickWaypoint(t, s);
        t.wpSteps = 0;
      }
      t.wpSteps++;
      // curves vary between lazy sweeps and tight loops
      const kmax = 1 / lerp(t.lazy, t.tight, noise(s * 0.0016, 7));
      const diff = wrapAngle(atan2(t.wp.y - t.y, t.wp.x - t.x) - t.h);
      want = constrain(diff / 210 + (noise(s * 0.003, 3) - 0.5) * 1.6 * kmax, -kmax, kmax);
    }
    // curvature changes gradually, so the paper never kinks
    const rate = s < t.straight + t.openLen ? 0.0013 : 0.0005;
    want = t.k + constrain(want - t.k, -rate, rate);
    k = steerInside(t, want, s);
  }
  t.k = k;
  t.h += k * DS;
  t.x += cos(t.h) * DS;
  t.y += sin(t.h) * DS;
  path.xs.push(t.x);
  path.ys.push(t.y);
  path.hs.push(t.h);
  path.ks.push(k);
  path.ph.push(0);
}

// Follow the curve we want, but when the paper is heading out of the frame,
// look ahead and blend in a turn back toward the middle (never tighter than
// rHard). Only close to an edge does the frame take over, so each load's random
// opening and wander actually show.
function steerInside(t, want, s) {
  const kh = 1 / rHard, b = boxAt(s);
  const lx = t.x + cos(t.h) * 230, ly = t.y + sin(t.h) * 230;
  const over = max(b.l - lx, lx - b.r, b.t - ly, ly - b.b, 0);
  if (over <= 0) return constrain(want, -kh, kh);
  const toMiddle = wrapAngle(atan2(VH * 0.45 - t.y, VW / 2 - t.x) - t.h);
  const away = toMiddle >= 0 ? kh : -kh;
  return constrain(lerp(want, away, smooth01(over / 120)), -kh, kh);
}

// the curvature nearest the one we want that keeps an escape circle in the box
function safeCurvature(t, want, s) {
  const kh = 1 / rHard;
  const tries = [want];
  for (let j = 1; j <= 6; j++) tries.push(lerp(want, kh, j / 6), lerp(want, -kh, j / 6));
  for (const k of tries) {
    const h = t.h + k * DS;
    if (hasEscape(t.x + cos(h) * DS, t.y + sin(h) * DS, h, s + DS)) return k;
  }
  // unreachable in practice: hugging the tighter side keeps us on a safe circle
  return hasEscape(t.x, t.y, t.h, s, 1) ? kh : -kh;
}

function hasEscape(x, y, h, s, only = 0) {
  // the turtle turns, then steps, so a hard turn traces a circle whose tangent
  // runs half a step ahead of the heading; use that exact circle
  const half = DS / (2 * rHard);
  const r = DS / (2 * sin(half)), slack = 0.5;
  const b = boxAt(s);
  for (const side of only ? [only] : [1, -1]) {
    const a = h + side * (half + HALF_PI);
    const cx = x + cos(a) * r;
    const cy = y + sin(a) * r;
    if (cx - r >= b.l - slack && cx + r <= b.r + slack &&
        cy - r >= b.t - slack && cy + r <= b.b + slack) return true;
  }
  return false;
}

function pickWaypoint(t, s) {
  const r = t.rng, b = boxAt(s + 400);
  let x, y;
  if (r() < 0.5) { // build up around the machine
    x = mouth.x + (r() * 2 - 1) * min(420, VW / 2);
    y = mouth.y - 40 - r() * 480;
  } else {
    x = b.l + r() * (b.r - b.l);
    y = b.t + r() * (b.b - b.t);
  }
  // aim back inside the frame: the headroom above it is only for passing through
  return { x: constrain(x, b.l, b.r), y: constrain(y, max(b.t, PW / 2 + 14), b.b) };
}

// position, heading, curvature and twist at arclength s
function geo(s) {
  let x, y, h, k = 0, ph = 0;
  if (s <= 0) {
    x = path.xs[0];
    y = path.ys[0] - s;
    h = -HALF_PI;
  } else {
    const f = s / DS, i = floor(f), t = f - i;
    x = lerp(path.xs[i], path.xs[i + 1], t);
    y = lerp(path.ys[i], path.ys[i + 1], t);
    h = lerp(path.hs[i], path.hs[i + 1], t);
    k = path.ks[i] || 0;
    ph = lerp(path.ph[i], path.ph[i + 1], t);
  }
  // the free end swings a little after every feed, then settles
  ph += wob * smooth01((s - (curSEnd - 170)) / 170);
  return { x, y, h, k, ph };
}

// the ribbon's cross-section at s: centre, across-vector, and how it faces us
function rib(s) {
  const g = geo(s);
  const cph = cos(g.ph), sph = sin(g.ph);
  const nx = -sin(g.h), ny = cos(g.h);
  return { s, x: g.x, y: g.y, h: g.h, k: g.k, cph, sph, nx, ny, bx: cph * nx, by: cph * ny };
}

const tintAt = s => TINT_MAX * smooth01((s - 1100) / 3000);

// ---------------------------------------------------------------- rendering

function renderScene(now) {
  const S = pd * u;
  curSEnd = FOOT + fed + HEAD;
  extendPath(curSEnd + 40);
  renderPaper(pctx, S, now);

  const c = sctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.drawImage(bgCanvas, 0, 0);
  c.setTransform(S, 0, 0, S, 0, 0);
  drawStars(c, now);
  drawPrinterBack(c, now);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = paperAlpha;
  c.drawImage(paperCv, 0, 0);
  c.globalAlpha = 1;
  c.setTransform(S, 0, 0, S, 0, 0);
  drawPrinterFront(c, now);
}

function paperChunks(now, sEnd) {
  // oldest (furthest from the slot) first
  const ch = [{ a: sEnd - HEAD, b: sEnd, sc: sEnd - HEAD / 2, len: HEAD, tex: headerTex(), e: null }];
  entries.forEach((e, i) => {
    const s1 = FOOT + fed - i * EL, s0 = s1 - EL;
    if (s1 <= FOOT) return;
    ch.push({ a: max(s0, FOOT), b: s1, sc: (s0 + s1) / 2, len: EL, tex: entryTex(e, now), e });
  });
  ch.push({ a: 0, b: FOOT, sc: FOOT / 2, len: FOOT, tex: footerTex(), e: null });
  ch.push({ a: -40, b: 0, sc: -20, len: 40, tex: null, e: null });
  return ch;
}

// The paper works the way the original betting illustration's did: one flat
// strip stroked along the path, with every ticket drawn whole and upright at
// its place on the strip, oldest first so newer paper lies on top. Nothing is
// sliced or bent, so the print never stretches.

function stripPath(c, s0, s1, dx = 0, dy = 0) {
  c.beginPath();
  for (let s = s0, first = true; ; s = min(s1, s + DS)) {
    const g = geo(s);
    if (first) c.moveTo(g.x + dx, g.y + dy);
    else c.lineTo(g.x + dx, g.y + dy);
    first = false;
    if (s >= s1) break;
  }
}

function renderPaper(c, S, now) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, paperCv.width, paperCv.height);
  const sEnd = curSEnd;
  const chunks = paperChunks(now, sEnd);
  c.setTransform(S, 0, 0, S, 0, 0);
  c.lineJoin = 'round';
  c.lineCap = 'butt';

  // one soft shadow under the whole strip, and a pink neon halo around the newer paper
  stripPath(c, -40, sEnd, 6, 10);
  c.strokeStyle = 'rgba(0,2,20,0.45)';
  c.lineWidth = PW + 4;
  c.stroke();
  c.save();
  stripPath(c, -40, min(sEnd, 1400));
  c.shadowColor = 'rgba(110,200,255,0.85)';
  c.shadowBlur = 22 * S;
  c.strokeStyle = 'rgba(160,220,255,0.5)';
  c.lineWidth = PW + 6;
  c.stroke();
  c.restore();

  // the totals block glows: drawn first, under all the paper, so the halo
  // spreads around it without fogging the tickets above
  c.setTransform(S, 0, 0, S, 0, 0);
  {
    const pulse = 0.75 + 0.25 * sin(now * 2.2);
    c.save();
    stripPath(c, -6, FOOT);
    c.lineCap = 'round';
    c.shadowColor = `rgba(150,220,255,${pulse})`;
    c.shadowBlur = 55 * S * pulse;
    c.strokeStyle = `rgba(210,245,255,${0.8 * pulse})`;
    c.lineWidth = PW + 10;
    c.stroke();
    c.stroke(); // twice, for a fuller halo
    c.restore();
  }
  chunks.forEach(ch => drawTicket(c, S, ch, now, sEnd));

  // the slot's shadow on the paper it is feeding
  c.setTransform(S, 0, 0, S, S * mouth.x, S * mouth.y);
  // kept to a thin band at the lip, so it doesn't dim the totals
  const g = c.createLinearGradient(0, 2, 0, -14);
  g.addColorStop(0, 'rgba(6,9,40,0.6)');
  g.addColorStop(0.5, 'rgba(6,9,40,0.15)');
  g.addColorStop(1, 'rgba(6,9,40,0)');
  c.fillStyle = g;
  c.fillRect(-PW / 2 - 3, -14, PW + 6, 18);
}

function drawTicket(c, S, ch, now, sEnd) {
  const t = tintAt(ch.sc);
  // the totals block at the slot is the slip that matters most: a paler tint
  // of the ticket blue, and it glows, breathing slowly
  const totals = ch.len === FOOT || ch.b <= 0;
  const paper = totals ? rgbStr(TOTALS_RGB) : rgbStr(mix(TICKET_RGB, HAZE_RGB, t * 1.25));
  c.setTransform(S, 0, 0, S, 0, 0);
  // the strip: ink edge, paper, and a printed border just inside the edge
  stripPath(c, ch.a, min(ch.b + 2, sEnd));
  c.strokeStyle = rgbStr(mix(TICKET_EDGE_RGB, HAZE_RGB, t), 1);
  c.lineWidth = PW + 4;
  c.stroke();
  c.strokeStyle = paper;
  c.lineWidth = PW - 1;
  c.stroke();
  c.strokeStyle = rgbStr(mix(TICKET_LINE_RGB, HAZE_RGB, t * 1.25), 0.75);
  c.lineWidth = PW - 14;
  c.stroke();
  c.strokeStyle = paper;
  c.lineWidth = PW - 17;
  c.stroke();

  // the print, whole and upright on its stretch of strip
  if (ch.tex) {
    const g = geo(ch.sc);
    const nx = -sin(g.h), ny = cos(g.h), tx = cos(g.h), ty = sin(g.h);
    c.save();
    // the print stays on its own ticket: clip to this stretch of strip, so on a
    // curve it is cut at the tear lines instead of running into its neighbours
    c.beginPath();
    for (let s = ch.a, first = true; ; s = min(ch.b, s + DS)) {
      const q = geo(s), w = PW / 2 + 6;
      first ? c.moveTo(q.x - sin(q.h) * w, q.y + cos(q.h) * w) : c.lineTo(q.x - sin(q.h) * w, q.y + cos(q.h) * w);
      first = false;
      if (s >= ch.b) break;
    }
    for (let s = ch.b; ; s = max(ch.a, s - DS)) {
      const q = geo(s), w = PW / 2 + 6;
      c.lineTo(q.x + sin(q.h) * w, q.y - cos(q.h) * w);
      if (s <= ch.a) break;
    }
    c.closePath();
    c.clip();
    c.setTransform(S * nx, S * ny, -S * tx, -S * ty, S * g.x, S * g.y);
    const vis = ch.sc - ch.a; // local y where this ticket disappears under the totals block
    if (vis < ch.len / 2) {
      c.beginPath();
      c.rect(-PW / 2 - 4, -ch.len / 2 - 4, PW + 8, vis + ch.len / 2 + 4);
      c.clip();
    }
    const alpha = max(0.3, 1 - t * 1.5);
    c.globalAlpha = alpha;
    if (ch.len === HEAD) drawRows(c, S, ch, HEAD_ROWS);
    else if (ch.e) drawRows(c, S, ch, ENTRY_ROWS);
    else c.drawImage(ch.tex, -PW / 2, -ch.len / 2, PW, ch.len);
    if (ch.e) {
      // the drawing sits square on the strip at its own centre
      const q = geo(ch.sc + 17);
      c.setTransform(-S * sin(q.h), S * cos(q.h), -S * cos(q.h), -S * sin(q.h), S * q.x, S * q.y);
      c.translate(0, 17);
      drawIcon(c, ch.e, vis, now, alpha);
    }
    c.restore();
  }

  // arcade tickets are notched where one tears from the next
  if (ch.e || ch.len === FOOT) {
    const g = geo(ch.b), nx = -sin(g.h), ny = cos(g.h), w = PW / 2 + 1;
    c.setTransform(S, 0, 0, S, 0, 0);
    for (const side of [1, -1]) {
      const x = g.x + side * nx * w, y = g.y + side * ny * w;
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      c.arc(x, y, 8, 0, TWO_PI);
      c.fill();
      c.restore();
      c.beginPath();
      c.arc(x, y, 8, 0, TWO_PI);
      c.strokeStyle = rgbStr(mix(TICKET_EDGE_RGB, HAZE_RGB, t), 0.9);
      c.lineWidth = 1.6;
      c.stroke();
    }
  }
}

// On a curve, a ticket placed as one rigid block drifts off the paper at its
// ends and gets cut. Instead each row of print is placed square on the strip
// at its own point along it. Rows break between lines of type, so no letter is
// ever split; a row's own print is never bent.
const HEAD_ROWS = [[-66, -19], [-19, -5], [-5, 8], [8, 24], [24, 40], [40, 66]];
const ENTRY_ROWS = [[-50, -39], [-39, -20], [-20, -2], [-2, 50]];

function drawRows(c, S, ch, rows) {
  const ts = ch.tex.height / ch.len;
  for (const [y0, y1] of rows) {
    const ym = (y0 + y1) / 2, g = geo(ch.sc - ym);
    const nx = -sin(g.h), ny = cos(g.h), tx = cos(g.h), ty = sin(g.h);
    c.setTransform(S * nx, S * ny, -S * tx, -S * ty, S * g.x, S * g.y);
    c.drawImage(ch.tex, 0, (y0 + ch.len / 2) * ts, ch.tex.width, (y1 - y0) * ts, -PW / 2, y0 - ym, PW, y1 - y0);
  }
}

// the drawing waits until it has fully cleared the totals block, then fades in;
// a half-fed drawing only showed its top outline, which read as a stray line
function drawIcon(c, e, vis, now, alpha) {
  if (vis >= 6 && e.iconT === null) e.iconT = now;
  if (e.iconT === null) return;
  c.globalAlpha = alpha * constrain((now - e.iconT) / 0.22, 0, 1);
  c.drawImage(icons[e.icon].elt, -107, -38, 42, 42);
  c.globalAlpha = alpha;
}

// ---------------------------------------------------------------- receipt textures
// Each piece of the slip is drawn once, in paper units, into its own canvas.

function makeTex(len) {
  const cv = document.createElement('canvas');
  cv.width = ceil(PW * texScale);
  cv.height = ceil(len * texScale);
  return cv;
}

function texCtx(cv, len) {
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cv.width, cv.height);
  c.setTransform(texScale, 0, 0, texScale, (PW / 2) * texScale, (len / 2) * texScale);
  c.textBaseline = 'alphabetic';
  return c;
}

function entryTex(e, now) {
  if (!e.base || e.base.width !== ceil(PW * texScale)) {
    e.base = makeTex(EL);
    const c = texCtx(e.base, EL);
    drawEntryInk(c, e);
    wearInk(c, EL, e.seed);
    e.tex = null;
  }
  const anim = e.stampT === null ? 0 : constrain((now - e.stampT) / 0.24, 0, 1);
  const key = e.stampT === null ? 'none' : `${e.status}:${anim.toFixed(2)}`;
  if (e.tex && e.texKey === key) return e.tex;
  if (!e.tex) e.tex = makeTex(EL);
  const c = e.tex.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, e.tex.width, e.tex.height);
  c.drawImage(e.base, 0, 0);
  c.setTransform(texScale, 0, 0, texScale, (PW / 2) * texScale, (EL / 2) * texScale);
  if (e.stampT !== null) drawStampOn(c, e, anim);
  grain(c, EL, e.seed);
  e.texKey = key;
  return e.tex;
}

function drawEntryInk(c, e) {
  // tear line from the bet above
  c.strokeStyle = NAVY;
  c.globalAlpha = 0.45;
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(-104, -48);
  c.lineTo(104, -48);
  c.stroke();
  c.setLineDash([]);
  c.globalAlpha = 1;

  // left column: the drawing and the ticket number
  txt(c, `NO. ${nf(e.no, 4)}`, -86, 17, `700 6.5px ${SANS}`, NAVY, 'center', 0.75, 0.6);

  // the hope, as a condensed headline
  const ly = e.lines.length > 1 ? [-28, -11] : [-18];
  e.lines.forEach((l, k) => txt(c, l, -56, ly[k], `15.5px ${DISPLAY}`, INK, 'left', 1, 0.15));

  c.fillStyle = NAVY;
  c.globalAlpha = 0.3;
  c.fillRect(-56, -2, 162, 0.8);
  c.globalAlpha = 1;

  // odds and stake, each with a small label
  txt(c, 'ODDS', -56, 10, `700 6px ${SANS}`, NAVY, 'left', 0.7, 1.2);
  txt(c, e.odds, -56, 33, `21px ${DISPLAY}`, NAVY, 'left', 1, 0.3);
  txt(c, 'STAKE', -12, 10, `700 6px ${SANS}`, NAVY, 'left', 0.7, 1.2);
  e.stakeLines.forEach((l, k) => txt(c, l, -12, 22 + k * 10, `700 8.5px ${SANS}`, INK, 'left', 0.9, 0.2));
}

function drawStampOn(c, e, anim) {
  const ease = 1 - pow(1 - anim, 3);
  // a settled bet keeps the ghost of its PENDING stamp underneath
  if (e.status !== 'PENDING') stampAt(c, 'PENDING', e.v0, e.rot0, 0.2, 1);
  const rot = e.status === 'PENDING' ? e.rot0 : e.rot;
  stampAt(c, e.status, e.status === 'PENDING' ? e.v0 : e.v1, rot, ease, 1 + 0.6 * (1 - ease));
}

function stampAt(c, k, v, rot, alpha, scl) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(79, 19);
  c.rotate(rot);
  c.scale(scl, scl);
  c.drawImage(stamps[k][v], -35, -14, 70, 28);
  c.restore();
}

function headerTex() {
  if (headTex && headScale === texScale) return headTex;
  headTex = makeTex(HEAD);
  headScale = texScale;
  const c = texCtx(headTex, HEAD);
  sparkle(c, -94, -44, 7, YELLOW_D);
  sparkle(c, 94, -44, 7, YELLOW_D);
  txt(c, 'THE EVERYTHING BOOK', 0, -30, `25px ${DISPLAY}`, NAVY, 'center', 1, 0.6);
  txt(c, 'BET SLIP · FICTIONAL SIMULATION', 0, -12, `700 8px ${SANS}`, CORAL_D, 'center', 1, 1.1);
  txt(c, 'ALL ODDS INVENTED · NO REAL MONEY', 0, 2, `700 8px ${SANS}`, NAVY, 'center', 1, 0.6);
  txt(c, 'OPEN 24/7 · EVERY HOPE ACCEPTED', 0, 15, `400 8px ${SANS}`, NAVY, 'center', 0.75, 0.6);
  c.strokeStyle = NAVY;
  c.globalAlpha = 0.45;
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(-104, 32);
  c.lineTo(104, 32);
  c.stroke();
  c.setLineDash([]);
  c.globalAlpha = 1;
  txt(c, 'HOPE', -104, 50, `700 6px ${SANS}`, NAVY, 'left', 0.7, 1.2);
  txt(c, 'STATUS', 104, 50, `700 6px ${SANS}`, NAVY, 'right', 0.7, 1.2);
  wearInk(c, HEAD, 3);
  grain(c, HEAD, 4);
  return headTex;
}

function footerTex() {
  const n = entries.length;
  const won = entries.filter(e => e.status === 'WON').length;
  const lost = entries.filter(e => e.status === 'LOST').length;
  const key = `${n}|${won}|${lost}|${texScale}`;
  if (footTex && footKey === key) return footTex;
  footKey = key;
  if (!footTex || footTex.width !== ceil(PW * texScale)) footTex = makeTex(FOOT);
  const c = texCtx(footTex, FOOT);
  c.fillStyle = NAVY;
  c.fillRect(-104, -58, 208, 2);
  c.fillRect(-104, -54, 208, 0.8);
  txt(c, 'TOTAL WAGERED: YOUR TIME', 0, -28, `19px ${DISPLAY}`, NAVY, 'center', 1, 0.4);
  c.font = `19px ${DISPLAY}`;
  const a = 'PAYOUT: ', b = 'STILL PENDING';
  const wa = c.measureText(a).width, wb = c.measureText(b).width;
  txt(c, a, -(wa + wb) / 2, -6, `19px ${DISPLAY}`, NAVY);
  txt(c, b, -(wa + wb) / 2 + wa, -6, `19px ${DISPLAY}`, CORAL_D);
  txt(c, `BETS ${n} · WON ${won} · LOST ${lost} · PENDING ${n - won - lost}`, 0, 11, `700 7.5px ${SANS}`, NAVY, 'center', 0.9, 0.5);
  let x = -80;
  c.fillStyle = INK;
  barcode.forEach((w, i) => {
    if (i % 2 === 0) c.fillRect(x, 20, w, 24);
    x += w + 1.6;
  });
  wearInk(c, FOOT, 5);
  grain(c, FOOT, 6);
  return footTex;
}

// thermal print is never perfect: knock tiny specks out of the ink
function wearInk(c, len, seed) {
  const r = mulberry32(seed);
  c.save();
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < (PW * len) / 40; i++) {
    c.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.5})`;
    const s = 0.3 + r() * 0.7;
    c.fillRect(-PW / 2 + r() * PW, -len / 2 + r() * len, s, s);
  }
  c.restore();
}

// paper fibre: faint warm specks that travel with the paper
function grain(c, len, seed) {
  const r = mulberry32(seed + 17);
  for (let i = 0; i < (PW * len) / 70; i++) {
    c.fillStyle = r() < 0.7 ? 'rgba(120,96,60,0.07)' : 'rgba(255,255,255,0.35)';
    const s = 0.5 + r() * 0.9;
    c.fillRect(-PW / 2 + r() * PW, -len / 2 + r() * len, s, s);
  }
}

function txt(c, str, x, y, font, color, align = 'left', alpha = 1, spacing = 0) {
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.globalAlpha = alpha;
  if ('letterSpacing' in c) c.letterSpacing = `${spacing}px`;
  c.fillText(str, x, y);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.globalAlpha = 1;
}

function sparkle(c, x, y, r, col, alpha = 1) {
  c.fillStyle = col;
  c.globalAlpha = alpha;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * PI) / 4 - HALF_PI, rr = i % 2 ? r * 0.3 : r;
    c.lineTo(x + rr * cos(a), y + rr * sin(a));
  }
  c.closePath();
  c.fill();
  c.globalAlpha = 1;
}

// ---------------------------------------------------------------- printer
// Drawn in units around the slot (0, 0). Glossy mint glass with chrome trim,
// lit by the tunnel's neon, plugged in by cables. It squashes a touch on each bet.

const TEAL_INK = '#0b2b30';

function glow(c, col, blur) {
  c.shadowColor = col;
  c.shadowBlur = blur * u * pd;
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 0;
}

function noGlow(c) {
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
}

function chromeGrad(c, y0, y1) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, '#c9d3dd');
  g.addColorStop(0.55, '#6f7a88');
  g.addColorStop(0.78, '#eef3f8');
  g.addColorStop(1, '#8a95a3');
  return g;
}

function glassGrad(c, y0, y1) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#d2f7ec');
  g.addColorStop(0.3, '#8fd8c7');
  g.addColorStop(1, '#2a6a63');
  return g;
}

function printerPulse(c) {
  c.translate(mouth.x, mouth.y + 240);
  c.scale(1 + 0.008 * pulse, 1 - 0.016 * pulse);
  c.translate(0, -240);
}

function drawPrinterBack(c, now) {
  c.save();
  printerPulse(c);
  // the hood, behind the paper
  c.beginPath();
  c.roundRect(-170, -50, 340, 78, [36, 36, 8, 8]);
  glow(c, 'rgba(140,240,255,0.55)', 26);
  c.fillStyle = glassGrad(c, -50, 28);
  c.fill();
  noGlow(c);
  c.lineWidth = 3;
  c.strokeStyle = TEAL_INK;
  c.stroke();
  c.beginPath();
  c.roundRect(-146, -45, 230, 9, 4.5);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.fill();
  // the slot, lit from inside
  c.beginPath();
  c.roundRect(-138, -24, 276, 28, 11);
  const g = c.createLinearGradient(0, -24, 0, 4);
  g.addColorStop(0, '#00000e');
  g.addColorStop(1, '#0f1a50');
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 3;
  c.stroke();
  c.beginPath();
  c.moveTo(-126, -19);
  c.lineTo(126, -19);
  glow(c, 'rgba(111,227,255,0.95)', 12);
  c.strokeStyle = 'rgba(160,240,255,0.85)';
  c.lineWidth = 2;
  c.stroke();
  noGlow(c);
  marquee(c, now, -50, 11, 140);
  c.restore();
}

// a row of arcade marquee bulbs; they chase, and run faster while paper feeds
let chase = 0, lastChase = 0;
function marquee(c, now, y, n, half) {
  if (now !== lastChase) {
    chase += (now - lastChase) * (fedV > 1 ? 14 : 4);
    lastChase = now;
  }
  for (let i = 0; i < n; i++) {
    const x = lerp(-half, half, i / (n - 1));
    const on = (i + floor(chase)) % 3 === 0;
    if (on) {
      const g = c.createRadialGradient(x, y, 0, x, y, 16);
      g.addColorStop(0, 'rgba(255,214,90,0.6)');
      g.addColorStop(1, 'rgba(255,214,90,0)');
      c.fillStyle = g;
      c.fillRect(x - 16, y - 16, 32, 32);
    }
    c.beginPath();
    c.arc(x, y, 5.5, 0, TWO_PI);
    const b = c.createRadialGradient(x - 1.8, y - 2, 0.5, x, y, 6);
    b.addColorStop(0, on ? '#ffffff' : '#c9a24a');
    b.addColorStop(0.5, on ? '#ffe27a' : '#7a5a18');
    b.addColorStop(1, on ? '#f0a400' : '#3a2a08');
    c.fillStyle = b;
    c.fill();
    c.lineWidth = 1.5;
    c.strokeStyle = TEAL_INK;
    c.stroke();
  }
}

function bodyPath(c) {
  // a little lopsided on purpose: the right flank bulges more than the left
  c.beginPath();
  c.moveTo(-158, 6);
  c.lineTo(162, 6);
  c.bezierCurveTo(198, 6, 214, 46, 212, 124);
  c.bezierCurveTo(210, 204, 196, 232, 160, 232);
  c.lineTo(-156, 232);
  c.bezierCurveTo(-192, 232, -204, 204, -204, 124);
  c.bezierCurveTo(-204, 46, -192, 6, -158, 6);
  c.closePath();
}

function drawPrinterFront(c, now) {
  c.save();
  printerPulse(c);
  c.lineJoin = 'round';
  c.lineCap = 'round';

  // stubby feet
  for (const fx of [-126, 128]) {
    c.beginPath();
    c.roundRect(fx - 34, 212, 68, 34, 14);
    c.fillStyle = chromeGrad(c, 212, 246);
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = TEAL_INK;
    c.stroke();
  }

  // body: glossy mint glass, glowing at the edges
  bodyPath(c);
  glow(c, 'rgba(140,240,255,0.55)', 36);
  c.fillStyle = glassGrad(c, 6, 232);
  c.fill();
  noGlow(c);
  c.save();
  bodyPath(c);
  c.clip();
  let g = c.createRadialGradient(-110, 40, 0, -110, 40, 170);
  g.addColorStop(0, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(-220, 0, 440, 240);
  g = c.createLinearGradient(-210, 0, 214, 0);
  g.addColorStop(0.55, 'rgba(4,28,34,0)');
  g.addColorStop(1, 'rgba(4,28,34,0.5)');
  c.fillStyle = g;
  c.fillRect(-220, 0, 440, 240);
  // white rim light down the left flank
  c.translate(5, 3);
  bodyPath(c);
  c.lineWidth = 6;
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.stroke();
  c.restore();
  bodyPath(c);
  c.lineWidth = 3.5;
  c.strokeStyle = TEAL_INK;
  c.stroke();

  // chrome lip at the slot
  c.beginPath();
  c.roundRect(-152, -6, 304, 22, 11);
  c.fillStyle = chromeGrad(c, -6, 16);
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = TEAL_INK;
  c.stroke();

  // neon nameplate
  glow(c, 'rgba(255,70,220,1)', 16);
  txt(c, 'HOPE-O-MATIC', 0, 49, `22px ${DISPLAY}`, '#ffe0fa', 'center', 1, 2);
  txt(c, 'HOPE-O-MATIC', 0, 49, `22px ${DISPLAY}`, '#ffe0fa', 'center', 1, 2);
  noGlow(c);

  // control panel: a window into deep space, in a chrome bezel
  c.beginPath();
  c.roundRect(-180, 62, 360, 146, 28);
  g = c.createLinearGradient(0, 62, 0, 208);
  g.addColorStop(0, '#0b1144');
  g.addColorStop(1, '#03041a');
  c.fillStyle = g;
  c.fill();
  c.save();
  c.clip();
  const r = mulberry32(21);
  for (let i = 0; i < 60; i++) {
    c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`;
    c.fillRect(-176 + r() * 352, 66 + r() * 138, 1.3, 1.3);
  }
  c.translate(0, 5);
  c.beginPath();
  c.roundRect(-180, 62, 360, 146, 28);
  c.lineWidth = 12;
  c.strokeStyle = 'rgba(0,0,10,0.5)';
  c.stroke();
  c.restore();
  c.beginPath();
  c.roundRect(-180, 62, 360, 146, 28);
  c.lineWidth = 6;
  c.strokeStyle = chromeGrad(c, 62, 208);
  c.stroke();
  c.lineWidth = 2;
  c.strokeStyle = TEAL_INK;
  c.stroke();

  drawCounter(c);
  drawButton(c, now);
  marquee(c, now, 226, 13, 150);
  c.restore();
}

// a mechanical odometer: each wheel rolls only while the ones below pass 9 → 0
function drawCounter(c) {
  c.beginPath();
  c.roundRect(-164, 78, 190, 88, 16);
  c.fillStyle = '#02031a';
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = chromeGrad(c, 78, 166);
  c.stroke();

  const v = min(countDisp, 999.999), n = floor(v + 1e-6), frac = v - n;
  const CH = 62;
  for (let i = 0; i < 3; i++) {
    const place = 10 ** (2 - i);
    const digit = floor(n / place) % 10;
    const roll = n % place === place - 1 ? frac : 0;
    const x = -155 + i * 59, y = 86, w = 54, h = 72;
    c.save();
    c.beginPath();
    c.roundRect(x, y, w, h, 9);
    let g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#060a2e');
    g.addColorStop(0.5, '#1b2370');
    g.addColorStop(1, '#060a2e');
    c.fillStyle = g;
    c.fill();
    c.clip();
    c.font = `48px ${DISPLAY}`;
    c.textAlign = 'center';
    glow(c, 'rgba(255,207,26,0.95)', 12);
    c.fillStyle = '#ffe680';
    const cy = y + h / 2 + 18 - roll * CH;
    c.fillText(String(digit), x + w / 2, cy);
    c.fillText(String((digit + 1) % 10), x + w / 2, cy + CH);
    noGlow(c);
    g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(0,0,12,0.8)');
    g.addColorStop(0.28, 'rgba(0,0,12,0)');
    g.addColorStop(0.72, 'rgba(0,0,12,0)');
    g.addColorStop(1, 'rgba(0,0,12,0.8)');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.restore();
  }
  c.save();
  c.beginPath();
  c.roundRect(-164, 78, 190, 88, 16);
  c.clip();
  c.beginPath();
  c.moveTo(-164, 78);
  c.lineTo(-96, 78);
  c.lineTo(-150, 166);
  c.lineTo(-164, 166);
  c.closePath();
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.fill();
  c.restore();
  txt(c, 'BETS PLACED', -69, 188, `700 7.5px ${SANS}`, '#c8f3ff', 'center', 0.75, 1.8);
}

// a glossy candy-red button, like the dice and cherries in the original art
function drawButton(c, now) {
  const x = 100, y = 128;
  const since = now - btnT;
  const press = holding ? 1 : since < 0.08 ? 1 : max(0, 1 - (since - 0.08) * 7);
  c.beginPath();
  c.arc(x, y + 4, 48, 0, TWO_PI);
  c.fillStyle = chromeGrad(c, y - 44, y + 52);
  c.fill();
  c.lineWidth = 2.5;
  c.strokeStyle = TEAL_INK;
  c.stroke();
  c.beginPath();
  c.arc(x, y + 4, 41, 0, TWO_PI);
  c.fillStyle = '#02031a';
  c.fill();
  c.beginPath();
  c.arc(x, y + 9, 37, 0, TWO_PI);
  c.fillStyle = '#7a0412';
  c.fill();
  const fy = y + press * 6;
  c.beginPath();
  c.arc(x, fy, 37, 0, TWO_PI);
  glow(c, `rgba(255,40,70,${0.35 + 0.5 * press})`, 22);
  const g = c.createRadialGradient(x - 12, fy - 14, 3, x, fy, 40);
  g.addColorStop(0, '#ffb0b8');
  g.addColorStop(0.4, '#f0213f');
  g.addColorStop(1, '#8e0518');
  c.fillStyle = g;
  c.fill();
  noGlow(c);
  c.lineWidth = 3;
  c.strokeStyle = '#3a0008';
  c.stroke();
  c.beginPath();
  c.ellipse(x - 12, fy - 16, 15, 8, -0.5, 0, TWO_PI);
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.fill();
  c.beginPath();
  c.arc(x + 18, fy + 14, 3, 0, TWO_PI);
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.fill();
  txt(c, 'PRINT', x, fy + 7, `17px ${DISPLAY}`, '#ffffff', 'center', 0.95, 1);
  txt(c, 'PRESS · HOLD', x, 196, `700 6.5px ${SANS}`, '#c8f3ff', 'center', 0.65, 1.5);
}

// ---------------------------------------------------------------- background
// A neon corridor in one-point perspective, opening onto deep space: a star
// field over the whole frame, frames receding to a glowing far wall and rails
// converging on it, and a pool of light under the machine.

// the brightest stars: a soft halo, a hot core and faint diffraction spikes,
// each breathing in and out at its own pace
let brightStars = [];

function drawStars(c, now) {
  for (const st of brightStars) {
    const tw = 0.55 + 0.45 * sin(now * st.speed + st.phase);
    const a = 0.45 + 0.55 * tw, R = st.size * (3 + 2 * tw);
    const g = c.createRadialGradient(st.x, st.y, 0, st.x, st.y, R * 2.2);
    g.addColorStop(0, rgbStr(st.tint, 0.45 * a));
    g.addColorStop(1, rgbStr(st.tint, 0));
    c.fillStyle = g;
    c.fillRect(st.x - R * 2.2, st.y - R * 2.2, R * 4.4, R * 4.4);
    c.lineWidth = 0.6;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const lg = c.createLinearGradient(st.x - dx * R * 2.5, st.y - dy * R * 2.5, st.x + dx * R * 2.5, st.y + dy * R * 2.5);
      lg.addColorStop(0, rgbStr(st.tint, 0));
      lg.addColorStop(0.5, rgbStr(st.tint, 0.7 * a));
      lg.addColorStop(1, rgbStr(st.tint, 0));
      c.strokeStyle = lg;
      c.beginPath();
      c.moveTo(st.x - dx * R * 2.5, st.y - dy * R * 2.5);
      c.lineTo(st.x + dx * R * 2.5, st.y + dy * R * 2.5);
      c.stroke();
    }
    c.fillStyle = rgbStr([255, 255, 255], a);
    c.beginPath();
    c.arc(st.x, st.y, st.size * 0.55, 0, TWO_PI);
    c.fill();
  }
}

function buildBackground() {
  const cv = document.createElement('canvas');
  cv.width = round(width * pd);
  cv.height = round(height * pd);
  const c = cv.getContext('2d');
  c.scale(pd * u, pd * u);
  c.fillStyle = '#04061a';
  c.fillRect(0, 0, VW, VH);

  const vx = VW / 2, vy = VH * 0.34;
  // a soft glow far down the corridor
  let g = c.createRadialGradient(vx, vy, 0, vx, vy, VW * 0.45);
  g.addColorStop(0, 'rgba(120,170,255,0.4)');
  g.addColorStop(1, 'rgba(120,170,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, VW, VH);

  const r = mulberry32(9);

  // a real-looking star field over the whole frame: hundreds of pinpricks,
  // mostly faint and tiny, a few brighter; white with a touch of blue or warmth
  const tints = [[255, 255, 255], [200, 220, 255], [170, 200, 255], [255, 236, 210], [255, 220, 200]];
  const nStars = round((VW * VH) / 900);
  for (let i = 0; i < nStars; i++) {
    const x = r() * VW, y = r() * VH;
    const m = pow(r(), 3);                      // most stars are faint
    const rad = 0.35 + m * 1.1;
    const tint = tints[floor(r() * tints.length)];
    c.fillStyle = rgbStr(tint, 0.25 + m * 0.75);
    c.beginPath();
    c.arc(x, y, rad, 0, TWO_PI);
    c.fill();
  }
  // the brightest few are drawn live, so they can twinkle (see drawStars)
  brightStars = [];
  for (let i = 0; i < round(nStars / 22); i++) {
    brightStars.push({
      x: r() * VW, y: r() * VH, size: 1.2 + pow(r(), 2) * 2.2,
      tint: tints[floor(r() * tints.length)], speed: 0.6 + r() * 1.8, phase: r() * TWO_PI,
    });
  }

  // the grid: rails converging on the far wall, and frames receding to it
  const neon = (col, blur, w) => {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.shadowColor = col;
    c.shadowBlur = blur * u * pd;
  };
  const frame = k => {
    const sc = pow(0.68, k * 8);
    const cx = lerp(vx, VW / 2, sc), cy = lerp(vy, VH / 2, sc);
    return { x0: cx - (VW / 2) * sc * 1.02, x1: cx + (VW / 2) * sc * 1.02, y0: cy - (VH / 2) * sc * 1.02, y1: cy + (VH / 2) * sc * 1.02 };
  };
  const outer = frame(0), inner = frame(1);
  c.fillStyle = 'rgba(30,50,140,0.45)';
  c.fillRect(inner.x0, inner.y0, inner.x1 - inner.x0, inner.y1 - inner.y0);
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    [
      [lerp(outer.x0, outer.x1, t), outer.y0, lerp(inner.x0, inner.x1, t), inner.y0],
      [lerp(outer.x0, outer.x1, t), outer.y1, lerp(inner.x0, inner.x1, t), inner.y1],
      [outer.x0, lerp(outer.y0, outer.y1, t), inner.x0, lerp(inner.y0, inner.y1, t)],
      [outer.x1, lerp(outer.y0, outer.y1, t), inner.x1, lerp(inner.y0, inner.y1, t)],
    ].forEach(([x0, y0, x1, y1], j) => {
      neon(i % 4 === 2 && j % 2 ? 'rgba(220,80,255,0.55)' : 'rgba(70,150,255,0.5)', 8, 1.6);
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
    });
  }
  for (let i = 1; i <= 12; i++) {
    const f = frame(i / 12);
    neon(i % 3 === 0 ? 'rgba(220,80,255,0.6)' : 'rgba(90,170,255,0.7)', 12, i % 3 === 0 ? 2 : 2.6);
    c.strokeRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0);
  }
  c.shadowBlur = 0;
  c.shadowColor = 'rgba(0,0,0,0)';

  // floor glow and the machine's shadow
  g = c.createRadialGradient(mouth.x, mouth.y + 180, 0, mouth.x, mouth.y + 180, 360);
  g.addColorStop(0, 'rgba(120,230,255,0.3)');
  g.addColorStop(1, 'rgba(120,230,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, VW, VH);
  c.save();
  c.translate(mouth.x, mouth.y + 244);
  c.scale(1, 0.12);
  g = c.createRadialGradient(0, 0, 0, 0, 0, 270);
  g.addColorStop(0, 'rgba(0,0,12,0.75)');
  g.addColorStop(1, 'rgba(0,0,12,0)');
  c.fillStyle = g;
  c.fillRect(-280, -280, 560, 560);
  c.restore();
  // vignette
  const R = max(VW, VH);
  g = c.createRadialGradient(VW / 2, VH * 0.45, R * 0.3, VW / 2, VH * 0.45, R * 0.85);
  g.addColorStop(0, 'rgba(0,0,10,0)');
  g.addColorStop(1, 'rgba(0,0,10,0.6)');
  c.fillStyle = g;
  c.fillRect(0, 0, VW, VH);

  // fine grain
  for (let i = 0; i < (VW * VH) / 30; i++) {
    c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,20,0.08)';
    c.fillRect(r() * VW, r() * VH, 1.1, 1.1);
  }
  return cv;
}

// ---------------------------------------------------------------- assets

function ropt(seed, extra) {
  return Object.assign({ stroke: INK, strokeWidth: 3.5, roughness: 1.2, bowing: 1.1, seed }, extra);
}
const solid = (fill, seed, extra) => ropt(seed, Object.assign({ fill, fillStyle: 'solid' }, extra));

function buildIcons() {
  const draws = { house: drawHouse, heart: drawHeart, diploma: drawDiploma, briefcase: drawBriefcase,
    phone: drawPhone, ballot: drawBallot, bus: drawBus, umbrella: drawUmbrella, coffee: drawCoffee, plant: drawPlant };
  Object.entries(draws).forEach(([k, fn], i) => {
    const g = createGraphics(160, 160);
    g.pixelDensity(2);
    fn(g, rough.canvas(g.elt), 11 + i * 17);
    icons[k] = g;
  });
}

// rubber stamps: three impressions per status, each inked unevenly, with
// speckles, a dry side and a few streaks where the rubber missed
function buildStamps() {
  Object.keys(STAMP_COL).forEach((k, i) => {
    const col = STAMP_COL[k];
    stamps[k] = [0, 1, 2].map(v => {
      const cv = document.createElement('canvas');
      cv.width = 280;
      cv.height = 112;
      const c = cv.getContext('2d');
      const rc = rough.canvas(cv);
      const r = mulberry32(70 + i * 7 + v);
      rc.rectangle(8, 8, 264, 96, { stroke: col, strokeWidth: 7, roughness: 1.4 + v * 0.3, bowing: 1.2, seed: 70 + i * 3 + v });
      rc.rectangle(21, 21, 238, 70, { stroke: col, strokeWidth: 2.5, roughness: 1.1, seed: 90 + i * 3 + v });
      c.fillStyle = col;
      c.font = `60px ${DISPLAY}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '3px';
      c.fillText(k, 140, 59);
      c.globalCompositeOperation = 'destination-out';
      const g = c.createLinearGradient(r() * 280, 0, r() * 280, 112);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${0.25 + r() * 0.25})`);
      c.fillStyle = g;
      c.fillRect(0, 0, 280, 112);
      for (let j = 0; j < 560; j++) {
        c.fillStyle = `rgba(0,0,0,${0.35 + r() * 0.65})`;
        c.beginPath();
        c.arc(r() * 280, r() * 112, 0.6 + r() * 2.4, 0, TWO_PI);
        c.fill();
      }
      for (let j = 0; j < 6; j++) {
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillRect(r() * 280, r() * 112, 30 + r() * 70, 1.2 + r() * 2);
      }
      return cv;
    });
  });
}

// ---------------------------------------------------------------- small helpers

const smooth01 = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgbStr = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// ---------------------------------------------------------------- drawings

function drawHouse(g, rc, s) {
  rc.rectangle(104, 28, 16, 40, solid(CHERRY, s));
  rc.polygon([[80, 16], [148, 74], [131, 74], [131, 140], [29, 140], [29, 74], [12, 74]], solid(NAVY, s + 1, { strokeWidth: 4 }));
  rc.rectangle(42, 88, 24, 24, solid(YELLOW, s + 2, { stroke: 'none' }));
  rc.rectangle(86, 96, 28, 44, solid(CHERRY, s + 5, { stroke: 'none' }));
  rc.line(6, 146, 154, 146, ropt(s + 7, { strokeWidth: 4 }));
}

function drawHeart(g, rc, s) {
  rc.path('M80 146 C 24 108, 8 72, 28 44 C 46 20, 72 26, 80 50 C 88 26, 114 20, 132 44 C 152 72, 136 108, 80 146 Z',
    solid(CHERRY, s, { strokeWidth: 5 }));
  rc.path('M112 62 C 124 74, 122 92, 110 104', ropt(s + 1, { stroke: CREAM, strokeWidth: 5 }));
}

function drawDiploma(g, rc, s) {
  rc.rectangle(28, 48, 104, 60, solid(CREAM, s));
  rc.ellipse(28, 78, 20, 60, solid(NAVY, s + 1));
  rc.ellipse(132, 78, 20, 60, solid(NAVY, s + 2));
  rc.line(46, 64, 112, 64, ropt(s + 4, { stroke: NAVY, strokeWidth: 4 }));
  rc.line(46, 80, 96, 80, ropt(s + 5, { stroke: NAVY, strokeWidth: 4 }));
  rc.polygon([[94, 104], [84, 146], [98, 136], [106, 148], [114, 104]], solid(CHERRY, s + 7, { strokeWidth: 2.5 }));
  rc.circle(104, 102, 36, solid(YELLOW, s + 8, { strokeWidth: 3.5 }));
}

function drawBriefcase(g, rc, s) {
  rc.rectangle(56, 24, 48, 30, ropt(s, { stroke: NAVY, strokeWidth: 10, roughness: 0.9 }));
  rc.rectangle(14, 46, 132, 92, solid(NAVY, s + 1, { strokeWidth: 4 }));
  rc.line(14, 84, 146, 84, ropt(s + 2, { stroke: CREAM, strokeWidth: 3 }));
  rc.rectangle(68, 74, 24, 20, solid(GREEN, s + 3, { stroke: CREAM, strokeWidth: 2.5 }));
}

function drawPhone(g, rc, s) {
  rc.rectangle(44, 12, 72, 138, solid(NAVY, s, { strokeWidth: 4 }));
  rc.rectangle(52, 30, 56, 98, solid(CREAM, s + 1, { stroke: 'none' }));
  rc.rectangle(57, 40, 46, 16, solid(YELLOW, s + 2, { strokeWidth: 2 }));
  rc.rectangle(57, 64, 46, 16, ropt(s + 3, { fill: NAVY, fillStyle: 'hachure', hachureGap: 4, strokeWidth: 2 }));
  rc.circle(116, 26, 40, solid(CHERRY, s + 8, { strokeWidth: 3.5 }));
  g.noStroke(); g.fill('#fff'); g.textFont(DISPLAY); g.textSize(20); g.textAlign(CENTER, CENTER);
  g.text('3', 116, 25);
}

function drawBallot(g, rc, s) {
  rc.polygon([[54, 12], [108, 18], [102, 90], [48, 84]], solid('#ffffff', s, { strokeWidth: 3.5 }));
  rc.linearPath([[62, 42], [74, 56], [98, 26]], ropt(s + 2, { stroke: GREEN, strokeWidth: 9, roughness: 0.8 }));
  rc.rectangle(18, 76, 124, 72, solid(NAVY, s + 3, { strokeWidth: 4 }));
  rc.line(42, 84, 118, 84, ropt(s + 4, { stroke: CREAM, strokeWidth: 3 }));
  rc.rectangle(18, 128, 124, 10, solid(YELLOW, s + 5, { stroke: 'none' }));
}

function drawBus(g, rc, s) {
  rc.rectangle(12, 30, 136, 92, solid(YELLOW, s, { strokeWidth: 4 }));
  rc.rectangle(22, 42, 30, 30, solid(CREAM, s + 1, { strokeWidth: 2.5 }));
  rc.rectangle(60, 42, 30, 30, solid(CREAM, s + 2, { strokeWidth: 2.5 }));
  rc.rectangle(98, 42, 38, 30, solid(CREAM, s + 3, { strokeWidth: 2.5 }));
  rc.line(12, 92, 148, 92, ropt(s + 4, { stroke: CHERRY, strokeWidth: 6 }));
  rc.circle(44, 124, 30, solid(NAVY, s + 5));
  rc.circle(116, 124, 30, solid(NAVY, s + 6));
  rc.circle(140, 106, 10, solid(CREAM, s + 7, { strokeWidth: 2 }));
}

function drawUmbrella(g, rc, s) {
  rc.path('M14 86 Q80 0 146 86 Q124 70 102 86 Q80 70 58 86 Q36 70 14 86 Z', solid(CHERRY, s, { strokeWidth: 4 }));
  rc.line(80, 84, 80, 136, ropt(s + 1, { stroke: NAVY, strokeWidth: 6 }));
  rc.path('M80 136 Q80 152 66 150 Q56 148 56 138', ropt(s + 2, { stroke: NAVY, strokeWidth: 6 }));
  [[30, 112], [128, 104], [118, 140], [36, 146]].forEach(([x, y], i) =>
    rc.line(x, y, x - 4, y + 12, ropt(s + 3 + i, { stroke: BLUE, strokeWidth: 4 })));
}

function drawCoffee(g, rc, s) {
  rc.polygon([[40, 56], [120, 56], [110, 146], [50, 146]], solid(CREAM, s, { strokeWidth: 4 }));
  rc.polygon([[45, 84], [115, 84], [112, 116], [48, 116]], solid(GREEN, s + 1, { strokeWidth: 2.5 }));
  rc.rectangle(34, 42, 92, 16, solid(NAVY, s + 2, { strokeWidth: 3 }));
  rc.path('M64 30 Q56 20 66 10', ropt(s + 3, { stroke: CREAM, strokeWidth: 4 }));
  rc.path('M92 30 Q84 20 94 10', ropt(s + 4, { stroke: CREAM, strokeWidth: 4 }));
  rc.circle(80, 100, 18, solid(CREAM, s + 5, { strokeWidth: 2 }));
}

function drawPlant(g, rc, s) {
  rc.path('M80 92 Q46 66 34 30 Q72 40 80 92 Z', solid(GREEN, s, { strokeWidth: 3 }));
  rc.path('M80 92 Q114 62 128 36 Q92 42 80 92 Z', solid(GREEN, s + 1, { strokeWidth: 3 }));
  rc.path('M80 92 Q74 52 82 14 Q96 52 80 92 Z', solid(GREEN, s + 2, { strokeWidth: 3 }));
  rc.polygon([[48, 98], [112, 98], [104, 148], [56, 148]], solid(CHERRY, s + 3, { strokeWidth: 4 }));
  rc.rectangle(42, 90, 76, 14, solid(CHERRY, s + 4, { strokeWidth: 3.5 }));
}

// ---------------------------------------------------------------- sound

// sound is off until the viewer turns it on with the round button
function setupSoundButton() {
  const btn = document.getElementById('sound');
  if (!btn) return;
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn) {
      initAudio();
      if (actx && actx.state === 'suspended') actx.resume();
    } else if (actx) {
      actx.suspend();
    }
    btn.setAttribute('aria-pressed', soundOn);
    btn.setAttribute('aria-label', soundOn ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on');
  });
}

function initAudio() {
  if (actx) return;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
}

function blip(freq, dur, type, vol, when = 0) {
  if (!actx || !soundOn) return;
  const t = actx.currentTime + when;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(actx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function thunk(won) {
  blip(90, 0.12, 'triangle', 0.16);
  if (won) blip(880, 0.15, 'sine', 0.05, 0.05);
}

// ---------------------------------------------------------------- utils

function wrapText(str, font, maxW) {
  sctx.font = font;
  const words = str.split(' '), lines = [];
  let line = '';
  words.forEach(w => {
    const test = line ? line + ' ' + w : w;
    if (sctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  lines.push(line);
  return lines.slice(0, 2);
}

function announce(msg) {
  const el = document.getElementById('live');
  if (el) el.textContent = msg;
}

const wrapAngle = a => atan2(sin(a), cos(a));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
