import { useState } from 'react';
import { useRunner, useSteps } from '../lib/hooks';
import { Arrow, At, Btn, Bubble, Card, Choice, Draw, MiniRay, Note, Pic, Scene, Slider, StepNav, StepTag, Tag, usePortrait, type P2 } from './kit';
import { register, type SceneProps } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Heart: the loop. Think. Do. Look. Again. Until the job is done.
// ─────────────────────────────────────────────────────────────────────────────

type Station = 'think' | 'do' | 'look';
interface Tick {
  at: Station;
  turn: number;
  text: string;
  icon: string;
  /** What this turn found out, for the notebook on the right. */
  found?: string;
}

const TURNS: Tick[][] = [
  [
    { at: 'think', turn: 1, icon: '💭', text: 'I need the weather.' },
    { at: 'do', turn: 1, icon: '🌦️', text: 'Use the weather tool.' },
    { at: 'look', turn: 1, icon: '👀', text: 'Sunny, 22°C.', found: '🌦️ Sunny, 22°C' },
  ],
  [
    { at: 'think', turn: 2, icon: '💭', text: 'Is the park open?' },
    { at: 'do', turn: 2, icon: '🔎', text: 'Use the search tool.' },
    { at: 'look', turn: 2, icon: '👀', text: 'Open until 8.', found: '🔎 Park open until 8' },
  ],
  [{ at: 'think', turn: 3, icon: '💡', text: 'I know enough. Done!' }],
];

const ORDER: Station[] = ['think', 'do', 'look'];
const POS: Record<Station, P2> = { think: [30, 15.500], do: [44, 39.500], look: [16, 39.500] };
/** The same triangle on the tall (phone) stage: bigger, in the middle, with the notebook under it. */
const POS_TALL: Record<Station, P2> = { think: [50, 27], do: [78, 60], look: [22, 60] };
const STATION: Record<Station, { icon: string; name: string }> = {
  think: { icon: '🧠', name: 'Think' },
  do: { icon: '✋', name: 'Do' },
  look: { icon: '👀', name: 'Look' },
};

