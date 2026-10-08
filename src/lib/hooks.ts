import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');

/** A step counter for click-through explainers. */
export function useSteps(count: number) {
  const [i, setI] = useState(0);
  const next = useCallback(() => setI((v) => Math.min(v + 1, count - 1)), [count]);
  const prev = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);
  const reset = useCallback(() => setI(0), []);
  const go = useCallback((n: number) => setI(Math.max(0, Math.min(n, count - 1))), [count]);
  return { i, next, prev, reset, go, count, atStart: i === 0, atEnd: i === count - 1 };
}
export type Steps = ReturnType<typeof useSteps>;

/**
 * Run a scripted animation: `run(async (sleep) => { setPhase(1); await sleep(600); setPhase(2); })`.
 * Starting a new script, or unmounting, abandons the old one mid-sleep, so state never updates late.
 */
export function useRunner() {
  const token = useRef(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => void (token.current = -1), []);

  const run = useCallback(async (script: (sleep: (ms: number) => Promise<void>) => Promise<void>) => {
    const mine = ++token.current;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          if (token.current === mine) resolve();
        }, ms);
      });
    setBusy(true);
    await script(sleep);
    if (token.current === mine) setBusy(false);
  }, []);

  const stop = useCallback(() => {
    token.current++;
    setBusy(false);
  }, []);

  return { run, stop, busy };
}

/** Reveal `text` a few characters at a time while `active`, like Ray typing. */
export function useTyped(text: string, active = true, cps = 45): string {
  const [n, setN] = useState(active ? 0 : text.length);
  useEffect(() => {
    if (!active) {
      setN(0);
      return;
    }
    setN(0);
    let shown = 0;
    const id = setInterval(() => {
      shown += Math.max(1, Math.round(cps / 20));
      setN(shown);
      if (shown >= text.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [text, active, cps]);
  return active ? text.slice(0, n) : '';
}
