import { announcements, type Announcement } from '@/data/announcements';

const ANNOUNCEMENTS_DELAY_MS = 400;

export function getAnnouncements(): Promise<Announcement[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(announcements), ANNOUNCEMENTS_DELAY_MS);
  });
}
