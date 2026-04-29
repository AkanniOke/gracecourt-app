import { events, type ChurchEvent } from '@/data/events';

const EVENTS_DELAY_MS = 400;

export function getEvents(): Promise<ChurchEvent[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(events), EVENTS_DELAY_MS);
  });
}
