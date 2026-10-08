import { tripFor } from '../data/trips';
import { toHash } from '../lib/route';

/**
 * "You are here" on a longer trip. The chunking room alone shows how to cut a book; this strip shows
 * where cutting sits between reading the file and answering the question.
 */
export function TripStrip({ at }: { at: string }) {
  const found = tripFor(at);
  if (!found) return null;
  const { trip, here, total } = found;
  let n = 0;
  return (
    <nav className="trip" aria-label={trip.title}>
      <p className="trip-title">
        <b>{trip.title}.</b> {here ? `You are at step ${here} of ${total}.` : `${total} steps. Pick one to look inside.`}
      </p>
      <div className="trip-scroll">
        {trip.legs.map((leg) => (
          <div className="trip-leg" key={leg.name}>
            <span className="trip-leg-name">{leg.name}</span>
            <ol>
              {leg.stops.map((s) => {
                n += 1;
                const now = n === here;
                return (
                  <li key={s.path} className={now ? 'is-here' : n < here ? 'is-done' : ''}>
                    <a href={toHash(s.path.split('/'))} aria-current={now ? 'step' : undefined}>
                      <span className={`k-step${now ? ' is-now' : ''}`}>{n}</span>
                      <span aria-hidden="true">{s.icon}</span>
                      {s.label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </nav>
  );
}
