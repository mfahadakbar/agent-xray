import { useState } from 'react';
import type { Cost, Tool } from '../data/types';

export const COST: Record<Cost, { label: string; hint: string }> = {
  open: { label: 'Open source', hint: 'Free to run yourself' },
  free: { label: 'Free', hint: 'Free to use' },
  freemium: { label: 'Free tier', hint: 'Free to start, paid plans after' },
  paid: { label: 'Paid', hint: 'Paid, or pay for what you use' },
};

type Filter = 'all' | 'free' | 'freemium' | 'paid' | 'popular';

const FILTERS: Array<{ id: Filter; label: string; test(t: Tool): boolean }> = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'free', label: 'Free', test: (t) => t.cost === 'open' || t.cost === 'free' },
  { id: 'freemium', label: 'Free tier', test: (t) => t.cost === 'freemium' },
  { id: 'paid', label: 'Paid', test: (t) => t.cost === 'paid' },
  { id: 'popular', label: '★ Popular', test: (t) => !!t.popular },
];

/** The bottom of every branch: real tools, marked free or paid, with the popular ones starred. */
export function ToolShelf({ tools, title }: { tools: Tool[]; title: string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = tools.filter(active.test).sort((a, b) => Number(!!b.popular) - Number(!!a.popular));

  return (
    <section className="shelf" id="tools" aria-label={`Tools for ${title}`}>
      <div className="shelf-head">
        <h2>
          <span aria-hidden="true">🧰</span> Real tools you can use
        </h2>
        <div className="filters" role="group" aria-label="Filter tools">
          {FILTERS.map((f) => {
            const n = tools.filter(f.test).length;
            return (
              <button key={f.id} className={`filter${filter === f.id ? ' is-on' : ''}`} onClick={() => setFilter(f.id)} disabled={n === 0} aria-pressed={filter === f.id}>
                {f.label} <i>{n}</i>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tools">
        {shown.map((t) => {
          const inner = (
            <>
              <div className="tool-top">
                <span className="tool-name">{t.name}</span>
                {t.url && (
                  <span className="tool-go" aria-hidden="true">
                    ↗
                  </span>
                )}
              </div>
              <p className="tool-what">{t.what}</p>
              <div className="tool-tags">
                <span className={`tag tag-${t.cost}`} title={COST[t.cost].hint}>
                  {COST[t.cost].label}
                </span>
                {t.popular && <span className="tag tag-popular">★ Popular</span>}
              </div>
            </>
          );
          return t.url ? (
            <a key={t.name} className="tool" href={t.url} target="_blank" rel="noreferrer noopener">
              {inner}
            </a>
          ) : (
            <div key={t.name} className="tool">
              {inner}
            </div>
          );
        })}
      </div>
      <p className="shelf-note">Plans and prices change. Check each tool's own page before you choose.</p>
    </section>
  );
}
