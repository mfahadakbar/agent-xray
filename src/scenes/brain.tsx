import { useMemo, useState, type CSSProperties } from 'react';
import { useRunner } from '../lib/hooks';
import { At, Btn, Bubble, Card, Choice, MiniRay, Pic, Scene, Slider, StepTag, Tag, Toggle, Typed, type Mood, usePortrait } from './kit';
import { register, type SceneProps } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Brain: the guessing machine. It guesses the next word, again and again.
// ─────────────────────────────────────────────────────────────────────────────

const GUESSES: Array<Array<[string, number]>> = [
  [['mat', 0.58], ['sofa', 0.24], ['roof', 0.12], ['moon', 0.06]],
  [['and', 0.95], ['then', 0.04], ['but', 0.01]],
  [['purred', 0.52], ['slept', 0.28], ['yawned', 0.14], ['sang', 0.06]],
  [['all', 0.94], ['every', 0.04], ['last', 0.02]],
  [['day', 0.55], ['night', 0.27], ['afternoon', 0.13], ['winter', 0.05]],
];
const OPENING = ['The', 'cat', 'sat', 'on', 'the'];

/** The "silly dial" is temperature: low keeps the favourite, high gives the long shots a chance. */
function reshape(probs: number[], dial: number): number[] {
  const t = 0.12 + dial * 0.26;
  const raised = probs.map((p) => Math.pow(p, 1 / t));
  const sum = raised.reduce((a, b) => a + b, 0);
  return raised.map((p) => p / sum);
}

