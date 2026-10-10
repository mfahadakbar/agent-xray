import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { OrganId } from '../data/types';
import { ALL, ORGAN, ORGANS, TOOL_COUNT } from '../data/tree';
import { Ray, type RayMode } from '../ray/Ray';
import { ANCHOR, pathLength, pointAt, route, type Pt, type Stop } from '../ray/geometry';
import { OrganGlyph, OrganPaths } from '../ray/glyphs';
import { useMedia, useReducedMotion } from '../lib/hooks';
import { useVisited } from '../lib/progress';
import { setXray, useXray } from '../lib/xray';
import { buildFlow, SCENARIOS, SWITCHES, type Card, type Scenario, type Slot, type Switches, type Tone } from './flow';
import { JOB, JOBS, jobFlow, jobOrgans, jobParts } from './jobs';
import { toHash } from '../lib/route';

const CHART_H = 720;

/** Anatomy-chart layout: five labels down each side, each tied to its part by a leader line. */
const LEFT: OrganId[] = ['brain', 'heart', 'shield', 'steps', 'checkup'];
const RIGHT: OrganId[] = ['senses', 'memory', 'hands', 'friends', 'home'];
const LABEL_Y = [104, 234, 364, 494, 624];
const LABEL_W = 272;
const LABEL_H = 78;

/** Where each leader line touches its part (Ray units). */
const PIN: Record<OrganId, Pt> = {
  brain: [232, 104],
  senses: [490, 160],
  heart: [259, 340],
  memory: [340, 428],
  hands: [533, 392],
  shield: [70, 424],
  steps: [231, 540],
  friends: [548, 546],
  checkup: [28, 598],
  home: [478, 636],
};

/** Where each part's card sits while a story plays, in chart percent units (1 unit = 1% of chart width). */
const CARD_AT: Record<Slot | 'ask', { x: number; y: number; w: number; side: 'left' | 'right'; pin: Pt }> = {
  ask: { x: 14.500, y: 8.500, w: 23, side: 'left', pin: [141, 163] },
  senses: { x: 15, y: 20.500, w: 23, side: 'left', pin: [284, 218] },
  shield: { x: 14, y: 32.500, w: 21, side: 'left', pin: PIN.shield },
  memory: { x: 14.500, y: 44.500, w: 22, side: 'left', pin: [252, 440] },
  checkup: { x: 14, y: 56, w: 21, side: 'left', pin: PIN.checkup },
  brain: { x: 85.500, y: 9.500, w: 23, side: 'right', pin: [368, 100] },
  heart: { x: 86, y: 21.500, w: 21, side: 'right', pin: [341, 340] },
  hands: { x: 86, y: 33.500, w: 21, side: 'right', pin: PIN.hands },
  friends: { x: 86, y: 45.500, w: 21, side: 'right', pin: PIN.friends },
  // Steps and home sit one above the other on Ray, so they share the last place on the right.
  steps: { x: 86, y: 56, w: 21, side: 'right', pin: [369, 540] },
  home: { x: 86, y: 56, w: 21, side: 'right', pin: PIN.home },
};

/**
 * Numbered footprints: every stop the message makes leaves its number next to the part, so the
 * whole journey can be read off Ray afterwards. A part that is visited again gets another number
 * beside the first, three to a row. The point is where the first one sits (Ray units).
 */
const PRINT_AT: Record<OrganId, Pt> = {
  brain: [362, 62],
  senses: [362, 168],
  heart: [350, 306],
  memory: [362, 468],
  hands: [530, 474],
  shield: [76, 486],
  steps: [372, 566],
  friends: [520, 518],
  checkup: [44, 656],
  home: [404, 676],
};
const PRINT_STEP = 31;
const PRINT_ROW = 3;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** The example path from the idea: Agent → Memory → Knowledge → Vector database → Tools. */
const TRAIL = [
  { label: 'Memory', href: '#/memory' },
  { label: 'Knowledge', href: '#/memory/knowledge' },
  { label: 'Vector database', href: '#/memory/knowledge/vector-db' },
  { label: 'Tools', href: '#/memory/knowledge/vector-db?tools' },
];

interface RunState {
  /** A job told as a journey. When this is set, the question and the switches are not used. */
  job: string | null;
  scenario: Scenario;
  sw: Switches;
  idx: number;
  arrived: boolean;
  playing: boolean;
  nonce: number;
}

