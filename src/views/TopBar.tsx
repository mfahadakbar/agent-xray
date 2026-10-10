import { Fragment, type CSSProperties } from 'react';
import type { XNode } from '../data/types';
import { ALL } from '../data/tree';
import { REPO } from '../lib/links';
import { navigate, toHash } from '../lib/route';
import { useVisited } from '../lib/progress';
import { setXray, useXray } from '../lib/xray';
import { RayMark } from '../ray/glyphs';

export function TopBar({ chain, path, onMap }: { chain: XNode[]; path: string[]; onMap(): void }) {
  const xray = useXray();
  const visited = useVisited();
  const seen = ALL.filter((f) => visited.has(f.key)).length;
  const leaf = chain[chain.length - 1];

  return (
    <header className="top">
      <a
        className="brand"
        href="#/"
        aria-label="Agent Xray, back to the start"
        onClick={() => {
          // Already on the home screen: the logo goes all the way back to the start page.
          if (!path.length) setXray(false);
        }}
      >
        <RayMark size={30} />
        <span>
          Agent <b>Xray</b>
        </span>
      </a>

      {/* The path you took: Ray → Memory → Knowledge → Vector database → Tools */}
      <nav className="crumbs" aria-label="Where you are">
        {chain.length > 0 && (
          <>
            <a href="#/">Ray</a>
            {chain.map((n, i) => {
              const here = i === chain.length - 1;
              return (
                <Fragment key={n.id}>
                  <span className="crumb-sep" aria-hidden="true">
                    →
                  </span>
                  {here ? (
                    <span className="crumb-here" aria-current="page">
                      {n.title}
                    </span>
                  ) : (
                    <a href={toHash(path.slice(0, i + 1))}>{n.title}</a>
                  )}
                </Fragment>
              );
            })}
            {leaf?.tools && (
              <>
                <span className="crumb-sep" aria-hidden="true">
                  →
                </span>
                <button className="crumb-tools" onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  Tools
                </button>
              </>
            )}
          </>
        )}
      </nav>

      <div className="top-actions">
        <span className="seen" title="Parts of the map you have opened">
          <i style={{ '--p': seen / ALL.length } as CSSProperties} />
          {seen}/{ALL.length}
        </span>
        <button
          className={`top-btn top-xray${xray ? ' is-on' : ''}`}
          role="switch"
          aria-checked={xray}
          onClick={() => {
            // The X-ray is a thing of the home screen: switching it, from anywhere, takes you there.
            setXray(!xray);
            if (path.length) navigate('#/');
          }}
          title={xray ? 'Turn the X-ray off and go back to the start' : 'Turn the X-ray on'}
        >
          <span aria-hidden="true">⚡</span>
          <span className="top-btn-label">X-ray</span>
          <span className="switch-knob" />
        </button>
        <button className="top-btn" onClick={onMap} title="See the whole map (press /)">
          <span aria-hidden="true">🗺️</span>
          <span className="top-btn-label">Whole map</span>
        </button>
        {/* Agent Xray is free and open source. This is the way to the code, and to giving it a star. */}
        <a className="top-btn top-star" href={REPO} target="_blank" rel="noopener noreferrer" aria-label="Star Agent Xray on GitHub" title="Free and open source. Give it a star on GitHub">
          <span aria-hidden="true">⭐</span>
          <span className="top-btn-label">
            Star<span className="top-star-where"> on GitHub</span>
          </span>
        </a>
      </div>
    </header>
  );
}
