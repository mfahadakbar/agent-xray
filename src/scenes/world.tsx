import { useEffect, useState, type CSSProperties } from 'react';
import { useRunner } from '../lib/hooks';
import { At, Btn, Bubble, Card, Choice, Draw, MiniRay, Note, Pic, Scene, StepTag, Tag, Toggle, usePortrait } from './kit';
import { register, type SceneProps } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Check-up: the report card. Test Ray, change something, and test again.
// ─────────────────────────────────────────────────────────────────────────────

type Version = 'v1' | 'v2';
const QUIZ: Array<{ q: string; key: string; v1: [string, boolean]; v2: [string, boolean] }> = [
  { q: '2 + 2?', key: '4', v1: ['4', true], v2: ['4', true] },
  { q: 'Capital of France?', key: 'Paris', v1: ['Paris', true], v2: ['Paris', true] },
  { q: '847 × 36?', key: '30,492', v1: ['30,000', false], v2: ['30,492', true] },
  { q: 'Is a tomato a fruit?', key: 'Yes', v1: ['No', false], v2: ['Yes', true] },
];
const GRADES: Array<{ id: string; icon: string; name: string; v1: string; v2: string; good: [boolean, boolean] }> = [
  { id: 'accuracy', icon: '🎯', name: 'Right answers', v1: '2 of 4', v2: '4 of 4', good: [false, true] },
  { id: 'reliability', icon: '🧭', name: 'Used the calculator', v1: 'No, it guessed', v2: 'Yes', good: [false, true] },
  { id: 'performance', icon: '⏱️', name: 'Speed', v1: '1.1 seconds', v2: '1.6 seconds', good: [true, true] },
  { id: 'judge', icon: '🧑‍⚖️', name: 'Kind and clear', v1: '3 of 5', v2: '5 of 5', good: [false, true] },
];

