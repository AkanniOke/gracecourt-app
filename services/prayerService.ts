import {
  previousPrayers,
  todayPrayer,
  type PreviousPrayer,
  type TodayPrayer,
} from '@/data/prayers';

const PRAYER_DELAY_MS = 400;

export function getTodayPrayer(): Promise<TodayPrayer> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(todayPrayer), PRAYER_DELAY_MS);
  });
}

export function getPreviousPrayers(): Promise<PreviousPrayer[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(previousPrayers), PRAYER_DELAY_MS);
  });
}
