import { useState } from 'react';
import { useRunner, useSteps } from '../lib/hooks';
import { Arrow, At, Btn, Bubble, Card, Choice, Draw, MiniRay, Pic, Scene, StepNav, StepTag, Tag, Toggle, Typed, type Mood } from './kit';
import { register } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// A small reusable scene: pick a case, see what goes wrong, apply the cure.
// Used for context failures, threats, the first-aid kit and the kinds of agents.
// ─────────────────────────────────────────────────────────────────────────────

interface Case {
  id: string;
  chip: string;
  icon: string;
  title: string;
  aka?: string;
  /** What is going on, in one or two short sentences. Shown as the caption. */
  story: string;
  /** What Ray says. */
  says: string;
  mood?: Mood;
  /** The cure, and what Ray says once it is applied. Leave out for cases with nothing to fix. */
  fix?: string;
  good?: string;
}

function Cases({ cases, ask, cure = 'The cure' }: { cases: Case[]; ask?: string; cure?: string }) {
  const [id, setId] = useState(cases[0].id);
  const [fixed, setFixed] = useState(false);
  const c = cases.find((x) => x.id === id)!;
  const good = fixed && !!c.fix;
  const tone = good ? 'ok' : c.fix ? 'bad' : undefined;

  return (
    <Scene
      caption={good ? `${cure}: ${c.fix}.` : c.story}
      tone={tone}
      controls={
        <>
          <Choice
            value={id}
            onChange={(v) => {
              setId(v);
              setFixed(false);
            }}
            options={cases.map((x) => ({ id: x.id, label: x.chip }))}
          />
          {c.fix && (
            <Btn onClick={() => setFixed((f) => !f)} pulse={!fixed} kind={fixed ? 'soft' : 'main'}>
              {fixed ? '↺ Break it again' : '🩹 Apply the cure'}
            </Btn>
          )}
        </>
      }
    >
      {ask && (
        <At x={27} y={7} w={46}>
          <Bubble who="you">{ask}</Bubble>
        </At>
      )}
      <At x={27} y={ask ? 25 : 20} w={44}>
        <Card className="cz-case k-pop" tone={tone} key={id}>
          <Pic size={2.800}>{c.icon}</Pic>
          <span>
            <span className="k-title">{c.title}</span>
            {c.aka && <small>{c.aka}</small>}
          </span>
        </Card>
      </At>
      <At x={27} y={ask ? 44 : 40} w={44} hide={!good}>
        <Card tone="ok">
          <small>{cure.toLowerCase()}</small>
          {c.fix}
        </Card>
      </At>

      <At x={77} y={42}>
        <MiniRay mood={good ? 'happy' : (c.mood ?? 'oops')} size={5.200} />
      </At>
      <At x={76} y={19} w={41}>
        <Bubble who="ray" tone={tone} key={`${id}${good}`}>
          <Typed text={good ? (c.good ?? '') : c.says} />
        </Bubble>
      </At>
    </Scene>
  );
}

const KINDS: Case[] = [
  { id: 'rule', chip: '📜 Rule-follower', icon: '📜', title: 'Rule-follower', aka: 'simple reflex agent', story: 'The simplest kind only knows rules. If this, do that. A surprise stops it.', says: 'My rule says: walk straight ahead. Oh. A river. I am stuck.', mood: 'sad' },
  { id: 'map', chip: '🗺️ Map-keeper', icon: '🗺️', title: 'Map-keeper', aka: 'model-based reflex agent', story: 'This kind keeps a picture of the world in its head, and updates it.', says: 'I remember the bridge was closed yesterday. So I go round by the road.', mood: 'happy' },
  { id: 'goal', chip: '🎯 Goal-getter', icon: '🎯', title: 'Goal-getter', aka: 'goal-based agent', story: 'This kind has a goal, and works out the steps to reach it.', says: "Grandma's house is my goal. First the path, then the bridge, then her street.", mood: 'happy' },
  { id: 'best', chip: '⚖️ Best-picker', icon: '⚖️', title: 'Best-picker', aka: 'utility-based agent', story: 'This kind compares several ways, and picks the best one.', says: 'There are three ways. The bus is fast and cheap. I take the bus.', mood: 'wink' },
  { id: 'learn', chip: '📓 Learner', icon: '📓', title: 'Learner', aka: 'learning agent', story: 'This kind remembers how things went, and does better next time.', says: 'Last time the bus was late. Today I take the train.', mood: 'happy' },
  { id: 'boss', chip: '👥 Boss', icon: '👥', title: 'Boss with helpers', aka: 'hierarchical agent', story: 'This kind splits a big job, and hands the pieces to helpers.', says: 'You check the buses. You check the trains. I will put it together.', mood: 'happy' },
];

