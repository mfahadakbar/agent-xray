import { useId, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import type { OrganId } from '../data/types';
import { ORGAN, ORGANS } from '../data/tree';
import { ANCHOR, WIRE_LINES, toD } from './geometry';

export type RayMode = 'skin' | 'scan' | 'xray';

export const LENS_R = 86;
/** A circle the size of the lens, as a path, for cutting a hole. */
const hole = (x: number, y: number) => `M${x - LENS_R} ${y}a${LENS_R} ${LENS_R} 0 1 0 ${LENS_R * 2} 0a${LENS_R} ${LENS_R} 0 1 0 ${-LENS_R * 2} 0Z`;
const NONE: OrganId[] = [];

interface Props {
  mode: RayMode;
  /** How far down the scanner has travelled, in Ray units. Everything above it is already X-rayed. */
  scanY: number;
  /** The peek-through lens (skin mode only). */
  lens: { x: number; y: number } | null;
  hover: OrganId | null;
  /** The part a travelling message is at right now. */
  active?: OrganId | null;
  /** Parts that stay bright while the others go quiet: the parts a job uses. */
  lit?: OrganId[];
  /** Parts switched off in the playground. */
  off?: Partial<Record<OrganId, boolean>>;
  /** A message is travelling: fade parts that are not involved. */
  quiet?: boolean;
  onHover?(id: OrganId | null): void;
  onPick?(id: OrganId): void;
}

/** Clickable area of each part, relative to its anchor. */
const HIT: Record<OrganId, ReactNode> = {
  brain: <ellipse rx="84" ry="44" />,
  senses: <rect x="-112" y="-46" width="224" height="96" rx="46" />,
  heart: <circle r="46" />,
  memory: <rect x="-58" y="-50" width="116" height="100" rx="10" />,
  hands: <rect x="-30" y="-92" width="122" height="124" rx="24" />,
  shield: <rect x="-46" y="-56" width="92" height="112" rx="22" />,
  steps: <rect x="-98" y="-58" width="196" height="120" rx="26" />,
  home: <ellipse cy="6" rx="184" ry="34" />,
  friends: <rect x="-58" y="-48" width="116" height="100" rx="20" />,
  checkup: <rect x="-44" y="-58" width="88" height="116" rx="14" />,
};

const HEART_D = 'M12 20s-7.200-4.400-7.200-9.700A4.100 4.100 0 0 1 12 7.900a4.100 4.100 0 0 1 7.200 2.400C19.200 15.600 12 20 12 20z';

const SHIELD_D = 'M12 3l7.200 2.800v5.400c0 4.600-3 8-7.200 9.800-4.200-1.800-7.200-5.200-7.200-9.800V5.800L12 3z';
const WRENCH_D =
  'M14.700 6.300a1 1 0 0 0 0 1.400l1.600 1.600a1 1 0 0 0 1.400 0l3.770-3.770a6 6 0 0 1-7.940 7.940l-6.910 6.910a2.120 2.120 0 0 1-3-3l6.910-6.910a6 6 0 0 1 7.940-7.940l-3.760 3.760z';

/** Line weight for art inside a scaled group, so every part is drawn with the same visual weight. */
const sw = (w: number) => ({ '--sw': w }) as CSSProperties;

/** Each part, drawn around (0,0) so it can pulse and pop from its own centre. */
const ART: Record<OrganId, ReactNode> = {
  brain: (
    <>
      <path
        className="fillable"
        d="M-68 4C-72-12-56-24-42-20C-38-34-12-38-2-26C8-38 36-34 40-20C56-24 72-12 68 4C74 18 60 32 44 28C36 38 10 38 0 28C-10 38-36 38-44 28C-60 32-74 18-68 4Z"
      />
      <path d="M-1-25V27M-40-4q12-9 23 2M-44 14q15 7 27-4M40-4q-12-9-23 2M44 14q-15 7-27-4" />
    </>
  ),
  senses: (
    <>
      <rect className="fillable" x="-105" y="-49" width="210" height="98" rx="46" />
      <circle cx="-43" cy="-1" r="19" />
      <circle cx="43" cy="-1" r="19" />
      <circle className="solid" cx="-43" cy="-1" r="7.500" />
      <circle className="solid" cx="43" cy="-1" r="7.500" />
      <path d="M-18 27q4.500-9 9 0t9 0t9 0t9 0" />
      <path className="waves" d="M-172-42q-13 14 0 28M-186-50q-20 22 0 44M172-42q13 14 0 28M186-50q20 22 0 44" />
    </>
  ),
  heart: (
    <>
      <g className="loop-ring">
        <circle r="40" strokeDasharray="6 9" />
        <path className="solid" d="M40 10L32-4L48-4Z" />
        <path className="solid" d="M-40-10L-48 4L-32 4Z" />
      </g>
      <g className="beat">
        <g transform="scale(2.300) translate(-12 -13.800)" style={sw(1.100)}>
          <path className="fillable strong" d={HEART_D} />
        </g>
      </g>
    </>
  ),
  // A filing cabinet. The top drawer is open, with notes and cards sticking out.
  memory: (
    <>
      <rect className="backing" x="-50" y="-22" width="100" height="64" rx="6" />
      <rect className="note" x="-36" y="-46" width="22" height="26" rx="2" transform="rotate(-8 -25 -33)" />
      <rect className="card" x="-9" y="-48" width="20" height="26" rx="2" />
      <rect className="card" x="15" y="-44" width="20" height="24" rx="2" transform="rotate(7 25 -32)" />
      <rect className="plate" x="-46" y="-22" width="92" height="62" rx="5" />
      <path d="M-34 40v6M34 40v6M-46 15h92" />
      <rect className="plate front" x="-52" y="-31" width="104" height="23" rx="4" />
      <circle className="solid" cy="-19.500" r="3.600" />
      <circle className="solid" cy="3.500" r="3.600" />
      <circle className="solid" cy="27.500" r="3.600" />
    </>
  ),
  // One big wrench, gripped at the hand and reaching up and away from the arm.
  hands: (
    <g transform="translate(-22 -84) scale(4.400)">
      <path className="backing" style={sw(2.600)} d={WRENCH_D} />
      <path className="plate" style={sw(0.720)} d={WRENCH_D} />
    </g>
  ),
  // A real shield, held in front of the forearm.
  shield: (
    <g transform="scale(5.300) translate(-12 -12)">
      <path className="backing" style={sw(2.200)} d={SHIELD_D} />
      <path className="plate" style={sw(0.640)} d={SHIELD_D} />
      <path style={sw(1)} d="M8.300 12.200l2.600 2.600 4.800-5.100" />
    </g>
  ),
  steps: (
    <>
      <path className="fillable" d="M-69-55V7a25 25 0 0 0 50 0V-55" />
      <path className="fillable" d="M19-55V7a25 25 0 0 0 50 0V-55" />
      <rect className="fillable" x="-92" y="12" width="86" height="44" rx="22" />
      <rect className="fillable" x="6" y="12" width="86" height="44" rx="22" />
      <path className="march m1" d="M-54-42l10 9 10-9M34-42l10 9 10-9" />
      <path className="march m2" d="M-54-24l10 9 10-9M34-24l10 9 10-9" />
      <path className="march m3" d="M-54-6l10 9 10-9M34-6l10 9 10-9" />
    </>
  ),
  home: (
    <>
      <ellipse className="fillable" cy="10" rx="178" ry="26" />
      <ellipse className="fillable" cy="-4" rx="178" ry="26" />
      <ellipse className="ripple r1" cy="-4" rx="178" ry="26" />
      <ellipse className="ripple r2" cy="-4" rx="178" ry="26" />
    </>
  ),
  friends: (
    <>
      <g transform="translate(-20 -8)">
        <path d="M0-24v-8" />
        <circle className="solid" cy="-35" r="3.500" />
        <rect className="fillable" x="-22" y="-24" width="44" height="32" rx="12" />
        <circle className="solid" cx="-8" cy="-8" r="3.600" />
        <circle className="solid" cx="8" cy="-8" r="3.600" />
        <rect className="fillable" x="-16" y="12" width="32" height="28" rx="10" />
      </g>
      <g transform="translate(30 14) scale(.78)">
        <path d="M0-24v-8" />
        <circle className="solid" cy="-35" r="3.500" />
        <rect className="fillable" x="-22" y="-24" width="44" height="32" rx="12" />
        <circle className="solid" cx="-8" cy="-8" r="3.600" />
        <circle className="solid" cx="8" cy="-8" r="3.600" />
        <rect className="fillable" x="-16" y="12" width="32" height="28" rx="10" />
      </g>
    </>
  ),
  checkup: (
    <g transform="rotate(-6)">
      <rect className="fillable" x="-32" y="-42" width="64" height="86" rx="9" />
      <rect className="fillable" x="-14" y="-51" width="28" height="15" rx="5" />
      <path className="thick" d="M-19-14l6 6 10-12" />
      <path d="M4-13h17M-20 30h30" />
      <path className="thick ekg" d="M-21 13h8l5-12 7 23 5-11h16" />
    </g>
  ),
};

function Organ({
  id,
  hover,
  active,
  off,
  quiet,
  popped,
  interactive,
  onHover,
  onPick,
}: {
  id: OrganId;
  hover: boolean;
  active: boolean;
  off: boolean;
  quiet: boolean;
  popped: boolean;
  interactive: boolean;
  onHover?(id: OrganId | null): void;
  onPick?(id: OrganId): void;
}) {
  const organ = ORGAN[id];
  const [x, y] = ANCHOR[id];
  const cls = [
    'organ',
    `organ-${id}`,
    hover && 'is-hover',
    active && 'is-active',
    off && 'is-off',
    quiet && !active && 'is-quiet',
    popped && 'is-popped',
  ]
    .filter(Boolean)
    .join(' ');
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick?.(id);
    }
  };
  return (
    <g transform={`translate(${x} ${y})`} className={cls} style={{ '--c': organ.color } as CSSProperties} data-organ={id}>
      <g className="organ-art">{ART[id]}</g>
      {off && (
        <g className="off-tag" transform="translate(0 -4)">
          <rect x="-24" y="-12" width="48" height="24" rx="12" />
          <text y="5" textAnchor="middle">
            OFF
          </text>
        </g>
      )}
      {interactive && (
        <g
          className="organ-hit"
          role="button"
          tabIndex={-1}
          aria-label={`${organ.part}: ${organ.title}, ${organ.aka}`}
          onPointerEnter={() => onHover?.(id)}
          onPointerLeave={() => onHover?.(null)}
          onClick={() => onPick?.(id)}
          onKeyDown={onKey}
        >
          {HIT[id]}
        </g>
      )}
    </g>
  );
}

