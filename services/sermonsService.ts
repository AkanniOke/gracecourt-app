import { sermons, type Sermon } from '@/data/sermons';

const SERMONS_DELAY_MS = 400;

export function getSermons(): Promise<Sermon[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(sermons), SERMONS_DELAY_MS);
  });
}
