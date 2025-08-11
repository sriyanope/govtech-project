import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Navigation, Utensils, Bike, Anchor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityCategories, getFacilityCategory } from '@/utils/facilityCategories';
import type { Facility } from '@/types/facility_types';

interface SearchPanelProps {
  facilities: Facility[];
  userLocation: { lat: number; lon: number } | null;
  selectedFacility: Facility | null;
  isOpen: boolean;
  searchQuery: string;
  showOnlyAvailable: boolean;
  visibleCategories: Set<string>;
  onFacilityClick: (facility: Facility) => void;
  facilityReports: Record<string, { timestamp: number; occupied: boolean }>;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  facilities,
  userLocation,
  selectedFacility,
  isOpen,
  searchQuery,
  showOnlyAvailable,
  visibleCategories,
  onFacilityClick,
  facilityReports
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['essentials']));

  const isFacilityOpen = (facility: Facility, currentTime: Date = new Date()): boolean => {
    if (!facility.hours?.open || !facility.hours?.close) return true;
    
    const [openHour, openMinute] = facility.hours.open.split(':').map(Number);
    const [closeHour, closeMinute] = facility.hours.close.split(':').map(Number);
    
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

  const isFacilityClosingSoon = (facility: Facility, currentTime: Date = new Date()): boolean => {
    if (!facility.hours?.close) return false;
    
    const [closeHour, closeMinute] = facility.hours.close.split(':').map(Number);
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

  // Helper to calculate distance between two lat/lon points
  const calculateDistanceBetweenPoints = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const delta_phi = (lat2-lat1) * Math.PI/180;
    const delta_lambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(delta_phi/2) * Math.sin(delta_phi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(delta_lambda/2) * Math.sin(delta_lambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  }, []);

  const getMealTime = (): 'breakfast' | 'lunch' | 'dinner' | null => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 11 && hour < 14) return 'lunch';
    if (hour >= 17 && hour < 21) return 'dinner';
    return null;
  };

  // Calculate distance from user to facility
  const calculateDistance = (lat: number, lon: number): number | null => {
    if (!userLocation) return null;
    return calculateDistanceBetweenPoints(userLocation.lat, userLocation.lon, lat, lon);
  };

  // Check if facility is recently occupied
  const isRecentlyOccupied = (facility: Facility): boolean => {
    const reportKey = `${facility.class}_${facility.objectid}`;
    const report = facilityReports[reportKey];
    return !!(report && Date.now() - report.timestamp < 30 * 60 * 1000);
  };

  // Get popular items based on time and facility type
  const popularItems = useMemo(() => {
    const mealTime = getMealTime();
    
    if (mealTime) {
      // During meal times, show restaurants
      return facilities
        .filter(f => f.facility_type === 'restaurant' && isFacilityOpen(f))
        .map(restaurant => ({
          ...restaurant,
          distance: calculateDistance(restaurant.lat, restaurant.lon)
        }))
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        })
        .slice(0, 5);
    } else {
      // Outside meal times, show activity facilities
      const activities: any[] = facilities
        .filter(f => 
          (f.facility_type === 'bike_rental' || 
           f.facility_type === 'kayak_rental' ||
           ['FITNESS AREA', 'MULTIPURPOSE COURT', 'DOG RUN'].includes(f.class)) &&
          isFacilityOpen(f)
        )
        .map(facility => ({
          ...facility,
          distance: calculateDistance(facility.lat, facility.lon)
        }));
      
      // Sort by distance and return top 5
      return activities
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        })
        .slice(0, 5);
    }
  }, [facilities, userLocation, calculateDistanceBetweenPoints]);

  // Group facilities by category and add distance
  const groupedFacilities = useMemo(() => {
    const groups: Record<string, Array<Facility & { distance: number | null }>> = {};

    // Initialize all categories
    Object.keys(facilityCategories).forEach(key => {
      groups[key] = [];
    });

    // Process facilities
    facilities.forEach(facility => {
      const category = getFacilityCategory(facility.class);
      
      // Special handling for restaurants and rentals based on facility_type
      let effectiveCategory = category;
      if (facility.facility_type === 'restaurant') {
        effectiveCategory = 'eateries';
      } else if (facility.facility_type === 'bike_rental' || facility.facility_type === 'kayak_rental') {
        effectiveCategory = 'active-life';
      }
      
      if (effectiveCategory && visibleCategories.has(effectiveCategory)) {
        // Apply search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            facility.class.toLowerCase().includes(searchLower) ||
            (facility.name && facility.name.toLowerCase().includes(searchLower)) ||
            (facility.cuisine && facility.cuisine.toLowerCase().includes(searchLower)) ||
            (facility.activities && facility.activities.some(a => a.toLowerCase().includes(searchLower)));
          if (!matchesSearch) return;
        }

        // Apply availability filter
        if (showOnlyAvailable && isRecentlyOccupied(facility)) return;

        const distance = calculateDistance(facility.lat, facility.lon);
        groups[effectiveCategory].push({
          ...facility,
          distance
        });
      }
    });

    // Sort each category by distance
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    });

    return groups;
  }, [facilities, userLocation, searchQuery, showOnlyAvailable, visibleCategories, facilityReports, calculateDistanceBetweenPoints]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const formatDistance = (meters: number | null): string => {
    if (meters === null) return '';
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const mealTime = getMealTime();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="absolute top-28 left-0 bottom-0 z-[999] bg-white shadow-lg w-80 overflow-hidden"
        >
          <div className="h-full flex flex-col">
            {/* Popular Right Now Section */}
            <div className="border-b p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Popular Right Now</h3>
              <div className="space-y-2">
                {popularItems.length > 0 ? (
                  popularItems.map((item) => {
                    const getIcon = () => {
                      if (item.facility_type === 'restaurant') return <Utensils size={16} className="text-white" />;
                      if (item.facility_type === 'bike_rental') return <Bike size={16} className="text-white" />;
                      if (item.facility_type === 'kayak_rental') return <Anchor size={16} className="text-white" />;
                      return <Navigation size={16} className="text-white" />;
                    };

                    const getColor = () => {
                      if (item.facility_type === 'restaurant') return 'bg-orange-500';
                      if (item.facility_type === 'bike_rental') return 'bg-blue-500';
                      if (item.facility_type === 'kayak_rental') return 'bg-cyan-500';
                      return 'bg-purple-500';
                    };

                    const getBgColor = () => {
                      if (item.facility_type === 'restaurant') return 'bg-orange-50 hover:bg-orange-100';
                      if (item.facility_type === 'bike_rental') return 'bg-blue-50 hover:bg-blue-100';
                      if (item.facility_type === 'kayak_rental') return 'bg-cyan-50 hover:bg-cyan-100';
                      return 'bg-purple-50 hover:bg-purple-100';
                    };

                    return (
                      <button
                        key={`${item.facility_type}-${item.objectid}`}
                        onClick={() => onFacilityClick(item)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${getBgColor()}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColor()}`}>
                              {getIcon()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{item.name || item.class}</p>
                              {item.facility_type === 'restaurant' && (
                                <>
                                  <p className="text-xs text-gray-600">
                                    {item.cuisine} • {item.price_range}
                                  </p>
                                  {mealTime && (
                                    <p className="text-xs text-orange-600 mt-1">
                                      🔥 Popular for {mealTime}
                                    </p>
                                  )}
                                </>
                              )}
                              {(item.facility_type === 'bike_rental' || item.facility_type === 'kayak_rental') && (
                                <>
                                  {item.hours?.close && (
                                    <p className="text-xs text-gray-600">
                                      Open until {item.hours.close}
                                    </p>
                                  )}
                                  <p className="text-xs text-blue-600 mt-1">
                                    {item.facility_type === 'bike_rental' ? '🚴 Bicycle rental' : '🌊 Water activities'}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          {item.distance !== null && (
                            <span className="text-sm text-gray-500">
                              {formatDistance(item.distance)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No popular items at this time
                  </p>
                )}
              </div>
            </div>

            {/* Near You Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 pb-2">
                <h3 className="font-semibold text-gray-800 mb-1">Near You</h3>
                <p className="text-xs text-gray-600">Facilities grouped by type</p>
              </div>

              {Object.entries(groupedFacilities).map(([categoryKey, items]) => {
                const category = facilityCategories[categoryKey];
                if (!category || items.length === 0) return null;

                const isExpanded = expandedCategories.has(categoryKey);
                const Icon = category.icon;

                return (
                  <div key={categoryKey} className="border-b">
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Icon size={18} style={{ color: category.color }} />
                        </div>
                        <span className="font-medium text-gray-800">{category.name}</span>
                        <span className="text-sm text-gray-500">({items.length})</span>
                      </div>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-2 space-y-1">
                            {items.slice(0, 5).map((item) => {
                              const isNearby = item.distance !== null && item.distance < 500;
                              const isOccupied = isRecentlyOccupied(item);
                              const isSelected = selectedFacility?.objectid === item.objectid;
                              const isClosed = !isFacilityOpen(item);
                              const closingSoon = isFacilityClosingSoon(item);

                              return (
                                <button
                                  key={`facility-${item.objectid}`}
                                  onClick={() => onFacilityClick(item)}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    isSelected
                                      ? 'bg-blue-100 text-blue-700'
                                      : isOccupied
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                      : isNearby
                                      ? 'bg-green-50 hover:bg-green-100'
                                      : 'hover:bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {item.name || item.class}
                                      </p>
                                      {item.additional_info && (
                                        <p className="text-xs text-gray-500 truncate">
                                          {item.additional_info}
                                        </p>
                                      )}
                                      {item.facility_type === 'restaurant' && item.cuisine && (
                                        <p className="text-xs text-gray-500">
                                          {item.cuisine} • {item.price_range}
                                        </p>
                                      )}
                                      {item.hours && (
                                        <p className="text-xs text-gray-500">
                                          {item.hours.open} - {item.hours.close}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                      {closingSoon && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                      )}
                                      {isClosed && (
                                        <span className="text-xs text-red-600">Closed</span>
                                      )}
                                      {isOccupied && <Clock size={14} className="text-red-500" />}
                                      {item.distance !== null && (
                                        <span className={`text-xs ${isNearby ? 'text-green-600 font-medium' : 'text-gray-500'} flex items-center gap-1`}>
                                          <MapPin size={12} />
                                          {formatDistance(item.distance)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                            {items.length > 5 && (
                              <p className="text-xs text-gray-500 text-center py-1">
                                +{items.length - 5} more
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchPanel;