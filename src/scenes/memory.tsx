import { useState } from 'react';
import { useSteps } from '../lib/hooks';
import { At, Btn, Bubble, Card, Choice, MiniRay, Pic, Scene, Slider, StepNav, StepTag, Tag, Toggle, Typed, type Mood } from './kit';
import { register, type SceneProps } from './registry';

// ─────────────────────────────────────────────────────────────────────────────
// Memory: remember me? Without memory, every chat starts from zero.
// ─────────────────────────────────────────────────────────────────────────────

function RememberMe() {
  const [on, setOn] = useState(true);
  const s = useSteps(3);
  const later = s.i >= 1;
  const asked = s.i >= 2;

  const caption =
    s.i === 0
      ? on
        ? 'You tell Ray your name. Ray writes it on a note and puts it in a drawer.'
        : 'You tell Ray your name. But memory is off, so nothing is kept.'
      : s.i === 1
        ? "Time passes. Ray's brain forgets everything it just heard."
        : on
          ? 'Ray opens the drawer, finds the note, and remembers you.'
          : 'No note, no memory. For Ray this is a first meeting.';

  // The note travels: from the chat, into the drawer, and back out to Ray.
  const note = !on ? null : s.i < 2 ? { x: 80, y: 24 } : { x: 47, y: 40 };

  return (
    <Scene
      caption={caption}
      tone={asked ? (on ? 'ok' : 'bad') : undefined}
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
            🗄️ Memory
          </Toggle>
          <StepNav s={s} />
        </>
      }
    >
      <At x={8} y={5.500}>
        <Tag tone="info">{later ? '🌙 the next day' : '☀️ today'}</Tag>
      </At>

      <At x={33} y={13} w={40} hide={later}>
        <Bubble who="you">Hi! My name is Sam.</Bubble>
      </At>
      <At x={33} y={22} w={40} hide={later}>
        <Bubble who="ray">Nice to meet you, Sam!</Bubble>
      </At>
      <At x={33} y={20} hide={s.i !== 1}>
        <Pic size={4}>💤</Pic>
      </At>
      <At x={33} y={13} w={40} hide={!asked}>
        <Bubble who="you">What's my name?</Bubble>
      </At>
      <At x={36} y={25} w={44} hide={!asked}>
        <Bubble who="ray" tone={on ? 'ok' : 'bad'} key={`${on}${asked}`}>
          {on ? "You're Sam! 👋" : "Hmm. I don't know. Have we met?"}
        </Bubble>
      </At>
      <At x={20} y={43}>
        <MiniRay mood={s.i === 1 ? 'sleep' : asked ? (on ? 'happy' : 'sad') : 'happy'} size={5} />
      </At>

      <At x={80} y={30} w={30}>
        <Card className="mm-cabinet" soft={!on}>
          <span className="k-small">{on ? 'memory' : 'memory is off'}</span>
          <div className={`mm-drawer${on && s.i < 2 ? ' is-full' : ''}`} />
          <div className="mm-drawer" />
          <div className="mm-drawer" />
        </Card>
      </At>
      {note && (
        <At x={note.x} y={note.y} z={4} slow>
          <span className="mm-note">name: Sam</span>
        </At>
      )}
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Context memory: the chat so far. Ray re-reads the last few messages every time.
// ─────────────────────────────────────────────────────────────────────────────

const CHAT: Array<['you' | 'ray', string]> = [
  ['you', 'My favourite animal is the giraffe. 🦒'],
  ['ray', 'Giraffes are wonderful!'],
  ['you', 'I also love the colour blue.'],
  ['ray', 'Blue is lovely.'],
  ['you', 'And I have a dog called Bo.'],
  ['ray', 'Hello, Bo!'],
];

function ChatSoFar({ variant }: SceneProps) {
  const [n, setN] = useState(variant === 'summary' ? 2 : 3);
  const [summary, setSummary] = useState(variant === 'summary');
  const first = CHAT.length - n; // index of the first message Ray still sees
  const seesGiraffe = first <= 0;
  const knows = seesGiraffe || summary;
  const hidden = first > 0;

  const caption = !hidden
    ? 'Ray re-reads the whole chat before it answers. So it knows about the giraffe.'
    : summary
      ? 'The old messages are gone, but a short version of them stays. Ray still knows.'
      : `Ray only re-reads the last ${n === 1 ? 'message' : `${n} messages`}. The giraffe is too far back.`;

  const rowY = (i: number) => 6.500 + i * 5.900;

  return (
    <Scene
      caption={caption}
      tone={knows ? 'ok' : 'bad'}
      controls={
        <>
          <Slider label="Ray re-reads the last" min={0} max={CHAT.length} value={n} onChange={setN} show={n} />
          <Toggle on={summary} onChange={setSummary}>
            🗜️ Keep a short version
          </Toggle>
        </>
      }
    >
      {/* the window: what the brain is shown */}
      {n > 0 && (
        <At x={31} y={(rowY(first) + rowY(CHAT.length - 1)) / 2} w={57} z={0}>
          <div className="cs-window" style={{ height: `${(n - 1) * 5.900 + 5.300}cqw` }}>
            <span>Ray re-reads this</span>
          </div>
        </At>
      )}
      {CHAT.map(([who, text], i) => (
        <At key={i} x={who === 'you' ? 34 : 28} y={rowY(i)} w={46} z={1} style={{ opacity: i < first ? 0.2 : 1 }}>
          <div className={`cs-row is-${who}`}>{text}</div>
        </At>
      ))}
      <At x={31} y={(rowY(0) + rowY(Math.max(0, first - 1))) / 2} w={40} z={3} hide={!(summary && hidden)}>
        <Card tone="ok">
          <small>the short version</small>
          Likes giraffes{first > 2 ? ' and blue' : ''}
          {first > 4 ? '. Has a dog, Bo' : ''}.
        </Card>
      </At>

      <At x={34} y={rowY(CHAT.length) + 3.200} w={46} z={1}>
        <Bubble who="you">What was my favourite animal?</Bubble>
      </At>

      <At x={82} y={41}>
        <MiniRay mood={knows ? 'happy' : 'sad'} size={5} />
      </At>
      <At x={81} y={21} w={30}>
        <Bubble who="ray" tone={knows ? 'ok' : 'bad'} key={`${knows}${seesGiraffe}`}>
          {seesGiraffe ? 'A giraffe! 🦒' : summary ? 'A giraffe! It says so in my short version.' : "I can't see that far back. I don't know."}
        </Bubble>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User memory: notes about you, kept for next time. One drawer per person.
// ─────────────────────────────────────────────────────────────────────────────

function StickyNotes() {
  const s = useSteps(4);
  const [who, setWho] = useState<'sam' | 'mia'>('sam');
  const day2 = s.i >= 2;
  const story = s.i >= 3;
  const sam = who === 'sam';

  const caption =
    s.i === 0
      ? 'Day one. Sam tells Ray something about himself.'
      : s.i === 1
        ? "Ray writes it on a sticky note and puts it in Sam's drawer."
        : s.i === 2
          ? 'Night falls. A new day, a new chat. The old chat is gone.'
          : sam
            ? "Ray looks in Sam's drawer first. So the story is just right for Sam."
            : "Mia has her own drawer, and it is empty. Ray never mixes people up.";

  // The note: written near the chat, filed in Sam's drawer, then brought to Ray when Sam comes back.
  const noteAt = s.i === 0 ? null : s.i === 3 && sam ? { x: 40, y: 43 } : { x: 81, y: 19 };

  return (
    <Scene
      caption={caption}
      tone={story ? 'ok' : undefined}
      step={s.i + 1}
      controls={
        <>
          {story && (
            <Choice<'sam' | 'mia'>
              label="Who is asking?"
              value={who}
              onChange={setWho}
              options={[
                { id: 'sam', label: '🧒 Sam asks' },
                { id: 'mia', label: '👧 Mia asks' },
              ]}
            />
          )}
          <StepNav s={s} />
        </>
      }
    >
      <At x={9} y={5.500}>
        <Tag tone="info">{day2 ? '🌙 day two' : '☀️ day one'}</Tag>
      </At>

      <At x={36} y={13} w={40} hide={day2}>
        <Bubble who="you">I love dinosaurs! 🦖</Bubble>
      </At>
      <At x={32} y={22} w={36} hide={day2 || s.i < 1}>
        <Bubble who="ray">Dinosaurs are the best. I'll remember that.</Bubble>
      </At>
      <At x={34} y={18} hide={s.i !== 2}>
        <Pic size={3.600}>🌙</Pic>
      </At>
      <At x={36} y={12} w={40} hide={!story}>
        <Bubble who="you">{sam ? '🧒' : '👧'} Tell me a story!</Bubble>
      </At>
      <At x={34} y={26} w={48} hide={!story}>
        <Bubble who="ray" tone="ok" key={who}>
          <Typed text={sam ? 'Once upon a time, a brave little T-Rex named Rexy stomped through the jungle…' : 'Once upon a time, a little rabbit found a shiny key…'} />
        </Bubble>
      </At>
      <At x={14} y={44}>
        <MiniRay mood={s.i === 2 ? 'sleep' : 'happy'} size={4.600} />
      </At>

      {(['sam', 'mia'] as const).map((p, i) => (
        <At key={p} x={81} y={19 + i * 22} w={30}>
          <Card className={`sn-drawer${story && who === p ? ' is-open' : ''}`} color={p === 'sam' ? '#5aa9ff' : '#ff8fd0'}>
            <span className="k-small">
              {p === 'sam' ? "🧒 Sam's drawer" : "👧 Mia's drawer"}
            </span>
            <div className="sn-slot">{p === 'mia' && <span className="k-muted">empty</span>}</div>
          </Card>
        </At>
      ))}
      {noteAt && (
        <At x={noteAt.x} y={noteAt.y + 1.500} z={4} slow>
          <span className="mm-note">Sam loves dinosaurs</span>
        </At>
      )}
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Working memory: the whiteboard. An exact list Ray can read and change.
// ─────────────────────────────────────────────────────────────────────────────

const GROCERIES: Array<{ id: string; icon: string }> = [
  { id: 'milk', icon: '🥛' },
  { id: 'eggs', icon: '🥚' },
  { id: 'apples', icon: '🍎' },
  { id: 'bread', icon: '🍞' },
];

function Whiteboard() {
  const [list, setList] = useState<string[]>(['milk']);
  const [said, setSaid] = useState<{ you: string; ray: string } | null>(null);

  const flip = (id: string) => {
    const has = list.includes(id);
    setList((l) => (has ? l.filter((x) => x !== id) : [...l, id]));
    setSaid(has ? { you: `Take ${id} off the list.`, ray: `Done. I wiped ${id} off the board.` } : { you: `Add ${id} to my list.`, ray: `Got it. I wrote ${id} on the board.` });
  };
  const ask = () =>
    setSaid({
      you: "What's on my list?",
      ray: list.length ? `You have ${list.length}: ${list.join(', ')}.` : 'Your list is empty.',
    });

  return (
    <Scene
      caption={
        said
          ? 'Ray does not have to remember the list. It reads it straight off the whiteboard, so it is always exactly right.'
          : 'Ray keeps a whiteboard for the job at hand. Tell Ray to add or remove things.'
      }
      controls={
        <>
          <Btn kind="soft" onClick={ask}>
            ❓ What's on my list?
          </Btn>
          <Btn
            kind="soft"
            onClick={() => {
              setList([]);
              setSaid({ you: 'Start a new list.', ray: 'Wiped clean.' });
            }}
          >
            🧽 Wipe the board
          </Btn>
        </>
      }
    >
      <At x={16} y={5.500}>
        <span className="k-label">Tell Ray</span>
      </At>
      {GROCERIES.map((g, i) => {
        const has = list.includes(g.id);
        return (
          <At key={g.id} x={16} y={14 + i * 9.600} w={25}>
            <button className={`ee-thing${has ? ' is-on' : ''}`} onClick={() => flip(g.id)}>
              <Pic size={1.600}>{g.icon}</Pic>
              <b>
                {has ? 'Remove' : 'Add'} {g.id}
              </b>
            </button>
          </At>
        );
      })}

      <At x={48} y={11} w={30} hide={!said}>
        <Bubble who="you" key={said?.you}>
          {said?.you}
        </Bubble>
      </At>
      <At x={48} y={23} w={30} hide={!said}>
        <Bubble who="ray" tone="ok" key={`${said?.ray}${list.length}`}>
          {said?.ray}
        </Bubble>
      </At>
      <At x={48} y={42}>
        <MiniRay mood="happy" size={5} />
      </At>

      <At x={82} y={27} w={31}>
        <div className="wb-board">
          <span className="wb-title">Shopping list</span>
          <ul>
            {GROCERIES.filter((g) => list.includes(g.id)).map((g) => (
              <li key={g.id} className="k-pop">
                {g.icon} {g.id}
              </li>
            ))}
            {list.length === 0 && <li className="k-muted">nothing yet</li>}
          </ul>
        </div>
      </At>
      <At x={82} y={50.500}>
        <Tag tone="info">
          {list.length} {list.length === 1 ? 'thing' : 'things'} on the board
        </Tag>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Learning: lessons learned. Ray writes down feedback, and does better next time.
// ─────────────────────────────────────────────────────────────────────────────

type Lesson = 'short' | 'example' | 'kind';
const LESSONS: Array<{ id: Lesson; say: string; note: string }> = [
  { id: 'short', say: '😴 Too long!', note: 'Keep answers short.' },
  { id: 'example', say: '🤔 Show me an example!', note: 'Give an example.' },
  { id: 'kind', say: '🙂 Be friendlier!', note: 'Be warm and friendly.' },
];

function Lessons() {
  const [got, setGot] = useState<Lesson[]>([]);
  const has = (l: Lesson) => got.includes(l);
  const learn = (l: Lesson) => setGot((g) => (g.includes(l) ? g : [...g, l]));

  const answer =
    (has('kind') ? 'Great question! 😊 ' : '') +
    (has('short')
      ? 'A volcano is a mountain that can shoot out hot melted rock.'
      : 'A volcano is a rupture in the crust of a planet that allows hot lava, volcanic ash and gases to escape from a chamber of magma located beneath the surface.') +
    (has('example') ? ' It is like a fizzy drink that pops when you shake it!' : '');

  const mood: Mood = got.length === 0 ? 'think' : got.length === 3 ? 'happy' : 'wink';
  return (
    <Scene
      caption={
        got.length === 0
          ? 'Ray answers like a textbook. Tell Ray what you think of it.'
          : got.length < 3
            ? 'Ray wrote your feedback in its notebook. The answer already changed. Keep going.'
            : 'Three lessons learned. And they stay in the notebook, so the next person gets the better Ray too.'
      }
      tone={got.length === 3 ? 'ok' : undefined}
      step={got.length || undefined}
      controls={
        <>
          {LESSONS.map((l) => (
            <Btn key={l.id} kind="soft" onClick={() => learn(l.id)} disabled={has(l.id)}>
              {l.say}
            </Btn>
          ))}
          <Btn kind="soft" onClick={() => setGot([])} disabled={!got.length} label="Forget the lessons">
            ↺
          </Btn>
        </>
      }
    >
      <At x={34} y={6.500} w={40}>
        <Bubble who="you">What is a volcano?</Bubble>
      </At>
      <At x={36} y={28} w={56}>
        <Bubble who="ray" key={answer}>
          <Typed text={answer} cps={90} />
        </Bubble>
      </At>
      <At x={10} y={47}>
        <MiniRay mood={mood} size={4.200} />
      </At>

      <At x={83} y={28} w={29}>
        <div className="ls-book">
          <span className="wb-title">📓 Lessons</span>
          <ul>
            {got.map((id, k) => (
              <li key={id} className="k-pop">
                <StepTag n={k + 1} now={k === got.length - 1} /> {LESSONS.find((l) => l.id === id)!.note}
              </li>
            ))}
            {got.length === 0 && <li className="k-muted">no lessons yet</li>}
          </ul>
        </div>
      </At>
    </Scene>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage: the diary. Does Ray's memory survive being switched off?
// ─────────────────────────────────────────────────────────────────────────────

function Unplug() {
  const [storage, setStorage] = useState(true);
  const [phase, setPhase] = useState<'on' | 'off' | 'back'>('on');
  const next = () => setPhase((p) => (p === 'on' ? 'off' : p === 'off' ? 'back' : 'on'));
  const kept = storage && phase === 'back';
  const lost = !storage && phase === 'back';

  return (
    <Scene
      caption={
        phase === 'on'
          ? storage
            ? 'Ray and Sam are chatting. Every message is also written in the diary. Now pull the plug.'
            : 'Ray and Sam are chatting. Nothing is written down. Now pull the plug.'
          : phase === 'off'
            ? 'Ray is switched off. Everything in its head is gone. Plug it back in.'
            : kept
              ? 'Ray reads the diary and picks up right where it left off.'
              : 'No diary, so nothing is left. Ray starts from zero.'
      }
      tone={kept ? 'ok' : lost ? 'bad' : undefined}
      step={phase === 'on' ? 1 : phase === 'off' ? 2 : 3}
      controls={
        <>
          <Toggle
            on={storage}
            onChange={(v) => {
              setStorage(v);
              setPhase('on');
            }}
          >
            💾 Storage
          </Toggle>
          <Btn onClick={next} pulse={phase !== 'back'}>
            {phase === 'on' ? '🔌 Pull the plug' : phase === 'off' ? '⚡ Plug Ray back in' : '↺ Again'}
          </Btn>
        </>
      }
    >
      <div className={`up-dark${phase === 'off' ? ' is-on' : ''}`} />

      <At x={32} y={10} w={40} hide={phase !== 'on' && !kept}>
        <Bubble who="you">I'm Sam. I love dinosaurs!</Bubble>
      </At>
      <At x={28} y={20} w={36} hide={phase !== 'on' && !kept}>
        <Bubble who="ray">Hi Sam! Me too.</Bubble>
      </At>
      <At x={30} y={31} w={46} hide={phase !== 'back'}>
        <Bubble who="ray" tone={kept ? 'ok' : 'bad'} key={`${storage}`}>
          {kept ? 'Welcome back, Sam! More dinosaurs?' : 'Hello! Who are you?'}
        </Bubble>
      </At>
      <At x={18} y={44}>
        <MiniRay mood={phase === 'off' ? 'sleep' : lost ? 'think' : 'happy'} size={5} />
      </At>

      <At x={80} y={27} w={28} style={{ opacity: storage ? 1 : 0.3 }}>
        <div className={`up-diary${kept ? ' is-read' : ''}`}>
          <span className="wb-title">💾 Diary</span>
          {storage ? (
            <ul>
              <li>Sam: I'm Sam. I love…</li>
              <li>Ray: Hi Sam! Me too.</li>
            </ul>
          ) : (
            <ul>
              <li className="k-muted">not in use</li>
            </ul>
          )}
        </div>
      </At>
      <At x={80} y={47}>
        <Tag tone={storage ? 'ok' : 'warn'}>{storage ? 'safe, even when Ray is off' : 'storage is off'}</Tag>
      </At>
    </Scene>
  );
}

register({
  'remember-me': RememberMe,
  'chat-so-far': ChatSoFar,
  'sticky-notes': StickyNotes,
  whiteboard: Whiteboard,
  lessons: Lessons,
  unplug: Unplug,
});