function NextWord() {
  const [words, setWords] = useState<string[]>([]);
  const [dial, setDial] = useState(2);
  const [picked, setPicked] = useState<number | null>(null);
  const { run, busy } = useRunner();
  const step = words.length;
  const done = step >= GUESSES.length;
  const options = done ? [] : GUESSES[step];
  const probs = useMemo(() => (done ? [] : reshape(options.map((o) => o[1]), dial)), [done, options, dial]);

  const guess = () =>
    run(async (sleep) => {
      let r = Math.random();
      let i = 0;
      for (; i < probs.length - 1; i++) {
        r -= probs[i];
        if (r <= 0) break;
      }
      setPicked(i);
      await sleep(750);
      setWords((w) => [...w, options[i][0]]);
      setPicked(null);
    });

  const last = words[words.length - 1];
  const caption = done
    ? 'That is all the brain does. It guesses the next word, again and again.'
    : step === 0
      ? "Ray's brain is a guessing machine. Which word comes next? The longest bar is its best guess."
      : `It picked “${last}”. Now it guesses the next word.`;

  return (
    <Scene
      caption={caption}
      tone={done ? 'ok' : undefined}
      step={step || undefined}
      controls={
        <>
          <Slider label="Silly dial" min={0} max={10} value={dial} onChange={setDial} show={dial === 0 ? '🧐' : dial < 5 ? '🙂' : dial < 8 ? '😜' : '🤪'} />
          {done ? (
            <Btn onClick={() => setWords([])}>↺ New sentence</Btn>
          ) : (
            <Btn onClick={guess} disabled={busy} pulse={step === 0}>
              🎲 Guess the next word
            </Btn>
          )}
        </>
      }
    >
      <At x={50} y={9.500} w={92} p={{ y: 13, w: 94 }}>
        <div className="nw-sentence">
          {OPENING.map((w) => (
            <span key={w + 'o'} className="nw-word is-given">
              {w}
            </span>
          ))}
          {words.map((w, i) => (
            <span key={i} className="nw-word is-new k-pop">
              <StepTag n={i + 1} small now={i === words.length - 1 && !done} />
              {w}
              {done && i === words.length - 1 ? '.' : ''}
            </span>
          ))}
          {!done && <span className="nw-slot">?</span>}
        </div>
      </At>

      <At x={12} y={36} p={{ x: 50, y: 112 }}>
        <MiniRay mood={done ? 'happy' : picked !== null ? 'wow' : 'think'} size={5.600} />
      </At>

      {options.map(([word], i) => (
        <At key={`${step}-${word}`} x={59} y={23 + i * 7.800} w={72} p={{ x: 50, y: 38 + i * 14, w: 92 }}>
          <div className={`nw-row${picked === i ? ' is-picked' : ''}${picked !== null && picked !== i ? ' is-dim' : ''}`}>
            <span className="nw-cand">{word}</span>
            <span className="nw-track">
              <i style={{ width: `${Math.max(1.5, probs[i] * 100)}%` }} />
            </span>
            <span className="nw-pct">{Math.round(probs[i] * 100)}%</span>
          </div>
        </At>
      ))}

      <At x={59} y={34} hide={!done} p={{ x: 50, y: 62, w: 86 }}>
        <Card tone="ok">
          <span className="k-title">A whole sentence, one guess at a time. 🎉</span>
        </Card>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Which brain? Match the brain to the job.
// ─────────────────────────────────────────────────────────────────────────────

type BrainId = 'big' | 'small' | 'home';
type JobId = 'hello' | 'page' | 'puzzle' | 'secret';
type Verdict = 'right' | 'much' | 'weak' | 'leak';

const BRAINS: Array<{ id: BrainId; icon: string; name: string; lives: string; smart: number; fast: number; cheap: number }> = [
  { id: 'big', icon: '🐘', name: 'Big brain', lives: '☁️ lives in the cloud', smart: 5, fast: 2, cheap: 1 },
  { id: 'small', icon: '🐇', name: 'Small brain', lives: '☁️ lives in the cloud', smart: 3, fast: 5, cheap: 5 },
  { id: 'home', icon: '🏠', name: 'Home brain', lives: '💻 lives on your computer', smart: 3, fast: 3, cheap: 4 },
];

const JOBS: Array<{ id: JobId; label: string; result: Record<BrainId, [Verdict, string]>; caption: string }> = [
  {
    id: 'hello',
    label: '👋 Say hello',
    result: {
      big: ['much', 'Works. But slow and costly for a hello.'],
      small: ['right', 'Quick and cheap. Perfect.'],
      home: ['right', 'Works fine, and costs nothing.'],
    },
    caption: 'An easy job. The small brain is plenty. The big brain would be a waste.',
  },
  {
    id: 'page',
    label: '📄 Sum up a page',
    result: {
      big: ['much', 'A lovely summary. A pricey one too.'],
      small: ['right', 'Good summary, in a blink.'],
      home: ['right', 'Good summary. A little slower.'],
    },
    caption: 'Everyday jobs like this are what small, fast brains are for.',
  },
  {
    id: 'puzzle',
    label: '🧩 Solve a hard puzzle',
    result: {
      big: ['right', 'Takes its time. Gets it right.'],
      small: ['weak', 'Fast… and wrong.'],
      home: ['weak', 'Tries hard. Gets stuck.'],
    },
    caption: 'A hard job needs the big brain. The others are fast, but they get it wrong.',
  },
  {
    id: 'secret',
    label: '🤫 Read a secret diary',
    result: {
      big: ['leak', 'Works. But your secret travels to the cloud.'],
      small: ['leak', 'Works. But your secret travels to the cloud.'],
      home: ['right', 'Nothing ever leaves your computer.'],
    },
    caption: 'For private things, a brain at home keeps the secret at home.',
  },
];

const VERDICT: Record<Verdict, { label: string; tone: 'ok' | 'warn' | 'bad' }> = {
  right: { label: '✓ Just right', tone: 'ok' },
  much: { label: 'Too much brain', tone: 'warn' },
  weak: { label: '✕ Not enough brain', tone: 'bad' },
  leak: { label: '⚠ Not private', tone: 'warn' },
};

function Meter({ label, n }: { label: string; n: number }) {
  return (
    <div className="pb-meter">
      <span>{label}</span>
      <span className="pb-dots">
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= n ? 'is-on' : ''} />
        ))}
      </span>
    </div>
  );
}

