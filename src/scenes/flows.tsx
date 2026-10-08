import { useState } from 'react';
import { useRunner } from '../lib/hooks';
import { Arrow, At, Btn, Bubble, Card, Choice, Draw, MiniRay, Pic, Scene, StepTags, Tag, tagsFor, type P2 } from './kit';
import { register, type SceneProps } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Steps: the recipe. You draw the path. Ray walks it, the same way every time.
// ─────────────────────────────────────────────────────────────────────────────

type Pat = 'sequence' | 'parallel' | 'condition' | 'loop' | 'router';

interface Node {
  id: string;
  icon: string;
  name: string;
  at: P2;
}
interface Edge {
  from: string;
  to: string;
  bend?: number;
  label?: string;
}
interface Recipe {
  chip: string;
  nodes: Node[];
  edges: Edge[];
  /** Named inputs that change which way the token goes. */
  inputs?: Array<{ id: string; label: string }>;
  /** The stops the token makes, per input. Several ids in one stop means "at the same time". */
  walk(input: string): string[][];
  intro: string;
  outro(input: string): string;
}

const RECIPES: Record<Pat, Recipe> = {
  sequence: {
    chip: '➡️ In a row',
    nodes: [
      { id: 'a', icon: '🔎', name: 'Find facts', at: [18, 28] },
      { id: 'b', icon: '✍️', name: 'Write', at: [50, 28] },
      { id: 'c', icon: '✅', name: 'Check', at: [82, 28] },
    ],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ],
    walk: () => [['a'], ['b'], ['c']],
    intro: 'Three steps in a row. Each one hands its work to the next.',
    outro: () => 'Find, write, check. In that order, every single time.',
  },
  parallel: {
    chip: '🔀 Together',
    nodes: [
      { id: 's', icon: '📨', name: 'Start', at: [13, 28] },
      { id: 'a', icon: '🌐', name: 'Search the web', at: [45, 15] },
      { id: 'b', icon: '📚', name: 'Search the library', at: [45, 41] },
      { id: 'j', icon: '🧩', name: 'Put together', at: [81, 28] },
    ],
    edges: [
      { from: 's', to: 'a' },
      { from: 's', to: 'b' },
      { from: 'a', to: 'j' },
      { from: 'b', to: 'j' },
    ],
    walk: () => [['s'], ['a', 'b'], ['j']],
    intro: 'Two steps that do not need each other. Why wait?',
    outro: () => 'Both searches ran at the same time. Half the waiting.',
  },
  condition: {
    chip: '🚦 If / then',
    nodes: [
      { id: 'q', icon: '❓', name: 'Needs facts?', at: [16, 28] },
      { id: 'r', icon: '🔎', name: 'Find facts', at: [50, 14] },
      { id: 'w', icon: '✍️', name: 'Write', at: [82, 28] },
    ],
    edges: [
      { from: 'q', to: 'r', label: 'yes' },
      { from: 'r', to: 'w' },
      { from: 'q', to: 'w', bend: 6, label: 'no' },
    ],
    inputs: [
      { id: 'facts', label: '🌈 “Why is the sky blue?”' },
      { id: 'poem', label: '📝 “Write me a poem”' },
    ],
    walk: (i) => (i === 'facts' ? [['q'], ['r'], ['w']] : [['q'], ['w']]),
    intro: 'A little check decides which road to take.',
    outro: (i) => (i === 'facts' ? 'This one needed facts, so it took the long road.' : 'A poem needs no facts. It skipped a whole step.'),
  },
  loop: {
    chip: '🔁 Repeat',
    nodes: [
      { id: 'w', icon: '✍️', name: 'Write', at: [18, 28] },
      { id: 'r', icon: '🧐', name: 'Good enough?', at: [50, 28] },
      { id: 'd', icon: '🎉', name: 'Done', at: [82, 28] },
    ],
    edges: [
      { from: 'w', to: 'r' },
      { from: 'r', to: 'd', label: 'yes' },
      { from: 'r', to: 'w', bend: 9, label: 'not yet' },
    ],
    walk: () => [['w'], ['r'], ['w'], ['r'], ['d']],
    intro: 'Write, check, and write again until it is good.',
    outro: () => 'It took two tries. The loop stopped as soon as the answer was good.',
  },
  router: {
    chip: '🔱 Pick a path',
    nodes: [
      { id: 'q', icon: '📨', name: 'What is it?', at: [13, 28] },
      { id: 'a', icon: '💳', name: 'Money desk', at: [50, 11] },
      { id: 'b', icon: '🛠️', name: 'Fix-it desk', at: [50, 28] },
      { id: 'c', icon: '💬', name: 'Everything else', at: [50, 45] },
      { id: 'd', icon: '📤', name: 'Answer', at: [86, 28] },
    ],
    edges: [
      { from: 'q', to: 'a' },
      { from: 'q', to: 'b' },
      { from: 'q', to: 'c' },
      { from: 'a', to: 'd' },
      { from: 'b', to: 'd' },
      { from: 'c', to: 'd' },
    ],
    inputs: [
      { id: 'a', label: '💳 “My bill is wrong”' },
      { id: 'b', label: '🛠️ “The app crashed”' },
      { id: 'c', label: '👋 “Hello”' },
    ],
    walk: (i) => [['q'], [i], ['d']],
    intro: 'One front door, three desks. Each message goes to the right one.',
    outro: (i) => (i === 'a' ? 'A bill question went to the money desk.' : i === 'b' ? 'A crash went to the fix-it desk.' : 'It did not fit a special desk, so it went to “everything else”.'),
  },
};

