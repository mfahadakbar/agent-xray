import { useEffect, type CSSProperties } from 'react';
import type { Organ, XNode } from '../data/types';
import { inside, ORGANS, popularInside } from '../data/tree';
import { toHash } from '../lib/route';
import { markVisited, useVisited } from '../lib/progress';
import { TripStrip } from './TripStrip';
import { getScene } from '../scenes/registry';
import { InfoPanel, type Level } from './InfoPanel';
import { COST, ToolShelf } from './ToolShelf';

/** One box on the map, opened up: play with it, read about it, look inside it, find the tools. */
export function Room({ chain, path, level, setLevel, toTools = false }: { chain: XNode[]; path: string[]; level: Level; setLevel(l: Level): void; toTools?: boolean }) {
  const node = chain[chain.length - 1];
  const organ = chain[0] as Organ;
  const parent = chain.length > 1 ? chain[chain.length - 2] : null;
  const key = path.join('/');
  const visited = useVisited();

  useEffect(() => markVisited(key), [key]);

  // Arriving by a "…→ Tools" link: wait for the page to settle, then bring the shelf into view.
  useEffect(() => {
    if (!toTools) return;
    const id = setTimeout(() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 420);
    return () => clearTimeout(id);
  }, [toTools, key]);

  const scene = node.scene ? getScene(node.scene) : null;
  const siblings: XNode[] = parent ? (parent.children ?? []) : ORGANS;
  const at = siblings.findIndex((s) => s.id === node.id);
  const prev = at > 0 ? siblings[at - 1] : null;
  const next = at < siblings.length - 1 ? siblings[at + 1] : null;
  const up = path.slice(0, -1);
  const peek = node.tools ? [] : popularInside(node, path);

  return (
    <main className="room" style={{ '--c': organ.color } as CSSProperties}>
      <div className="room-main">
        <header className="room-head">
          <a className="back" href={toHash(up)}>
            <span aria-hidden="true">←</span> Back to {parent ? parent.title : 'Ray'}
          </a>
          <div className="room-title">
            <span className="room-icon" aria-hidden="true">
              {node.icon}
            </span>
            <div>
              <h1>{node.title}</h1>
              {node.aka && (
                <p className="aka">
                  Builders call it <b>{node.aka}</b>
                </p>
              )}
            </div>
          </div>
          <p className="tagline">{node.tagline}</p>
        </header>

        <TripStrip at={path.join('/')} />

        {scene && (
          <section className="scene-slot" aria-label={`Try it: ${node.title}`}>
            <scene.Component key={node.scene} variant={scene.variant} />
          </section>
        )}

        {node.children && (
          <section className="inside">
            <h2>
              <span aria-hidden="true">🔍</span> Look inside {node.title}
            </h2>
            <div className="kids">
              {node.children.map((c, i) => {
                const n = inside(c);
                const seen = visited.has([...path, c.id].join('/'));
                return (
                  <a key={c.id} className={`kid${seen ? ' is-seen' : ''}`} href={toHash([...path, c.id])} style={{ '--i': i } as CSSProperties}>
                    <span className="kid-icon" aria-hidden="true">
                      {c.icon}
                    </span>
                    <span className="kid-body">
                      <b>{c.title}</b>
                      {c.aka && <i>{c.aka}</i>}
                      <span className="kid-tag">{c.tagline}</span>
                      <span className="kid-meta">
                        {n.parts > 0 && <em>{n.parts} parts inside</em>}
                        {n.tools > 0 && <em>{n.tools} tools</em>}
                        {seen && <em className="kid-seen">✓ seen</em>}
                      </span>
                    </span>
                    <span className="kid-go" aria-hidden="true">
                      →
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {node.tools && <ToolShelf tools={node.tools} title={node.title} />}

        {peek.length > 0 && (
          <section className="inside" aria-label={`Popular tools inside ${node.title}`}>
            <h2>
              <span aria-hidden="true">🧰</span> Popular tools you will meet inside
            </h2>
            <div className="peeks">
              {peek.map((t) => (
                <a key={t.tool.name} className="peek" href={`${toHash(t.path)}?tools`} title={t.tool.what}>
                  <b>{t.tool.name}</b>
                  <i>in {t.where}</i>
                  <span className={`tag tag-${t.tool.cost}`}>{COST[t.tool.cost].label}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(prev || next) && (
          <nav className="sibs" aria-label="Neighbours">
            {prev ? (
              <a href={toHash([...up, prev.id])} className="sib sib-prev">
                <span aria-hidden="true">←</span>
                <span>
                  <i>Before</i>
                  <b>
                    {prev.icon} {prev.title}
                  </b>
                </span>
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={toHash([...up, next.id])} className="sib sib-next">
                <span>
                  <i>Next</i>
                  <b>
                    {next.icon} {next.title}
                  </b>
                </span>
                <span aria-hidden="true">→</span>
              </a>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>

      <aside className="room-side">
        <InfoPanel node={node} level={level} setLevel={setLevel} />
      </aside>
    </main>
  );
}