/** The glowing message that travels along Ray's wiring. It owns its own animation frame loop. */
function Packet({ pts, ms, cargo, n, tone, moving, big = 1, onArrive }: { pts: Pt[]; ms: number; cargo: string; n?: number; tone?: Tone; moving: boolean; big?: number; onArrive(): void }) {
  const [pos, setPos] = useState<Pt>(moving ? pts[0] : pts[pts.length - 1]);
  const arrive = useRef(onArrive);
  arrive.current = onArrive;

  useEffect(() => {
    if (!moving) {
      setPos(pts[pts.length - 1]);
      return;
    }
    if (ms <= 0) {
      setPos(pts[pts.length - 1]);
      arrive.current();
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      setPos(pointAt(pts, ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else arrive.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // The parent re-keys this component for every beat, so one run per mount is right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moving]);

  return (
    <g className={`packet tone-${tone ?? 'info'}`} transform={`translate(${pos[0]} ${pos[1]}) scale(${big})`}>
      <circle r="27" className="packet-halo" />
      <circle r="19" className="packet-core" />
      <text y="7" textAnchor="middle" fontSize="20">
        {cargo}
      </text>
      {n !== undefined && moving && (
        <g className="print is-riding" transform="translate(21 -21)">
          <circle r="12.500" />
          <text y="5" textAnchor="middle">
            {n}
          </text>
        </g>
      )}
    </g>
  );
}

function PartLabel({
  id,
  side,
  y,
  ox,
  shown,
  dim,
  hover,
  visited,
  onHover,
  onPick,
}: {
  id: OrganId;
  side: 'left' | 'right';
  y: number;
  ox: number;
  shown: boolean;
  dim: boolean;
  hover: boolean;
  visited: boolean;
  onHover(id: OrganId | null): void;
  onPick(id: OrganId): void;
}) {
  const organ = ORGAN[id];
  const x = side === 'left' ? 24 : 1200 - 24 - LABEL_W;
  const edge = side === 'left' ? x + LABEL_W : x;
  const elbow = side === 'left' ? edge + 22 : edge - 22;
  const pin: Pt = [PIN[id][0] + ox, PIN[id][1]];
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(id);
    }
  };
  return (
    <g className={`part${shown ? ' is-shown' : ''}${hover ? ' is-hover' : ''}${dim ? ' is-dim' : ''}`} style={{ '--c': organ.color } as CSSProperties}>
      <path className="part-line" pathLength={1} d={`M${edge} ${y}H${elbow}L${pin[0]} ${pin[1]}`} />
      <circle className="part-dot" cx={pin[0]} cy={pin[1]} r="5" />
      <g
        className="part-box"
        transform={`translate(${x} ${y - LABEL_H / 2})`}
        role="button"
        tabIndex={shown ? 0 : -1}
        aria-label={`${organ.title}: ${organ.aka}. ${organ.tagline}`}
        onPointerEnter={() => onHover(id)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(id)}
        onBlur={() => onHover(null)}
        onClick={() => onPick(id)}
        onKeyDown={onKey}
      >
        <rect className="part-bg" width={LABEL_W} height={LABEL_H} rx="22" />
        <rect className="part-tile" x="13" y="13" width="52" height="52" rx="16" />
        <g
          className="part-glyph"
          transform="translate(22 22) scale(1.420)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.700"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <OrganPaths id={id} />
        </g>
        <text className="part-title" x="80" y="37">
          {organ.title}
        </text>
        <text className="part-sub" x="80" y="58">
          {organ.aka}
        </text>
        {visited ? (
          <g className="part-seen" transform={`translate(${LABEL_W - 28} 28)`}>
            <circle r="9" />
            <path d="M-4 0l3 3 5-6" />
          </g>
        ) : (
          <path className="part-chev" d={`M${LABEL_W - 31} 21l7 7-7 7`} />
        )}
      </g>
    </g>
  );
}

/**
 * On a narrow screen there is no room beside Ray for the big labels. Each part gets a small name tag
 * right next to it instead: `at` is the middle of the tag, `to` is where its line touches the part (Ray units).
 */
const PILL: Record<OrganId, { at: Pt; to: Pt }> = {
  brain: { at: [76, 72], to: [236, 100] },
  senses: { at: [520, 228], to: [410, 205] },
  heart: { at: [72, 280], to: [262, 338] },
  shield: { at: [79, 342], to: [98, 380] },
  hands: { at: [524, 345], to: [515, 388] },
  memory: { at: [459, 516], to: [352, 468] },
  steps: { at: [172, 529], to: [222, 548] },
  checkup: { at: [94, 678], to: [64, 634] },
  home: { at: [377, 698], to: [377, 664] },
  friends: { at: [513, 672], to: [540, 642] },
};
const PILL_H = 42;
/** Where a message from you starts on a narrow screen (Ray units): inside the picture, under the question. */
const YOU_NARROW: Pt = [40, 34];

function PartPill({ id, shown, onPick }: { id: OrganId; shown: boolean; onPick(id: OrganId): void }) {
  const organ = ORGAN[id];
  const { at, to } = PILL[id];
  const w = 30 + organ.title.length * 14.800;
  const x0 = at[0] - w / 2;
  const y0 = at[1] - PILL_H / 2;
  // The line leaves the tag at the point of its edge that is nearest to the part.
  const from: Pt = [Math.max(x0, Math.min(x0 + w, to[0])), Math.max(y0, Math.min(y0 + PILL_H, to[1]))];
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick(id);
    }
  };
  return (
    <g className={`part pill${shown ? ' is-shown' : ''}`} style={{ '--c': organ.color } as CSSProperties}>
      <path className="part-line" pathLength={1} d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`} />
      <circle className="part-dot" cx={to[0]} cy={to[1]} r="5" />
      <g className="part-box" transform={`translate(${x0} ${y0})`} role="button" tabIndex={shown ? 0 : -1} aria-label={`${organ.title}: ${organ.aka}. ${organ.tagline}`} onClick={() => onPick(id)} onKeyDown={onKey}>
        {/* a bigger, unseen target around the tag, so a thumb does not miss it */}
        <rect x={-8} y={-13} width={w + 16} height={PILL_H + 26} fill="transparent" />
        <rect className="part-bg" width={w} height={PILL_H} rx={PILL_H / 2} />
        <text className="pill-title" x={w / 2} y={29.500} textAnchor="middle">
          {organ.title}
        </text>
      </g>
    </g>
  );
}

function FlowCard({ slot, card, wide, n }: { slot: Slot | 'ask'; card: Card; wide: boolean; n?: number }) {
  const at = CARD_AT[slot];
  const style = wide
    ? ({ left: `${at.x}%`, top: `${(at.y / 60) * 100}%`, width: `${at.w}%` } as CSSProperties)
    : undefined;
  return (
    <div className={`fcard fcard-${slot} tone-${card.tone ?? 'info'}${wide ? ' is-placed' : ''}`} style={style}>
      <div className="fcard-title">
        {n !== undefined && <span className="fcard-no">{n}</span>}
        {card.title}
      </div>
      <div className="fcard-text">{card.text}</div>
    </div>
  );
}

export function Home({ onOpen }: { onOpen(id: OrganId): void }) {
  const wide = useMedia('(min-width: 940px)');
  const reduced = useReducedMotion();
  const visited = useVisited();
  const chartW = wide ? 1200 : 600;
  const ox = wide ? 300 : 0;

  const xrayOn = useXray();
  const [mode, setMode] = useState<RayMode>(() => (xrayOn ? 'xray' : 'skin'));
  const [scanY, setScanY] = useState(-60);
  const [hover, setHover] = useState<OrganId | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [dive, setDive] = useState<OrganId | null>(null);
  const [tab, setTab] = useState<'ask' | 'jobs'>('ask');
  const svgRef = useRef<SVGSVGElement>(null);

  // ── The X-ray switch (top bar, and the big button on the start page). ──────────────────────────
  // Switched on: a beam sweeps down Ray and the skin gives way. Switched off: back to the start page.
  const sweep = useRef(0);
  useEffect(() => {
    const mine = ++sweep.current; // a newer flip of the switch cancels an older sweep
    if (!xrayOn) {
      if (mode === 'skin') return;
      setRun(null);
      setHover(null);
      setScanY(-60);
      setMode('skin');
      window.scrollTo({ top: 0 });
      return;
    }
    if (mode !== 'skin') return;
    setLens(null);
    if (reduced) {
      setMode('xray');
      return;
    }
    setMode('scan');
    const t0 = performance.now();
    const ms = 2600;
    const tick = (now: number) => {
      if (mine !== sweep.current) return;
      const t = Math.min(1, (now - t0) / ms);
      setScanY(-60 + ease(t) * (CHART_H + 100));
      if (t < 1) requestAnimationFrame(tick);
      else setMode('xray');
    };
    requestAnimationFrame(tick);
  }, [xrayOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc climbs one level: out of a story first, then out of the X-ray.
  useEffect(() => {
    const up = () => {
      if (run) setRun(null);
      else if (mode === 'xray') setXray(false);
    };
    window.addEventListener('agent-xray:up', up);
    return () => window.removeEventListener('agent-xray:up', up);
  }, [run, mode]);

  // ── The lens: before the scan, the pointer is a little X-ray window. ───────────────────────────
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (mode !== 'skin') return;
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    if (e.pointerType === 'mouse') return setLens({ x: p.x - ox, y: p.y });
    // Under a finger the little window could not be seen, so it sits just above the fingertip.
    // And it stays on Ray: a touch near the edge still shows something worth seeing.
    setLens({ x: Math.max(110, Math.min(490, p.x - ox)), y: Math.max(96, Math.min(600, p.y - 104)) });
  };
  // A finger: the window follows it wherever it goes, and stays where the finger left it.
  // (A held finger always drifts a little. The window must not vanish because of that.)
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (mode === 'skin' && e.pointerType !== 'mouse') e.currentTarget.setPointerCapture?.(e.pointerId);
    onPointerMove(e);
  };
  // A mouse: the window goes away when the pointer leaves Ray.
  const onPointerLeave = (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse') setLens(null);
  };

  // ── The playground: a message, or a whole job, travels through Ray. ────────────────────────────
  const job = run?.job ? JOB[run.job] : null;
  const flow = useMemo(() => (run ? (job ? jobFlow(job) : buildFlow(run.scenario, run.sw)) : null), [run?.scenario, run?.sw, job]); // eslint-disable-line react-hooks/exhaustive-deps
  const beat = run && flow ? flow.beats[Math.min(run.idx, flow.beats.length - 1)] : null;
  const finished = !!(run && flow && run.idx >= flow.beats.length - 1 && run.arrived);

  // On a narrow screen the buttons are under Ray. A story starts with Ray at the top of the screen.
  const homeRef = useRef<HTMLElement>(null);
  const toRay = () => {
    if (wide) return;
    // After this render: by then the story's own layout is on the page.
    requestAnimationFrame(() => window.scrollTo({ top: homeRef.current?.offsetTop ?? 0, behavior: reduced ? 'auto' : 'smooth' }));
  };
  const begin = (scenario: Scenario, sw: Switches = { memory: true, hands: true, shield: true }) => {
    setRun((r) => ({ job: null, scenario, sw, idx: 0, arrived: false, playing: true, nonce: (r?.nonce ?? 0) + 1 }));
    toRay();
  };
  const beginJob = (id: string) => {
    setRun((r) => ({ job: id, scenario: 'weather', sw: { memory: true, hands: true, shield: true }, idx: 0, arrived: false, playing: true, nonce: (r?.nonce ?? 0) + 1 }));
    toRay();
  };
  /** Jump straight to one stop of the story (the numbered buttons on a narrow screen). */
  const jumpTo = (idx: number) => setRun((r) => (r ? { ...r, idx, arrived: true, playing: false } : r));

  const arrive = useCallback(() => setRun((r) => (r ? { ...r, arrived: true } : r)), []);


  // Auto-advance: wait long enough to read the caption, then move on.
  useEffect(() => {
    if (!run || !flow || !run.playing || !run.arrived) return;
    if (run.idx >= flow.beats.length - 1) return;
    const dwell = 1500 + flow.beats[run.idx].caption.length * 34;
    const id = setTimeout(() => setRun((r) => (r ? { ...r, idx: r.idx + 1, arrived: false } : r)), dwell);
    return () => clearTimeout(id);
  }, [run, flow]);

  const stepBy = (d: 1 | -1) =>
    setRun((r) => {
      if (!r || !flow) return r;
      if (d === 1 && !r.arrived) return { ...r, arrived: true, playing: false };
      const idx = Math.max(0, Math.min(flow.beats.length - 1, r.idx + d));
      return { ...r, idx, arrived: d === -1 ? true : false, playing: false };
    });

  // The stretch of wiring the message is on right now.
  const leg = useMemo(() => {
    if (!run || !flow || !beat) return null;
    const from: Stop = beat.from ?? (run.idx === 0 ? (flow.from ?? 'you') : flow.beats[run.idx - 1].to);
    const pts = route(from, beat.to).map(([x, y]) => [x + ox, y] as Pt);
    // "You" stand to the left of Ray. On a narrow screen that would be off the edge of the screen,
    // so there the message starts in the top corner of the picture, right under the question.
    if (!wide && from === 'you') pts[0] = YOU_NARROW;
    const len = pathLength(pts);
    return { pts, ms: len === 0 ? 0 : Math.max(450, Math.min(1500, len * 2.300)) };
  }, [run?.idx, run?.nonce, flow, beat, ox]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cards put on screen by every beat that has already landed, the number of the beat that wrote
  // each card last, and the numbered footprint each beat left on the part it visited.
  const { cards, cardNo, prints } = useMemo(() => {
    const cards: Partial<Record<Slot, Card>> = {};
    const cardNo: Partial<Record<Slot, number>> = {};
    const prints: Array<{ organ: OrganId; n: number; k: number; now: boolean }> = [];
    if (!run || !flow) return { cards, cardNo, prints };
    const visits: Partial<Record<OrganId, number>> = {};
    flow.beats.forEach((b, i) => {
      if (!(i < run.idx || (i === run.idx && run.arrived))) return;
      Object.assign(cards, b.set);
      for (const slot of Object.keys(b.set ?? {}) as Slot[]) cardNo[slot] = i + 1;
      if (b.organ) {
        const k = visits[b.organ] ?? 0;
        visits[b.organ] = k + 1;
        prints.push({ organ: b.organ, n: i + 1, k, now: i === run.idx });
      }
    });
    return { cards, cardNo, prints };
  }, [run, flow]);

  const off = run && !job ? { memory: !run.sw.memory, hands: !run.sw.hands, shield: !run.sw.shield } : {};
  // On a narrow screen Ray is small, so the travelling message and its numbered footprints are drawn bigger,
  // two to a row instead of three, so a row never runs off the edge of the picture.
  const big = wide ? 1 : 1.450;
  const perRow = wide ? PRINT_ROW : 2;
  // What the part at this stop says. On a narrow screen it is shown under the caption, not beside Ray.
  // The last stop of a story says nothing new, so Ray's answer is shown there once more.
  const said: Array<[Slot, Card]> =
    !wide && run && run.arrived
      ? beat?.set
        ? (Object.entries(beat.set) as Array<[Slot, Card]>)
        : finished && cards.senses
          ? [['senses', cards.senses]]
          : []
      : [];
  const activeOrgan = run && run.arrived ? (beat?.organ ?? null) : null;
  // Opening a part zooms the camera into it first, so it feels like going inside.
  const pick = (id: OrganId) => {
    if (dive) return;
    if (reduced) return onOpen(id);
    setDive(id);
    setTimeout(() => onOpen(id), 340);
  };
  const diveStyle: CSSProperties = dive
    ? {
        transform: 'scale(2.6)',
        transformOrigin: `${((ANCHOR[dive][0] + ox) / chartW) * 100}% ${(ANCHOR[dive][1] / CHART_H) * 100}%`,
        opacity: 0,
        transition: 'transform .38s cubic-bezier(.5,0,.9,.5), opacity .34s ease-in',
      }
    : {};
  const hovered = hover ? ORGAN[hover] : null;

  const labelShown = (id: OrganId) => !run && (mode === 'xray' || (mode === 'scan' && scanY > ANCHOR[id][1]));

  // "Give Ray a job": the parts the job uses stay bright, the rest of Ray goes quiet.
  const lit = useMemo(() => (job ? jobOrgans(job) : []), [job]);

  const placed: Array<[Slot | 'ask', Card]> = run && flow
    ? [['ask', { title: job ? 'The job' : 'You', text: flow.question }], ...(Object.entries(cards) as Array<[Slot, Card]>)]
    : [];
  const cardN = (slot: Slot | 'ask') => (slot === 'ask' ? undefined : cardNo[slot]);
  // On a narrow screen the cards are a list, so they are listed in the order they happened.
  const listed = [...placed].sort((a, b) => (cardN(a[0]) ?? 0) - (cardN(b[0]) ?? 0));

  // Back, play or pause, next, close. The same controls for a question and for a job.
  const transport = run && (
    <div className="transport">
      <button className="tbtn" onClick={() => stepBy(-1)} disabled={run.idx === 0} aria-label="Back one step">
        ◀
      </button>
      {finished ? (
        <button className="tbtn tbtn-main" onClick={() => (job ? beginJob(job.id) : begin(run.scenario, run.sw))} aria-label="Play again">
          ↺ Again
        </button>
      ) : (
        <button className="tbtn tbtn-main" onClick={() => setRun((r) => (r ? { ...r, playing: !r.playing } : r))} aria-label={run.playing ? 'Pause' : 'Play'}>
          {run.playing ? '❚❚ Pause' : '▶ Play'}
        </button>
      )}
      <button className="tbtn" onClick={() => stepBy(1)} disabled={finished} aria-label="Next step">
        ▶
      </button>
      <button className="tbtn tbtn-close" onClick={() => setRun(null)} aria-label="Close the playground">
        ✕
      </button>
    </div>
  );

  return (
    <main ref={homeRef} className={`home home-${mode}${run ? ' is-running' : ''}${job ? ' is-job' : ''}${dive ? ' is-diving' : ''}`}>
      {!wide && mode === 'skin' && <IntroCopy part="top" />}
      {/* on a narrow screen: what was asked stays in view above Ray while the story plays */}
      {!wide && run && flow && (
        <p className="asked">
          <b>{job ? `${job.icon} ${job.name}` : 'You'}</b>
          {flow.question}
        </p>
      )}

      <div className="chart-wrap">
        <div className="chart" style={{ aspectRatio: `${chartW} / ${CHART_H}`, ...diveStyle }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${chartW} ${CHART_H}`}
            className="chart-svg"
            role="group"
            aria-label="An X-ray of Ray, an AI agent, with its ten parts"
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            onPointerLeave={onPointerLeave}
            onContextMenu={(e) => mode === 'skin' && e.preventDefault()}
          >
            <defs>
              <linearGradient id="scan-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8fdcff" stopOpacity="0" />
                <stop offset="1" stopColor="#8fdcff" stopOpacity=".28" />
              </linearGradient>
            </defs>

            {wide &&
              LEFT.map((id, i) => (
                <PartLabel key={id} id={id} side="left" y={LABEL_Y[i]} ox={ox} shown={labelShown(id)} dim={false} hover={hover === id} visited={visited.has(id)} onHover={setHover} onPick={pick} />
              ))}
            {wide &&
              RIGHT.map((id, i) => (
                <PartLabel key={id} id={id} side="right" y={LABEL_Y[i]} ox={ox} shown={labelShown(id)} dim={false} hover={hover === id} visited={visited.has(id)} onHover={setHover} onPick={pick} />
              ))}

            {/* dotted ties from each playground card to the part it talks about */}
            {wide &&
              placed.map(([slot]) => {
                const at = CARD_AT[slot];
                const edge = (at.side === 'left' ? at.x + at.w / 2 : at.x - at.w / 2) * 12;
                return <path key={slot} className="tie" d={`M${edge} ${at.y * 12}L${at.pin[0] + ox} ${at.pin[1]}`} />;
              })}

            {/* on a narrow screen: a small name tag next to every part */}
            {!wide && ORGANS.map((o) => <PartPill key={o.id} id={o.id} shown={labelShown(o.id)} onPick={pick} />)}

            <g transform={`translate(${ox} 0)`}>
              <Ray mode={mode} scanY={scanY} lens={lens} hover={hover} active={activeOrgan} lit={lit} off={off} quiet={!!run} onHover={run ? undefined : setHover} onPick={pick} />
            </g>

            {mode === 'scan' && (
              <g className="scanline" transform={`translate(0 ${scanY})`}>
                <rect x="0" y="-90" width={chartW} height="90" fill="url(#scan-grad)" />
                <rect x="0" y="-2" width={chartW} height="4" rx="2" />
              </g>
            )}

            {run && leg && beat && (
              <>
                <path className="leg" d={leg.pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')} />
                <Packet key={`${run.nonce}:${run.idx}`} pts={leg.pts} ms={reduced ? 0 : leg.ms} cargo={beat.cargo} n={beat.organ ? run.idx + 1 : undefined} tone={beat.tone} moving={!run.arrived} big={big} onArrive={arrive} />
              </>
            )}

            {/* numbered footprints: where the message has been, in order */}
            {run &&
              prints.map((p) => {
                const [px, py] = PRINT_AT[p.organ];
                return (
                  <g
                    key={`${run.nonce}:${p.n}`}
                    className={`print${p.now ? ' is-now' : ''}`}
                    style={{ '--c': ORGAN[p.organ].color } as CSSProperties}
                    transform={`translate(${px + (p.k % perRow) * PRINT_STEP * big + ox} ${py + Math.floor(p.k / perRow) * PRINT_STEP * big}) scale(${big})`}
                  >
                    <g className="print-pop">
                      <circle r="13.500" />
                      <text y="5.500" textAnchor="middle">
                        {p.n}
                      </text>
                    </g>
                  </g>
                );
              })}
          </svg>

          {wide && mode === 'skin' && (
            <>
              <IntroCopy onScan={() => setXray(true)} placed />
              <div className="intro-hint">
                <span className="intro-hint-eye">👀</span>
                <b>This is Ray.</b> Ray is an AI agent, and our example. What is inside Ray is inside every agent.
                <small>Psst. Move your mouse over Ray to peek.</small>
              </div>
            </>
          )}

          {wide && placed.map(([slot, card]) => <FlowCard key={slot} slot={slot} card={card} wide n={cardN(slot)} />)}
          {wide && run && flow?.before && <div className="before">{flow.before}</div>}
        </div>
      </div>

      <div className="deck">
        {!wide && mode === 'skin' && <IntroCopy part="bottom" onScan={() => setXray(true)} />}
        {mode === 'scan' && <p className="deck-line">Scanning… look what is inside!</p>}

        {mode === 'xray' && !run && (
          <div className="ask">
            <p className="deck-line" aria-live="polite">
              {hovered ? (
                <>
                  <b style={{ color: hovered.color }}>{hovered.title}.</b> {hovered.tagline}
                </>
              ) : (
                <>
                  <b>This is the inside of an AI agent.</b> {wide ? 'Click' : 'Tap'} any part to look inside. Or try one of these:
                </>
              )}
            </p>
            <div className="deck-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'ask'} className={tab === 'ask' ? 'is-on' : ''} onClick={() => setTab('ask')}>
                ▶ Watch a message travel
              </button>
              <button role="tab" aria-selected={tab === 'jobs'} className={tab === 'jobs' ? 'is-on' : ''} onClick={() => setTab('jobs')}>
                🧩 Give Ray a job
              </button>
            </div>
            {tab === 'ask' ? (
              <div className="ask-chips">
                {SCENARIOS.map((s) => (
                  <button key={s.id} className="chip chip-ask" onClick={() => begin(s.id)}>
                    <span className="chip-icon">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="ask-chips">
                {JOBS.map((j) => (
                  <button key={j.id} className="chip chip-job" onClick={() => beginJob(j.id)} title={j.does}>
                    <span className="chip-icon">{j.icon}</span>
                    {j.name}
                  </button>
                ))}
              </div>
            )}
            <p className="trail">
              New here? Follow the path from the idea:
              {TRAIL.map((t, i) => (
                <span key={t.href}>
                  {i > 0 && <i aria-hidden="true">→</i>}
                  <a href={t.href}>{t.label}</a>
                </span>
              ))}
            </p>
          </div>
        )}

        {run && flow && beat && (
          <div className={`console${job ? ' is-job' : ''}`}>
            {!wide && (
              <ol className="rail" aria-label="The stops of this story">
                {flow.beats.map((b, i) => (
                  <li key={i}>
                    <button
                      className={i === run.idx ? 'is-now' : i < run.idx ? 'is-done' : ''}
                      style={{ '--c': b.organ ? ORGAN[b.organ].color : 'var(--xray)' } as CSSProperties}
                      onClick={() => jumpTo(i)}
                      aria-label={`Go to stop ${i + 1}`}
                      aria-current={i === run.idx ? 'step' : undefined}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="console-top">
              <div className={`console-caption tone-${beat.tone ?? 'info'}`} aria-live="polite">
                <span className="beat-no">
                  {run.idx + 1}
                  <i>/{flow.beats.length}</i>
                </span>
                <p>{beat.caption}</p>
              </div>
            </div>
            {!wide && (
              <div className="says">
                {said.map(([slot, card]) => (
                  <p key={`${run.idx}${slot}`} className={`say tone-${card.tone ?? 'info'}`} style={{ '--c': ORGAN[slot].color } as CSSProperties}>
                    <b>{card.title}</b>
                    {card.text}
                  </p>
                ))}
              </div>
            )}
            <div className="console-row">
              {job ? (
                <div className="seg" role="group" aria-label="Job">
                  {JOBS.map((j) => (
                    <button key={j.id} className={`seg-btn${job.id === j.id ? ' is-on' : ''}`} onClick={() => beginJob(j.id)} title={j.does}>
                      <span>{j.icon}</span>
                      {j.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="seg" role="group" aria-label="Question">
                  {SCENARIOS.map((s) => (
                    <button key={s.id} className={`seg-btn${run.scenario === s.id ? ' is-on' : ''}`} onClick={() => begin(s.id, run.sw)} title={s.label}>
                      <span>{s.icon}</span>
                      {s.id === 'weather' ? 'Weather' : s.id === 'name' ? 'My name' : 'A trick'}
                    </button>
                  ))}
                </div>
              )}
              <div className={`switches${finished ? ' is-nudged' : ''}`} role="group" aria-label="Switch parts on and off" style={job ? { display: 'none' } : undefined}>
                {SWITCHES.map((s) => (
                  <button
                    key={s.id}
                    className={`switch${run.sw[s.id] ? ' is-on' : ''}`}
                    style={{ '--c': ORGAN[s.organ].color } as CSSProperties}
                    role="switch"
                    aria-checked={run.sw[s.id]}
                    onClick={() => begin(run.scenario, { ...run.sw, [s.id]: !run.sw[s.id] })}
                  >
                    <OrganGlyph id={s.organ} size={18} />
                    {s.label}
                    <span className="switch-knob" />
                  </button>
                ))}
              </div>
              {transport}
            </div>
            {job && (
              <div className="job-parts">
                <span>Look inside the parts this job uses:</span>
                {jobParts(job).map((f) => (
                  <a key={f.key} className="job-part" style={{ '--c': f.organ.color } as CSSProperties} href={toHash(f.path)}>
                    <i aria-hidden="true">{f.node.icon}</i>
                    {f.node.title}
                  </a>
                ))}
              </div>
            )}
            {finished && !job && <p className="nudge">Now switch a part off, and watch what changes. 👆</p>}
          </div>
        )}
      </div>

      {!wide && run && flow && (
        <div className="fcard-list">
          <h2>The story so far</h2>
          {listed.map(([slot, card]) => (
            <FlowCard key={slot} slot={slot} card={card} wide={false} n={cardN(slot)} />
          ))}
        </div>
      )}

      {!wide && mode !== 'skin' && !run && (
        <div className="part-grid">
          {ORGANS.map((o) => (
            <button key={o.id} className="part-tile-btn" style={{ '--c': o.color } as CSSProperties} onClick={() => pick(o.id)}>
              <span className="part-tile-icon">
                <OrganGlyph id={o.id} size={26} />
              </span>
              <span>
                <b>{o.title}</b>
                <i>{o.aka}</i>
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="home-foot">
        {ALL.length} parts · {TOOL_COUNT} real tools · one map
      </p>
    </main>
  );
}

/**
 * The words of the start page. Beside Ray on a wide screen (`placed`). On a narrow screen they are
 * in two parts: the question above Ray (`top`), and the button under Ray, where a thumb can reach it (`bottom`).
 */
function IntroCopy({ onScan, placed = false, part }: { onScan?(): void; placed?: boolean; part?: 'top' | 'bottom' }) {
  const head = (
    <>
      <p className="intro-kicker">Agent Xray</p>
      <h1>
        How does an <span>AI agent</span> really work?
      </h1>
      <p className="intro-lede">You are in the right place. Here we put an agent under the X-ray, and you get to see every single part of it.</p>
    </>
  );
  const go = (
    <button className="btn btn-xray" onClick={onScan}>
      <span className="btn-bolt">⚡</span> Turn on the X-ray
    </button>
  );
  if (part === 'top') return <div className="intro is-top">{head}</div>;
  if (part === 'bottom')
    return (
      <div className="intro is-bottom">
        {go}
        <p className="intro-ray">
          This is Ray, our example agent. What is inside Ray is inside every agent. <span className="intro-touch">Touch Ray to peek.</span>
        </p>
      </div>
    );
  return (
    <div className={`intro${placed ? ' is-placed' : ''}`}>
      {head}
      <p className="intro-q">What each part is. Why it matters. Which real tools build it.</p>
      {go}
    </div>
  );
}
