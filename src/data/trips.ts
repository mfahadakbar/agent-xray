/**
 * A trip is one thing travelling through several boxes of the map, in order: a book on its way to
 * becoming an answer, for example. Every room on a trip shows the whole route and "you are here",
 * so a single stop (chunking, say) is never seen out of context.
 */
export interface TripStop {
  icon: string;
  label: string;
  /** The box to open for this stop. */
  path: string;
  /** Other boxes that are this same stop, seen another way. */
  also?: string[];
}

export interface Trip {
  id: string;
  title: string;
  /** The box that shows the whole trip. Its own rooms are the stops. */
  home: string;
  legs: Array<{ name: string; stops: TripStop[] }>;
}

export const TRIPS: Trip[] = [
  {
    id: 'rag',
    title: 'How a book becomes an answer',
    home: 'memory/knowledge',
    legs: [
      {
        name: 'Before you ask',
        stops: [
          { icon: '📕', label: 'Read the file', path: 'memory/knowledge/readers' },
          { icon: '✂️', label: 'Cut into bites', path: 'memory/knowledge/chunking' },
          { icon: '🔢', label: 'Turn into numbers', path: 'memory/knowledge/embeddings' },
          { icon: '🗺️', label: 'Put on the map', path: 'memory/knowledge/vector-db' },
        ],
      },
      {
        name: 'When you ask',
        stops: [
          { icon: '🔎', label: 'Search the map', path: 'memory/knowledge/hybrid-search', also: ['memory/knowledge/semantic-search', 'memory/knowledge/keyword-search'] },
          { icon: '🧐', label: 'Best one on top', path: 'memory/knowledge/reranking' },
          { icon: '🔬', label: 'Good enough?', path: 'memory/knowledge/corrective' },
          { icon: '🧠', label: 'Answer from it', path: 'brain' },
        ],
      },
    ],
  },
];

const isAt = (stop: TripStop, key: string) => stop.path === key || !!stop.also?.includes(key);

/** The trip a box belongs to, and which stop it is (0 when the box shows the whole trip). */
export function tripFor(key: string): { trip: Trip; here: number; total: number } | null {
  for (const trip of TRIPS) {
    const stops = trip.legs.flatMap((l) => l.stops);
    // A stop outside the trip's own box (the brain, at the very end) does not show the trip in its room.
    const at = stops.findIndex((s) => isAt(s, key) && key.startsWith(`${trip.home}/`));
    if (at !== -1 || key === trip.home) return { trip, here: at + 1, total: stops.length };
  }
  return null;
}
