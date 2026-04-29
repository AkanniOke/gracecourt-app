export type TodayPrayer = {
  prayerText: string;
  bibleVerse: string;
  closingPrayer: string;
  speaker: string;
};

export type PreviousPrayer = {
  id: string;
  title: string;
  date: string;
};

export const todayPrayer: TodayPrayer = {
  prayerText:
    'Heavenly Father, thank You for the gift of this day. Fill our hearts with peace, renew our strength, and guide our steps in righteousness. Let Your grace rest upon our homes, our work, and our worship as we walk in faith and purpose.',
  bibleVerse:
    '"The Lord is my strength and my shield; my heart trusts in Him, and He helps me." Psalm 28:7',
  closingPrayer:
    'Lord, establish the work of our hands, preserve our families, and cause our lives to reflect Your light. May we carry Your love into every place we go today. Amen.',
  speaker: 'Pst. Tosin Tope-Babalola',
};

export const previousPrayers: PreviousPrayer[] = [
  {
    id: 'prayer-grace-for-a-new-week',
    title: 'Grace for a New Week',
    date: 'Thursday, April 16, 2026',
  },
  {
    id: 'prayer-strength-in-quiet-times',
    title: 'Strength in Quiet Times',
    date: 'Wednesday, April 15, 2026',
  },
  {
    id: 'prayer-walking-in-divine-wisdom',
    title: 'Walking in Divine Wisdom',
    date: 'Tuesday, April 14, 2026',
  },
];
