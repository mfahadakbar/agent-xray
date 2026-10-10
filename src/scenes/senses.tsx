import { useState, type CSSProperties } from 'react';
import { useRunner } from '../lib/hooks';
import { At, Btn, Bubble, Card, MiniRay, Pic, Scene, StepTag, Tag, Toggle, type Mood } from './kit';
import { register } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Senses: eyes and ears. Some brains only read words. Others can look and listen.
// ─────────────────────────────────────────────────────────────────────────────

type Thing = 'words' | 'picture' | 'sound' | 'file';

const THINGS: Array<{ id: Thing; icon: string; name: string; sees: string; blind: string }> = [
  { id: 'words', icon: '📝', name: 'Words', sees: 'You wrote: “My cat is called Momo.” Hello, Momo!', blind: 'You wrote: “My cat is called Momo.” Hello, Momo!' },
  { id: 'picture', icon: '🖼️', name: 'A picture', sees: 'I see an orange cat asleep on a blue sofa.', blind: "I can't see pictures. Can you tell me what is in it?" },
  { id: 'sound', icon: '🎵', name: 'A sound', sees: 'I hear a cat purring. It sounds happy.', blind: "I can't hear sounds. Can you write it down for me?" },
  { id: 'file', icon: '📄', name: 'A file', sees: 'It is a 12-page guide about looking after cats.', blind: "I can't open files by myself. A reader has to turn it into words first." },
];

/** On the tall (phone) stage the four things sit two by two above Ray. */
const thingAt = (i: number) => ({ x: i % 2 ? 73.500 : 26.500, y: 19 + Math.floor(i / 2) * 12, w: 45 });

