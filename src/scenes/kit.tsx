import { createContext, useContext, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useMedia, useTyped, type Steps } from '../lib/hooks';

/**
 * The scene kit. Every interactive explainer is built from these few pieces.
 *
 * A scene is a 16:9 stage. Positions are in "stage units": 1 unit = 1% of the stage width,
 * so the stage is 100 wide and 56.25 tall, on any screen. HTML pieces are placed with <At>,
 * lines and arrows are drawn in <Draw> using the same units.
 *
 * On a phone the stage stands up instead: still 100 units wide, but 3:4, so 133.33 tall, and the
 * type is bigger. Nothing is cut and nothing has to be zoomed. Every piece keeps its place from left
 * to right and gets more room from top to bottom: a `y` written for the wide stage is stretched to the
 * tall one. Where that is not good enough, a piece says where it goes on the tall stage with `p`.
 */
export const SW = 100;
export const SH = 56.25;
/** The height of the tall (phone) stage, in the same units. */
export const PH = (SW * 4) / 3;

export type P2 = readonly [number, number];

interface Stage {
  /** The stage is standing up (a phone held upright). */
  portrait: boolean;
  /** How tall the stage is, in stage units. */
  h: number;
  /** A height on the wide stage, times this, is the same height on this stage. */
  ky: number;
}
const WIDE: Stage = { portrait: false, h: SH, ky: 1 };
const TALL: Stage = { portrait: true, h: PH, ky: PH / SH };
const StageCtx = createContext<Stage>(WIDE);
/** Which way the stage stands. For the few things in a scene that cannot simply stretch. */
export const useStage = () => useContext(StageCtx);
/** Below this window width, the stage stands up. */
export const PORTRAIT = '(max-width: 640px)';
/** A phone on its side: the stage stays wide, but the screen is short, so the stage must fit its height. */
const SHORT = '(max-height: 560px) and (orientation: landscape)';
/**
 * Is the stage standing up? For a scene's own code, which runs outside the stage:
 * a scene with real geometry (a backpack that fills up, a clock) works out its own tall layout.
 */
export const usePortrait = () => useMedia(PORTRAIT);

// ── frame ────────────────────────────────────────────────────────────────────

export function Scene({
  children,
  caption,
  controls,
  tone,
  step,
}: {
  children: ReactNode;
  /** One short sentence about what is happening right now. */
  caption: string;
  controls?: ReactNode;
  tone?: 'ok' | 'bad' | 'warn';
  /** Which step of the process the caption is about. Shown as the same numbered tag used on the stage. */
  step?: number;
}) {
  const portrait = useMedia(PORTRAIT);
  const short = useMedia(SHORT) && !portrait;
  // A small screen: the scene is fitted to it, and its bar is kept compact.
  const snug = portrait || short;
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  // On a phone the picture, its caption and its buttons should all be on the screen together.
  // The bar under the stage is as tall as its words and buttons need, and the stage takes the rest.
  useLayoutEffect(() => {
    const box = root.current;
    const el = bar.current;
    if (!snug || !box || !el) return;
    // The bar only ever asks for more room. If it gave room back with every shorter caption, the stage would jump.
    let most = 0;
    const fit = () => {
      if (el.offsetHeight <= most) return;
      most = el.offsetHeight;
      box.style.setProperty('--bar-h', `${most}px`);
    };
    const again = () => {
      most = 0;
      fit();
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    window.addEventListener('orientationchange', again);
    return () => {
      watch.disconnect();
      window.removeEventListener('orientationchange', again);
      box.style.removeProperty('--bar-h');
    };
  }, [snug, portrait]);

  // Pressing a button under the stage brings the scene into view, so nothing plays off screen.
  const intoView = () => {
    const box = root.current;
    if (!snug || !box) return;
    const r = box.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top >= -1 && r.bottom <= vh + 1) return; // all of it is on screen already
    // A scene that fits is moved just far enough. One that is taller than the screen goes to the top:
    // then the whole picture and its caption can be seen, and only the buttons need a small scroll.
    const by = r.height > vh || r.top < 0 ? r.top : r.bottom - vh;
    if (Math.abs(by) > 2) window.scrollBy({ top: by, behavior: 'smooth' });
  };

  return (
    <StageCtx.Provider value={portrait ? TALL : WIDE}>
      <div ref={root} className={`scene${portrait ? ' is-portrait' : ''}${short ? ' is-short' : ''}${snug ? ' is-snug' : ''}`}>
        <div className="stage-wrap">
          <div className="stage">{children}</div>
        </div>
        <div ref={bar} className="scene-bar">
          <p className={`scene-caption${tone ? ` tone-${tone}` : ''}${caption.length > 112 ? ' is-long' : ''}`} aria-live="polite">
            {step !== undefined && step > 0 && <StepTag n={step} now />}
            <span>{caption}</span>
          </p>
          {controls && (
            <div className="scene-controls" onClick={intoView}>
              {controls}
            </div>
          )}
        </div>
      </div>
    </StageCtx.Provider>
  );
}

