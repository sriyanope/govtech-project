import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { restaurantData, isClosingSoon, isOpen } from '@/utils/restaurantData';
import type { Restaurant } from '@/utils/restaurantData';

interface RestaurantClosingAlertProps {
  onNavigate: (restaurant: Restaurant) => void;
}

const RestaurantClosingAlert: React.FC<RestaurantClosingAlertProps> = ({ onNavigate }) => {
  const [closingSoonRestaurants, setClosingSoonRestaurants] = useState<Restaurant[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkRestaurantHours = () => {
      const closing = restaurantData.filter(restaurant => 
        isClosingSoon(restaurant) && 
        isOpen(restaurant) && 
        !dismissedAlerts.has(restaurant.id)
      );
      setClosingSoonRestaurants(closing);
    };

    // Check immediately
    checkRestaurantHours();

    // Check every minute
    const interval = setInterval(checkRestaurantHours, 60000);

    return () => clearInterval(interval);
  }, [dismissedAlerts]);

  const handleDismiss = (restaurantId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(restaurantId));
  };

  const formatClosingTime = (closeTime: string) => {
    const [hour, minute] = closeTime.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeUntilClosing = (restaurant: Restaurant) => {
    const now = new Date();
    const [closeHour, closeMinute] = restaurant.hours.close.split(':').map(Number);
    const closingTime = new Date(now);
    closingTime.setHours(closeHour, closeMinute, 0, 0);
    
    if (closeHour < 12 && now.getHours() > 12) {
      closingTime.setDate(closingTime.getDate() + 1);
    }
    
    const timeDiff = closingTime.getTime() - now.getTime();
    const minutes = Math.floor(timeDiff / (1000 * 60));
    
    return minutes;
  };

  if (closingSoonRestaurants.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-[997] space-y-2 max-w-sm">
        {closingSoonRestaurants.map((restaurant) => (
          <motion.div
            key={restaurant.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="text-white" size={20} />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-red-800">{restaurant.name}</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Closing soon at {formatClosingTime(restaurant.hours.close)}
                    </p>
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      {getTimeUntilClosing(restaurant)} minutes remaining
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismiss(restaurant.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onNavigate(restaurant)}
                    className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Navigation size={14} />
                    Navigate
                  </button>
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex-1 px-3 py-1.5 bg-white text-red-600 text-sm rounded-md hover:bg-red-50 transition-colors text-center border border-red-200"
                  >
                    Call
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default RestaurantClosingAlert;