'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Car, Navigation, MapPin, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
// import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import 'leaflet/dist/leaflet.css';

interface ParkingSpot {
  id: string;
  name: string;
  totalSpots: number;
  availableSpots: number;
  lat: number;
  lon: number;
  description: string;
  distance?: number;
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

let L: any;

const ParkingPage: React.FC = () => {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Park bounds (Pasir Ris Park)
  const PARK_CENTER: [number, number] = [1.3790, 103.9510];
  const PARK_BOUNDS = {
    minLat: 1.3690,
    maxLat: 1.3890,
    minLon: 103.9430,
    maxLon: 103.9590
  };

  // adding mock data here - future steps add proper parking data to backend

  const defaultParkingSpots: ParkingSpot[] = [
    {
      id: '25spot',
      name: '25 Spot Parking',
      totalSpots: 25,
      availableSpots: 12,
      lat: 1.3720,
      lon: 103.9440,
      description: 'Near park entrance'
    },
    {
      id: '24spot',
      name: '24 Spot Parking',
      totalSpots: 24,
      availableSpots: 8,
      lat: 1.3745,
      lon: 103.9485,
      description: 'Near activity area'
    },
    {
      id: '50spot',
      name: '50 Spot Parking',
      totalSpots: 50,
      availableSpots: 35,
      lat: 1.3760,
      lon: 103.9510,
      description: 'Main parking area'
    }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leafletModule) => {
        L = leafletModule.default;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setLeafletLoaded(true);
      });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !leafletLoaded || !L) return;

    const map = L.map(mapContainerRef.current, {
      center: PARK_CENTER,
      zoom: 15,
      maxBounds: [
        [PARK_BOUNDS.minLat - 0.01, PARK_BOUNDS.minLon - 0.01],
        [PARK_BOUNDS.maxLat + 0.01, PARK_BOUNDS.maxLon + 0.01]
      ],
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersRef.current = markersGroup;


    const parkBoundary = L.rectangle([
      [PARK_BOUNDS.minLat, PARK_BOUNDS.minLon],
      [PARK_BOUNDS.maxLat, PARK_BOUNDS.maxLon]
    ], {
      color: '#166534',
      weight: 2,
      fillOpacity: 0.05,
      fillColor: '#22c55e',
      // dashArray: '5, 5'
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletLoaded]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }

    fetchCarparkData();
  }, []);


  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !L) return;

    markersRef.current.clearLayers();

    parkingSpots.forEach(spot => {
      const availabilityPercentage = (spot.availableSpots / spot.totalSpots) * 100;
      let color = '#22c55e'; // green
      if (availabilityPercentage <= 20) color = '#ef4444'; // red
      else if (availabilityPercentage <= 50) color = '#f59e0b'; // amber

      const icon = L.divIcon({
        className: 'custom-parking-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
              <path d="M9 7h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H9V7z"/>
            </svg>
            <div style="
              position: absolute;
              bottom: -20px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              color: ${color};
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              white-space: nowrap;
            ">
              ${spot.availableSpots}/${spot.totalSpots}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([spot.lat, spot.lon], { icon });

      marker.on('click', () => {
        setSelectedSpot(spot);
        mapRef.current?.setView([spot.lat, spot.lon], 17);
      });

      marker.bindTooltip(spot.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -20]
      });

      markersRef.current!.addLayer(marker);
    });
  }, [parkingSpots, L]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation || !L) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
    } else {
      const userIconHtml = `
        <div style="
          background-color: #3b82f6;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0,0,0,0.3); }
            100% { box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3); }
          }
        </style>
      `;

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: userIconHtml,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        zIndexOffset: 1000
      }).addTo(mapRef.current);

      userMarkerRef.current.bindTooltip('You', {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });
    }
  }, [userLocation, L]);

  const fetchCarparkData = async () => {
    setIsLoading(true);
    try {
      // Use default location if user location not available
      const lat = userLocation?.lat || 1.3790;
      const lon = userLocation?.lon || 103.9510;
      
      const response = await fetch(
        `/api/parking/carparks/availability?user_lat=${lat}&user_lon=${lon}&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        const carparks: Carpark[] = data.carparks || [];
        
        // Transform carpark data to parking spots
        const spots = carparks.map((cp, index) => ({
          id: cp.carpark_id,
          name: cp.development,
          totalSpots: Object.values(cp.lots_by_type).reduce((sum: number, count: number) => sum + count + 20, 0), // Adding base spots
          availableSpots: cp.total_available,
          lat: cp.lat,
          lon: cp.lon,
          description: `${Object.entries(cp.lots_by_type).map(([type, count]) => 
            `${count} ${type === 'C' ? 'Car' : type === 'Y' ? 'Motorcycle' : type}`
          ).join(', ')}`,
          distance: cp.distance_meters
        }));
        
        setParkingSpots(spots.length > 0 ? spots : defaultParkingSpots);
      } else {
        setParkingSpots(defaultParkingSpots);
      }
    } catch (error) {
      console.error('Error fetching carpark data:', error);
      setParkingSpots(defaultParkingSpots);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleNavigate = (spot: ParkingSpot) => {
    // Store selected spot in localStorage for map page to use
    localStorage.setItem('selectedParkingSpot', JSON.stringify(spot));
    window.location.href = `/map?focus=parking&lat=${spot.lat}&lon=${spot.lon}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/map" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Back to Map
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Parking at Pasir Ris Park</h1>
          <p className="text-gray-600 mt-2">
            {userLocation ? 'Showing parking spots nearest to you' : 'Find available parking spots'}
          </p>
        </div>

        {/* Interactive Map */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Parking Overview</h2>
          
          {/* Leaflet Map Container */}
          <div className="relative rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg text-sm">
              <h4 className="font-medium mb-2">Availability</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Good (&gt;50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Limited (20-50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>Full (&lt;20%)</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Your location</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Spot Info */}
        {selectedSpot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Selected: {selectedSpot.name}</h3>
                <p className="text-sm text-blue-700">{selectedSpot.description}</p>
              </div>
              <button
                onClick={() => handleNavigate(selectedSpot)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Navigation size={16} />
                Navigate Here
              </button>
            </div>
          </motion.div>
        )}

        {/* Parking Spots List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Available Parking</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading parking information...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {parkingSpots.map((spot) => (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer ${
                    selectedSpot?.id === spot.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedSpot(spot);
                    mapRef.current?.setView([spot.lat, spot.lon], 17);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{spot.name}</h3>
                      <p className="text-sm text-gray-600">{spot.description}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Car size={24} className="text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Available</span>
                      <span className={`font-bold text-lg ${getAvailabilityColor(spot.availableSpots, spot.totalSpots)}`}>
                        {spot.availableSpots}/{spot.totalSpots}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          spot.availableSpots / spot.totalSpots > 0.5
                            ? 'bg-green-500'
                            : spot.availableSpots / spot.totalSpots > 0.2
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${(spot.availableSpots / spot.totalSpots) * 100}%` }}
                      ></div>
                    </div>
                    
                    {spot.distance && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-1" />
                        {formatDistance(spot.distance)}
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(spot);
                      }}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation size={16} />
                      Navigate
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Parking Information</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <Clock size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Parking is available 24/7</span>
            </li>
            <li className="flex items-start">
              <Car size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Free parking for the first 2 hours</span>
            </li>
            <li className="flex items-start">
              <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Multiple entry points to the park from each parking area</span>
            </li>
          </ul>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ParkingPage;