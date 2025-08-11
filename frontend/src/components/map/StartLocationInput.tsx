import React, { useState, useEffect } from 'react';
import { MapPin, LocateFixed, MousePointer, Building, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Facility } from '@/types/facility_types';

interface StartLocationInputProps {
  useUserLocationAsStart: boolean;
  onToggleUserLocation: (useLive: boolean) => void;
  manualStartLat: string;
  onManualLatChange: (lat: string) => void;
  manualStartLon: string;
  onManualLonChange: (lon: string) => void;
  isUserLocationAvailable: boolean;
  facilities: Facility[]; // Pass facilities for selection
  isSelectingOnMap: boolean;
  onToggleMapSelection: (selecting: boolean) => void;
  selectedStartLocation: { lat: number; lon: number; name: string } | null;
  onStartLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
}

const StartLocationInput: React.FC<StartLocationInputProps> = ({
  useUserLocationAsStart,
  onToggleUserLocation,
  manualStartLat,
  onManualLatChange,
  manualStartLon,
  onManualLonChange,
  isUserLocationAvailable,
  facilities,
  isSelectingOnMap,
  onToggleMapSelection,
  selectedStartLocation,
  onStartLocationSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFacilityPicker, setShowFacilityPicker] = useState(false);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [selectedMode, setSelectedMode] = useState<'current' | 'map' | 'facility' | 'manual'>('current');

  // Filter facilities based on search
  const filteredFacilities = facilities.filter(f => 
    f.name?.toLowerCase().includes(facilitySearch.toLowerCase()) ||
    f.class.toLowerCase().includes(facilitySearch.toLowerCase())
  );

  // Group facilities by class for better organization
  const groupedFacilities = filteredFacilities.reduce((acc, facility) => {
    if (!acc[facility.class]) {
      acc[facility.class] = [];
    }
    acc[facility.class].push(facility);
    return acc;
  }, {} as Record<string, Facility[]>);

  const handleModeChange = (mode: 'current' | 'map' | 'facility' | 'manual') => {
    setSelectedMode(mode);
    
    switch(mode) {
      case 'current':
        onToggleUserLocation(true);
        onToggleMapSelection(false);
        setShowFacilityPicker(false);
        break;
      case 'map':
        onToggleUserLocation(false);
        onToggleMapSelection(true);
        setShowFacilityPicker(false);
        break;
      case 'facility':
        onToggleUserLocation(false);
        onToggleMapSelection(false);
        setShowFacilityPicker(true);
        break;
      case 'manual':
        onToggleUserLocation(false);
        onToggleMapSelection(false);
        setShowFacilityPicker(false);
        break;
    }
  };

  const handleFacilitySelect = (facility: Facility) => {
    onStartLocationSelect({
      lat: facility.lat,
      lon: facility.lon,
      name: facility.name || facility.class
    });
    onManualLatChange(facility.lat.toString());
    onManualLonChange(facility.lon.toString());
    setShowFacilityPicker(false);
    setFacilitySearch('');
  };

  const getLocationDisplay = () => {
    if (useUserLocationAsStart) {
      return "Using current location";
    } else if (selectedStartLocation) {
      return selectedStartLocation.name;
    } else if (isSelectingOnMap) {
      return "Click on map to select...";
    } else if (manualStartLat && manualStartLon) {
      return `Custom: ${parseFloat(manualStartLat).toFixed(4)}, ${parseFloat(manualStartLon).toFixed(4)}`;
    }
    return "No location selected";
  };

  return (
    <>
      {/* Compact View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-24 left-4 z-[996] bg-white rounded-lg shadow-lg"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-3 w-full hover:bg-gray-50 transition-colors rounded-lg"
        >
          <MapPin size={18} className="text-blue-600" />
          <div className="text-left">
            <p className="text-xs text-gray-500">Start from</p>
            <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
              {getLocationDisplay()}
            </p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="ml-auto"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.div>
        </button>
      </motion.div>

      {/* Expanded Options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 left-4 z-[1001] bg-white rounded-lg shadow-xl p-4 w-80"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Choose Start Location</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {/* Current Location Option */}
              {isUserLocationAvailable && (
                <button
                  onClick={() => handleModeChange('current')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedMode === 'current' 
                      ? 'bg-blue-50 border-2 border-blue-500' 
                      : 'border-2 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <LocateFixed size={18} className="text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Current Location</p>
                    <p className="text-xs text-gray-500">Use GPS location</p>
                  </div>
                </button>
              )}

              {/* Select on Map Option */}
              <button
                onClick={() => handleModeChange('map')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedMode === 'map' 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'border-2 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MousePointer size={18} className="text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-sm">Select on Map</p>
                  <p className="text-xs text-gray-500">Click anywhere on map</p>
                </div>
              </button>

              {/* Select Facility Option */}
              <button
                onClick={() => handleModeChange('facility')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedMode === 'facility' 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'border-2 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Building size={18} className="text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-sm">Park Facility</p>
                  <p className="text-xs text-gray-500">Start from a facility</p>
                </div>
              </button>

              {/* Manual Coordinates Option */}
              <button
                onClick={() => handleModeChange('manual')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedMode === 'manual' 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'border-2 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <MapPin size={18} className="text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-sm">Enter Coordinates</p>
                  <p className="text-xs text-gray-500">Manual lat/lon input</p>
                </div>
              </button>
            </div>

            {/* Manual Input Fields */}
            {selectedMode === 'manual' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t space-y-2"
              >
                <div>
                  <label className="text-xs text-gray-600">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualStartLat}
                    onChange={(e) => onManualLatChange(e.target.value)}
                    placeholder="e.g., 1.3790"
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualStartLon}
                    onChange={(e) => onManualLonChange(e.target.value)}
                    placeholder="e.g., 103.9510"
                    className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </motion.div>
            )}

            {/* Map Selection Hint */}
            {isSelectingOnMap && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 bg-blue-50 rounded-lg"
              >
                <p className="text-sm text-blue-800">
                  Click anywhere on the map to set your start location
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Facility Picker Modal */}
      <AnimatePresence>
        {showFacilityPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1002] bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowFacilityPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Select a Facility</h3>
                  <button
                    onClick={() => setShowFacilityPicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={facilitySearch}
                    onChange={(e) => setFacilitySearch(e.target.value)}
                    placeholder="Search facilities..."
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh] p-4">
                {Object.keys(groupedFacilities).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No facilities found</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedFacilities).map(([className, classFacilities]) => (
                      <div key={className}>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          {className}
                        </h4>
                        <div className="space-y-1">
                          {classFacilities.map((facility) => (
                            <button
                              key={facility.objectid}
                              onClick={() => handleFacilitySelect(facility)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <p className="font-medium text-sm">
                                {facility.name || `${facility.class} #${facility.objectid}`}
                              </p>
                              {facility.additional_info && (
                                <p className="text-xs text-gray-500 truncate">
                                  {facility.additional_info}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StartLocationInput;