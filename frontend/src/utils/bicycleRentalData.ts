export interface BicycleRental {
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
  website: string;
  priceInfo?: string;
}

export const bicycleRentalData: BicycleRental[] = [
  {
    id: 'gocycling-park',
    name: 'GoCycling @ Pasir Ris Park',
    address: '51 Pasir Ris Green, Singapore 518226',
    lat: 1.3788623024499185,  
    lon: 103.9485858630537,
    phone: '8831 3632',
    hours: {
      open: '09:00',
      close: '20:00'  
    },
    rating: 4.1,
    reviewCount: 22,
    website: 'gocycling.sg',
    priceInfo: '9WHX+CC Singapore'
  }
];

// Helper function to check if rental shop is open
export const isRentalOpen = (rental: BicycleRental, currentTime: Date = new Date()): boolean => {
  const [openHour, openMinute] = rental.hours.open.split(':').map(Number);
  const [closeHour, closeMinute] = rental.hours.close.split(':').map(Number);
  
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  const openTotalMinutes = openHour * 60 + openMinute;
  const closeTotalMinutes = closeHour * 60 + closeMinute;
  
  return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;
};

// Helper function to check if rental shop is closing soon
export const isRentalClosingSoon = (rental: BicycleRental, currentTime: Date = new Date()): boolean => {
  const [closeHour, closeMinute] = rental.hours.close.split(':').map(Number);
  const closingTime = new Date(currentTime);
  closingTime.setHours(closeHour, closeMinute, 0, 0);
  
  const timeDiff = closingTime.getTime() - currentTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff > 0 && hoursDiff <= 1;
};