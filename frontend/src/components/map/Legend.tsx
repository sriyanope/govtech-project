import React, { useState } from 'react';
import { Map, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityCategories, getFacilityIcon } from '@/utils/facilityCategories';

const Legend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Legend Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-20 right-4 z-[997] p-3 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Show map legend"
      >
        <Map size={24} className="text-gray-700" />
      </button>

      {/* Legend Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[997]"
              onClick={() => setIsOpen(false)}
            />

            {/* Legend Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute bottom-20 right-4 z-[999] bg-white rounded-lg shadow-xl p-6 max-w-sm max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Map Legend</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                {Object.entries(facilityCategories).map(([key, category]) => (
                  <div key={key} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <category.icon size={18} style={{ color: category.color }} />
                      </div>
                      <h4 className="font-medium text-gray-800">{category.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-10">
                      {category.facilities.map((facility) => {
                        const Icon = getFacilityIcon(facility);
                        return (
                          <div key={facility} className="flex items-center gap-2 text-sm text-gray-600">
                            <Icon size={14} />
                            <span className="truncate">{facility}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Indicators */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-2">Status Indicators</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">Occupied (reported in last 30 min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-gray-600">Restaurant closing soon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">Your location</span>
                  </div>
                </div>
              </div>

              {/* Route Types */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-2">Route Types</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-blue-600"></div>
                    <span className="text-gray-600">Fastest route</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-green-600"></div>
                    <span className="text-gray-600">Sheltered route</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-purple-600" style={{ borderStyle: 'dashed', borderWidth: '2px 0' }}></div>
                    <span className="text-gray-600">External route (to MRT/Carpark)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Legend;