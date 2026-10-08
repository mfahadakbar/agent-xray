import { useCallback, useSyncExternalStore } from 'react';

/**
 * Hash routing: `#/memory/knowledge/vector-db` → ['memory', 'knowledge', 'vector-db']. Works on any static host.
 * A trailing `?tools` asks the page to jump straight to its tool shelf.
 *
 * The app keeps its own copy of the address and moves on that. The address bar is kept in step wherever the
 * host allows it, so the back button and shared links work, but a locked-down frame cannot stop the app moving.
 */
const clean = (hash: string) => hash.replace(/^#\/?/, '').replace(/\/+$/, '');

function fromBar(): string {
  try {
    return clean(window.location.hash);
  } catch {
    return '';
  }
}

let current = fromBar();
const listeners = new Set<() => void>();

function set(next: string) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

/** Go to an in-app address such as `#/memory/knowledge` or `#/memory/knowledge?tools`. */
export function navigate(hash: string) {
  set(clean(hash));
  try {
    if (window.location.hash !== hash) window.location.hash = hash;
  } catch {
    /* the app has already moved; only the address bar stays behind */
  }
}

/** Plain links inside the app (`<a href="#/…">`) go through the router, so they work inside any frame. */
function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = e.target instanceof Element ? e.target.closest('a[href^="#/"]') : null;
  if (!link) return;
  e.preventDefault();
  navigate(link.getAttribute('href')!);
}

/** The back button, a typed address, or a link opened from outside. */
const onBar = () => set(fromBar());

function subscribe(cb: () => void) {
  if (!listeners.size) {
    window.addEventListener('hashchange', onBar);
    document.addEventListener('click', onClick);
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (!listeners.size) {
      window.removeEventListener('hashchange', onBar);
      document.removeEventListener('click', onClick);
    }
  };
}

export function toHash(path: string[]): string {
  return '#/' + path.join('/');
}

export function useRoute() {
  const raw = useSyncExternalStore(
    subscribe,
    () => current,
    () => '',
  );
  const [where, query = ''] = raw.split('?');
  const key = where.replace(/\/+$/, '');
  const path = key ? key.split('/').filter(Boolean) : [];
  const go = useCallback((next: string[]) => navigate(toHash(next)), []);
  return { path, go, key, wantsTools: query === 'tools' };
}