function PickBrain({ variant }: SceneProps) {
  const [job, setJob] = useState<JobId>(variant === 'open' ? 'secret' : variant === 'hosted' ? 'puzzle' : 'hello');
  const j = JOBS.find((x) => x.id === job)!;
  return (
    <Scene caption={j.caption} controls={<Choice<JobId> label="Pick a job" value={job} onChange={setJob} options={JOBS.map((x) => ({ id: x.id, label: x.label }))} />}>
      <At x={50} y={5.500} p={{ y: 6 }}>
        <span className="k-label">Pick a job below. Which brain fits?</span>
      </At>
      {BRAINS.map((b, i) => {
        const [v, why] = j.result[b.id];
        const best = v === 'right';
        return (
          <At key={b.id} x={19 + i * 31} y={31} w={28} p={{ x: 50, y: 30 + i * 39, w: 94 }}>
            <Card tone={VERDICT[v].tone} className={`pb-card${best ? ' is-best' : ''}`}>
              <div className="k-center">
                <Pic size={2.600}>{b.icon}</Pic>
                <span className="k-title">{b.name}</span>
                <span className="k-small">{b.lives}</span>
              </div>
              <div className="pb-meters">
                <Meter label="Smart" n={b.smart} />
                <Meter label="Fast" n={b.fast} />
                <Meter label="Cheap" n={b.cheap} />
              </div>
              <div key={job} className="pb-verdict k-pop">
                <Tag tone={VERDICT[v].tone}>{VERDICT[v].label}</Tag>
                <p>{why}</p>
              </div>
            </Card>
          </At>
        );
      })}
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Instructions: the job card. Same brain, different card, different Ray.
// ─────────────────────────────────────────────────────────────────────────────

type CardId = 'none' | 'teacher' | 'pirate' | 'short';

const JOB_CARDS: Array<{ id: Exclude<CardId, 'none'>; icon: string; name: string; rule: string; answer: string; mood: Mood }> = [
  {
    id: 'teacher',
    icon: '👩‍🏫',
    name: 'Kind teacher',
    rule: '“Be gentle. Explain in small steps.”',
    answer: 'Great question! First, a tiny pea of toothpaste. Then little circles on every tooth. You can do it! 🌟',
    mood: 'happy',
  },
  {
    id: 'pirate',
    icon: '🏴‍☠️',
    name: 'Pirate',
    rule: '“Talk like a pirate. Always.”',
    answer: "Arr, matey! Scrub yer chompers up and down, or they'll rot like an old plank!",
    mood: 'wink',
  },
  {
    id: 'short',
    icon: '⚡',
    name: 'Speedy',
    rule: '“Answer in six words or fewer.”',
    answer: 'Two minutes. Twice a day.',
    mood: 'think',
  },
];
const NO_CARD = 'To brush your teeth, put toothpaste on a brush and clean every tooth for two minutes.';

function JobCard() {
  const [card, setCard] = useState<CardId>('none');
  const chosen = JOB_CARDS.find((c) => c.id === card);
  const caption = chosen
    ? `Same brain, same question. But with the “${chosen.name}” card, Ray answers in a new way.`
    : 'Hand Ray a job card. It tells Ray who to be and how to talk.';
  return (
    <Scene
      caption={caption}
      controls={
        <Btn kind="soft" onClick={() => setCard('none')} disabled={card === 'none'}>
          Take the card away
        </Btn>
      }
    >
      <At x={50} y={7} w={46} p={{ w: 78 }}>
        <Bubble who="you">How do I brush my teeth?</Bubble>
      </At>

      <At x={46} y={34} p={{ x: 74, y: 68 }}>
        <MiniRay mood={chosen?.mood ?? 'happy'} size={6.400} />
      </At>
      <At x={46} y={19.500} hide={!!chosen} p={{ x: 74, y: 36 }}>
        <Card soft>
          <span className="k-label">job card goes here</span>
        </Card>
      </At>

      {JOB_CARDS.map((c, i) => {
        const on = card === c.id;
        return (
          <At key={c.id} x={on ? 46 : 14.500} y={on ? 19.500 : 16 + i * 13.500} w={24} z={on ? 3 : 1} p={{ x: on ? 74 : 25, y: on ? 36 : 31 + i * 23, w: 44 }}>
            <button className={`jc-card${on ? ' is-on' : ''}`} onClick={() => setCard(on ? 'none' : c.id)} aria-pressed={on}>
              <span className="jc-top">
                <Pic size={1.500}>{c.icon}</Pic>
                <b>{c.name}</b>
              </span>
              <i>{c.rule}</i>
            </button>
          </At>
        );
      })}

      <At x={79} y={34} w={34} p={{ x: 50, y: 113, w: 92 }}>
        <Bubble who="ray" key={card}>
          <Typed text={chosen ? chosen.answer : NO_CARD} />
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Context: pack the backpack. Too little and Ray does not know enough.
// Too much and things fall out.
// ─────────────────────────────────────────────────────────────────────────────

type ItemId = 'job' | 'chat' | 'notes' | 'weather' | 'cookbook' | 'tools';

const ITEMS: Array<{ id: ItemId; icon: string; name: string; size: number; small: number; color: string; holds?: string }> = [
  { id: 'job', icon: '🪪', name: 'Job card', size: 1, small: 1, color: '#ff8fd0' },
  { id: 'chat', icon: '💬', name: 'The chat so far', size: 2, small: 1, color: '#5aa9ff', holds: '“Mia’s party is at the pool.”' },
  { id: 'notes', icon: '📝', name: 'Notes about you', size: 1, small: 1, color: '#c08cff', holds: '“Gets cold easily.”' },
  { id: 'weather', icon: '🌦️', name: "Tomorrow's weather", size: 1, small: 1, color: '#ffd75e', holds: '“31°C and sunny.”' },
  { id: 'cookbook', icon: '📚', name: 'A whole cookbook', size: 4, small: 1, color: '#ff9f5a' },
  { id: 'tools', icon: '🧰', name: 'A list of 40 tools', size: 3, small: 1, color: '#5fe3a1' },
];
const ROOM = 8;
const UNIT = 4.600; // stage units of height per size unit

function Backpack({ variant }: SceneProps) {
  // On a phone the backpack is taller and stands on the left, with the things to pack in two columns above it.
  const tall = usePortrait();
  const [inPack, setInPack] = useState<Set<ItemId>>(() => new Set(variant === 'window' ? ['job', 'chat', 'notes', 'weather', 'cookbook', 'tools'] : variant === 'squish' ? ['job', 'chat', 'weather', 'cookbook', 'tools'] : ['job', 'chat']));
  const [squish, setSquish] = useState(false);

  const toggle = (id: ItemId) =>
    setInPack((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Oldest things sit at the bottom of the list here; when the pack overflows they are the first to fall out.
  const packed = ITEMS.filter((i) => inPack.has(i.id));
  const sizeOf = (i: (typeof ITEMS)[number]) => (squish ? i.small : i.size);
  const total = packed.reduce((a, i) => a + sizeOf(i), 0);
  const fell: ItemId[] = [];
  let over = total - ROOM;
  for (const id of ['chat', 'notes', 'job'] as ItemId[]) {
    if (over <= 0) break;
    const item = packed.find((p) => p.id === id);
    if (item) {
      fell.push(id);
      over -= sizeOf(item);
    }
  }
  const sees = (id: ItemId) => inPack.has(id) && !fell.includes(id);
  const junk = !squish && (sees('cookbook') || sees('tools'));

  let answer: string;
  let tone: 'ok' | 'warn' | 'bad';
  let mood: Mood;
  if (sees('chat') && sees('weather')) {
    answer = `A pool party, and 31°C! Wear your swimsuit, a hat and sandals.${sees('notes') ? ' And pack a towel, since you get cold.' : ''}${junk ? ' Also… would you like a pancake recipe?' : ''} `;
    tone = junk ? 'warn' : 'ok';
    mood = junk ? 'oops' : 'happy';
  } else if (sees('chat')) {
    answer = "It's a pool party, so take a swimsuit. I don't know the weather, though.";
    tone = 'warn';
    mood = 'think';
  } else if (sees('weather')) {
    answer = 'It will be hot, so wear something light. What kind of party is it?';
    tone = 'warn';
    mood = 'think';
  } else {
    answer = "Um… a nice shirt? I don't know anything about this party.";
    tone = 'bad';
    mood = 'sad';
  }

  const caption = fell.length
    ? 'Too full! The backpack only holds so much, so the oldest things fell out. And Ray needed those.'
    : squish && total <= ROOM && packed.length >= 5
      ? 'Squished! The big things became small notes. Now everything fits.'
      : tone === 'ok'
        ? 'Just the right things, and nothing extra. That is a well-packed backpack.'
        : junk
          ? 'Ray has what it needs, but it is lost in a pile of things it does not need.'
          : 'The brain only knows what is in the backpack. What is missing?';

  // Stack blocks from the bottom of the pack.
  let cursor = 0;
  const FLOOR = tall ? 118 : 51;
  const U = tall ? 7.2 : UNIT;
  const packX = tall ? 28 : 47.500;
  const blocks = packed.map((i) => {
    const h = sizeOf(i) * U;
    const out = fell.includes(i.id);
    const y = FLOOR - cursor - h / 2;
    if (!out) cursor += h;
    return { item: i, h, y, out };
  });

  return (
    <Scene
      caption={caption}
      tone={fell.length ? 'bad' : tone === 'ok' ? 'ok' : undefined}
      controls={
        <Toggle on={squish} onChange={setSquish}>
          🗜️ Squish big things
        </Toggle>
      }
    >
      <At x={50} y={5.500} w={62} p={{ y: 7, w: 92 }}>
        <Bubble who="you">What should I wear to Mia's party tomorrow?</Bubble>
      </At>

      {ITEMS.map((item, i) => {
        const on = inPack.has(item.id);
        return (
          <At key={item.id} x={15} y={15.500 + i * 6.600} w={27} p={{ x: i % 2 ? 74.500 : 25.500, y: 21 + Math.floor(i / 2) * 9.800, w: 47 }}>
            <button className={`bp-item${on ? ' is-on' : ''}`} style={{ '--c': item.color } as CSSProperties} onClick={() => toggle(item.id)} aria-pressed={on}>
              <span>{item.icon}</span>
              <b>{item.name}</b>
              <i>{on ? '✓' : '+'}</i>
            </button>
          </At>
        );
      })}

      {/* the backpack: what the brain sees */}
      <At x={packX} y={FLOOR - (ROOM * U) / 2} w={25} z={0} p={{ y: FLOOR - (ROOM * U) / 2, w: 48 }}>
        <div className={`bp-pack${fell.length ? ' is-over' : ''}`} style={{ height: `${ROOM * U}cqw` }}>
          <span className="bp-pack-label">what the brain sees</span>
        </div>
      </At>
      {blocks.map(({ item, h, y, out }) => (
        <At
          key={item.id}
          x={out ? 64 + fell.indexOf(item.id) * 1.500 : 47.500}
          y={out ? 49.500 - fell.indexOf(item.id) * 3.600 : y}
          w={23}
          z={2}
          p={{ x: out ? 76 + fell.indexOf(item.id) * 1.500 : packX, y: out ? 122 - fell.indexOf(item.id) * 8 : y, w: out ? 40 : 45 }}
          style={{ rotate: out ? `${10 + fell.indexOf(item.id) * 5}deg` : '0deg' }}
        >
          <div className={`bp-block${out ? ' is-out' : ''}`} style={{ '--c': item.color, height: `${h - 0.5}cqw` } as CSSProperties}>
            <span>
              {item.icon} {item.name}
            </span>
            {item.holds && h > 4 && <em>{item.holds}</em>}
          </div>
        </At>
      ))}
      <At x={47.500} y={53.200} p={{ x: packX, y: 124.500 }}>
        <Tag tone={fell.length ? 'bad' : total > ROOM - 2 ? 'warn' : 'ok'}>
          {Math.min(total, 99)} of {ROOM} full
        </Tag>
      </At>

      <At x={81} y={43} p={{ x: 80, y: 96 }}>
        <MiniRay mood={mood} size={4.600} />
      </At>
      <At x={81} y={24} w={32} p={{ x: 76, y: 69, w: 44 }}>
        <Bubble who="ray" tone={tone === 'ok' ? 'ok' : tone} key={answer}>
          <Typed text={answer.trim()} />
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reasoning: think first, answer second.
// ─────────────────────────────────────────────────────────────────────────────

function ThinkFirst() {
  const [mode, setMode] = useState<'idle' | 'fast' | 'think'>('idle');
  const [n, setN] = useState(0); // how many thinking steps are showing
  const { run, busy } = useRunner();

  const fast = () =>
    run(async (sleep) => {
      setN(0);
      setMode('fast');
      await sleep(300);
    });
  const think = () =>
    run(async (sleep) => {
      setMode('think');
      setN(0);
      for (let i = 1; i <= 4; i++) {
        await sleep(1300);
        setN(i);
      }
    });

  const thinking = mode === 'think';
  const doneThinking = thinking && n >= 4;
  const caption =
    mode === 'fast'
      ? 'Too fast! Ray blurted out a guess, and it is wrong.'
      : doneThinking
        ? 'Slower, but right. On hard questions, thinking step by step makes Ray better.'
        : thinking
          ? 'Ray is thinking. One small step at a time…'
          : 'A tricky question. Should Ray answer fast, or think first?';

  const eaten = thinking && n >= 3;
  const STEPS = ['3 baskets, 4 apples in each.', '3 × 4 = 12 apples.', 'Ray eats 2. 12 − 2 = 10.'];

  return (
    <Scene
      caption={caption}
      tone={mode === 'fast' ? 'bad' : doneThinking ? 'ok' : undefined}
      step={thinking && n > 0 ? n : undefined}
      controls={
        <>
          <Btn kind="soft" onClick={fast} disabled={busy}>
            🏃 Answer fast
          </Btn>
          <Btn onClick={think} disabled={busy} pulse={mode === 'idle'}>
            🤔 Think first
          </Btn>
        </>
      }
    >
      <At x={50} y={6.500} w={78} p={{ y: 8, w: 92 }}>
        <Bubble who="you">3 baskets. 4 apples in each. Ray eats 2 apples. How many are left?</Bubble>
      </At>

      {[0, 1, 2].map((b) => (
        <At key={b} x={12 + b * 13.500} y={32} p={{ x: 22 + b * 28, y: 32 }}>
          <div className={`tf-basket${thinking && n >= 1 ? ' is-counted' : ''}`}>
            <div className="tf-apples">
              {[0, 1, 2, 3].map((a) => (
                <span key={a} className={eaten && b === 2 && a < 2 ? 'is-eaten' : ''}>
                  🍎
                </span>
              ))}
            </div>
            <Pic size={2.800}>🧺</Pic>
          </div>
        </At>
      ))}
      <At x={25.500} y={46.500} hide={!(thinking && n >= 2)} p={{ x: 50, y: 46 }}>
        <Tag tone="info">{eaten ? '10 apples left' : '12 apples'}</Tag>
      </At>

      {STEPS.map((s, i) => (
        <At key={i} x={62} y={20 + i * 8.200} w={30} hide={!(thinking && n > i)} p={{ x: 36, y: 62 + i * 16, w: 64 }}>
          <Card>
            <StepTag n={i + 1} corner now={n === i + 1} />
            <small>thought {i + 1}</small>
            {s}
          </Card>
        </At>
      ))}

      <At x={88} y={41} p={{ x: 84, y: 94 }}>
        <MiniRay mood={mode === 'fast' ? 'oops' : doneThinking ? 'happy' : thinking ? 'think' : 'happy'} size={4.800} />
      </At>
      <At x={88} y={25} hide={!(mode === 'fast' || doneThinking)} w={17} p={{ x: 84, y: 70, w: 27 }}>
        <Bubble who="ray" tone={mode === 'fast' ? 'bad' : 'ok'}>
          {mode === 'think' && <StepTag n={4} corner now />}
          <b style={{ fontSize: '1.5em' }}>{mode === 'fast' ? '9! ✕' : '10 ✓'}</b>
        </Bubble>
      </At>
      <At x={62} y={49} hide={mode === 'idle'} p={{ x: 50, y: 120 }}>
        <div className="k-row">
          <Tag tone={mode === 'fast' ? 'ok' : 'warn'}>⏱ {mode === 'fast' ? 'half a second' : 'four seconds'}</Tag>
          <Tag tone={mode === 'fast' ? 'ok' : 'warn'}>{mode === 'fast' ? 'costs a little' : 'costs more'}</Tag>
        </div>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Few-shot examples: show, do not tell. Ray copies the shape of what it sees.
// ─────────────────────────────────────────────────────────────────────────────

const LOOSE = ['Bananas are yellow!', "I'd pick a strawberry. It is red.", 'Grapes. They can be purple or green.'];
const SHAPED = ['banana → yellow', 'strawberry → red', 'grape → purple'];

function ShowMe() {
  const [shown, setShown] = useState(false);
  const [n, setN] = useState(1);
  const answers = (shown ? SHAPED : LOOSE).slice(0, n);
  return (
    <Scene
      caption={
        shown
          ? n < 3
            ? 'Ray saw two examples, and copied their shape exactly. Ask again.'
            : 'Three answers, all the same shape. Showing an example beats explaining.'
          : n < 3
            ? 'No examples. Ray answers in whatever shape it likes. Ask again.'
            : 'Three answers, three different shapes. Ray could not know which one you wanted.'
      }
      tone={n >= 3 ? (shown ? 'ok' : 'warn') : undefined}
      controls={
        <>
          <Toggle
            on={shown}
            onChange={(v) => {
              setShown(v);
              setN(1);
            }}
          >
            🖼️ Show two examples first
          </Toggle>
          <Btn onClick={() => setN((v) => (v >= 3 ? 1 : v + 1))} pulse={n < 3}>
            {n >= 3 ? '↺ Start over' : '▶ Ask again'}
          </Btn>
        </>
      }
    >
      <At x={34} y={6.500} w={48} p={{ x: 50, y: 7, w: 80 }}>
        <Bubble who="you">Name a fruit and its colour.</Bubble>
      </At>

      <At x={17} y={19.500} p={{ x: 27, y: 20 }}>
        <span className="k-small">{shown ? 'your examples' : 'no examples'}</span>
      </At>
      {['apple → red', 'lime → green'].map((ex, i) => (
        <At key={ex} x={17} y={27 + i * 8} w={24} p={{ x: 27, y: 29 + i * 10, w: 42 }} style={{ opacity: shown ? 1 : 0.15 }}>
          <Card soft={!shown} className="k-mono" style={{ textAlign: 'center' }}>
            {ex}
          </Card>
        </At>
      ))}

      <At x={45} y={34} p={{ x: 75, y: 33 }}>
        <MiniRay mood={shown ? 'happy' : 'wink'} size={5.200} />
      </At>

      <At x={78} y={12} p={{ x: 50, y: 58 }}>
        <span className="k-small">what Ray says</span>
      </At>
      {answers.map((a, i) => (
        <At key={`${shown}${i}`} x={78} y={21 + i * 9.500} w={38} p={{ x: 50, y: 70 + i * 17, w: 86 }}>
          <Bubble who="ray" tone={shown ? 'ok' : 'warn'}>
            <StepTag n={i + 1} corner now={i === answers.length - 1} />
            <span className={shown ? 'k-mono' : ''}>{a}</span>
          </Bubble>
        </At>
      ))}
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gateways: the switchboard. If one brain is asleep, the next one answers.
// ─────────────────────────────────────────────────────────────────────────────

const LINE = [
  { id: 'a', icon: '🐘', name: 'First choice' },
  { id: 'b', icon: '🐇', name: 'Backup' },
  { id: 'c', icon: '🏠', name: 'Last resort' },
];

function Switchboard() {
  const [asleep, setAsleep] = useState<Record<string, boolean>>({ a: true, b: false, c: false });
  const [trying, setTrying] = useState(-1);
  const [winner, setWinner] = useState<number | null | 'none'>(null);
  const { run, stop, busy } = useRunner();

  const reset = () => {
    stop();
    setTrying(-1);
    setWinner(null);
  };
  const send = () =>
    run(async (sleep) => {
      setWinner(null);
      for (let i = 0; i < LINE.length; i++) {
        setTrying(i);
        await sleep(1100);
        if (!asleep[LINE[i].id]) {
          setWinner(i);
          return;
        }
      }
      setTrying(-1);
      setWinner('none');
    });

  const won = typeof winner === 'number' ? LINE[winner] : null;
  // How far down the line the switchboard has got.
  const reached = typeof winner === 'number' ? winner : winner === 'none' ? LINE.length - 1 : trying;
  return (
    <Scene
      caption={
        won
          ? winner === 0
            ? 'The first choice was awake, so it answered. Now put it to sleep and send again.'
            : `The ${winner === 1 ? 'first brain was' : 'first two brains were'} asleep, so the switchboard quietly moved on. You still got an answer.`
          : winner === 'none'
            ? 'Every brain is asleep. Even a switchboard cannot help with that. Wake one up.'
            : busy
              ? 'The switchboard tries each brain in order…'
              : 'Click a brain to put it to sleep or wake it up. Then send a question.'
      }
      tone={won ? 'ok' : winner === 'none' ? 'bad' : undefined}
      step={reached >= 0 ? reached + 1 : undefined}
      controls={
        <Btn onClick={send} disabled={busy} pulse={winner === null}>
          {winner === null ? '▶ Send a question' : '↺ Send again'}
        </Btn>
      }
    >
      <At x={11} y={30} p={{ x: 24, y: 15 }}>
        <MiniRay mood={winner === 'none' ? 'sad' : won ? 'happy' : 'think'} size={4.600} label="Ray, waiting for a brain" />
      </At>
      <At x={37} y={30} w={17} p={{ x: 66, y: 15, w: 42 }}>
        <Card className={`k-center${busy ? ' k-glow' : ''}`}>
          <Pic size={2.400}>🔀</Pic>
          <span className="k-title">Switchboard</span>
        </Card>
      </At>
      {LINE.map((b, i) => {
        const off = asleep[b.id];
        return (
          <At key={b.id} x={78} y={12.500 + i * 16.500} w={30} p={{ x: 50, y: 46 + i * 25, w: 80 }}>
            <button
              className={`sb-brain${off ? ' is-asleep' : ''}${trying === i && busy ? ' is-trying' : ''}${winner === i ? ' is-won' : ''}`}
              onClick={() => {
                reset();
                setAsleep((a) => ({ ...a, [b.id]: !a[b.id] }));
              }}
              aria-pressed={!off}
            >
              {i <= reached && <StepTag n={i + 1} corner now={i === reached} />}
              <Pic size={2}>{off ? '😴' : b.icon}</Pic>
              <span>
                <b>{b.name}</b>
                <i>{off ? 'asleep · click to wake' : 'awake · click to put to sleep'}</i>
              </span>
            </button>
          </At>
        );
      })}
      <At x={37} y={46} hide={winner === null} p={{ x: 50, y: 123 }}>
        <Tag tone={won ? 'ok' : 'bad'}>{won ? `answered by: ${won.name.toLowerCase()}` : 'nobody answered'}</Tag>
      </At>
    </Scene>
  );
}

register({
  'next-word': NextWord,
  'pick-brain': PickBrain,
  'job-card': JobCard,
  backpack: Backpack,
  'think-first': ThinkFirst,
  'show-me': ShowMe,
  switchboard: Switchboard,
});
