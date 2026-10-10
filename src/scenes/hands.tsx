import { useState, type CSSProperties } from 'react';
import { useRunner, useSteps } from '../lib/hooks';
import { Arrow, At, Btn, Bubble, Card, Choice, Draw, MiniRay, Pic, Scene, StepNav, StepTag, StepTags, Tag, Toggle, tagsFor, usePortrait, type Mood } from './kit';
import { register, type SceneProps } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Hands: using a tool. The brain can only think. Tools let Ray check and do.
// ─────────────────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  chip: string;
  ask: string;
  tool: string;
  icon: string;
  order: string;
  result: string;
  answer: string;
  guess: string;
  why: string;
}

const JOBS: Job[] = [
  { id: 'calc', chip: '🧮 A big sum', ask: 'What is 847 × 36?', tool: 'Calculator', icon: '🧮', order: 'calculate 847 × 36', result: '30,492', answer: '847 × 36 = 30,492.', guess: 'About 30,000? I am not sure.', why: 'Brains are bad at big sums. A calculator is never wrong.' },
  { id: 'weather', chip: '🌦️ The weather', ask: "What's the weather in Paris?", tool: 'Weather tool', icon: '🌦️', order: 'weather for Paris', result: '18°C, sunny', answer: 'It is 18°C and sunny in Paris.', guess: 'Probably nice? I cannot look outside.', why: 'The brain cannot see today. A tool can.' },
  { id: 'search', chip: '🔎 Last night', ask: 'Who won the big game last night?', tool: 'Web search', icon: '🔎', order: 'search “big game result”', result: 'Lions 3, Tigers 1', answer: 'The Lions won, 3 to 1.', guess: 'I do not know. My schooling ended before last night.', why: "The brain's knowledge stops on the day its schooling ended. Search brings in what is new." },
  { id: 'read', chip: '🕸️ A web page', ask: 'What does this page say? 🔗', tool: 'Page reader', icon: '📄', order: 'read the page at this link', result: 'Pancakes: 3 eggs, flour, milk', answer: 'It is a pancake recipe. You need 3 eggs.', guess: 'I cannot open links.', why: 'A reader tool opens the page and hands Ray the words.' },
  { id: 'code', chip: '🧪 Run code', ask: 'Add up these 500 numbers. 📎', tool: 'Code runner', icon: '🧪', order: 'run: sum(numbers)', result: '251,340', answer: 'They add up to 251,340.', guess: 'Around a quarter of a million? I cannot be exact.', why: 'Ray writes a tiny program, runs it in a safe box, and reads the result.' },
  { id: 'data', chip: '📊 Our data', ask: 'How many orders did we get last week?', tool: 'Database', icon: '📊', order: 'count orders from last week', result: '1,284 orders', answer: 'You got 1,284 orders last week.', guess: 'I have no way to see your orders.', why: 'Your data lives in your systems. A tool lets Ray ask them.' },
  { id: 'apps', chip: '📨 Send it', ask: 'Email the meeting notes to Mia.', tool: 'Email', icon: '📨', order: 'send email to Mia', result: 'Sent ✓', answer: 'Done. Mia has the notes.', guess: 'I can write the email, but I cannot send it.', why: 'This tool does not look something up. It does something. Those need extra care.' },
  { id: 'computer', chip: '🖱️ Click for me', ask: 'Book a table on the restaurant website.', tool: 'Browser', icon: '🖱️', order: 'click “Book”, pick 7 pm', result: 'Booked: 7 pm, 2 people', answer: 'Booked for 7 pm.', guess: 'I cannot click on websites.', why: 'When there is no tool for an app, Ray can use the screen like you do.' },
];
const VARIANT_JOB: Record<string, string> = { search: 'search', reading: 'read', code: 'code', data: 'data', apps: 'apps', computer: 'computer' };

