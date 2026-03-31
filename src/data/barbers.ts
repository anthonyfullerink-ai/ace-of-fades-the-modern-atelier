export interface Barber {
  id: string;
  name: string;
  title: string;
  avatar?: string;
}

export const BARBERS: Barber[] = [
  {
    id: 'mo',
    name: 'Mo The Barber',
    title: 'Master Barber • Owner',
  },
];
