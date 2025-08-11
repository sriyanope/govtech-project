import React from 'react';

interface RoutePreferenceToggleProps {
  routePreference: 'fastest' | 'sheltered';
  onRoutePreferenceChange: (preference: 'fastest' | 'sheltered') => void;
}

const RoutePreferenceToggle: React.FC<RoutePreferenceToggleProps> = ({
  routePreference,
  onRoutePreferenceChange
}) => {
  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[996] bg-white rounded-lg shadow-lg p-1">
      <div className="flex">
        <button
          onClick={() => onRoutePreferenceChange('fastest')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            routePreference === 'fastest'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Fastest Route
        </button>
        <button
          onClick={() => onRoutePreferenceChange('sheltered')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            routePreference === 'sheltered'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Sheltered Route
        </button>
      </div>
    </div>
  );
};

export default RoutePreferenceToggle;