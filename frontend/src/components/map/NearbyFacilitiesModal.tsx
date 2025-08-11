import React from 'react';
import { MapPin, Navigation, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFacilityIcon, getFacilityCategory, facilityCategories } from '@/utils/facilityCategories';
import type { Facility } from '@/types/facility_types';

interface NearbyFacilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFacility: Facility | null;
  nearbyFacilities: (Facility & { distance: number })[];
  onNavigateToFacility: (facility: Facility) => void;
  onAddToRoute: (facilities: Facility[]) => void;
}

const NearbyFacilitiesModal: React.FC<NearbyFacilitiesModalProps> = ({
  isOpen,
  onClose,
  targetFacility,
  nearbyFacilities,
  onNavigateToFacility,
  onAddToRoute
}) => {
  if (!targetFacility) return null;

  const targetCategory = getFacilityCategory(targetFacility.class);
  const categoryInfo = targetCategory ? facilityCategories[targetCategory] : null;
  const CategoryIcon = categoryInfo?.icon;

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatWalkTime = (meters: number): string => {
    const minutes = Math.round(meters / 1000 * 12);
    return `${minutes} min walk`;
  };

  return (
    <AnimatePresence>
      {isOpen && nearbyFacilities.length > 0 && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[1002]"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1003]"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-b from-purple-500 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Sparkles size={24} />
                      Discover More Nearby
                    </h2>
                    <p className="text-purple-100 mt-1 text-sm">
                      Similar activities in the same area
                    </p>
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
                {/* Target facility info */}
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {CategoryIcon && (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${categoryInfo.color}20` }}
                      >
                        <CategoryIcon size={20} style={{ color: categoryInfo.color }} />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">You're heading to:</p>
                      <p className="font-medium text-gray-800">
                        {targetFacility.name || targetFacility.class}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nearby facilities */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800">
                    Also nearby ({nearbyFacilities.length} {categoryInfo?.name.toLowerCase()} facilities)
                  </h3>
                  
                  {nearbyFacilities.slice(0, 3).map((facility) => {
                    const FacilityIcon = getFacilityIcon(facility.class);
                    return (
                      <button
                        key={facility.objectid}
                        onClick={() => onNavigateToFacility(facility)}
                        className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <FacilityIcon size={20} className="text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {facility.name || facility.class}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDistance(facility.distance)} • {formatWalkTime(facility.distance)}
                            </p>
                          </div>
                          <MapPin size={16} className="text-gray-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => {
                      onAddToRoute(nearbyFacilities.slice(0, 3));
                      onClose();
                    }}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation size={20} />
                    Visit All on This Trip
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Just {targetFacility.name || targetFacility.class} for Now
                  </button>
                </div>

                {/* Tip */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">Pro tip:</span> Visiting multiple facilities in one area 
                    saves time and lets you explore more of the park!
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

export default NearbyFacilitiesModal;