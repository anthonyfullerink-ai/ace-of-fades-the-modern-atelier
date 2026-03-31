export interface Service {
  id: string;
  name: string;
  desc: string;
  price: string;
  duration: number; // in minutes
}

export const SERVICES: Service[] = [
  { 
    id: '01', 
    name: 'Regular Haircut', 
    desc: 'Professional and polished cuts (#2 or longer on sides) for a stylish, neat look.', 
    price: '$35', 
    duration: 30 
  },
  { 
    id: '02', 
    name: 'Regular Haircut w/ Beard', 
    desc: '#2 or longer on the sides with professional beard work.', 
    price: '$40', 
    duration: 45 
  },
  { 
    id: '03', 
    name: 'Fade Haircut', 
    desc: 'Precision taper (#1.5 or lower on the sides) for a sharp, modern appearance.', 
    price: '$40', 
    duration: 45 
  },
  { 
    id: '04', 
    name: 'Fade Haircut w/ Beard', 
    desc: '#1.5 or lower on sides with expert beard shaping.', 
    price: '$45', 
    duration: 60 
  },
  { 
    id: '05', 
    name: 'The Works', 
    desc: 'The ultimate grooming experience: includes specialty fades, razor work, hot towel, and eyebrow lining.', 
    price: '$45', 
    duration: 60 
  },
  { 
    id: '06', 
    name: 'Multi-Service Haircut', 
    desc: 'Any haircut of choice (specialty fades, shear work, faux hawks, mullets).', 
    price: '$45', 
    duration: 60 
  },
  { 
    id: '07', 
    name: 'Faux Hawk', 
    desc: 'Specialized styling and precision cut for a bold statement.', 
    price: '$45', 
    duration: 45 
  },
  { 
    id: '08', 
    name: 'Hot Towel Shave', 
    desc: 'Traditional straight razor shave on face or head with steamer and hot towels.', 
    price: '$35', 
    duration: 30 
  },
  { 
    id: '09', 
    name: 'Shape Up', 
    desc: 'Tapering of sideburns and neck area only; no length off top.', 
    price: '$20', 
    duration: 15 
  },
  { 
    id: '10', 
    name: 'Shape Up w/ Beard', 
    desc: 'Line up only with beard work; no length off top.', 
    price: '$25', 
    duration: 20 
  },
  { 
    id: '11', 
    name: 'Beard Shape Up', 
    desc: 'Precision line up and shaping of the beard only.', 
    price: '$20', 
    duration: 15 
  },
  { 
    id: '12', 
    name: 'Children’s Fade', 
    desc: 'Aged 12 and under; #1.5 or lower on the sides.', 
    price: '$35', 
    duration: 30 
  },
  { 
    id: '13', 
    name: 'Children’s Haircut', 
    desc: 'Aged 12 and under; #2 or longer on the sides.', 
    price: '$30', 
    duration: 30 
  },
  { 
    id: '14', 
    name: 'Shampoo', 
    desc: 'Professional and relaxing hair wash service.', 
    price: '$10', 
    duration: 10 
  },
];
