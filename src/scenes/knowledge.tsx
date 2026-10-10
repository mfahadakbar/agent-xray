import { useState, type CSSProperties, type PointerEvent } from 'react';
import { useRunner, useSteps } from '../lib/hooks';
import { Arrow, At, Btn, Bubble, Card, Choice, Draw, MiniRay, PH, Pic, SH, Scene, Slider, StepNav, StepTag, Tag, Toggle, Typed, stepName, usePortrait, type Mood } from './kit';
import { register, type SceneProps } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge: the library. Ray looks things up before it answers.
// ─────────────────────────────────────────────────────────────────────────────

const PAGES = [
  { id: 'giraffe', icon: '🦒', name: 'Giraffes' },
  { id: 'penguin', icon: '🐧', name: 'Penguins' },
  { id: 'whale', icon: '🐋', name: 'Whales' },
  { id: 'volcano', icon: '🌋', name: 'Volcanoes' },
  { id: 'train', icon: '🚂', name: 'Trains' },
  { id: 'pizza', icon: '🍕', name: 'Pizza' },
];

function Library() {
  const [on, setOn] = useState(true);
  const s = useSteps(4);
  const caption = on
    ? [
        'You ask a question. Ray’s brain is not sure of the answer.',
        'So Ray goes to its library and looks for the right page.',
        'Found it! Ray takes the page about giraffes.',
        'Ray reads the page and answers. It can even say where the answer came from.',
      ][s.i]
    : [
        'You ask a question. Ray’s brain is not sure of the answer.',
        'There is no library to check.',
        'So the brain does what it always does. It guesses.',
        'The guess sounds sure. But it is wrong. That is called making things up.',
      ][s.i];

  const slot = (i: number) => ({ x: 62 + (i % 3) * 13.500, y: 17 + Math.floor(i / 3) * 15 });
  const mood: Mood = s.i === 3 ? (on ? 'happy' : 'oops') : s.i === 0 ? 'think' : on ? 'wow' : 'think';

  return (
    <Scene
      caption={caption}
      tone={s.i === 3 ? (on ? 'ok' : 'bad') : undefined}
      step={s.i + 1}
      controls={
        <>
          <Toggle
            on={on}
            onChange={(v) => {
              setOn(v);
              s.reset();
            }}
          >
            📚 Library
          </Toggle>
          <StepNav s={s} />
        </>
      }
    >
      <Draw>
        <Arrow from={[30, 30]} to={[54, 24]} bend={-3} p={{ from: [27, 80], to: [38, 65] }} flow={on && s.i === 1} off={!(on && s.i === 1)} />
      </Draw>

      <At x={28} y={6.500} w={42} p={{ x: 50, y: 7, w: 80 }}>
        <Bubble who="you">
          <StepTag n={1} corner now={s.i === 0} />
          How tall is a giraffe?
        </Bubble>
      </At>
      <At x={20} y={31} p={{ x: 22, y: 93 }}>
        <MiniRay mood={mood} size={5.600} />
      </At>

      <At x={75.500} y={6.500} p={{ x: 50, y: 21 }}>
        <span className="k-small">
          {s.i >= 1 && <StepTag n={2} now={s.i === 1} />} {on ? "Ray's library" : 'no library'}
        </span>
      </At>
      {PAGES.map((p, i) => {
        const hit = p.id === 'giraffe';
        const taken = on && hit && s.i >= 2;
        // On the tall (phone) stage the shelf is a 3 × 2 grid above Ray.
        const at = taken
          ? { x: 38, y: 30, p: { x: 54, y: 91, w: 22 } }
          : { ...slot(i), p: { x: 24 + (i % 3) * 26, y: 35 + Math.floor(i / 3) * 21, w: 22 } };
        return (
          <At key={p.id} x={at.x} y={at.y} w={12} p={at.p} z={taken ? 4 : 1} style={{ opacity: on ? 1 : 0.14 }} slow>
            <div className={`lb-page${on && s.i === 1 ? ' is-scanned' : ''}${taken ? ' is-hit' : ''}`} style={{ '--i': i } as CSSProperties}>
              {taken && <StepTag n={3} corner now={s.i === 2} />}
              <Pic size={1.900}>{p.icon}</Pic>
              <span>{p.name}</span>
            </div>
          </At>
        );
      })}

      <At x={36} y={48} w={56} p={{ x: 50, y: 119, w: 90 }} hide={s.i < 3}>
        <Bubble who="ray" tone={on ? 'ok' : 'bad'} key={`${on}`}>
          <StepTag n={4} corner now />
          {on ? (
            <>
              About 5 metres tall! <Tag tone="ok">from: Giraffes</Tag>
            </>
          ) : (
            'Um… twenty metres? I am pretty sure.'
          )}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Readers: get the words out of every file.
// ─────────────────────────────────────────────────────────────────────────────

type FileKind = 'pdf' | 'web' | 'sheet' | 'video';
const FILES: Array<{ id: FileKind; icon: string; name: string; out: string; caption: string }> = [
  { id: 'pdf', icon: '📕', name: 'A PDF book', out: 'Chapter 1\nGiraffes are the tallest\nanimals on land…', caption: 'The reader opened the PDF and pulled out the words, page by page.' },
  { id: 'web', icon: '🌐', name: 'A web page', out: '# Giraffe facts\n- Height: 5.5 m\n- Home: Africa', caption: 'The reader threw away the menus and the ads. Only the words are left.' },
  { id: 'sheet', icon: '📊', name: 'A spreadsheet', out: 'animal: giraffe\nheight_m: 5.5\nfood: leaves', caption: 'Each row of the table became a few clear lines.' },
  { id: 'video', icon: '🎬', name: 'A video', out: '[0:03] Here comes the giraffe.\n[0:09] Look how tall it is!', caption: 'The reader listened to the video and wrote down what was said.' },
];

function Readers() {
  const [kind, setKind] = useState<FileKind | null>(null);
  const [work, setWork] = useState<FileKind | null>(null);
  const { run, busy } = useRunner();
  const read = (id: FileKind) =>
    run(async (sleep) => {
      setKind(null);
      setWork(id);
      await sleep(1100);
      setWork(null);
      setKind(id);
    });
  const file = FILES.find((f) => f.id === kind);

  return (
    <Scene
      caption={file ? file.caption : busy ? 'The reader is working…' : 'Books come in many shapes. Pick one, and the reader turns it into plain words.'}
      tone={file ? 'ok' : undefined}
      step={file ? 3 : busy ? 2 : 1}
    >
      <Draw>
        <Arrow from={[27, 29]} to={[39, 29]} p={{ from: [50, 34], to: [50, 40] }} flow={busy} off={!busy} />
        <Arrow from={[55, 29]} to={[63, 29]} p={{ from: [50, 63], to: [50, 72] }} flow={busy} off={!file && !busy} />
      </Draw>
      <At x={14} y={5.500} p={{ x: 50, y: 5 }}>
        <span className="k-label">
          <StepTag n={1} now={!busy && !file} /> Pick a file
        </span>
      </At>
      {FILES.map((f, i) => (
        <At key={f.id} x={14} y={14.500 + i * 10.300} w={24} p={{ x: i % 2 ? 73.500 : 26.500, y: 15 + Math.floor(i / 2) * 11.500, w: 45 }}>
          <button className={`ee-thing${kind === f.id || work === f.id ? ' is-on' : ''}`} onClick={() => read(f.id)} disabled={busy}>
            <Pic size={1.800}>{f.icon}</Pic>
            <b>{f.name}</b>
          </button>
        </At>
      ))}

      <At x={47} y={29} w={15} p={{ x: 50, y: 51.500, w: 32 }}>
        <Card className="k-center" tone={busy ? 'info' : undefined}>
          <StepTag n={2} corner now={busy} todo={!busy && !file} />
          <span className={busy ? 'k-spin' : ''} style={{ display: 'inline-block' }}>
            <Pic size={2.600}>⚙️</Pic>
          </span>
          <span className="k-title">Reader</span>
        </Card>
      </At>

      <At x={81} y={29} w={33} p={{ x: 50, y: 94, w: 86 }}>
        <Card className="rd-out" tone={file ? 'ok' : undefined}>
          <StepTag n={3} corner now={!!file} todo={!file} />
          <small>plain words</small>
          <pre>{file ? <Typed text={file.out} cps={80} key={file.id} /> : <span className="k-muted">nothing yet</span>}</pre>
        </Card>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunking: cut big books into bite-size pieces. Where you cut matters.
// ─────────────────────────────────────────────────────────────────────────────

const LINES: Array<{ topic: 0 | 1 | 2; text: string; para?: boolean }> = [
  { topic: 0, text: '🦒 Giraffes live in Africa.', para: true },
  { topic: 0, text: '🦒 A giraffe can be 5 metres tall.' },
  { topic: 0, text: '🦒 They eat leaves from tall trees.' },
  { topic: 1, text: '🐧 Penguins live where it is cold.', para: true },
  { topic: 1, text: '🐧 They cannot fly, but they swim.' },
  { topic: 1, text: '🐧 Penguins eat fish.' },
  { topic: 2, text: '🐋 Whales are the biggest animals.' },
  { topic: 2, text: '🐋 A blue whale is 30 metres long.', para: true },
  { topic: 2, text: '🐋 Whales sing to each other.' },
];
const TOPIC_COLOR = ['#ffd75e', '#5aa9ff', '#5fe3a1'];

type Cut = 'size' | 'para' | 'meaning';

function chunksFor(cut: Cut, size: number): number[][] {
  const out: number[][] = [];
  if (cut === 'size') {
    for (let i = 0; i < LINES.length; i += size) out.push(LINES.slice(i, i + size).map((_, k) => i + k));
    return out;
  }
  LINES.forEach((l, i) => {
    const starts = cut === 'para' ? l.para : i === 0 || LINES[i - 1].topic !== l.topic;
    if (starts || !out.length) out.push([i]);
    else out[out.length - 1].push(i);
  });
  return out;
}

function Chunking() {
  const [cut, setCut] = useState<Cut>('size');
  const [size, setSize] = useState(4);
  const chunks = chunksFor(cut, size);
  // On the tall (phone) stage the nine lines take the full width, and the question goes under them.
  const tall = usePortrait();
  const rowY = (i: number) => (tall ? 8 + i * 9.300 : 6 + i * 5.300);
  const mixed = (c: number[]) => new Set(c.map((i) => LINES[i].topic)).size > 1;
  const nMixed = chunks.filter(mixed).length;
  // The bite that holds the answer to "How tall is a giraffe?" is the one with line 1.
  const answerChunk = chunks.find((c) => c.includes(1))!;
  const noise = answerChunk.filter((i) => LINES[i].topic !== 0).length;

  const caption =
    nMixed === 0
      ? 'Every bite is about one thing. When Ray grabs the giraffe bite, it gets giraffes and nothing else.'
      : cut === 'size'
        ? `Cutting every ${size} lines is easy, but ${nMixed === 1 ? 'one bite mixes' : `${nMixed} bites mix`} two animals together.`
        : 'Cutting at paragraphs is better. But this book put a whale line in the penguin paragraph.';

  return (
    <Scene
      caption={caption}
      tone={nMixed === 0 ? 'ok' : undefined}
      controls={
        <>
          <Choice<Cut>
            label="How to cut"
            value={cut}
            onChange={setCut}
            options={[
              { id: 'size', label: '📏 Same size' },
              { id: 'para', label: '📑 By paragraph' },
              { id: 'meaning', label: '🧠 By meaning' },
            ]}
          />
          {cut === 'size' && <Slider label="Bite size" min={2} max={5} value={size} onChange={setSize} show={size} />}
        </>
      }
    >
      {chunks.map((c, k) => {
        const top = rowY(c[0]);
        const bottom = rowY(c[c.length - 1]);
        const bad = mixed(c);
        return (
          <At key={`${cut}${size}${k}`} x={33} y={(top + bottom) / 2} w={58} p={{ x: 50, y: (top + bottom) / 2, w: 96 }} z={0}>
            <div className={`ck-bite${bad ? ' is-mixed' : ''}${c === answerChunk ? ' is-answer' : ''}`} style={{ height: `${bottom - top + (tall ? 8.500 : 4.900)}cqw` }}>
              <span>{bad ? '✕ mixed' : '✓ one topic'}</span>
            </div>
          </At>
        );
      })}
      {LINES.map((l, i) => (
        <At key={i} x={28} y={rowY(i)} w={44} p={{ x: 43, y: rowY(i), w: 78 }} z={1}>
          <div className="ck-line" style={{ '--c': TOPIC_COLOR[l.topic] } as CSSProperties}>
            {l.para && <i>¶</i>}
            {l.text}
          </div>
        </At>
      ))}

      <At x={81} y={8} w={32} p={{ x: 35, y: 96, w: 62 }}>
        <Bubble who="you">How tall is a giraffe?</Bubble>
      </At>
      <At x={81} y={27} w={32} p={{ x: 40, y: 116, w: 72 }}>
        <Card tone={noise ? 'warn' : 'ok'} key={`${cut}${size}`} className="k-pop">
          <small>the bite Ray grabs</small>
          {answerChunk.length} lines. {noise ? `${noise} of them ${noise === 1 ? 'is' : 'are'} about another animal.` : 'All about giraffes.'}
        </Card>
      </At>
      <At x={81} y={44} p={{ x: 88, y: 108 }}>
        <MiniRay mood={noise ? 'think' : 'happy'} size={4.400} />
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Embeddings: words become numbers, and numbers become a place on a map.
// ─────────────────────────────────────────────────────────────────────────────

const ANCHORS = [
  { word: 'cat', icon: '🐱', x: 67, y: 15 },
  { word: 'dog', icon: '🐶', x: 77, y: 12 },
  { word: 'car', icon: '🚗', x: 88, y: 38 },
  { word: 'apple', icon: '🍎', x: 66, y: 43 },
];
const NEW_WORDS = [
  { word: 'kitten', icon: '🐈', x: 71, y: 21, near: 'cat', nums: [0.91, 0.12, 0.84] },
  { word: 'puppy', icon: '🐕', x: 81, y: 18, near: 'dog', nums: [0.88, 0.15, 0.71] },
  { word: 'truck', icon: '🚚', x: 84, y: 45, near: 'car', nums: [0.07, 0.93, 0.22] },
  { word: 'banana', icon: '🍌', x: 72, y: 47, near: 'apple', nums: [0.31, 0.08, 0.05] },
];

function Embeddings() {
  const [placed, setPlaced] = useState<string[]>([]);
  const [cur, setCur] = useState<string | null>(null);
  const [stage, setStage] = useState<0 | 1 | 2>(0); // 0 idle, 1 in the machine, 2 numbers out
  const { run, busy } = useRunner();

  const embed = (word: string) =>
    run(async (sleep) => {
      setCur(word);
      setStage(1);
      await sleep(900);
      setStage(2);
      await sleep(1100);
      setPlaced((p) => (p.includes(word) ? p : [...p, word]));
      setStage(0);
    });

  const w = NEW_WORDS.find((x) => x.word === cur);
  const landed = stage === 0 && !!w && placed.includes(w.word);
  // On the tall (phone) stage the map sits under the machine. A dot keeps its place on the map.
  const tall = usePortrait();
  const onMap = (x: number, y: number) => ({ x: 6 + ((x - 58) / 39) * 88, y: 62 + ((y - 5) / 48) * 66 });
  const caption =
    stage === 1
      ? `The number machine reads “${cur}”…`
      : stage === 2
        ? `…and turns it into numbers. The numbers say where it goes on the map.`
        : w && placed.includes(w.word)
          ? `“${w.word}” landed right next to “${w.near}”. Close meaning, close numbers, close on the map.`
          : 'Pick a word. The number machine turns it into numbers.';

  return (
    <Scene caption={caption} tone={stage === 0 && w ? 'ok' : undefined} step={stage === 1 ? 2 : stage === 2 ? 3 : landed ? 4 : 1}>
      <Draw>
        <rect x={tall ? 6 : 58} y={tall ? 62 : 5} width={tall ? 88 : 39} height={tall ? 66 : 48} rx="2.500" fill="rgba(8,14,28,.55)" stroke="rgba(143,190,255,.22)" strokeWidth=".25" />
        <Arrow from={[21, 29]} to={[30, 29]} p={{ from: [50, 21.500], to: [50, 26.500] }} flow={stage === 1} off={stage !== 1} />
        <Arrow from={[45, 29]} to={[57, 29]} p={{ from: [50, 55], to: [50, 60.500] }} flow={stage === 2} off={stage !== 2} />
      </Draw>
      <At x={77.500} y={7.500} p={{ x: 50, y: 66 }}>
        <span className="k-small">
          <StepTag n={4} now={landed} todo={!landed} /> the map of meaning
        </span>
      </At>
      <At x={11} y={5.500} p={{ x: 50, y: 5 }}>
        <span className="k-label">
          <StepTag n={1} now={stage === 0 && !landed} /> Pick a word
        </span>
      </At>
      {NEW_WORDS.map((nw, i) => (
        <At key={nw.word} x={11} y={14.500 + i * 10} w={18} p={{ x: 14 + i * 24, y: 15, w: 23 }}>
          <button className={`ee-thing${placed.includes(nw.word) ? ' is-on' : ''}`} onClick={() => embed(nw.word)} disabled={busy}>
            <Pic size={1.500}>{nw.icon}</Pic>
            <b>{nw.word}</b>
          </button>
        </At>
      ))}

      <At x={37.500} y={29} w={15} p={{ x: 50, y: 36.500, w: 34 }}>
        <Card className="k-center" tone={stage ? 'info' : undefined}>
          <StepTag n={2} corner now={stage === 1} todo={stage === 0 && !landed} />
          <span className={stage === 1 ? 'k-spin' : ''} style={{ display: 'inline-block' }}>
            <Pic size={2.400}>🔢</Pic>
          </span>
          <span className="k-label">number machine</span>
        </Card>
      </At>
      <At x={37.500} y={44} p={{ x: 50, y: 51 }} hide={stage !== 2 || !w}>
        <Tag tone="info">
          <StepTag n={3} now /> <span className="k-mono">[{w?.nums.join(', ')}, …]</span>
        </Tag>
      </At>

      {ANCHORS.map((a) => (
        <At key={a.word} x={a.x} y={a.y} p={onMap(a.x, a.y)}>
          <div className="vm-dot is-ghost">
            <Pic size={1.600}>{a.icon}</Pic>
            <span>{a.word}</span>
          </div>
        </At>
      ))}
      {NEW_WORDS.filter((nw) => placed.includes(nw.word)).map((nw) => (
        <At key={nw.word} x={nw.x} y={nw.y} p={onMap(nw.x, nw.y)}>
          <div className={`vm-dot k-pop${cur === nw.word ? ' is-hit' : ''}`}>
            <Pic size={1.600}>{nw.icon}</Pic>
            <span>{nw.word}</span>
          </div>
        </At>
      ))}
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vector database: the map of meaning. Drop your question, grab the closest dots.
// ─────────────────────────────────────────────────────────────────────────────

const DOTS = [
  { id: 'cat', icon: '🐱', x: 15, y: 14 },
  { id: 'kitten', icon: '🐈', x: 24, y: 10 },
  { id: 'dog', icon: '🐶', x: 12, y: 23 },
  { id: 'puppy', icon: '🐕', x: 22, y: 21 },
  { id: 'horse', icon: '🐴', x: 31, y: 16 },
  { id: 'car', icon: '🚗', x: 50, y: 38 },
  { id: 'truck', icon: '🚚', x: 59, y: 45 },
  { id: 'bus', icon: '🚌', x: 61, y: 35 },
  { id: 'bike', icon: '🚲', x: 47, y: 47 },
  { id: 'apple', icon: '🍎', x: 13, y: 39 },
  { id: 'banana', icon: '🍌', x: 22, y: 45 },
  { id: 'grapes', icon: '🍇', x: 10, y: 48 },
  { id: 'mango', icon: '🥭', x: 25, y: 37 },
  { id: 'rain', icon: '🌧️', x: 51, y: 11 },
  { id: 'snow', icon: '❄️', x: 60, y: 17 },
  { id: 'sun', icon: '☀️', x: 46, y: 20 },
];
const ASKS: Array<{ id: string; label: string; x: number; y: number }> = [
  { id: 'kitty', label: '“a little kitty”', x: 20, y: 14 },
  { id: 'lorry', label: '“a big lorry”', x: 57, y: 41 },
  { id: 'sweet', label: '“something sweet”', x: 18, y: 42 },
  { id: 'wet', label: '“wet weather”', x: 54, y: 14 },
];
const MAP = { x0: 5, x1: 67, y0: 6, y1: 51 };

function VectorMap() {
  const [pin, setPin] = useState({ x: 36, y: 29 });
  const [k, setK] = useState(3);
  const [drag, setDrag] = useState(false);
  const [ask, setAsk] = useState<string | null>(null);

  const ranked = DOTS.map((d) => ({ ...d, dist: Math.hypot(d.x - pin.x, d.y - pin.y) })).sort((a, b) => a.dist - b.dist);
  const top = ranked.slice(0, k);
  const hit = new Set(top.map((d) => d.id));
  const reach = top[top.length - 1].dist + 2.200;

  // On the tall (phone) stage the map is bigger and sits on top, with the list under it.
  // It grows by the same amount in both directions, so what is closest still looks closest.
  const tall = usePortrait();
  const K = tall ? 90 / (MAP.x1 - MAP.x0) : 1;
  const sx = (x: number) => (tall ? 5 : MAP.x0) + (x - MAP.x0) * K;
  const sy = (y: number) => (tall ? 6 : MAP.y0) + (y - MAP.y0) * K;
  // The frame around the map, in stage units. It is also the part of the stage that listens to a finger.
  const frame = { x: sx(MAP.x0) - 2, y: sy(MAP.y0) - 2.500, w: (MAP.x1 - MAP.x0) * K + 4, h: (MAP.y1 - MAP.y0) * K + 5 };
  const stageH = tall ? PH : SH;

  const place = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = MAP.x0 + (frame.x + ((e.clientX - r.left) / r.width) * frame.w - sx(MAP.x0)) / K;
    const y = MAP.y0 + (frame.y + ((e.clientY - r.top) / r.height) * frame.h - sy(MAP.y0)) / K;
    setPin({ x: Math.max(MAP.x0, Math.min(MAP.x1, x)), y: Math.max(MAP.y0, Math.min(MAP.y1, y)) });
    setAsk(null);
  };

  return (
    <Scene
      caption={`Your question lands on the map. Ray grabs the ${k === 1 ? 'closest dot' : `${k} closest dots`}: ${top.map((d) => d.id).join(', ')}.`}
      controls={
        <>
          <Choice
            label="Ask"
            value={ask ?? ''}
            onChange={(id) => {
              const a = ASKS.find((x) => x.id === id)!;
              setAsk(id);
              setPin({ x: a.x, y: a.y });
            }}
            options={ASKS.map((a) => ({ id: a.id, label: a.label }))}
          />
          <Slider label="Grab" min={1} max={5} value={k} onChange={setK} show={k} />
        </>
      }
    >
      <Draw>
        <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx="2.500" fill="rgba(8,14,28,.5)" stroke="rgba(143,190,255,.2)" strokeWidth=".25" />
        <circle className="vm-reach" cx={sx(pin.x)} cy={sy(pin.y)} r={reach * K} />
        {top.map((d) => (
          <line key={d.id} className="vm-link" x1={sx(pin.x)} y1={sy(pin.y)} x2={sx(d.x)} y2={sy(d.y)} />
        ))}
      </Draw>

      {DOTS.map((d) => (
        <At key={d.id} x={sx(d.x)} y={sy(d.y)} p={{ y: sy(d.y) }} z={hit.has(d.id) ? 2 : 1}>
          <div className={`vm-dot${hit.has(d.id) ? ' is-hit' : ''}`}>
            {hit.has(d.id) && <StepTag n={top.findIndex((t) => t.id === d.id) + 1} corner small now={top[0].id === d.id} />}
            <Pic size={1.600}>{d.icon}</Pic>
            <span>{d.id}</span>
          </div>
        </At>
      ))}

      {/* The magnifier does not take the pointer itself: grabbing it is grabbing the map underneath. */}
      <At x={sx(pin.x)} y={sy(pin.y)} p={{ y: sy(pin.y) }} z={3} className="is-snap vm-pin-at">
        <span className="vm-pin">🔍</span>
      </At>

      {/* the whole map listens: click anywhere, or drag. Outside the map the page still scrolls under a finger. */}
      <div
        className="vm-touch"
        style={{ left: `${frame.x}%`, top: `${(frame.y / stageH) * 100}%`, width: `${frame.w}%`, height: `${(frame.h / stageH) * 100}%` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag(true);
          place(e);
        }}
        onPointerMove={(e) => drag && place(e)}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
        role="application"
        aria-label="The map of meaning. Click or drag to move your question."
      />

      <At x={84.500} y={7} p={{ x: 50, y: 81 }}>
        <span className="k-small">Ray grabs</span>
      </At>
      {top.map((d, i) => (
        <At key={d.id} x={84.500} y={14 + i * 7.400} w={25} p={{ x: 50, y: 88 + i * 8.600, w: 62 }} z={4}>
          <Card className="vm-row k-pop">
            <b>{i + 1}</b>
            <Pic size={1.300}>{d.icon}</Pic>
            <span>{d.id}</span>
            <i style={{ width: `${Math.max(8, 100 - d.dist * 5)}%` }} />
          </Card>
        </At>
      ))}
      <At x={36} y={54} p={{ x: 50, y: 76.500 }} z={4}>
        <span className="k-small">{tall ? 'tap or drag anywhere on the map' : 'click or drag anywhere on the map'}</span>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search: exact words, meaning, or both.
// ─────────────────────────────────────────────────────────────────────────────

type Mode = 'keyword' | 'meaning' | 'both';
type Query = 'puppy' | 'error';

const DOCS: Array<{ id: string; title: string; score: Record<Query, [number, number]> }> = [
  { id: 'a', title: 'Best food for a puppy', score: { puppy: [1, 0.9], error: [0, 0.02] } },
  { id: 'b', title: 'What should a young dog eat?', score: { puppy: [0, 0.95], error: [0, 0.01] } },
  { id: 'c', title: 'Puppy training tips', score: { puppy: [0.5, 0.35], error: [0, 0.02] } },
  { id: 'd', title: 'Kitten food guide', score: { puppy: [0.3, 0.5], error: [0, 0.01] } },
  { id: 'e', title: 'How to fix error E42', score: { puppy: [0, 0.01], error: [1, 0.8] } },
  { id: 'f', title: 'Error E24: paper is stuck', score: { puppy: [0, 0.01], error: [0.4, 0.85] } },
];
const QUERY: Record<Query, { text: string; words: string[] }> = {
  puppy: { text: 'puppy food', words: ['puppy', 'food'] },
  error: { text: 'error E42', words: ['error', 'e42'] },
};
const VERDICT: Record<Query, Record<Mode, { text: string; tone: 'ok' | 'warn' | 'bad'; caption: string }>> = {
  puppy: {
    keyword: { text: 'I found pages with the word “puppy”. But I missed the one about young dogs.', tone: 'warn', caption: 'Exact-word search only finds pages that use your words. “Young dog” means puppy, but the words are different.' },
    meaning: { text: 'I found the page about young dogs too. Same idea, different words.', tone: 'ok', caption: 'Meaning search understands that a young dog is a puppy.' },
    both: { text: 'The exact match is on top, and the “young dog” page is right behind it.', tone: 'ok', caption: 'Both together: the exact words count, and so does the meaning.' },
  },
  error: {
    keyword: { text: 'E42, exactly. That is the right page.', tone: 'ok', caption: 'For codes, names and numbers, exact-word search is perfect.' },
    meaning: { text: 'Oops. I picked E24. It looked almost the same to me!', tone: 'bad', caption: 'Meaning search is fuzzy. E24 and E42 look alike, so it picked the wrong one.' },
    both: { text: 'E42 is on top. The exact word settled it.', tone: 'ok', caption: 'Both together: meaning finds the area, the exact word picks the winner.' },
  },
};

function SearchModes({ variant }: SceneProps) {
  const [mode, setMode] = useState<Mode>(variant === 'keyword' || variant === 'meaning' || variant === 'both' ? variant : 'keyword');
  const [q, setQ] = useState<Query>('puppy');
  const score = (d: (typeof DOCS)[number]) => {
    const [kw, sem] = d.score[q];
    return mode === 'keyword' ? kw : mode === 'meaning' ? sem : kw + sem;
  };
  const order = [...DOCS].sort((a, b) => score(b) - score(a));
  const max = Math.max(...DOCS.map(score));
  const v = VERDICT[q][mode];

  const mark = (title: string) =>
    mode === 'meaning'
      ? title
      : title.split(' ').map((w, i) => (
          <span key={i} className={QUERY[q].words.includes(w.toLowerCase().replace(/[^a-z0-9]/g, '')) ? 'sm-match' : ''}>
            {w}{' '}
          </span>
        ));

  return (
    <Scene
      caption={v.caption}
      tone={v.tone}
      controls={
        <>
          <Choice<Query>
            label="Search for"
            value={q}
            onChange={setQ}
            options={[
              { id: 'puppy', label: '🔎 puppy food' },
              { id: 'error', label: '🔎 error E42' },
            ]}
          />
          <Choice<Mode>
            label="How to search"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'keyword', label: '🔤 Exact words' },
              { id: 'meaning', label: '🧲 Meaning' },
              { id: 'both', label: '🤝 Both' },
            ]}
          />
        </>
      }
    >
      <At x={32} y={5.500} w={40} p={{ x: 50, y: 6, w: 70 }}>
        <div className="sm-query">🔎 {QUERY[q].text}</div>
      </At>
      {DOCS.map((d) => {
        const rank = order.indexOf(d);
        const sc = score(d);
        const found = sc > 0.2;
        return (
          <At key={d.id} x={32} y={14 + rank * 6.700} w={54} p={{ x: 50, y: 19 + rank * 11.400, w: 92 }} z={6 - rank} style={{ opacity: found ? 1 : 0.22 }}>
            <div className={`sm-doc${found && rank === 0 ? ' is-top' : ''}`}>
              <b>{found ? rank + 1 : '–'}</b>
              <span>{mark(d.title)}</span>
              <i>
                <u style={{ width: `${(sc / (max || 1)) * 100}%` }} />
              </i>
            </div>
          </At>
        );
      })}

      <At x={82} y={38} p={{ x: 15, y: 106 }}>
        <MiniRay mood={v.tone === 'ok' ? 'happy' : v.tone === 'bad' ? 'oops' : 'think'} size={5} />
      </At>
      <At x={81} y={18} w={31} p={{ x: 62, y: 105, w: 70 }}>
        <Bubble who="ray" tone={v.tone} key={`${q}${mode}`}>
          {v.text}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reranking: a careful reader puts the best page on top.
// ─────────────────────────────────────────────────────────────────────────────

const FOUND = [
  { id: 1, title: 'Giraffes are very tall', stars: 2 },
  { id: 2, title: 'How long do cats sleep?', stars: 1 },
  { id: 3, title: 'What giraffes eat', stars: 1 },
  { id: 4, title: 'Giraffes sleep 30 minutes a day', stars: 5 },
  { id: 5, title: 'Zoo opening times', stars: 0 },
];

function Rerank() {
  const [read, setRead] = useState(0); // how many pages the careful reader has scored
  const [sorted, setSorted] = useState(false);
  const { run, busy } = useRunner();
  const go = () =>
    run(async (sleep) => {
      setSorted(false);
      setRead(0);
      for (let i = 1; i <= FOUND.length; i++) {
        await sleep(600);
        setRead(i);
      }
      await sleep(500);
      setSorted(true);
    });
  const reset = () => {
    setRead(0);
    setSorted(false);
  };
  const order = sorted ? [...FOUND].sort((a, b) => b.stars - a.stars) : FOUND;

  return (
    <Scene
      caption={
        sorted
          ? 'The best page jumped from fourth place to first. Now Ray reads it, and gets the answer.'
          : busy
            ? 'The careful reader reads every page next to the question, and gives each one stars…'
            : 'Search found five pages, in a rough order. Ray only reads the top two. Is the answer in there?'
      }
      tone={sorted ? 'ok' : undefined}
      step={sorted ? 3 : busy ? 2 : 1}
      controls={
        sorted ? (
          <Btn onClick={reset}>↺ Again</Btn>
        ) : (
          <Btn onClick={go} disabled={busy} pulse>
            🧐 Rerank
          </Btn>
        )
      }
    >
      <At x={33} y={5.500} w={46} p={{ x: 50, y: 7, w: 84 }}>
        <Bubble who="you">How long do giraffes sleep?</Bubble>
      </At>
      <At x={33} y={22.500} w={58} p={{ x: 50, y: 30, w: 96 }} z={0}>
        <div className="rr-reads">
          <span>Ray reads these two</span>
        </div>
      </At>
      {FOUND.map((d) => {
        const rank = order.indexOf(d);
        const scored = read >= d.id;
        return (
          <At key={d.id} x={33} y={18.500 + rank * 7.600} w={54} p={{ x: 50, y: 24 + rank * 12, w: 90 }} z={2}>
            <div className={`sm-doc rr-doc${read === d.id && busy ? ' is-reading' : ''}${sorted && rank === 0 ? ' is-top' : ''}`}>
              <b>{rank + 1}</b>
              <span>{d.title}</span>
              <em className={scored ? 'is-in' : ''}>{scored ? '★'.repeat(d.stars) + '☆'.repeat(5 - d.stars) : '·····'}</em>
            </div>
          </At>
        );
      })}

      <At x={84} y={40} p={{ x: 15, y: 106 }}>
        <MiniRay mood={sorted ? 'happy' : busy ? 'think' : 'sad'} size={4.800} />
      </At>
      <At x={82} y={20} w={30} p={{ x: 62, y: 105, w: 70 }}>
        <Bubble who="ray" tone={sorted ? 'ok' : 'warn'} key={`${sorted}`}>
          {sorted ? 'Only 30 minutes a day!' : 'I read the top two. They do not say.'}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Agentic search: should Ray visit the library every time, or decide for itself?
// ─────────────────────────────────────────────────────────────────────────────

type Msg = 'hello' | 'one' | 'two';
type How = 'always' | 'decides';

const TRIPS: Record<Msg, Record<How, { trips: string[]; say: string; tone: 'ok' | 'warn'; caption: string }>> = {
  hello: {
    always: { trips: ['“hello!”'], say: 'Hello! (I also fetched some pages for no reason.)', tone: 'warn', caption: 'Ray went to the library for a hello. A wasted trip.' },
    decides: { trips: [], say: 'Hello! Nice to see you.', tone: 'ok', caption: 'No need to look anything up for a hello. Ray stayed put.' },
  },
  one: {
    always: { trips: ['“how tall is a giraffe?”'], say: 'About 5 metres.', tone: 'ok', caption: 'One question, one trip. Both ways work fine here.' },
    decides: { trips: ['“giraffe height”'], say: 'About 5 metres.', tone: 'ok', caption: 'Ray decided to look, and wrote its own short search.' },
  },
  two: {
    always: { trips: ['“which is taller, a giraffe or an elephant?”'], say: 'A giraffe is 5 metres. I found nothing about elephants.', tone: 'warn', caption: 'One trip with the whole question only found half the answer.' },
    decides: { trips: ['“giraffe height”', '“elephant height”'], say: 'The giraffe! 5 metres against 3.', tone: 'ok', caption: 'Ray made two trips, one for each animal. Now it can compare.' },
  },
};

function WhenToLook() {
  const [msg, setMsg] = useState<Msg>('two');
  const [how, setHow] = useState<How>('always');
  const r = TRIPS[msg][how];
  const text = msg === 'hello' ? 'Hello!' : msg === 'one' ? 'How tall is a giraffe?' : 'Which is taller, a giraffe or an elephant?';
  return (
    <Scene
      caption={r.caption}
      tone={r.tone}
      controls={
        <>
          <Choice<Msg>
            label="You say"
            value={msg}
            onChange={setMsg}
            options={[
              { id: 'hello', label: '👋 Hello' },
              { id: 'one', label: '🦒 One fact' },
              { id: 'two', label: '⚖️ Compare two' },
            ]}
          />
          <Choice<How>
            label="Ray"
            value={how}
            onChange={setHow}
            options={[
              { id: 'always', label: 'Always looks' },
              { id: 'decides', label: 'Decides itself' },
            ]}
          />
        </>
      }
    >
      <Draw>
        {r.trips.map((_, i) => (
          <Arrow key={`${msg}${how}${i}`} from={[27, 27 + i * 9]} to={[69, 24 + i * 10]} bend={i ? 3 : -3} p={{ from: [24, 55 + i * 10], to: [71, 53 + i * 13] }} flow />
        ))}
      </Draw>
      <At x={38} y={6.500} w={56} p={{ x: 50, y: 8, w: 88 }}>
        <Bubble who="you" key={msg}>
          <StepTag n={1} corner />
          {text}
        </Bubble>
      </At>
      <At x={17} y={31} p={{ x: 14, y: 60 }}>
        <MiniRay mood={r.tone === 'ok' ? 'happy' : 'think'} size={5.400} />
      </At>
      <At x={82} y={29} w={24} p={{ x: 85.500, y: 60, w: 27 }}>
        <Card className="k-center">
          <Pic size={3.200}>📚</Pic>
          <span className="k-title">Library</span>
          <Tag tone={r.trips.length === 0 ? 'ok' : r.tone}>
            {r.trips.length} {r.trips.length === 1 ? 'trip' : 'trips'}
          </Tag>
        </Card>
      </At>
      {r.trips.map((t, i) => (
        <At key={`${msg}${how}${i}`} x={48} y={21.500 + i * 11.500} w={30} p={{ x: 48, y: r.trips.length === 1 ? 58 : 44 + i * 28, w: 42 }} z={3}>
          <Card className="k-pop">
            <StepTag n={stepName(2, i, r.trips.length)} corner />
            <small>Ray searches for</small>
            {t}
          </Card>
        </At>
      ))}
      <At x={40} y={48.500} w={62} p={{ x: 50, y: 116, w: 90 }}>
        <Bubble who="ray" tone={r.tone} key={`${msg}${how}`}>
          <StepTag n={r.trips.length ? 3 : 2} corner now />
          <Typed text={r.say} />
        </Bubble>
      </At>
    </Scene>
  );
}

register({
  library: Library,
  readers: Readers,
  chunking: Chunking,
  embeddings: Embeddings,
  'vector-map': VectorMap,
  'search-modes': SearchModes,
  rerank: Rerank,
  'when-to-look': WhenToLook,
});
