import React from 'react';
import { Cloud, Sun, Umbrella, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WeatherRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptSuggestion: () => void;
  weatherCondition: 'rain' | 'hot';
  currentTemp?: number;
  forecast?: string;
}

const WeatherRouteModal: React.FC<WeatherRouteModalProps> = ({
  isOpen,
  onClose,
  onAcceptSuggestion,
  weatherCondition,
  currentTemp,
  forecast
}) => {
  const isRaining = weatherCondition === 'rain';
  
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
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[1003]"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md overflow-hidden">
              {/* Header with weather-appropriate gradient */}
              <div className={`${isRaining ? 'bg-gradient-to-b from-blue-500 to-blue-600' : 'bg-gradient-to-b from-orange-500 to-orange-600'} px-6 py-5`}>
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      {isRaining ? <Umbrella size={24} /> : <Sun size={24} />}
                      Weather Advisory
                    </h2>
                    <p className="text-blue-100 mt-1 text-sm">
                      {isRaining ? 'It\'s raining outside' : `It's ${currentTemp}°C outside`}
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
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isRaining ? 'bg-blue-100' : 'bg-orange-100'
                  }`}>
                    <Cloud size={24} className={isRaining ? 'text-blue-600' : 'text-orange-600'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 mb-2">
                      {isRaining ? 'Stay dry with a sheltered route' : 'Stay cool with a sheltered route'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isRaining 
                        ? `The current forecast shows ${forecast}. We recommend using the sheltered route to avoid getting wet.`
                        : `The temperature is currently ${currentTemp}°C. We recommend using the sheltered route to stay cool and avoid direct sunlight.`
                      }
                    </p>
                  </div>
                </div>

                {/* Benefits of sheltered route */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 font-medium mb-2">Benefits of sheltered routes:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Protection from {isRaining ? 'rain' : 'direct sunlight'}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Access to shelters and rest areas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      More comfortable journey
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={onAcceptSuggestion}
                    className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isRaining ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    <Umbrella size={20} />
                    Use Sheltered Route
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Keep Fastest Route
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WeatherRouteModal;