export type Announcement = {
  id: string;
  title: string;
  message: string;
  date: string;
};

export const announcements: Announcement[] = [
  {
    id: 'announcement-sunday-worship',
    title: 'Sunday Worship Service',
    message: 'Join us this Sunday at 9:00 AM for a powerful time of worship and teaching.',
    date: 'April 20, 2026',
  },
  {
    id: 'announcement-midweek-prayer',
    title: 'Midweek Prayer Gathering',
    message: 'Come together on Wednesday at 6:00 PM as we pray for families, church, and community.',
    date: 'April 22, 2026',
  },
  {
    id: 'announcement-youth-connect',
    title: 'Youth Connect Evening',
    message: 'An uplifting evening of fellowship, music, and conversation for young adults.',
    date: 'April 25, 2026',
  },
];