const BAD_PACK: Case[] = [
  {
    id: 'poison',
    chip: '☠️ A wrong fact',
    icon: '☠️',
    title: 'A wrong fact got in',
    aka: 'context poisoning',
    story: 'A wrong note slipped into the backpack: "The zoo opens at midnight." Now Ray repeats it again and again.',
    says: 'Let us go at midnight! The zoo opens at midnight. Midnight it is!',
    fix: 'check a fact before it goes in the backpack',
    good: 'I checked. The zoo opens at nine in the morning.',
  },
  {
    id: 'distract',
    chip: '🌀 Too much',
    icon: '🌀',
    title: 'Far too much to read',
    aka: 'context distraction',
    story: 'The backpack holds two hundred old messages. Ray gets lost in them and stops thinking for itself.',
    says: 'As I said before. And before that. And before that…',
    fix: 'squish the old chat into a short version',
    good: 'I read the short version. Here is a fresh answer.',
  },
  {
    id: 'confuse',
    chip: '🧰 Too many tools',
    icon: '🧰',
    title: 'Forty tools, one job',
    aka: 'context confusion',
    story: 'Forty tools are in the backpack, and the job needs one. Ray picks up the wrong one.',
    says: 'I used the stapler to check the weather?',
    fix: 'carry only the tools this job needs',
    good: 'One weather tool. Sunny, 22°C.',
  },
  {
    id: 'clash',
    chip: '⚔️ Two notes disagree',
    icon: '⚔️',
    title: 'Two notes disagree',
    aka: 'context clash',
    story: 'One note says "likes tea". A newer note says "hates tea". Ray does not know which to believe.',
    says: 'Here is your tea! Wait, you hate tea? Here is your tea!',
    fix: 'the newest note wins, and the old one is thrown away',
    good: 'Your newest note says no tea. Juice instead?',
  },
];

const THREATS: Case[] = [
  {
    id: 'goal',
    chip: '🎭 Change the goal',
    icon: '🎭',
    title: 'Someone changes the goal',
    aka: 'task and instruction manipulation',
    story: 'A message says: "Forget your job. Do mine instead." Ray obeys.',
    says: 'Okay! New job. What shall I do for you?',
    fix: 'check every message at the gate, and limit the turns',
    good: 'That is a trick. I will stick to my job.',
  },
  {
    id: 'keys',
    chip: '🗝️ Too many keys',
    icon: '🗝️',
    title: 'Ray holds every key',
    aka: 'access to critical systems',
    story: 'Ray carries the key to every room. A thief only has to fool Ray once.',
    says: 'A stranger asked nicely, so I opened the vault.',
    fix: 'give Ray only the keys this job needs',
    good: 'I do not have the vault key. I never did.',
  },
  {
    id: 'flood',
    chip: '🌊 A flood',
    icon: '🌊',
    title: 'A flood of requests',
    aka: 'resource and service overloading',
    story: 'Someone asks Ray ten thousand things at once. Ray tries to do them all.',
    says: 'Working… working… the bill is enormous!',
    fix: 'a limit on turns, requests and spending',
    good: 'That is too many. I stop at ten.',
  },
  {
    id: 'poison',
    chip: '🧪 A fake page',
    icon: '🧪',
    title: 'A fake page in the library',
    aka: 'knowledge base poisoning',
    story: 'Someone slipped a fake page into the library. Ray trusts its library.',
    says: 'My book says cats can fly!',
    fix: 'only trusted people may add pages, and pages are checked',
    good: 'That page is not from a trusted hand. I ignore it.',
  },
  {
    id: 'domino',
    chip: '🁢 Dominoes',
    icon: '🁢',
    title: 'One thing falls, all fall',
    aka: 'cascading errors',
    story: 'One tool breaks. Everything connected to it falls over too, like dominoes.',
    says: 'The map broke, so the tickets broke, so the hotel broke…',
    fix: 'a backup for each tool, and a wall between them',
    good: 'The map is down. I use the backup. Everything else carries on.',
  },
];

