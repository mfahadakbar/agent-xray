import type { CSSProperties, ReactNode } from 'react';
import { useTyped, type Steps } from '../lib/hooks';

/**
 * The scene kit. Every interactive explainer is built from these few pieces.
 *
 * A scene is a 16:9 stage. Positions are in "stage units": 1 unit = 1% of the stage width,
 * so the stage is 100 wide and 56.25 tall, on any screen. HTML pieces are placed with <At>,
 * lines and arrows are drawn in <Draw> using the same units.
 */
export const SW = 100;
export const SH = 56.25;

export type P2 = readonly [number, number];

// ── frame ────────────────────────────────────────────────────────────────────

export function Scene({
  children,
  caption,
  controls,
  tone,
  tall,
  step,
}: {
  children: ReactNode;
  /** One short sentence about what is happening right now. Read aloud when sound is on. */
  caption: string;
  controls?: ReactNode;
  tone?: 'ok' | 'bad' | 'warn';
  /** A taller stage (4:3) for scenes that need the room. */
  tall?: boolean;
  /** Which step of the process the caption is about. Shown as the same numbered tag used on the stage. */
  step?: number;
}) {
  return (
    <div className={`scene${tall ? ' is-tall' : ''}`}>
      <div className="stage-wrap">
        <div className="stage">{children}</div>
      </div>
      <p className="scene-turn">Small screen? Turn your phone sideways for a bigger picture.</p>
      <div className="scene-bar">
        <p className={`scene-caption${tone ? ` tone-${tone}` : ''}`} aria-live="polite">
          {step !== undefined && step > 0 && <StepTag n={step} now />}
          <span>{caption}</span>
        </p>
        {controls && <div className="scene-controls">{controls}</div>}
      </div>
    </div>
  );
}

/** Place something on the stage, centred on (x, y). Changing x or y glides it there. */
export function At({
  x,
  y,
  w,
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
  z?: number;
  hide?: boolean;
  delay?: number;
  slow?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={`at${hide ? ' is-hidden' : ''}${slow ? ' is-slow' : ''} ${className}`}
      style={{
        // Plain percentages of the stage: they glide reliably, unlike container units inside a transition.
        left: `${x}%`,
        top: `${(y / SH) * 100}%`,
        width: w ? `${w}%` : undefined,
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
export function Draw({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <svg className="draw" viewBox={`0 0 ${SW} ${tall ? 75 : SH}`} preserveAspectRatio="none" aria-hidden="true">
      {children}
    </svg>
  );
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
}: {
  from: P2;
  to: P2;
  /** Curve the line: positive bends one way, negative the other. */
  bend?: number;
  color?: string;
  off?: boolean;
  dashed?: boolean;
  /** Animate dashes travelling along the line. */
  flow?: boolean;
  head?: boolean;
  width?: number;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
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