/** Where a piece goes on the tall (phone) stage, when stretching its wide-stage place is not good enough. */
export interface Tall {
  x?: number;
  /** In tall-stage units: 0 at the top, 133.33 at the bottom. */
  y?: number;
  w?: number;
}

/** Place something on the stage, centred on (x, y). Changing x or y glides it there. */
export function At({
  x,
  y,
  w,
  p,
  z,
  hide,
  delay,
  slow,
  className = '',
  style,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  /** Its place on the tall (phone) stage, if it needs its own. */
  p?: Tall;
  z?: number;
  hide?: boolean;
  delay?: number;
  slow?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const stage = useStage();
  const tx = stage.portrait ? (p?.x ?? x) : x;
  const ty = stage.portrait ? (p?.y ?? y * stage.ky) : y;
  const tw = stage.portrait ? (p?.w ?? w) : w;
  return (
    <div
      className={`at${hide ? ' is-hidden' : ''}${slow ? ' is-slow' : ''} ${className}`}
      style={{
        // Plain percentages of the stage: they glide reliably, unlike container units inside a transition.
        left: `${tx}%`,
        top: `${(ty / stage.h) * 100}%`,
        // On the tall stage the type is bigger. A piece with no width of its own takes the room its words need,
        // and no piece is ever wider than the room there is around its middle: it never leaves the stage.
        width: tw ? `${tw}%` : stage.portrait ? 'max-content' : undefined,
        maxWidth: stage.portrait ? `${2 * Math.min(tx, SW - tx)}%` : undefined,
        zIndex: z,
        transitionDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** The drawing layer for lines and arrows, in stage units. */
export function Draw({ children }: { children: ReactNode }) {
  const { h } = useStage();
  return (
    <svg className="draw" viewBox={`0 0 ${SW} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {children}
    </svg>
  );
}

/**
 * Shapes drawn in wide-stage units (a frame, a grid) stretch with the stage when it stands up,
 * so they stay under the pieces placed on them. Arrows do not need this: they find their own way.
 */
export function Stretch({ children }: { children: ReactNode }) {
  const { ky } = useStage();
  return ky === 1 ? <>{children}</> : <g transform={`scale(1 ${ky})`}>{children}</g>;
}

export function Arrow({
  from,
  to,
  bend = 0,
  color,
  off,
  dashed,
  flow,
  head = true,
  width = 0.42,
  p,
}: {
  from: P2;
  to: P2;
  /** Curve the line: positive bends one way, negative the other. */
  bend?: number;
  /** Its ends on the tall (phone) stage, in tall-stage units, if the pieces it joins have their own places there. */
  p?: { from?: P2; to?: P2; bend?: number };
  color?: string;
  off?: boolean;
  dashed?: boolean;
  /** Animate dashes travelling along the line. */
  flow?: boolean;
  head?: boolean;
  width?: number;
}) {
  const stage = useStage();
  const [x1, y1] = stage.portrait ? (p?.from ?? [from[0], from[1] * stage.ky]) : from;
  const [x2, y2] = stage.portrait ? (p?.to ?? [to[0], to[1] * stage.ky]) : to;
  if (stage.portrait && p?.bend !== undefined) bend = p.bend;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 - (dy / len) * bend;
  const cy = (y1 + y2) / 2 + (dx / len) * bend;
  const tl = Math.hypot(x2 - cx, y2 - cy) || 1;
  const ux = (x2 - cx) / tl;
  const uy = (y2 - cy) / tl;
  const hs = width * 3.400;
  const bx = x2 - ux * hs;
  const by = y2 - uy * hs;
  const cls = `k-arrow${off ? ' is-off' : ''}${dashed ? ' is-dashed' : ''}${flow ? ' is-flow' : ''}`;
  return (
    <g className={cls} style={color ? ({ '--k': color } as CSSProperties) : undefined}>
      <path d={`M${x1} ${y1}Q${cx} ${cy} ${head ? bx : x2} ${head ? by : y2}`} strokeWidth={width} />
      {head && <polygon points={`${x2},${y2} ${bx - uy * hs * 0.62},${by + ux * hs * 0.62} ${bx + uy * hs * 0.62},${by - ux * hs * 0.62}`} />}
    </g>
  );
}

/** Words on the drawing layer: a name beside an arrow, a mark on a scale. Bigger on the tall stage, like all type. */
export function Note({
  at,
  p,
  size = 1.6,
  anchor = 'middle',
  color,
  dim,
  opacity,
  children,
}: {
  at: P2;
  /** Its place on the tall (phone) stage, in tall-stage units. */
  p?: P2;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  dim?: boolean;
  opacity?: number;
  children: ReactNode;
}) {
  const stage = useStage();
  const [x, y] = stage.portrait ? (p ?? [at[0], at[1] * stage.ky]) : at;
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size * (stage.portrait ? 1.6 : 1)} fill={color} opacity={opacity ?? (dim ? 0.3 : undefined)}>
      {children}
    </text>
  );
}

// ── things to put on the stage ───────────────────────────────────────────────

export function Card({
  children,
  color,
  tone,
  soft,
  className = '',
  style,
}: {
  children: ReactNode;
  color?: string;
  tone?: 'ok' | 'bad' | 'warn' | 'info';
  soft?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`k-card${tone ? ` tone-${tone} has-tone` : ''}${soft ? ' is-soft' : ''} ${className}`} style={{ ...(color ? ({ '--c': color } as CSSProperties) : {}), ...style }}>
      {children}
    </div>
  );
}

/** A small label: "LOOP 2", "page 12". */
export function Tag({ children, tone, color }: { children: ReactNode; tone?: 'ok' | 'bad' | 'warn' | 'info'; color?: string }) {
  return (
    <span className={`k-tag${tone ? ` tone-${tone} has-tone` : ''}`} style={color ? ({ '--c': color } as CSSProperties) : undefined}>
      {children}
    </span>
  );
}

/**
 * A numbered tag: "this happens Nth". Wherever a scene shows a process, each stop carries its number,
 * so the order can be read off the picture, during the animation and after it.
 */
export function StepTag({
  n,
  now,
  todo,
  corner,
  small,
}: {
  n: number | string;
  /** This is the step happening right now. */
  now?: boolean;
  /** This step has not happened yet. */
  todo?: boolean;
  /** Pin the tag to the top-left corner of the card or bubble it sits in. */
  corner?: boolean;
  small?: boolean;
}) {
  const cls = `k-step${now ? ' is-now' : ''}${todo ? ' is-todo' : ''}${corner ? ' is-corner' : ''}${small ? ' is-small' : ''}`;
  return (
    <span className={cls} aria-label={`step ${n}`}>
      {n}
    </span>
  );
}

/** "2", or "2a" and "2b" when several things share step 2 because they happen together. */
export const stepName = (step: number, index = 0, size = 1): string => (size > 1 ? `${step}${'abcdefgh'[index] ?? ''}` : `${step}`);

/**
 * The tags one actor has earned so far. `groups[k]` lists who acts at step k + 1.
 * Several names in one group act together, so they are lettered a, b, c.
 */
export function tagsFor(groups: string[][], who: string, upTo: number): string[] {
  const out: string[] = [];
  groups.forEach((group, k) => {
    const at = group.indexOf(who);
    if (at !== -1 && k <= upTo) out.push(stepName(k + 1, at, group.length));
  });
  return out;
}

/** A row of step tags pinned to the corner of whatever it sits in. `current` is the step happening now. */
export function StepTags({ tags, current, className = '' }: { tags: string[]; current?: number; className?: string }) {
  if (!tags.length) return null;
  return (
    <span className={`k-steps ${className}`}>
      {tags.map((t) => (
        <StepTag key={t} n={t} now={parseInt(t, 10) === current} />
      ))}
    </span>
  );
}

/** A big emoji used as a picture. */
export function Pic({ children, size = 3 }: { children: ReactNode; size?: number }) {
  return (
    <span className="k-pic" style={{ fontSize: `${size}em` }} aria-hidden="true">
      {children}
    </span>
  );
}

export function Bubble({ who, children, tone, typing }: { who: 'you' | 'ray' | 'tool'; children: ReactNode; tone?: 'ok' | 'bad' | 'warn'; typing?: boolean }) {
  return (
    <div className={`k-bubble is-${who}${tone ? ` tone-${tone} has-tone` : ''}`}>
      {typing ? (
        <span className="k-dots">
          <i />
          <i />
          <i />
        </span>
      ) : (
        children
      )}
    </div>
  );
}

/** Text that types itself out while `on`. */
export function Typed({ text, on = true, cps }: { text: string; on?: boolean; cps?: number }) {
  const shown = useTyped(text, on, cps);
  return (
    <span className="k-typed" aria-label={text}>
      {shown}
      {on && shown.length < text.length && <i className="k-caret" />}
    </span>
  );
}

export type Mood = 'happy' | 'think' | 'sad' | 'wow' | 'sleep' | 'oops' | 'wink';

/** Ray's face, small, for use inside scenes. `color` makes one of Ray's friends instead. */
export function MiniRay({ mood = 'happy', size = 5, color, label }: { mood?: Mood; size?: number; color?: string; label?: string }) {
  const body = color ?? '#e9f0ff';
  const eye = '#6fe3ff';
  let eyes: ReactNode;
  let mouth: ReactNode;
  switch (mood) {
    case 'think':
      eyes = (
        <>
          <circle cx="48" cy="55" r="7" fill={eye} />
          <circle cx="76" cy="55" r="7" fill={eye} />
          <circle cx="50.500" cy="52" r="2.400" fill="#fff" />
          <circle cx="78.500" cy="52" r="2.400" fill="#fff" />
        </>
      );
      mouth = <path d="M54 72h12" />;
      break;
    case 'sad':
      eyes = (
        <>
          <circle cx="46" cy="60" r="6.500" fill={eye} />
          <circle cx="74" cy="60" r="6.500" fill={eye} />
          <path d="M37 53l13-4M83 53l-13-4" />
        </>
      );
      mouth = <path d="M52 75q8-7 16 0" />;
      break;
    case 'wow':
      eyes = (
        <>
          <circle cx="46" cy="57" r="9" fill={eye} />
          <circle cx="74" cy="57" r="9" fill={eye} />
          <circle cx="43" cy="54" r="3" fill="#fff" />
          <circle cx="71" cy="54" r="3" fill="#fff" />
        </>
      );
      mouth = <ellipse cx="60" cy="73" rx="4" ry="3.500" />;
      break;
    case 'sleep':
      eyes = <path d="M39 58q7 6 14 0M67 58q7 6 14 0" />;
      mouth = <path d="M56 72h8" />;
      break;
    case 'oops':
      eyes = <path d="M40 52l11 6-11 6M80 52l-11 6 11 6" />;
      mouth = <path d="M51 73q4.500-5 9 0t9 0" />;
      break;
    case 'wink':
      eyes = (
        <>
          <circle cx="46" cy="58" r="7.500" fill={eye} />
          <circle cx="43.500" cy="55.500" r="2.500" fill="#fff" />
          <path d="M67 59q7-6 14 0" />
        </>
      );
      mouth = <path d="M51 70q9 9 18 0" />;
      break;
    default:
      eyes = (
        <>
          <circle cx="46" cy="58" r="7.500" fill={eye} />
          <circle cx="74" cy="58" r="7.500" fill={eye} />
          <circle cx="43.500" cy="55.500" r="2.500" fill="#fff" />
          <circle cx="71.500" cy="55.500" r="2.500" fill="#fff" />
        </>
      );
      mouth = <path d="M52 70q8 7 16 0" />;
  }
  return (
    <span className={`k-ray mood-${mood}`} style={{ fontSize: `${size}em` }}>
      <svg viewBox="0 0 120 108" role="img" aria-label={label ?? `Ray looks ${mood}`}>
        <path d="M60 22V11" stroke="#9fb3d9" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="8" r="5.500" fill={color ? '#ffd75e' : '#ff8fd0'} />
        <rect x="5" y="46" width="12" height="26" rx="6" fill="#8fa5cf" />
        <rect x="103" y="46" width="12" height="26" rx="6" fill="#8fa5cf" />
        <rect x="14" y="22" width="92" height="76" rx="30" fill={body} />
        <path d="M27 44q4-13 21-16" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
        <rect x="26" y="40" width="68" height="42" rx="19" fill="#0d1630" />
        <g fill="none" stroke={eye} strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round">
          {eyes}
          {mouth}
        </g>
        <circle cx="33" cy="70" r="4" fill="#ff8fd0" opacity=".45" />
        <circle cx="87" cy="70" r="4" fill="#ff8fd0" opacity=".45" />
        {mood === 'sleep' && (
          <text x="96" y="26" fontSize="18" fontWeight="700" fill="#8fdcff" fontFamily="var(--display)">
            z
          </text>
        )}
      </svg>
    </span>
  );
}

// ── controls ─────────────────────────────────────────────────────────────────

export function Btn({
  children,
  onClick,
  kind = 'main',
  disabled,
  pulse,
  label,
}: {
  children: ReactNode;
  onClick(): void;
  kind?: 'main' | 'soft' | 'yes' | 'no';
  disabled?: boolean;
  /** Draw the eye to this button: it is the thing to press next. */
  pulse?: boolean;
  label?: string;
}) {
  return (
    <button className={`kbtn kbtn-${kind}${pulse ? ' is-pulse' : ''}`} onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, children }: { on: boolean; onChange(on: boolean): void; children: ReactNode }) {
  return (
    <button className={`ktoggle${on ? ' is-on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="ktoggle-label">{children}</span>
      <span className="ktoggle-track">
        <i />
      </span>
      <span className="ktoggle-state">{on ? 'ON' : 'OFF'}</span>
    </button>
  );
}

export function Choice<T extends string>({ value, onChange, options, label }: { value: T; onChange(v: T): void; options: Array<{ id: T; label: ReactNode }>; label?: string }) {
  return (
    <div className="kchoice" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} className={value === o.id ? 'is-on' : ''} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  show,
}: {
  value: number;
  onChange(v: number): void;
  min: number;
  max: number;
  step?: number;
  label: string;
  show?: ReactNode;
}) {
  return (
    <label className="kslider">
      <span className="kslider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ '--f': (value - min) / (max - min) } as CSSProperties} />
      {show !== undefined && <span className="kslider-show">{show}</span>}
    </label>
  );
}

/** Back / Next / Again, for scenes you click through. */
export function StepNav({ s, next = 'Next', again = 'Again' }: { s: Steps; next?: string; again?: string }) {
  return (
    <div className="stepnav">
      <Btn kind="soft" onClick={s.prev} disabled={s.atStart} label="Back">
        ◀
      </Btn>
      {s.atEnd ? (
        <Btn onClick={s.reset}>↺ {again}</Btn>
      ) : (
        <Btn onClick={s.next} pulse={s.atStart}>
          {next} ▶
        </Btn>
      )}
      <span className="stepdots">
        {Array.from({ length: s.count }, (_, i) => (
          <button key={i} className={i === s.i ? 'is-here' : i < s.i ? 'is-done' : ''} onClick={() => s.go(i)} aria-label={`Go to step ${i + 1}`} aria-current={i === s.i ? 'step' : undefined}>
            {i + 1}
          </button>
        ))}
      </span>
    </div>
  );
}
