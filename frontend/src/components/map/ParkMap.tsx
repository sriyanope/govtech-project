"use client"; 

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocateFixed, X, Bike } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import MapHeader from '@/components/map/mapHeader';
import MapFooter from '@/components/layout/Footer';
import SearchPanel from '@/components/map/SearchPanel';
import Legend from '@/components/map/Legend';
import FacilityAvailabilityModal from '@/components/map/FacilityAvailabilityModal';
import RestaurantClosingAlert from '@/components/map/RestaurantClosingAlert';
import FarFromParkModal from '@/components/FarFromParkModal';
import RoutePreferenceToggle from '@/components/map/RoutePreferenceToggle';
import WeatherRouteModal from '@/components/map/WeatherRouteModal';
import NearbyFacilitiesModal from '@/components/map/NearbyFacilitiesModal';
import StartLocationInput from '@/components/map/StartLocationInput';
import { restaurantData, isClosingSoon } from '@/utils/restaurantData';
import { bicycleRentalData } from '@/utils/bicycleRentalData';
import { kayakRentalData, isKayakRentalClosingSoon } from '@/utils/kayakRentalData';
import { getFacilityCategory, getFacilityIcon as getCategoryIcon } from '@/utils/facilityCategories'; 

// Types
import type { 
  Facility, 
  WeatherData, 
  Route, 
  AmenityAlongRoute, 
  BackendRouteResponse, 
  UserLocation 
} from '@/types/facility_types';
import type { Restaurant } from '@/utils/restaurantData';
import type { BicycleRental } from '@/utils/bicycleRentalData';
import type { KayakRental } from '@/utils/kayakRentalData';

// avoiding SSR issues with loading leaflet
let L: any;

