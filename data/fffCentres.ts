export type FffCentre = {
  id: string;
  name: string;
  location: string;
  meetingDay: string;
  meetingTime: string;
  leader: string;
  phone: string | null;
  whatsappLink: string | null;
};

export const fffGeneralContact = {
  phone: '+234 814 2695 934',
  whatsappLink: null,
} as const;

export const fffCentres: FffCentre[] = [
  {
    id: 'fff-wofun-centre',
    name: 'FFF Wofun Centre',
    location: 'Wofun Street',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Bro. Paul Adegoke',
    phone: '08012345678',
    whatsappLink: null,
  },
  {
    id: 'fff-olodo-centre',
    name: 'FFF Olodo Centre',
    location: 'Olodo',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Min. Peterson.',
    phone: '08012345679',
    whatsappLink: null,
  },
  {
    id: 'fff-sawmill-centre',
    name: 'FFF Sawmill Centre',
    location: 'Adeojo Estate',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Sis. Blessing.',
    phone: '08012345680',
    whatsappLink: null,
  },
  {
    id: 'fff-iyana-church-centre',
    name: 'FFF Iyana Church centre',
    location: 'Iyana Church',
    meetingDay: 'Last Wednessday of the month',
    meetingTime: '6:00 PM',
    leader: 'Min. Ife Clem',
    phone: '08012345681',
    whatsappLink: null,
  },
];