function EyesEars() {
  const [multi, setMulti] = useState(true);
  const [got, setGot] = useState<Thing | null>(null);
  const [fly, setFly] = useState<{ id: Thing; there: boolean } | null>(null);
  const { run, busy } = useRunner();

  const give = (id: Thing) =>
    run(async (sleep) => {
      setGot(null);
      setFly({ id, there: false });
      await sleep(40);
      setFly({ id, there: true });
      await sleep(750);
      setFly(null);
      setGot(id);
    });

  const thing = THINGS.find((t) => t.id === got);
  const understood = thing ? multi || thing.id === 'words' : true;
  const mood: Mood = fly ? 'wow' : thing ? (understood ? 'happy' : 'sad') : 'happy';
  const caption = !thing
    ? 'Give Ray something. Words, a picture, a sound or a file.'
    : understood
      ? thing.id === 'words'
        ? 'Every brain can read words.'
        : `This brain can take in more than words. It understood ${thing.name.toLowerCase()}.`
      : `A words-only brain cannot use ${thing.name.toLowerCase()}. Something has to turn it into words first.`;

  return (
    <Scene
      caption={caption}
      tone={thing ? (understood ? 'ok' : 'warn') : undefined}
      controls={
        <Toggle on={multi} onChange={setMulti}>
          👀 Eyes and ears
        </Toggle>
      }
    >
      <At x={15} y={5.500} p={{ x: 50, y: 6 }}>
        <span className="k-label">Give Ray one of these</span>
      </At>
      {THINGS.map((t, i) => (
        <At key={t.id} x={15} y={14.500 + i * 10.300} w={22} p={thingAt(i)}>
          <button className={`ee-thing${got === t.id ? ' is-on' : ''}`} onClick={() => give(t.id)} disabled={busy}>
            <Pic size={1.900}>{t.icon}</Pic>
            <b>{t.name}</b>
          </button>
        </At>
      ))}

      {fly && (
        <At
          x={fly.there ? 50 : 15}
          y={fly.there ? 29 : 14.500 + THINGS.findIndex((t) => t.id === fly.id) * 10.300}
          z={5}
          p={fly.there ? { x: 50, y: 66 } : thingAt(THINGS.findIndex((t) => t.id === fly.id))}
          style={{ scale: fly.there ? '0.5' : '1', opacity: fly.there ? 0.2 : 1 }}
        >
          <Pic size={3}>{THINGS.find((t) => t.id === fly.id)!.icon}</Pic>
        </At>
      )}

      <At x={50} y={30} p={{ y: 66 }}>
        <MiniRay mood={mood} size={7} />
      </At>
      <At x={50} y={47} p={{ y: 86 }}>
        <Tag tone={multi ? 'ok' : 'warn'}>{multi ? 'can read, look and listen' : 'words-only brain'}</Tag>
      </At>

      <At x={81} y={29} w={32} hide={!thing} p={{ x: 50, y: 110, w: 90 }}>
        <Bubble who="ray" tone={understood ? 'ok' : 'warn'} key={`${got}${multi}`}>
          {thing ? (multi ? thing.sees : thing.blind) : ''}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured output: tidy boxes. A sentence becomes a filled-in form.
// ─────────────────────────────────────────────────────────────────────────────

const FIELDS: Array<{ key: string; label: string; said: string; value: string; color: string }> = [
  { key: 'name', label: 'Name', said: "Luigi's", value: "Luigi's", color: '#ff8fd0' },
  { key: 'address', label: 'Address', said: '5 Main Street', value: '5 Main Street', color: '#5aa9ff' },
  { key: 'closes_at', label: 'Closes at', said: 'nine at night', value: '21:00', color: '#5fe3a1' },
  { key: 'stars', label: 'Stars', said: 'four', value: '4', color: '#ffd75e' },
];

function TidyBoxes() {
  const [n, setN] = useState(0);
  const [code, setCode] = useState(false);
  const { run, busy } = useRunner();

  const tidy = () =>
    run(async (sleep) => {
      setN(0);
      for (let i = 1; i <= FIELDS.length; i++) {
        await sleep(700);
        setN(i);
      }
    });

  const done = n >= FIELDS.length;
  // Fact number i + 1 leaves the sentence and lands in box number i + 1.
  const tag = (i: number) => <StepTag n={i + 1} small now={n === i && busy} todo={n <= i && !(n === i && busy)} />;
  const said = (i: number) => (
    <mark className={n > i ? 'is-used' : n === i && busy ? 'is-next' : ''} style={{ '--c': FIELDS[i].color } as CSSProperties}>
      {tag(i)}
      {FIELDS[i].said}
    </mark>
  );

  return (
    <Scene
      caption={
        done
          ? 'Now every fact sits in its own box. A program can use it straight away.'
          : busy
            ? 'Ray puts each fact into the right box…'
            : 'Ray gave a friendly answer. But a computer cannot use a sentence. It needs a form.'
      }
      tone={done ? 'ok' : undefined}
      step={busy || n > 0 ? Math.min(n + 1, FIELDS.length) : undefined}
      controls={
        <>
          <Toggle on={code} onChange={setCode}>
            Show as code
          </Toggle>
          <Btn onClick={tidy} disabled={busy} pulse={n === 0}>
            🧹 Tidy it into boxes
          </Btn>
        </>
      }
    >
      <At x={25} y={7} p={{ x: 50, y: 5 }}>
        <span className="k-label">What Ray said</span>
      </At>
      <At x={12} y={46} p={{ x: 88, y: 47 }}>
        <MiniRay mood={done ? 'happy' : 'wink'} size={4} />
      </At>
      <At x={27} y={25} w={42} p={{ x: 50, y: 24, w: 92 }}>
        <div className="tb-said k-bubble is-ray">
          Oh, you will love {said(0)}! It is at {said(1)}. They close at {said(2)}, and I would give it {said(3)} stars.
        </div>
      </At>

      <At x={76} y={7} p={{ x: 50, y: 49 }}>
        <span className="k-label">{code ? 'What the program gets' : 'The form'}</span>
      </At>
      {code ? (
        <At x={76} y={30} w={40} p={{ x: 50, y: 88, w: 80 }}>
          <Card className="tb-code">
            <pre>
              {'{\n'}
              {FIELDS.map((f, i) => (
                <span key={f.key} className={n > i ? 'is-in' : ''} style={{ '--c': f.color } as CSSProperties}>
                  {tag(i)}
                  {` "${f.key}": `}
                  <b>{n > i ? (f.key === 'stars' ? f.value : `"${f.value}"`) : '…'}</b>
                  {i < FIELDS.length - 1 ? ',' : ''}
                  {'\n'}
                </span>
              ))}
              {'}'}
            </pre>
          </Card>
        </At>
      ) : (
        FIELDS.map((f, i) => (
          <At key={f.key} x={76} y={15.500 + i * 9.600} w={38} p={{ x: 50, y: 63 + i * 16.500, w: 84 }}>
            <div className={`tb-box${n > i ? ' is-in' : ''}`} style={{ '--c': f.color } as CSSProperties}>
              <span>
                {tag(i)}
                {f.label}
              </span>
              <b key={n > i ? 'in' : 'out'} className={n > i ? 'k-pop' : ''}>
                {n > i ? (f.key === 'stars' ? '★★★★' : f.value) : ''}
              </b>
            </div>
          </At>
        ))
      )}
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming: word by word. Same finish time, far less waiting.
// ─────────────────────────────────────────────────────────────────────────────

const ANSWER = 'A giraffe is the tallest animal on land. It can be as tall as a house!'.split(' ');

function Streaming() {
  const [tick, setTick] = useState(-1);
  const { run, busy } = useRunner();
  const total = ANSWER.length;
  const ask = () =>
    run(async (sleep) => {
      setTick(0);
      for (let i = 1; i <= total; i++) {
        await sleep(210);
        setTick(i);
      }
    });
  const done = tick >= total;
  const secs = tick < 0 ? 0 : (tick * 0.21).toFixed(1);

  return (
    <Scene
      caption={
        done
          ? 'Both finished at the same moment. But with streaming, you were reading the whole time.'
          : busy
            ? 'Top: still waiting. Bottom: already reading.'
            : 'Same question, two ways to answer. Press ask and watch both.'
      }
      tone={done ? 'ok' : undefined}
      controls={
        <Btn onClick={ask} disabled={busy} pulse={tick < 0}>
          {done ? '↺ Ask again' : '▶ Ask'}
        </Btn>
      }
    >
      <At x={50} y={6} w={50} p={{ x: 38, y: 7, w: 66 }}>
        <Bubble who="you">How tall is a giraffe?</Bubble>
      </At>
      <At x={90} y={6} p={{ x: 86, y: 7 }}>
        <Tag tone="info">⏱ {secs} s</Tag>
      </At>

      <At x={15} y={21} w={24} p={{ x: 50, y: 25, w: 90 }}>
        <div className="k-center">
          <span className="k-title">All at once</span>
          <Tag tone={done ? 'warn' : 'info'}>first word after 3.2 s</Tag>
        </div>
      </At>
      <At x={63} y={21} w={66} p={{ x: 50, y: 48, w: 90 }}>
        <Card className="st-lane">
          {tick < 0 ? <span className="k-muted">…</span> : done ? ANSWER.join(' ') : <span className="k-dots"><i /><i /><i /></span>}
        </Card>
      </At>

      <At x={15} y={41} w={24} p={{ x: 50, y: 78, w: 90 }}>
        <div className="k-center">
          <span className="k-title">Word by word</span>
          <Tag tone="ok">first word after 0.2 s</Tag>
        </div>
      </At>
      <At x={63} y={41} w={66} p={{ x: 50, y: 101, w: 90 }}>
        <Card className="st-lane" tone={tick > 0 ? 'ok' : undefined}>
          {tick < 0 ? (
            <span className="k-muted">…</span>
          ) : (
            <>
              {ANSWER.slice(0, tick).join(' ')}
              {!done && <i className="k-caret" />}
            </>
          )}
        </Card>
      </At>
    </Scene>
  );
}

register({ 'eyes-ears': EyesEars, 'tidy-boxes': TidyBoxes, streaming: Streaming });
