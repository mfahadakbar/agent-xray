import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { OrganId } from './data/types';
import { resolve } from './data/tree';
import { useRoute } from './lib/route';
import { useReducedMotion } from './lib/hooks';
import { setXray } from './lib/xray';
import { Home } from './views/Home';
import { Room } from './views/Room';
import { TopBar } from './views/TopBar';
import { Atlas } from './views/Atlas';
import type { Level } from './views/InfoPanel';

const LEVEL_KEY = 'agent-xray:level';

function loadLevel(): Level {
  try {
    return localStorage.getItem(LEVEL_KEY) === 'builder' ? 'builder' : 'simple';
  } catch {
    return 'simple';
  }
}

export default function App() {
  const { path, go, key, wantsTools } = useRoute();
  const chain = useMemo(() => resolve(path) ?? [], [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [mapOpen, setMapOpen] = useState(false);
  const [level, setLevelState] = useState<Level>(loadLevel);
  const reduced = useReducedMotion();

  // Going deeper zooms in; coming back zooms out.
  const lastDepth = useRef(chain.length);
  const dir = chain.length >= lastDepth.current ? 1 : -1;
  useEffect(() => {
    lastDepth.current = chain.length;
  }, [chain.length]);

  // An unknown address goes back to Ray.
  useEffect(() => {
    if (path.length && !resolve(path)) go([]);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [key]);

  // Looking inside a part is the X-ray. So the switch reads "on" in every room, however you got there,
  // and going back up lands on the X-ray, not on the start page.
  const inside = path.length > 0;
  useEffect(() => {
    if (inside) setXray(true);
  }, [inside]);

  const setLevel = useCallback((l: Level) => {
    setLevelState(l);
    try {
      localStorage.setItem(LEVEL_KEY, l);
    } catch {
      /* fine */
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === 'Escape') {
        if (mapOpen) setMapOpen(false);
        else if (path.length) go(path.slice(0, -1));
        // On the home screen there is still one level up: out of a story, then out of the X-ray.
        else window.dispatchEvent(new Event('agent-xray:up'));
      } else if ((e.key === '/' && !typing) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setMapOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapOpen, path, go]);

  const open = useCallback((id: OrganId) => go([id]), [go]);
  const shift = reduced ? 1 : dir > 0 ? 0.94 : 1.05;

  return (
    <div className="app">
      <div className="backdrop" aria-hidden="true" />
      <TopBar chain={chain} path={path} onMap={() => setMapOpen(true)} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key || 'ray'}
          className="view"
          initial={{ opacity: 0, scale: shift }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduced ? 1 : dir > 0 ? 1.06 : 0.95 }}
          transition={{ duration: reduced ? 0 : 0.24, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {chain.length ? <Room chain={chain} path={path} level={level} setLevel={setLevel} toTools={wantsTools} /> : <Home onOpen={open} />}
        </motion.div>
      </AnimatePresence>
      <Atlas open={mapOpen} onClose={() => setMapOpen(false)} onGo={go} current={key} />
    </div>
  );
}
