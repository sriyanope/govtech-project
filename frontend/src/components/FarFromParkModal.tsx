'use client';

import React, { useState, useEffect } from 'react';
import { X, Train, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FarFromParkModalProps {
  isOpen: boolean;
  onClose: () => void;
  distance: number;
  userLocation: { lat: number; lon: number };
  onNavigateToMRT: (destination: any) => void;
  onNavigateToCarpark: (destination: any) => void;
}

interface MRTExit {
  exit: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  distance_meters: number;
}

interface Carpark {
  carpark_id: string;
  development: string;
  agency: string;
  lat: number;
  lon: number;
  distance_meters: number;
  lots_by_type: Record<string, number>;
  total_available: number;
  recommendation_score: number;
}

const FarFromParkModal: React.FC<FarFromParkModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onNavigateToMRT,
  onNavigateToCarpark
}) => {
  const [selectedOption, setSelectedOption] = useState<'mrt' | 'car' | null>(null);
  const [closestMRT, setClosestMRT] = useState<MRTExit | null>(null);
  const [recommendedCarpark, setRecommendedCarpark] = useState<Carpark | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userLocation) {
      fetchTransportOptions();
    }
  }, [isOpen, userLocation]);

  const fetchTransportOptions = async () => {
    setIsLoading(true);
    try {
      // Fetch closest MRT exit
      try {
        const mrtRes = await fetch(`/api/parking/mrt-exits?user_lat=${userLocation.lat}&user_lon=${userLocation.lon}`);
        if (mrtRes.ok) {
          const mrtData = await mrtRes.json();
          if (mrtData.mrt_exits && mrtData.mrt_exits.length > 0) {
            setClosestMRT(mrtData.mrt_exits[0]); // Already sorted by distance
          }
        } else {
          console.error('Failed to fetch MRT data:', mrtRes.status);
        }
      } catch (mrtError) {
        console.error('Error fetching MRT exits:', mrtError);
      }

      // Fetch recommended carpark
      try {
        const carparkRes = await fetch(`/api/parking/carparks/availability?user_lat=${userLocation.lat}&user_lon=${userLocation.lon}&limit=1`);
        if (carparkRes.ok) {
          const carparkData = await carparkRes.json();
          if (carparkData.carparks && carparkData.carparks.length > 0) {
            setRecommendedCarpark(carparkData.carparks[0]); // Already sorted by recommendation score
          }
        } else {
          const errorData = await carparkRes.json();
          console.error('Failed to fetch carpark data:', errorData);
        }
      } catch (carparkError) {
        console.error('Error fetching carpark availability:', carparkError);
      }
    } catch (error) {
      console.error('Error fetching transport options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatWalkTime = (meters: number) => {
    // Assuming average walking speed of 5 km/h
    const minutes = Math.round(meters / 1000 * 12);
    return `${minutes} min walk`;
  };

  const formatLotTypes = (lotsByType: Record<string, number>) => {
    const types = Object.entries(lotsByType)
      .map(([type, count]) => {
        const typeLabel = type === 'C' ? 'Car' : type === 'Y' ? 'Motorcycle' : type;
        return `${count} ${typeLabel}`;
      })
      .join(', ');
    return types;
  };

  const handleMRTNavigation = async () => {
    if (!closestMRT) return;
    
    try {
      const response = await fetch(
        `/api/parking/navigation/to-park?start_lat=${userLocation.lat}&start_lon=${userLocation.lon}&destination_type=mrt`
      );
      const data = await response.json();
      onNavigateToMRT(data);
      onClose();
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleCarparkNavigation = async () => {
    if (!recommendedCarpark) return;
    
    try {
      const response = await fetch(
        `/api/parking/navigation/to-park?start_lat=${userLocation.lat}&start_lon=${userLocation.lon}&destination_type=carpark`
      );
      const data = await response.json();
      onNavigateToCarpark(data);
      onClose();
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[1002]"
            onClick={onClose}
          />
          
          {/* Modal - Notion-style */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1003]"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md overflow-hidden">
              {/* Header - Clean gradient */}
              <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl font-semibold">You're far from Pasir Ris Park</h2>
                    <p className="text-blue-100 mt-1 text-sm">How would you like to get there?</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Finding best transport options...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* MRT Option */}
                    {closestMRT && (
                      <button
                        onClick={handleMRTNavigation}
                        className="w-full p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all border border-transparent hover:border-blue-200 group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Train size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Take MRT</h3>
                            <p className="text-sm text-gray-600">
                              Exit {closestMRT.exit} - {closestMRT.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatDistance(closestMRT.distance_meters)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatWalkTime(closestMRT.distance_meters)}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Car Option */}
                    {recommendedCarpark && (
                      <button
                        onClick={handleCarparkNavigation}
                        className="w-full p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all border border-transparent hover:border-purple-200 group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Car size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Drive</h3>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {recommendedCarpark.development}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatLotTypes(recommendedCarpark.lots_by_type)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {recommendedCarpark.total_available}
                            </p>
                            <p className="text-xs text-gray-500">lots</p>
                            <p className="text-xs text-gray-400">available</p>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-xs text-gray-500">
                            {formatDistance(recommendedCarpark.distance_meters)} away
                          </p>
                        </div>
                      </button>
                    )}

                    {!closestMRT && !recommendedCarpark && (
                      <div className="text-center py-4 text-gray-600">
                        No transport options found. Please try again later.
                      </div>
                    )}
                  </div>
                )}

                {/* Tips - Notion style */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Tip:</span> The park is open 24/7. 
                    Best visited during cooler morning or evening hours!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FarFromParkModal;