/** Ray as an X-ray: a glowing outline with the working parts inside. */
function XrayBody() {
  return (
    <g className="xray-shell">
      <path d="M231 493V572a25 25 0 0 0 50 0V493" />
      <path d="M319 493V572a25 25 0 0 0 50 0V493" />
      <rect x="132" y="302.300" width="44" height="155.400" rx="22" transform="rotate(21.040 154 380)" />
      <rect x="424" y="302.300" width="44" height="155.400" rx="22" transform="rotate(-21.040 446 380)" />
      <circle cx="128" cy="452" r="29" />
      <circle cx="472" cy="452" r="29" />
      <rect x="274" y="250" width="52" height="40" rx="10" />
      <rect x="186" y="280" width="228" height="214" rx="60" />
      <circle cx="178" cy="316" r="27" />
      <circle cx="422" cy="316" r="27" />
      <rect x="141" y="130" width="32" height="66" rx="14" />
      <rect x="427" y="130" width="32" height="66" rx="14" />
      <path d="M300 60V36" />
      <circle cx="300" cy="26" r="11" className="antenna" />
      <rect x="165" y="60" width="270" height="200" rx="80" />
    </g>
  );
}

/** Ray as you meet it: a friendly robot. */
function Skin({ ids }: { ids: Record<string, string> }) {
  const body = `url(#${ids.body})`;
  const joint = `url(#${ids.joint})`;
  return (
    <g className="skin-shell">
      {/* dock */}
      <ellipse cx="300" cy="646" rx="178" ry="26" fill="#131f38" />
      <ellipse cx="300" cy="632" rx="178" ry="26" fill="#25375e" />
      <ellipse cx="300" cy="630" rx="150" ry="19" fill="#31487a" />
      <ellipse cx="300" cy="629" rx="118" ry="13" fill="#3d5a96" opacity=".55" />

      {/* a clipboard and two friends stand beside Ray */}
      <g transform={`translate(${ANCHOR.checkup[0]} ${ANCHOR.checkup[1]}) rotate(-6)`}>
        <rect x="-32" y="-42" width="64" height="86" rx="9" fill="#b98a55" />
        <rect x="-26" y="-34" width="52" height="72" rx="5" fill="#fbfdff" />
        <rect x="-14" y="-51" width="28" height="15" rx="5" fill="#8a97b3" />
        <path d="M-19-14l6 6 10-12" stroke="#59c27a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4-13h15M-19 12h38M-19 26h26" stroke="#b6c2d9" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g transform={`translate(${ANCHOR.friends[0]} ${ANCHOR.friends[1]})`}>
        <g transform="translate(30 14) scale(.78)">
          <path d="M0-24v-8" stroke="#8b7bb8" strokeWidth="5" strokeLinecap="round" />
          <circle cy="-35" r="5" fill="#ffd75e" />
          <rect x="-16" y="12" width="32" height="28" rx="10" fill="#b9a6e8" />
          <rect x="-22" y="-24" width="44" height="32" rx="12" fill="#d8caff" />
          <circle cx="-8" cy="-8" r="4.500" fill="#2a2350" />
          <circle cx="8" cy="-8" r="4.500" fill="#2a2350" />
        </g>
        <g transform="translate(-20 -8)" className="friend-bob">
          <path d="M0-24v-8" stroke="#6ba88a" strokeWidth="5" strokeLinecap="round" />
          <circle cy="-35" r="5" fill="#ff8fd0" />
          <rect x="-16" y="12" width="32" height="28" rx="10" fill="#8fd9b4" />
          <rect x="-22" y="-24" width="44" height="32" rx="12" fill="#b9f2d4" />
          <circle cx="-8" cy="-8" r="4.500" fill="#173a2a" />
          <circle cx="8" cy="-8" r="4.500" fill="#173a2a" />
        </g>
      </g>

      {/* legs and feet */}
      <rect x="231" y="467" width="50" height="130" rx="25" fill={joint} />
      <rect x="319" y="467" width="50" height="130" rx="25" fill={joint} />
      <rect x="208" y="560" width="86" height="44" rx="22" fill={body} />
      <rect x="306" y="560" width="86" height="44" rx="22" fill={body} />

      {/* left arm holds still; right arm waves hello */}
      <line x1="174" y1="328" x2="134" y2="432" stroke={joint} strokeWidth="44" strokeLinecap="round" />
      <circle cx="128" cy="452" r="29" fill={body} />
      <circle cx="153" cy="440" r="11" fill={body} />
      <g transform="translate(422 316)">
        <g className="wave-arm">
          <line x1="4" y1="12" x2="44" y2="116" stroke={joint} strokeWidth="44" strokeLinecap="round" />
          <circle cx="50" cy="136" r="29" fill={body} />
          <circle cx="25" cy="124" r="11" fill={body} />
        </g>
      </g>

      {/* body */}
      <rect x="274" y="250" width="52" height="40" rx="10" fill={joint} />
      <rect x="186" y="280" width="228" height="214" rx="60" fill={body} />
      <path d="M196 322q0-34 44-36h120q44 2 44 36" fill="#0b1630" opacity=".10" />
      <rect x="226" y="306" width="148" height="88" rx="26" fill="#dfe8fb" stroke="#b9c8e8" strokeWidth="2" />
      <g transform="translate(262 351) scale(1.700) translate(-12 -13.800)" className="chest-heart">
        <path d={HEART_D} fill="#ff6b6b" />
      </g>
      <circle cx="312" cy="338" r="6.500" fill="#5aa9ff" />
      <circle cx="332" cy="338" r="6.500" fill="#5fe3a1" />
      <circle cx="352" cy="338" r="6.500" fill="#ffd75e" />
      <rect x="304" y="356" width="56" height="12" rx="6" fill="#b9c8e8" />
      <rect x="248" y="414" width="104" height="52" rx="16" fill="#dfe8fb" stroke="#b9c8e8" strokeWidth="2" />
      <rect x="282" y="434" width="36" height="10" rx="5" fill="#9fb3d9" />
      <circle cx="178" cy="316" r="27" fill={joint} />
      <circle cx="422" cy="316" r="27" fill={joint} />

      {/* head */}
      <rect x="141" y="130" width="32" height="66" rx="14" fill={joint} />
      <rect x="427" y="130" width="32" height="66" rx="14" fill={joint} />
      <path d="M300 62V36" stroke="#9fb3d9" strokeWidth="8" strokeLinecap="round" />
      <circle cx="300" cy="26" r="12" fill="#ff8fd0" className="antenna-ball" />
      <rect x="165" y="60" width="270" height="200" rx="80" fill={body} />
      <path d="M203 118q10-36 58-44" stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" opacity=".85" />
      <rect x="195" y="142" width="210" height="98" rx="46" fill={`url(#${ids.visor})`} />
      <path d="M214 172q6-18 30-20" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".16" />
      <g transform="translate(300 190)">
        <g className="eyes">
          <circle cx="-43" r="19" fill={`url(#${ids.eye})`} />
          <circle cx="43" r="19" fill={`url(#${ids.eye})`} />
          <circle cx="-49" cy="-6" r="5.500" fill="#fff" opacity=".95" />
          <circle cx="37" cy="-6" r="5.500" fill="#fff" opacity=".95" />
        </g>
      </g>
      <path d="M283 215Q300 230 317 215" stroke="#6fe3ff" strokeWidth="5.500" strokeLinecap="round" fill="none" />
      <circle cx="222" cy="210" r="8" fill="#ff8fd0" opacity=".45" />
      <circle cx="378" cy="210" r="8" fill="#ff8fd0" opacity=".45" />
    </g>
  );
}