function UseATool({ variant }: SceneProps) {
  const fixed = variant ? VARIANT_JOB[variant] : undefined;
  const menu = fixed ? JOBS.filter((j) => j.id === fixed) : JOBS.slice(0, 3);
  const [jobId, setJobId] = useState(menu[0].id);
  const [hands, setHands] = useState(true);
  const [phase, setPhase] = useState(0); // 0 idle · 1 thinks · 2 order out · 3 result back · 4 answers
  const { run, stop, busy } = useRunner();
  const job = JOBS.find((j) => j.id === jobId)!;

  const reset = () => {
    stop();
    setPhase(0);
  };
  const ask = () =>
    run(async (sleep) => {
      setPhase(1);
      await sleep(1300);
      if (hands) {
        setPhase(2);
        await sleep(1400);
        setPhase(3);
        await sleep(1400);
      }
      setPhase(4);
    });

  const caption =
    phase === 0
      ? hands
        ? 'Ask Ray. Watch what its hands do.'
        : 'The hands are switched off. Ask anyway and see what happens.'
      : phase === 1
        ? hands
          ? 'The brain thinks: “I cannot know this. I need a tool.”'
          : 'The brain thinks: “I cannot know this.” And there is no tool to help.'
        : phase === 2
          ? `Ray reaches for the ${job.tool.toLowerCase()} and tells it what to do.`
          : phase === 3
            ? 'The tool does the job and hands back the result.'
            : hands
              ? job.why
              : 'Without a tool, Ray can only guess. Switch the hands back on.';

  const mood: Mood = phase === 4 ? (hands ? 'happy' : 'sad') : phase === 0 ? 'happy' : 'think';

  return (
    <Scene
      caption={caption}
      tone={phase === 4 ? (hands ? 'ok' : 'bad') : undefined}
      step={phase === 0 ? undefined : hands ? phase : phase === 4 ? 2 : 1}
      controls={
        <>
          {menu.length > 1 && (
            <Choice
              label="Ask about"
              value={jobId}
              onChange={(id) => {
                reset();
                setJobId(id);
              }}
              options={menu.map((j) => ({ id: j.id, label: j.chip }))}
            />
          )}
          <Toggle
            on={hands}
            onChange={(v) => {
              reset();
              setHands(v);
            }}
          >
            ✋ Hands
          </Toggle>
          <Btn onClick={ask} disabled={busy} pulse={phase === 0}>
            {phase === 4 ? '↺ Ask again' : '▶ Ask Ray'}
          </Btn>
        </>
      }
    >
      <Draw>
        <Arrow from={[30, 26]} to={[66, 24]} bend={-3} p={{ from: [28, 50], to: [58, 47] }} flow={phase === 2} off={phase !== 2} />
        <Arrow from={[66, 34]} to={[30, 36]} bend={-3} p={{ from: [58, 73], to: [28, 76] }} flow={phase === 3} off={phase !== 3} color="var(--good)" />
      </Draw>

      <At x={32} y={6.500} w={54} p={{ x: 50, y: 8, w: 88 }}>
        <Bubble who="you" key={job.id}>
          {job.ask}
        </Bubble>
      </At>
      <At x={18} y={31} p={{ x: 17, y: 61 }}>
        <MiniRay mood={mood} size={5.800} />
      </At>
      <At x={25.500} y={21} p={{ x: 42, y: 34 }} hide={phase !== 1} z={3}>
        <span className="k-thought">
          <StepTag n={1} now /> 🤔 I need {hands ? 'a tool' : 'help'}…
        </span>
      </At>

      <At x={80} y={29} w={26} p={{ x: 77, y: 61, w: 40 }} style={{ opacity: hands ? 1 : 0.25 }}>
        <Card className={`k-center${phase === 2 || phase === 3 ? ' k-glow' : ''}`} tone={phase === 3 ? 'ok' : undefined} soft={!hands}>
          <Pic size={3}>{job.icon}</Pic>
          <span className="k-title">{job.tool}</span>
          <small>{hands ? 'in Ray’s hand' : 'switched off'}</small>
        </Card>
      </At>

      <At x={phase >= 2 ? 62 : 32} y={21} p={{ x: phase >= 2 ? 60 : 32, y: 40 }} hide={phase !== 2} z={3} slow style={{ fontSize: '1.2em' }}>
        <Tag>
          <StepTag n={2} now /> 🧾 {job.order}
        </Tag>
      </At>
      <At x={phase >= 3 ? 34 : 64} y={39.500} p={{ x: phase >= 3 ? 36 : 64, y: 84 }} hide={phase !== 3} z={3} slow style={{ fontSize: '1.2em' }}>
        <Tag tone="ok">
          <StepTag n={3} now /> 📦 {job.result}
        </Tag>
      </At>

      <At x={40} y={49} w={62} p={{ x: 50, y: 114, w: 90 }} hide={phase < 4}>
        <Bubble who="ray" tone={hands ? 'ok' : 'bad'} key={`${job.id}${hands}`}>
          <StepTag n={hands ? 4 : 2} corner now />
          {hands ? job.answer : job.guess}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How a tool call works: the brain writes an order slip. Your program does the work.
// ─────────────────────────────────────────────────────────────────────────────

const SLIP_STEPS = [
  { at: 0, caption: 'You ask a question. The brain also gets a menu of the tools it may order.' },
  { at: 0, caption: 'The brain does not answer. It writes an order slip: which tool, and with what.' },
  { at: 1, caption: 'Your program reads the slip. It checks it, then calls the real tool.' },
  { at: 2, caption: 'The tool does the job. The result travels back through your program.' },
  { at: 0, caption: 'The brain reads the result and writes the answer. It never touched the tool itself.' },
];
const LANES = [
  { x: 17, icon: '🧠', name: 'The brain', sub: 'only writes' },
  { x: 50, icon: '🧑‍💻', name: 'Your program', sub: 'is in charge' },
  { x: 83, icon: '🌦️', name: 'The tool', sub: 'does the job' },
];

/** Who acts at each step, so every lane can show the numbers of its own turns. */
const SLIP_TURNS = SLIP_STEPS.map((st) => [`${st.at}`]);

function OrderSlip() {
  const s = useSteps(SLIP_STEPS.length);
  const slipX = [17, 17, 50, 83, 17][s.i];
  // On the tall (phone) stage the brain, the program and the tool stand one under the other.
  const slipY = [38, 38, 68, 98, 38][s.i];
  return (
    <Scene caption={SLIP_STEPS[s.i].caption} tone={s.atEnd ? 'ok' : undefined} step={s.i + 1} controls={<StepNav s={s} />}>
      <Draw>
        <Arrow from={[26, 24]} to={[41, 24]} p={{ from: [22, 49], to: [22, 57] }} flow={s.i === 2} off={s.i !== 2} />
        <Arrow from={[59, 24]} to={[74, 24]} p={{ from: [22, 79], to: [22, 87] }} flow={s.i === 2} off={s.i !== 2} />
        <Arrow from={[74, 32]} to={[59, 32]} p={{ from: [36, 87], to: [36, 79] }} flow={s.i === 3} off={s.i !== 3} color="var(--good)" />
        <Arrow from={[41, 32]} to={[26, 32]} p={{ from: [36, 57], to: [36, 49] }} flow={s.i === 3 || s.i === 4} off={s.i < 3} color="var(--good)" />
      </Draw>
      <At x={30} y={6} w={46} p={{ x: 41, y: 7, w: 74 }}>
        <Bubble who="you">What's the weather in Paris?</Bubble>
      </At>
      <At x={80} y={6} p={{ x: 50, y: 20 }} hide={s.i > 1}>
        <Tag>📋 menu: get_weather(city)</Tag>
      </At>
      {LANES.map((l, i) => (
        <At key={l.name} x={l.x} y={28} w={17} p={{ x: 29, y: 38 + i * 30, w: 44 }}>
          <Card className={`k-center lp-station${SLIP_STEPS[s.i].at === i ? ' is-on' : ''}`}>
            <StepTags tags={tagsFor(SLIP_TURNS, `${i}`, s.i)} current={s.i + 1} />
            <Pic size={2.200}>{l.icon}</Pic>
            <span className="k-title">{l.name}</span>
            <small>{l.sub}</small>
          </Card>
        </At>
      ))}

      <At x={slipX} y={45.500} w={s.i >= 3 ? 26 : 30} p={{ x: 77, y: slipY, w: 42 }} z={3} hide={s.i === 0} slow>
        <Card tone={s.i >= 3 ? 'ok' : undefined} className="k-mono os-slip" key={s.i >= 3 ? 'r' : 'o'}>
          <small>{s.i >= 3 ? (s.i === 4 ? 'the brain reads' : 'result') : 'order slip'}</small>
          {s.i >= 3 ? '"18°C, sunny"' : 'get_weather(city: "Paris")'}
        </Card>
      </At>
      <At x={62} y={47} w={40} p={{ x: 50, y: 122, w: 90 }} hide={!s.atEnd}>
        <Bubble who="ray" tone="ok">
          It is 18°C and sunny in Paris.
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Make your own tool: Ray picks tools by reading their labels.
// ─────────────────────────────────────────────────────────────────────────────

function ToolLabel() {
  const [clear, setClear] = useState(true);
  const [look, setLook] = useState(-1); // which tool Ray is reading
  const [picked, setPicked] = useState<'none' | 'yes' | 'no'>('none');
  const { run, stop, busy } = useRunner();

  const tools = [
    { icon: '🪴', name: 'water_plants', label: 'Waters the plants. Use when the soil is dry.' },
    { icon: '🥣', name: clear ? 'feed_cat' : 'tool_3', label: clear ? 'Gives the cat food. Use when the cat is hungry.' : 'does stuff' },
    { icon: '🚪', name: 'open_door', label: 'Opens the front door. Use when someone knocks.' },
  ];

  const ask = () =>
    run(async (sleep) => {
      setPicked('none');
      for (let i = 0; i < tools.length; i++) {
        setLook(i);
        await sleep(800);
      }
      setLook(-1);
      setPicked(clear ? 'yes' : 'no');
    });
  const flip = (v: boolean) => {
    stop();
    setClear(v);
    setLook(-1);
    setPicked('none');
  };
  // How many labels Ray has read so far. Each one keeps the number of its turn.
  const read = picked !== 'none' ? tools.length : look + 1;

  return (
    <Scene
      caption={
        picked === 'yes'
          ? 'The label said exactly when to use it. So Ray picked the right tool.'
          : picked === 'no'
            ? 'The tool works fine. But its label says “does stuff”, so Ray had no idea it could help.'
            : busy
              ? 'Ray reads the label on every tool…'
              : 'Ray cannot see inside a tool. It only reads the label. Ask Ray, then try a lazy label.'
      }
      tone={picked === 'yes' ? 'ok' : picked === 'no' ? 'bad' : undefined}
      step={picked !== 'none' ? tools.length + 1 : look >= 0 ? look + 1 : undefined}
      controls={
        <>
          <Toggle on={clear} onChange={flip}>
            🏷️ Clear label
          </Toggle>
          <Btn onClick={ask} disabled={busy} pulse={picked === 'none'}>
            {picked === 'none' ? '▶ Ask Ray' : '↺ Ask again'}
          </Btn>
        </>
      }
    >
      <At x={32} y={6.500} w={44} p={{ x: 50, y: 7, w: 78 }}>
        <Bubble who="you">My cat is hungry! 🐱</Bubble>
      </At>
      {tools.map((t, i) => {
        const mine = i === 1;
        const won = picked === 'yes' && mine;
        return (
          <At key={i} x={19 + i * 31} y={27} w={27} p={{ x: 50, y: 30 + i * 27, w: 90 }}>
            <div className={`tl-tool${look === i ? ' is-read' : ''}${won ? ' is-won' : ''}${mine && !clear ? ' is-lazy' : ''}`}>
              {i < read && <StepTag n={i + 1} corner now={look === i} />}
              <Pic size={2.400}>{t.icon}</Pic>
              <div className="tl-label">
                <b>{t.name}</b>
                <i>{t.label}</i>
              </div>
              {mine && <span className="tl-mine">the tool you made</span>}
            </div>
          </At>
        );
      })}
      <At x={14} y={48} p={{ x: 14, y: 115 }}>
        <MiniRay mood={picked === 'yes' ? 'happy' : picked === 'no' ? 'sad' : busy ? 'think' : 'happy'} size={4} />
      </At>
      <At x={50} y={48.500} w={56} p={{ x: 59, y: 115, w: 74 }} hide={picked === 'none'}>
        <Bubble who="ray" tone={picked === 'yes' ? 'ok' : 'bad'} key={picked}>
          <StepTag n={tools.length + 1} corner now />
          {picked === 'yes' ? 'I used feed_cat. The cat is eating! 😺' : 'None of my tools say anything about feeding a cat. Sorry!'}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP: the universal plug. One plug shape, so any tool fits any agent.
// ─────────────────────────────────────────────────────────────────────────────

const APPS = [
  { icon: '🤖', name: 'Ray' },
  { icon: '💻', name: 'Code editor' },
  { icon: '💬', name: 'Chat app' },
];
const PLUG_TOOLS = [
  { icon: '📁', name: 'Files' },
  { icon: '🐙', name: 'GitHub' },
  { icon: '🗄️', name: 'Database' },
  { icon: '📅', name: 'Calendar' },
  { icon: '✉️', name: 'Email' },
];
const CABLE = ['#ff8fd0', '#ffd75e', '#5fe3a1', '#5aa9ff', '#ff9f5a', '#c08cff', '#2fd6c5', '#ff6b6b', '#b8e986', '#8c9eff', '#f4a6ff', '#9be3ff', '#ffc38a', '#a0f0c0', '#d0b0ff'];

function Plug() {
  const [mcp, setMcp] = useState(false);
  const [n, setN] = useState(3);
  const tools = PLUG_TOOLS.slice(0, n);
  // On the tall (phone) stage the apps and the tools have more room between them, top to bottom.
  const tall = usePortrait();
  const hubY = tall ? 60 : 28;
  const gap = tall ? 18 : 9.500;
  const appY = (i: number) => (tall ? 34 + i * 26 : 14 + i * 14);
  const toolY = (i: number) => hubY - ((n - 1) * gap) / 2 + i * gap;
  const cables = mcp ? APPS.length + n : APPS.length * n;

  return (
    <Scene
      caption={
        mcp
          ? `With one plug shape, each app and each tool plugs in once. ${cables} plugs, and everything works with everything.`
          : `Without a shared plug, every app needs its own special cable to every tool. That is ${cables} cables to build.`
      }
      tone={mcp ? 'ok' : undefined}
      controls={
        <>
          <Toggle on={mcp} onChange={setMcp}>
            🔌 Universal plug
          </Toggle>
          <Btn kind="soft" onClick={() => setN((v) => (v >= PLUG_TOOLS.length ? 3 : v + 1))}>
            {n >= PLUG_TOOLS.length ? '↺ Back to three tools' : '＋ Add a tool'}
          </Btn>
        </>
      }
    >
      <Draw>
        {mcp ? (
          <>
            {APPS.map((_, i) => (
              <Arrow key={`a${i}`} from={[25, appY(i)]} to={[45, 28]} p={{ from: [33, appY(i)], to: [44, hubY] }} head={false} width={0.5} color="var(--c)" />
            ))}
            {tools.map((_, i) => (
              <Arrow key={`t${i}`} from={[55, 28]} to={[75, toolY(i)]} p={{ from: [56, hubY], to: [67, toolY(i)] }} head={false} width={0.5} color="var(--c)" />
            ))}
          </>
        ) : (
          APPS.flatMap((_, a) =>
            tools.map((__, t) => <Arrow key={`${a}-${t}`} from={[25, appY(a)]} to={[75, toolY(t)]} p={{ from: [33, appY(a)], to: [67, toolY(t)] }} bend={(a - 1) * 2 - (t - 1) * 1.500} head={false} width={0.4} dashed={(a + t) % 2 === 1} color={CABLE[a * 5 + t]} />),
          )
        )}
      </Draw>

      <At x={15} y={5} p={{ x: 18, y: 9 }}>
        <span className="k-small">apps</span>
      </At>
      <At x={85} y={5} p={{ x: 82, y: 9 }}>
        <span className="k-small">tools</span>
      </At>
      {APPS.map((a, i) => (
        <At key={a.name} x={15} y={appY(i)} w={20} p={{ x: 18, y: appY(i), w: 30 }}>
          <Card className="pg-node">
            <Pic size={1.600}>{a.icon}</Pic>
            <span>{a.name}</span>
          </Card>
        </At>
      ))}
      {tools.map((t, i) => (
        <At key={t.name} x={85} y={toolY(i)} w={20} p={{ x: 82, y: toolY(i), w: 30 }}>
          <Card className="pg-node k-pop">
            <Pic size={1.600}>{t.icon}</Pic>
            <span>{t.name}</span>
          </Card>
        </At>
      ))}
      <At x={50} y={28} p={{ y: hubY }} hide={!mcp}>
        <Card className="k-center pg-hub">
          <Pic size={2}>🔌</Pic>
          <span className="k-title">MCP</span>
        </Card>
      </At>
      <At x={50} y={50} p={{ y: 118 }}>
        <Tag tone={mcp ? 'ok' : 'warn'}>{mcp ? `${cables} standard plugs` : `${cables} special cables`}</Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skills: how-to cards. Ray reads the titles, and opens one only when it needs it.
// ─────────────────────────────────────────────────────────────────────────────

const HOWTO = [
  { id: 'cake', icon: '🎂', title: 'Bake a cake', steps: ['Mix flour, eggs and sugar.', 'Bake for 30 minutes.', 'Let it cool. Then ice it.'], extra: '📎 timer script' },
  { id: 'bike', icon: '🚲', title: 'Fix a bike chain', steps: ['Turn the bike upside down.', 'Hook the chain on the small gear.', 'Turn the pedal slowly.'], extra: '📎 parts list' },
  { id: 'slides', icon: '📊', title: 'Make a slideshow', steps: ['One idea per slide.', 'Big words, few words.', 'End with a question.'], extra: '📎 template' },
  { id: 'letter', icon: '✉️', title: 'Write a letter', steps: ['Say hello.', 'Say why you are writing.', 'Say thank you.'], extra: '📎 examples' },
];
const SKILL_JOBS = [
  { id: 'cake', label: '🎂 “Make a birthday cake”', open: 'cake', say: 'I opened my cake card. Step one: mix flour, eggs and sugar.' },
  { id: 'bike', label: '🚲 “My chain fell off”', open: 'bike', say: 'I opened my bike card. First, turn the bike upside down.' },
  { id: 'hi', label: '👋 “Hello!”', open: '', say: 'Hello! No card needed for that.' },
];

function HowToCards() {
  const [job, setJob] = useState('hi');
  const j = SKILL_JOBS.find((x) => x.id === job)!;
  const x = (i: number) => 14 + i * 24;
  return (
    <Scene
      caption={
        j.open
          ? 'Ray read the four titles, and opened only the card this job needs. The other three stayed shut.'
          : 'Ray carries four how-to cards, but only the titles are in its backpack. Give Ray a job.'
      }
      tone={j.open ? 'ok' : undefined}
      controls={<Choice label="Give Ray a job" value={job} onChange={setJob} options={SKILL_JOBS.map((s) => ({ id: s.id, label: s.label }))} />}
    >
      <At x={50} y={5} p={{ y: 5 }}>
        <span className="k-small">Ray's how-to cards</span>
      </At>
      {HOWTO.map((h, i) => {
        const open = j.open === h.id;
        return (
          <At key={h.id} x={x(i)} y={open ? 24 : 14.500} w={21} p={{ x: open ? 50 : i % 2 ? 73.500 : 26.500, y: open ? 66 : 16 + Math.floor(i / 2) * 13.500, w: open ? 84 : 45 }} z={open ? 3 : 1}>
            <div className={`hc-card${open ? ' is-open' : ''}`}>
              <span className="hc-top">
                <Pic size={1.500}>{h.icon}</Pic>
                <b>{h.title}</b>
              </span>
              {open ? (
                <ol className="k-pop">
                  {h.steps.map((st) => (
                    <li key={st}>{st}</li>
                  ))}
                  <em>{h.extra}</em>
                </ol>
              ) : (
                <i>closed</i>
              )}
            </div>
          </At>
        );
      })}
      <At x={12} y={48} p={{ x: 14, y: 100 }}>
        <MiniRay mood={j.open ? 'happy' : 'wink'} size={4} />
      </At>
      <At x={42} y={48.500} w={46} p={{ x: 59, y: 100, w: 74 }}>
        <Bubble who="ray" tone={j.open ? 'ok' : undefined} key={job}>
          {j.say}
        </Bubble>
      </At>
      <At x={84} y={48.500} w={26} p={{ x: 50, y: 121, w: 80 }}>
        <div className="hc-meter" style={{ '--f': j.open ? 0.34 : 0.1 } as CSSProperties}>
          <span>in the backpack</span>
          <i />
          <b>{j.open ? '4 titles + 1 open card' : '4 titles only'}</b>
        </div>
      </At>
    </Scene>
  );
}

register({ 'use-a-tool': UseATool, 'order-slip': OrderSlip, 'tool-label': ToolLabel, plug: Plug, 'how-to-cards': HowToCards });