/** Half the width and height of a step box, in stage units. Arrows start and end at the box edge. */
const HW = 7.750;
const HH = 4.800;

function edgeGeom(a: P2, b: P2, bend = 0): { from: P2; to: P2; bend: number; label: P2 } {
  let from: P2;
  let to: P2;
  let k = bend;
  if (b[0] < a[0] - 1) {
    // A step that goes back: leave from the bottom, curve underneath.
    from = [a[0] - 3, a[1] + HH + 0.8];
    to = [b[0] + 3, b[1] + HH + 0.8];
    k = -Math.abs(bend || 6);
  } else {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const t = Math.min(HW / Math.max(Math.abs(ux), 0.001), HH / Math.max(Math.abs(uy), 0.001)) + 0.8;
    from = [a[0] + ux * t, a[1] + uy * t];
    to = [b[0] - ux * t, b[1] - uy * t];
  }
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = (from[0] + to[0]) / 2 - (dy / len) * k;
  const cy = (from[1] + to[1]) / 2 + (dx / len) * k;
  const mx = 0.25 * from[0] + 0.5 * cx + 0.25 * to[0];
  const my = 0.25 * from[1] + 0.5 * cy + 0.25 * to[1];
  return { from, to, bend: k, label: [mx, k ? my + 2.300 : my - 1.100] };
}