function Loop({ variant }: SceneProps) {
  const [limit, setLimit] = useState(variant === 'limit' ? 1 : 3);
  const [t, setT] = useState(-1);
  const { run, stop, busy } = useRunner();

  const ticks = TURNS.slice(0, limit).flat();
  const ended = t >= ticks.length;
  const cur = t >= 0 && !ended ? ticks[t] : null;
  const found = ticks.slice(0, Math.min(t + 1, ticks.length)).filter((k) => k.found);

  const outcome =
    limit >= 3
      ? { text: 'Yes! It is sunny and the park is open. 🧺', tone: 'ok' as const, why: 'Job done, so the loop stops by itself.' }
      : limit === 2
        ? { text: 'Sunny, and the park is open. I think yes!', tone: 'ok' as const, why: 'Out of turns, but Ray had just enough.' }
        : { text: "It is sunny… but I ran out of turns before I could check the park.", tone: 'warn' as const, why: 'The limit stopped Ray early. Half an answer.' };

  const play = () =>
    run(async (sleep) => {
      setT(0);
      for (let i = 1; i <= ticks.length; i++) {
        await sleep(1500);
        setT(i);
      }
    });
  const reset = (n: number) => {
    stop();
    setLimit(n);
    setT(-1);
  };

  const caption = ended
    ? outcome.why
    : cur
      ? cur.at === 'think'
        ? `Turn ${cur.turn}. Think: “${cur.text}”`
        : cur.at === 'do'
          ? `Turn ${cur.turn}. Do: ${cur.text.toLowerCase()}`
          : `Turn ${cur.turn}. Look: “${cur.text}” Now around again.`
      : 'Ray works in a loop. Think, do, look. Then again. Press play and watch.';

  const tall = usePortrait();
  const pos = tall ? POS_TALL : POS;
  const marker: P2 = cur ? pos[cur.at] : ended ? (tall ? [50, 77] : [57, 15.500]) : pos.think;

  return (
    <Scene
      caption={caption}
      tone={ended ? outcome.tone : undefined}
      step={cur ? ORDER.indexOf(cur.at) + 1 : undefined}
      controls={
        <>
          <Slider label="Most turns" min={1} max={3} value={limit} onChange={reset} show={limit} />
          {ended ? (
            <Btn onClick={() => setT(-1)}>↺ Again</Btn>
          ) : (
            <Btn onClick={play} disabled={busy} pulse={t < 0}>
              ▶ Run the loop
            </Btn>
          )}
        </>
      }
    >
      <Draw>
        <Arrow from={[35.500, 18]} to={[43, 34]} bend={-4} p={{ from: [59, 31], to: [76, 50] }} flow={cur?.at === 'think'} off={cur?.at !== 'think' && !!cur} />
        <Arrow from={[38, 41]} to={[22, 41]} bend={-3} p={{ from: [68, 64], to: [32, 64] }} flow={cur?.at === 'do'} off={cur?.at !== 'do' && !!cur} />
        <Arrow from={[17, 34]} to={[24.500, 18]} bend={-4} p={{ from: [24, 50], to: [41, 31] }} flow={cur?.at === 'look'} off={cur?.at !== 'look' && !!cur} />
        <Arrow from={[36.500, 14.500]} to={[58, 14.500]} p={{ from: [50, 70], to: [50, 83] }} dashed off={!ended} color="var(--good)" />
      </Draw>

      <At x={30} y={5} p={{ x: 50, y: 7 }}>
        <Bubble who="you">Is today a good day for a picnic?</Bubble>
      </At>

      {(Object.keys(POS) as Station[]).map((s) => (
        <At key={s} x={pos[s][0]} y={pos[s][1]} p={{ y: pos[s][1] }}>
          <Card className={`lp-station${cur?.at === s ? ' is-on' : ''}`}>
            <StepTag n={ORDER.indexOf(s) + 1} corner now={cur?.at === s} />
            <Pic size={1.900}>{STATION[s].icon}</Pic>
            <span className="k-title">{STATION[s].name}</span>
          </Card>
        </At>
      ))}

      {/* the middle of the loop shows what is happening right now */}
      <At x={30} y={30.500} w={21} p={{ x: 50, y: 48, w: 36 }}>
        <div className="lp-now" key={t}>
          {cur ? (
            <>
              <Pic size={1.700}>{cur.icon}</Pic>
              <span>{cur.text}</span>
            </>
          ) : (
            <span className="k-muted">{ended ? 'stopped' : 'ready'}</span>
          )}
        </div>
      </At>
      <At x={marker[0]} y={marker[1] - 5.200} z={4} p={{ y: marker[1] - 10 }}>
        <span className="lp-heart">❤️</span>
      </At>
      <At x={30} y={51.500} p={{ x: 22, y: 78 }}>
        <Tag tone={ended && limit < 3 ? 'warn' : 'info'}>
          turn {cur ? cur.turn : ended ? Math.min(limit, 3) : 0} of {limit} allowed
        </Tag>
      </At>

      <At x={78} y={12} p={{ x: 50, y: 88 }}>
        <span className="k-small">Ray's notebook</span>
      </At>
      {[0, 1].map((i) => (
        <At key={i} x={78} y={19.500 + i * 7.500} w={36} hide={!found[i]} p={{ x: 26.500 + i * 47, y: 98, w: 45 }}>
          <Card>
            <small>turn {i + 1}</small>
            {found[i]?.found ?? TURNS[i][2].found}
          </Card>
        </At>
      ))}
      <At x={78} y={41} w={38} hide={!ended} p={{ x: 43, y: 119, w: 80 }}>
        <Bubble who="ray" tone={outcome.tone}>
          {outcome.text}
        </Bubble>
      </At>
      <At x={93} y={50.500} hide={!ended} p={{ x: 92, y: 120 }}>
        <MiniRay mood={outcome.tone === 'ok' ? 'happy' : 'sad'} size={2.600} />
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One run, start to finish: every stop a message makes inside Ray.
// ─────────────────────────────────────────────────────────────────────────────

const STOPS: Array<{ icon: string; name: string; builder: string; caption: string }> = [
  { icon: '📨', name: 'Hear', builder: 'Input arrives. The session is loaded.', caption: 'Your message arrives. Ray opens the right conversation.' },
  { icon: '🛡️', name: 'Check', builder: 'Pre-hooks and input guardrails.', caption: 'First, a safety check. Is the message okay?' },
  { icon: '🎒', name: 'Pack', builder: 'Build the context: instructions, history, memories, knowledge, tools.', caption: 'Ray packs the backpack. Everything the brain will need.' },
  { icon: '🧠', name: 'Think', builder: 'Call the model.', caption: 'The brain thinks. It can answer, or ask for a tool.' },
  { icon: '✋', name: 'Do', builder: 'Run the tool. Add the result. Call the model again.', caption: 'The hands use a tool. The result goes back to the brain. Round and round, until the job is done.' },
  { icon: '🔍', name: 'Check', builder: 'Post-hooks and output guardrails.', caption: 'The answer gets checked before anybody sees it.' },
  { icon: '💾', name: 'Save', builder: 'Store the run, the session and new memories.', caption: 'Ray saves what happened, so it can remember next time.' },
  { icon: '📤', name: 'Answer', builder: 'Return or stream the result.', caption: 'The answer goes back to you. One run, start to finish.' },
];

function RunTrack() {
  const s = useSteps(STOPS.length);
  const x = (i: number) => 8 + i * 12;
  // On the tall (phone) stage the track snakes: four stops across, then four back.
  // That puts Do right under Think, so the loop between them is easy to see.
  const tx = (i: number) => (i < 4 ? 14 + i * 24 : 86 - (i - 4) * 24);
  const ty = (i: number) => (i < 4 ? 32 : 72);
  const leg = (i: number): { from: P2; to: P2 } =>
    i === 3
      ? { from: [82, 43], to: [82, 61] }
      : i < 3
        ? { from: [tx(i) + 8.500, 32], to: [tx(i + 1) - 8.500, 32] }
        : { from: [tx(i) - 8.500, 72], to: [tx(i + 1) + 8.500, 72] };
  return (
    <Scene caption={STOPS[s.i].caption} tone={s.atEnd ? 'ok' : undefined} step={s.i + 1} controls={<StepNav s={s} />}>
      <Draw>
        {STOPS.slice(0, -1).map((_, i) => (
          <Arrow key={i} from={[x(i) + 4.300, 21]} to={[x(i + 1) - 4.300, 21]} p={leg(i)} off={i >= s.i} flow={i === s.i - 1} width={0.38} />
        ))}
        {/* the loop between thinking and doing */}
        <Arrow from={[x(4), 28]} to={[x(3), 28]} bend={-5} p={{ from: [90, 61], to: [90, 43], bend: 4 }} dashed={s.i !== 4} flow={s.i === 4} off={s.i < 3} color="#ff6b6b" />
        <Note at={[(x(3) + x(4)) / 2, 36.500]} p={[77, 53]} anchor="end" size={1.700} color="#ff8f8f" dim={s.i < 3}>
          the loop
        </Note>
      </Draw>
      <At x={50} y={6.500} p={{ y: 8 }}>
        <span className="k-label">One message. Eight stops.</span>
      </At>
      {STOPS.map((st, i) => (
        <At key={i} x={x(i)} y={21} p={{ x: tx(i), y: ty(i) }}>
          <button className={`rt-stop${i === s.i ? ' is-on' : i < s.i ? ' is-done' : ''}`} onClick={() => s.go(i)} aria-label={`Stop ${i + 1}: ${st.name}`}>
            <StepTag n={i + 1} corner now={i === s.i} todo={i > s.i} />
            <Pic size={1.700}>{st.icon}</Pic>
            <span>{st.name}</span>
          </button>
        </At>
      ))}
      <At x={x(s.i)} y={12.500} z={3} p={{ x: tx(s.i), y: ty(s.i) - 12.500 }}>
        <span className="lp-heart">✉️</span>
      </At>
      <At x={50} y={46} w={72} p={{ y: 108, w: 90 }}>
        <Card key={s.i} className="k-pop">
          <small>
            stop {s.i + 1} of {STOPS.length} · builders say
          </small>
          {STOPS[s.i].builder}
        </Card>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// When things go wrong: try again, wait a bit longer each time, then use a backup.
// ─────────────────────────────────────────────────────────────────────────────

type Plan = 'none' | 'retry' | 'backup';
type World = 'flaky' | 'down';

function Retry() {
  const [plan, setPlan] = useState<Plan>('retry');
  const [world, setWorld] = useState<World>('flaky');
  const [tries, setTries] = useState<Array<'bad' | 'ok'>>([]);
  const [trying, setTrying] = useState(false);
  const [end, setEnd] = useState<'none' | 'ok' | 'backup' | 'fail'>('none');
  const { run, stop, busy } = useRunner();

  const reset = () => {
    stop();
    setTries([]);
    setTrying(false);
    setEnd('none');
  };

  const go = () =>
    run(async (sleep) => {
      setTries([]);
      setEnd('none');
      const max = plan === 'none' ? 1 : 3;
      for (let i = 0; i < max; i++) {
        setTrying(true);
        await sleep(900);
        setTrying(false);
        const ok = world === 'flaky' && i === 2;
        setTries((a) => [...a, ok ? 'ok' : 'bad']);
        if (ok) {
          await sleep(500);
          setEnd('ok');
          return;
        }
        await sleep(i < max - 1 ? 600 + i * 500 : 500);
      }
      if (plan === 'backup') {
        setTrying(true);
        await sleep(900);
        setTrying(false);
        setEnd('backup');
      } else setEnd('fail');
    });

  const WAITS = ['wait 1s', 'wait 2s', 'wait 4s'];
  const caption =
    end === 'ok'
      ? 'Third time lucky! Waiting a little longer each time gave the tool a chance to wake up.'
      : end === 'backup'
        ? 'Still broken after three tries. So Ray used its backup, and the job got done.'
        : end === 'fail'
          ? plan === 'none'
            ? 'One try, one failure, and Ray gave up. A retry would have helped.'
            : 'Three tries, all failed, and there is no backup. Ray has to say sorry.'
          : busy
            ? 'Ray calls the tool…'
            : 'Tools break sometimes. Pick a plan, then press go.';

  const answer = end === 'ok' ? 'Got it! 18°C and sunny.' : end === 'backup' ? 'The backup says: 18°C and sunny.' : "Sorry. I couldn't check the weather.";

  return (
    <Scene
      caption={caption}
      tone={end === 'ok' || end === 'backup' ? 'ok' : end === 'fail' ? 'bad' : undefined}
      step={end === 'backup' ? 4 : tries.length + (trying && tries.length < 3 ? 1 : 0) || (trying ? 4 : undefined)}
      controls={
        <>
          <Choice<World>
            label="The weather tool is"
            value={world}
            onChange={(w) => {
              reset();
              setWorld(w);
            }}
            options={[
              { id: 'flaky', label: '🤧 Sleepy tool' },
              { id: 'down', label: '💀 Broken tool' },
            ]}
          />
          <Choice<Plan>
            label="Ray's plan"
            value={plan}
            onChange={(p) => {
              reset();
              setPlan(p);
            }}
            options={[
              { id: 'none', label: 'Give up' },
              { id: 'retry', label: 'Try 3 times' },
              { id: 'backup', label: '3 times + backup' },
            ]}
          />
          <Btn onClick={go} disabled={busy} pulse={end === 'none'}>
            ▶ Go
          </Btn>
        </>
      }
    >
      <Draw>
        <Arrow from={[21, 26]} to={[70, 17]} bend={-3} p={{ from: [24, 43], to: [42, 24] }} flow={trying && end === 'none' && tries.length < (plan === 'none' ? 1 : 3)} off={!trying || tries.length >= 3} />
        <Arrow from={[21, 32]} to={[70, 42]} bend={3} p={{ from: [24, 62], to: [42, 82] }} flow={trying && tries.length >= 3} off={!(trying && tries.length >= 3) && end !== 'backup'} color="var(--good)" dashed={plan !== 'backup'} />
      </Draw>

      <At x={13} y={29} p={{ x: 16, y: 52 }}>
        <MiniRay mood={end === 'fail' ? 'sad' : end === 'none' ? (busy ? 'think' : 'happy') : 'happy'} size={5.400} />
      </At>

      <At x={80} y={17} w={26} p={{ x: 68, y: 20, w: 50 }}>
        <Card tone={end === 'ok' ? 'ok' : tries.length ? 'bad' : undefined} className={tries.length && end !== 'ok' && !trying ? 'k-shake' : ''} key={tries.length}>
          <div className="k-center">
            <Pic size={2.200}>{world === 'flaky' ? (end === 'ok' ? '🌤️' : '😴') : '💥'}</Pic>
            <span className="k-title">Weather tool</span>
            <small>{end === 'ok' ? 'awake now' : world === 'flaky' ? 'slow to wake up' : 'out of order'}</small>
          </div>
        </Card>
      </At>
      <At x={80} y={42} w={26} p={{ x: 68, y: 86, w: 50 }} style={{ opacity: plan === 'backup' ? 1 : 0.28 }}>
        <Card tone={end === 'backup' ? 'ok' : undefined} soft={plan !== 'backup'}>
          {plan === 'backup' && <StepTag n={4} corner now={trying && tries.length >= 3} todo={end !== 'backup' && !(trying && tries.length >= 3)} />}
          <div className="k-center">
            <Pic size={1.900}>🛰️</Pic>
            <span className="k-title">Backup tool</span>
            <small>{plan === 'backup' ? 'ready, just in case' : 'not part of the plan'}</small>
          </div>
        </Card>
      </At>

      {[0, 1, 2].map((i) => {
        const max = plan === 'none' ? 1 : 3;
        return (
          <At key={i} x={37 + i * 11} y={31} hide={i >= max} p={{ x: 46 + i * 18, y: 53 }}>
            <div className={`rt-try${tries[i] ? ` is-${tries[i]}` : ''}`}>
              <StepTag n={i + 1} corner now={trying && tries.length === i} todo={!tries[i] && !(trying && tries.length === i)} />
              <b>{tries[i] === 'ok' ? '✓' : tries[i] === 'bad' ? '✕' : '…'}</b>
              <i>{tries[i] === 'bad' && i < max - 1 ? WAITS[i] : `try ${i + 1}`}</i>
            </div>
          </At>
        );
      })}

      <At x={30} y={47.500} w={44} hide={end === 'none'} p={{ x: 50, y: 119, w: 92 }}>
        <Bubble who="ray" tone={end === 'fail' ? 'bad' : 'ok'}>
          {answer}
        </Bubble>
      </At>
    </Scene>
  );
}

register({ loop: Loop, 'run-track': RunTrack, retry: Retry });