function ReportCard({ variant }: SceneProps) {
  const [ver, setVer] = useState<Version>('v1');
  const [n, setN] = useState(0);
  const { run, stop, busy } = useRunner();
  const done = n >= QUIZ.length;
  const score = QUIZ.filter((x) => x[ver][1]).length;

  const test = () =>
    run(async (sleep) => {
      setN(0);
      for (let i = 1; i <= QUIZ.length; i++) {
        await sleep(650);
        setN(i);
      }
    });
  const swap = (v: Version) => {
    stop();
    setVer(v);
    setN(0);
  };

  return (
    <Scene
      caption={
        done
          ? ver === 'v1'
            ? 'Two out of four. Now give Ray a better job card, and run the very same test again.'
            : 'Four out of four, and it used the calculator. A little slower, though. Now you know the change helped.'
          : busy
            ? 'Ray takes the test. Each answer is checked against the answer key…'
            : 'How do you know if Ray is any good? Give it a test with an answer key.'
      }
      tone={done ? (ver === 'v2' ? 'ok' : 'warn') : undefined}
      step={done ? QUIZ.length + 1 : busy ? n + 1 : undefined}
      controls={
        <>
          <Choice<Version>
            label="Which Ray"
            value={ver}
            onChange={swap}
            options={[
              { id: 'v1', label: 'Ray, first try' },
              { id: 'v2', label: 'Ray, with a better job card' },
            ]}
          />
          <Btn onClick={test} disabled={busy} pulse={n === 0}>
            {done ? '↺ Test again' : '▶ Run the test'}
          </Btn>
        </>
      }
    >
      <At x={30} y={5.500} p={{ x: 50, y: 5 }}>
        <span className="k-small">the test</span>
      </At>
      <At x={30} y={11.500} w={54} p={{ x: 50, y: 12, w: 92 }}>
        <div className="rp-row is-head">
          <span>Question</span>
          <span>Answer key</span>
          <span>Ray said</span>
          <span />
        </div>
      </At>
      {QUIZ.map((x, i) => {
        const [said, ok] = x[ver];
        const shown = n > i;
        return (
          <At key={x.q} x={30} y={18.500 + i * 7.400} w={54} p={{ x: 50, y: 21 + i * 10.500, w: 92 }}>
            <div className={`rp-row${shown ? (ok ? ' is-ok' : ' is-bad') : ''}`}>
              <span>
                <StepTag n={i + 1} now={busy && n === i} todo={!shown && !(busy && n === i)} /> {x.q}
              </span>
              <span>{x.key}</span>
              <span>{shown ? said : '…'}</span>
              <b>{shown ? (ok ? '✓' : '✕') : ''}</b>
            </div>
          </At>
        );
      })}
      <At x={14} y={50} p={{ x: 14, y: 67 }}>
        <MiniRay mood={!done ? (busy ? 'think' : 'happy') : ver === 'v2' ? 'happy' : 'sad'} size={3.600} />
      </At>
      <At x={38} y={50} p={{ x: 52, y: 67 }} hide={!done}>
        <Tag tone={score === 4 ? 'ok' : 'warn'}>score: {score} out of 4</Tag>
      </At>

      <At x={81} y={5.500} p={{ x: 50, y: 79 }}>
        <span className="k-small">
          <StepTag n={QUIZ.length + 1} now={done} todo={!done} /> the report card
        </span>
      </At>
      {GRADES.map((g, i) => {
        const good = g.good[ver === 'v1' ? 0 : 1];
        return (
          <At key={g.id} x={81} y={14.500 + i * 10} w={33} p={{ x: i % 2 ? 74 : 26, y: 93 + Math.floor(i / 2) * 20, w: 46 }} style={{ opacity: done ? 1 : 0.3 }}>
            <Card className={`rp-grade${variant === g.id ? ' is-focus' : ''}`} tone={done ? (good ? 'ok' : 'bad') : undefined}>
              <Pic size={1.600}>{g.icon}</Pic>
              <span>
                <small>{g.name}</small>
                {done ? g[ver] : '?'}
              </span>
            </Card>
          </At>
        );
      })}
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracing: footprints. Every step Ray took, in order, with how long it lasted.
// ─────────────────────────────────────────────────────────────────────────────

const SPANS: Array<{ id: string; icon: string; name: string; from: number; to: number; depth: number; note: string; slow?: boolean }> = [
  { id: 'run', icon: '🏃', name: 'The whole run', from: 0, to: 5.800, depth: 0, note: 'From question to answer: 5.8 seconds, 1,330 tokens, about half a cent.' },
  { id: 'm1', icon: '🧠', name: 'Brain thinks', from: 0, to: 0.800, depth: 1, note: 'The brain read 420 tokens and decided to use two tools.' },
  { id: 't1', icon: '🌦️', name: 'Weather tool', from: 0.800, to: 1.200, depth: 1, note: 'Asked for Paris. Got “18°C, sunny”. Quick.' },
  { id: 't2', icon: '🔎', name: 'Search tool', from: 1.200, to: 4.900, depth: 1, note: 'Searched for “park opening hours”. This took 3.7 seconds!', slow: true },
  { id: 'm2', icon: '🧠', name: 'Brain answers', from: 4.900, to: 5.800, depth: 1, note: 'The brain read both results (910 tokens) and wrote the answer.' },
];
const T0 = 36;
const PER_S = 10.200;

/** The same time line on the tall (phone) stage: it takes the full width, and each name sits above its bar. */
const T0_TALL = 6;
const PER_S_TALL = 14.600;

function Footprints({ variant }: SceneProps) {
  const tall = usePortrait();
  const t0 = tall ? T0_TALL : T0;
  const perS = tall ? PER_S_TALL : PER_S;
  /** Where a bar sits, top to bottom. */
  const rowY = (i: number) => (tall ? 26 + i * 17.500 : 12.500 + i * 7.200);
  const [sel, setSel] = useState<string>(variant === 'metrics' ? 'run' : '');
  const [found, setFound] = useState(false);
  const cur = SPANS.find((s) => s.id === sel);

  return (
    <Scene
      caption={found ? 'There it is. The search tool took almost four seconds. That is the step to fix.' : cur ? cur.note : 'Ray left footprints. Every step, in order, and how long each one took. Click a bar to look closer.'}
      tone={found ? 'ok' : undefined}
      controls={
        <Btn
          onClick={() => {
            setFound(true);
            setSel('t2');
          }}
          pulse={!found}
        >
          🔍 Find the slow step
        </Btn>
      }
    >
      <Draw>
        {[0, 1, 2, 3, 4, 5, 6].map((s) => (
          <g key={s}>
            <line x1={t0 + s * perS} y1={tall ? 12 : 9} x2={t0 + s * perS} y2={tall ? 104 : 46} stroke="rgba(143,190,255,.14)" strokeWidth=".15" />
            <Note at={[t0 + s * perS, 7.500]} p={[t0 + s * perS, 9.500]} size={1.500} opacity={0.7}>
              {s}s
            </Note>
          </g>
        ))}
      </Draw>
      {SPANS.map((s, i) => (
        <At key={`${s.id}l`} x={18 + s.depth * 1.500} y={rowY(i)} w={31} p={{ x: 36, y: rowY(i) - 7.500, w: 64 }}>
          <div className="fp-label" style={{ paddingLeft: `${s.depth * 0.9}em` }}>
            {s.depth > 0 && <StepTag n={i} now={sel === s.id} />} <span>{s.icon}</span> {s.name}
          </div>
        </At>
      ))}
      {SPANS.map((s, i) => {
        const w = (s.to - s.from) * perS;
        return (
          <At key={s.id} x={t0 + s.from * perS + w / 2} y={rowY(i)} w={w} p={{ y: rowY(i) }} z={2}>
            <button
              className={`fp-bar${sel === s.id ? ' is-on' : ''}${s.slow ? ' is-slow' : ''}${found && s.slow ? ' is-found' : ''}${s.depth === 0 ? ' is-root' : ''}`}
              onClick={() => {
                setSel(s.id);
                setFound(false);
              }}
              aria-label={`${s.name}: ${(s.to - s.from).toFixed(1)} seconds`}
            >
              {(s.to - s.from).toFixed(1)}s
            </button>
          </At>
        );
      })}
      <At x={50} y={51} w={90} p={{ y: 119, w: 94 }}>
        <div className={`fp-totals${variant === 'metrics' ? ' is-focus' : ''}`}>
          <Tag tone="info">⏱ 5.8 seconds</Tag>
          <Tag tone="info">🔤 1,330 tokens</Tag>
          <Tag tone="info">💰 about half a cent</Tag>
          <Tag tone="info">🧠 2 brain calls</Tag>
          <Tag tone="info">✋ 2 tool calls</Tag>
        </div>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home: where Ray lives. One Ray, many doors, always on.
// ─────────────────────────────────────────────────────────────────────────────

type Door = 'chat' | 'messaging' | 'voice' | 'api';
const DOORS: Record<Door, { icon: string; name: string; who: string; at: [number, number]; reply: string; how: string; caption: string }> = {
  chat: { icon: '💬', name: 'Chat window', who: '🧑‍💻', at: [13, 15], reply: 'Sure! Here is a long, tidy answer with a list:\n1. First…\n2. Then…', how: 'typed out on a web page', caption: 'Through the chat door, Ray can write long answers with lists and buttons.' },
  messaging: { icon: '📱', name: 'Messaging app', who: '🧑', at: [13, 41], reply: 'On it! 👍 Done in 2 min.', how: 'a short message on a phone', caption: 'Through the messaging door, answers are short, like a text from a friend.' },
  voice: { icon: '🎙️', name: 'Phone line', who: '👵', at: [87, 15], reply: '🔊 “Of course. I will read it out for you.”', how: 'spoken out loud', caption: 'Through the phone door, Ray listens and speaks. No screen at all.' },
  api: { icon: '🔗', name: 'Door for programs', who: '⚙️', at: [87, 41], reply: '{ "status": "done", "items": 3 }', how: 'a tidy form for another program', caption: 'Through the program door, another computer asks, and gets a tidy form back.' },
};

function House({ variant }: SceneProps) {
  const tall = usePortrait();
  const [door, setDoor] = useState<Door | null>(variant && variant in DOORS ? (variant as Door) : null);
  const [open, setOpen] = useState(true);
  const [crowd, setCrowd] = useState(variant === 'crowd');
  const d = door ? DOORS[door] : null;

  return (
    <Scene
      caption={
        !open
          ? 'The house is closed. Ray is asleep and nobody can reach it. A home has to be always on.'
          : crowd
            ? 'A crowd arrived! So the house made more Rays. They all share one diary, so every Ray knows every visitor.'
            : d
              ? d.caption
              : 'Ray lives in a house with four doors. Knock on one. Behind every door it is the same Ray.'
      }
      tone={!open ? 'bad' : d || crowd ? 'ok' : undefined}
      controls={
        <>
          <Toggle on={open} onChange={setOpen}>
            💡 Always on
          </Toggle>
          <Toggle on={crowd} onChange={setCrowd}>
            👥 A crowd arrives
          </Toggle>
        </>
      }
    >
      <Draw>
        <path d={tall ? 'M24 60L50 44L76 60' : 'M30 26L50 13L70 26'} fill="none" stroke="var(--c)" strokeWidth=".5" strokeLinejoin="round" strokeLinecap="round" opacity={open ? 1 : 0.35} />
        <rect x={tall ? 28 : 32} y={tall ? 60 : 26} width={tall ? 44 : 36} height={tall ? 44 : 24} rx="2" fill="rgba(8,14,28,.6)" stroke="var(--c)" strokeWidth=".4" opacity={open ? 1 : 0.35} />
        {(Object.keys(DOORS) as Door[]).map((id) => {
          const a = DOORS[id].at;
          const left = a[0] < 50;
          const top = a[1] < 28;
          // From each door to the nearest corner of the house. On the tall stage the doors sit above and below it.
          const line = tall
            ? { x1: left ? 24 : 76, y1: top ? 45 : 105.500, x2: left ? 31 : 69, y2: top ? 62 : 102 }
            : { x1: left ? a[0] + 11 : a[0] - 11, y1: a[1], x2: left ? 32 : 68, y2: top ? 31 : 44 };
          return <line key={id} {...line} stroke={door === id && open ? 'var(--c)' : 'rgba(143,190,255,.22)'} strokeWidth={door === id && open ? 0.5 : 0.25} strokeDasharray=".8 .9" />;
        })}
      </Draw>

      {(Object.keys(DOORS) as Door[]).map((id) => {
        const x = DOORS[id];
        return (
          <At key={id} x={x.at[0]} y={x.at[1]} w={21} p={{ x: x.at[0] < 50 ? 19 : 81, y: x.at[1] < 28 ? 34 : 116, w: 34 }}>
            <button className={`hs-door${door === id ? ' is-on' : ''}`} onClick={() => setDoor(id)} disabled={!open} aria-pressed={door === id}>
              <Pic size={1.800}>{x.icon}</Pic>
              <b>{x.name}</b>
              <i>{x.who} knocks here</i>
            </button>
          </At>
        );
      })}

      {(crowd && open ? [42, 50, 58] : [50]).map((x, i) => (
        <At key={i} x={x} y={35} p={{ x: 50 + (x - 50) * 1.500, y: 80 }}>
          <span className="k-pop" style={{ display: 'inline-block' }}>
            <MiniRay mood={open ? 'happy' : 'sleep'} size={crowd && open ? 2.900 : 4.400} />
          </span>
        </At>
      ))}
      <At x={50} y={46} p={{ y: 97 }}>
        <Tag tone={open ? 'ok' : 'bad'}>{!open ? 'closed' : crowd ? '💾 3 Rays, one shared diary' : '💾 the diary'}</Tag>
      </At>

      <At x={50} y={6.500} w={42} p={{ y: 11, w: 92 }} z={4} hide={!d || !open || crowd}>
        <Bubble who="ray" tone="ok" key={door ?? ''}>
          <span className="hs-reply">{d?.reply}</span>
          <small className="k-small">{d?.how}</small>
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedules: the alarm clock. Ray wakes up and works without being asked.
// ─────────────────────────────────────────────────────────────────────────────

type Alarm = 'morning' | 'hourly' | 'weekly';
const ALARMS: Record<Alarm, { chip: string; every: number; job: string; label: string }> = {
  morning: { chip: '🌅 Every morning at 8', every: 12, job: '📰 Morning news, sent', label: 'every morning' },
  hourly: { chip: '⏱️ Every hour', every: 3, job: '📥 Inbox checked', label: 'every hour' },
  weekly: { chip: '📅 Every Monday', every: 28, job: '📊 Weekly report, sent', label: 'every Monday' },
};

function AlarmClock() {
  const [alarm, setAlarm] = useState<Alarm>('morning');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const a = ALARMS[alarm];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((v) => v + 1), 260);
    return () => clearInterval(id);
  }, [playing]);

  // The clock: where it stands and how big it is. Bigger on the tall (phone) stage.
  const tall = usePortrait();
  const CLOCK = tall ? { x: 28, y: 35, r: 19 } : { x: 24, y: 29, r: 15 };
  const phase = t % a.every;
  const working = t > 0 && phase < 2 && t >= a.every;
  const jobs = Math.floor(t / a.every);
  const angle = (phase / a.every) * 360;

  return (
    <Scene
      caption={
        !playing && t === 0
          ? 'Ray does not have to wait for you. Set an alarm, start the clock, and go do something else.'
          : working
            ? `Ring ring! Ray wakes up, does the job, and tells nobody to wait.`
            : jobs === 0
              ? 'Ray sleeps. The clock ticks…'
              : `${jobs} ${jobs === 1 ? 'job' : 'jobs'} done, and nobody had to ask. That is a schedule.`
      }
      tone={jobs > 0 ? 'ok' : undefined}
      controls={
        <>
          <Choice<Alarm>
            label="Alarm"
            value={alarm}
            onChange={(v) => {
              setAlarm(v);
              setT(0);
            }}
            options={(Object.keys(ALARMS) as Alarm[]).map((id) => ({ id, label: ALARMS[id].chip }))}
          />
          <Btn onClick={() => setPlaying((p) => !p)} pulse={!playing && t === 0}>
            {playing ? '❚❚ Stop the clock' : '▶ Start the clock'}
          </Btn>
        </>
      }
    >
      <Draw>
        {/* drawn around (0, 0) with a radius of 15, then moved and sized */}
        <g transform={`translate(${CLOCK.x} ${CLOCK.y}) scale(${CLOCK.r / 15})`}>
          <circle r="15" fill="rgba(8,14,28,.7)" stroke="var(--c)" strokeWidth=".6" />
          {Array.from({ length: 12 }, (_, i) => {
            const r = (i / 12) * Math.PI * 2;
            return <line key={i} x1={Math.sin(r) * 12.800} y1={-Math.cos(r) * 12.800} x2={Math.sin(r) * 14} y2={-Math.cos(r) * 14} stroke="rgba(143,190,255,.5)" strokeWidth=".3" />;
          })}
          <path d="M0 0L0 -13" stroke="var(--warn)" strokeWidth=".7" strokeLinecap="round" opacity=".9" />
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '0px 0px', transition: phase === 0 ? 'none' : 'transform .26s linear' } as CSSProperties}>
            <path d="M0 0L0 -11" stroke="#fff" strokeWidth=".8" strokeLinecap="round" />
          </g>
          <circle r="1" fill="#fff" />
        </g>
      </Draw>
      <At x={24} y={10} p={{ x: CLOCK.x, y: 9 }}>
        <span className={working ? 'k-shake' : ''} style={{ display: 'inline-block' }} key={jobs}>
          <Pic size={2}>⏰</Pic>
        </span>
      </At>
      <At x={24} y={49} p={{ x: CLOCK.x, y: 61 }}>
        <Tag tone="warn">alarm: {a.label}</Tag>
      </At>

      <At x={54} y={27} p={{ x: 76, y: 30 }}>
        <MiniRay mood={working ? 'wow' : 'sleep'} size={5.600} />
      </At>
      <At x={54} y={43} p={{ x: 76, y: 47 }}>
        <Tag tone={working ? 'ok' : 'info'}>{working ? 'working!' : 'asleep'}</Tag>
      </At>

      <At x={84} y={8} p={{ x: 50, y: 74 }}>
        <span className="k-small">jobs done: {jobs}</span>
      </At>
      {Array.from({ length: Math.min(jobs, 4) }, (_, i) => (
        <At key={jobs - i} x={84} y={15.500 + i * 8} w={27} p={{ x: i % 2 ? 73.500 : 26.500, y: 86 + Math.floor(i / 2) * 17, w: 45 }}>
          <Card className="k-pop" tone={i === 0 ? 'ok' : undefined}>
            <small>run {jobs - i}</small>
            {a.job}
          </Card>
        </At>
      ))}
    </Scene>
  );
}

register({ 'report-card': ReportCard, footprints: Footprints, house: House, alarm: AlarmClock });
