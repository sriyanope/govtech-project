'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sun, Cloud, Wind, Info, Umbrella, CloudRain, CloudLightning, ThermometerSun, 
  Droplets, Thermometer, Eye, Package, Glasses, Shirt, Waves, MoonStar, AlertCircle
} from 'lucide-react'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMaskFace } from '@fortawesome/free-solid-svg-icons';
import {BaseballCapIcon, SunglassesIcon, BackpackIcon} from '@phosphor-icons/react';
// import {} from '@iconify-json/wi'



interface WeatherData {
  temperature: number;
  tempLow: number;
  condition: string;
  conditionCode: string;
  windSpeed: number;
  windDirection: string; 
  humidity: number;
  psi?: number;
  apparentTemperature?: number;
  is_fallback_data?: boolean;
  fallback_reason?: string;
  data_date?: string;
}

interface WeatherRecommendation {
  text: string;
  icon: React.ReactNode;
  color: string;
}

const WeatherDisplayCard: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeatherData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/weather/full'); 
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json(); 
      
      setWeatherData({
        temperature: data.temperature || 0,
        tempLow: data.tempLow || 0,
        condition: data.condition || '',
        conditionCode: data.conditionCode || '',
        windSpeed: data.windSpeed || 0,
        windDirection: data.windDirection || 'N', 
        humidity: data.humidity || 0,
        psi: data.psi?.psi_twenty_four_hourly || 0,
        apparentTemperature: data.apparentTemperature || null,
        is_fallback_data: data.is_fallback_data || false,
        fallback_reason: data.fallback_reason || '',
        data_date: data.data_date || ''
      });
      setError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to load weather data');
      setWeatherData({
        temperature: 28,
        tempLow: 24,
        condition: 'Partly Cloudy',
        conditionCode: 'PC',
        windSpeed: 12,
        windDirection: 'NE', 
        humidity: 80,
        psi: 55,
        apparentTemperature: 31
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isNightTime = () => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7;
  };

  const getWeatherIcon = () => {
    if (!weatherData) return <Cloud className="w-8 h-8 text-gray-800" />;

    const code = weatherData.conditionCode;
    const night = isNightTime();

    // Raining
    if (['RA', 'SH', 'SR'].includes(code)) {
      return night
        ? <CloudRain className="w-8 h-8 text-blue-300" />  
        : <CloudRain className="w-8 h-8 text-blue-500" />;
    }

    // Lightning
    if (['TL', 'TS'].includes(code)) {
      return <CloudLightning className="w-8 h-8 text-purple-500" />;
    }

    // Clear conditions
    if (['CL', 'FA'].includes(code)) {
      return night
        ? <MoonStar className="w-8 h-8 text-indigo-400" />  
        : <Sun className="w-8 h-8 text-yellow-500" />;
    }

    // Partly cloudy or cloudy
    if (['PC', 'CY', 'OC'].includes(code)) {
      return night
        ? <MoonStar className="w-8 h-8 text-gray-400" />  
        : <Cloud className="w-8 h-8 text-gray-800" />;
    }

    // Windy
    if (code === 'WD') {
      return <Wind className="w-8 h-8 text-gray-600" />;
    }
    return night
      ? <MoonStar className="w-8 h-8 text-indigo-400" />
      : <Sun className="w-8 h-8 text-yellow-500" />;
  };

  const getWeatherRecommendations = (): WeatherRecommendation => {
    if (!weatherData) {
      return {
        text: "Loading weather information...",
        icon: <Info className="w-5 h-5" />,
        color: "bg-gray-100 border-gray-300 text-gray-800"
      };
    }

    if (weatherData.psi && weatherData.psi > 100) {
      return {
        text: "High PSI levels detected. Consider indoor activities!",
        icon: <Info className="w-5 h-5" />,
        color: "bg-orange-100 border-orange-300 text-orange-800"
      };
    }
    
    const code = weatherData.conditionCode;
    if (code === 'RA' || code === 'SH' || code === 'TL' || code === 'TS') {
      return {
        text: "It's raining! Consider exploring our parks using our sheltered paths",
        icon: <Umbrella className="w-5 h-5" />,
        color: "bg-blue-100 border-blue-300 text-blue-800"
      };
    }
    
    if (weatherData.temperature >= 32) {
      return {
        text: "It's hot outside! Stay hydrated and seek shade.",
        icon: <ThermometerSun className="w-5 h-5" />,
        color: "bg-yellow-100 border-yellow-300 text-yellow-800"
      };
    }
    
    return {
      text: "Perfect weather for outdoor activities!",
      icon: <Sun className="w-5 h-5" />,
      color: "bg-green-100 border-green-300 text-green-800"
    };
  };

  const getPackingList = (): { item: string; icon: React.ReactNode }[] => {
    if (!weatherData) return [];

    const listMap = new Map<string, React.ReactNode>();
    const code = weatherData.conditionCode;
    const temp = weatherData.temperature;
    const humidity = weatherData.humidity;
    const psi = weatherData.psi;

    if (code === 'RA' || code === 'SH' || code === 'TL' || code === 'TS') {
      listMap.set('Umbrella', <Umbrella className="w-4 h-4 text-blue-500" />);
      listMap.set('Raincoat', <Shirt className="w-4 h-4 text-blue-500" />); 
      listMap.set('Waterproof bag', <Package className="w-4 h-4 text-blue-500" />); 
    } else { 
      listMap.set('Sunscreen', <Sun className="w-4 h-4 text-yellow-600" />);
      listMap.set('Hat or cap', <BaseballCapIcon className="w-4 h-4 text-red-600" />); 
      listMap.set('Sunglasses', <SunglassesIcon className="w-4 h-4 text-black-600" />);
    }

    if (temp >= 30 || humidity >= 85) { 
      listMap.set('Water bottle (stay hydrated!)', <Droplets className="w-4 h-4 text-blue-600" />);
      listMap.set('Lightweight, breathable clothing', <Shirt className="w-4 h-4 text-green-600" />);
    } else if (temp < 25) { 
      listMap.set('Light jacket', <Shirt className="w-4 h-4 text-gray-600" />); 
    }

    if (psi && psi > 80) { 
      listMap.set('N95 Mask', <FontAwesomeIcon icon={faMaskFace} className="text-red-500" size="sm" />);
    } else if (psi && psi < 80) {
      listMap.set('N95/Surgical Mask (Optional)', <FontAwesomeIcon icon={faMaskFace} className="text-blue-300" size="sm" />);
    }
    if (listMap.size === 0) {
        listMap.set('Comfortable shoes', <Shirt className="w-4 h-4 text-gray-800" />);
        listMap.set('Phone & charger', <Info className="w-4 h-4 text-gray-800" />); 
    }

    return Array.from(listMap.entries()).map(([item, icon]) => ({ item, icon }));
  };

  const recommendation = getWeatherRecommendations();
  const packingList = getPackingList();

  if (isLoading) {
    return (
      <div className="inline-block bg-white rounded-2xl shadow-xl p-6 animate-pulse">
        <div className="flex items-center justify-between gap-8">
          <div className="text-left">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-block bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl"> 
      {/* Fallback Data Warning */}
      {weatherData?.is_fallback_data && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Limited Data Available</p>
            <p className="text-amber-700 mt-1">
              Weather data is temporarily unavailable between 12am-5am due to API limitations. Showing data from {weatherData.data_date || 'previous day'}.
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row lg:space-x-8"> 
        {/* Main Weather Section */}
        <div className="flex-1 min-w-0"> 
          <div className="flex items-start justify-between gap-4 mb-4"> 
            <div className="text-left">
              <p className="text-sm text-gray-800">Current Weather</p>
              <div className="flex items-center gap-2 mt-1">
                {getWeatherIcon()}
                <div>
                  <span className="text-3xl font-bold text-gray-900"> 
                    {weatherData?.temperature || '--'}°C
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mt-1">{weatherData?.condition || 'Loading...'}</p>
            </div>
          </div>
          
          {/* Weather Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"> 
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Thermometer className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">Feels Like</p>
                <p className="text-sm font-medium text-gray-900">
                  {weatherData?.apparentTemperature ? `${Math.round(weatherData.apparentTemperature)}°C` : '--'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Wind className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">Wind</p>
                <p className="text-sm font-medium text-gray-900">{weatherData?.windSpeed || '--'} km/h</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Droplets className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">Humidity</p>
                <p className="text-sm font-medium text-gray-900">{weatherData?.humidity || '--'}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Eye className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500">PSI</p>
                <p className="text-sm font-medium text-gray-900">{weatherData?.psi || '--'}</p>
              </div>
            </div>
          </div>
          
          {/* Weather Recommendation */}
          <div className={`p-3 rounded-lg border ${recommendation.color}`}>
            <div className="flex items-center gap-2">
              {recommendation.icon}
              <p className="text-sm font-medium">{recommendation.text}</p>
            </div>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="hidden lg:block w-px bg-gray-200 self-stretch mx-4"></div>

        {/* Packing List Section */}
        {packingList.length > 0 && (
          <div className="flex-1 mt-6 lg:mt-0 p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <BackpackIcon className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-sm">Suggested Packing List:</span>
            </div>
            <ul className="list-none p-0 m-0 text-sm space-y-2"> 
              {packingList.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-4 text-center">{error}</p>
      )}
    </div>
  );
};

export default WeatherDisplayCard;