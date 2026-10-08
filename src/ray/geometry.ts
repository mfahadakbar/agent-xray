import type { OrganId } from '../data/types';

/** Ray is drawn in a 600 × 720 box. Everything about Ray's body is measured in these units. */
export const RAY_W = 600;
export const RAY_H = 720;

export type Pt = readonly [number, number];

/** Where each part sits in Ray's body. */
export const ANCHOR: Record<OrganId, Pt> = {
  brain: [300, 104],
  senses: [300, 191],
  heart: [300, 340],
  memory: [300, 436],
  hands: [472, 452],
  shield: [106, 426],
  steps: [300, 548],
  home: [300, 636],
  friends: [538, 592],
  checkup: [64, 582],
};

/** A message enters and leaves by Ray's ear. "you" is the person standing outside. */
export type Stop = OrganId | 'you';

const YOU: Pt = [-150, 168];
const EAR: Pt = [141, 163];
const NECK: Pt = [300, 268];
const SHOULDER_L: Pt = [178, 316];
const SHOULDER_R: Pt = [422, 316];
const HIP: Pt = [300, 492];

export const stopPoint = (s: Stop): Pt => (s === 'you' ? YOU : ANCHOR[s]);

/**
 * Ray's wiring. The heart is the hub: every signal between brain, memory, shield and hands passes through it.
 * Each wire lists the bends it takes between two parts.
 */
const WIRES: Array<{ a: Stop; b: Stop; via: Pt[] }> = [
  { a: 'you', b: 'senses', via: [EAR] },
  { a: 'senses', b: 'brain', via: [] },
  { a: 'senses', b: 'heart', via: [NECK] },
  { a: 'heart', b: 'memory', via: [] },
  { a: 'heart', b: 'shield', via: [SHOULDER_L] },
  { a: 'heart', b: 'hands', via: [SHOULDER_R] },
  { a: 'memory', b: 'steps', via: [HIP] },
  { a: 'steps', b: 'home', via: [] },
  // The two parts that stand beside Ray: work is handed to friends, and the check-up watches from the shield's side.
  { a: 'hands', b: 'friends', via: [] },
  { a: 'shield', b: 'checkup', via: [] },
];

/** The wires as drawable polylines (for the glowing "nervous system" inside Ray). */
export const WIRE_LINES: Pt[][] = WIRES.filter((w) => w.a !== 'you').map((w) => [stopPoint(w.a), ...w.via, stopPoint(w.b)]);

function neighbors(s: Stop): Array<{ to: Stop; via: Pt[] }> {
  const out: Array<{ to: Stop; via: Pt[] }> = [];
  for (const w of WIRES) {
    if (w.a === s) out.push({ to: w.b, via: w.via });
    else if (w.b === s) out.push({ to: w.a, via: [...w.via].reverse() });
  }
  return out;
}

/** The bends a signal passes on its way from one part to another, following the wiring. */
export function route(from: Stop, to: Stop): Pt[] {
  if (from === to) return [stopPoint(from)];
  const prev = new Map<Stop, { from: Stop; via: Pt[] }>();
  const queue: Stop[] = [from];
  const seen = new Set<Stop>([from]);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const n of neighbors(cur)) {
      if (seen.has(n.to)) continue;
      seen.add(n.to);
      prev.set(n.to, { from: cur, via: n.via });
      queue.push(n.to);
    }
  }
  const legs: Pt[][] = [];
  let cur: Stop = to;
  while (cur !== from) {
    const p = prev.get(cur);
    if (!p) return [stopPoint(from), stopPoint(to)]; // not wired: fly straight
    legs.unshift([...p.via, stopPoint(cur)]);
    cur = p.from;
  }
  return [stopPoint(from), ...legs.flat()];
}

export function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

/** Point at fraction t (0..1) along a polyline. */
export function pointAt(pts: Pt[], t: number): Pt {
  if (pts.length === 1) return pts[0];
  const total = pathLength(pts);
  let want = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (want <= seg || i === pts.length - 1) {
      const f = seg === 0 ? 0 : Math.min(1, want / seg);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
    }
    want -= seg;
  }
  return pts[pts.length - 1];
}

export const toD = (pts: Pt[]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
