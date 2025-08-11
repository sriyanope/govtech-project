export interface Restaurant {
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
  priceRange: string;
  rating: number;
  reviewCount: number;
  cuisine: string;
  reservationLinks: string[];
  orderLinks: string[];
  serviceOptions: string[];
  website?: string;
}

export const restaurantData: Restaurant[] = [
  {
    id: 'georges-cove',
    name: 'georges @ The Cove',
    address: '133 Pasir Ris Rd, Singapore 519149',
    lat: 1.3852102126214354,
    lon: 103.94483849622333,
    phone: '6585 0535',
    hours: {
      open: '09:00',
      close: '21:00'
    },
    priceRange: '$$',
    rating: 4.2,
    reviewCount: 1400,
    cuisine: 'Bar & grill',
    reservationLinks: ['chope.co', 'quandoo.sg'],
    orderLinks: ['foodpanda.sg'],
    serviceOptions: ['Happy-hour food', 'Great cocktails', 'Vegan options'],
    website: 'ccpl.ninjacx.com'
  },
  {
    id: 'rasa-istimewa',
    name: 'Rasa Istimewa @ Pasir Ris',
    address: '201 Pasir Ris Rd, Singapore 519147',
    lat: 1.3823788900233862,
    lon: 103.94775122134968,
    phone: '6386 9339',
    hours: {
      open: '12:00',
      close: '24:00'  // Opens 12pm as shown
    },
    priceRange: '$$',
    rating: 4.3,
    reviewCount: 781,
    cuisine: 'Restaurant',
    reservationLinks: ['oddle.me'],
    orderLinks: ['oddle.me'],
    serviceOptions: ['Outdoor seating', 'Vegetarian options'],
    website: 'rasaistimewa.sg'
  },
  {
    id: 'ohana-beach-house',
    name: 'Ohana Beach House (Pasir Ris)',
    address: '159W Jln Loyang Besar, Singapore 507020',
    lat: 1.3811542615526586,
    lon: 103.96148945204119,
    phone: '9737 7944',
    hours: {
      open: '08:30',
      close: '20:30'
    },
    priceRange: '$20-30',
    rating: 4.3,
    reviewCount: 331,
    cuisine: 'Restaurant',
    reservationLinks: ['quandoo.sg'],
    orderLinks: [],
    serviceOptions: ['Has outdoor seating'],
    website: undefined
  }
];

// Helper function to check if restaurant is closing soon
export const isClosingSoon = (restaurant: Restaurant, currentTime: Date = new Date()): boolean => {
  const [closeHour, closeMinute] = restaurant.hours.close.split(':').map(Number);
  const closingTime = new Date(currentTime);
  closingTime.setHours(closeHour, closeMinute, 0, 0);
  
  // If closing time is past midnight, add a day
  if (closeHour < 12 && currentTime.getHours() > 12) {
    closingTime.setDate(closingTime.getDate() + 1);
  }
  
  const timeDiff = closingTime.getTime() - currentTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff > 0 && hoursDiff <= 1; // Within 1 hour of closing
};

// Helper function to check if restaurant is open
export const isOpen = (restaurant: Restaurant, currentTime: Date = new Date()): boolean => {
  const [openHour, openMinute] = restaurant.hours.open.split(':').map(Number);
  const [closeHour, closeMinute] = restaurant.hours.close.split(':').map(Number);
  
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  const openTotalMinutes = openHour * 60 + openMinute;
  let closeTotalMinutes = closeHour * 60 + closeMinute;
  
  // Handle cases where closing time is past midnight
  if (closeTotalMinutes < openTotalMinutes) {
    if (currentTotalMinutes >= openTotalMinutes || currentTotalMinutes < closeTotalMinutes) {
      return true;
    }
  } else {
    if (currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes) {
      return true;
    }
  }
  
  return false;
};