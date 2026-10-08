import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ALL, ORGANS, type Flat } from '../data/tree';
import { useVisited } from '../lib/progress';
import { OrganGlyph } from '../ray/glyphs';

/** The whole map on one screen, with search. "See the full picture of an agent in one place." */
export function Atlas({ open, onClose, onGo, current }: { open: boolean; onClose(): void; onGo(path: string[]): void; current: string }) {
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const visited = useVisited();

  useEffect(() => {
    if (open) {
      setQ('');
      // Wait for the overlay to be on screen before focusing.
      const id = setTimeout(() => input.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  const needle = q.trim().toLowerCase();
  const hit = useMemo(() => {
    if (!needle) return null;
    const m = new Map<string, string | true>();
    for (const f of ALL) {
      const n = f.node;
      if (`${n.title} ${n.aka ?? ''} ${n.tagline}`.toLowerCase().includes(needle)) m.set(f.key, true);
      else {
        const tool = n.tools?.find((t) => t.name.toLowerCase().includes(needle));
        if (tool) m.set(f.key, tool.name);
      }
    }
    return m;
  }, [needle]);

  if (!open) return null;

  const first = hit ? ALL.find((f) => hit.has(f.key)) : undefined;
  const go = (f: Flat) => {
    onGo(f.path);
    onClose();
  };

  return (
    <div className="atlas" role="dialog" aria-modal="true" aria-label="The whole map">
      <div className="atlas-scrim" onClick={onClose} />
      <div className="atlas-panel">
        <div className="atlas-head">
          <div>
            <h2>The whole map</h2>
            <p>
              Every part of an agent, in one place. {ALL.length} boxes. Click one to jump there.
            </p>
          </div>
          <div className="atlas-search">
            <span aria-hidden="true">🔎</span>
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && first) go(first);
              }}
              placeholder="Find a part or a tool…  try “vector” or “Slack”"
              aria-label="Search the map"
            />
            {hit && <i>{hit.size} found</i>}
          </div>
          <button className="atlas-close" onClick={onClose} aria-label="Close the map">
            ✕
          </button>
        </div>

        <div className="atlas-grid">
          {ORGANS.map((o) => {
            const rows = ALL.filter((f) => f.organ.id === o.id);
            const any = !hit || rows.some((f) => hit.has(f.key));
            return (
              <section key={o.id} className={`atlas-col${any ? '' : ' is-dim'}`} style={{ '--c': o.color } as CSSProperties}>
                {rows.map((f) => {
                  const match = hit?.get(f.key);
                  const cls = [
                    'atlas-row',
                    `d${Math.min(f.depth, 4)}`,
                    hit && (match ? 'is-hit' : 'is-miss'),
                    f.key === current && 'is-here',
                    visited.has(f.key) && 'is-seen',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <button key={f.key} className={cls} onClick={() => go(f)} title={f.node.tagline}>
                      {f.depth === 1 ? (
                        <span className="atlas-glyph">
                          <OrganGlyph id={o.id} size={18} />
                        </span>
                      ) : (
                        <span className="atlas-emoji" aria-hidden="true">
                          {f.node.icon}
                        </span>
                      )}
                      <span className="atlas-name">
                        {f.node.title}
                        {typeof match === 'string' && <em> · {match}</em>}
                      </span>
                      {f.node.tools && <span className="atlas-tools">{f.node.tools.length}</span>}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