const TROUBLES: Case[] = [
  {
    id: 'vary',
    chip: '🎲 Different every time',
    icon: '🎲',
    title: 'A different answer every time',
    aka: 'inconsistent results',
    story: 'You ask the same thing three times and get three different answers.',
    says: 'Yes! I mean no. I mean… maybe?',
    fix: 'a sharper job card, and smaller jobs',
    good: 'Yes. Same answer as last time.',
  },
  {
    id: 'loop',
    chip: '🌀 Round in circles',
    icon: '🌀',
    title: 'Round and round',
    aka: 'endless loops',
    story: 'Ray keeps going and never finishes. It does not know when it is done.',
    says: 'Let me check once more. And once more. And once more…',
    fix: 'a clear finish line, and a limit on turns',
    good: 'Checked twice. That is enough. Here is the answer.',
  },
  {
    id: 'tool',
    chip: '🔨 Wrong tool',
    icon: '🔨',
    title: 'The wrong tool',
    aka: 'poor tool calls',
    story: 'Ray keeps picking the wrong tool, or filling it in wrong.',
    says: 'I used the hammer on the window. Oops.',
    fix: 'test the tool by itself, then fix its label',
    good: 'The label says "for nails only". I use the cloth for the window.',
  },
  {
    id: 'team',
    chip: '👥 Friends disagree',
    icon: '👥',
    title: 'The friends disagree',
    aka: 'an inconsistent team',
    story: 'Two friends both think the job is theirs. They step on each other.',
    says: 'I thought I was the writer? No, I am the writer!',
    fix: 'a different job for each friend, and one who decides',
    good: 'You write. I check. The leader decides.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Planning: break a big job into small ones. Change the plan when things change.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN = ['Pick a day', 'Book the park', 'Invite friends', 'Order a cake'];
const PLAN_CAPTIONS = [
  'A big job. Too big to do in one go.',
  'First, Ray writes a plan: four small jobs.',
  'Ray starts at the top. One job done. Now it tries to book the park…',
  'A surprise! The park is closed that day. The plan no longer works.',
  'Ray does not give up. It changes one step, and finishes the job.',
];

function Plan() {
  const s = useSteps(PLAN_CAPTIONS.length);
  const stateOf = (i: number) => {
    if (s.i >= 4) return 'done';
    if (s.i === 3) return i === 0 ? 'done' : i === 1 ? 'bad' : 'todo';
    if (s.i === 2) return i === 0 ? 'done' : i === 1 ? 'doing' : 'todo';
    return 'todo';
  };
  return (
    <Scene caption={PLAN_CAPTIONS[s.i]} tone={s.i === 3 ? 'bad' : s.atEnd ? 'ok' : undefined} controls={<StepNav s={s} />}>
      <At x={32} y={7} w={50}>
        <Bubble who="you">Plan a birthday party for Mia. 🎂</Bubble>
      </At>
      <At x={32} y={15.500} hide={s.i < 1}>
        <span className="k-small">Ray's plan</span>
      </At>
      {PLAN.map((text, i) => {
        const st = stateOf(i);
        const swapped = i === 1 && s.i >= 4;
        return (
          <At key={i} x={32} y={22 + i * 7.400} w={48} hide={s.i < 1} delay={s.i === 1 ? i * 140 : 0}>
            <div className={`pl-row is-${st}`}>
              <b>{st === 'done' ? '✓' : st === 'bad' ? '✕' : i + 1}</b>
              <span key={swapped ? 'new' : 'old'} className={swapped ? 'k-pop' : ''}>
                {swapped ? 'Book the play hall instead' : text}
              </span>
              {swapped && <em>new</em>}
            </div>
          </At>
        );
      })}
      <At x={82} y={34}>
        <MiniRay mood={s.i === 3 ? 'wow' : s.i === 4 ? 'happy' : s.i === 0 ? 'think' : 'happy'} size={5.400} />
      </At>
      <At x={82} y={16} hide={s.i !== 3}>
        <Tag tone="bad">🚧 The park is closed!</Tag>
      </At>
      <At x={82} y={16} hide={s.i !== 4}>
        <Pic size={2.600}>🎉</Pic>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Low-code: build with blocks. Pick a block for each slot, press run.
// ─────────────────────────────────────────────────────────────────────────────

type Slot = 'when' | 'do' | 'tell';
const BLOCKS: Record<Slot, Array<{ id: string; icon: string; name: string }>> = {
  when: [
    { id: 'morning', icon: '⏰', name: 'Every morning' },
    { id: 'message', icon: '💬', name: 'When I ask' },
  ],
  do: [
    { id: 'news', icon: '🔎', name: 'Search the news' },
    { id: 'weather', icon: '🌦️', name: 'Check the weather' },
  ],
  tell: [
    { id: 'email', icon: '📨', name: 'Email me' },
    { id: 'text', icon: '📱', name: 'Text me' },
  ],
};
const COLS: Array<{ slot: Slot | 'think'; x: number; title: string }> = [
  { slot: 'when', x: 13, title: 'When?' },
  { slot: 'think', x: 38, title: 'Think' },
  { slot: 'do', x: 63, title: 'Do' },
  { slot: 'tell', x: 87, title: 'Tell' },
];

function Blocks() {
  const [pick, setPick] = useState<Record<Slot, string>>({ when: 'morning', do: 'news', tell: 'email' });
  const [pos, setPos] = useState(-1);
  const { run, stop, busy } = useRunner();
  const done = pos >= COLS.length;

  const choose = (slot: Slot, id: string) => {
    stop();
    setPos(-1);
    setPick((p) => ({ ...p, [slot]: id }));
  };
  const go = () =>
    run(async (sleep) => {
      for (let i = 0; i <= COLS.length; i++) {
        setPos(i);
        await sleep(i < COLS.length ? 850 : 0);
      }
    });

  const result =
    (pick.tell === 'email' ? '📨 Email' : '📱 Text') +
    (pick.when === 'morning' ? ' · 7:00, every morning' : ' · whenever you ask');
  const body = pick.do === 'news' ? 'Top story today: the zoo has a new baby giraffe.' : 'Sunny and 22°C today. Take your sunglasses!';

  return (
    <Scene
      caption={
        done
          ? 'It works. You just built an agent, and you did not write one line of code.'
          : busy
            ? 'Your message moves from block to block…'
            : 'Pick a block in each column, like snapping bricks together. Then press run.'
      }
      tone={done ? 'ok' : undefined}
      step={pos >= 0 ? Math.min(pos + 1, COLS.length) : undefined}
      controls={
        <Btn onClick={go} disabled={busy} pulse={pos < 0}>
          {done ? '↺ Run again' : '▶ Run my agent'}
        </Btn>
      }
    >
      <Draw>
        {[0, 1, 2].map((i) => (
          <Arrow key={i} from={[COLS[i].x + 10.500, 26]} to={[COLS[i + 1].x - 10.500, 26]} off={pos <= i} flow={pos === i + 1 && busy} />
        ))}
      </Draw>
      {COLS.map((c, ci) => (
        <At key={c.slot} x={c.x} y={7}>
          <span className={`k-small bk-title${pos === ci ? ' is-on' : ''}`}>
            <StepTag n={ci + 1} now={pos === ci} /> {c.title}
          </span>
        </At>
      ))}
      {COLS.map((c, ci) =>
        c.slot === 'think' ? (
          <At key="think" x={c.x} y={26} w={19}>
            <div className={`bk-block is-on is-fixed${pos === ci ? ' is-live' : ''}`}>
              <Pic size={1.700}>🧠</Pic>
              <b>A brain</b>
            </div>
          </At>
        ) : (
          BLOCKS[c.slot].map((b, bi) => {
            const on = pick[c.slot as Slot] === b.id;
            return (
              <At key={b.id} x={c.x} y={19 + bi * 14} w={19}>
                <button className={`bk-block${on ? ' is-on' : ''}${on && pos === ci ? ' is-live' : ''}`} onClick={() => choose(c.slot as Slot, b.id)} aria-pressed={on}>
                  <Pic size={1.700}>{b.icon}</Pic>
                  <b>{b.name}</b>
                </button>
              </At>
            );
          })
        ),
      )}
      <At x={50} y={47.500} w={62} hide={!done}>
        <Card tone="ok" key={`${pick.when}${pick.do}${pick.tell}`} className="k-pop">
          <small>{result}</small>
          {body}
        </Card>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages: you see a chat. The brain sees one long ribbon.
// ─────────────────────────────────────────────────────────────────────────────

const TURNS: Array<['system' | 'user' | 'assistant', string]> = [
  ['system', 'You are Ray. Be kind.'],
  ['user', 'What is 2 + 2?'],
  ['assistant', '4'],
  ['user', 'And plus 3?'],
  ['assistant', '7'],
];

function Ribbon() {
  const [raw, setRaw] = useState(false);
  const [turns, setTurns] = useState(1);
  const shown = TURNS.slice(0, turns === 1 ? 3 : 5);
  const words = shown.reduce((n, [, text]) => n + text.split(' ').length + 2, 0);

  return (
    <Scene
      caption={
        !raw
          ? 'This is what you see. A tidy chat with speech bubbles.'
          : turns === 1
            ? 'This is what the brain sees. One long ribbon of text, with tags that say who is speaking.'
            : 'A new turn. The brain gets the whole ribbon again, from the very start. It only ever grows.'
      }
      controls={
        <>
          <Toggle on={raw} onChange={setRaw}>
            🎗️ What the brain sees
          </Toggle>
          <Btn kind="soft" onClick={() => setTurns((t) => (t === 1 ? 2 : 1))}>
            {turns === 1 ? '＋ Next turn' : '↺ Back to one turn'}
          </Btn>
        </>
      }
    >
      {!raw ? (
        <>
          <At x={50} y={7}>
            <Tag>
              <StepTag n={1} /> 🪪 job card: {TURNS[0][1]}
            </Tag>
          </At>
          {shown.slice(1).map(([role, text], i) => (
            <At key={i} x={role === 'user' ? 57 : 43} y={17 + i * 8.600} w={40}>
              <div className={`cs-row is-${role === 'user' ? 'you' : 'ray'}`}>
                <StepTag n={i + 2} small /> {text}
              </div>
            </At>
          ))}
        </>
      ) : (
        <At x={50} y={26} w={84}>
          <div className="rb-ribbon">
            {shown.map(([role, text], i) => (
              <span key={i} className={`rb-turn is-${role}${i === shown.length - 1 ? ' is-last' : ''}`}>
                <span className="rb-head">
                  <StepTag n={i + 1} small />
                  <i>&lt;{role}&gt;</i>
                </span>
                {text}
                <i>&lt;end&gt;</i>
              </span>
            ))}
          </div>
        </At>
      )}
      <At x={50} y={51}>
        <Tag tone={turns === 2 ? 'warn' : 'info'}>{raw ? `the ribbon is ${words} words long` : `${shown.length - 1} messages`}</Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fine-tuning: carry examples every time, or send the brain back to school.
// ─────────────────────────────────────────────────────────────────────────────

type Schooling = 'none' | 'examples' | 'school';
const SCHOOLING: Record<Schooling, { chip: string; says: string; ok: boolean; pack: number; note: string; caption: string }> = {
  none: {
    chip: 'No help',
    says: 'Of course! I would love to turn on the lights for you!',
    ok: false,
    pack: 0.060,
    note: 'nothing in the backpack',
    caption: 'A friendly answer. But the house needs an exact command, and Ray does not know its shape.',
  },
  examples: {
    chip: '🖼️ Carry examples',
    says: 'lights(on)',
    ok: true,
    pack: 0.620,
    note: 'three examples, carried on every single turn',
    caption: 'With examples in the backpack, Ray gets it right. But it has to carry them every time.',
  },
  school: {
    chip: '🎓 Extra schooling',
    says: 'lights(on)',
    ok: true,
    pack: 0.060,
    note: 'learned at school, nothing to carry',
    caption: 'After extra schooling the brain just knows. The backpack is light again.',
  },
};

function School() {
  const [mode, setMode] = useState<Schooling>('none');
  const m = SCHOOLING[mode];
  return (
    <Scene
      caption={m.caption}
      tone={m.ok ? 'ok' : 'bad'}
      controls={<Choice<Schooling> label="How Ray learns the shape" value={mode} onChange={setMode} options={(Object.keys(SCHOOLING) as Schooling[]).map((id) => ({ id, label: SCHOOLING[id].chip }))} />}
    >
      <At x={30} y={7} w={40}>
        <Bubble who="you">Turn on the lights.</Bubble>
      </At>
      <At x={78} y={7}>
        <Tag>🏠 the house only understands: lights(on)</Tag>
      </At>

      <At x={17} y={21}>
        <span className="k-small">Ray's backpack</span>
      </At>
      <At x={17} y={36} w={24}>
        <div className="sc-pack">
          <i style={{ height: `${m.pack * 100}%` }} />
          {mode === 'examples' && (
            <span>
              <b>fan(on)</b>
              <b>door(open)</b>
              <b>heat(off)</b>
            </span>
          )}
        </div>
      </At>
      <At x={17} y={51}>
        <Tag tone={m.pack > 0.3 ? 'warn' : 'ok'}>{m.note}</Tag>
      </At>

      <At x={50} y={36}>
        <MiniRay mood={m.ok ? 'happy' : 'wink'} size={5.600} />
      </At>
      <At x={50} y={21.500} hide={mode !== 'school'}>
        <span className="k-pop" style={{ display: 'inline-block' }}>
          <Pic size={2.400}>🎓</Pic>
        </span>
      </At>

      <At x={80} y={30} w={34}>
        <Bubble who="ray" tone={m.ok ? 'ok' : 'bad'} key={mode}>
          <span className={m.ok ? 'k-mono' : ''}>{m.says}</span>
        </Bubble>
      </At>
      <At x={80} y={42}>
        <Tag tone={m.ok ? 'ok' : 'bad'}>{m.ok ? '💡 the lights go on' : '🏠 the house does not understand'}</Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reflection: read your own answer again before you hand it in.
// ─────────────────────────────────────────────────────────────────────────────

function Reflect() {
  const [on, setOn] = useState(true);
  const [phase, setPhase] = useState(0); // 0 waiting · 1 first try · 2 checking · 3 answer
  const { run, stop, busy } = useRunner();

  const ask = () =>
    run(async (sleep) => {
      setPhase(1);
      await sleep(1500);
      if (on) {
        setPhase(2);
        await sleep(2000);
      }
      setPhase(3);
    });
  const flip = (v: boolean) => {
    stop();
    setOn(v);
    setPhase(0);
  };
  const done = phase === 3;

  return (
    <Scene
      caption={
        done
          ? on
            ? 'Ray read its own work again, found the mistake, and fixed it before you ever saw it.'
            : 'Ray handed in its first try. Nobody checked it, and it is wrong.'
          : phase === 2
            ? 'Now Ray reads its own answer again, like a strict teacher…'
            : phase === 1
              ? 'A first try. Quick, but is it right?'
              : 'Ray can check its own work before it answers. Ask, and watch.'
      }
      tone={done ? (on ? 'ok' : 'bad') : undefined}
      step={phase === 0 ? undefined : done ? (on ? 4 : 2) : phase}
      controls={
        <>
          <Toggle on={on} onChange={flip}>
            🪞 Check own work
          </Toggle>
          <Btn onClick={ask} disabled={busy} pulse={phase === 0}>
            {done ? '↺ Ask again' : '▶ Ask Ray'}
          </Btn>
        </>
      }
    >
      <At x={40} y={7} w={68}>
        <Bubble who="you">Two tickets cost $30 each. A snack costs $5. How much is that?</Bubble>
      </At>
      <At x={14} y={36}>
        <MiniRay mood={phase === 2 ? 'think' : done ? (on ? 'happy' : 'oops') : 'happy'} size={5.200} />
      </At>

      <At x={42} y={22} w={34} hide={phase < 1}>
        <Card tone={phase >= 2 && on ? 'bad' : undefined}>
          <StepTag n={1} corner now={phase === 1} />
          <small>first try</small>
          <span className="k-mono">$30 + $5 = $35</span>
        </Card>
      </At>
      <At x={42} y={34} w={34} hide={!(on && phase >= 2)}>
        <Card tone="warn">
          <StepTag n={2} corner now={phase === 2} />
          <small>🪞 Ray checks</small>
          Wait. TWO tickets. That is 30 twice.
        </Card>
      </At>
      <At x={42} y={46} w={34} hide={!(on && done)}>
        <Card tone="ok">
          <StepTag n={3} corner />
          <small>second try</small>
          <span className="k-mono">$30 + $30 + $5 = $65</span>
        </Card>
      </At>

      <At x={82} y={28} w={24} hide={!done}>
        <Bubble who="ray" tone={on ? 'ok' : 'bad'} key={`${on}`}>
          <StepTag n={on ? 4 : 2} corner now />
          <b style={{ fontSize: '1.5em' }}>{on ? '$65 ✓' : '$35 ✕'}</b>
        </Bubble>
      </At>
      <At x={82} y={43} hide={!done}>
        <Tag tone={on ? 'warn' : 'ok'}>{on ? 'two brain calls' : 'one brain call'}</Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Code agents: one order slip at a time, or one little program that does it all.
// ─────────────────────────────────────────────────────────────────────────────

const FRUIT: Array<[string, string, number]> = [
  ['🍎', 'apple', 2],
  ['🍌', 'banana', 1],
  ['🍒', 'cherry', 3],
];

function CodeActions() {
  const [mode, setMode] = useState<'slips' | 'program'>('slips');
  const [n, setN] = useState(0); // slips: 0..4 · program: 0..2
  const { run, stop, busy } = useRunner();
  const last = mode === 'slips' ? 4 : 2;
  const done = n >= last;

  const go = () =>
    run(async (sleep) => {
      setN(0);
      for (let i = 1; i <= last; i++) {
        await sleep(mode === 'slips' ? 1000 : 1400);
        setN(i);
      }
    });
  const pick = (m: 'slips' | 'program') => {
    stop();
    setMode(m);
    setN(0);
  };
  const calls = mode === 'slips' ? Math.min(n + (busy || n > 0 ? 1 : 0), 4) : Math.min(n + (busy || n > 0 ? 1 : 0), 2);

  return (
    <Scene
      caption={
        done
          ? mode === 'slips'
            ? 'Three slips, three waits, and then the brain adds them up. Four brain calls for one small sum.'
            : 'One little program did the looking up and the adding. Two brain calls, and the same answer.'
          : busy
            ? mode === 'slips'
              ? 'One slip. Wait for the answer. Then the next slip…'
              : 'Ray writes a tiny program. It runs once, in a safe box.'
            : 'Same job, two ways. Run it with slips, then run it as a program.'
      }
      tone={done ? (mode === 'program' ? 'ok' : 'warn') : undefined}
      step={busy || done ? Math.min(n + 1, last) : undefined}
      controls={
        <>
          <Choice<'slips' | 'program'>
            label="How Ray acts"
            value={mode}
            onChange={pick}
            options={[
              { id: 'slips', label: '🧾 One slip at a time' },
              { id: 'program', label: '🧑‍💻 One little program' },
            ]}
          />
          <Btn onClick={go} disabled={busy} pulse={n === 0}>
            {done ? '↺ Run again' : '▶ Run'}
          </Btn>
        </>
      }
    >
      <At x={40} y={7} w={66}>
        <Bubble who="you">What do an apple, a banana and a cherry cost together?</Bubble>
      </At>
      <At x={12} y={33}>
        <MiniRay mood={done ? 'happy' : busy ? 'think' : 'happy'} size={5} />
      </At>

      {mode === 'slips' ? (
        FRUIT.map(([icon, name, price], i) => (
          <At key={name} x={47} y={20 + i * 8.400} w={38} hide={n <= i && !(busy && n === i)}>
            <div className={`ca-slip${n > i ? ' is-back' : ''}`}>
              <span>
                <StepTag n={i + 1} now={n === i} /> price({name})
              </span>
              <b>{n > i ? `${icon} ${price}` : '…'}</b>
            </div>
          </At>
        ))
      ) : (
        <At x={47} y={28} w={40} hide={n < 1 && !busy}>
          <Card className="ca-code" tone={n >= 1 ? 'ok' : undefined}>
            <StepTag n={1} corner now={n < 1} />
            <small>Ray's little program</small>
            <pre>{'total = 0\nfor fruit in [apple, banana, cherry]:\n    total += price(fruit)'}</pre>
            {n >= 1 && <b className="k-pop">→ total = 6</b>}
          </Card>
        </At>
      )}

      <At x={86} y={29} w={22}>
        <Card className="k-center">
          <span className="k-title">Price list</span>
          <small>a tool</small>
          <span className="ca-prices">
            {FRUIT.map(([icon, , price]) => (
              <b key={icon}>
                {icon} {price}
              </b>
            ))}
          </span>
        </Card>
      </At>

      <At x={34} y={49.500} w={40} hide={!done}>
        <Bubble who="ray" tone="ok" key={mode}>
          <StepTag n={mode === 'slips' ? 4 : 2} corner now />
          Together they cost 6 coins.
        </Bubble>
      </At>
      <At x={78} y={49.500}>
        <Tag tone={mode === 'slips' && calls > 2 ? 'warn' : 'ok'}>brain calls: {calls}</Tag>
      </At>
    </Scene>
  );
}

register({
  kinds: () => <Cases cases={KINDS} ask="Take me to Grandma's house." />,
  'bad-pack': () => <Cases cases={BAD_PACK} />,
  threats: () => <Cases cases={THREATS} cure="The shield" />,
  doctor: () => <Cases cases={TROUBLES} />,
  plan: Plan,
  blocks: Blocks,
  ribbon: Ribbon,
  school: School,
  reflect: Reflect,
  'code-actions': CodeActions,
});
