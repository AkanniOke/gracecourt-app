export type FffCentre = {
  id: string;
  name: string;
  location: string;
  meetingDay: string;
  meetingTime: string;
  leader: string;
  phone: string;
};

export const fffCentres: FffCentre[] = [
  {
    id: 'fff-wofun-centre',
    name: 'FFF Wofun Centre',
    location: 'Wofun Street',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Bro. Paul Adegoke',
    phone: '08012345678',
  },
  {
    id: 'fff-olodo-centre',
    name: 'FFF Olodo Centre',
    location: 'Olodo',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Min. Peterson.',
    phone: '08012345679',
  },
  {
    id: 'fff-sawmill-centre',
    name: 'FFF Sawmill Centre',
    location: 'Adeojo Estate',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Sis. Blessing.',
    phone: '08012345680',
  },
  {
    id: 'fff-iyana-church-centre',
    name: 'FFF Iyana Church centre',
    location: 'Iyana Church',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Min. Ife Clem',
    phone: '08012345681',
  },
];
