import { useState } from 'react';
import { useRunner } from '../lib/hooks';
import { At, Btn, Bubble, Card, Choice, Draw, MiniRay, Pic, Scene, StepTag, Tag, Toggle, type P2 } from './kit';
import { register } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge graph: facts joined by threads. Ray walks from one to the next.
// ─────────────────────────────────────────────────────────────────────────────

const DOTS: Record<string, { icon: string; name: string; at: P2 }> = {
  mia: { icon: '🧒', name: 'Mia', at: [10, 31] },
  lee: { icon: '👨‍🏫', name: 'Mr Lee', at: [31, 15] },
  class: { icon: '🏫', name: 'Class 2B', at: [31, 46] },
  bo: { icon: '🐶', name: 'Bo', at: [54, 15] },
  park: { icon: '🌳', name: 'The park', at: [54, 46] },
};
const THREADS: Array<{ a: string; b: string; label: string; at: P2 }> = [
  { a: 'mia', b: 'lee', label: 'is taught by', at: [14.500, 20.500] },
  { a: 'mia', b: 'class', label: 'is in', at: [17, 42.500] },
  { a: 'lee', b: 'bo', label: 'owns', at: [42.500, 12.800] },
  { a: 'bo', b: 'park', label: 'walks in', at: [59.500, 31] },
];
type GraphQ = 'dog' | 'walk';
const GRAPH_Q: Record<GraphQ, { chip: string; ask: string; path: string[]; answer: string }> = {
  dog: { chip: '🐶 Whose dog?', ask: "Who is the dog of Mia's teacher?", path: ['mia', 'lee', 'bo'], answer: 'Bo! Mia is taught by Mr Lee, and Mr Lee owns Bo.' },
  walk: { chip: '🌳 Where?', ask: "Where does the dog of Mia's teacher go for walks?", path: ['mia', 'lee', 'bo', 'park'], answer: 'In the park. From Mia to Mr Lee, to Bo, to the park.' },
};

