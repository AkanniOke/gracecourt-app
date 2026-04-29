export type ChurchEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
};

export const events: ChurchEvent[] = [
  {
    id: 'event-sunday-worship-experience',
    title: 'Sunday Worship Experience',
    date: 'April 19, 2026',
    time: '9:00 AM',
    location: 'Main Auditorium',
  },
  {
    id: 'event-midweek-bible-study',
    title: 'Midweek Bible Study',
    date: 'April 22, 2026',
    time: '6:00 PM',
    location: 'GraceCourt Hall',
  },
  {
    id: 'event-night-of-prayer',
    title: 'Night of Prayer and Worship',
    date: 'April 24, 2026',
    time: '10:00 PM',
    location: 'Prayer Center',
  },
  {
    id: 'event-community-outreach',
    title: 'Community Outreach',
    date: 'April 27, 2026',
    time: '11:00 AM',
    location: 'City Center',
  },
];
