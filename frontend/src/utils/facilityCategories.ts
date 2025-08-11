import {
  Megaphone, MapPinCheck, CircleParkingIcon, GlassWater, Volleyball, Footprints,
  Bird, Sprout, FlameKindlingIcon, Beef, Dumbbell, Baby, Coffee, Toilet,
  Utensils, Bike, Info, Home, Mountain, LucideIcon
} from 'lucide-react';

export interface FacilityCategory {
  name: string;
  icon: LucideIcon;
  color: string;
  facilities: string[];
}

export const facilityCategories: Record<string, FacilityCategory> = {
  'play-explore': {
    name: 'Play & Explore',
    icon: Baby,
    color: '#B05ECC',
    facilities: ['PLAYGROUND']
    // Removed: 'NATURE PLAYGARDEN', 'MAZE GARDEN', 'DOG RUN'
  },
  'rest-relax': {
    name: 'Rest & Relax',
    icon: Home,
    color: '#6A9BD8',
    facilities: ['SHELTER', 'BBQ PIT', 'CAMPSITE', 'FOOT RELAX']
    //'BENCH', 'PAVILION'
  },
  'nature-wellness': {
    name: 'Nature & Wellness',
    icon: Sprout,
    color: '#4CAF50',
    facilities: ['BIRD WATCHING TOWER', 'LOOKOUT POINT', 'ALLOTMENT GARDEN']
    // 'MANGROVE BOARDWALK', 'THERAPEUTIC GARDEN', 'POND', 'BEACH'
  },
  'essentials': {
    name: 'Essentials',
    icon: Info,
    color: '#A1743B',
    facilities: ['TOILET', 'DRINKING FOUNTAIN', 'CAR-PARK', 'INFORMATION KIOSK', 'MAPBOARD']
  },
  'active-life': {
    name: 'Active Life',
    icon: Dumbbell,
    color: '#00B4D8',
    facilities: ['FITNESS AREA', 'MULTIPURPOSE COURT']
    // 'VOLLEYBALL COURT', 'BICYCLE RENTAL SHOP', 'FOOTPATH', 'LINK BRIDGE', 'BICYCLE PARKING'
  },
  'eateries': {
    name: 'Eateries',
    icon: Utensils,
    color: '#F04E6D',
    facilities: ['FOOD & BEVERAGE', 'RESTAURANT']
  }
};

export const getFacilityCategory = (facilityClass: string): string | null => {
  for (const [key, category] of Object.entries(facilityCategories)) {
    if (category.facilities.includes(facilityClass)) {
      return key;
    }
  }
  return null;
};

export const getFacilityIcon = (facilityClass: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    'PLAYGROUND': Baby,
    'BBQ PIT': Beef,
    'SHELTER': Home,
    'TOILET': Toilet,
    'FITNESS AREA': Dumbbell,
    // 'DOG RUN': Dog,
    // 'VOLLEYBALL COURT': Mountain, 
    'CAR-PARK': CircleParkingIcon,
    // 'BICYCLE RENTAL SHOP': Bike,
    'FOOD & BEVERAGE': Coffee,
    // 'KAYAK RENTAL': Users,
    'RESTAURANT': Utensils,
    'DRINKING FOUNTAIN': GlassWater,
    'INFORMATION KIOSK': Info,
    // 'BENCH': Umbrella,
    'CAMPSITE': FlameKindlingIcon,
    // 'NATURE PLAYGARDEN': Trees,
    // 'MAZE GARDEN': Navigation,
    // 'MANGROVE BOARDWALK': Footprints,
    'BIRD WATCHING TOWER': Bird,
    // 'THERAPEUTIC GARDEN': Sparkles,
    // 'BICYCLE PARKING': Bike,
    // 'FOOTPATH': Navigation,
    // 'LINK BRIDGE': Navigation,
    // 'SIGN BOARD': Info,
    // 'PAVILION': Home,
    // 'POND': Waves,
    // 'BEACH': Waves,
    'NOTICEBOARD': Megaphone,
    'MAPBOARD': MapPinCheck,
    'LOOKOUT POINT': Mountain,
    'FOOT RELAX': Footprints,
    'MULTIPURPOSE COURT': Volleyball,
    'ALLOTMENT GARDEN': Sprout, 
  };

  return iconMap[facilityClass] || Info;
};
