export type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  mediaUrl: string | null;
};

export const sermons: Sermon[] = [
  {
    id: 'sermon-divine-purpose',
    title: 'Walking in Divine Purpose',
    speaker: 'Pastor Daniel Adebayo',
    date: 'April 7, 2026',
    mediaUrl: null,
  },
  {
    id: 'sermon-faith-that-overcomes',
    title: 'Faith That Overcomes',
    speaker: 'Minister Grace Johnson',
    date: 'April 10, 2026',
    mediaUrl: null,
  },
  {
    id: 'sermon-power-of-prayer',
    title: 'The Power of Prayer',
    speaker: 'Pastor Samuel Adeyemi',
    date: 'April 12, 2026',
    mediaUrl: null,
  },
  {
    id: 'sermon-living-by-the-word',
    title: 'Living by the Word',
    speaker: 'Pastor Ruth Williams',
    date: 'April 14, 2026',
    mediaUrl: null,
  },
];
