export interface KayakRental {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  phone: string;
  hours: {
    open: string;
    close: string;
  };
  rating: number;
  reviewCount: number;
  website?: string;
  priceInfo?: string;
  activities: string[];
}

export const kayakRentalData: KayakRental[] = [
  {
    id: 'adv-paddlers-pasir-ris',
    name: 'Adventure Paddlers (Ohana Beach House)',
    address: '159W Jln. Loyang Besar, Singapore 507020',
    lat: 1.381753765684636,
    lon: 103.96186562557766,
    phone: '97377944',
    hours: {
      open: '15:00',
      close: '22:30'
    },
    rating: 4.1,
    reviewCount: 62,
    website: 'http://www.adventurepaddlers.com.sg/',
    priceInfo: 'From $15 per hour',
    activities: ['Kayaking', 'Stand-up Paddleboarding', 'Sea Kayaking']
  }, 
  {
    id: 'kokomo-kayak-pasir-ris',
    name: 'KOKOMO Beach Club',
    address: '131 Pasir Ris Road, Carpark E, Pasir Ris Town Park, 519148',
    lat: 1.3860328530944193,
    lon: 103.94464081439926,
    phone: '62388072',
    hours: {
      open: '09:00',
      close: '17:30'
    },
    rating: 4.4,
    reviewCount: 29,
    website: 'http://kokomo-beachclub.com/',
    priceInfo: '',
    activities: ['Kayaking', 'Stand-up Paddleboarding', 'Kayak Certifications', 'Canoeing']
  }, 
  {
    id: 'leisurequestsg-pasir-ris',
    name: 'Leisure Quest Sg',
    address: '125A Pasir Ris Rd, Singapore 519121',
    lat: 1.387234130827302,
    lon: 103.94198006318815,
    phone: '88748778',
    hours: {
    open: '07:00',
    close: '18:00'
    },
    rating: 5.0,
    reviewCount: 2,
    website: 'https://www.facebook.com/syafiq.alif.5076',
    priceInfo: '',
    activities: ['Kayaking', 'Pedal Kayaks',]
    }, 
      {
    id: 'purehybridz-kayak-fishing-lessons',
    name: 'Purehybridz Kayak Fishing Lessons',
    address: '125 Pasir Ris Rd, Singapore 519121',
    lat: 1.3874486446440217,
    lon: 103.94137924839855,
    phone: '80727430',
    hours: {
    open: '08:00',
    close: '16:00'
    },
    rating: 5.0,
    reviewCount: 123,
    website: 'https://linktr.ee/pwpr',
    priceInfo: '',
    activities: ['Kayaking', 'Kayak Fishing Course', 'Affordable Courses', 'Friendly Instructors']
    }, 
      {
    id: 'passionwave-pasir-ris',
    name: 'PAssion Wave @ Pasir Ris',
    address: '125 Elias Rd, Singapore 519926',
    lat: 1.3856896307730668,
    lon: 103.94335335413582,
    phone: '65824796',
    hours: {
    open: '09:00',
    close: '18:00'
    },
    rating: 4.4,
    reviewCount: 92,
    website: 'https://linktr.ee/pwpr',
    priceInfo: '',
    activities: ['Kayaking', 'Stand-up Paddleboarding', 'Kayak Courses', 'Affordable Rentals']
    }, 

    
];

// Helper function to check if kayak rental is open
export const isKayakRentalOpen = (rental: KayakRental, currentTime: Date = new Date()): boolean => {
  const [openHour, openMinute] = rental.hours.open.split(':').map(Number);
  const [closeHour, closeMinute] = rental.hours.close.split(':').map(Number);
  
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  const openTotalMinutes = openHour * 60 + openMinute;
  const closeTotalMinutes = closeHour * 60 + closeMinute;
  
  return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;
};

// Helper function to check if kayak rental is closing soon
export const isKayakRentalClosingSoon = (rental: KayakRental, currentTime: Date = new Date()): boolean => {
  const [closeHour, closeMinute] = rental.hours.close.split(':').map(Number);
  const closingTime = new Date(currentTime);
  closingTime.setHours(closeHour, closeMinute, 0, 0);
  
  const timeDiff = closingTime.getTime() - currentTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff > 0 && hoursDiff <= 1;
};