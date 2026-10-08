import type { XNode } from '../data/types';

export type Level = 'simple' | 'builder';

/** The same questions at every level of the map, as promised in the idea. */
export function InfoPanel({ node, level, setLevel }: { node: XNode; level: Level; setLevel(l: Level): void }) {
  const what = level === 'simple' ? node.simple : node.builder;
  return (
    <div className="info">
      <div className="level" role="tablist" aria-label="How deep to explain">
        <button role="tab" aria-selected={level === 'simple'} className={level === 'simple' ? 'is-on' : ''} onClick={() => setLevel('simple')}>
          <span aria-hidden="true">🧒</span> Simple
        </button>
        <button role="tab" aria-selected={level === 'builder'} className={level === 'builder' ? 'is-on' : ''} onClick={() => setLevel('builder')}>
          <span aria-hidden="true">🛠️</span> Builder
        </button>
      </div>

      <section className={`info-sec info-what is-${level}`}>
        <h2>What is it?</h2>
        {what.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {level === 'builder' && node.code && (
          <pre className="code">
            <code>{node.code}</code>
          </pre>
        )}
      </section>

      <section className="info-sec info-why">
        <h2>Why it matters</h2>
        <p>{node.why}</p>
      </section>

      <section className="info-sec">
        <h2>Keep in mind</h2>
        <ul className="dots">
          {node.mind.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="info-sec info-split">
        <div>
          <h2 className="h-yes">Possible today</h2>
          <ul className="ticks yes">
            {node.today.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h-no">Not yet</h2>
          <ul className="ticks no">
            {node.notYet.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