function Graph() {
  const [q, setQ] = useState<GraphQ>('dog');
  const [threads, setThreads] = useState(true);
  const [hop, setHop] = useState(-1);
  const { run, stop, busy } = useRunner();
  const g = GRAPH_Q[q];
  const done = hop >= g.path.length;

  const reset = () => {
    stop();
    setHop(-1);
  };
  const go = () =>
    run(async (sleep) => {
      if (!threads) {
        setHop(0);
        await sleep(900);
        setHop(99);
        return;
      }
      for (let i = 0; i < g.path.length; i++) {
        setHop(i);
        await sleep(950);
      }
      setHop(g.path.length);
    });

  const visited = (id: string) => (threads ? g.path.indexOf(id) !== -1 && g.path.indexOf(id) <= hop : hop >= 0 && (id === g.path[0] || id === g.path[g.path.length - 1]));
  const lit = (t: (typeof THREADS)[number]) => {
    const i = g.path.indexOf(t.a);
    return threads && i !== -1 && g.path[i + 1] === t.b && hop >= i + 1;
  };

  return (
    <Scene
      caption={
        hop < 0
          ? threads
            ? 'Every fact is a dot, and the dots are joined by threads. Ask, and watch Ray follow them.'
            : 'The threads are gone. Now each fact sits alone on its own page. Ask anyway.'
          : !threads
            ? 'Ray found a page about Mia and a page about the answer. But nothing says how they are joined.'
            : done
              ? `Ray followed ${g.path.length - 1} threads, one after another, and joined the dots.`
              : 'One thread at a time…'
      }
      tone={hop < 0 ? undefined : !threads ? 'bad' : done ? 'ok' : undefined}
      step={threads && hop >= 0 ? Math.min(hop, g.path.length) + 1 : undefined}
      controls={
        <>
          <Choice<GraphQ>
            label="Ask"
            value={q}
            onChange={(v) => {
              reset();
              setQ(v);
            }}
            options={(Object.keys(GRAPH_Q) as GraphQ[]).map((id) => ({ id, label: GRAPH_Q[id].chip }))}
          />
          <Toggle
            on={threads}
            onChange={(v) => {
              reset();
              setThreads(v);
            }}
          >
            🪢 Threads
          </Toggle>
          <Btn onClick={go} disabled={busy} pulse={hop < 0}>
            {hop >= 0 && !busy ? '↺ Ask again' : '▶ Ask Ray'}
          </Btn>
        </>
      }
    >
      <Draw>
        {THREADS.map((t) => {
          const a = DOTS[t.a].at;
          const b = DOTS[t.b].at;
          const on = lit(t);
          return (
            <g key={t.a + t.b} opacity={threads ? 1 : 0.06}>
              <line className={`gr-thread${on ? ' is-on' : ''}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
              <text x={t.at[0]} y={t.at[1]} textAnchor="middle" fontSize="1.500" opacity={on ? 1 : 0.6}>
                {t.label}
              </text>
            </g>
          );
        })}
      </Draw>
      {Object.entries(DOTS).map(([id, d]) => (
        <At key={id} x={d.at[0]} y={d.at[1]} z={2}>
          <div className={`gr-dot${visited(id) ? ' is-on' : ''}`}>
            {threads && visited(id) && <StepTag n={g.path.indexOf(id) + 1} corner now={g.path[hop] === id} />}
            <Pic size={1.900}>{d.icon}</Pic>
            <span>{d.name}</span>
          </div>
        </At>
      ))}

      <At x={82} y={7} w={32}>
        <Bubble who="you" key={q}>
          {g.ask}
        </Bubble>
      </At>
      <At x={84} y={43}>
        <MiniRay mood={hop < 0 ? 'happy' : !threads ? 'sad' : done ? 'happy' : 'think'} size={4.600} />
      </At>
      <At x={82} y={26} w={32} hide={!(done || (!threads && hop > 0))}>
        <Bubble who="ray" tone={threads ? 'ok' : 'bad'} key={`${q}${threads}`}>
          {threads && <StepTag n={g.path.length + 1} corner now />}
          {threads ? g.answer : 'I found Mia. I found the answer page too. But I cannot tell how they are linked.'}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Corrective RAG: before answering, check whether the pages are any good.
// ─────────────────────────────────────────────────────────────────────────────

type GradeQ = 'giraffe' | 'race';
const GRADE: Record<GradeQ, { chip: string; ask: string; pages: Array<[string, boolean]>; careless: string; carelessTone: 'warn' | 'bad'; careful: string; web?: string }> = {
  giraffe: {
    chip: '🦒 In the library',
    ask: 'How tall is a giraffe?',
    pages: [
      ['🦒 Giraffes are 5 metres tall', true],
      ['🐧 Penguins cannot fly', false],
      ['🚂 Trains run on rails', false],
    ],
    careless: 'About 5 metres. Also, penguins cannot fly, and trains run on rails?',
    carelessTone: 'warn',
    careful: 'About 5 metres.',
  },
  race: {
    chip: '🏁 Not in the library',
    ask: 'Who won the school race yesterday?',
    pages: [
      ['🦒 Giraffes run fast', false],
      ['🐎 Horses like to race', false],
      ['🏁 A race has a finish line', false],
    ],
    careless: 'A giraffe won! It says here that giraffes run fast.',
    carelessTone: 'bad',
    careful: 'Mia won! The library did not know, so I looked on the web.',
    web: '🌐 School news: Mia wins the race',
  },
};

function GradePages() {
  const [q, setQ] = useState<GradeQ>('race');
  const [grading, setGrading] = useState(true);
  const [phase, setPhase] = useState(0); // 0 waiting · 1 pages arrive · 2 graded · 3 look elsewhere · 4 answer
  const { run, stop, busy } = useRunner();
  const g = GRADE[q];
  const done = phase === 4;
  const answerStep = grading ? (g.web ? 4 : 3) : 2;

  const reset = () => {
    stop();
    setPhase(0);
  };
  const go = () =>
    run(async (sleep) => {
      setPhase(1);
      await sleep(1300);
      if (grading) {
        setPhase(2);
        await sleep(1500);
        if (g.web) {
          setPhase(3);
          await sleep(1500);
        }
      }
      setPhase(4);
    });

  return (
    <Scene
      caption={
        done
          ? grading
            ? g.web
              ? 'None of the pages helped, and Ray noticed. So it looked somewhere else, and found the answer.'
              : 'Ray kept the one good page and threw the other two away. A clean answer.'
            : g.web
              ? 'Ray did not check its pages. It built an answer out of nonsense, and sounded sure about it.'
              : 'Ray used every page it was given, even the ones about penguins and trains.'
          : phase === 3
            ? 'No good pages. Ray looks somewhere else.'
            : phase === 2
              ? 'Ray reads each page and asks: does this help with the question?'
              : phase === 1
                ? 'The library hands Ray three pages.'
                : 'The library does not always hand over the right pages. Ask, and see what Ray does with them.'
      }
      tone={done ? (grading ? 'ok' : g.carelessTone) : undefined}
      step={phase === 0 ? undefined : done ? answerStep : phase}
      controls={
        <>
          <Choice<GradeQ>
            label="Question"
            value={q}
            onChange={(v) => {
              reset();
              setQ(v);
            }}
            options={(Object.keys(GRADE) as GradeQ[]).map((id) => ({ id, label: GRADE[id].chip }))}
          />
          <Toggle
            on={grading}
            onChange={(v) => {
              reset();
              setGrading(v);
            }}
          >
            🔬 Check the pages
          </Toggle>
          <Btn onClick={go} disabled={busy} pulse={phase === 0}>
            {done ? '↺ Ask again' : '▶ Ask Ray'}
          </Btn>
        </>
      }
    >
      <At x={32} y={7} w={50}>
        <Bubble who="you" key={q}>
          {g.ask}
        </Bubble>
      </At>
      <At x={12} y={34}>
        <MiniRay mood={done ? (grading ? 'happy' : 'oops') : phase >= 2 ? 'think' : 'happy'} size={5} />
      </At>

      {g.pages.map(([text, ok], i) => {
        const graded = grading && phase >= 2;
        return (
          <At key={`${q}${i}`} x={46} y={19 + i * 8} w={40} hide={phase < 1} delay={phase === 1 ? i * 150 : 0}>
            <div className={`sm-doc gp-page${graded ? (ok ? ' is-good' : ' is-bad') : ''}`}>
              <b>{graded ? (ok ? '✓' : '✕') : '?'}</b>
              <span>{text}</span>
            </div>
          </At>
        );
      })}
      <At x={26} y={16.200} z={4} hide={phase < 1}>
        <StepTag n={1} now={phase === 1} />
      </At>
      <At x={46} y={44} w={40} hide={!(grading && g.web && phase >= 3)}>
        <div className="sm-doc gp-page is-good">
          <StepTag n={3} corner now={phase === 3} />
          <b>✓</b>
          <span>{g.web}</span>
        </div>
      </At>
      <At x={82} y={19}>
        <span className="k-small">
          {grading && phase >= 2 && <StepTag n={2} now={phase === 2} />} {grading ? 'checked first' : 'used as they come'}
        </span>
      </At>

      <At x={82} y={34} w={30} hide={!done}>
        <Bubble who="ray" tone={grading ? 'ok' : g.carelessTone} key={`${q}${grading}`}>
          <StepTag n={answerStep} corner now />
          {grading ? g.careful : g.careless}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust: say what you did, and let people steer.
// ─────────────────────────────────────────────────────────────────────────────

function GlassBox() {
  const [show, setShow] = useState(false);
  const [steer, setSteer] = useState(false);
  const [undone, setUndone] = useState(false);
  const hearts = 1 + Number(show) + Number(steer);

  return (
    <Scene
      caption={
        undone
          ? 'You pressed undo, and Ray put everything back. You were in charge the whole time.'
          : show && steer
            ? 'You can see what Ray did, and you can change it. That is a helper you can trust.'
            : show
              ? 'Now you can see what Ray did, and why. But you cannot change any of it.'
              : steer
                ? 'You can undo it. But you cannot see what you would be undoing.'
                : 'Ray did the job. But what exactly did it do? You just have to hope.'
      }
      tone={show && steer ? 'ok' : undefined}
      controls={
        <>
          <Toggle
            on={show}
            onChange={(v) => {
              setShow(v);
              setUndone(false);
            }}
          >
            🔦 Show what you did
          </Toggle>
          <Toggle
            on={steer}
            onChange={(v) => {
              setSteer(v);
              setUndone(false);
            }}
          >
            🎛️ Let me steer
          </Toggle>
        </>
      }
    >
      <At x={30} y={7} w={44}>
        <Bubble who="you">Book a table for dinner tonight.</Bubble>
      </At>
      <At x={13} y={34}>
        <MiniRay mood={undone ? 'wink' : 'happy'} size={5.200} />
      </At>

      <At x={52} y={30} w={50}>
        <Card className="gb-box" tone={show && steer ? 'ok' : undefined}>
          <span className="k-title">{undone ? '↩ Booking cancelled. Nothing was charged.' : '✅ Done. Your table is booked.'}</span>
          {show && !undone && (
            <ul className="k-pop">
              {['I looked at 3 places near you.', "I picked Luigi's. It is the closest, and open at 7.", "I booked a table for 2, at 7 o'clock."].map((did, k) => (
                <li key={did}>
                  <StepTag n={k + 1} /> {did}
                </li>
              ))}
            </ul>
          )}
          {!show && !undone && <span className="k-muted gb-dark">what happened inside? you cannot see</span>}
          {steer && !undone && (
            <div className="gb-steer k-pop">
              <Btn kind="soft" onClick={() => setUndone(true)}>
                ↩ Undo
              </Btn>
              <Btn kind="soft" onClick={() => setUndone(true)}>
                🕖 Change the time
              </Btn>
              <Btn kind="soft" onClick={() => setUndone(true)}>
                🧽 Forget this
              </Btn>
            </div>
          )}
        </Card>
      </At>

      <At x={88} y={26}>
        <div className="k-center">
          <span className="k-small">trust</span>
          <span className="gb-hearts">
            {[1, 2, 3].map((i) => (
              <i key={i} className={i <= hearts ? 'is-on' : ''}>
                {i <= hearts ? '💙' : '🤍'}
              </i>
            ))}
          </span>
        </div>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Signed receipts: a chain of sealed records. Change one, and the seal breaks.
// ─────────────────────────────────────────────────────────────────────────────

function Receipts() {
  const [tampered, setTampered] = useState(false);
  const [checked, setChecked] = useState(false);
  const slips = ['Read order 42', tampered ? 'Refund $200' : 'Refund $20', 'Email the customer'];
  const broken = (i: number) => checked && tampered && i >= 1;

  return (
    <Scene
      caption={
        checked
          ? tampered
            ? 'Caught! The seal on receipt 2 is broken, and so is the thread that tied it to receipt 3.'
            : 'Every seal is whole and every thread holds. Nobody touched the story.'
          : tampered
            ? 'Someone quietly changed the refund from $20 to $200. At a glance, it looks fine…'
            : 'Three actions, three sealed receipts. Each one is tied to the one before it.'
      }
      tone={checked ? (tampered ? 'bad' : 'ok') : undefined}
      controls={
        <>
          <Btn
            kind={tampered ? 'soft' : 'no'}
            onClick={() => {
              setTampered((t) => !t);
              setChecked(false);
            }}
          >
            {tampered ? '↺ Put it back' : '😈 Secretly change one'}
          </Btn>
          <Btn onClick={() => setChecked(true)} pulse={!checked}>
            🔎 Check the chain
          </Btn>
        </>
      }
    >
      <Draw>
        {[0, 1].map((i) => (
          <line key={i} className={`rc-link${broken(i + 1) ? ' is-broken' : checked ? ' is-ok' : ''}`} x1={27 + i * 30} y1={27} x2={43 + i * 30} y2={27} />
        ))}
      </Draw>
      <At x={50} y={7}>
        <span className="k-label">Ray's receipts, in order</span>
      </At>
      {slips.map((text, i) => (
        <At key={i} x={20 + i * 30} y={27} w={24}>
          <div className={`rc-slip${broken(i) ? ' is-broken' : checked ? ' is-ok' : ''}${i === 1 && tampered ? ' is-changed' : ''}`}>
            <StepTag n={i + 1} corner />
            <small>receipt</small>
            <b key={text} className={i === 1 && tampered ? 'k-shake' : ''}>
              {text}
            </b>
            <span className="rc-seal">{broken(i) ? '💔' : '🔏'}</span>
            <i>{checked ? (broken(i) ? (i === 1 ? 'seal broken' : 'thread broken') : 'seal whole') : 'sealed'}</i>
          </div>
        </At>
      ))}
      <At x={12} y={49}>
        <MiniRay mood={checked ? (tampered ? 'wow' : 'happy') : 'happy'} size={3.800} />
      </At>
      <At x={50} y={49} hide={!checked}>
        <Tag tone={tampered ? 'bad' : 'ok'}>{tampered ? 'somebody changed receipt 2' : 'nothing was changed'}</Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Online evaluation: let real people try two Rays, and count the thumbs.
// ─────────────────────────────────────────────────────────────────────────────

const THUMBS_A = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
const THUMBS_B = [1, 1, 1, 0, 1, 1, 1, 1, 1, 1];

function Thumbs() {
  const [n, setN] = useState(0);
  const { run, busy } = useRunner();
  const open = () =>
    run(async (sleep) => {
      setN(0);
      for (let i = 1; i <= THUMBS_A.length; i++) {
        await sleep(420);
        setN(i);
      }
    });
  const done = n >= THUMBS_A.length;
  const upA = THUMBS_A.slice(0, n).filter(Boolean).length;
  const upB = THUMBS_B.slice(0, n).filter(Boolean).length;

  const row = (label: string, sub: string, marks: number[], y: number, up: number, win: boolean) => (
    <>
      <At x={14} y={y} w={22}>
        <div className="k-center">
          <span className="k-title">{label}</span>
          <span className="k-small">{sub}</span>
        </div>
      </At>
      <At x={55} y={y} w={56}>
        <div className={`th-row${done && win ? ' is-win' : ''}`}>
          {marks.map((m, i) => (
            <span key={i} className={i < n ? 'k-pop' : 'is-empty'}>
              {i < n ? (m ? '👍' : '👎') : '·'}
            </span>
          ))}
        </div>
      </At>
      <At x={91} y={y}>
        <Tag tone={done ? (win ? 'ok' : 'warn') : 'info'}>{up} 👍</Tag>
      </At>
    </>
  );

  return (
    <Scene
      caption={
        done
          ? 'The new Ray got nine thumbs up, the old one six. Real people have decided. Now everybody gets Ray B.'
          : busy
            ? 'Real people, real questions. Some are happy, some are not…'
            : 'Half the visitors get the Ray we have today. Half get the new one. Open the doors and count the thumbs.'
      }
      tone={done ? 'ok' : undefined}
      controls={
        <Btn onClick={open} disabled={busy} pulse={n === 0}>
          {done ? '↺ Again' : '▶ Open the doors'}
        </Btn>
      }
    >
      <At x={50} y={7}>
        <span className="k-label">Ten visitors each. Who makes people happier?</span>
      </At>
      {row('Ray A', 'the one we have', THUMBS_A, 20, upA, false)}
      {row('Ray B', 'with a better job card', THUMBS_B, 37, upB, true)}
      <At x={50} y={50} hide={!done}>
        <Tag tone="ok">🏆 Ray B wins, 9 to 6</Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost control: three ways to save coins without making Ray worse.
// ─────────────────────────────────────────────────────────────────────────────

const SAVERS: Array<{ id: string; label: string; saves: number; how: string }> = [
  { id: 'small', label: '🐇 Small brain for easy jobs', saves: 4.500, how: 'Easy questions go to the small, cheap brain.' },
  { id: 'cache', label: '📋 Never answer twice', saves: 2, how: 'The same question gets the saved answer.' },
  { id: 'pack', label: '🎒 Lighter backpack', saves: 1.500, how: 'Fewer tools and shorter history to read.' },
];

function Piggy() {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const saved = SAVERS.reduce((a, s) => a + (on[s.id] ? s.saves : 0), 0);
  const coins = Math.round(10 - saved);
  const count = SAVERS.filter((s) => on[s.id]).length;

  return (
    <Scene
      caption={
        count === 0
          ? 'A hundred questions cost Ray ten coins. Switch on a saver and watch the pile.'
          : count < 3
            ? `${coins} coins now, and Ray still passes its test. Try the next saver.`
            : 'From ten coins down to two, and the answers are just as good. Cheaper means Ray can help more people.'
      }
      tone={count === 3 ? 'ok' : undefined}
      controls={
        <>
          {SAVERS.map((s) => (
            <Toggle key={s.id} on={!!on[s.id]} onChange={(v) => setOn((o) => ({ ...o, [s.id]: v }))}>
              {s.label}
            </Toggle>
          ))}
        </>
      }
    >
      <At x={20} y={26}>
        <div className="k-center">
          <Pic size={4.400}>🐷</Pic>
          <span className="k-title">{coins} coins</span>
          <span className="k-small">for 100 questions</span>
        </div>
      </At>
      <At x={52} y={22} w={36}>
        <div className="pg-coins">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < coins ? '' : 'is-saved'} />
          ))}
        </div>
      </At>
      {SAVERS.map((s, i) => (
        <At key={s.id} x={52} y={35 + i * 6} w={40} hide={!on[s.id]}>
          <div className="pg-how">
            <b>−{s.saves}</b> {s.how}
          </div>
        </At>
      ))}
      <At x={86} y={24}>
        <MiniRay mood={count === 3 ? 'happy' : 'wink'} size={4.600} />
      </At>
      <At x={86} y={40}>
        <Tag tone="ok">still passes its test ✓</Tag>
      </At>
    </Scene>
  );
}

register({ graph: Graph, 'grade-pages': GradePages, 'glass-box': GlassBox, receipts: Receipts, thumbs: Thumbs, piggy: Piggy });
