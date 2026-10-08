import { useSyncExternalStore } from 'react';

/**
 * Is the X-ray switched on? The home screen draws it, and the switch lives in the top bar, so both
 * read it from here. It is remembered for the visit (not for ever): a new visit starts at the start page.
 */
const KEY = 'agent-xray:xray-on';
const listeners = new Set<() => void>();

function load(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let on = load();

export function setXray(next: boolean) {
  if (next === on) return;
  on = next;
  try {
    if (next) sessionStorage.setItem(KEY, '1');
    else sessionStorage.removeItem(KEY);
  } catch {
    /* fine: the switch still works for this page */
  }
  listeners.forEach((l) => l());
}

export function useXray(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => on,
    () => false,
  );
}
