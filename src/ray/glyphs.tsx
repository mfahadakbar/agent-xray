import type { ReactElement } from 'react';
import type { OrganId } from '../data/types';

/** Line icons for Ray's ten parts, drawn on a 24 × 24 grid. They inherit `currentColor`. */
const PATHS: Record<OrganId, ReactElement> = {
  brain: (
    <>
      <path d="M9.5 4.2a2.8 2.8 0 0 0-2.8 2.8 3 3 0 0 0-2.2 4.9 3 3 0 0 0 1.8 5.1 2.9 2.9 0 0 0 5.7-.6V7a2.8 2.8 0 0 0-2.5-2.8z" />
      <path d="M14.5 4.2a2.8 2.8 0 0 1 2.8 2.8 3 3 0 0 1 2.2 4.9 3 3 0 0 1-1.8 5.1 2.9 2.9 0 0 1-5.7-.6V7a2.8 2.8 0 0 1 2.500-2.8z" />
      <path d="M8 10.500c1 0 2 .6 2 1.800M16 10.500c-1 0-2 .6-2 1.800" />
    </>
  ),
  heart: <path d="M12 20s-7.200-4.400-7.200-9.700A4.100 4.100 0 0 1 12 7.900a4.100 4.100 0 0 1 7.200 2.400C19.200 15.600 12 20 12 20z" />,
  senses: (
    <>
      <path d="M2.500 12s3.500-6.500 9.500-6.500S21.500 12 21.500 12s-3.500 6.500-9.500 6.500S2.500 12 2.500 12z" />
      <circle cx="12" cy="12" r="2.800" />
    </>
  ),
  memory: (
    <>
      <rect x="4" y="3.500" width="16" height="17" rx="3" />
      <path d="M4 9.200h16M4 14.800h16M10.200 6.400h3.600M10.200 12h3.600M10.200 17.600h3.600" />
    </>
  ),
  hands: (
    <path d="M14.700 6.300a1 1 0 0 0 0 1.400l1.600 1.600a1 1 0 0 0 1.400 0l3.770-3.770a6 6 0 0 1-7.940 7.940l-6.910 6.910a2.120 2.120 0 0 1-3-3l6.910-6.910a6 6 0 0 1 7.940-7.940l-3.760 3.760z" />
  ),
  shield: (
    <>
      <path d="M12 3l7.200 2.800v5.400c0 4.600-3 8-7.200 9.800-4.200-1.800-7.200-5.200-7.200-9.800V5.800L12 3z" />
      <path d="M8.800 12l2.300 2.300 4.200-4.400" />
    </>
  ),
  steps: <path d="M3.500 20h5v-5h5v-5h5V5h2" />,
  friends: (
    <>
      <circle cx="9" cy="8" r="3.200" />
      <path d="M2.800 20a6.200 6.200 0 0 1 12.400 0" />
      <circle cx="17.200" cy="9.200" r="2.500" />
      <path d="M16.400 14.300a5 5 0 0 1 5 5.700" />
    </>
  ),
  checkup: (
    <>
      <rect x="5" y="4.500" width="14" height="16.500" rx="2.500" />
      <path d="M9 4.500V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.500M8.800 13.200l2.200 2.200 4.200-4.400" />
    </>
  ),
  home: (
    <>
      <path d="M3.500 11.200L12 4l8.500 7.200" />
      <path d="M5.800 9.800V20h12.400V9.800M10 20v-5.500h4V20" />
    </>
  ),
};

export function OrganGlyph({ id, size = 24, strokeWidth = 1.8 }: { id: OrganId; size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[id]}
    </svg>
  );
}

/** The same glyph as bare paths, for use inside another SVG (scaled by the caller). */
export function OrganPaths({ id }: { id: OrganId }) {
  return PATHS[id];
}

/** The little Ray face used as the logo and the "home" button. */
export function RayMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 17v-7" stroke="#8fdcff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="8" r="4" fill="#ff8fd0" />
      <rect x="11" y="17" width="42" height="34" rx="13" fill="rgba(143,220,255,.10)" stroke="#8fdcff" strokeWidth="3" />
      <circle cx="24" cy="34" r="4.500" fill="#6fe3ff" />
      <circle cx="40" cy="34" r="4.500" fill="#6fe3ff" />
      <path d="M27 43q5 4 10 0" stroke="#8fdcff" strokeWidth="2.500" strokeLinecap="round" fill="none" />
    </svg>
  );
}