/**
 * Ray, drawn inside a parent <svg> as a <g> in Ray units (600 × 720).
 * The X-ray layer is always underneath. The skin sits on top and is cut away by the scanner and the lens.
 */
export function Ray({ mode, scanY, lens, hover, active = null, lit = NONE, off = {}, quiet = false, onHover, onPick }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ids = {
    body: `rb${uid}`,
    joint: `rj${uid}`,
    visor: `rv${uid}`,
    eye: `re${uid}`,
    mask: `rm${uid}`,
    lens: `rl${uid}`,
    glow: `rg${uid}`,
    inside: `ri${uid}`,
  };
  const showSkin = mode !== 'xray';
  const interactive = mode === 'xray';
  const revealed = Math.max(0, scanY + 60);

  return (
    <g className={`ray ray-${mode}${lens ? ' lens-on' : ''}`}>
      <defs>
        <linearGradient id={ids.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbfdff" />
          <stop offset="1" stopColor="#c6d5f2" />
        </linearGradient>
        <linearGradient id={ids.joint} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9bce0" />
          <stop offset="1" stopColor="#7b91bf" />
        </linearGradient>
        <radialGradient id={ids.visor} cx=".5" cy=".3" r=".9">
          <stop offset="0" stopColor="#1c2c52" />
          <stop offset="1" stopColor="#090f20" />
        </radialGradient>
        <radialGradient id={ids.eye} cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor="#e3fdff" />
          <stop offset=".55" stopColor="#6fe3ff" />
          <stop offset="1" stopColor="#2aa4d4" />
        </radialGradient>
        <filter id={ids.glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {showSkin && (
          <>
            {/*
              The skin is cut away above the scanner and inside the lens…
              (Clip paths, not masks: they are much lighter to draw, and steadier on phones.
              With the even-odd rule, the circle is a hole in the rectangle.)
            */}
            <clipPath id={ids.mask} clipPathUnits="userSpaceOnUse">
              <path clipRule="evenodd" d={`M-340 ${mode === 'scan' ? revealed - 60 : -60}H940V780H-340Z${lens ? hole(lens.x, lens.y) : ''}`} />
            </clipPath>
            {/* …and the inside shows only there. With no scanner and no lens this is empty, and nothing shows. */}
            <clipPath id={ids.inside} clipPathUnits="userSpaceOnUse">
              {mode === 'scan' && <rect x="-340" y="-60" width="1280" height={revealed} />}
              {lens && <circle cx={lens.x} cy={lens.y} r={LENS_R} />}
            </clipPath>
          </>
        )}
      </defs>

      <ellipse cx="300" cy="664" rx="210" ry="20" className="floor-shadow" />

      <g className="ray-inside" clipPath={showSkin ? `url(#${ids.inside})` : undefined}>
        <g filter={`url(#${ids.glow})`}>
          <XrayBody />
        </g>
        <g className="wires">
          {WIRE_LINES.map((line, i) => (
            <path key={i} d={toD(line)} />
          ))}
        </g>
        {ORGANS.map((o) => (
          <Organ
            key={o.id}
            id={o.id}
            hover={hover === o.id}
            active={active === o.id}
            off={!!off[o.id]}
            quiet={quiet && !lit.includes(o.id)}
            popped={mode !== 'scan' || scanY > ANCHOR[o.id][1]}
            interactive={interactive}
            onHover={onHover}
            onPick={onPick}
          />
        ))}
      </g>

      {showSkin && (
        <g clipPath={`url(#${ids.mask})`}>
          <Skin ids={ids} />
        </g>
      )}

      {lens && mode === 'skin' && (
        <g className="lens" transform={`translate(${lens.x} ${lens.y})`}>
          <circle r={LENS_R} className="lens-ring" />
          <circle r={LENS_R + 9} className="lens-halo" />
          <path className="lens-ticks" d={`M0 ${-LENS_R - 16}v10M0 ${LENS_R + 6}v10M${-LENS_R - 16} 0h10M${LENS_R + 6} 0h10`} />
        </g>
      )}
    </g>
  );
}
