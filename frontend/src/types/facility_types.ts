export interface Facility {
  objectid: number;
  class: string;
  additional_info?: string;
  name?: string;
  lat: number;
  lon: number;
  facility_type?: string;
  phone?: string;
  hours?: {
    open: string;
    close: string;
  };
  price_range?: string;
  price_info?: string;
  rating?: number;
  review_count?: number;
  cuisine?: string;
  website?: string;
  activities?: string[];
  service_options?: string[];
  reservation_links?: string[];
  order_links?: string[];
  address?: string;
}
export interface WeatherData {
  data: {
    records: Array<{
      general: {
        temperature: {
          high: number;
          low: number;
        };
        forecast: {
          code: string;
          text: string;
        };
      };
    }>;
  };
}

export interface Route {
  total_distance_meters: number;
  total_duration_seconds: number;
  segments: number;
  coords: Array<[number, number]>; 
}

export interface AmenityAlongRoute {
  objectid: number;
  class: string;
  name: string;
  lat: number;
  lon: number;
}

export interface BackendRouteResponse {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: Array<[number, number]>;
    };
    properties: {
      total_distance_meters: number;
      total_duration_seconds: number;
      segments: number;
    };
  }>;
  amenities_along_route: AmenityAlongRoute[]; 
}

export interface UserLocation {
  lat: number;
  lon: number;
}