const ParkMap: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedKayakRental, setSelectedKayakRental] = useState<KayakRental | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [amenitiesAlongRoute, setAmenitiesAlongRoute] = useState<AmenityAlongRoute[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [routePreference, setRoutePreference] = useState<'fastest' | 'sheltered'>('fastest');
  const [facilityReports, setFacilityReports] = useState<Record<string, { timestamp: number; occupied: boolean }>>({});
  const [showWeatherAlert, setShowWeatherAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [showFarFromParkModal, setShowFarFromParkModal] = useState(false);
  const [distanceFromPark, setDistanceFromPark] = useState<number | null>(null);
  const [externalRoute, setExternalRoute] = useState<any>(null);
  const [hasInteractedWithFarFromParkModal, setHasInteractedWithFarFromParkModal] = useState(false);
  const [useUserLocationAsStart, setUseUserLocationAsStart] = useState(true);
  const [manualStartLat, setManualStartLat] = useState<string>('');
  const [manualStartLon, setManualStartLon] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set()
  );
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityModalFacility, setAvailabilityModalFacility] = useState<Facility | null>(null);
  const [showWeatherRouteModal, setShowWeatherRouteModal] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState<'rain' | 'hot' | null>(null);
  const [showNearbyFacilitiesModal, setShowNearbyFacilitiesModal] = useState(false);
  const [nearbyFacilities, setNearbyFacilities] = useState<(Facility & { distance: number })[]>([]);
  const [navigatingToFacility, setNavigatingToFacility] = useState<Facility | null>(null);
  const [isUserLocationAvailable, setIsUserLocationAvailable] = useState(false);

  // New state variables for map click selection
  const [isSelectingStartOnMap, setIsSelectingStartOnMap] = useState(false);
  const [selectedStartLocation, setSelectedStartLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [startLocationMarker, setStartLocationMarker] = useState<any>(null);


  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const amenityMarkersRef = useRef<any>(null);
  const restaurantMarkersRef = useRef<any>(null);
  const kayakMarkersRef = useRef<any>(null);

  //parks bounds - only for pasir ris for now
  const PARK_CENTER: [number, number] = [1.3790, 103.9510];
  const PARK_BOUNDS = {
    minLat: 1.3690,
    maxLat: 1.3890,
    minLon: 103.9430,
    maxLon: 103.9590
  };

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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !leafletLoaded || !L) return;

    const map = L.map(mapContainerRef.current, {
      center: PARK_CENTER,
      zoom: 16,
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
    const amenityMarkersGroup = L.layerGroup().addTo(map);
    const restaurantMarkersGroup = L.layerGroup().addTo(map);
    const kayakMarkersGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersRef.current = markersGroup;
    amenityMarkersRef.current = amenityMarkersGroup;
    restaurantMarkersRef.current = restaurantMarkersGroup;
    kayakMarkersRef.current = kayakMarkersGroup;

    // drawing the park boundary using Nparks's geojson data
    fetch('/data/pasirris-boundary.geojson')
      .then((res) => res.json())
      .then((geojsonData) => {
        const boundaryLayer = L.geoJSON(geojsonData, {
          style: {
            color: '#166534',
            weight: 2,
            fillOpacity: 0.05,
            fillColor: '#22c55e',
          },
        });
        boundaryLayer.addTo(map);
      });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletLoaded]);

  // handling map click for start location selection
  useEffect(() => {
    if (!mapRef.current || !L || !isSelectingStartOnMap) return;

    const handleMapClick = (e: any) => {
      const { lat, lng } = e.latlng;
      
      // Update the selected start location
      setSelectedStartLocation({
        lat: lat,
        lon: lng,
        name: `Custom location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      });
      
      // Update manual input fields
      setManualStartLat(lat.toString());
      setManualStartLon(lng.toString());
      
      // Add or update marker for selected start location
      if (startLocationMarker) {
        startLocationMarker.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'custom-start-marker',
            html: `
              <div style="
                background-color: #10b981;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: white;
                  font-weight: bold;
                  font-size: 12px;
                ">S</div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
        }).addTo(mapRef.current);
        
        marker.bindTooltip('Start Location', {
          permanent: false,
          direction: 'top',
          offset: [0, -10]
        });
        
        setStartLocationMarker(marker);
      }
      
      // Turn off map selection mode
      setIsSelectingStartOnMap(false);
      setUseUserLocationAsStart(false);
    };

    mapRef.current.on('click', handleMapClick);

    // Change cursor to crosshair when selecting
    mapRef.current.getContainer().style.cursor = 'crosshair';

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
        mapRef.current.getContainer().style.cursor = '';
      }
    };
  }, [isSelectingStartOnMap, startLocationMarker, L, setManualStartLat, setManualStartLon]); // Added dependencies


  // Enhanced icon function with specific icons for each facility type
  const getFacilityIcon = (facility: Facility, isSelected: boolean, isOccupied: boolean) => {
    if (!L) return null;

    let color = '#6b7280'; 
    let iconSvg = '';
    
    // Get category color
    const category = getFacilityCategory(facility.class);
    switch (category) {
      case 'play-explore': color = '#B05ECC'; break;
      case 'rest-relax': color = '#6A9BD8'; break;
      case 'nature-wellness': color = '#4CAF50'; break;
      case 'essentials': color = '#A1743B'; break;
      case 'active-life': color = '#00B4D8'; break;
      case 'eateries': color = '#F04E6D'; break;
    }
    
    if (isOccupied) color = '#ef4444';
    if (isSelected) color = '#3b82f6';

    // Get specific icon SVG based on facility class
    switch(facility.class) {
      case 'FITNESS AREA': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dumbbell-icon lucide-dumbbell"><path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/></svg>';
        break;
      case 'TOILET': // done
        iconSvg = '<g transform="scale(0.8) translate(3,3)"><path d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18"/><path d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/></g>';
        break;
      case 'PLAYGROUND': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-baby-icon lucide-baby"><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M15 12h.01"/><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/><path d="M9 12h.01"/></svg>';
        break;
      case 'BBQ PIT': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-beef-icon lucide-beef"><path d="M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3"/><path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1-2.29 7.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5"/><circle cx="12.5" cy="8.5" r="2.5"/></svg>';
        break;
      case 'SHELTER': // not there
        iconSvg = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
        break;
      case 'MULTIPURPOSE COURT': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volleyball-icon lucide-volleyball"><path d="M11.1 7.1a16.55 16.55 0 0 1 10.9 4"/><path d="M12 12a12.6 12.6 0 0 1-8.7 5"/><path d="M16.8 13.6a16.55 16.55 0 0 1-9 7.5"/><path d="M20.7 17a12.8 12.8 0 0 0-8.7-5 13.3 13.3 0 0 1 0-10"/><path d="M6.3 3.8a16.55 16.55 0 0 0 1.9 11.5"/><circle cx="12" cy="12" r="10"/></svg>';
        break;
      case 'DOG RUN': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dog-icon lucide-dog"><path d="M11.25 16.25h1.5L12 17z"/><path d="M16 14v.5"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/><path d="M8 14v.5"/><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/></svg>';
        break;
      case 'BICYCLE RENTAL SHOP': //done 
        iconSvg = '<g transform="scale(0.9) translate(1.2,1.2)"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M19 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 19l0 -4l-3 -3l5 -4l2 3l3 0" /><path d="M17 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></g>';
        break;
      case 'DRINKING FOUNTAIN': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-glass-water-icon lucide-glass-water"><path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z"/><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"/></svg>';
        break;
      case 'CAR-PARK': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-parking-icon lucide-circle-parking"><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>';
        break;
      case 'BENCH': // not here
        iconSvg = '<g transform="scale(0.8) translate(3,3)"><rect x="3" y="10" width="18" height="4"/><path d="M5 10V7m14 3V7"/></g>';
        break;
      case 'INFORMATION KIOSK': // not here
        iconSvg = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>';
        break;
      case 'NATURE PLAYGARDEN':
      case 'MAZE GARDEN': 
        iconSvg = '<g transform="scale(0.8) translate(3,3)"><path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/><path d="M12 9v6m0 0l3-3m-3 3l-3-3"/></g>';
        break;
      case 'MANGROVE BOARDWALK':
        iconSvg ='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-footprints-icon lucide-footprints"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></svg>';
        break;
      case 'LOOKOUT POINT':
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bird-icon lucide-bird"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>';
        break;
      case 'CAMPSITE':
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame-kindling-icon lucide-flame-kindling"><path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z"/><path d="m5 22 14-4"/><path d="m5 18 14 4"/></svg>';
        break;
      case 'ALLOTMENT GARDEN': // done
        iconSvg ='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sprout-icon lucide-sprout"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></svg>';
        break;
      case 'FOOT RELAX': // done
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-footprints-icon lucide-footprints"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></svg>';
        break;
      case 'MAPBOARD': // done 
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-check-icon lucide-map-pin-check"><path d="M19.43 12.935c.357-.967.57-1.955.57-2.935a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32.197 32.197 0 0 0 .813-.728"/><circle cx="12" cy="10" r="3"/><path d="m16 18 2 2 4-4"/></svg>'
        break;
      case 'NOTICEBOARD':
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-megaphone-icon lucide-megaphone"><path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"/><path d="M8 6v8"/></svg>';
        break;
      default:
        iconSvg = '<circle cx="12" cy="12" r="8"/>';
    }

    const htmlString = `
      <div style="
        background-color: ${color}; 
        width: 30px; 
        height: 30px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" 
             fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
    `;

    return L.divIcon({
      className: 'custom-facility-marker',
      html: htmlString,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // Get icon for restaurants
  const getRestaurantIcon = (restaurant: Restaurant, isSelected: boolean) => {
    if (!L) return null;

    const isRestaurantClosingSoon = isClosingSoon(restaurant);
    const color = isRestaurantClosingSoon ? '#ef4444' : (isSelected ? '#3b82f6' : '#ec4899');
    const animation = isRestaurantClosingSoon ? 'animation: pulse 2s infinite;' : '';

    const htmlString = `
      <div style="
        background-color: ${color}; 
        width: 30px; 
        height: 30px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        cursor: pointer;
        ${animation}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
          <path d="M7 2v20"/>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      </style>
    `;

    return L.divIcon({
      className: 'custom-restaurant-marker',
      html: htmlString,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };


const getKayakRentalIcon = (rental: KayakRental, isSelected: boolean) => {
  if (!L) return null;

  const isKayakClosingSoon = isKayakRentalClosingSoon(rental);
  const color = isKayakClosingSoon ? '#ef4444' : (isSelected ? '#3b82f6' : '#06b6d4');
  const animation = isKayakClosingSoon ? 'animation: pulse 2s infinite;' : '';

  const htmlString = `
    <div style="
      background-color: ${color}; 
      width: 30px; 
      height: 30px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      cursor: pointer;
      ${animation}
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sailboat-icon lucide-sailboat">
        <path d="M10 2v15"/>
        <path d="M7 22a4 4 0 0 1-4-4 1 1 0 0 1 1-1h16a1 1 0 0 1 1 1 4 4 0 0 1-4 4z"/>
        <path d="M9.159 2.46a1 1 0 0 1 1.521-.193l9.977 8.98A1 1 0 0 1 20 13H4a1 1 0 0 1-.824-1.567z"/>
      </svg>
    </div>
    <style>
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
    </style>
  `;

  return L.divIcon({
    className: 'custom-kayak-marker',
    html: htmlString,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};


  // Get icon for amenities along route
  const getAmenityIcon = (amenity: AmenityAlongRoute) => {
    if (!L) return null;

    let iconHtml = '';
    let bgColor = '#60a5fa';

    if (amenity.class === 'SHELTER') {
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
      bgColor = '#22c55e';
    } else if (amenity.class === 'TOILET') {
      iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" 
            width="24" height="24" viewBox="0 0 24 24" 
            fill="none" stroke="white" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round">
          <g transform="scale(0.8) translate(3,3)">
            <path d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18"/>
            <path d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/>
          </g>
        </svg>
      `;
      bgColor = '#a855f7';
    } 

    return L.divIcon({
      className: 'custom-amenity-marker',
      html: `
        <div style="
          background-color: ${bgColor};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
        ">
          ${iconHtml}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // Load facilities
  useEffect(() => {
    setIsLoading(true);

    fetch('/api/facilities')
      .then(res => res.json())
      .then((data) => {
        if (data?.type === 'FeatureCollection' && data.features) {
          const transformedFacilities = data.features.map((feature: any) => {
            const coords = feature?.geometry?.coordinates;
            const [lon, lat] = Array.isArray(coords?.[0]) ? coords[0] : (coords || []);
            return {
              objectid: feature?.properties?.objectid,
              class: feature?.properties?.class,
              additional_info: feature?.properties?.additional_info,
              name: feature?.properties?.name_left || feature?.properties?.class || '',
              lon,
              lat,
            };
          });
          setFacilities(transformedFacilities);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load facilities:', err);
        setIsLoading(false);
      });

    if (navigator.geolocation) {
      setIsUserLocationAvailable(true); 
      navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          // initialise with lat and lon  of user's current location if they are empty
          if (manualStartLat === '' && manualStartLon === '') { //
            setManualStartLat(position.coords.latitude.toFixed(6)); //
            setManualStartLon(position.coords.longitude.toFixed(6)); //
          }
        },
        (error) => {
        
          console.error('Geolocation error:', error.message);
          setUseUserLocationAsStart(false);
          setIsUserLocationAvailable(false); // Geolocation failed
          
          // debugs
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.log("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.log("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              console.log("The request to get user location timed out.");
              break;
            default:
              console.log("An unknown error occurred.");
              break;
          }
        },
        { enableHighAccuracy: true }
      );
    } else {
      setUseUserLocationAsStart(false);
      setIsUserLocationAvailable(false); // Geolocation not supported
    }

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 5 * 60 * 1000);

    return () => {
      clearInterval(weatherInterval);
    };
  }, [manualStartLat, manualStartLon]); // Added dependencies to useEffect

  // Clean up start location marker when component unmounts or location changes
  useEffect(() => {
    return () => {
      if (startLocationMarker && mapRef.current) {
        mapRef.current.removeLayer(startLocationMarker);
      }
    };
  }, [startLocationMarker]); //


  const calculateDistanceFromPark = useCallback((lat: number, lon: number): number => {
    const parkCenterLat = (PARK_BOUNDS.minLat + PARK_BOUNDS.maxLat) / 2;
    const parkCenterLon = (PARK_BOUNDS.minLon + PARK_BOUNDS.maxLon) / 2;

    if (lat >= PARK_BOUNDS.minLat && lat <= PARK_BOUNDS.maxLat &&
        lon >= PARK_BOUNDS.minLon && lon <= PARK_BOUNDS.maxLon) {
      return 0;
    }

    const R = 6371000;
    const dLat = (parkCenterLat - lat) * Math.PI / 180;
    const dLon = (parkCenterLon - lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos((userLocation?.lat !== undefined ? userLocation.lat : lat) * Math.PI / 180) * Math.cos(parkCenterLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, [PARK_BOUNDS, userLocation]);

  // Calculate distance between two points
  const calculateDistanceBetweenPoints = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  }, []);

  // Find nearby facilities of the same category
  const findNearbyFacilities = useCallback((targetFacility: Facility, maxDistance: number = 500) => {
    const targetCategory = getFacilityCategory(targetFacility.class);
    if (!targetCategory) return [];

    const nearby: (Facility & { distance: number })[] = [];

    facilities.forEach(facility => {
      // Skip the target facility itself
      if (facility.objectid === targetFacility.objectid) return;

      // Check if same category
      const facilityCategory = getFacilityCategory(facility.class);
      if (facilityCategory !== targetCategory) return;

      // Calculate distance
      const distance = calculateDistanceBetweenPoints(
        targetFacility.lat, 
        targetFacility.lon,
        facility.lat,
        facility.lon
      );

      if (distance <= maxDistance) {
        nearby.push({ ...facility, distance });
      }
    });

    // Sort by distance
    return nearby.sort((a, b) => a.distance - b.distance);
  }, [facilities, calculateDistanceBetweenPoints]);

  useEffect(() => {
    if (userLocation && useUserLocationAsStart && !hasInteractedWithFarFromParkModal) {
      const distance = calculateDistanceFromPark(userLocation.lat, userLocation.lon);
      setDistanceFromPark(distance);

      if (distance > 1000) {
        setShowFarFromParkModal(true);
      } else {
        setHasInteractedWithFarFromParkModal(false);
      }
    } else if (!userLocation || !useUserLocationAsStart) {
        setShowFarFromParkModal(false);
        setHasInteractedWithFarFromParkModal(false);
    }
  }, [userLocation, useUserLocationAsStart, calculateDistanceFromPark, hasInteractedWithFarFromParkModal]);

  // Update facility markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !L) return;

    markersRef.current.clearLayers();

    facilities.forEach(facility => {
      // Check if the facility's category is visible
      const category = getFacilityCategory(facility.class);
      
      if (!category || !visibleCategories.has(category)) {
        return; // Skip this facility if its category is not visible
      }

      const isSelected = selectedFacility?.objectid === facility.objectid;
      const isOccupied = isRecentlyOccupied(facility);

      if (!Number.isFinite(facility.lat) || !Number.isFinite(facility.lon)) return;
      const marker = L.marker([facility.lat, facility.lon], {
        icon: getFacilityIcon(facility, isSelected, isOccupied)
      });

      marker.on('click', () => {
        handleFacilityClick(facility);
      });

      marker.bindTooltip(`${facility.class}${facility.name ? `: ${facility.name}` : ''}`, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });

      markersRef.current!.addLayer(marker);
    });
  }, [facilities, selectedFacility, facilityReports, visibleCategories, L]);

  // Update restaurant markers
  useEffect(() => {
    if (!mapRef.current || !restaurantMarkersRef.current || !L) return;

    restaurantMarkersRef.current.clearLayers();

    // Only show restaurants if 'eateries' category is visible
    if (!visibleCategories.has('eateries')) {
      return;
    }

    restaurantData.forEach(restaurant => {
      const isSelected = selectedRestaurant?.id === restaurant.id;

      const marker = L.marker([restaurant.lat, restaurant.lon], {
        icon: getRestaurantIcon(restaurant, isSelected)
      });

      marker.on('click', () => {
        handleRestaurantClick(restaurant);
      });

      marker.bindTooltip(restaurant.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -15]
      });

      restaurantMarkersRef.current!.addLayer(marker);
    });
  }, [restaurantData, selectedRestaurant, visibleCategories, L]);

  // Update kayak rental markers
  useEffect(() => {
    if (!mapRef.current || !kayakMarkersRef.current || !L) return;

    kayakMarkersRef.current.clearLayers();
    if (!visibleCategories.has('active-life')) {
      return;
    }

    kayakRentalData.forEach(rental => {
      const isSelected = selectedKayakRental?.id === rental.id;

      const marker = L.marker([rental.lat, rental.lon], {
        icon: getKayakRentalIcon(rental, isSelected)
      });

      marker.on('click', () => {
        handleKayakRentalClick(rental);
      });

      marker.bindTooltip(rental.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -15]
      });

      kayakMarkersRef.current!.addLayer(marker);
    });
  }, [kayakRentalData, selectedKayakRental, visibleCategories, L]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation || !L) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
    } else {
      const userIconHtml = `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div><style>@keyframes pulse {0% { box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3); }50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0,0,0,0.3); }100% { box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3); }}</style>`;

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: userIconHtml,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        zIndexOffset: 1000
      }).addTo(mapRef.current);
    }
  }, [userLocation, L]);

  // Update route on map
  useEffect(() => {
    if (!mapRef.current || !L) return;

    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
    }
    if (amenityMarkersRef.current) {
      amenityMarkersRef.current.clearLayers();
    }

    if (route) {
      const routeCoordsLeaflet = route.coords.map(coord => [coord[1], coord[0]] as [number, number]);

      routeLayerRef.current = L.polyline(routeCoordsLeaflet, {
        color: routePreference === 'sheltered' ? '#22c55e' : '#3b82f6',
        weight: 5,
        opacity: 0.8,
      }).addTo(mapRef.current);

      const bounds = L.latLngBounds(routeCoordsLeaflet);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    if (routePreference === 'sheltered' && amenitiesAlongRoute.length > 0) {
      amenitiesAlongRoute.forEach(amenity => {
        const amenityMarker = L.marker([amenity.lat, amenity.lon], {
          icon: getAmenityIcon(amenity)
        });

        amenityMarker.bindTooltip(`${amenity.class}${amenity.name ? `: ${amenity.name}` : ''}`, {
          permanent: false,
          direction: 'top',
          offset: [0, -10]
        });

        amenityMarkersRef.current!.addLayer(amenityMarker);
      });
    }
  }, [route, amenitiesAlongRoute, routePreference, L]);

  const fetchWeather = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/v1/weather/now`);
      const data = await res.json();
      setWeatherData(data);

      const forecast = data?.data?.records?.[0]?.general?.forecast;
      const temperature = data?.data?.records?.[0]?.general?.temperature;

      if (forecast.code === 'TL' || forecast.code === 'RA' || (temperature && temperature.high >= 32)) {
        setShowWeatherAlert(true);
      } else {
        setShowWeatherAlert(false);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  // Check weather conditions when route preference is 'fastest' and suggest sheltered
  const checkWeatherForRoute = () => {
    if (!weatherData || routePreference !== 'fastest') return;

    const forecast = weatherData?.data?.records?.[0]?.general?.forecast;
    const temperature = weatherData?.data?.records?.[0]?.general?.temperature;

    // Weather codes: TL = Thunderstorm, RA = Rain, SH = Showers, DR = Drizzle
    const rainyCodes = ['TL', 'RA', 'SH', 'DR', 'TS']; // TS = Thunderstorm too
    
    if (forecast && rainyCodes.includes(forecast.code)) {
      setWeatherCondition('rain');
      setShowWeatherRouteModal(true);
    } else if (temperature && temperature.high > 30) {
      setWeatherCondition('hot');
      setShowWeatherRouteModal(true);
    }
  };

  // Update the calculateRoute function to use selectedStartLocation if available
  const calculateRoute = useCallback(async (endLat: number, endLon: number) => {
    let startLat: number | null = null;
    let startLon: number | null = null;

    if (useUserLocationAsStart && userLocation) {
      startLat = userLocation.lat;
      startLon = userLocation.lon;
    } else if (selectedStartLocation) {
      // Use the selected start location (from map click or facility)
      startLat = selectedStartLocation.lat;
      startLon = selectedStartLocation.lon;
    } else if (manualStartLat && manualStartLon) {
      startLat = parseFloat(manualStartLat);
      startLon = parseFloat(manualStartLon);
    }

    if (startLat === null || startLon === null || isNaN(startLat) || isNaN(startLon)) {
      alert('Please provide a valid start location by selecting on map, choosing a facility, or entering coordinates.');
      return;
    }

    // Check weather conditions when starting a new route
    checkWeatherForRoute();

    // Check if navigating to a facility and find nearby similar ones
    const targetFacility = facilities.find(f => f.lat === endLat && f.lon === endLon);
    if (targetFacility) {
      setNavigatingToFacility(targetFacility);
      const nearby = findNearbyFacilities(targetFacility);
      if (nearby.length > 0) {
        setNearbyFacilities(nearby);
        setShowNearbyFacilitiesModal(true);
      }
    }

    try {
      const response = await fetch(
        `/api/route?start_lat=${startLat}&start_lon=${startLon}&end_lat=${endLat}&end_lon=${endLon}&prefer_shelter=${routePreference === 'sheltered'}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Route calculation failed: ${errorData.error || 'Unknown error'}`);
      }

      const routeData: BackendRouteResponse = await response.json();

      if (routeData?.type === 'FeatureCollection' && routeData.features?.[0]) {
        const feature = routeData.features[0];
        const coords = feature.geometry.coordinates;

        setRoute({
          total_distance_meters: feature.properties.total_distance_meters,
          total_duration_seconds: feature.properties.total_duration_seconds,
          segments: feature.properties.segments,
          coords: coords
        });

        setAmenitiesAlongRoute(routeData.amenities_along_route || []);
        setExternalRoute(null);

      } else {
        throw new Error('Unexpected route data format.');
      }

    } catch (error) {
      console.error('Route calculation error:', error);
      if (error instanceof Error) {
          alert(`Unable to calculate route: ${error.message}`);
      }
    }
  }, [useUserLocationAsStart, userLocation, selectedStartLocation, manualStartLat, manualStartLon, routePreference, facilities, findNearbyFacilities, checkWeatherForRoute]); //

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    setSelectedRestaurant(null);
    setSelectedKayakRental(null);
    setAvailabilityModalFacility(facility);
    setShowAvailabilityModal(true);
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedFacility(null);
    setSelectedKayakRental(null);
    calculateRoute(restaurant.lat, restaurant.lon);
    mapRef.current?.setView([restaurant.lat, restaurant.lon], 18);
  };

  const handleBicycleRentalClick = (rental: BicycleRental) => {
    setSelectedRestaurant(null);
    setSelectedFacility(null);
    setSelectedKayakRental(null);
    calculateRoute(rental.lat, rental.lon);
    mapRef.current?.setView([rental.lat, rental.lon], 18);
  };

  const handleKayakRentalClick = (rental: KayakRental) => {
    setSelectedKayakRental(rental);
    setSelectedRestaurant(null);
    setSelectedFacility(null);
    calculateRoute(rental.lat, rental.lon);
    mapRef.current?.setView([rental.lat, rental.lon], 18);
  };

  const isRecentlyOccupied = (facility: Facility) => {
    const reportKey = `${facility.class}_${facility.objectid}`;
    const report = facilityReports[reportKey];
    return !!(report && Date.now() - report.timestamp < 30 * 60 * 1000);
  };

  const reportFacilityStatus = (facility: Facility, isOccupied: boolean) => {
    const reportKey = `${facility.class}_${facility.objectid}`;
    if (isOccupied) {
      setFacilityReports({
        ...facilityReports,
        [reportKey]: { timestamp: Date.now(), occupied: true }
      });
    } else {
      const newReports = { ...facilityReports };
      delete newReports[reportKey];
      setFacilityReports(newReports);
    }
  };

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lon], 18);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (minutes > 0) {
      return `${minutes} min ${remainingSeconds} sec`;
    }
    return `${remainingSeconds} sec`;
  };

  const handleNavigateToMRT = async (navigationData: any) => {
    setShowFarFromParkModal(false);
    setHasInteractedWithFarFromParkModal(true);
    
    // Navigate to the closest MRT exit that leads to the park
    // MRT exits near Pasir Ris Park
    const parkMRTExit = {
      lat: 1.3733,  // Pasir Ris MRT Exit B
      lon: 103.9493,
      name: 'Pasir Ris MRT Exit B'
    };
    
    // Calculate route from user location to MRT exit
    if (userLocation) {
      try {
        // First show route to MRT
        const response = await fetch(
          `/api/route?start_lat=${userLocation.lat}&start_lon=${userLocation.lon}&end_lat=${parkMRTExit.lat}&end_lon=${parkMRTExit.lon}&prefer_shelter=false`
        );
        
        if (response.ok) {
          const routeData = await response.json();
          
          if (routeData?.type === 'FeatureCollection' && routeData.features?.[0]) {
            const feature = routeData.features[0];
            const coords = feature.geometry.coordinates;
            
            setExternalRoute({
              total_distance_meters: feature.properties.total_distance_meters,
              total_duration_seconds: feature.properties.total_duration_seconds,
              segments: feature.properties.segments,
              coords: coords,
              type: 'mrt',
              destination: parkMRTExit.name
            });
            
            setRoute(null); // Clear any existing route
            
            // Update route layer on map
            if (mapRef.current && L) {
              if (routeLayerRef.current) {
                mapRef.current.removeLayer(routeLayerRef.current);
                routeLayerRef.current = null;
              }
              
              const routeCoordsLeaflet = coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
              
              routeLayerRef.current = L.polyline(routeCoordsLeaflet, {
                color: '#9333ea', // Purple for external routes
                weight: 5,
                opacity: 0.8,
                dashArray: '10, 10' // Dashed line for external routes
              }).addTo(mapRef.current);
              
              const bounds = L.latLngBounds(routeCoordsLeaflet);
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
        alert('Unable to calculate route to MRT');
      }
    }
  };

  const handleNavigateToCarpark = async (navigationData: any) => {
    setShowFarFromParkModal(false);
    setHasInteractedWithFarFromParkModal(true);
    
    // Navigate to the nearest carpark
    // Using the carpark data from the API response
    if (userLocation) {
      try {
        // Fetch nearest carpark
        const carparkRes = await fetch(
          `/api/parking/carparks/availability?user_lat=${userLocation.lat}&user_lon=${userLocation.lon}&limit=1`
        );
        
        if (carparkRes.ok) {
          const carparkData = await carparkRes.json();
          if (carparkData.carparks && carparkData.carparks.length > 0) {
            const nearestCarpark = carparkData.carparks[0];
            
            // Calculate route to carpark
            const response = await fetch(
              `/api/route?start_lat=${userLocation.lat}&start_lon=${userLocation.lon}&end_lat=${nearestCarpark.lat}&end_lon=${nearestCarpark.lon}&prefer_shelter=false`
            );
            
            if (response.ok) {
              const routeData = await response.json();
              
              if (routeData?.type === 'FeatureCollection' && routeData.features?.[0]) {
                const feature = routeData.features[0];
                const coords = feature.geometry.coordinates;
                
                setExternalRoute({
                  total_distance_meters: feature.properties.total_distance_meters,
                  total_duration_seconds: feature.properties.total_duration_seconds,
                  segments: feature.properties.segments,
                  coords: coords,
                  type: 'carpark',
                  destination: nearestCarpark.development,
                  availableSpots: nearestCarpark.total_available
                });
                
                setRoute(null); // Clear any existing route
                
                // Update route layer on map
                if (mapRef.current && L) {
                  if (routeLayerRef.current) {
                    mapRef.current.removeLayer(routeLayerRef.current);
                  }
                  
                  const routeCoordsLeaflet = coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                  
                  routeLayerRef.current = L.polyline(routeCoordsLeaflet, {
                    color: '#9333ea', 
                    weight: 5,
                    opacity: 0.8,
                    dashArray: '10, 10' 
                  }).addTo(mapRef.current);
                  
                  const bounds = L.latLngBounds(routeCoordsLeaflet);
                  mapRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
        alert('Unable to calculate route to carpark');
      }
    }
  };

  const handleCloseFarFromParkModal = () => {
    setShowFarFromParkModal(false);
    setHasInteractedWithFarFromParkModal(true);
  };

  const handleWeatherRouteSuggestion = () => {
    setRoutePreference('sheltered');
    setShowWeatherRouteModal(false);
    // Recalculate current route with sheltered preference if there's an active route
    if (route && navigatingToFacility) {
      calculateRoute(navigatingToFacility.lat, navigatingToFacility.lon);
    }
  };

  const handleAddMultipleFacilitiesToRoute = async (additionalFacilities: Facility[]) => {
    // This would require backend support for multi-stop routing - no time to implement will do later (03.09 deadline?)
    if (additionalFacilities.length > 0) {
      alert('Multi-stop routing coming soon! For now, navigating to the first facility.');
      calculateRoute(additionalFacilities[0].lat, additionalFacilities[0].lon);
    }
  };

  // Add visual feedback when in selection mode
  {isSelectingStartOnMap && (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[999] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
      <p className="text-sm font-medium">Click anywhere on the map to set start location</p>
    </div>
  )}

  return (
    <div className="relative h-screen w-full bg-gray-50 overflow-hidden">
      {/* Map Header */}
      <MapHeader
        isMenuOpen={isSearchOpen}
        onMenuToggle={() => setIsSearchOpen(!isSearchOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyAvailable={showOnlyAvailable}
        onShowOnlyAvailableChange={setShowOnlyAvailable}
        visibleCategories={visibleCategories}
        onVisibleCategoriesChange={setVisibleCategories}
      />

      {/* Route Preference Toggle */}
      <RoutePreferenceToggle
        routePreference={routePreference}
        onRoutePreferenceChange={setRoutePreference}
      />

      {/* Search Panel */}
      <SearchPanel
        facilities={facilities}
        userLocation={userLocation}
        selectedFacility={selectedFacility}
        isOpen={isSearchOpen}
        searchQuery={searchQuery}
        showOnlyAvailable={showOnlyAvailable}
        visibleCategories={visibleCategories}
        onFacilityClick={handleFacilityClick}
        // onRestaurantClick={handleRestaurantClick}
        // onBicycleRentalClick={handleBicycleRentalClick}
        // onKayakRentalClick={handleKayakRentalClick}
        facilityReports={facilityReports}
      />

      {/* Restaurant Closing Alert - positioned below header */}
      <RestaurantClosingAlert onNavigate={handleRestaurantClick} />

      {/* Route Info */}
      {(route || externalRoute) && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-[997] bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">
              {externalRoute ? `Route to ${externalRoute.destination}` : 'Route Information'}
            </h4>
            <button
              onClick={() => { 
                setRoute(null); 
                setAmenitiesAlongRoute([]); 
                setExternalRoute(null);
                if (routeLayerRef.current && mapRef.current) {
                  mapRef.current.removeLayer(routeLayerRef.current);
                  routeLayerRef.current = null;
                }
              }}
              className="text-gray-800 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          {(route || externalRoute) && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-800">Distance:</span>
                <span className="font-medium">
                  {((route?.total_distance_meters || externalRoute?.total_distance_meters) / 1000).toFixed(2)} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800">Est. Time:</span>
                <span className="font-medium">
                  {formatDuration(route?.total_duration_seconds || externalRoute?.total_duration_seconds)}
                </span>
              </div>
              {routePreference === 'sheltered' && amenitiesAlongRoute.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-800">Amenities:</span>
                  <span className="font-medium">{amenitiesAlongRoute.length} along route</span>
                </div>
              )}
              {externalRoute?.type === 'carpark' && externalRoute.availableSpots !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-800">Available spots:</span>
                  <span className="font-medium text-green-600">{externalRoute.availableSpots}</span>
                </div>
              )}
              {externalRoute && (
                <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                  <p>External route to {externalRoute.type === 'mrt' ? 'MRT station' : 'carpark'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 top-16 bottom-8" />

      {/* Map Controls */}
      <div className="absolute bottom-4 right-4 z-[996] flex flex-col gap-2">
        {userLocation && (
          <button
            onClick={centerOnUser}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
            title="Center on my location"
          >
            <LocateFixed size={20} />
          </button>
        )}
      </div>

      {/* Start Location Input */}
      <StartLocationInput
        useUserLocationAsStart={useUserLocationAsStart}
        onToggleUserLocation={setUseUserLocationAsStart}
        manualStartLat={manualStartLat}
        onManualLatChange={setManualStartLat}
        manualStartLon={manualStartLon}
        onManualLonChange={setManualStartLon}
        isUserLocationAvailable={isUserLocationAvailable}
        // New props for map selection
        isSelectingOnMap={isSelectingStartOnMap}
        onToggleMapSelection={setIsSelectingStartOnMap}
        selectedStartLocation={selectedStartLocation}
        onStartLocationSelect={setSelectedStartLocation}
        facilities={facilities} // This prop is passed but not used in StartLocationInput.tsx currently
      />

      {/* Legend */}
      <Legend />

      {/* Facility Availability Modal */}
      <FacilityAvailabilityModal
        facility={availabilityModalFacility}
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        onNavigate={(facility) => {
          calculateRoute(facility.lat, facility.lon);
          mapRef.current?.setView([facility.lat, facility.lon], 18);
        }}
        onReportStatus={reportFacilityStatus}
        isOccupied={availabilityModalFacility ? isRecentlyOccupied(availabilityModalFacility) : false}
        lastReportTime={
          availabilityModalFacility
            ? facilityReports[`${availabilityModalFacility.class}_${availabilityModalFacility.objectid}`]?.timestamp
            : undefined
        }
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1001]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading park data...</p>
          </div>
        </div>
      )}

      {/* FarFromParkModal */}
      {showFarFromParkModal && userLocation && distanceFromPark !== null && (
        <FarFromParkModal
          isOpen={showFarFromParkModal}
          onClose={handleCloseFarFromParkModal}
          distance={distanceFromPark}
          userLocation={userLocation}
          onNavigateToMRT={handleNavigateToMRT}
          onNavigateToCarpark={handleNavigateToCarpark}
        />
      )}

      {/* Weather Route Suggestion Modal */}
      {showWeatherRouteModal && weatherCondition && weatherData && (
        <WeatherRouteModal
          isOpen={showWeatherRouteModal}
          onClose={() => setShowWeatherRouteModal(false)}
          onAcceptSuggestion={handleWeatherRouteSuggestion}
          weatherCondition={weatherCondition}
          currentTemp={weatherData?.data?.records?.[0]?.general?.temperature?.high}
          forecast={weatherData?.data?.records?.[0]?.general?.forecast?.text}
        />
      )}

      {/* Nearby Facilities Modal */}
      <NearbyFacilitiesModal
        isOpen={showNearbyFacilitiesModal}
        onClose={() => setShowNearbyFacilitiesModal(false)}
        targetFacility={navigatingToFacility}
        nearbyFacilities={nearbyFacilities}
        onNavigateToFacility={(facility) => {
          calculateRoute(facility.lat, facility.lon);
          mapRef.current?.setView([facility.lat, facility.lon], 18);
          setShowNearbyFacilitiesModal(false);
        }}
        onAddToRoute={handleAddMultipleFacilitiesToRoute}
      />
    </div>
  );
};

export default ParkMap;