function RecipeScene({ variant }: SceneProps) {
  const [pat, setPat] = useState<Pat>(variant && variant in RECIPES ? (variant as Pat) : 'sequence');
  const r = RECIPES[pat];
  const [input, setInput] = useState(r.inputs?.[0].id ?? '');
  const [stop, setStop] = useState(-1);
  const { run, stop: halt, busy } = useRunner();

  const stops = r.walk(input);
  const ended = stop >= stops.length;
  const here = stop >= 0 && !ended ? stops[stop] : ended ? stops[stops.length - 1] : [];
  const seen = new Set(stops.slice(0, Math.max(0, stop + 1)).flat());

  const reset = () => {
    halt();
    setStop(-1);
  };
  const pick = (p: Pat) => {
    reset();
    setPat(p);
    setInput(RECIPES[p].inputs?.[0].id ?? '');
  };
  const go = () =>
    run(async (sleep) => {
      for (let i = 0; i <= stops.length; i++) {
        setStop(i);
        await sleep(i < stops.length ? 1150 : 0);
      }
    });

  const node = (id: string) => r.nodes.find((n) => n.id === id)!;
  const lit = (e: Edge) => {
    for (let i = 1; i <= Math.min(stop, stops.length - 1); i++) if (stops[i - 1].includes(e.from) && stops[i].includes(e.to)) return true;
    return false;
  };
  const tries = pat === 'loop' ? stops.slice(0, stop + 1).filter((s) => s[0] === 'w').length : 0;

  return (
    <Scene
      caption={ended ? r.outro(input) : busy ? `Now: ${here.map((id) => node(id).name.toLowerCase()).join(' and ')}…` : `${r.intro} You drew this path. Press run and Ray walks it.`}
      tone={ended ? 'ok' : undefined}
      step={stop >= 0 ? Math.min(stop + 1, stops.length) : undefined}
      controls={
        <>
          {!variant && <Choice<Pat> label="Shape" value={pat} onChange={pick} options={(Object.keys(RECIPES) as Pat[]).map((id) => ({ id, label: RECIPES[id].chip }))} />}
          {r.inputs && (
            <Choice
              label="Message"
              value={input}
              onChange={(v) => {
                reset();
                setInput(v);
              }}
              options={r.inputs}
            />
          )}
          <Btn onClick={go} disabled={busy} pulse={stop < 0}>
            {ended ? '↺ Run again' : '▶ Run'}
          </Btn>
        </>
      }
    >
      <Draw>
        {r.edges.map((e, i) => {
          const g = edgeGeom(node(e.from).at, node(e.to).at, e.bend);
          const on = lit(e);
          return (
            <g key={`${pat}${i}`}>
              <Arrow from={g.from} to={g.to} bend={g.bend} off={!on} flow={on && busy} />
              {e.label && (
                <text x={g.label[0]} y={g.label[1]} textAnchor="middle" fontSize="1.600" opacity={on ? 1 : 0.55}>
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
      </Draw>

      {r.nodes.map((n) => (
        <At key={`${pat}${n.id}`} x={n.at[0]} y={n.at[1]} w={15.500}>
          <Card className={`k-center rc-node${here.includes(n.id) ? ' is-on' : seen.has(n.id) ? ' is-done' : ''}`}>
            <StepTags tags={tagsFor(stops, n.id, stop)} current={ended ? undefined : stop + 1} />
            <Pic size={1.800}>{n.icon}</Pic>
            <span className="k-label">{n.name}</span>
          </Card>
        </At>
      ))}
      {here.map((id) => (
        <At key={`${pat}${id}tok`} x={node(id).at[0] + 6} y={node(id).at[1] - 5.500} z={3}>
          <span className="lp-heart">⭐</span>
        </At>
      ))}
      <At x={50} y={52} hide={pat !== 'loop' || stop < 0}>
        <Tag tone={ended ? 'ok' : 'info'}>try {Math.max(1, tries)} of 2</Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Friends: a team. A leader hands out the work and puts the pieces together.
// ─────────────────────────────────────────────────────────────────────────────

type TeamMode = 'route' | 'coordinate' | 'broadcast' | 'tasks' | 'handoff';
const CREW = [
  { id: 'f', icon: '🔎', name: 'Finder', color: '#b9f2d4', at: [20, 39] as P2 },
  { id: 'w', icon: '✍️', name: 'Writer', color: '#ffe3a3', at: [50, 41] as P2 },
  { id: 'c', icon: '✅', name: 'Checker', color: '#d8caff', at: [80, 39] as P2 },
];
interface TeamStep {
  /** Who is working now. */
  on: string[];
  /** Notes pinned next to members after this step. */
  say?: Record<string, string>;
  caption: string;
  calls: number;
  final?: string;
  todo?: number;
}
const TEAM: Record<TeamMode, { chip: string; ask: string; steps: TeamStep[]; intro: string; names?: Record<string, string> }> = {
  route: {
    chip: '👉 Pick one',
    ask: 'Is “definately” spelled right?',
    intro: 'The leader reads the job and picks the one friend who knows best.',
    steps: [
      { on: ['L'], caption: 'The leader reads the job. “That is a spelling question.”', calls: 1 },
      { on: ['c'], say: { c: 'No. It is “definitely”.' }, caption: 'Only the checker gets the job. The others never hear about it.', calls: 2 },
      { on: [], say: { c: 'No. It is “definitely”.' }, caption: 'The checker answers you directly. Two brain calls, and done.', calls: 2, final: 'No. It is “definitely”.' },
    ],
  },
  coordinate: {
    chip: '🧩 Split the job',
    ask: 'Make a poster about sharks. 🦈',
    intro: 'The leader cuts a big job into pieces and gives each friend one.',
    steps: [
      { on: ['L'], caption: 'The leader cuts the job into three smaller jobs.', calls: 1 },
      { on: ['f'], say: { f: '3 shark facts' }, caption: 'The finder looks up shark facts.', calls: 2 },
      { on: ['w'], say: { f: '3 shark facts', w: 'poster text' }, caption: 'The writer turns the facts into poster words.', calls: 3 },
      { on: ['c'], say: { f: '3 shark facts', w: 'poster text', c: 'all correct' }, caption: 'The checker makes sure it is all true.', calls: 4 },
      { on: ['L'], say: { f: '3 shark facts', w: 'poster text', c: 'all correct' }, caption: 'The leader glues the pieces into one poster. Five brain calls for one job.', calls: 5, final: '🦈 Shark poster: done and checked!' },
    ],
  },
  broadcast: {
    chip: '📣 Ask everyone',
    ask: 'What should we name our robot dog?',
    intro: 'Everyone gets the same question at the same time.',
    steps: [
      { on: ['L'], caption: 'The leader sends the same question to all three friends.', calls: 1 },
      { on: ['f', 'w', 'c'], say: { f: '“Bolt”', w: '“Sparky”', c: '“Zap”' }, caption: 'All three think at once. Three different ideas.', calls: 4 },
      { on: ['L'], say: { f: '“Bolt”', w: '“Sparky”', c: '“Zap”' }, caption: 'The leader compares the ideas and picks. More opinions, more brain calls.', calls: 5, final: 'Top pick: Sparky. Also good: Bolt and Zap.' },
    ],
  },
  tasks: {
    chip: '📋 A to-do list',
    ask: 'Plan a class party. 🎉',
    intro: 'The leader writes a to-do list. Friends tick things off.',
    steps: [
      { on: ['L'], caption: 'The leader writes a to-do list for the whole job.', calls: 1, todo: 0 },
      { on: ['f', 'w'], say: { f: 'found a room', w: 'invitations ready' }, caption: 'Two tasks do not depend on each other, so two friends work at once.', calls: 3, todo: 2 },
      { on: ['c'], say: { f: 'found a room', w: 'invitations ready', c: 'budget is fine' }, caption: 'The last task had to wait for the first two.', calls: 4, todo: 3 },
      { on: ['L'], say: { f: 'found a room', w: 'invitations ready', c: 'budget is fine' }, caption: 'Every box is ticked. The list kept a long job on track.', calls: 5, todo: 3, final: 'The party is planned! 🎉' },
    ],
  },
  // No leader in the middle: the friends pass the conversation between themselves.
  handoff: {
    chip: '🤾 Pass it on',
    ask: 'My bill is wrong, and I want my money back.',
    intro: 'No boss in the middle. The friends pass the conversation along, like a relay race.',
    names: { f: '🛎️ Front desk', w: '💳 Billing', c: '💸 Refunds' },
    steps: [
      { on: ['f'], say: { f: 'not my job' }, caption: 'The front desk listens. "This is about a bill. That is not my job."', calls: 1 },
      { on: ['w'], say: { f: 'passed on', w: 'bill fixed' }, caption: 'It passes the whole conversation to billing, who fixes the bill.', calls: 2 },
      { on: ['c'], say: { f: 'passed on', w: 'passed on', c: 'money sent' }, caption: 'Billing passes it on again. Refunds sends the money back. Three brain calls, and no boss.', calls: 3, final: 'Your bill is fixed, and your money is on its way.' },
    ],
  },
};
const TODO = ['Find a room', 'Write invitations', 'Check the budget'];

function Team({ variant }: SceneProps) {
  const [mode, setMode] = useState<TeamMode>(variant && variant in TEAM ? (variant as TeamMode) : 'coordinate');
  const [i, setI] = useState(-1);
  const { run, stop, busy } = useRunner();
  const t = TEAM[mode];
  const step = i >= 0 ? t.steps[Math.min(i, t.steps.length - 1)] : null;
  const ended = i >= t.steps.length - 1;
  // Who works at each step. Friends who work at the same time share a number: 2a, 2b, 2c.
  const groups = t.steps.map((st) => st.on);

  const pick = (m: TeamMode) => {
    stop();
    setMode(m);
    setI(-1);
  };
  const go = () =>
    run(async (sleep) => {
      for (let k = 0; k < t.steps.length; k++) {
        setI(k);
        await sleep(1700);
      }
    });

  return (
    <Scene
      caption={step ? step.caption : `${t.intro} Press go.`}
      tone={ended ? 'ok' : undefined}
      step={i >= 0 ? Math.min(i, t.steps.length - 1) + 1 : undefined}
      controls={
        <>
          <Choice<TeamMode> label="How they work" value={mode} onChange={pick} options={(Object.keys(TEAM) as TeamMode[]).map((id) => ({ id, label: TEAM[id].chip }))} />
          <Btn onClick={go} disabled={busy} pulse={i < 0}>
            {ended ? '↺ Again' : '▶ Go'}
          </Btn>
        </>
      }
    >
      <Draw>
        {mode === 'handoff'
          ? [0, 1].map((k) => <Arrow key={k} from={[CREW[k].at[0] + 7, 39]} to={[CREW[k + 1].at[0] - 7, 39]} bend={-3} off={i < k + 1} flow={i === k + 1} />)
          : CREW.map((m) => {
              const on = !!step?.on.includes(m.id);
              const talked = !!step?.say?.[m.id];
              return <Arrow key={m.id} from={[50 + (m.at[0] - 50) * 0.16, 21]} to={[m.at[0] + (50 - m.at[0]) * 0.1, 31.500]} off={!on && !talked} flow={on} dashed={!on} />;
            })}
      </Draw>

      <At x={22} y={6.500} w={38}>
        <Bubble who="you" key={mode}>
          {t.ask}
        </Bubble>
      </At>

      <At x={50} y={15} style={{ opacity: mode === 'handoff' ? 0.16 : 1 }}>
        <div className={`tm-member${step?.on.includes('L') ? ' is-on' : ''}`}>
          <StepTags tags={tagsFor(groups, 'L', i)} current={i + 1} />
          <span className="tm-crown">👑</span>
          <MiniRay size={3.800} mood={step?.on.includes('L') ? 'think' : ended ? 'happy' : 'happy'} label="The leader" />
          <span className="k-label">Leader</span>
        </div>
      </At>

      {CREW.map((m) => (
        <At key={m.id} x={m.at[0]} y={m.at[1]}>
          <div className={`tm-member${step?.on.includes(m.id) ? ' is-on' : ''}${mode === 'route' && step && !step.say?.[m.id] && !step.on.includes(m.id) && i > 0 ? ' is-idle' : ''}`}>
            <StepTags tags={tagsFor(groups, m.id, i)} current={i + 1} />
            <MiniRay size={3.200} color={m.color} mood={step?.on.includes(m.id) ? 'think' : 'happy'} label={m.name} />
            <span className="k-label">{t.names?.[m.id] ?? `${m.icon} ${m.name}`}</span>
          </div>
        </At>
      ))}
      {CREW.map((m) => (
        <At key={`${m.id}say`} x={m.at[0]} y={m.at[1] + 10.500} hide={!step?.say?.[m.id]}>
          <Tag tone="ok">{step?.say?.[m.id] ?? '…'}</Tag>
        </At>
      ))}

      <At x={82} y={11} w={32} hide={!step?.final}>
        <Bubble who="ray" tone="ok" key={`${mode}final`}>
          {step?.final}
        </Bubble>
      </At>

      <At x={16} y={21} w={26} hide={mode !== 'tasks' || i < 0}>
        <Card className="tm-todo">
          <small>to-do list</small>
          {TODO.map((task, k) => (
            <span key={task} className={(step?.todo ?? 0) > k ? 'is-done' : ''}>
              {(step?.todo ?? 0) > k ? '☑' : '☐'} {task}
            </span>
          ))}
        </Card>
      </At>

      <At x={90} y={3.800}>
        <Tag tone={(step?.calls ?? 0) > 3 ? 'warn' : 'info'}>brain calls: {step?.calls ?? 0}</Tag>
      </At>
    </Scene>
  );
}

register({ recipe: RecipeScene, team: Team });
