import { useSyncExternalStore } from 'react';

/** Which boxes on the map this explorer has opened. Lives in localStorage; the app works without it. */
const KEY = 'agent-xray:visited';
const listeners = new Set<() => void>();
let cache: ReadonlySet<string> = load();

function load(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markVisited(key: string) {
  if (cache.has(key)) return;
  cache = new Set(cache).add(key);
  try {
    localStorage.setItem(KEY, JSON.stringify([...cache]));
  } catch {
    /* private mode: progress simply resets on reload */
  }
  listeners.forEach((l) => l());
}

export function resetVisited() {
  cache = new Set();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useVisited(): ReadonlySet<string> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cache,
    () => cache,
  );
}
